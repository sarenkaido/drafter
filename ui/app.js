/* Daftar — renderer */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const api = window.api || { // browser fallback (for previewing outside the app)
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

  // ---------- language ----------
  let lang = 'fa';
  const t = (key, ...args) => {
    const v = (I18N[lang] && I18N[lang][key]) ?? I18N.fa[key] ?? key;
    return typeof v === 'function' ? v(...args) : v;
  };
  const isFa = () => lang === 'fa';

  // ---------- helpers ----------
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const faDigits = s => String(s).replace(/\d/g, d => FA[d]);
  const dg = s => (isFa() ? faDigits(s) : String(s));          // digits in the current language
  const toEn = s => String(s).replace(/[۰-۹]/g, c => FA.indexOf(c)).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c));
  let nf = new Intl.NumberFormat('fa-IR');
  const num = n => nf.format(Math.round(n));
  const pct = n => dg(n) + t('pct');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const unit = () => { const c = state.data.settings.currency; return c ? t('cur.' + c) : ''; };
  const money = (n, withUnit = true) => num(n) + (withUnit && unit() ? ' ' + unit() : '');
  const moneyHTML = n => `${num(n)}${unit() ? `<small>${unit()}</small>` : ''}`;
  const compact = n => {
    const a = Math.abs(n);
    if (isFa()) {
      if (a >= 1e9) return dg(+(n / 1e9).toFixed(1)) + ' میلیارد';
      if (a >= 1e6) return dg(+(n / 1e6).toFixed(1)) + ' م';
      if (a >= 1e3) return dg(+(n / 1e3).toFixed(0)) + ' هـ';
      return dg(Math.round(n));
    }
    if (a >= 1e9) return +(n / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return +(n / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return +(n / 1e3).toFixed(0) + 'K';
    return String(Math.round(n));
  };
  // dates
  const monthYear = (y, m) => t('monthYear', Cal.monthName(m), dg(y));
  const dateLong = iso => { const p = Cal.split(iso); return t('dateLong', Cal.weekdayName(iso), dg(p.d), Cal.monthName(p.m), dg(p.y)); };
  const dateMid = iso => { const p = Cal.split(iso); return t('dateMid', dg(p.d), Cal.monthName(p.m), dg(p.y)); };
  const shortDate = iso => dg(Cal.format(iso));

  function wordsFa(n) {
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
  function wordsEn(n) {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const scales = ['', 'thousand', 'million', 'billion', 'trillion'];
    const three = x => {
      const p = [];
      const h = Math.floor(x / 100), r = x % 100;
      if (h) p.push(ones[h] + ' hundred');
      if (r) p.push(r < 20 ? ones[r] : tens[Math.floor(r / 10)] + (r % 10 ? '-' + ones[r % 10] : ''));
      return p.join(' ');
    };
    const parts = []; let i = 0;
    while (n > 0 && i < scales.length) {
      const c = n % 1000;
      if (c) parts.unshift(three(c) + (scales[i] ? ' ' + scales[i] : ''));
      n = Math.floor(n / 1000); i++;
    }
    return parts.join(' ');
  }
  const words = n => { n = Math.floor(n); return n ? (isFa() ? wordsFa(n) : wordsEn(n)) : ''; };

  // ---------- default data ----------
  const PALETTE = ['#ff5d7a', '#ff8a4c', '#ffb547', '#f5d547', '#9be15d', '#2fd189', '#1ec8b0', '#2ec5e8', '#5b9dff', '#7c6cff', '#b26cff', '#ef6cd5', '#a3a9b8'];
  const EMOJIS = ['🛒', '🍔', '☕', '🚕', '⛽', '🚗', '💡', '🏠', '💊', '👕', '🎬', '📚', '📱', '🎁', '💳', '✈️', '🏋️', '🐾', '👶', '💇', '🔧', '🧾', '🎮', '🍎', '🏦', '💼', '💻', '📈', '🛍️', '💰', '🪙', '🏆', '🤝', '🎓', '🧹', '🚌', '🍕', '🎵', '❤️', '✨'];
  const DEFAULTS = [
    ['groceries', 'expense', '🛒', '#2fd189'], ['dining', 'expense', '🍔', '#ff8a4c'], ['transport', 'expense', '🚕', '#f5d547'],
    ['car', 'expense', '⛽', '#ffb547'], ['bills', 'expense', '💡', '#2ec5e8'], ['housing', 'expense', '🏠', '#5b9dff'],
    ['health', 'expense', '💊', '#ff5d7a'], ['clothing', 'expense', '👕', '#ef6cd5'], ['fun', 'expense', '🎬', '#b26cff'],
    ['education', 'expense', '📚', '#1ec8b0'], ['phone', 'expense', '📱', '#7c6cff'], ['loans', 'expense', '💳', '#9be15d'],
    ['gift', 'expense', '🎁', '#ff8a4c'], ['other', 'expense', '✨', '#a3a9b8'],
    ['salary', 'income', '💼', '#2fd189'], ['freelance', 'income', '💻', '#5b9dff'], ['sales', 'income', '🛍️', '#ffb547'],
    ['invest', 'income', '📈', '#7c6cff'], ['gift', 'income', '🎁', '#ef6cd5'], ['other', 'income', '✨', '#a3a9b8'],
  ];
  const defaultData = () => ({
    version: 1,
    settings: { currency: 'toman', theme: 'dark', lang: 'fa', calendar: 'jalali' },
    categories: DEFAULTS.map(([key, type, icon, color]) => ({ id: uid(), key, name: DEFAULT_CATS[key].fa, type, icon, color })),
    transactions: [],
  });
  // older data: Persian currency labels, default categories without a key
  function migrate(d) {
    const s = d.settings = { currency: 'toman', theme: 'dark', ...(d.settings || {}) };
    if (s.currency === 'تومان') s.currency = 'toman';
    if (s.currency === 'ریال') s.currency = 'rial';
    if (!s.lang) s.lang = 'fa';
    if (!s.calendar) s.calendar = s.lang === 'en' ? 'gregorian' : 'jalali';
    d.categories.forEach(c => {
      if (c.key) return;
      const key = Object.keys(DEFAULT_CATS).find(k => DEFAULT_CATS[k].fa === c.name || DEFAULT_CATS[k].en === c.name);
      if (key) c.key = key;
    });
    return d;
  }

  // ---------- state ----------
  const state = {
    data: null,
    view: 'dashboard',
    month: { y: 0, m: 0 },
    year: 0,
    filter: { q: '', type: 'all', cat: '', all: false },
  };
  const TD = () => Cal.today();
  const resetToToday = () => { const d = TD(); state.month = { y: d.y, m: d.m }; state.year = d.y; };
  let saveTimer;
  const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => api.save(state.data), 150); };
  const catName = c => (c.key && DEFAULT_CATS[c.key] ? DEFAULT_CATS[c.key][lang] : c.name);
  const catById = id => state.data.categories.find(c => c.id === id) || { name: t('uncategorized'), icon: '❔', color: '#a3a9b8', type: 'expense' };

  const inMonth = (tx, y, m) => { const p = Cal.split(tx.date); return p.y === y && p.m === m; };
  const monthTx = (y = state.month.y, m = state.month.m) => state.data.transactions.filter(tx => inMonth(tx, y, m));
  const sum = (arr, type) => arr.reduce((a, tx) => a + (tx.type === type ? tx.amount : 0), 0);
  const sortTx = arr => arr.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  const typeName = tp => t(tp === 'income' ? 'income' : 'expense');

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
  // Modals and views use browser history so the Android back button
  // closes the open sheet first, then returns to the dashboard.
  const modalStack = [];
  let skipPop = 0;
  function openModal(sel) {
    $(sel).classList.add('open');
    modalStack.push(sel);
    history.pushState({ modal: sel }, '');
  }
  function closeModal(sel) {
    $(sel).classList.remove('open');
    const i = modalStack.lastIndexOf(sel);
    if (i < 0) return;
    modalStack.splice(i, 1);
    skipPop++; history.back();
  }
  window.addEventListener('popstate', () => {
    if (skipPop) { skipPop--; return; }
    const top = modalStack.pop();
    if (top) { $(top).classList.remove('open'); return; }
    if (state.view !== 'dashboard') go('dashboard', true);
  });
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) document.documentElement.classList.add('is-mobile');
  $$('.overlay').forEach(o => {
    o.addEventListener('mousedown', e => { if (e.target === o) closeModal('#' + o.id); });
    o.querySelectorAll('[data-close]').forEach(b => b.onclick = () => closeModal('#' + o.id));
  });

  // ---------- language & calendar ----------
  function applyLang() {
    const s = state.data.settings;
    lang = s.lang === 'en' ? 'en' : 'fa';
    Cal.set(s.calendar, lang);
    nf = new Intl.NumberFormat(isFa() ? 'fa-IR' : 'en-US');
    const root = document.documentElement;
    root.lang = lang;
    root.dir = isFa() ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    $('#langToggle').textContent = isFa() ? 'EN' : 'فا';
    $('#txAmount').placeholder = dg(0);
  }
  function setLang(l) {
    const s = state.data.settings;
    if (s.lang === l) return;
    s.lang = l;
    s.calendar = l === 'en' ? 'gregorian' : 'jalali';   // each language starts with its usual calendar
    applyLang(); resetToToday(); persist(); go(state.view, true);
  }
  function setCalendar(c) {
    state.data.settings.calendar = c;
    applyLang(); resetToToday(); persist(); render();
  }
  $('#langToggle').onclick = () => setLang(isFa() ? 'en' : 'fa');

  // ---------- navigation ----------
  const TITLES = { dashboard: 'nav.dashboard', transactions: 'nav.transactions', categories: 'nav.categories', reports: 'nav.reports', settings: 'nav.settings' };
  function go(view, fromHistory = false) {
    if (!fromHistory && view !== state.view) {
      if (state.view === 'dashboard') history.pushState({ view }, '');
      else if (view === 'dashboard' && history.state && history.state.view) { skipPop++; history.back(); }
    }
    state.view = view;
    $('.main').scrollTop = 0;
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    $('#pageTitle').textContent = t(TITLES[view]);
    $('#monthNav').classList.toggle('off', !['dashboard', 'transactions', 'categories'].includes(view));
    render();
  }
  $$('.nav-item').forEach(b => b.onclick = () => go(b.dataset.view));
  $$('[data-goto]').forEach(b => b.onclick = () => go(b.dataset.goto));

  function shiftMonth(d) {
    let { y, m } = state.month;
    m += d; if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
    state.month = { y, m }; render();
  }
  $('#prevMonth').onclick = () => shiftMonth(-1);
  $('#nextMonth').onclick = () => shiftMonth(1);
  $('#monthLabel').onclick = () => { const d = TD(); state.month = { y: d.y, m: d.m }; render(); };
  $('#prevYear').onclick = () => { state.year--; renderReports(); };
  $('#nextYear').onclick = () => { state.year++; renderReports(); };

  // ---------- theme ----------
  function applyTheme() { document.documentElement.dataset.theme = state.data.settings.theme; }
  $('#themeToggle').onclick = () => {
    state.data.settings.theme = state.data.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(); persist(); render();
  };

  // ---------- rendering ----------
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function render() {
    const { y, m } = state.month;
    const today = TD();
    $('#monthLabel').textContent = monthYear(y, m);
    const all = state.data.transactions;
    const bal = sum(all, 'income') - sum(all, 'expense');
    $('#sideBalance').innerHTML = `<span class="${bal < 0 ? 'down' : ''}">${money(bal)}</span>`;
    const isCur = y === today.y && m === today.m;
    $('#pageSub').textContent = state.view === 'dashboard' || state.view === 'transactions'
      ? (isCur ? t('todaySub', Cal.weekdayName(Cal.todayISO()), dg(today.d), Cal.monthName(today.m)) : t('otherMonth'))
      : '';
    if (state.view === 'dashboard') renderDashboard();
    if (state.view === 'transactions') renderTransactions();
    if (state.view === 'categories') renderCategories();
    if (state.view === 'reports') renderReports();
    if (state.view === 'settings') renderSettings();
  }

  function txRow(tx, showDate = true) {
    const c = catById(tx.categoryId);
    return `<div class="tx" data-id="${tx.id}">
      <div class="tx-ic" style="background:${c.color}22">${c.icon}</div>
      <div class="tx-main">
        <div class="tx-cat">${esc(catName(c))}</div>
        <div class="tx-note">${esc(tx.note) || `<span style="opacity:.5">${t('noNote')}</span>`}</div>
      </div>
      ${showDate ? `<div class="tx-date">${shortDate(tx.date)}</div>` : ''}
      <div class="tx-amt ${tx.type}">${tx.type === 'income' ? '+' : '−'}${num(tx.amount)}</div>
      <div class="tx-actions">
        <button class="icon-btn" data-act="dup" title="${esc(t('dup'))}"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>
        <button class="icon-btn del" data-act="del" title="${esc(t('delete'))}"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>
      </div>
    </div>`;
  }
  function bindRows(root) {
    root.querySelectorAll('.tx').forEach(r => {
      r.onclick = e => {
        const id = r.dataset.id;
        const act = e.target.closest('[data-act]')?.dataset.act;
        const tx = state.data.transactions.find(x => x.id === id);
        if (act === 'del') return deleteTx(id);
        if (act === 'dup') {
          state.data.transactions.push({ ...tx, id: uid(), date: Cal.todayISO(), createdAt: Date.now() });
          persist(); render(); return toast(t('dupDone'));
        }
        openTxModal(tx);
      };
    });
  }
  const emptyHTML = msg => `<div class="empty"><div class="big">🗒️</div><div>${msg}</div><button class="btn primary js-add">${t('firstTx')}</button></div>`;

  function renderDashboard() {
    const { y, m } = state.month;
    const today = TD();
    const tx = monthTx();
    const inc = sum(tx, 'income'), exp = sum(tx, 'expense');
    let py = y, pm = m - 1; if (pm < 1) { pm = 12; py--; }
    const ptx = monthTx(py, pm);
    const pinc = sum(ptx, 'income'), pexp = sum(ptx, 'expense');
    $('#stIncome').innerHTML = moneyHTML(inc);
    $('#stExpense').innerHTML = moneyHTML(exp);
    $('#stNet').innerHTML = `<span class="${inc - exp < 0 ? 'down' : ''}">${moneyHTML(inc - exp)}</span>`;
    const cmp = (cur, prev, goodUp) => {
      if (!prev) return `<span class="muted">${t('prevNone')}</span>`;
      const p = Math.round(((cur - prev) / prev) * 100);
      const good = goodUp ? p >= 0 : p <= 0;
      return `<span class="${good ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${pct(Math.abs(p))}</span> ${t('vs', Cal.monthName(pm))}`;
    };
    $('#stIncomeCmp').innerHTML = cmp(inc, pinc, true);
    $('#stExpenseCmp').innerHTML = cmp(exp, pexp, false);
    $('#stNetFoot').innerHTML = inc ? t('saved', pct(Math.max(0, Math.round(((inc - exp) / inc) * 100)))) : t('txThisMonth', dg(tx.length));
    const days = Cal.monthLength(y, m);
    const isCur = y === today.y && m === today.m;
    const passed = isCur ? today.d : days;
    $('#stAvg').innerHTML = moneyHTML(exp / passed);
    $('#stAvgFoot').textContent = isCur ? t('forecast', money((exp / passed) * days)) : t('overDays', dg(days));

    // daily chart
    const di = Array(days).fill(0), de = Array(days).fill(0);
    tx.forEach(x => { const d = Cal.split(x.date).d - 1; (x.type === 'income' ? di : de)[d] += x.amount; });
    Charts.bars($('#dailyChart'), {
      labels: Array.from({ length: days }, (_, i) => dg(i + 1)),
      series: [{ name: t('income'), values: di, color: cssVar('--income') }, { name: t('expense'), values: de, color: cssVar('--expense') }],
      fmtAxis: compact,
      fmtTip: (s, v) => `${s.name}: ${money(v)}`,
      tipTitle: i => dateLong(Cal.join(y, m, i + 1)),
      labelEvery: days > 20 ? 3 : 1,
      rtl: isFa(),
    });

    // donut
    const byCat = {};
    tx.filter(x => x.type === 'expense').forEach(x => byCat[x.categoryId] = (byCat[x.categoryId] || 0) + x.amount);
    const items = Object.entries(byCat).map(([id, v]) => ({ c: catById(id), value: v })).sort((a, b) => b.value - a.value);
    $('#donutTotal').textContent = money(exp);
    $('#donutLabel').textContent = t('donut.total');
    $('#donutLegend').innerHTML = items.length
      ? items.map((it, i) => `<div class="lg-row" data-i="${i}"><span class="sw" style="background:${it.c.color}"></span><span class="nm">${it.c.icon} ${esc(catName(it.c))}</span><span>${money(it.value, false)}</span><span class="pc">${pct(Math.round((it.value / exp) * 100))}</span></div>`).join('')
      : `<div class="muted small" style="text-align:center">${t('noExpMonth')}</div>`;
    Charts.donut($('#donutChart'), items.map(it => ({ value: it.value, color: it.c.color })), i => {
      $$('#donutLegend .lg-row').forEach(r => r.classList.toggle('hl', +r.dataset.i === i));
      $('#donutTotal').textContent = i >= 0 ? money(items[i].value) : money(exp);
      $('#donutLabel').textContent = i >= 0 ? catName(items[i].c) : t('donut.total');
    });

    const recent = sortTx(tx).slice(0, 7);
    $('#recentList').innerHTML = recent.length ? recent.map(x => txRow(x)).join('') : emptyHTML(t('noTxMonth'));
    bindRows($('#recentList'));
  }

  function filteredTx() {
    const f = state.filter;
    let arr = f.all ? state.data.transactions : monthTx();
    if (f.type !== 'all') arr = arr.filter(x => x.type === f.type);
    if (f.cat) arr = arr.filter(x => x.categoryId === f.cat);
    if (f.q) {
      const q = toEn(f.q.trim()).replace(/[,٬]/g, '').toLowerCase();
      arr = arr.filter(x => (x.note || '').toLowerCase().includes(q) || catName(catById(x.categoryId)).toLowerCase().includes(q) || String(x.amount).includes(q));
    }
    return sortTx(arr);
  }
  function renderTransactions() {
    const sel = $('#fCat');
    const cur = state.filter.cat;
    sel.innerHTML = `<option value="">${t('allCats')}</option>` +
      ['expense', 'income'].map(tp => `<optgroup label="${typeName(tp)}">` +
        state.data.categories.filter(c => c.type === tp).map(c => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${c.icon} ${esc(catName(c))}</option>`).join('') + '</optgroup>').join('');
    const arr = filteredTx();
    const inc = sum(arr, 'income'), exp = sum(arr, 'expense');
    $('#txSummary').innerHTML = `<span>${t('txCount', dg(arr.length))}</span><span>${t('income')} <b class="income">${money(inc)}</b></span><span>${t('expense')} <b class="expense">${money(exp)}</b></span><span>${t('balance')} <b>${money(inc - exp)}</b></span>`;
    if (!arr.length) {
      $('#txList').innerHTML = state.data.transactions.length ? `<div class="card empty"><div class="big">🔍</div>${t('noMatch')}</div>` : `<div class="card">${emptyHTML(t('noTxYet'))}</div>`;
      return;
    }
    const groups = new Map();
    arr.forEach(x => { if (!groups.has(x.date)) groups.set(x.date, []); groups.get(x.date).push(x); });
    const todayISO = Cal.todayISO(), yISO = Cal.addDays(todayISO, -1);
    let html = '';
    for (const [date, list] of groups) {
      const gi = sum(list, 'income'), ge = sum(list, 'expense');
      const label = date === todayISO ? t('today') : date === yISO ? t('yesterday') : Cal.weekdayName(date);
      html += `<div class="day-group"><div class="day-head"><div class="d">${label}<span>${dateMid(date)}</span></div>
        <div class="t">${ge ? `<span class="down">−${num(ge)}</span>` : ''}${gi ? `<span class="up">+${num(gi)}</span>` : ''}</div></div>
        ${list.map(x => txRow(x, false)).join('')}</div>`;
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
        const list = tx.filter(x => x.categoryId === c.id);
        const total = state.data.transactions.filter(x => x.categoryId === c.id).length;
        return `<div class="cat-row" data-id="${c.id}">
          <div class="tx-ic" style="background:${c.color}22">${c.icon}</div>
          <div style="flex:1"><div class="nm">${esc(catName(c))}</div><div class="ct">${t('txTotal', dg(total))}</div></div>
          <div class="sm">${list.length ? money(sum(list, tp)) : '<span class="muted">—</span>'}</div>
        </div>`;
      }).join('');
      box.querySelectorAll('.cat-row').forEach(r => r.onclick = () => openCatModal(state.data.categories.find(c => c.id === r.dataset.id)));
    });
    $('#pageSub').textContent = t('catSub', monthYear(state.month.y, state.month.m));
  }
  $$('[data-addcat]').forEach(b => b.onclick = () => openCatModal(null, b.dataset.addcat));

  function renderReports() {
    const y = state.year;
    const today = TD();
    const MONTHS = Cal.months();
    $('#yearLabel').textContent = dg(y);
    $('#yearTitle').textContent = t('yearTitle', dg(y));
    const ti = Array(12).fill(0), te = Array(12).fill(0);
    const catSum = {};
    state.data.transactions.forEach(x => {
      const p = Cal.split(x.date); if (p.y !== y) return;
      if (x.type === 'income') ti[p.m - 1] += x.amount;
      else { te[p.m - 1] += x.amount; catSum[x.categoryId] = (catSum[x.categoryId] || 0) + x.amount; }
    });
    Charts.bars($('#yearChart'), {
      labels: isFa() ? MONTHS : MONTHS.map(n => n.slice(0, 3)),
      series: [{ name: t('income'), values: ti, color: cssVar('--income') }, { name: t('expense'), values: te, color: cssVar('--expense') }],
      fmtAxis: compact,
      fmtTip: (s, v) => `${s.name}: ${money(v)}`,
      tipTitle: i => `${monthYear(y, i + 1)} · ${t('balance')}: ${money(ti[i] - te[i])}`,
      rtl: isFa(),
    });
    const rows = MONTHS.map((mn, i) => `<tr class="${y === today.y && i + 1 === today.m ? 'cur' : ''}"><td>${mn}</td><td class="n up">${ti[i] ? num(ti[i]) : '—'}</td><td class="n down">${te[i] ? num(te[i]) : '—'}</td><td class="n ${ti[i] - te[i] < 0 ? 'down' : ''}">${ti[i] || te[i] ? num(ti[i] - te[i]) : '—'}</td></tr>`).join('');
    const SI = ti.reduce((a, b) => a + b, 0), SE = te.reduce((a, b) => a + b, 0);
    $('#yearTable').innerHTML = `<tr><th>${t('month')}</th><th>${t('income')}</th><th>${t('expense')}</th><th>${t('balance')}</th></tr>${rows}<tr><td>${t('total')}</td><td class="n up">${num(SI)}</td><td class="n down">${num(SE)}</td><td class="n">${num(SI - SE)}</td></tr>`;
    const top = Object.entries(catSum).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const mx = top[0]?.[1] || 1;
    $('#yearTopCats').innerHTML = top.length ? top.map(([id, v]) => {
      const c = catById(id);
      return `<div class="bar-row"><div class="top"><span>${c.icon} ${esc(catName(c))}</span><span>${money(v)} <span class="muted small">(${pct(Math.round((v / SE) * 100))})</span></span></div><div class="track"><div class="fill" style="width:${(v / mx) * 100}%;background:${c.color}"></div></div></div>`;
    }).join('') : `<div class="muted">${t('noExpYear')}</div>`;
  }

  function renderSettings() {
    const s = state.data.settings;
    $$('#sLang button').forEach(b => b.classList.toggle('on', b.dataset.v === s.lang));
    $$('#sCal button').forEach(b => b.classList.toggle('on', b.dataset.v === s.calendar));
    $$('#sCurrency button').forEach(b => b.classList.toggle('on', b.dataset.v === s.currency));
    $$('#sTheme button').forEach(b => b.classList.toggle('on', b.dataset.v === s.theme));
    const tx = state.data.transactions;
    const dates = tx.map(x => x.date).sort();
    $('#statsInfo').textContent = tx.length
      ? t('statsInfo', dg(tx.length), dg(state.data.categories.length), shortDate(dates[0]), shortDate(dates[dates.length - 1]))
      : t('noData');
  }
  $$('#sLang button').forEach(b => b.onclick = () => setLang(b.dataset.v));
  $$('#sCal button').forEach(b => b.onclick = () => setCalendar(b.dataset.v));
  $$('#sCurrency button').forEach(b => b.onclick = () => { state.data.settings.currency = b.dataset.v; persist(); render(); });
  $$('#sTheme button').forEach(b => b.onclick = () => { state.data.settings.theme = b.dataset.v; applyTheme(); persist(); render(); });
  $('#openFolder').onclick = () => api.openDataFolder();
  $('#wipeBtn').onclick = async () => {
    const ok = await confirmBox(t('set.wipe'), t('wipeText', dg(state.data.transactions.length)), [
      { label: t('cancel'), value: false }, { label: t('wipeYes'), value: true, cls: 'danger' }]);
    if (!ok) return;
    state.data.transactions = []; persist(); render(); toast(t('wiped'));
  };

  // ---------- transaction modal ----------
  const tm = { editing: null, type: 'expense', cat: null, date: Cal.todayISO(), dp: null };
  function setTxType(tp) {
    tm.type = tp;
    $('#txType').dataset.type = tp;
    $$('#txType button').forEach(b => b.classList.toggle('on', b.dataset.v === tp));
    if (!tm.cat || catById(tm.cat).type !== tp) tm.cat = state.data.categories.find(c => c.type === tp)?.id || null;
    renderChips();
  }
  function renderChips() {
    const cats = state.data.categories.filter(c => c.type === tm.type);
    $('#txCats').innerHTML = cats.map(c => `<button class="chip ${c.id === tm.cat ? 'on' : ''}" style="--c:${c.color}" data-id="${c.id}">${c.icon} ${esc(catName(c))}</button>`).join('') +
      `<button class="chip add" data-add>${t('cat.add')}</button>`;
    $$('#txCats .chip').forEach(b => b.onclick = () => {
      if (b.dataset.add !== undefined) return openCatModal(null, tm.type, true);
      tm.cat = b.dataset.id; renderChips();
    });
  }
  $$('#txType button').forEach(b => b.onclick = () => setTxType(b.dataset.v));

  function setDate(iso) {
    tm.date = iso;
    const todayISO = Cal.todayISO();
    const rel = iso === todayISO ? ` (${t('today')})` : iso === Cal.addDays(todayISO, -1) ? ` (${t('yesterday')})` : '';
    $('#txDateLabel').textContent = dateLong(iso) + rel;
  }
  $$('.quick-dates button').forEach(b => b.onclick = () => { setDate(Cal.addDays(Cal.todayISO(), +b.dataset.qd)); $('#datepicker').classList.remove('open'); });

  function renderPicker() {
    const { y, m } = tm.dp;
    const today = TD();
    const first = Cal.join(y, m, 1);
    const start = Cal.weekStart();
    const offset = (Cal.weekday(first) - start + 7) % 7;
    const len = Cal.monthLength(y, m);
    const sel = Cal.split(tm.date);
    let cells = Cal.weekdayShort().map(d => `<div class="wd">${d}</div>`).join('');
    cells += '<div></div>'.repeat(offset);
    for (let d = 1; d <= len; d++) {
      const wd = (Cal.weekday(first) + d - 1) % 7;
      const cls = [
        Cal.isWeekend(wd) ? 'fri' : '',
        y === today.y && m === today.m && d === today.d ? 'today' : '',
        y === sel.y && m === sel.m && d === sel.d ? 'sel' : '',
      ].join(' ');
      cells += `<button class="${cls}" data-d="${d}">${dg(d)}</button>`;
    }
    $('#datepicker').innerHTML = `<div class="dp-head">
      <button class="icon-btn" data-m="-1"><svg class="flip-ltr" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button>
      <span>${monthYear(y, m)}</span>
      <button class="icon-btn" data-m="1"><svg class="flip-ltr" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></button></div>
      <div class="dp-grid">${cells}</div>`;
    $$('#datepicker [data-m]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      let { y: yy, m: mm } = tm.dp; mm += +b.dataset.m;
      if (mm > 12) { mm = 1; yy++; } if (mm < 1) { mm = 12; yy--; }
      tm.dp = { y: yy, m: mm }; renderPicker();
    });
    $$('#datepicker [data-d]').forEach(b => b.onclick = () => { setDate(Cal.join(y, m, +b.dataset.d)); $('#datepicker').classList.remove('open'); });
  }
  $('#txDateBtn').onclick = e => {
    e.stopPropagation();
    const dp = $('#datepicker');
    if (dp.classList.toggle('open')) { const p = Cal.split(tm.date); tm.dp = { y: p.y, m: p.m }; renderPicker(); }
  };
  document.addEventListener('mousedown', e => { if (!e.target.closest('.date-field')) $('#datepicker').classList.remove('open'); });

  const amountInput = $('#txAmount');
  function parseAmount() { return +toEn(amountInput.value).replace(/[^\d]/g, '') || 0; }
  const amountWords = n => { const w = words(n); return w ? `${w} ${unit()}`.trim() : ''; };
  amountInput.addEventListener('input', () => {
    const n = parseAmount();
    amountInput.value = n ? num(n) : '';
    $('#txWords').textContent = amountWords(n);
  });

  function openTxModal(tx) {
    tm.editing = tx || null;
    $('#txModalTitle').textContent = t(tx ? 'tx.edit' : 'tx.new');
    $('#txDelete').style.display = tx ? '' : 'none';
    $('#txUnit').textContent = unit();
    tm.cat = tx ? tx.categoryId : null;
    setTxType(tx ? tx.type : (tm.lastType || 'expense'));
    // default date: today, or the 1st of the viewed month if viewing another month
    const today = TD();
    const viewingCur = state.month.y === today.y && state.month.m === today.m;
    setDate(tx ? tx.date : viewingCur ? Cal.todayISO() : Cal.join(state.month.y, state.month.m, 1));
    amountInput.value = tx ? num(tx.amount) : '';
    $('#txWords').textContent = tx ? amountWords(tx.amount) : '';
    $('#txNote').value = tx ? tx.note || '' : '';
    $('#datepicker').classList.remove('open');
    openModal('#txModal');
    setTimeout(() => amountInput.focus(), 60);
  }
  function saveTx() {
    const amount = parseAmount();
    if (!amount) { amountInput.focus(); return toast(t('enterAmount'), { error: true }); }
    if (!tm.cat) return toast(t('pickCat'), { error: true });
    const rec = { type: tm.type, amount, categoryId: tm.cat, date: tm.date, note: $('#txNote').value.trim() };
    if (tm.editing) Object.assign(tm.editing, rec);
    else state.data.transactions.push({ id: uid(), createdAt: Date.now(), ...rec });
    tm.lastType = tm.type;
    persist(); closeModal('#txModal');
    // jump to the month of the saved transaction so the user sees it
    const p = Cal.split(rec.date); state.month = { y: p.y, m: p.m };
    render();
    toast(tm.editing ? t('changesSaved') : t('added', typeName(tm.type), money(amount)));
  }
  function deleteTx(id) {
    const i = state.data.transactions.findIndex(x => x.id === id);
    if (i < 0) return;
    const [removed] = state.data.transactions.splice(i, 1);
    persist(); render();
    toast(t('txDeleted'), { action: { label: t('undo'), fn: () => { state.data.transactions.push(removed); persist(); render(); } } });
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
    $('#catModalTitle').textContent = c ? t('editCat') : t('newCatOf', typeName(cm.type));
    $('#catName').value = c ? catName(c) : '';
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
    if (!name) return toast(t('catNameReq'), { error: true });
    if (state.data.categories.some(c => c.type === cm.type && catName(c) === name && c !== cm.editing)) return toast(t('catExists'), { error: true });
    if (cm.editing) {
      const c = cm.editing;
      // renaming a built-in category turns it into a custom name in every language
      if (name !== catName(c)) { c.name = name; delete c.key; }
      Object.assign(c, { icon: cm.icon, color: cm.color });
    } else {
      const c = { id: uid(), name, type: cm.type, icon: cm.icon, color: cm.color };
      state.data.categories.push(c);
      if (cm.fromTx) tm.cat = c.id;
    }
    persist(); closeModal('#catModal');
    if (cm.fromTx) renderChips();
    render(); toast(t('catSaved'));
  }
  $('#catSave').onclick = saveCat;
  $('#catModal').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveCat(); } });
  $('#catDelete').onclick = async () => {
    const c = cm.editing;
    const used = state.data.transactions.filter(x => x.categoryId === c.id);
    const others = state.data.categories.filter(x => x.type === c.type && x.id !== c.id);
    if (!others.length) return toast(t('keepOne'), { error: true });
    if (used.length) {
      const target = others.find(x => x.key === 'other') || others[0];
      const ok = await confirmBox(t('delCatTitle'), t('delCatText', dg(used.length), catName(c), catName(target)), [
        { label: t('cancel'), value: false }, { label: t('delMove'), value: true, cls: 'danger' }]);
      if (!ok) return;
      used.forEach(x => x.categoryId = target.id);
    }
    state.data.categories = state.data.categories.filter(x => x.id !== c.id);
    persist(); closeModal('#catModal'); render(); toast(t('catDeleted'));
  };

  // ---------- export / import ----------
  const stamp = () => { const p = TD(); return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`; };
  $('#expJson').onclick = async () => {
    const r = await api.exportFile({ kind: 'json', defaultName: `daftar-backup-${stamp()}.json`, content: JSON.stringify({ app: 'daftar', exportedAt: new Date().toISOString(), ...state.data }, null, 2) });
    if (r.ok) toast(t('backupSaved'));
  };
  const csvCell = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  $('#expCsv').onclick = async () => {
    const head = t('csvHead');
    const rows = sortTx(state.data.transactions).reverse().map(x => [J.format(x.date), x.date, isFa() ? typeName(x.type) : x.type, catName(catById(x.categoryId)), x.amount, x.note]);
    const csv = '﻿' + [head, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
    const r = await api.exportFile({ kind: 'csv', defaultName: `daftar-${stamp()}.csv`, content: csv });
    if (r.ok) toast(t('csvSaved'));
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
    if (rows.length < 2) throw new Error(t('emptyFile'));
    const head = rows[0].map(h => h.trim().toLowerCase());
    const col = keys => head.findIndex(h => keys.some(k => h.includes(k)));
    const ci = { date: col(['تاریخ', 'date']), type: col(['نوع', 'type']), cat: col(['دسته', 'category']), amount: col(['مبلغ', 'amount', 'مقدار']), note: col(['توضیح', 'note', 'شرح', 'description']) };
    if (ci.date < 0 || ci.amount < 0) throw new Error(t('noCols'));
    let added = 0, skipped = 0, newCats = 0;
    for (const r of rows.slice(1)) {
      const date = J.parse(r[ci.date] || '');
      let amt = +toEn(r[ci.amount] || '').replace(/[^\d.\-]/g, '');
      if (!date || !amt) { skipped++; continue; }
      const tv = ci.type >= 0 ? (r[ci.type] || '').trim().toLowerCase() : '';
      let type = /درآمد|income|دریافت|واریز/.test(tv) ? 'income' : 'expense';
      if (ci.type < 0 && amt > 0) type = 'income';
      amt = Math.abs(amt);
      const cname = (ci.cat >= 0 ? r[ci.cat] : '').trim();
      // match custom names, or a built-in category in either language
      let cat = cname
        ? state.data.categories.find(c => c.type === type && (c.name === cname || (c.key && DEFAULT_CATS[c.key] && (DEFAULT_CATS[c.key].fa === cname || DEFAULT_CATS[c.key].en === cname))))
        : state.data.categories.find(c => c.type === type && c.key === 'other');
      if (!cat) {
        cat = { id: uid(), name: cname || DEFAULT_CATS.other[lang], type, icon: '✨', color: PALETTE[state.data.categories.length % PALETTE.length] };
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
        if (!Array.isArray(d.transactions) || !Array.isArray(d.categories)) throw new Error(t('badBackup'));
        const mode = await confirmBox(t('impTitle'), t('impText', dg(d.transactions.length), f.name), [
          { label: t('cancel'), value: null }, { label: t('merge'), value: 'merge' }, { label: t('replace'), value: 'replace', cls: 'danger' }]);
        if (!mode) return;
        migrate(d);
        if (mode === 'replace') {
          // keep this device's language and calendar
          const { lang: l, calendar } = state.data.settings;
          state.data = { version: 1, settings: { ...state.data.settings, ...d.settings, lang: l, calendar }, categories: d.categories, transactions: d.transactions };
        } else {
          const cats = new Set(state.data.categories.map(c => c.id));
          d.categories.forEach(c => { if (!cats.has(c.id)) state.data.categories.push(c); });
          const ids = new Set(state.data.transactions.map(x => x.id));
          let n = 0; d.transactions.forEach(x => { if (!ids.has(x.id)) { state.data.transactions.push(x); n++; } });
          toast(t('merged', dg(n)));
        }
        applyTheme(); persist(); render();
        if (mode === 'replace') toast(t('restored'));
      } else {
        const r = importCSV(f.content);
        persist(); render();
        toast(t('csvDone', dg(r.added), r.newCats ? dg(r.newCats) : 0, r.skipped ? dg(r.skipped) : 0));
      }
    } catch (e) {
      toast(e instanceof SyntaxError ? t('unreadable') : e.message, { error: true });
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
    state.data = migrate(d);
    applyLang();
    applyTheme();
    resetToToday();
    document.fonts.ready.then(() => go('dashboard'));
  })();
})();
