// Connects the UI to the Tauri backend (same interface the Electron preload exposed)
(function () {
  const T = window.__TAURI__;
  if (!T || !T.core) return; // running in a plain browser -> app.js falls back to localStorage
  const invoke = T.core.invoke;
  window.api = {
    load: () => invoke('load_data'),
    save: (data) => invoke('save_data', { data }),
    exportFile: ({ content, defaultName, kind }) => invoke('export_file', { content, defaultName, kind }),
    importFile: () => invoke('import_file'),
    openDataFolder: () => invoke('open_data_folder'),
  };
})();
