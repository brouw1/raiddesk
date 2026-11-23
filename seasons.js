(function () {
  const params = new URLSearchParams(window.location.search);
  const forcedSeason = params.get('season');
  const month = new Date().getMonth();

  const themes = {
    default: {
      folder: 'default',
      dim: 'rgba(18, 12, 10, 0.35)',
      cardBg: 'rgba(30, 18, 14, 0.48)',
      btnBg: 'rgba(40, 24, 18, 0.55)',
      border: 'rgba(235, 110, 65, 0.24)',
      glow: 'rgba(217, 83, 47, 0.45)',
      isWinter: false
    },
    winter: {
      folder: 'winter',
      dim: 'rgba(10, 14, 24, 0.35)',
      cardBg: 'rgba(14, 22, 36, 0.50)',
      btnBg: 'rgba(18, 30, 48, 0.58)',
      border: 'rgba(125, 211, 252, 0.26)',
      glow: 'rgba(56, 189, 248, 0.5)',
      isWinter: true
    },
    summer: {
      folder: 'summer',
      dim: 'rgba(14, 16, 20, 0.55)',
      cardBg: 'rgba(28, 22, 16, 0.52)',
      btnBg: 'rgba(38, 28, 18, 0.60)',
      border: 'rgba(251, 191, 36, 0.24)',
      glow: 'rgba(245, 158, 11, 0.45)',
      isWinter: false
    }
  };

  let current = 'default';
  if (forcedSeason && themes[forcedSeason]) {
    current = forcedSeason;
  } else if (month === 11 || month === 0 || month === 1) {
    current = 'winter';
  } else if (month >= 5 && month <= 7) {
    current = 'summer';
  }

  const active = themes[current];
  const bgPath = 'theme/' + active.folder + '/fon.webp';
  const btnPath = 'theme/' + active.folder + '/btn.webp';

  const bgLayer = document.createElement('div');
  bgLayer.id = 'season-gpu-bg';
  document.body.prepend(bgLayer);

  const eyeOpenSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const eyeOffSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

  const style = document.createElement('style');
  style.id = 'season-styles';
  style.textContent = [
    '#season-gpu-bg {',
    '  position: fixed; inset: 0; z-index: -1; pointer-events: none; display: none;',
    '  transform: translateZ(0); will-change: transform;',
    '  background: linear-gradient(' + active.dim + ', rgba(10, 12, 18, 0.65)), url("' + bgPath + '") no-repeat center center / cover;',
    '}',
    'body.season-active #season-gpu-bg { display: block; }',
    'html.season-active, body.season-active { background: transparent !important; }',
    'body.season-active header, body.season-active nav {',
    '  background: ' + active.cardBg + ' !important;',
    '  border-bottom: 1px solid ' + active.border + ' !important;',
    '}',
    'body.season-active footer, body.season-active main, body.season-active section, body.season-active aside,',
    'body.season-active [class*="footer"], body.season-active [class*="wrapper"], body.season-active [class*="container"], body.season-active [class*="grid"] {',
    '  background: transparent !important;',
    '}',
    'body.season-active [class*="card"], body.season-active [class*="item"], body.season-active [class*="grid"] > div, body.season-active .season-glass {',
    '  background-color: ' + active.cardBg + ' !important;',
    '  border: 1px solid ' + active.border + ' !important;',
    '}',
    'body.season-active button:not(.season-donate-btn):not(#season-eye-toggle) {',
    '  background-color: ' + active.btnBg + ' !important;',
    '  border: 1px solid ' + active.border + ' !important;',
    '}',
    'body.season-active .season-cold-accent {',
    '  background: linear-gradient(135deg, #38bdf8, #0284c7) !important;',
    '  border-color: #bae6fd !important;',
    '  color: #ffffff !important;',
    '  box-shadow: 0 0 12px rgba(56, 189, 248, 0.45) !important;',
    '}',
    'body.season-active .season-cold-border {',
    '  border-color: #38bdf8 !important;',
    '  background-color: rgba(56, 189, 248, 0.18) !important;',
    '}',
    '#season-snow-canvas {',
    '  position: fixed; inset: 0; width: 100%; height: 100%;',
    '  pointer-events: none; z-index: 9990; display: none;',
    '}',
    'body.season-active #season-snow-canvas { display: block; }',
    '.season-donate-btn {',
    '  position: fixed !important; right: 24px !important; bottom: 24px !important;',
    '  z-index: 9999 !important; background: transparent !important; border: none !important;',
    '  box-shadow: none !important; padding: 0 !important; display: inline-block !important;',
    '  cursor: pointer !important; transition: transform 0.2s ease !important;',
    '}',
    '.season-donate-btn img {',
    '  width: 260px !important; height: auto !important; display: block !important;',
    '}',
    '.season-donate-btn:hover { transform: translateY(-4px) scale(1.03) !important; }',
    '#season-eye-toggle {',
    '  display: inline-flex; align-items: center; gap: 6px; margin-left: auto;',
    '  padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 500;',
    '  color: #e2e8f0; background: rgba(255, 255, 255, 0.06);',
    '  border: 1px solid rgba(255, 255, 255, 0.14); cursor: pointer;',
    '}',
    '#season-eye-toggle:hover { background: rgba(255, 255, 255, 0.12); color: #ffffff; }',
    'body.season-active #season-eye-toggle {',
    '  background: ' + active.btnBg + '; border-color: ' + active.border + ';',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  let donateEl = null;
  let origDonateClass = '';
  let origDonateHTML = '';

  const allLinks = document.querySelectorAll('a, button');
  for (let i = 0; i < allLinks.length; i++) {
    const el = allLinks[i];
    if (el.textContent && el.textContent.toUpperCase().indexOf('ПОДДЕРЖАТЬ') !== -1) {
      donateEl = el;
      origDonateClass = el.className;
      origDonateHTML = el.innerHTML;
      break;
    }
  }

  const eyeBtn = document.createElement('button');
  eyeBtn.id = 'season-eye-toggle';
  eyeBtn.type = 'button';

  const headerContainer = document.querySelector('header, nav');
  if (headerContainer) {
    headerContainer.appendChild(eyeBtn);
  } else {
    eyeBtn.style.position = 'fixed';
    eyeBtn.style.top = '16px';
    eyeBtn.style.right = '24px';
    eyeBtn.style.zIndex = '9999';
    document.body.appendChild(eyeBtn);
  }

  function applySeasonDecor() {
    if (!document.body.classList.contains('season-active')) return;
    const els = document.querySelectorAll('div, aside, section, button, span');
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (el.id === 'season-gpu-bg' || el.id === 'season-eye-toggle' || el.classList.contains('season-donate-btn')) continue;
      const st = getComputedStyle(el);
      const bg = st.backgroundColor;
      const border = st.borderColor;
      const isWarmBg = bg && (bg.indexOf('206, 66') !== -1 || bg.indexOf('217, 83') !== -1 || bg.indexOf('234, 88') !== -1 || bg.indexOf('220, 38') !== -1);
      const isWarmBorder = border && (border.indexOf('206, 66') !== -1 || border.indexOf('217, 83') !== -1 || border.indexOf('234, 88') !== -1 || border.indexOf('249, 115') !== -1);

      if ((el.tagName === 'DIV' || el.tagName === 'ASIDE' || el.tagName === 'SECTION') && bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        if (active.isWinter && isWarmBg) {
          el.classList.add('season-cold-accent');
        } else {
          el.classList.add('season-glass');
        }
      }

      if (active.isWinter) {
        if (isWarmBg) el.classList.add('season-cold-accent');
        else el.classList.remove('season-cold-accent');

        if (isWarmBorder) el.classList.add('season-cold-border');
        else el.classList.remove('season-cold-border');
      }
    }
  }

  if (active.isWinter) {
    const canvas = document.createElement('canvas');
    canvas.id = 'season-snow-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    window.addEventListener('resize', function () {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const flakes = [];
    for (let i = 0; i < 55; i++) {
      flakes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 0.8 + 0.35,
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.55 + 0.25
      });
    }

    function drawSnow() {
      ctx.clearRect(0, 0, w, h);
      if (document.body.classList.contains('season-active')) {
        for (let i = 0; i < flakes.length; i++) {
          const f = flakes[i];
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(224, 242, 254, ' + f.opacity + ')';
          ctx.fill();
          f.y += f.speedY;
          f.x += f.speedX + Math.sin(f.y * 0.01) * 0.2;
          if (f.y > h) { f.y = -5; f.x = Math.random() * w; }
          if (f.x > w) f.x = 0;
          if (f.x < 0) f.x = w;
        }
      }
      requestAnimationFrame(drawSnow);
    }
    drawSnow();
  }

  function setThemeState(enabled) {
    if (enabled) {
      document.documentElement.classList.add('season-active');
      document.body.classList.add('season-active');
      if (donateEl) {
        donateEl.className = 'season-donate-btn';
        const img = document.createElement('img');
        img.src = btnPath;
        img.alt = 'Поддержать RaidDesk';
        img.onerror = function () {
          if (this.src.indexOf('default/btn.webp') === -1) {
            this.src = 'theme/default/btn.webp';
          } else {
            donateEl.className = origDonateClass;
donateEl.innerHTML = origDonateHTML;
}
};
donateEl.innerHTML = '';
donateEl.appendChild(img);
}
eyeBtn.innerHTML = eyeOpenSVG + ' Арт';
eyeBtn.title = 'Скрыть сезонный фон';
setTimeout(applySeasonDecor, 20);
} else {
document.documentElement.classList.remove('season-active');
document.body.classList.remove('season-active');
if (donateEl) {
donateEl.className = origDonateClass;
donateEl.innerHTML = origDonateHTML;
}
eyeBtn.innerHTML = eyeOffSVG + ' Арт';
eyeBtn.title = 'Включить сезонный фон';
}
localStorage.setItem('raiddesk_season_art', enabled ? '1' : '0');
}
const savedState = localStorage.getItem('raiddesk_season_art');
setThemeState(savedState !== '0');
eyeBtn.addEventListener('click', function (e) {
e.stopPropagation();
setThemeState(!document.body.classList.contains('season-active'));
});
if (headerContainer) {
headerContainer.addEventListener('click', function () {
setTimeout(applySeasonDecor, 30);
});
}
})();