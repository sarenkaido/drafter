/* دفتر دخل و خرج — renderer */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const api = window.api || { // browser fallback (for previewing outside Electron)
    load: async () => JSON.parse(localStorage.getItem('daftar') || 'null'),
    save: async d => localStorage.setItem('daftar', JSON.stringify(d)),
    exportFile: async ({ content, defaultName }) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([content])); a.download = defaultName; a.click();
      return { ok: true, filePath: defaultName };
    },
    importFile: () => new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,.csv';
      i.onchange = async () => { const f = i.files[0]; if (!f) return res({ ok: false }); res({ ok: true, name: f.name, ext: '.' + f.name.split('.').pop().toLowerCase(), content: await f.text() }); };
      i.click();
    }),
    openDataFolder: async () => {},
  };

  // ---------- helpers ----------
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const fa = s => String(s).replace(/\d/g, d => FA[d]);
  const toEn = s => String(s).replace(/[۰-۹]/g, c => FA.indexOf(c)).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c));
  const nf = new Intl.NumberFormat('fa-IR');
  const num = n => nf.format(Math.round(n));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const unit = () => state.data.settings.currency;
  const money = (n, withUnit = true) => num(n) + (withUnit && unit() ? ' ' + unit() : '');
  const moneyHTML = n => `${num(n)}${unit() ? `<small>${unit()}</small>` : ''}`;
  const compact = n => {
    const a = Math.abs(n);
    if (a >= 1e9) return fa(+(n / 1e9).toFixed(1)) + ' میلیارد';
    if (a >= 1e6) return fa(+(n / 1e6).toFixed(1)) + ' م';
    if (a >= 1e3) return fa(+(n / 1e3).toFixed(0)) + ' هـ';
    return fa(Math.round(n));
  };

  function words(n) {
    n = Math.floor(n);
    if (!n) return '';
    const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'هزار میلیارد'];
    const three = x => {
      const p = [];
      const h = Math.floor(x / 100), r = x % 100;
      if (h) p.push(hundreds[h]);
      if (r >= 10 && r < 20) p.push(teens[r - 10]);
      else { if (Math.floor(r / 10)) p.push(tens[Math.floor(r / 10)]); if (r % 10) p.push(ones[r % 10]); }
      return p.join(' و ');
    };
    const parts = []; let i = 0;
    while (n > 0 && i < scales.length) {
      const c = n % 1000;
      if (c) parts.unshift(three(c) + (scales[i] ? ' ' + scales[i] : ''));
      n = Math.floor(n / 1000); i++;
    }
    return parts.join(' و ');
  }

  // ---------- default data ----------
  const PALETTE = ['#ff5d7a', '#ff8a4c', '#ffb547', '#f5d547', '#9be15d', '#2fd189', '#1ec8b0', '#2ec5e8', '#5b9dff', '#7c6cff', '#b26cff', '#ef6cd5', '#a3a9b8'];
  const EMOJIS = ['🛒', '🍔', '☕', '🚕', '⛽', '🚗', '💡', '🏠', '💊', '👕', '🎬', '📚', '📱', '🎁', '💳', '✈️', '🏋️', '🐾', '👶', '💇', '🔧', '🧾', '🎮', '🍎', '🏦', '💼', '💻', '📈', '🛍️', '💰', '🪙', '🏆', '🤝', '🎓', '🧹', '🚌', '🍕', '🎵', '❤️', '✨'];
  const defaultData = () => {
    const c = (name, type, icon, color) => ({ id: uid(), name, type, icon, color });
    return {
      version: 1,
      settings: { currency: 'تومان', theme: 'dark' },
      categories: [
        c('خوراک و خواربار', 'expense', '🛒', '#2fd189'),
        c('رستوران و کافه', 'expense', '🍔', '#ff8a4c'),
        c('حمل‌ونقل', 'expense', '🚕', '#f5d547'),
        c('سوخت و خودرو', 'expense', '⛽', '#ffb547'),
        c('قبوض', 'expense', '💡', '#2ec5e8'),
        c('اجاره و مسکن', 'expense', '🏠', '#5b9dff'),
        c('سلامت و درمان', 'expense', '💊', '#ff5d7a'),
        c('پوشاک', 'expense', '👕', '#ef6cd5'),
        c('تفریح', 'expense', '🎬', '#b26cff'),
        c('آموزش', 'expense', '📚', '#1ec8b0'),
        c('اینترنت و موبایل', 'expense', '📱', '#7c6cff'),
        c('اقساط و وام', 'expense', '💳', '#9be15d'),
        c('هدیه', 'expense', '🎁', '#ff8a4c'),
        c('سایر', 'expense', '✨', '#a3a9b8'),
        c('حقوق', 'income', '💼', '#2fd189'),
        c('پروژه و فریلنس', 'income', '💻', '#5b9dff'),
        c('فروش', 'income', '🛍️', '#ffb547'),
        c('سود و سرمایه‌گذاری', 'income', '📈', '#7c6cff'),
        c('هدیه', 'income', '🎁', '#ef6cd5'),
        c('سایر', 'income', '✨', '#a3a9b8'),
      ],
      transactions: [],
    };
  };

  // ---------- state ----------
  const today = J.toJ(J.todayISO());
  const state = {
    data: null,
    view: 'dashboard',
    month: { jy: today.jy, jm: today.jm },
    year: today.jy,
    filter: { q: '', type: 'all', cat: '', all: false },
  };
  let saveTimer;
  const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => api.save(state.data), 150); };
  const catById = id => state.data.categories.find(c => c.id === id) || { name: 'بدون دسته', icon: '❔', color: '#a3a9b8', type: 'expense' };

  const inMonth = (t, jy, jm) => { const j = J.toJ(t.date); return j.jy === jy && j.jm === jm; };
  const monthTx = (jy = state.month.jy, jm = state.month.jm) => state.data.transactions.filter(t => inMonth(t, jy, jm));
  const sum = (arr, type) => arr.reduce((a, t) => a + (t.type === type ? t.amount : 0), 0);
  const sortTx = arr => arr.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));

  // ---------- toasts & confirm ----------
  function toast(msg, opts = {}) {
    const el = document.createElement('div');
    el.className = 'toast' + (opts.error ? ' err' : '');
    el.innerHTML = `<span class="ti">${opts.error ? '!' : '✓'}</span><span>${esc(msg)}</span>`;
    if (opts.action) {
      const b = document.createElement('button'); b.textContent = opts.action.label;
      b.onclick = () => { opts.action.fn(); close(); };
      el.appendChild(b);
    }
    $('#toasts').appendChild(el);
    const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); };
    setTimeout(close, opts.action ? 5000 : 2600);
  }
  function confirmBox(title, text, buttons) {
    return new Promise(res => {
      $('#cfTitle').textContent = title;
      $('#cfText').textContent = text;
      const box = $('#cfButtons'); box.innerHTML = '<div class="spacer"></div>';
      buttons.forEach(b => {
        const el = document.createElement('button');
        el.className = 'btn ' + (b.cls || 'soft'); el.textContent = b.label;
        el.onclick = () => { closeModal('#confirmModal'); res(b.value); };
        box.appendChild(el);
      });
      openModal('#confirmModal');
    });
  }
  function openModal(sel) { $(sel).classList.add('open'); }
  function closeModal(sel) { $(sel).classList.remove('open'); }
  $$('.overlay').forEach(o => {
    o.addEventListener('mousedown', e => { if (e.target === o) closeModal('#' + o.id); });
    o.querySelectorAll('[data-close]').forEach(b => b.onclick = () => closeModal('#' + o.id));
  });

  // ---------- navigation ----------
  const TITLES = { dashboard: 'داشبورد', transactions: 'تراکنش‌ها', categories: 'دسته‌بندی‌ها', reports: 'گزارش سالانه', settings: 'تنظیمات و پشتیبان' };
  function go(view) {
    state.view = view;
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    $('#pageTitle').textContent = TITLES[view];
    $('#monthNav').style.visibility = ['dashboard', 'transactions', 'categories'].includes(view) ? 'visible' : 'hidden';
    render();
  }
  $$('.nav-item').forEach(b => b.onclick = () => go(b.dataset.view));
  $$('[data-goto]').forEach(b => b.onclick = () => go(b.dataset.goto));

  function shiftMonth(d) {
    let { jy, jm } = state.month;
    jm += d; if (jm > 12) { jm = 1; jy++; } if (jm < 1) { jm = 12; jy--; }
    state.month = { jy, jm }; render();
  }
  $('#prevMonth').onclick = () => shiftMonth(-1);
  $('#nextMonth').onclick = () => shiftMonth(1);
  $('#monthLabel').onclick = () => { state.month = { jy: today.jy, jm: today.jm }; render(); };
  $('#prevYear').onclick = () => { state.year--; renderReports(); };
  $('#nextYear').onclick = () => { state.year++; renderReports(); };

  // ---------- theme ----------
  function applyTheme() { document.documentElement.dataset.theme = state.data.settings.theme; }
  $('#themeToggle').onclick = () => {
    state.data.settings.theme = state.data.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(); persist(); render();
  };

  // ---------- rendering ----------
  function render() {
    const { jy, jm } = state.month;
    $('#monthLabel').textContent = `${J.MONTHS[jm - 1]} ${fa(jy)}`;
    const all = state.data.transactions;
    const bal = sum(all, 'income') - sum(all, 'expense');
    $('#sideBalance').innerHTML = `<span class="${bal < 0 ? 'down' : ''}">${money(bal)}</span>`;
    const isCur = jy === today.jy && jm === today.jm;
    $('#pageSub').textContent = state.view === 'dashboard' || state.view === 'transactions'
      ? (isCur ? `امروز ${J.WEEKDAYS[J.weekday(J.todayISO())]} ${fa(today.jd)} ${J.MONTHS[today.jm - 1]}` : 'در حال مشاهده ماه گذشته/آینده — برای برگشت روی نام ماه کلیک کنید')
      : '';
    if (state.view === 'dashboard') renderDashboard();
    if (state.view === 'transactions') renderTransactions();
    if (state.view === 'categories') renderCategories();
    if (state.view === 'reports') renderReports();
    if (state.view === 'settings') renderSettings();
  }

  function txRow(t, showDate = true) {
    const c = catById(t.categoryId);
    return `<div class="tx" data-id="${t.id}">
      <div class="tx-ic" style="background:${c.color}22">${c.icon}</div>
      <div class="tx-main">
        <div class="tx-cat">${esc(c.name)}</div>
        <div class="tx-note">${esc(t.note) || '<span style="opacity:.5">بدون توضیح</span>'}</div>
      </div>
      ${showDate ? `<div class="tx-date">${fa(J.format(t.date))}</div>` : ''}
      <div class="tx-amt ${t.type}">${t.type === 'income' ? '+' : '−'}${num(t.amount)}</div>
      <div class="tx-actions">
        <button class="icon-btn" data-act="dup" title="تکرار برای امروز"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>
        <button class="icon-btn del" data-act="del" title="حذف"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>
      </div>
    </div>`;
  }
  function bindRows(root) {
    root.querySelectorAll('.tx').forEach(r => {
      r.onclick = e => {
        const id = r.dataset.id;
        const act = e.target.closest('[data-act]')?.dataset.act;
        const t = state.data.transactions.find(x => x.id === id);
        if (act === 'del') return deleteTx(id);
        if (act === 'dup') {
          state.data.transactions.push({ ...t, id: uid(), date: J.todayISO(), createdAt: Date.now() });
          persist(); render(); return toast('یک نسخه برای امروز ثبت شد');
        }
        openTxModal(t);
      };
    });
  }
  const emptyHTML = (msg) => `<div class="empty"><div class="big">🗒️</div><div>${msg}</div><button class="btn primary js-add">ثبت اولین تراکنش</button></div>`;

  function renderDashboard() {
    const { jy, jm } = state.month;
    const tx = monthTx();
    const inc = sum(tx, 'income'), exp = sum(tx, 'expense');
    let pjy = jy, pjm = jm - 1; if (pjm < 1) { pjm = 12; pjy--; }
    const ptx = monthTx(pjy, pjm);
    const pinc = sum(ptx, 'income'), pexp = sum(ptx, 'expense');
    $('#stIncome').innerHTML = moneyHTML(inc);
    $('#stExpense').innerHTML = moneyHTML(exp);
    $('#stNet').innerHTML = `<span class="${inc - exp < 0 ? 'down' : ''}">${moneyHTML(inc - exp)}</span>`;
    const cmp = (cur, prev, goodUp) => {
      if (!prev) return '<span class="muted">ماه قبل: بدون داده</span>';
      const p = Math.round(((cur - prev) / prev) * 100);
      const good = goodUp ? p >= 0 : p <= 0;
      return `<span class="${good ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${fa(Math.abs(p))}٪</span> نسبت به ${J.MONTHS[pjm - 1]}`;
    };
    $('#stIncomeCmp').innerHTML = cmp(inc, pinc, true);
    $('#stExpenseCmp').innerHTML = cmp(exp, pexp, false);
    $('#stNetFoot').innerHTML = inc ? `${fa(Math.max(0, Math.round(((inc - exp) / inc) * 100)))}٪ از درآمد پس‌انداز شده` : `${fa(tx.length)} تراکنش در این ماه`;
    const days = J.monthLength(jy, jm);
    const isCur = jy === today.jy && jm === today.jm;
    const passed = isCur ? today.jd : days;
    $('#stAvg').innerHTML = moneyHTML(exp / passed);
    $('#stAvgFoot').textContent = isCur ? `پیش‌بینی هزینه تا آخر ماه: ${money((exp / passed) * days)}` : `در ${fa(days)} روز`;

    // daily chart
    const di = Array(days).fill(0), de = Array(days).fill(0);
    tx.forEach(t => { const d = J.toJ(t.date).jd - 1; (t.type === 'income' ? di : de)[d] += t.amount; });
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    Charts.bars($('#dailyChart'), {
      labels: Array.from({ length: days }, (_, i) => fa(i + 1)),
      series: [{ name: 'درآمد', values: di, color: css('--income') }, { name: 'هزینه', values: de, color: css('--expense') }],
      fmtAxis: compact,
      fmtTip: (s, v) => `${s.name}: ${money(v)}`,
      tipTitle: i => `${fa(i + 1)} ${J.MONTHS[jm - 1]} — ${J.WEEKDAYS[J.weekday(J.toISO(jy, jm, i + 1))]}`,
      labelEvery: days > 20 ? 3 : 1,
    });

    // donut
    const byCat = {};
    tx.filter(t => t.type === 'expense').forEach(t => byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount);
    const items = Object.entries(byCat).map(([id, v]) => ({ c: catById(id), value: v })).sort((a, b) => b.value - a.value);
    $('#donutTotal').textContent = money(exp);
    $('#donutLegend').innerHTML = items.length
      ? items.map((it, i) => `<div class="lg-row" data-i="${i}"><span class="sw" style="background:${it.c.color}"></span><span class="nm">${it.c.icon} ${esc(it.c.name)}</span><span>${money(it.value, false)}</span><span class="pc">${fa(Math.round((it.value / exp) * 100))}٪</span></div>`).join('')
      : '<div class="muted small" style="text-align:center">هنوز هزینه‌ای در این ماه ثبت نشده</div>';
    Charts.donut($('#donutChart'), items.map(it => ({ value: it.value, color: it.c.color })), i => {
      $$('#donutLegend .lg-row').forEach(r => r.classList.toggle('hl', +r.dataset.i === i));
      $('#donutTotal').textContent = i >= 0 ? money(items[i].value) : money(exp);
      $('.donut-center .muted').textContent = i >= 0 ? items[i].c.name : 'جمع هزینه';
    });

    const recent = sortTx(tx).slice(0, 7);
    $('#recentList').innerHTML = recent.length ? recent.map(t => txRow(t)).join('') : emptyHTML('در این ماه هنوز تراکنشی ثبت نکرده‌اید');
    bindRows($('#recentList'));
  }

  function filteredTx() {
    const f = state.filter;
    let arr = f.all ? state.data.transactions : monthTx();
    if (f.type !== 'all') arr = arr.filter(t => t.type === f.type);
    if (f.cat) arr = arr.filter(t => t.categoryId === f.cat);
    if (f.q) {
      const q = toEn(f.q.trim()).replace(/[,٬]/g, '').toLowerCase();
      arr = arr.filter(t => (t.note || '').toLowerCase().includes(q) || catById(t.categoryId).name.includes(q) || String(t.amount).includes(q));
    }
    return sortTx(arr);
  }
  function renderTransactions() {
    const sel = $('#fCat');
    const cur = state.filter.cat;
    sel.innerHTML = '<option value="">همه دسته‌ها</option>' +
      ['expense', 'income'].map(tp => `<optgroup label="${tp === 'expense' ? 'هزینه' : 'درآمد'}">` +
        state.data.categories.filter(c => c.type === tp).map(c => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('') + '</optgroup>').join('');
    const arr = filteredTx();
    const inc = sum(arr, 'income'), exp = sum(arr, 'expense');
    $('#txSummary').innerHTML = `<span>${fa(arr.length)} تراکنش</span><span>درآمد <b class="income">${money(inc)}</b></span><span>هزینه <b class="expense">${money(exp)}</b></span><span>مانده <b>${money(inc - exp)}</b></span>`;
    if (!arr.length) {
      $('#txList').innerHTML = state.data.transactions.length ? '<div class="card empty"><div class="big">🔍</div>تراکنشی با این فیلترها پیدا نشد</div>' : `<div class="card">${emptyHTML('هنوز تراکنشی ثبت نشده')}</div>`;
      return;
    }
    const groups = new Map();
    arr.forEach(t => { if (!groups.has(t.date)) groups.set(t.date, []); groups.get(t.date).push(t); });
    let html = '';
    for (const [date, list] of groups) {
      const j = J.toJ(date);
      const gi = sum(list, 'income'), ge = sum(list, 'expense');
      const label = date === J.todayISO() ? 'امروز' : date === J.addDays(J.todayISO(), -1) ? 'دیروز' : J.WEEKDAYS[J.weekday(date)];
      html += `<div class="day-group"><div class="day-head"><div class="d">${label}<span>${fa(j.jd)} ${J.MONTHS[j.jm - 1]} ${fa(j.jy)}</span></div>
        <div class="t">${ge ? `<span class="down">−${num(ge)}</span>` : ''}${gi ? `<span class="up">+${num(gi)}</span>` : ''}</div></div>
        ${list.map(t => txRow(t, false)).join('')}</div>`;
    }
    $('#txList').innerHTML = html;
    bindRows($('#txList'));
  }
  $('#fSearch').oninput = e => { state.filter.q = e.target.value; renderTransactions(); };
  $('#fCat').onchange = e => { state.filter.cat = e.target.value; renderTransactions(); };
  $('#fAllTime').onchange = e => { state.filter.all = e.target.checked; renderTransactions(); };
  $$('#fType button').forEach(b => b.onclick = () => {
    $$('#fType button').forEach(x => x.classList.toggle('on', x === b));
    state.filter.type = b.dataset.v; renderTransactions();
  });

  function renderCategories() {
    const tx = monthTx();
    ['expense', 'income'].forEach(tp => {
      const box = $(tp === 'expense' ? '#catExpense' : '#catIncome');
      box.innerHTML = state.data.categories.filter(c => c.type === tp).map(c => {
        const list = tx.filter(t => t.categoryId === c.id);
        const total = state.data.transactions.filter(t => t.categoryId === c.id).length;
        return `<div class="cat-row" data-id="${c.id}">
          <div class="tx-ic" style="background:${c.color}22">${c.icon}</div>
          <div style="flex:1"><div class="nm">${esc(c.name)}</div><div class="ct">${fa(total)} تراکنش در کل</div></div>
          <div class="sm">${list.length ? money(sum(list, tp)) : '<span class="muted">—</span>'}</div>
        </div>`;
      }).join('');
      box.querySelectorAll('.cat-row').forEach(r => r.onclick = () => openCatModal(state.data.categories.find(c => c.id === r.dataset.id)));
    });
    $('#pageSub').textContent = `مبالغ مربوط به ${J.MONTHS[state.month.jm - 1]} ${fa(state.month.jy)} است — برای ویرایش روی هر دسته کلیک کنید`;
  }
  $$('[data-addcat]').forEach(b => b.onclick = () => openCatModal(null, b.dataset.addcat));

  function renderReports() {
    const y = state.year;
    $('#yearLabel').textContent = fa(y);
    $('#yearTitle').textContent = `درآمد و هزینه سال ${fa(y)}`;
    const ti = Array(12).fill(0), te = Array(12).fill(0);
    const catSum = {};
    state.data.transactions.forEach(t => {
      const j = J.toJ(t.date); if (j.jy !== y) return;
      if (t.type === 'income') ti[j.jm - 1] += t.amount;
      else { te[j.jm - 1] += t.amount; catSum[t.categoryId] = (catSum[t.categoryId] || 0) + t.amount; }
    });
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    Charts.bars($('#yearChart'), {
      labels: J.MONTHS,
      series: [{ name: 'درآمد', values: ti, color: css('--income') }, { name: 'هزینه', values: te, color: css('--expense') }],
      fmtAxis: compact,
      fmtTip: (s, v) => `${s.name}: ${money(v)}`,
      tipTitle: i => `${J.MONTHS[i]} ${fa(y)} — مانده: ${money(ti[i] - te[i])}`,
    });
    const rows = J.MONTHS.map((m, i) => `<tr class="${y === today.jy && i + 1 === today.jm ? 'cur' : ''}"><td>${m}</td><td class="n up">${ti[i] ? num(ti[i]) : '—'}</td><td class="n down">${te[i] ? num(te[i]) : '—'}</td><td class="n ${ti[i] - te[i] < 0 ? 'down' : ''}">${ti[i] || te[i] ? num(ti[i] - te[i]) : '—'}</td></tr>`).join('');
    const SI = ti.reduce((a, b) => a + b, 0), SE = te.reduce((a, b) => a + b, 0);
    $('#yearTable').innerHTML = `<tr><th>ماه</th><th>درآمد</th><th>هزینه</th><th>مانده</th></tr>${rows}<tr><td>جمع کل</td><td class="n up">${num(SI)}</td><td class="n down">${num(SE)}</td><td class="n">${num(SI - SE)}</td></tr>`;
    const top = Object.entries(catSum).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const mx = top[0]?.[1] || 1;
    $('#yearTopCats').innerHTML = top.length ? top.map(([id, v]) => {
      const c = catById(id);
      return `<div class="bar-row"><div class="top"><span>${c.icon} ${esc(c.name)}</span><span>${money(v)} <span class="muted small">(${fa(Math.round((v / SE) * 100))}٪)</span></span></div><div class="track"><div class="fill" style="width:${(v / mx) * 100}%;background:${c.color}"></div></div></div>`;
    }).join('') : '<div class="muted">برای این سال هزینه‌ای ثبت نشده</div>';
  }

  function renderSettings() {
    const s = state.data.settings;
    $$('#sCurrency button').forEach(b => b.classList.toggle('on', b.dataset.v === s.currency));
    $$('#sTheme button').forEach(b => b.classList.toggle('on', b.dataset.v === s.theme));
    const tx = state.data.transactions;
    const dates = tx.map(t => t.date).sort();
    $('#statsInfo').textContent = tx.length
      ? `${fa(tx.length)} تراکنش و ${fa(state.data.categories.length)} دسته — از ${fa(J.format(dates[0]))} تا ${fa(J.format(dates[dates.length - 1]))}`
      : 'هنوز داده‌ای ثبت نشده';
  }
  $$('#sCurrency button').forEach(b => b.onclick = () => { state.data.settings.currency = b.dataset.v; persist(); render(); });
  $$('#sTheme button').forEach(b => b.onclick = () => { state.data.settings.theme = b.dataset.v; applyTheme(); persist(); render(); });
  $('#openFolder').onclick = () => api.openDataFolder();
  $('#wipeBtn').onclick = async () => {
    const ok = await confirmBox('پاک کردن همه تراکنش‌ها', `${fa(state.data.transactions.length)} تراکنش برای همیشه حذف می‌شود. دسته‌بندی‌ها باقی می‌مانند.`, [
      { label: 'انصراف', value: false }, { label: 'بله، پاک کن', value: true, cls: 'danger' }]);
    if (!ok) return;
    state.data.transactions = []; persist(); render(); toast('همه تراکنش‌ها پاک شدند');
  };

  // ---------- transaction modal ----------
  const tm = { editing: null, type: 'expense', cat: null, date: J.todayISO(), dp: null };
  function setTxType(tp) {
    tm.type = tp;
    $('#txType').dataset.type = tp;
    $$('#txType button').forEach(b => b.classList.toggle('on', b.dataset.v === tp));
    if (!tm.cat || catById(tm.cat).type !== tp) tm.cat = state.data.categories.find(c => c.type === tp)?.id || null;
    renderChips();
  }
  function renderChips() {
    const cats = state.data.categories.filter(c => c.type === tm.type);
    $('#txCats').innerHTML = cats.map(c => `<button class="chip ${c.id === tm.cat ? 'on' : ''}" style="--c:${c.color}" data-id="${c.id}">${c.icon} ${esc(c.name)}</button>`).join('') +
      '<button class="chip add" data-add>+ دسته جدید</button>';
    $$('#txCats .chip').forEach(b => b.onclick = () => {
      if (b.dataset.add !== undefined) return openCatModal(null, tm.type, true);
      tm.cat = b.dataset.id; renderChips();
    });
  }
  $$('#txType button').forEach(b => b.onclick = () => setTxType(b.dataset.v));

  function setDate(iso) {
    tm.date = iso;
    const j = J.toJ(iso);
    const rel = iso === J.todayISO() ? ' (امروز)' : iso === J.addDays(J.todayISO(), -1) ? ' (دیروز)' : '';
    $('#txDateLabel').textContent = `${J.WEEKDAYS[J.weekday(iso)]} ${fa(j.jd)} ${J.MONTHS[j.jm - 1]} ${fa(j.jy)}${rel}`;
  }
  $$('.quick-dates button').forEach(b => b.onclick = () => { setDate(J.addDays(J.todayISO(), +b.dataset.qd)); $('#datepicker').classList.remove('open'); });

  function renderPicker() {
    const { jy, jm } = tm.dp;
    const first = J.toISO(jy, jm, 1);
    const offset = J.weekday(first);
    const len = J.monthLength(jy, jm);
    const sel = J.toJ(tm.date);
    let cells = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => `<div class="wd">${d}</div>`).join('');
    cells += '<div></div>'.repeat(offset);
    for (let d = 1; d <= len; d++) {
      const cls = [
        (offset + d - 1) % 7 === 6 ? 'fri' : '',
        jy === today.jy && jm === today.jm && d === today.jd ? 'today' : '',
        jy === sel.jy && jm === sel.jm && d === sel.jd ? 'sel' : '',
      ].join(' ');
      cells += `<button class="${cls}" data-d="${d}">${fa(d)}</button>`;
    }
    $('#datepicker').innerHTML = `<div class="dp-head">
      <button class="icon-btn" data-m="-1"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button>
      <span>${J.MONTHS[jm - 1]} ${fa(jy)}</span>
      <button class="icon-btn" data-m="1"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></button></div>
      <div class="dp-grid">${cells}</div>`;
    $$('#datepicker [data-m]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      let { jy: y, jm: m } = tm.dp; m += +b.dataset.m;
      if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
      tm.dp = { jy: y, jm: m }; renderPicker();
    });
    $$('#datepicker [data-d]').forEach(b => b.onclick = () => { setDate(J.toISO(jy, jm, +b.dataset.d)); $('#datepicker').classList.remove('open'); });
  }
  $('#txDateBtn').onclick = e => {
    e.stopPropagation();
    const dp = $('#datepicker');
    if (dp.classList.toggle('open')) { const j = J.toJ(tm.date); tm.dp = { jy: j.jy, jm: j.jm }; renderPicker(); }
  };
  document.addEventListener('mousedown', e => { if (!e.target.closest('.date-field')) $('#datepicker').classList.remove('open'); });

  const amountInput = $('#txAmount');
  function parseAmount() { return +toEn(amountInput.value).replace(/[^\d]/g, '') || 0; }
  amountInput.addEventListener('input', () => {
    const n = parseAmount();
    amountInput.value = n ? num(n) : '';
    const w = words(n);
    $('#txWords').textContent = w ? `${w} ${unit()}` : '';
  });

  function openTxModal(t) {
    tm.editing = t || null;
    $('#txModalTitle').textContent = t ? 'ویرایش تراکنش' : 'تراکنش جدید';
    $('#txDelete').style.display = t ? '' : 'none';
    $('#txUnit').textContent = unit();
    tm.cat = t ? t.categoryId : null;
    setTxType(t ? t.type : (tm.lastType || 'expense'));
    // default date: today, or 1st of viewed month if viewing another month
    const viewingCur = state.month.jy === today.jy && state.month.jm === today.jm;
    setDate(t ? t.date : viewingCur ? J.todayISO() : J.toISO(state.month.jy, state.month.jm, 1));
    amountInput.value = t ? num(t.amount) : '';
    $('#txWords').textContent = t ? `${words(t.amount)} ${unit()}` : '';
    $('#txNote').value = t ? t.note || '' : '';
    $('#datepicker').classList.remove('open');
    openModal('#txModal');
    setTimeout(() => amountInput.focus(), 60);
  }
  function saveTx() {
    const amount = parseAmount();
    if (!amount) { amountInput.focus(); return toast('مبلغ را وارد کنید', { error: true }); }
    if (!tm.cat) return toast('یک دسته‌بندی انتخاب کنید', { error: true });
    const rec = { type: tm.type, amount, categoryId: tm.cat, date: tm.date, note: $('#txNote').value.trim() };
    if (tm.editing) Object.assign(tm.editing, rec);
    else state.data.transactions.push({ id: uid(), createdAt: Date.now(), ...rec });
    tm.lastType = tm.type;
    persist(); closeModal('#txModal');
    // jump to the month of the saved transaction so the user sees it
    const j = J.toJ(rec.date); state.month = { jy: j.jy, jm: j.jm };
    render();
    toast(tm.editing ? 'تغییرات ذخیره شد' : `${tm.type === 'income' ? 'درآمد' : 'هزینه'} ${money(amount)} ثبت شد`);
  }
  function deleteTx(id) {
    const i = state.data.transactions.findIndex(t => t.id === id);
    if (i < 0) return;
    const [removed] = state.data.transactions.splice(i, 1);
    persist(); render();
    toast('تراکنش حذف شد', { action: { label: 'برگردان', fn: () => { state.data.transactions.push(removed); persist(); render(); } } });
  }
  $('#txSave').onclick = saveTx;
  $('#txDelete').onclick = () => { closeModal('#txModal'); deleteTx(tm.editing.id); };
  $('#addBtn').onclick = () => openTxModal();
  $('#txModal').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTx(); } });

  // ---------- category modal ----------
  const cm = { editing: null, type: 'expense', icon: '✨', color: PALETTE[9], fromTx: false };
  function openCatModal(c, type, fromTx = false) {
    cm.editing = c; cm.fromTx = fromTx;
    cm.type = c ? c.type : type;
    cm.icon = c ? c.icon : '✨';
    cm.color = c ? c.color : PALETTE[Math.floor(Math.random() * PALETTE.length)];
    $('#catModalTitle').textContent = c ? 'ویرایش دسته' : `دسته جدید ${cm.type === 'income' ? 'درآمد' : 'هزینه'}`;
    $('#catName').value = c ? c.name : '';
    $('#catDelete').style.display = c ? '' : 'none';
    renderCatPickers();
    openModal('#catModal');
    setTimeout(() => $('#catName').focus(), 60);
  }
  function renderCatPickers() {
    $('#catEmoji').innerHTML = EMOJIS.map(e => `<button class="${e === cm.icon ? 'on' : ''}">${e}</button>`).join('');
    $$('#catEmoji button').forEach(b => b.onclick = () => { cm.icon = b.textContent; renderCatPickers(); });
    $('#catColor').innerHTML = PALETTE.map(c => `<button class="${c === cm.color ? 'on' : ''}" style="background:${c};color:${c}" data-c="${c}"></button>`).join('');
    $$('#catColor button').forEach(b => b.onclick = () => { cm.color = b.dataset.c; renderCatPickers(); });
  }
  function saveCat() {
    const name = $('#catName').value.trim();
    if (!name) return toast('نام دسته را بنویسید', { error: true });
    if (state.data.categories.some(c => c.type === cm.type && c.name === name && c !== cm.editing)) return toast('این دسته از قبل وجود دارد', { error: true });
    if (cm.editing) Object.assign(cm.editing, { name, icon: cm.icon, color: cm.color });
    else {
      const c = { id: uid(), name, type: cm.type, icon: cm.icon, color: cm.color };
      state.data.categories.push(c);
      if (cm.fromTx) tm.cat = c.id;
    }
    persist(); closeModal('#catModal');
    if (cm.fromTx) renderChips();
    render(); toast('دسته ذخیره شد');
  }
  $('#catSave').onclick = saveCat;
  $('#catModal').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveCat(); } });
  $('#catDelete').onclick = async () => {
    const c = cm.editing;
    const used = state.data.transactions.filter(t => t.categoryId === c.id);
    const others = state.data.categories.filter(x => x.type === c.type && x.id !== c.id);
    if (!others.length) return toast('حداقل یک دسته باید باقی بماند', { error: true });
    let target = null;
    if (used.length) {
      target = others.find(x => x.name === 'سایر') || others[0];
      const ok = await confirmBox('حذف دسته', `${fa(used.length)} تراکنش در «${c.name}» هست. این تراکنش‌ها به دسته «${target.name}» منتقل می‌شوند.`, [
        { label: 'انصراف', value: false }, { label: 'حذف و انتقال', value: true, cls: 'danger' }]);
      if (!ok) return;
      used.forEach(t => t.categoryId = target.id);
    }
    state.data.categories = state.data.categories.filter(x => x.id !== c.id);
    persist(); closeModal('#catModal'); render(); toast('دسته حذف شد');
  };

  // ---------- export / import ----------
  const stamp = () => { const j = today; return `${j.jy}-${String(j.jm).padStart(2, '0')}-${String(j.jd).padStart(2, '0')}`; };
  $('#expJson').onclick = async () => {
    const r = await api.exportFile({ kind: 'json', defaultName: `daftar-backup-${stamp()}.json`, content: JSON.stringify({ app: 'daftar', exportedAt: new Date().toISOString(), ...state.data }, null, 2) });
    if (r.ok) toast('فایل پشتیبان ذخیره شد');
  };
  const csvCell = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  $('#expCsv').onclick = async () => {
    const head = ['تاریخ شمسی', 'تاریخ میلادی', 'نوع', 'دسته', 'مبلغ', 'توضیحات'];
    const rows = sortTx(state.data.transactions).reverse().map(t => [J.format(t.date), t.date, t.type === 'income' ? 'درآمد' : 'هزینه', catById(t.categoryId).name, t.amount, t.note]);
    const csv = '﻿' + [head, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
    const r = await api.exportFile({ kind: 'csv', defaultName: `daftar-${stamp()}.csv`, content: csv });
    if (r.ok) toast('فایل اکسل (CSV) ذخیره شد');
  };

  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim()));
  }

  function importCSV(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) throw new Error('فایل خالی است');
    const head = rows[0].map(h => h.trim().toLowerCase());
    const col = keys => head.findIndex(h => keys.some(k => h.includes(k)));
    const ci = { date: col(['تاریخ', 'date']), type: col(['نوع', 'type']), cat: col(['دسته', 'category']), amount: col(['مبلغ', 'amount', 'مقدار']), note: col(['توضیح', 'note', 'شرح', 'description']) };
    if (ci.date < 0 || ci.amount < 0) throw new Error('ستون «تاریخ» یا «مبلغ» در فایل پیدا نشد');
    let added = 0, skipped = 0, newCats = 0;
    for (const r of rows.slice(1)) {
      const date = J.parse(r[ci.date] || '');
      let amt = +toEn(r[ci.amount] || '').replace(/[^\d.\-]/g, '');
      if (!date || !amt) { skipped++; continue; }
      const tv = ci.type >= 0 ? (r[ci.type] || '').trim().toLowerCase() : '';
      let type = /درآمد|income|دریافت|واریز/.test(tv) ? 'income' : 'expense';
      if (ci.type < 0 && amt > 0) type = 'income';
      amt = Math.abs(amt);
      const cname = (ci.cat >= 0 ? r[ci.cat] : '').trim() || 'سایر';
      let cat = state.data.categories.find(c => c.type === type && c.name === cname);
      if (!cat) {
        cat = { id: uid(), name: cname, type, icon: '✨', color: PALETTE[state.data.categories.length % PALETTE.length] };
        state.data.categories.push(cat); newCats++;
      }
      state.data.transactions.push({ id: uid(), createdAt: Date.now(), type, amount: amt, categoryId: cat.id, date, note: ci.note >= 0 ? (r[ci.note] || '').trim() : '' });
      added++;
    }
    return { added, skipped, newCats };
  }

  $('#impBtn').onclick = async () => {
    const f = await api.importFile();
    if (!f.ok) return;
    try {
      if (f.ext === '.json') {
        const d = JSON.parse(f.content);
        if (!Array.isArray(d.transactions) || !Array.isArray(d.categories)) throw new Error('این فایل پشتیبان معتبر نیست');
        const mode = await confirmBox('ورود فایل پشتیبان', `${fa(d.transactions.length)} تراکنش در فایل «${f.name}» است. اطلاعات فعلی جایگزین شود یا با آن ادغام شود؟`, [
          { label: 'انصراف', value: null }, { label: 'ادغام', value: 'merge' }, { label: 'جایگزینی کامل', value: 'replace', cls: 'danger' }]);
        if (!mode) return;
        if (mode === 'replace') {
          state.data = { version: 1, settings: { ...state.data.settings, ...(d.settings || {}) }, categories: d.categories, transactions: d.transactions };
        } else {
          const cats = new Set(state.data.categories.map(c => c.id));
          d.categories.forEach(c => { if (!cats.has(c.id)) state.data.categories.push(c); });
          const ids = new Set(state.data.transactions.map(t => t.id));
          let n = 0; d.transactions.forEach(t => { if (!ids.has(t.id)) { state.data.transactions.push(t); n++; } });
          toast(`${fa(n)} تراکنش جدید اضافه شد`);
        }
        applyTheme(); persist(); render();
        if (mode === 'replace') toast('اطلاعات با موفقیت بازیابی شد');
      } else {
        const r = importCSV(f.content);
        persist(); render();
        toast(`${fa(r.added)} تراکنش وارد شد${r.newCats ? ` و ${fa(r.newCats)} دسته جدید ساخته شد` : ''}${r.skipped ? ` (${fa(r.skipped)} ردیف نامعتبر رد شد)` : ''}`);
      }
    } catch (e) {
      toast(e.message.startsWith('Unexpected') ? 'فایل قابل خواندن نیست' : e.message, { error: true });
    }
  };

  document.addEventListener('click', e => { if (e.target.closest('.js-add')) openTxModal(); });

  // ---------- keyboard ----------
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'ی' || e.code === 'KeyN')) { e.preventDefault(); openTxModal(); }
    if (e.key === 'Escape') { $$('.overlay.open').forEach(o => closeModal('#' + o.id)); }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF' && state.view === 'transactions') { e.preventDefault(); $('#fSearch').focus(); }
  });
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(render, 120); });

  // ---------- boot ----------
  (async () => {
    let d = await api.load();
    if (!d || !Array.isArray(d.transactions)) { d = defaultData(); await api.save(d); }
    d.settings = { currency: 'تومان', theme: 'dark', ...(d.settings || {}) };
    state.data = d;
    applyTheme();
    document.fonts.ready.then(() => go('dashboard'));
  })();
})();
