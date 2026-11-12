// Jalali (Shamsi) calendar utilities — algorithm from jalaali-js (MIT)
(function () {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const div = (a, b) => ~~(a / b);
  const mod = (a, b) => a - ~~(a / b) * b;

  function jalCal(jy, withoutLeap) {
    const bl = breaks.length, gy = jy + 621;
    let leapJ = -14, jp = breaks[0], jm, jump = 0, leap, n, i;
    for (i = 1; i < bl; i += 1) {
      jm = breaks[i]; jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;
    if (withoutLeap) return { gy, march };
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap, gy, march };
  }
  function g2d(gy, gm, gd) {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }
  function d2g(jdn) {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
  }
  function j2d(jy, jm, jd) {
    const r = jalCal(jy, true);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function d2j(jdn) {
    const gy = d2g(jdn).gy;
    let jy = gy - 621;
    const r = jalCal(jy, false);
    const jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f, jm, jd;
    if (k >= 0) {
      if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy, jm, jd }; }
      k -= 186;
    } else {
      jy -= 1; k += 179;
      if (r.leap === 1) k += 1;
    }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return { jy, jm, jd };
  }

  const pad = n => String(n).padStart(2, '0');
  const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

  const J = {
    MONTHS, WEEKDAYS,
    isLeap: jy => jalCal(jy, false).leap === 0,
    monthLength: (jy, jm) => (jm <= 6 ? 31 : jm <= 11 ? 30 : (jalCal(jy, false).leap === 0 ? 30 : 29)),
    // ISO gregorian 'YYYY-MM-DD' <-> jalali {jy,jm,jd}
    toJ(iso) {
      const [y, m, d] = iso.split('-').map(Number);
      return d2j(g2d(y, m, d));
    },
    toISO(jy, jm, jd) {
      const g = d2g(j2d(jy, jm, jd));
      return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
    },
    todayISO() {
      const t = new Date();
      return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    },
    addDays(iso, n) {
      const [y, m, d] = iso.split('-').map(Number);
      const g = d2g(g2d(y, m, d) + n);
      return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
    },
    // weekday index with Saturday = 0
    weekday(iso) {
      const [y, m, d] = iso.split('-').map(Number);
      return (new Date(y, m - 1, d).getDay() + 1) % 7;
    },
    format(iso) {
      const j = J.toJ(iso);
      return `${j.jy}/${pad(j.jm)}/${pad(j.jd)}`;
    },
    // parse "1403/5/12" (any digits) -> ISO or null
    parse(str) {
      const s = String(str).replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).trim();
      const m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
      if (!m) return null;
      const y = +m[1], mo = +m[2], d = +m[3];
      if (y > 1700) { // gregorian
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
        return `${y}-${pad(mo)}-${pad(d)}`;
      }
      if (mo < 1 || mo > 12 || d < 1 || d > J.monthLength(y, mo)) return null;
      return J.toISO(y, mo, d);
    },
  };
  window.J = J;
})();
