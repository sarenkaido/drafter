// Lightweight canvas charts (no dependencies, works offline)
(function () {
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  function setup(canvas, h) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    if (!canvas.dataset.h) canvas.dataset.h = canvas.getAttribute('height') || 240;
    const height = h || +canvas.dataset.h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h: height };
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, Math.abs(h) / 2);
    if (h <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * p;
  }

  // Grouped bars: series = [{values, color}], labels = [], fmt = number formatter
  function bars(canvas, { labels, series, fmtAxis, fmtTip, tipTitle, labelEvery = 1, rtl = true }) {
    const state = { hover: -1 };
    function draw() {
      const { ctx, w, h } = setup(canvas);
      const font = css('--font');
      const muted = css('--muted');
      const grid = css('--grid');
      // value labels sit on the right in RTL and on the left in LTR
      const padL = rtl ? 12 : 64, padR = rtl ? 64 : 12, padT = 14, padB = 30;
      const cw = w - padL - padR, ch = h - padT - padB;
      const maxV = niceMax(Math.max(1, ...series.flatMap(s => s.values)));
      ctx.clearRect(0, 0, w, h);
      ctx.font = `11px ${font}`;
      ctx.textBaseline = 'middle';
      // grid
      for (let i = 0; i <= 4; i++) {
        const y = padT + ch - (ch * i) / 4;
        ctx.strokeStyle = grid; ctx.lineWidth = 1;
        ctx.setLineDash(i === 0 ? [] : [3, 4]);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + cw, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = muted; ctx.textAlign = rtl ? 'left' : 'right';
        ctx.fillText(fmtAxis((maxV * i) / 4), rtl ? padL + cw + 8 : padL - 8, y);
      }
      const n = labels.length;
      const slot = cw / n;
      const every = Math.max(labelEvery, Math.ceil(26 / slot));
      const groupW = Math.min(slot * 0.72, 46);
      const bw = groupW / series.length;
      // RTL: first label at the right; LTR: first label at the left
      const cxOf = i => rtl ? padL + cw - slot * (i + 0.5) : padL + slot * (i + 0.5);
      for (let i = 0; i < n; i++) {
        const cx = cxOf(i);
        if (state.hover === i) {
          ctx.fillStyle = css('--hover');
          roundRect(ctx, cx - slot / 2 + 1, padT, slot - 2, ch, 6);
        }
        series.forEach((s, si) => {
          const v = s.values[i];
          const bh = (v / maxV) * ch;
          const x = rtl ? cx + groupW / 2 - bw * (si + 1) : cx - groupW / 2 + bw * si;
          ctx.fillStyle = s.color;
          ctx.globalAlpha = state.hover === -1 || state.hover === i ? 1 : 0.45;
          roundRect(ctx, x + 1, padT + ch - bh, Math.max(2, bw - 2), bh, 4);
          ctx.globalAlpha = 1;
        });
        if (i % every === 0 || state.hover === i) {
          ctx.fillStyle = state.hover === i ? css('--text') : muted;
          ctx.textAlign = 'center';
          ctx.fillText(labels[i], cx, padT + ch + 16);
        }
      }
      // tooltip
      if (state.hover >= 0) {
        const i = state.hover;
        const lines = series.map(s => ({ color: s.color, text: fmtTip(s, s.values[i]) }));
        const title = tipTitle ? tipTitle(i) : labels[i];
        ctx.font = `600 12px ${font}`;
        const tw = Math.max(ctx.measureText(title).width, ...lines.map(l => ctx.measureText(l.text).width + 16)) + 24;
        const th = 26 + lines.length * 20;
        let tx = cxOf(i) - tw / 2;
        tx = Math.max(4, Math.min(w - tw - 4, tx));
        const ty = padT + 4;
        ctx.fillStyle = css('--tip-bg');
        ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 10); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.textAlign = rtl ? 'right' : 'left';
        ctx.fillStyle = css('--text');
        ctx.fillText(title, rtl ? tx + tw - 12 : tx + 12, ty + 15);
        ctx.font = `12px ${font}`;
        lines.forEach((l, k) => {
          const y = ty + 36 + k * 20;
          ctx.fillStyle = l.color;
          ctx.beginPath(); ctx.arc(rtl ? tx + tw - 16 : tx + 16, y, 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = css('--text');
          ctx.fillText(l.text, rtl ? tx + tw - 26 : tx + 26, y);
        });
      }
      canvas._geom = { padL, cw, slot, n, rtl };
    }
    canvas.style.touchAction = 'pan-y';
    canvas.onpointerdown = canvas.onpointermove = e => {
      const g = canvas._geom; if (!g) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const i = Math.floor((g.rtl ? g.padL + g.cw - x : x - g.padL) / g.slot);
      const hv = i >= 0 && i < g.n ? i : -1;
      if (hv !== state.hover) { state.hover = hv; draw(); }
    };
    canvas.onpointerleave = e => { if (e.pointerType === 'mouse') { state.hover = -1; draw(); } };
    draw();
    canvas._redraw = draw;
  }

  // Donut: items = [{value, color}]
  function donut(canvas, items, hoverCb) {
    const state = { hover: -1 };
    function draw() {
      const size = canvas.clientWidth || 220;
      const { ctx } = setup(canvas, size);
      const cx = size / 2, cy = size / 2, R = size / 2 - 6, r = R - 26;
      ctx.clearRect(0, 0, size, size);
      const total = items.reduce((a, b) => a + b.value, 0);
      if (!total) {
        ctx.strokeStyle = css('--grid'); ctx.lineWidth = 26;
        ctx.beginPath(); ctx.arc(cx, cy, (R + r) / 2, 0, Math.PI * 2); ctx.stroke();
        return;
      }
      let a = -Math.PI / 2;
      const gap = items.length > 1 ? 0.025 : 0;
      canvas._arcs = [];
      items.forEach((it, i) => {
        const ang = (it.value / total) * Math.PI * 2;
        const grow = state.hover === i ? 5 : 0;
        ctx.strokeStyle = it.color;
        ctx.globalAlpha = state.hover === -1 || state.hover === i ? 1 : 0.35;
        ctx.lineWidth = R - r + grow;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.arc(cx, cy, (R + r) / 2, a + gap / 2, a + ang - gap / 2);
        ctx.stroke();
        canvas._arcs.push([a, a + ang]);
        a += ang;
      });
      ctx.globalAlpha = 1;
    }
    canvas.style.touchAction = 'pan-y';
    canvas.onpointerdown = canvas.onpointermove = e => {
      if (!canvas._arcs) return;
      const rc = canvas.getBoundingClientRect();
      const x = e.clientX - rc.left - rc.width / 2, y = e.clientY - rc.top - rc.height / 2;
      const d = Math.hypot(x, y);
      let ang = Math.atan2(y, x);
      if (ang < -Math.PI / 2) ang += Math.PI * 2;
      let hv = -1;
      if (d > rc.width / 2 - 40 && d < rc.width / 2) hv = canvas._arcs.findIndex(([s, e2]) => ang >= s && ang < e2);
      if (hv !== state.hover) { state.hover = hv; draw(); hoverCb && hoverCb(hv); }
    };
    canvas.onpointerleave = e => { if (e.pointerType === 'mouse') { state.hover = -1; draw(); hoverCb && hoverCb(-1); } };
    draw();
    canvas._redraw = draw;
  }

  window.Charts = { bars, donut };
})();
