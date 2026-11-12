// Calendar layer: the app works with ISO dates (YYYY-MM-DD) and shows them
// in either the Persian (Jalali) or the Gregorian calendar.
(function () {
  const pad = n => String(n).padStart(2, '0');

  const engines = {
    jalali: {
      split(iso) { const j = J.toJ(iso); return { y: j.jy, m: j.jm, d: j.jd }; },
      join: (y, m, d) => J.toISO(y, m, d),
      monthLength: (y, m) => J.monthLength(y, m),
    },
    gregorian: {
      split(iso) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; },
      join: (y, m, d) => `${y}-${pad(m)}-${pad(d)}`,
      monthLength: (y, m) => new Date(y, m, 0).getDate(),
    },
  };

  const MONTHS = {
    jalali: {
      fa: J.MONTHS,
      en: ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'],
    },
    gregorian: {
      fa: ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    },
  };
  // index 0 = Saturday
  const WEEKDAYS = {
    fa: J.WEEKDAYS,
    en: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  };
  const WEEKDAYS_SHORT = {
    fa: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
    en: ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'],
  };

  const Cal = {
    kind: 'jalali',
    lang: 'fa',
    set(kind, lang) { this.kind = engines[kind] ? kind : 'jalali'; this.lang = lang === 'en' ? 'en' : 'fa'; },
    split(iso) { return engines[this.kind].split(iso); },
    join(y, m, d) { return engines[this.kind].join(y, m, d); },
    monthLength(y, m) { return engines[this.kind].monthLength(y, m); },
    months() { return MONTHS[this.kind][this.lang]; },
    monthName(m) { return MONTHS[this.kind][this.lang][m - 1]; },
    todayISO: () => J.todayISO(),
    today() { return this.split(J.todayISO()); },
    addDays: (iso, n) => J.addDays(iso, n),
    weekday: iso => J.weekday(iso),                    // 0 = Saturday
    weekdayName(iso) { return WEEKDAYS[this.lang][J.weekday(iso)]; },
    // Persian weeks start on Saturday, English weeks on Monday
    weekStart() { return this.lang === 'fa' ? 0 : 2; },
    weekdayShort() { const s = this.weekStart(), a = WEEKDAYS_SHORT[this.lang]; return a.slice(s).concat(a.slice(0, s)); },
    isWeekend(idx) { return this.lang === 'fa' ? idx === 6 : idx === 0 || idx === 1; },
    // numeric date for lists and exports (ASCII digits)
    format(iso) {
      const p = this.split(iso);
      return this.kind === 'jalali' ? `${p.y}/${pad(p.m)}/${pad(p.d)}` : `${p.y}-${pad(p.m)}-${pad(p.d)}`;
    },
  };
  window.Cal = Cal;
})();
