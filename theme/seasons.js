(function () {
  const params = new URLSearchParams(window.location.search);
  const forcedSeason = params.get('season'); // Тест: ?season=winter или ?season=summer
  const month = new Date().getMonth(); // 0 = Январь, 11 = Декабрь

  const themes = {
    default: {
      folder: 'default',
      dim: 'rgba(18, 12, 10, 0.35)',
      cardBg: 'rgba(34, 20, 14, 0.28)',
      btnBg: 'rgba(42, 24, 16, 0.34)',
      border: 'rgba(235, 110, 65, 0.22)',
      glow: 'rgba(217, 83, 47, 0.45)'
    },
    winter: {
      folder: 'winter',
      dim: 'rgba(10, 14, 22, 0.35)',
      cardBg: 'rgba(16, 24, 38, 0.28)',
      btnBg: 'rgba(20, 32, 48, 0.34)',
      border: 'rgba(125, 211, 252, 0.22)',
      glow: 'rgba(56, 189, 248, 0.45)'
    },
    summer: {
      folder: 'summer',
      dim: 'rgba(14, 16, 20, 0.55)',
      cardBg: 'rgba(32, 24, 16, 0.32)',
      btnBg: 'rgba(40, 30, 18, 0.38)',
      border: 'rgba(251, 191, 36, 0.22)',
      glow: 'rgba(245, 158, 11, 0.45)'
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
  const bgPath = `theme/${active.folder}/fon.webp`;
  const btnPath = `theme/${active.folder}/btn.webp`;

  // SVG-иконки открытого и закрытого глазика
  const eyeOpenSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeOffSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  // 1. Все сезонные стили работают только когда на body есть класс .season-active
  const style = document.createElement('style');
  style.id = 'season-styles';
  style.textContent = `
    html.season-active, body.season-active {
      background: linear-gradient(${active.dim}, rgba(12, 10, 10, 0.62)), url('${bgPath}') no-repeat center center fixed !important;
      background-size: cover !important;
    }

    body.season-active header, body.season-active nav {
      background: ${active.cardBg} !important;
      backdrop-filter: blur(5px) !important;
      -webkit-backdrop-filter: blur(5px) !important;
      border-bottom: 1px solid ${active.border} !important;
    }

    body.season-active footer, body.season-active main, body.season-active section, body.season-active aside,
    body.season-active [class*="footer"], body.season-active [class*="wrapper"], body.season-active [class*="container"], body.season-active [class*="grid"] {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    body.season-active [class*="card"], body.season-active [class*="item"], body.season-active [class*="grid"] > div, body.season-active .season-glass {
      background-color: ${active.cardBg} !important;
      backdrop-filter: blur(2.5px) !important;
      -webkit-backdrop-filter: blur(2.5px) !important;
      border: 1px solid ${active.border} !important;
    }

    body.season-active button:not(.season-donate-btn):not(#season-eye-toggle) {
      background-color: ${active.btnBg} !important;
      backdrop-filter: blur(2.5px) !important;
      -webkit-backdrop-filter: blur(2.5px) !important;
      border: 1px solid ${active.border} !important;
    }

    /* Арт-кнопка «ПОДДЕРЖАТЬ» */
    .season-donate-btn {
      position: fixed !important;
      right: 24px !important;
      bottom: 24px !important;
      z-index: 9999 !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      display: inline-block !important;
      cursor: pointer !important;
      transition: transform 0.25s ease, filter 0.25s ease !important;
    }

    .season-donate-btn img {
      width: 260px !important;
      height: auto !important;
      display: block !important;
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.65)) !important;
    }

    .season-donate-btn:hover {
      transform: translateY(-4px) scale(1.03) !important;
      filter: drop-shadow(0 8px 20px ${active.glow}) !important;
    }

    /* Красивая кнопка-переключатель глазика в шапке */
    #season-eye-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #e2e8f0;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    #season-eye-toggle:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: ${active.border};
      color: #ffffff;
      transform: translateY(-1px);
    }

    body.season-active #season-eye-toggle {
      background: ${active.btnBg};
      border-color: ${active.border};
      box-shadow: 0 0 12px ${active.glow};
    }
  `;
  document.head.appendChild(style);

  // 2. Сохраняем оригинал кнопки «ПОДДЕРЖАТЬ» для переключения туда-обратно
  let donateEl = null;
  let origDonateClass = '';
  let origDonateHTML = '';

  const allLinks = document.querySelectorAll('a, button');
  for (const el of allLinks) {
    if (el.textContent && el.textContent.toUpperCase().includes('ПОДДЕРЖАТЬ')) {
      donateEl = el;
      origDonateClass = el.className;
      origDonateHTML = el.innerHTML;
      break;
    }
  }

  // 3. Создаём кнопку-переключатель глазика и ставим в шапку
  const eyeBtn = document.createElement('button');
  eyeBtn.id = 'season-eye-toggle';
  eyeBtn.type = 'button';

  const headerContainer = document.querySelector('header, nav');
  if (headerContainer) {
    headerContainer.appendChild(eyeBtn);
  } else {
    Object.assign(eyeBtn.style, { position: 'fixed', top: '16px', right: '24px', zIndex: '9999' });
    document.body.appendChild(eyeBtn);
  }

  // 4. Функция покраски тёмных плашек на активной вкладке
  function applyGlassToAll() {
    if (!document.body.classList.contains('season-active')) return;
    document.querySelectorAll('div, aside, section').forEach(el => {
      if (el.id === 'season-bg-overlay' || el.classList.contains('season-donate-btn')) return;
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        el.classList.add('season-glass');
      }
    });
  }

  // 5. Функция включения / выключения сезонной темы
  function setThemeState(enabled) {
    if (enabled) {
      document.documentElement.classList.add('season-active');
      document.body.classList.add('season-active');
      if (donateEl) {
        donateEl.className = 'season-donate-btn';
        donateEl.innerHTML = `<img src="${btnPath}" alt="Поддержать RaidDesk">`;
      }
      eyeBtn.innerHTML = `${eyeOpenSVG} <span>Арт</span>`;
      eyeBtn.title = 'Скрыть сезонный фон (классический вид)';
      setTimeout(applyGlassToAll, 20);
    } else {
      document.documentElement.classList.remove('season-active');
      document.body.classList.remove('season-active');
      if (donateEl) {
        donateEl.className = origDonateClass;
        donateEl.innerHTML = origDonateHTML;
      }
      eyeBtn.innerHTML = `${eyeOffSVG} <span>Арт</span>`;
      eyeBtn.title = 'Включить сезонный фон';
    }
    localStorage.setItem('raiddesk_season_art', enabled ? '1' : '0');
  }

  // Проверяем сохранённый выбор (по умолчанию тема включена)
  const savedState = localStorage.getItem('raiddesk_season_art');
  setThemeState(savedState !== '0');

  // Переключение по клику на глазик
  eyeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isNowActive = document.body.classList.contains('season-active');
    setThemeState(!isNowActive);
  });

  // Обновляем прозрачность при переключении вкладок меню
  document.addEventListener('click', () => setTimeout(applyGlassToAll, 50));
})();
