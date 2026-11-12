#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::{json, Value};
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

const DATA_FILE: &str = "daftar-data.json";

struct LastBackup(Mutex<String>);

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let d = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&d).map_err(|e| e.to_string())?;
    Ok(d)
}

fn today() -> String {
    // days since epoch -> YYYY-MM-DD (UTC is fine for backup naming)
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0) as i64;
    let z = secs / 86400 + 719468;
    let era = z.div_euclid(146097);
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + if m <= 2 { 1 } else { 0 };
    format!("{y:04}-{m:02}-{d:02}")
}

#[tauri::command]
fn load_data(app: AppHandle) -> Result<Option<Value>, String> {
    let file = data_dir(&app)?.join(DATA_FILE);
    let mut candidates = vec![file.clone()];
    // one-time migration from the Electron version (%APPDATA%\Daftar)
    if let Ok(roaming) = app.path().data_dir() {
        candidates.push(roaming.join("Daftar").join(DATA_FILE));
    }
    for (i, p) in candidates.iter().enumerate() {
        if let Ok(text) = fs::read_to_string(p) {
            match serde_json::from_str::<Value>(&text) {
                Ok(v) => {
                    if i > 0 {
                        let _ = fs::write(&file, &text);
                    }
                    return Ok(Some(v));
                }
                Err(_) if i == 0 => {
                    let _ = fs::copy(p, p.with_extension("json.corrupt"));
                }
                Err(_) => {}
            }
        }
    }
    Ok(None)
}

#[tauri::command]
fn save_data(app: AppHandle, data: Value, last: State<LastBackup>) -> Result<bool, String> {
    let dir = data_dir(&app)?;
    let file = dir.join(DATA_FILE);
    let tmp = dir.join("daftar-data.json.tmp");
    fs::write(&tmp, serde_json::to_string(&data).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    fs::rename(&tmp, &file).map_err(|e| e.to_string())?;

    // one automatic backup per day, keep the latest 14
    let day = today();
    let mut lb = last.0.lock().unwrap();
    if *lb != day {
        *lb = day.clone();
        let bdir = dir.join("backups");
        if fs::create_dir_all(&bdir).is_ok() {
            let _ = fs::copy(&file, bdir.join(format!("backup-{day}.json")));
            if let Ok(rd) = fs::read_dir(&bdir) {
                let mut names: Vec<PathBuf> = rd
                    .filter_map(|e| e.ok().map(|e| e.path()))
                    .filter(|p| p.file_name().map_or(false, |n| n.to_string_lossy().starts_with("backup-")))
                    .collect();
                names.sort();
                let extra = names.len().saturating_sub(14);
                for p in names.into_iter().take(extra) {
                    let _ = fs::remove_file(p);
                }
            }
        }
    }
    Ok(true)
}

#[tauri::command]
async fn export_file(app: AppHandle, content: String, default_name: String, kind: String) -> Result<Value, String> {
    let mut dlg = app.dialog().file().set_title("ذخیره خروجی").set_file_name(&default_name);
    dlg = if kind == "csv" {
        dlg.add_filter("CSV (Excel)", &["csv"])
    } else {
        dlg.add_filter("JSON", &["json"])
    };
    if let Ok(docs) = app.path().document_dir() {
        dlg = dlg.set_directory(docs);
    }
    match dlg.blocking_save_file() {
        Some(fp) => {
            let path = fp.into_path().map_err(|e| e.to_string())?;
            fs::write(&path, content).map_err(|e| e.to_string())?;
            Ok(json!({ "ok": true, "filePath": path.to_string_lossy() }))
        }
        None => Ok(json!({ "ok": false })),
    }
}

#[tauri::command]
async fn import_file(app: AppHandle) -> Result<Value, String> {
    let picked = app
        .dialog()
        .file()
        .set_title("انتخاب فایل برای ورود")
        .add_filter("JSON / CSV", &["json", "csv"])
        .blocking_pick_file();
    let Some(fp) = picked else { return Ok(json!({ "ok": false })) };
    let path = fp.into_path().map_err(|e| e.to_string())?;
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let content = String::from_utf8_lossy(&bytes).to_string();
    let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let ext = path
        .extension()
        .map(|e| format!(".{}", e.to_string_lossy().to_lowercase()))
        .unwrap_or_default();
    Ok(json!({ "ok": true, "name": name, "ext": ext, "content": content }))
}

#[tauri::command]
fn open_data_folder(app: AppHandle) -> Result<(), String> {
    let dir = data_dir(&app)?;
    app.opener()
        .open_path(dir.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(LastBackup(Mutex::new(String::new())))
        .invoke_handler(tauri::generate_handler![load_data, save_data, export_file, import_file, open_data_folder])
        .run(tauri::generate_context!())
        .expect("error while running Daftar");
}
