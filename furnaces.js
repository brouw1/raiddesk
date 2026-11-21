document.addEventListener('DOMContentLoaded', () => {
const FURNACES = {
small: { woodRate: 30, rates: { sulfur: 36, metal: 18, hqm: 9 } },
large: { woodRate: 30, rates: { sulfur: 180, metal: 90, hqm: 45 } },
electric: { woodRate: 0, rates: { sulfur: 60, metal: 30, hqm: 15 } }
};
let currentFurnace = 'small';
let furnaceCount = 1;
let timerInterval = null;
let timeRemaining = 0;
let isPaused = false;
let totalTime = 0;

const timeDisplay = document.getElementById('furnace-time-display');
const consumeGrid = document.getElementById('furnace-consume-grid');
const outputGrid = document.getElementById('furnace-output-grid');
const startBtn = document.getElementById('furnace-start-btn');
const pauseBtn = document.getElementById('furnace-pause-btn');
const resetBtn = document.getElementById('furnace-reset-all') || document.getElementById('furnace-reset-btn');
const soundTestBtn = document.getElementById('furnace-sound-test');
const countInput = document.getElementById('furnace-count-input');
const oreInputs = {
    sulfur: document.querySelector('.furnace-ore-input[data-ore="sulfur"]'),
    metal: document.querySelector('.furnace-ore-input[data-ore="metal"]'),
    hqm: document.querySelector('.furnace-ore-input[data-ore="hqm"]')
};

function formatTime(secs) {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function playCompletionSound() {
    const audioPath = 'sounds/rust-fake-invite.mp3';
    const repeatCount = 5;
    let playedTimes = 0;
    function tryPlayNext() {
        if (playedTimes >= repeatCount) return;
        const audio = new Audio(audioPath);
        audio.onerror = function() {
            console.warn(`[RaidDesk] Файл ${audioPath} не найден. Играем резервный бип.`);
            playSystemBeep();
            playedTimes++;
            setTimeout(tryPlayNext, 600);
        };
        audio.onended = function() {
            playedTimes++;
            tryPlayNext();
        };
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('[RaidDesk] Автоблокировка звука:', error.message);
                playSystemBeep();
                playedTimes++;
                setTimeout(tryPlayNext, 600);
            });
        }
    }
    tryPlayNext();
}

function playSystemBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.log('Аудио API недоступно', e);
    }
}

function showScreenNotify(text) {
    const notify = document.createElement('div');
    notify.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #cd412b; color: #fff; padding: 16px 32px; border-radius: 4px; font-size: 1.2rem; font-weight: bold; box-shadow: 0 10px 30px rgba(0,0,0,0.6); z-index: 100000; pointer-events: none;';
    notify.textContent = text;
    document.body.appendChild(notify);
    setTimeout(() => notify.remove(), 5000);
}

function calculate() {
    const woodRate = FURNACES[currentFurnace].woodRate;
    const rates = FURNACES[currentFurnace].rates;
    const s = parseInt(oreInputs.sulfur.value) || 0,
          m = parseInt(oreInputs.metal.value) || 0,
          h = parseInt(oreInputs.hqm.value) || 0;
    const tSulfur = rates.sulfur > 0 ? (s / (rates.sulfur * furnaceCount)) : 0;
    const tMetal = rates.metal > 0 ? (m / (rates.metal * furnaceCount)) : 0;
    const tHqm = rates.hqm > 0 ? (h / (rates.hqm * furnaceCount)) : 0;
    const totalMins = tSulfur + tMetal + tHqm;
    const totalSecs = Math.floor(totalMins * 60);
    totalTime = totalSecs;
    timeDisplay.textContent = formatTime(totalSecs);
    const totalWood = Math.ceil(totalMins * woodRate);
    consumeGrid.innerHTML = `<div class="res-item ${totalWood > 0 ? 'highlight' : ''}"><div class="item-icon-wrap sm"><img src="icons/wood.png" alt="Дерево"></div><div class="res-data"><span class="res-val">${totalWood}</span><span class="res-name">Дерево</span></div></div>`;
    const charcoal = Math.floor(totalWood * 0.75);
    outputGrid.innerHTML = `
        <div class="res-item ${s > 0 ? 'highlight' : ''}">
          <div class="item-icon-wrap sm"><img src="icons/sulfur.png" alt="Сера"></div>
          <div class="res-data"><span class="res-val">${s}</span><span class="res-name">Сера</span></div>
        </div>
        <div class="res-item ${m > 0 ? 'highlight' : ''}">
          <div class="item-icon-wrap sm"><img src="icons/metal.fragments.png" alt="Металл"></div>
          <div class="res-data"><span class="res-val">${m}</span><span class="res-name">Металл</span></div>
        </div>
        <div class="res-item ${h > 0 ? 'highlight' : ''}">
          <div class="item-icon-wrap sm"><img src="icons/metal.refined.png" alt="МВК"></div>
          <div class="res-data"><span class="res-val">${h}</span><span class="res-name">МВК</span></div>
        </div>
        <div class="res-item ${charcoal > 0 ? 'highlight' : ''}">
          <div class="item-icon-wrap sm"><img src="icons/charcoal.png" alt="Уголь"></div>
          <div class="res-data"><span class="res-val">${charcoal}</span><span class="res-name">Уголь</span></div>
        </div>
      `;
}

function startTimer() {
    if (totalTime <= 0) { showScreenNotify('❌ Нет руды!'); return; }
    if (timerInterval) clearInterval(timerInterval);
    timeRemaining = totalTime;
    isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = '⏸ Пауза';
    document.title = `🔥 ${formatTime(timeRemaining)} — Плавка`;
    timerInterval = setInterval(() => {
        if (isPaused) return;
        timeRemaining--;
        timeDisplay.textContent = formatTime(timeRemaining);
        document.title = `🔥 ${formatTime(timeRemaining)} — Плавка`;
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            document.title = 'RaidDesk';
            timeDisplay.textContent = '00:00:00';
            playCompletionSound();
            showScreenNotify('🔥 Плавка завершена! Руда готова');
            if (Notification.permission === "granted") new Notification("RaidDesk", { body: "🔥 Плавка завершена!" });
            else if (Notification.permission !== "denied") Notification.requestPermission();
        }
    }, 1000);
}

function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶ Продолжить' : '⏸ Пауза';
}

/* ===== ГЛАВНЫЙ ФИКС: подсветка через класс .selected, а не инлайн-стили ===== */
function selectFurnace(type) {
    document.querySelectorAll('.furnace-card').forEach(c =>
        c.classList.toggle('selected', c.dataset.type === type)
    );
    currentFurnace = type;
    calculate();
}

document.querySelectorAll('.furnace-card').forEach(card => {
    card.addEventListener('click', () => selectFurnace(card.dataset.type));
});

document.getElementById('furnace-count-dec').addEventListener('click', () => {
    countInput.value = Math.max(1, (parseInt(countInput.value) || 1) - 1);
    furnaceCount = parseInt(countInput.value);
    calculate();
});
document.getElementById('furnace-count-inc').addEventListener('click', () => {
    countInput.value = (parseInt(countInput.value) || 1) + 1;
    furnaceCount = parseInt(countInput.value);
    calculate();
});
countInput.addEventListener('input', () => {
    furnaceCount = Math.max(1, parseInt(countInput.value) || 1);
    // Если ввели 0 или пустоту — возвращаем 1 в поле, чтобы не было как на скрине
    if (parseInt(countInput.value, 10) < 1 || isNaN(parseInt(countInput.value, 10))) {
        countInput.value = furnaceCount;
    }
    calculate();
});

document.querySelectorAll('.furnace-ore-inc').forEach(btn => btn.addEventListener('click', () => {
    const o = btn.dataset.ore;
    oreInputs[o].value = (parseInt(oreInputs[o].value) || 0) + 1;
    calculate();
}));
document.querySelectorAll('.furnace-ore-dec').forEach(btn => btn.addEventListener('click', () => {
    const o = btn.dataset.ore;
    oreInputs[o].value = Math.max(0, (parseInt(oreInputs[o].value) || 0) - 1);
    calculate();
}));
Object.values(oreInputs).forEach(input => input.addEventListener('input', calculate));

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', togglePause);
soundTestBtn.addEventListener('click', playCompletionSound);

if (resetBtn) resetBtn.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    isPaused = false;
    totalTime = 0;
    timeRemaining = 0;
    document.title = 'RaidDesk';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '⏸ Пауза';
    countInput.value = 1;
    furnaceCount = 1;
    Object.values(oreInputs).forEach(i => i.value = 0);
    selectFurnace('small');
    showScreenNotify('↺ Вкладка сброшена');
});

calculate();
});