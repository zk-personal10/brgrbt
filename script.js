/* BURGER BITE — keynote engine
   Slides + in-slide builds ("steps"). No scrolling anywhere. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM) document.documentElement.classList.add('rm');

  const deck = $('#deck');
  const slides = $$('.slide', deck);
  const N = slides.length;
  const stepsOf = slides.map(s => +s.dataset.steps || 1);
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };

  let cur = -1, step = 0, busy = false, pending = null;

  /* ---------- preparation ---------- */
  // split headings into masked words
  $$('[data-split]').forEach(el => {
    const label = el.getAttribute('aria-label') || el.textContent.trim();
    el.setAttribute('aria-label', label);
    const br = (el.dataset.br || '').split(',').map(Number);
    el.innerHTML = label.split(/\s+/).map((w, i) =>
      `<span class="w" aria-hidden="true"><span class="wi" style="--i:${i}">${w}</span></span>` + (br.includes(i + 1) ? '<br>' : ' ')).join('');
  });
  // indices for staggered CSS
  const indexKids = (sel, prop = '--k') => $$(sel).forEach((el, i) => el.style.setProperty(prop, i));
  indexKids('.swatches .sw', '--k');
  slides.forEach(sl => {
    $$('.pin-dot', sl).forEach((e, i) => e.style.setProperty('--k', i));
    $$('.cal i', sl).forEach((e, i) => e.style.setProperty('--k', i));
  });
  $$('.mgroup').forEach(g => $$('.mock', g).forEach((m, i) => { m.style.setProperty('--k', i); m.style.setProperty('--r', (i % 2 ? 2 : -2) + 'deg'); }));
  // auto stagger for generic reveals
  slides.forEach(sl => $$('.rv', sl).forEach((el, i) => { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (0.55 + i * 0.11).toFixed(2) + 's'); }));
  $$('.s2 .wi').forEach(el => el.style.setProperty('--d0', '.5s'));

  // progress bar
  const bar = $('#bar');
  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Go to slide ${i + 1}: ${s.dataset.title}`);
    b.innerHTML = '<i></i>';
    b.addEventListener('click', () => go(i, 0));
    bar.appendChild(b);
  });
  $('#cAll').textContent = String(N).padStart(2, '0');

  /* ---------- fit text blocks to the viewport ---------- */
  function fit(el) {
    const fw = +el.dataset.fw || .9, fh = +el.dataset.fh || .7, lh = +el.dataset.lh || 1;
    const lines = [...el.children];
    el.style.fontSize = '100px';
    let maxW = 1, weight = 0;
    lines.forEach(l => {
      const kids = [...l.children].filter(k => getComputedStyle(k).position !== 'absolute');
      if (kids.length > 1) { // composite line (Boring? / Not here.)
        const r = kids.map(k => k.getBoundingClientRect());
        maxW = Math.max(maxW, Math.max(...r.map(x => x.right)) - Math.min(...r.map(x => x.left)));
        weight += .72;
      } else {
        const s = l.firstElementChild;
        s.style.display = 'inline-block';
        maxW = Math.max(maxW, s.getBoundingClientRect().width);
        s.style.display = '';
        weight += 1;
      }
    });
    const vw = deck.clientWidth, vh = deck.clientHeight;
    const fs = Math.min(100 * (vw * fw) / maxW, (vh * fh) / (weight * lh));
    el.style.fontSize = fs.toFixed(1) + 'px';
    el.style.setProperty('--shift', (fs * lh).toFixed(1) + 'px');
    const bt = $('.bt', el);
    if (bt) el.style.setProperty('--bw', (bt.offsetWidth + fs * .06) + 'px');
  }
  const fitAll = () => $$('[data-fit]').forEach(fit);

  /* ---------- HUD ---------- */
  const cNow = $('#cNow'), cTitle = $('#cTitle'), prevB = $('#prev'), nextB = $('#next'), live = $('#live');
  function setTone(t) { document.body.dataset.tone = t; }
  function hud() {
    const sl = slides[cur];
    cNow.textContent = String(cur + 1).padStart(2, '0');
    cTitle.textContent = sl.dataset.title;
    $$('button', bar).forEach((b, i) => {
      const f = i < cur ? 1 : i === cur ? (step + 1) / stepsOf[i] : 0;
      b.firstElementChild.style.setProperty('--f', f);
      b.toggleAttribute('aria-current', i === cur);
    });
    document.body.classList.toggle('no-mark', cur === 0 || cur === N - 1);
    prevB.disabled = cur === 0 && step === 0;
    nextB.disabled = cur === N - 1 && step === stepsOf[cur] - 1;
    history.replaceState(null, '', '#' + (cur + 1));
  }

  /* ---------- per-slide behaviour ---------- */
  const H = {};

  // 02 — the idea: statement, then spotlight builds
  const ZONES = [null, [0, 0, 100, 100], [10, 11, 80, 31], [9, 38, 82, 27], [14, 60, 74, 31], [0, 0, 100, 100]];
  H.s2 = {
    step(sl, k) {
      sl.classList.toggle('view', k >= 1);
      const sp = $('.spotlight', sl), z = ZONES[k];
      if (z) {
        ['--l', '--t', '--w', '--h'].forEach((p, i) => sp.style.setProperty(p, z[i] + '%'));
        sp.classList.toggle('whole', k === 1 || k === 5);
      }
      $$('.cap', sl).forEach(c => c.classList.toggle('on', +c.dataset.k === k - 1));
    }
  };

  // 03 — anatomy
  H.s3 = {
    step(sl, k) {
      $$('.pin-dot,.anat-list li', sl).forEach(e => e.classList.toggle('on', +e.dataset.k === k));
      $('.bracket', sl).classList.toggle('on', k === 4);
    }
  };

  // 04 — personality: auto-played kinetic sequence
  H.s4 = {
    step(sl, k) { if (k === 0) { $$('.pw', sl).forEach(e => e.classList.remove('on')); $('.boring', sl).classList.remove('on', 'struck'); } },
    enter(sl) {
      const words = $$('.pw', sl), boring = $('.boring', sl);
      if (RM) { words.forEach(w => w.classList.add('on')); boring.classList.add('on', 'struck'); return; }
      const t0 = 700, gap = 560;
      words.forEach((w, i) => later(() => w.classList.add('on'), t0 + i * gap));
      later(() => boring.classList.add('on'), t0 + words.length * gap + 500);
      later(() => boring.classList.add('struck'), t0 + words.length * gap + 1500);
    },
    leave() { clearTimers(); }
  };

  // 05 — colour: swatches, then full-viewport takeovers
  H.s5 = {
    step(sl, k) {
      const ps = $$('.cpanel', sl);
      ps.forEach((p, i) => p.classList.toggle('on', i < k));
      sl.classList.toggle('take', k > 0);
      if (k > 0) setTone(ps[k - 1].dataset.tone); else setTone(sl.dataset.tone);
    }
  };

  // 06 — slogan
  H.s6 = { step(sl, k) { sl.classList.toggle('b2', k >= 1); } };

  // 07 — count-up
  H.s7 = {
    enter(sl) {
      $$('.count', sl).forEach(el => {
        const to = +el.dataset.to, dec = +el.dataset.dec || 0;
        if (RM) { el.textContent = to.toFixed(dec); return; }
        const t0 = performance.now() + 1100, dur = 1200;
        const tick = now => {
          const p = clamp((now - t0) / dur, 0, 1);
          el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec);
          if (p < 1 && cur === 6) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    step(sl) { $$('.count', sl).forEach(el => { el.textContent = (0).toFixed(+el.dataset.dec || 0); }); }
  };

  // 08 — real world, one category per build
  H.s8 = {
    step(sl, k) {
      $$('.mgroup', sl).forEach(g => g.classList.toggle('on', +g.dataset.k === k));
      $$('.chip', sl).forEach(c => c.classList.toggle('on', +c.dataset.k === k));
    }
  };
  $$('.chip').forEach(c => c.addEventListener('click', () => { if (cur === 7) setStep(+c.dataset.k); }));

  // 10 — scale test
  const scObj = $('#scObj'), scImg = $('#scaleLogo'), scName = $('#scName'), scSize = $('#scSize'), rail = $('#rail');
  const NAMES = ['Billboard', 'Store sign', 'Packaging', 'Phone icon', 'Favicon'];
  const SRC = { l: 'assets/burger-bite-logo-1024.png', m: 'assets/burger-bite-logo-512.png', s: 'assets/burger-bite-logo-256.png' };
  Object.values(SRC).forEach(u => { const i = new Image(); i.src = u; });
  let scW = 0, scB = 0, scRaf = 0;
  const pick = w => (w > 360 ? SRC.l : w > 150 ? SRC.m : SRC.s);
  const baseSize = () => Math.min(innerHeight, innerWidth) * 1.12;
  function widths() {
    const B = baseSize(), k = clamp(innerWidth / 900, .55, 1);
    return [B, Math.min(B * .42, 320 * k), Math.max(90, 140 * k), 56, 16];
  }
  function noT(on) { scObj.classList.toggle('no-t', on); }
  function scaleTo(i, instant) {
    const w = widths()[i], B = baseSize();
    cancelAnimationFrame(scRaf);
    later.cancelSettle && later.cancelSettle();
    // un-settle: back to the large base so we can animate by transform
    noT(true);
    scObj.style.fontSize = B + 'px';
    scImg.src = SRC.l;
    scObj.style.setProperty('--s', (scW || B) / B);
    void scObj.offsetWidth;
    noT(false);
    if (instant || RM) { noT(true); scObj.style.setProperty('--s', w / B); void scObj.offsetWidth; noT(false); }
    else scObj.style.setProperty('--s', w / B);
    // readout counts toward the new size
    const from = scW || B, t0 = performance.now(), dur = instant || RM ? 1 : 1200;
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const tick = now => {
      const p = clamp((now - t0) / dur, 0, 1);
      scSize.textContent = Math.round(from + (w - from) * ease(p)).toLocaleString('en-US') + ' px wide';
      if (p < 1) scRaf = requestAnimationFrame(tick);
    };
    scRaf = requestAnimationFrame(tick);
    scW = w; scB = B;
    // settle on a crisp, natively sized render once the move ends
    const t = setTimeout(() => {
      if (cur !== 9) return;
      noT(true);
      scObj.style.fontSize = w + 'px';
      scObj.style.setProperty('--s', 1);
      scImg.src = pick(w);
      void scObj.offsetWidth;
      noT(false);
    }, instant || RM ? 30 : 1300);
    later.cancelSettle = () => clearTimeout(t);
  }
  H.s10 = {
    step(sl, k, prev, instant) {
      sl.dataset.i = k;
      if (scName.textContent !== NAMES[k]) {
        scName.textContent = NAMES[k];
        const lab = $('.sc-label', sl); lab.classList.remove('swap'); void lab.offsetWidth; lab.classList.add('swap');
      }
      $$('button', rail).forEach(b => b.classList.toggle('on', +b.dataset.i === k));
      scaleTo(k, instant);
    },
    leave() { cancelAnimationFrame(scRaf); later.cancelSettle && later.cancelSettle(); scW = 0; }
  };
  rail.addEventListener('click', e => { const b = e.target.closest('button'); if (b && cur === 9) setStep(+b.dataset.i); });

  // 11 — finale
  const fin = $('#finLogo');
  function chomp() { fin.classList.remove('chomp'); void fin.offsetWidth; fin.classList.add('chomp'); }
  fin.addEventListener('click', chomp);
  H.s11 = {
    enter() { later(chomp, RM ? 0 : 4300); },
    leave() { fin.classList.remove('chomp'); }
  };
  $('#replay').addEventListener('click', () => go(0, 0));

  // swatch copy
  const toast = $('#toast');
  $('#swatches').addEventListener('click', async e => {
    const b = e.target.closest('.sw'); if (!b) return;
    const hex = b.dataset.hex;
    try { await navigator.clipboard.writeText(hex); } catch (_) {
      const ta = document.createElement('textarea'); ta.value = hex; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (__) {} ta.remove();
    }
    toast.textContent = hex + ' copied';
    toast.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('on'), 1600);
  });

  /* ---------- slide transitions ---------- */
  const T = {
    wipe: d => ({ i: [{ clipPath: d > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
                  o: [{ transform: 'none', filter: 'brightness(1)' }, { transform: `translateX(${-9 * d}%)`, filter: 'brightness(.5)' }] }),
    rise: d => ({ i: [{ clipPath: d > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
                  o: [{ transform: 'none', filter: 'brightness(1)' }, { transform: `translateY(${-10 * d}%) scale(.96)`, filter: 'brightness(.55)' }] }),
    push: d => ({ i: [{ transform: `translateX(${100 * d}%)` }, { transform: 'none' }],
                  o: [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-26 * d}%)`, opacity: .45 }] }),
    circle: () => ({ i: [{ clipPath: 'circle(0% at 50% 52%)' }, { clipPath: 'circle(80% at 50% 52%)' }],
                     o: [{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }] }),
    zoom: () => ({ i: [{ opacity: 0, transform: 'scale(1.14)' }, { opacity: 1, transform: 'none' }],
                   o: [{ transform: 'none', opacity: 1 }, { transform: 'scale(.9)', opacity: 0 }] }),
    bite: () => ({ i: [{ clipPath: 'circle(0% at 50% 100%)' }, { clipPath: 'circle(150% at 50% 100%)' }],
                   o: [{ transform: 'none' }, { transform: 'translateY(-4%)' }] })
  };
  T.none = T.zoom;

  function prime(sl, k) {
    sl.classList.add('notr');
    sl.classList.remove('in');
    const h = H[sl.dataset.id];
    h && h.step && h.step(sl, k, k, true);
    sl.dataset.step = k;
    void sl.offsetWidth;
    sl.classList.remove('notr');
  }
  function reset(sl) {
    const h = H[sl.dataset.id];
    h && h.leave && h.leave(sl);
    prime(sl, 0);
    sl.classList.remove('show');
    sl.inert = true; sl.setAttribute('aria-hidden', 'true');
    sl.style.zIndex = '';
  }

  function go(i, st = 0) {
    i = clamp(i, 0, N - 1);
    if (i === cur) { setStep(st); return; }
    if (busy) { pending = [i, st]; return; }
    const from = cur, inc = slides[i], out = from >= 0 ? slides[from] : null;
    const dir = from < 0 || i > from ? 1 : -1;
    busy = true; pending = null;
    clearTimers();
    cur = i; step = st;
    prime(inc, st);
    inc.classList.add('show'); inc.inert = false; inc.removeAttribute('aria-hidden');
    inc.style.zIndex = 3; if (out) out.style.zIndex = 2;
    setTone(inc.dataset.tone);
    const h = H[inc.dataset.id];
    if (h && h.step) h.step(inc, st, st, true);
    hud();
    live.textContent = `Slide ${i + 1} of ${N}: ${inc.dataset.title}`;
    const dur = !out || RM ? 0 : 1050;
    const kf = (T[inc.dataset.tr] || T.zoom)(dir);
    let anims = [];
    if (out && dur) {
      const opt = { duration: dur, easing: 'cubic-bezier(.77,0,.18,1)', fill: 'both' };
      anims = [inc.animate(kf.i, opt), out.animate(kf.o, opt)];
    }
    const start = () => { inc.classList.add('in'); h && h.enter && h.enter(inc); };
    if (dur) later(start, dur * .55); else later(start, 30);
    const done = () => {
      anims.forEach(a => a.cancel());
      if (out) reset(out);
      inc.style.zIndex = '';
      busy = false;
      if (pending) { const [pi, ps] = pending; pending = null; go(pi, ps); }
    };
    if (dur) Promise.all(anims.map(a => a.finished)).then(done).catch(done); else done();
  }

  function setStep(k) {
    k = clamp(k, 0, stepsOf[cur] - 1);
    if (k === step) return;
    const prev = step; step = k;
    const sl = slides[cur];
    sl.dataset.step = k;
    const h = H[sl.dataset.id];
    h && h.step && h.step(sl, k, prev, false);
    hud();
  }

  const next = () => { if (busy) { pending = cur + 1 < N ? [cur + 1, 0] : null; if (step < stepsOf[cur] - 1) { pending = null; setStep(step + 1); } return; }
    if (step < stepsOf[cur] - 1) setStep(step + 1); else if (cur < N - 1) go(cur + 1, 0); };
  const prev = () => { if (step > 0) setStep(step - 1); else if (cur > 0) go(cur - 1, stepsOf[cur - 1] - 1); };

  /* ---------- input ---------- */
  nextB.addEventListener('click', next);
  prevB.addEventListener('click', prev);
  $('#fs').addEventListener('click', toggleFs);
  function toggleFs() {
    if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
    else (document.documentElement.requestFullscreen || (() => {})).call(document.documentElement);
  }
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const onCtl = e.target.closest && e.target.closest('button,a');
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': e.preventDefault(); prev(); break;
      case ' ': case 'Enter':
        if (onCtl) return;
        e.preventDefault(); e.shiftKey ? prev() : next(); break;
      case 'Home': e.preventDefault(); go(0, 0); break;
      case 'End': e.preventDefault(); go(N - 1, 0); break;
      case 'f': case 'F': toggleFs(); break;
    }
  });
  let tx = 0, ty = 0, tt = 0;
  addEventListener('touchstart', e => { const t = e.changedTouches[0]; tx = t.clientX; ty = t.clientY; tt = Date.now(); }, { passive: true });
  addEventListener('touchend', e => {
    const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2 && Date.now() - tt < 900) dx < 0 ? next() : prev();
  }, { passive: true });
  addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (n >= 1 && n <= N && n - 1 !== cur) go(n - 1, 0); });
  addEventListener('resize', () => { fitAll(); if (cur === 9) scaleTo(step, true); });

  // gentle pointer tilt on the hero / finale logo
  if (matchMedia('(hover:hover)').matches && !RM) {
    addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      $$('.tilt').forEach(el => { el.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg'); });
    }, { passive: true });
  }

  /* ---------- boot ---------- */
  slides.forEach(s => { s.inert = true; s.setAttribute('aria-hidden', 'true'); });
  const hero = $('.s1-logo img');
  const ready = Promise.race([
    Promise.all([document.fonts ? document.fonts.ready : 0, hero.decode ? hero.decode().catch(() => {}) : 0]),
    new Promise(r => setTimeout(r, 1800))
  ]);
  ready.then(() => {
    fitAll();
    const n = parseInt(location.hash.slice(1), 10);
    go(n >= 1 && n <= N ? n - 1 : 0, 0);
  });
  if (document.fonts) document.fonts.ready.then(fitAll);
})();
