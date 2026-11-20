function renderIcon(filename, alt, sizeClass) {
    const cls = sizeClass ? " " + sizeClass : "";
    const fallbackSvg = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="4" fill="#1f1d1a"/><path d="M12 28L28 12M12 12l16 16" stroke="#cd412b" stroke-width="3" stroke-linecap="round"/></svg>');
    return `<div class="item-icon-wrap ${cls}"><img src="icons/${filename}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackSvg}';" /></div>`;
}

function fmt(num) { return Math.round(num).toLocaleString("ru-RU"); }
function escapeHtml(str) { return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

let toastTimer = null;
function showToast(text) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

/* НАВИГАЦИЯ */
function initNavigation() {
    const buttons = document.querySelectorAll(".nav-btn");
    const panels = document.querySelectorAll(".tab-panel");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.toggle("active", b === btn));
            panels.forEach(p => p.classList.toggle("active", p.id === "tab-" + btn.dataset.tab));
        });
    });
    const brand = document.getElementById("brandLogo");
    if (brand) brand.addEventListener("click", () => {
        buttons.forEach(b => b.classList.toggle("active", b.dataset.tab === "raid"));
        panels.forEach(p => p.classList.toggle("active", p.id === "tab-raid"));
    });
}

/* 1. РЕЙД */
const RAID_WEAPONS = {
    c4: { id: "c4", name: "C4", short: "C4", icon: "explosive.timed.png", cost: { sulfur: 2200, gp: 1000, charcoal: 3000, metal: 200, lgf: 60, pipes: 0 } },
    rocket: { id: "rocket", name: "Ракеты", short: "Ракета", icon: "ammo.rocket.basic.png", cost: { sulfur: 1400, gp: 650, charcoal: 1950, metal: 100, lgf: 30, pipes: 2 } },
    hv: { id: "hv", name: "HV", short: "HV", icon: "ammo.rocket.hv.png", cost: { sulfur: 200, gp: 100, charcoal: 300, metal: 0, lgf: 0, pipes: 1 } },
    satchel: { id: "satchel", name: "Сочели", short: "Сочель", icon: "explosive.satchel.png", cost: { sulfur: 480, gp: 240, charcoal: 720, metal: 80, lgf: 0, pipes: 0 } },
    exp556: { id: "exp556", name: "Разрывные", short: "Разр. 5.56", icon: "ammo.rifle.explosive.png", cost: { sulfur: 25, gp: 10, charcoal: 30, metal: 5, lgf: 0, pipes: 0 } },
    molotov: { id: "molotov", name: "Молотов", short: "Молотов", icon: "grenade.molotov.png", cost: { sulfur: 0, gp: 0, charcoal: 0, metal: 0, lgf: 50, pipes: 0 } },
    beancan: { id: "beancan", name: "Бобовки", short: "Бобовка", icon: "grenade.beancan.png", cost: { sulfur: 120, gp: 60, charcoal: 180, metal: 20, lgf: 0, pipes: 0 } },
    fire_rocket: { id: "fire_rocket", name: "Зажиг.", short: "Зажиг.", icon: "ammo.rocket.fire.png", cost: { sulfur: 750, gp: 0, charcoal: 0, metal: 0, lgf: 0, pipes: 0 } },
    f1_grenade: { id: "f1_grenade", name: "F1", short: "F1", icon: "grenade.f1.png", cost: { sulfur: 60, gp: 0, charcoal: 0, metal: 0, lgf: 0, pipes: 0 } }
};

const RAID_TARGETS = [
    { id: "wood_wall", name: "Дерев. стена", hp: 250, icon: "wood.png", eco: { molotov: 4 }, methods: { molotov: 4, exp556: 49, satchel: 3, rocket: 2, c4: 1, beancan: 13, hv: 9, fire_rocket: 1 } },
    { id: "stone_wall", name: "Каменная стена", hp: 500, icon: "stones.png", eco: { c4: 2 }, methods: { c4: 2, exp556: 185, satchel: 10, rocket: 4, beancan: 46, hv: 32, molotov: null, fire_rocket: null } },
    { id: "metal_wall", name: "Металл. стена", hp: 1000, icon: "metal.fragments.png", eco: { c4: 4 }, methods: { c4: 4, exp556: 400, rocket: 8, satchel: 23, beancan: 112, hv: 67, molotov: null, fire_rocket: null } },
    { id: "hqm_wall", name: "МВК стена", hp: 2000, icon: "metal.refined.png", eco: { c4: 8 }, methods: { c4: 8, exp556: 799, rocket: 15, satchel: 46, beancan: 222, hv: 134, molotov: null, fire_rocket: null } },
    { id: "wood_door", name: "Дерев. дверь", hp: 200, icon: "door.hinged.wood.png", eco: { molotov: 2 }, methods: { molotov: 2, exp556: 19, satchel: 2, rocket: 1, c4: 1, beancan: 6, hv: 4, fire_rocket: 1 } },
    { id: "sheet_door", name: "Железная дверь", hp: 250, icon: "door.hinged.metal.png", eco: { c4: 1 }, methods: { exp556: 63, satchel: 4, beancan: 18, c4: 1, hv: 11, rocket: 2, molotov: null, fire_rocket: null } },
    { id: "double_metal_door", name: "Двойная железная дверь", hp: 250, icon: "door.double.hinged.metal.png", eco: { c4: 1 }, methods: { c4: 1, rocket: 2, satchel: 4, exp556: 63, beancan: 18, hv: 11, molotov: null, fire_rocket: null } },
    { id: "garage_door", name: "Гаражная дверь", hp: 600, icon: "wall.frame.garagedoor.png", eco: { rocket: 3 }, methods: { c4: 2, rocket: 3, satchel: 9, exp556: 150, beancan: 40, hv: 25, molotov: null, fire_rocket: null } },
    { id: "hqm_door", name: "МВК дверь", hp: 1000, icon: "door.hinged.toptier.png", eco: { rocket: 5 }, methods: { c4: 4, rocket: 5, satchel: 15, exp556: 250, beancan: 67, molotov: null, fire_rocket: null } },
    { id: "double_hqm_door", name: "Двойная МВК дверь", hp: 1000, icon: "door.double.hinged.toptier.png", eco: { rocket: 5 }, methods: { c4: 4, rocket: 5, satchel: 15, exp556: 250, beancan: 67, molotov: null, fire_rocket: null } },
    { id: "ladder_hatch", name: "Потолочный люк", hp: 250, icon: "floor.ladder.hatch.png", eco: { c4: 1 }, methods: { c4: 1, rocket: 2, satchel: 4, exp556: 63, beancan: 18, hv: 11, molotov: null, fire_rocket: null } },
    { id: "tri_ladder_hatch", name: "Треугольный люк", hp: 250, icon: "floor.triangle.ladder.hatch.png", eco: { c4: 1 }, methods: { c4: 1, rocket: 2, satchel: 4, exp556: 63, beancan: 18, hv: 11, molotov: null, fire_rocket: null } },
    { id: "window_bars", name: "Железная решётка", hp: 500, icon: "wall.window.bars.metal.png", eco: { c4: 2 }, methods: { c4: 2, rocket: 4, satchel: 12, exp556: 200, beancan: 54, hv: 34, molotov: null, fire_rocket: null } },
    { id: "reinforced_window", name: "Укреплённое окно", hp: 500, icon: "wall.window.glass.reinforced.png", eco: { c4: 2 }, methods: { c4: 2, rocket: 4, satchel: 12, exp556: 200, beancan: 54, hv: 34, molotov: null, fire_rocket: null } },
    { id: "shopfront", name: "Укреплённая витрина", hp: 750, icon: "wall.frame.shopfront.metal.png", eco: { c4: 3 }, methods: { c4: 3, rocket: 6, satchel: 18, exp556: 300, beancan: 80, hv: 50, molotov: null, fire_rocket: null } },
    { id: "high_wood_wall", name: "Высокая дерев. стена", hp: 500, icon: "wall.external.high.png", eco: { fire_rocket: 1 }, methods: { c4: 2, rocket: 3, satchel: 6, exp556: 98, molotov: 7, fire_rocket: 1, hv: 25, beancan: 46 } },
    { id: "high_stone_wall", name: "Высокая каменная стена", hp: 500, icon: "wall.external.high.stone.png", eco: { c4: 2 }, methods: { c4: 2, rocket: 4, satchel: 10, exp556: 173, beancan: 46, hv: 32, molotov: null, fire_rocket: null } },
    { id: "high_stone_gate", name: "Высокие каменные ворота", hp: 500, icon: "gates.external.high.stone.png", eco: { c4: 2 }, methods: { c4: 2, rocket: 4, satchel: 10, exp556: 173, beancan: 46, hv: 32, molotov: null, fire_rocket: null } },
    { id: "tc", name: "Шкаф (TC)", hp: 100, icon: "cupboard.tool.png", eco: { molotov: 1 }, methods: { c4: 1, rocket: 1, satchel: 1, exp556: 10, molotov: 1, fire_rocket: 1, hv: 2, beancan: 4 } },
    { id: "turret", name: "Автотурель", hp: 1000, icon: "autoturret.png", eco: { hv: 3 }, methods: { c4: 2, rocket: 4, hv: 3, satchel: 4, exp556: 106, f1_grenade: 10, molotov: null, fire_rocket: 1 } },
    { id: "flame_turret", name: "Огнемётная турель", hp: 300, icon: "flameturret.png", eco: { hv: 2 }, methods: { c4: 1, rocket: 1, hv: 2, satchel: 1, exp556: 34, f1_grenade: 4, molotov: null, fire_rocket: 1 } },
    { id: "guntrap", name: "Гантрап", hp: 300, icon: "guntrap.png", eco: { hv: 2 }, methods: { c4: 1, rocket: 1, hv: 2, satchel: 1, exp556: 34, f1_grenade: 4, molotov: null, fire_rocket: 1 } },
    { id: "sam_site", name: "ПВО / SAM Site", hp: 1000, icon: "samsite.png", eco: { hv: 3 }, methods: { c4: 2, rocket: 4, hv: 3, satchel: 4, exp556: 200, f1_grenade: 10, molotov: null, fire_rocket: 1 } },
    { id: "vending", name: "Торг. автомат", hp: 1250, icon: "vending.machine.png", eco: { c4: 5 }, methods: { c4: 5, rocket: 10, satchel: 29, exp556: 499, hv: 67, molotov: null, fire_rocket: null } }
];

const raidState = { selectedMethod: "eco", counts: {} };

function initRaidCalculator() {
    const methodsContainer = document.getElementById("raidMethodsContainer");
    const targetsGrid = document.getElementById("raidTargetsGrid");
    if (!methodsContainer || !targetsGrid) return;

    const methodKeys = ["eco"].concat(Object.keys(RAID_WEAPONS));
    methodsContainer.innerHTML = methodKeys.map(key => {
        if (key === "eco") return `<button type="button" class="method-btn active" data-method="eco"><div class="item-icon-wrap sm">⚡</div><div class="method-info"><span class="method-name">АВТО-ЭКОНОМ</span><span class="method-sulfur" id="sulfur-eco">Оптимально</span></div></button>`;
        const w = RAID_WEAPONS[key];
        return `<button type="button" class="method-btn" data-method="${w.id}">${renderIcon(w.icon, w.name, "sm")}<div class="method-info"><span class="method-name">${w.name}</span><span class="method-sulfur" id="sulfur-${w.id}">0</span></div></button>`;
    }).join("");

    methodsContainer.addEventListener("click", e => {
        const btn = e.target.closest(".method-btn");
        if (!btn) return;
        raidState.selectedMethod = btn.dataset.method;
        document.querySelectorAll(".method-btn").forEach(b => b.classList.toggle("active", b === btn));
        updateRaidCalculation();
    });

    targetsGrid.innerHTML = RAID_TARGETS.map(t =>
        `<div class="target-card" id="raid-card-${t.id}">
            <div class="target-left">${renderIcon(t.icon, t.name)}
                <div class="target-meta">
                    <span class="target-title">${t.name}</span>
                    <span class="target-hp">${t.hp} HP</span>
                </div>
            </div>
            <div class="counter-controls">
                <button type="button" class="cnt-btn" data-action="dec" data-id="${t.id}">−</button>
                <input class="cnt-input" type="number" min="0" max="999" value="0" data-id="${t.id}" />
                <button type="button" class="cnt-btn" data-action="inc" data-id="${t.id}">+</button>
            </div>
        </div>`
    ).join("");

    targetsGrid.addEventListener("click", e => {
        const btn = e.target.closest(".cnt-btn");
        if (!btn) return;
        const id = btn.dataset.id, cur = raidState.counts[id] || 0;
        raidState.counts[id] = btn.dataset.action === "inc" ? cur + 1 : Math.max(0, cur - 1);
        syncRaidInputs(); updateRaidCalculation();
    });

    targetsGrid.addEventListener("input", e => {
        if (!e.target.classList.contains("cnt-input")) return;
        raidState.counts[e.target.dataset.id] = Math.max(0, parseInt(e.target.value, 10) || 0);
        updateRaidCalculation();
    });

    updateRaidCalculation();
}

function syncRaidInputs() {
    RAID_TARGETS.forEach(t => {
        const val = raidState.counts[t.id] || 0, card = document.getElementById("raid-card-" + t.id);
        if (!card) return;
        card.querySelector(".cnt-input").value = val;
        card.classList.toggle("has-count", val > 0);
    });
}

function updateRaidCalculation() {
    const activeTargets = RAID_TARGETS.filter(t => (raidState.counts[t.id] || 0) > 0);
    const methodKeys = Object.keys(RAID_WEAPONS);
    const methodTotals = {};
    let minValidSulfur = Infinity;

    methodKeys.forEach(mKey => {
        let possible = true, totalSulfur = 0;
        activeTargets.forEach(t => {
            const qty = raidState.counts[t.id], req = t.methods[mKey];
            if (req === null || req === undefined) possible = false;
            else totalSulfur += req * qty * RAID_WEAPONS[mKey].cost.sulfur;
        });
        methodTotals[mKey] = { possible, totalSulfur };
        if (possible && activeTargets.length > 0 && mKey !== "exp556" && totalSulfur < minValidSulfur) {
            minValidSulfur = totalSulfur;
        }
    });

    let ecoSulfurTotal = 0;
    activeTargets.forEach(t => {
        const qty = raidState.counts[t.id];
        Object.keys(t.eco).forEach(wId => { ecoSulfurTotal += t.eco[wId] * qty * RAID_WEAPONS[wId].cost.sulfur; });
    });

    const ecoLabel = document.getElementById("sulfur-eco");
    if (ecoLabel) ecoLabel.textContent = activeTargets.length ? fmt(ecoSulfurTotal) + " серы" : "Оптимально";

    const ecoBtn = document.querySelector('.method-btn[data-method="eco"]');
    if (ecoBtn) {
        ecoBtn.classList.remove("status-green", "status-red");
        if (activeTargets.length > 0) ecoBtn.classList.add("status-green");
    }

    methodKeys.forEach(mKey => {
        const btn = document.querySelector(`.method-btn[data-method="${mKey}"]`),
              sub = document.getElementById(`sulfur-${mKey}`),
              info = methodTotals[mKey];
        if (!btn || !sub) return;
        btn.classList.remove("status-green", "status-red");
        if (activeTargets.length === 0) { sub.textContent = fmt(RAID_WEAPONS[mKey].cost.sulfur) + " / шт"; return; }
        if (!info.possible) { sub.textContent = "Невозможно"; btn.classList.add("status-red"); }
        else {
            sub.textContent = fmt(info.totalSulfur) + " серы";
            if (mKey !== "exp556") {
                btn.classList.add(info.totalSulfur <= minValidSulfur * 1.15 ? "status-green" : "status-red");
            }
        }
    });

    const planBlock = document.getElementById("raidPlanBlock"),
          totalRes = { sulfur: 0, gp: 0, charcoal: 0, metal: 0, lgf: 0, pipes: 0 };

    if (activeTargets.length === 0) {
        planBlock.innerHTML = 'Выбери цель слева.';
    } else {
        planBlock.innerHTML = activeTargets.map(t => {
            const qty = raidState.counts[t.id];
            if (raidState.selectedMethod === "eco") {
                const steps = Object.keys(t.eco).map(wId => {
                    const totalW = t.eco[wId] * qty, c = RAID_WEAPONS[wId].cost;
                    totalRes.sulfur += c.sulfur * totalW;
                    totalRes.gp += c.gp * totalW;
                    totalRes.charcoal += c.charcoal * totalW;
                    totalRes.metal += c.metal * totalW;
                    totalRes.lgf += c.lgf * totalW;
                    totalRes.pipes += c.pipes * totalW;
                    return `${totalW} × ${RAID_WEAPONS[wId].short}`;
                });
                return `<div class="plan-row"><span class="plan-row-target">${qty} × ${t.name}</span><span class="plan-row-action">${steps.join(" + ")}</span></div>`;
            }
            const mKey = raidState.selectedMethod, req = t.methods[mKey];
            if (req === null || req === undefined) return `<div class="plan-row impossible"><span class="plan-row-target">${qty} × ${t.name}</span><span class="plan-row-action">❌ Нельзя</span></div>`;
            const totalW = req * qty, c = RAID_WEAPONS[mKey].cost;
            totalRes.sulfur += c.sulfur * totalW;
            totalRes.gp += c.gp * totalW;
            totalRes.charcoal += c.charcoal * totalW;
            totalRes.metal += c.metal * totalW;
            totalRes.lgf += c.lgf * totalW;
            totalRes.pipes += c.pipes * totalW;
            return `<div class="plan-row"><span class="plan-row-target">${qty} × ${t.name}</span><span class="plan-row-action">${totalW} × ${RAID_WEAPONS[mKey].short}</span></div>`;
        }).join("");
    }

    const resConfig = [
        { key: "sulfur", name: "Сера", icon: "sulfur.png", hl: true },
        { key: "gp", name: "Порох", icon: "gunpowder.png" },
        { key: "charcoal", name: "Уголь", icon: "charcoal.png" },
        { key: "metal", name: "Металл", icon: "metal.fragments.png" },
        { key: "lgf", name: "Топливо", icon: "lowgradefuel.png" },
        { key: "pipes", name: "Трубы", icon: "metalpipe.png" }
    ];

    document.getElementById("raidResourcesGrid").innerHTML = resConfig.map(r =>
        `<div class="res-item ${r.hl && totalRes[r.key] > 0 ? "highlight" : ""}">
            ${renderIcon(r.icon, r.name, "sm")}
            <div class="res-data"><span class="res-val">${fmt(totalRes[r.key])}</span><span class="res-name">${r.name}</span></div>
        </div>`
    ).join("");
}

/* 2. СТРОЙКА & TC */
const BUILD_BLOCKS = [
    { id: "square_found", name: "Квадратный фундамент", icon: "wood.png", costs: { wood: { main: 200, twig: 50 }, stone: { main: 300, twig: 50 }, metal: { main: 200, twig: 50 }, hqm: { main: 25, twig: 50 } } },
    { id: "tri_found", name: "Треугольный фундамент", icon: "wood.png", costs: { wood: { main: 100, twig: 25 }, stone: { main: 150, twig: 25 }, metal: { main: 100, twig: 25 }, hqm: { main: 13, twig: 25 } } },
    { id: "wall", name: "Стена", icon: "wood.png", costs: { wood: { main: 200, twig: 50 }, stone: { main: 300, twig: 50 }, metal: { main: 200, twig: 50 }, hqm: { main: 25, twig: 50 } } },
    { id: "half_wall", name: "Полустенка", icon: "wood.png", costs: { wood: { main: 200, twig: 50 }, stone: { main: 300, twig: 50 }, metal: { main: 200, twig: 50 }, hqm: { main: 25, twig: 50 } } },
    { id: "low_wall", name: "Низкая стенка", icon: "wood.png", costs: { wood: { main: 100, twig: 25 }, stone: { main: 150, twig: 25 }, metal: { main: 100, twig: 25 }, hqm: { main: 13, twig: 25 } } },
    { id: "doorway", name: "Дверной / Оконный проём", icon: "wood.png", costs: { wood: { main: 140, twig: 35 }, stone: { main: 210, twig: 35 }, metal: { main: 140, twig: 35 }, hqm: { main: 18, twig: 35 } } },
    { id: "wall_frame", name: "Настенная рамка", icon: "wood.png", costs: { wood: { main: 100, twig: 25 }, stone: { main: 150, twig: 25 }, metal: { main: 100, twig: 25 }, hqm: { main: 13, twig: 25 } } },
    { id: "square_floor", name: "Квадратный пол / потолок", icon: "wood.png", costs: { wood: { main: 100, twig: 25 }, stone: { main: 150, twig: 25 }, metal: { main: 100, twig: 25 }, hqm: { main: 13, twig: 25 } } },
    { id: "tri_floor", name: "Треугольный пол / потолок", icon: "wood.png", costs: { wood: { main: 50, twig: 13 }, stone: { main: 75, twig: 13 }, metal: { main: 50, twig: 13 }, hqm: { main: 7, twig: 13 } } },
    { id: "roof_stairs", name: "Крыша / Лестница", icon: "wood.png", costs: { wood: { main: 200, twig: 50 }, stone: { main: 300, twig: 50 }, metal: { main: 200, twig: 50 }, hqm: { main: 25, twig: 50 } } }
];

const BUILD_DOORS = [
    { id: "wood_door", name: "Деревянная дверь", icon: "door.hinged.wood.png", isBlock: true, cost: { wood: 300 } },
    { id: "metal_door", name: "Железная дверь", icon: "door.hinged.metal.png", isBlock: true, cost: { metal: 150 } },
    { id: "double_metal_door", name: "Двойная железная дверь", icon: "door.double.hinged.metal.png", isBlock: true, cost: { metal: 200 } },
    { id: "garage_door", name: "Гаражная дверь", icon: "wall.frame.garagedoor.png", isBlock: true, cost: { metal: 300, gears: 2 } },
    { id: "hqm_door", name: "МВК дверь", icon: "door.hinged.toptier.png", isBlock: true, cost: { hqm: 20, gears: 5 } },
    { id: "double_hqm_door", name: "Двойная МВК дверь", icon: "door.double.hinged.toptier.png", isBlock: true, cost: { hqm: 25, gears: 5 } },
    { id: "ladder_hatch", name: "Потолочный люк", icon: "floor.ladder.hatch.png", isBlock: true, cost: { metal: 300, gears: 3 } },
    { id: "tri_ladder_hatch", name: "Треугольный люк", icon: "floor.triangle.ladder.hatch.png", isBlock: true, cost: { metal: 300, gears: 3 } },
    { id: "window_bars", name: "Железная решётка", icon: "wall.window.bars.metal.png", isBlock: true, cost: { metal: 75 } },
    { id: "reinforced_window", name: "Укреплённое окно", icon: "wall.window.glass.reinforced.png", isBlock: true, cost: { metal: 50 } },
    { id: "shopfront", name: "Укреплённая витрина", icon: "wall.frame.shopfront.metal.png", isBlock: true, cost: { metal: 50 } },
    { id: "high_wood_wall", name: "Высокая дерев. стена", icon: "wall.external.high.png", isBlock: false, cost: { wood: 1500 } },
    { id: "high_stone_wall", name: "Высокая каменная стена", icon: "wall.external.high.stone.png", isBlock: false, cost: { stone: 1500 } },
    { id: "high_stone_gate", name: "Высокие каменные ворота", icon: "gates.external.high.stone.png", isBlock: false, cost: { stone: 2000, gears: 2 } }
];

const buildState = {};
const doorState = {};
const blockMaterials = {};
BUILD_BLOCKS.forEach(b => blockMaterials[b.id] = 'wood');

function initBuildCalculator() {
    const buildTab = document.getElementById("tab-build");
    if (!buildTab) return;

    let blockGrid = document.getElementById("buildItemsGrid");
    let doorGrid = document.getElementById("buildDoorsGrid");

    if (!blockGrid || !doorGrid) {
        buildTab.innerHTML = `
            <div class="section-header">
                <div><h1>Стройка и шкаф (TC)</h1><p class="subtitle">Стоимость базы и суточное содержание (прогрессивный налог).</p></div>
                <button type="button" class="btn btn-ghost reset-tab-btn" data-tab="build">↺ Сбросить всё</button>
            </div>
            <div class="split-layout">
                <div style="display:flex; flex-direction:column; gap:20px;">
                    <div><h3 class="mini-title">Строительные блоки</h3><div class="items-grid" id="buildItemsGrid"></div></div>
                    <div><h3 class="mini-title">Двери, люки и заборы</h3><div class="items-grid" id="buildDoorsGrid"></div></div>
                </div>
                <div class="card sticky-panel">
                    <div class="summary-header"><h2>Смета</h2><span class="tag-pill tag-olive" id="upkeepTaxBadge">Налог: 10%</span></div>
                    <div class="tax-info-box">
                        <div class="tax-row"><span>Блоков:</span><strong id="totalBlocksCount">0</strong></div>
                        <div class="tax-tiers" id="taxTiersBar">
                            <span data-tier="10" class="active">≤15: 10%</span>
                            <span data-tier="15">≤50: 15%</span>
                            <span data-tier="20">≤125: 20%</span>
                            <span data-tier="33.3">126+: 33.3%</span>
                        </div>
                    </div>
                    <h3 class="mini-title">Постройка:</h3>
                    <div class="resources-grid" id="buildCostGrid"></div>
                    <div class="divider"></div>
                    <h3 class="mini-title">Содержание (24ч):</h3>
                    <div class="resources-grid" id="upkeepCostGrid"></div>
                </div>
            </div>`;
        blockGrid = document.getElementById("buildItemsGrid");
        doorGrid = document.getElementById("buildDoorsGrid");
    }

    blockGrid.innerHTML = BUILD_BLOCKS.map(item =>
        `<div class="target-card" id="build-card-${item.id}" style="flex-direction: column; align-items: stretch; gap: 8px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div class="target-left">${renderIcon(item.icon, item.name)}
                    <div class="target-meta">
                        <span class="target-title">${item.name}</span>
                        <span class="target-hp" id="build-desc-${item.id}">Загрузка...</span>
                    </div>
                </div>
                <div class="counter-controls">
                    <button type="button" class="cnt-btn" data-action="dec" data-id="${item.id}">−</button>
                    <input class="cnt-input" type="number" min="0" max="999" value="0" data-id="${item.id}" />
                    <button type="button" class="cnt-btn" data-action="inc" data-id="${item.id}">+</button>
                </div>
            </div>
            <div class="material-selector" style="display:flex; gap:4px; margin-top:4px;" id="mat-sel-${item.id}">
                <button type="button" class="mat-btn active" data-mat="wood" data-id="${item.id}" style="flex:1; padding:4px; font-size:0.75rem; background:var(--rust-orange); border:none; color:#fff; border-radius:3px; cursor:pointer;">Дерево</button>
                <button type="button" class="mat-btn" data-mat="stone" data-id="${item.id}" style="flex:1; padding:4px; font-size:0.75rem; background:var(--bg-card); border:1px solid var(--border-dark); color:var(--text-muted); border-radius:3px; cursor:pointer;">Камень</button>
                <button type="button" class="mat-btn" data-mat="metal" data-id="${item.id}" style="flex:1; padding:4px; font-size:0.75rem; background:var(--bg-card); border:1px solid var(--border-dark); color:var(--text-muted); border-radius:3px; cursor:pointer;">Металл</button>
                <button type="button" class="mat-btn" data-mat="hqm" data-id="${item.id}" style="flex:1; padding:4px; font-size:0.75rem; background:var(--bg-card); border:1px solid var(--border-dark); color:var(--text-muted); border-radius:3px; cursor:pointer;">МВК</button>
            </div>
        </div>`
    ).join("");

    doorGrid.innerHTML = BUILD_DOORS.map(item =>
        `<div class="target-card" id="door-card-${item.id}">
            <div class="target-left">${renderIcon(item.icon, item.name)}
                <div class="target-meta">
                    <span class="target-title">${item.name}</span>
                    <span class="target-hp" id="door-desc-${item.id}">${formatCost(item.cost)}</span>
                </div>
            </div>
            <div class="counter-controls">
                <button type="button" class="cnt-btn" data-action="dec" data-id="${item.id}">−</button>
                <input class="cnt-input" type="number" min="0" max="999" value="0" data-id="${item.id}" />
                <button type="button" class="cnt-btn" data-action="inc" data-id="${item.id}">+</button>
            </div>
        </div>`
    ).join("");

    BUILD_BLOCKS.forEach(b => updateBlockDesc(b.id));

    blockGrid.addEventListener("click", e => {
        const cntBtn = e.target.closest(".cnt-btn");
        if (cntBtn) {
            const id = cntBtn.dataset.id, cur = buildState[id] || 0;
            buildState[id] = cntBtn.dataset.action === "inc" ? cur + 1 : Math.max(0, cur - 1);
            syncBuildInputs(); updateBuildCalculation();
            return;
        }
        const matBtn = e.target.closest(".mat-btn");
        if (matBtn) {
            const id = matBtn.dataset.id, mat = matBtn.dataset.mat;
            blockMaterials[id] = mat;
            document.querySelectorAll(`#mat-sel-${id} .mat-btn`).forEach(b => {
                b.classList.toggle("active", b === matBtn);
                b.style.background = b === matBtn ? "var(--rust-orange)" : "var(--bg-card)";
                b.style.color = b === matBtn ? "#fff" : "var(--text-muted)";
                b.style.border = b === matBtn ? "none" : "1px solid var(--border-dark)";
            });
            updateBlockDesc(id);
            updateBuildCalculation();
        }
    });

    blockGrid.addEventListener("input", e => {
        if (!e.target.classList.contains("cnt-input")) return;
        buildState[e.target.dataset.id] = Math.max(0, parseInt(e.target.value, 10) || 0);
        updateBuildCalculation();
    });

    doorGrid.addEventListener("click", e => {
        const btn = e.target.closest(".cnt-btn");
        if (!btn) return;
        const id = btn.dataset.id, cur = doorState[id] || 0;
        doorState[id] = btn.dataset.action === "inc" ? cur + 1 : Math.max(0, cur - 1);
        syncBuildInputs(); updateBuildCalculation();
    });

    doorGrid.addEventListener("input", e => {
        if (!e.target.classList.contains("cnt-input")) return;
        doorState[e.target.dataset.id] = Math.max(0, parseInt(e.target.value, 10) || 0);
        updateBuildCalculation();
    });

    updateBuildCalculation();
}

function updateBlockDesc(id) {
    const item = BUILD_BLOCKS.find(b => b.id === id);
    const mat = blockMaterials[id];
    const c = item.costs[mat];
    const matIcons = { wood: "wood.png", stone: "stones.png", metal: "metal.fragments.png", hqm: "metal.refined.png" };
    const card = document.getElementById(`build-card-${id}`);
    if (card) {
        const img = card.querySelector(".item-icon-wrap img");
        if (img) img.src = `icons/${matIcons[mat]}`;
    }
    const desc = document.getElementById(`build-desc-${id}`);
    if (desc) desc.textContent = `${c.main} ${getMatName(mat)} + ${c.twig} соломы`;
}

function getMatName(mat) {
    return { wood: "дер.", stone: "кам.", metal: "мет.", hqm: "МВК" }[mat];
}

function formatCost(cost) {
    let parts = [];
    if (cost.wood) parts.push(`${cost.wood} дер.`);
    if (cost.stone) parts.push(`${cost.stone} кам.`);
    if (cost.metal) parts.push(`${cost.metal} мет.`);
    if (cost.hqm) parts.push(`${cost.hqm} МВК`);
    if (cost.gears) parts.push(`${cost.gears} шест.`);
    return parts.join(" + ");
}

function syncBuildInputs() {
    BUILD_BLOCKS.forEach(item => {
        const val = buildState[item.id] || 0, card = document.getElementById("build-card-" + item.id);
        if (!card) return;
        card.querySelector(".cnt-input").value = val;
        card.classList.toggle("has-count", val > 0);
    });
    BUILD_DOORS.forEach(item => {
        const val = doorState[item.id] || 0, card = document.getElementById("door-card-" + item.id);
        if (!card) return;
        card.querySelector(".cnt-input").value = val;
        card.classList.toggle("has-count", val > 0);
    });
}

function updateBuildCalculation() {
    let totalBlocks = 0;
    const totalCost = { wood: 0, stone: 0, metal: 0, hqm: 0, gears: 0 },
          upkeepBase = { wood: 0, stone: 0, metal: 0, hqm: 0 };

    BUILD_BLOCKS.forEach(item => {
        const qty = buildState[item.id] || 0;
        if (qty <= 0) return;
        totalBlocks += qty;
        const mat = blockMaterials[item.id];
        const costs = item.costs[mat];
        totalCost.wood += costs.twig * qty;
        totalCost[mat] += costs.main * qty;
        upkeepBase[mat] += costs.main * qty;
    });

    BUILD_DOORS.forEach(item => {
        const qty = doorState[item.id] || 0;
        if (qty <= 0) return;
        if (item.isBlock) totalBlocks += qty;
        Object.keys(item.cost).forEach(res => {
            totalCost[res] += item.cost[res] * qty;
            if (res in upkeepBase) upkeepBase[res] += item.cost[res] * qty;
        });
    });

    let tempBlocks = totalBlocks, rateSum = 0, label = "10";
    const brackets = [
        { limit: 15, rate: 0.10, label: "10" },
        { limit: 50, rate: 0.15, label: "15" },
        { limit: 125, rate: 0.20, label: "20" },
        { limit: Infinity, rate: 0.3333, label: "33.3" }
    ];
    let prevLimit = 0;
    for (let b of brackets) {
        let count = Math.min(tempBlocks, b.limit - prevLimit);
        if (count > 0) { rateSum += count * b.rate; label = b.label; tempBlocks -= count; }
        else break;
        prevLimit = b.limit;
    }
    const avgRate = totalBlocks > 0 ? rateSum / totalBlocks : 0;

    const blocksEl = document.getElementById("totalBlocksCount");
    if (blocksEl) blocksEl.textContent = fmt(totalBlocks);
    const badgeEl = document.getElementById("upkeepTaxBadge");
    if (badgeEl) badgeEl.textContent = "Налог: " + label + "%";
    document.querySelectorAll("#taxTiersBar span").forEach(el => el.classList.toggle("active", el.dataset.tier === label));

    const buildMeta = [
        { key: "wood", name: "Дерево", icon: "wood.png" },
        { key: "stone", name: "Камень", icon: "stones.png" },
        { key: "metal", name: "Металл", icon: "metal.fragments.png" },
        { key: "hqm", name: "МВК", icon: "metal.refined.png" },
        { key: "gears", name: "Шестеренки", icon: "gears.png" }
    ];
    const buildGridEl = document.getElementById("buildCostGrid");
    if (buildGridEl) buildGridEl.innerHTML = buildMeta.map(r =>
        `<div class="res-item">${renderIcon(r.icon, r.name, "sm")}<div class="res-data"><span class="res-val">${fmt(totalCost[r.key])}</span><span class="res-name">${r.name}</span></div></div>`
    ).join("");

    const upkeepMeta = [
        { key: "wood", name: "Дерево / 24ч", icon: "wood.png" },
        { key: "stone", name: "Камень / 24ч", icon: "stones.png" },
        { key: "metal", name: "Металл / 24ч", icon: "metal.fragments.png" },
        { key: "hqm", name: "МВК / 24ч", icon: "metal.refined.png" }
    ];
    const upkeepGridEl = document.getElementById("upkeepCostGrid");
    if (upkeepGridEl) upkeepGridEl.innerHTML = upkeepMeta.map(r => {
        const val = Math.ceil(upkeepBase[r.key] * avgRate);
        return `<div class="res-item ${val > 0 ? "highlight" : ""}">${renderIcon(r.icon, r.name, "sm")}<div class="res-data"><span class="res-val">${fmt(val)}</span><span class="res-name">${r.name}</span></div></div>`;
    }).join("");
}

/* 3. ПЕРЕРАБОТЧИК */
const RECYCLER_ITEMS = [
    { id: "laptop", name: "Ноутбук", icon: "targeting.computer.png", yield: { techparts: 3, hqm: 1, metal: 50 } },
    { id: "cctv", name: "Камера", icon: "cctv.camera.png", yield: { techparts: 2, hqm: 2 } },
    { id: "techparts", name: "Микросхемы", icon: "techparts.png", yield: { scrap: 20, hqm: 1 } },
    { id: "riflebody", name: "Корпус винтовки", icon: "riflebody.png", yield: { scrap: 25, hqm: 2 } },
    { id: "smgbody", name: "Корпус СМГ", icon: "smgbody.png", yield: { scrap: 15, hqm: 2 } },
    { id: "semibody", name: "Корпус полуавтомата", icon: "semibody.png", yield: { scrap: 15, hqm: 2, metal: 75 } },
    { id: "gears", name: "Шестерёнки", icon: "gears.png", yield: { scrap: 10, metal: 13 } },
    { id: "spring", name: "Пружины", icon: "metalspring.png", yield: { scrap: 10, hqm: 1 } },
    { id: "pipe", name: "Трубы", icon: "metalpipe.png", yield: { scrap: 5, hqm: 1 } },
    { id: "sheetmetal", name: "Листовой металл", icon: "sheetmetal.png", yield: { scrap: 8, metal: 100, hqm: 1 } },
    { id: "sewingkit", name: "Швейный набор", icon: "sewingkit.png", yield: { cloth: 10, rope: 2 } },
    { id: "rope", name: "Верёвка", icon: "rope.png", yield: { cloth: 15 } },
    { id: "tarp", name: "Брезент", icon: "tarp.png", yield: { cloth: 50 } },
    { id: "roadsigns", name: "Дорожные знаки", icon: "roadsigns.png", yield: { scrap: 1, hqm: 2 } },
    { id: "metalblade", name: "Металл. лезвия", icon: "metalblade.png", yield: { scrap: 2, metal: 15 } },
    { id: "propane", name: "Пропановый баллон", icon: "propanetank.png", yield: { scrap: 1, metal: 50 } },
    { id: "fuse", name: "Предохранитель", icon: "fuse.png", yield: { scrap: 20 } },
    { id: "autoturret", name: "Автотурель", icon: "autoturret.png", yield: { scrap: 20, hqm: 2, metal: 12 } },
    { id: "flameturret", name: "Огнемётная турель", icon: "flameturret.png", yield: { scrap: 10, metal: 150, cloth: 15 } },
    { id: "guntrap", name: "Гантрап", icon: "guntrap.png", yield: { scrap: 10, metal: 125, wood: 50 } },
    { id: "samsite", name: "ПВО / SAM Site", icon: "samsite.png", yield: { scrap: 25, hqm: 15 } }
];

const recyclerState = {};
let recyclerDeepProcess = false;
let recyclerSafeZone = false;

function initRecyclerCalculator() {
    const recTab = document.getElementById("tab-recycler");
    if (!recTab) return;

    let grid = document.getElementById("recyclerItemsGrid");
    if (!grid) {
        recTab.innerHTML = `
            <div class="section-header">
                <div><h1>Переработчик</h1><p class="subtitle">Выход ресурсов при переработке компонентов и предметов.</p></div>
                <button type="button" class="btn btn-ghost reset-tab-btn" data-tab="recycler">↺ Сбросить всё</button>
            </div>
            <div class="split-layout">
                <div><div id="recyclerItemsGrid" class="items-grid"></div></div>
                <div class="card sticky-panel">
                    <div class="summary-header"><h2>Выход</h2><span class="tag-pill tag-olive" id="recEfficiencyTag">100%</span></div>
                    <div class="resources-grid" id="recyclerOutputGrid"></div>
                </div>
            </div>`;
        grid = document.getElementById("recyclerItemsGrid");
    }

    let controlBar = document.getElementById("recyclerControlBar");
    if (!controlBar) {
        controlBar = document.createElement("div");
        controlBar.id = "recyclerControlBar";
        controlBar.style.cssText = "margin-bottom: 16px; padding: 12px 16px; display: flex; gap: 24px; align-items: center; flex-wrap: wrap; background: var(--bg-panel); border: 1px solid var(--border-dark); border-radius: var(--radius);";
        controlBar.innerHTML = `
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.88rem;">
                <input type="checkbox" id="recyclerDeepProcess"> Глубокая переработка
            </label>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.88rem;">
                <input type="checkbox" id="recyclerSafeZone"> Сейф-зона (−20%)
            </label>`;
        grid.parentNode.insertBefore(controlBar, grid);
    }

    document.getElementById("recyclerDeepProcess").addEventListener("change", e => {
        recyclerDeepProcess = e.target.checked;
        updateRecyclerCalculation();
    });
    document.getElementById("recyclerSafeZone").addEventListener("change", e => {
        recyclerSafeZone = e.target.checked;
        const tag = document.getElementById("recEfficiencyTag");
        if (tag) tag.textContent = recyclerSafeZone ? "80% (Сейф)" : "100% (РТ)";
        updateRecyclerCalculation();
    });

    const mapName = { scrap: "скрап", hqm: "МВК", metal: "мет.", cloth: "ткань", rope: "вер.", techparts: "микросх.", wood: "дер." };
    grid.innerHTML = RECYCLER_ITEMS.map(item => {
        const preview = Object.keys(item.yield).map(k => item.yield[k] + " " + mapName[k]).join(", ");
        return `<div class="target-card" id="rec-card-${item.id}">
            <div class="target-left">${renderIcon(item.icon, item.name)}
                <div class="target-meta">
                    <span class="target-title">${item.name}</span>
                    <span class="target-hp">${preview}</span>
                </div>
            </div>
            <div class="counter-controls">
                <button type="button" class="cnt-btn" data-action="dec" data-id="${item.id}">−</button>
                <input class="cnt-input" type="number" min="0" max="9999" value="0" data-id="${item.id}" />
                <button type="button" class="cnt-btn" data-action="inc" data-id="${item.id}">+</button>
            </div>
        </div>`;
    }).join("");

    grid.addEventListener("click", e => {
        const btn = e.target.closest(".cnt-btn");
        if (!btn) return;
        const id = btn.dataset.id, cur = recyclerState[id] || 0;
        recyclerState[id] = btn.dataset.action === "inc" ? cur + 1 : Math.max(0, cur - 1);
        syncRecyclerInputs(); updateRecyclerCalculation();
    });

    grid.addEventListener("input", e => {
        if (!e.target.classList.contains("cnt-input")) return;
        recyclerState[e.target.dataset.id] = Math.max(0, parseInt(e.target.value, 10) || 0);
        updateRecyclerCalculation();
    });

    updateRecyclerCalculation();
}

function syncRecyclerInputs() {
    RECYCLER_ITEMS.forEach(item => {
        const val = recyclerState[item.id] || 0, card = document.getElementById("rec-card-" + item.id);
        if (!card) return;
        card.querySelector(".cnt-input").value = val;
        card.classList.toggle("has-count", val > 0);
    });
}

function updateRecyclerCalculation() {
    let totals = { scrap: 0, hqm: 0, metal: 0, cloth: 0, rope: 0, techparts: 0, wood: 0 };
    RECYCLER_ITEMS.forEach(item => {
        const qty = recyclerState[item.id] || 0;
        if (qty <= 0) return;
        Object.keys(item.yield).forEach(res => {
            let amount = item.yield[res] * qty;
            if (recyclerSafeZone) amount *= 0.8;
            totals[res] += amount;
        });
    });

    if (recyclerDeepProcess) {
        if (totals.techparts > 0) {
            totals.scrap += totals.techparts * 20;
            totals.hqm += totals.techparts * 1;
            totals.techparts = 0;
        }
        if (totals.rope > 0) {
            totals.cloth += totals.rope * 15;
            totals.rope = 0;
        }
    }

    const outputs = [
        { key: "scrap", name: "Скрап", icon: "scrap.png", hl: true },
        { key: "hqm", name: "МВК", icon: "metal.refined.png", hl: true },
        { key: "metal", name: "Металл", icon: "metal.fragments.png" },
        { key: "cloth", name: "Ткань", icon: "cloth.png" },
        { key: "wood", name: "Дерево", icon: "wood.png" },
        { key: "techparts", name: "Микросхемы", icon: "techparts.png" },
        { key: "rope", name: "Верёвки", icon: "rope.png" }
    ];

    const outGrid = document.getElementById("recyclerOutputGrid");
    if (!outGrid) return;
    const activeOutputs = outputs.filter(o => (totals[o.key] || 0) > 0);
    if (activeOutputs.length === 0) {
        outGrid.innerHTML = 'Выбери компоненты слева.';
    } else {
        outGrid.innerHTML = activeOutputs.map(o =>
            `<div class="res-item ${o.hl ? "highlight" : ""}">${renderIcon(o.icon, o.name, "sm")}<div class="res-data"><span class="res-val">${fmt(totals[o.key])}</span><span class="res-name">${o.name}</span></div></div>`
        ).join("");
    }
}

/* 4. КЛАНЫ */
const CLANS_STORAGE_KEY = "rustcore_clans_v1";
let clansData = [];

function saveClans() { localStorage.setItem(CLANS_STORAGE_KEY, JSON.stringify(clansData)); }

function initClansDossier() {
    try { clansData = JSON.parse(localStorage.getItem(CLANS_STORAGE_KEY)) || []; } catch(e) { clansData = []; }
    const form = document.getElementById("addClanForm"), container = document.getElementById("clansContainer");
    if (!form || !container) return;

    form.addEventListener("submit", e => {
        e.preventDefault();
        const name = document.getElementById("clanNameInput").value.trim(),
              status = document.getElementById("clanStatusInput").value,
              note = document.getElementById("clanNoteInput").value.trim();
        if (!name) return;
        clansData.unshift({ id: Date.now(), name, status, note });
        saveClans(); form.reset(); renderClans(); showToast("Добавлено");
    });

    container.addEventListener("click", e => {
        const del = e.target.closest("[data-del-clan]");
        if (del) { clansData = clansData.filter(c => c.id !== Number(del.dataset.delClan)); saveClans(); renderClans(); return; }
    });

    renderClans();
}

function renderClans() {
    const container = document.getElementById("clansContainer");
    if (!container) return;
    if (!clansData.length) { container.innerHTML = '<div class="empty-state">Нет записей.</div>'; return; }
    const labels = { enemy: "🔴 ВРАГИ", cheater: "🟣 СОФТ", ally: "🟢 СОЮЗНИКИ" };
    container.innerHTML = clansData.map(c =>
        `<div class="clan-card status-${c.status}" style="border-top: 3px solid ${c.status==='ally'?'#738d45':c.status==='cheater'?'#8e44ad':'#c93b3b'}; padding:16px; background:var(--bg-panel); border-radius:4px; border-left:1px solid var(--border-dark); border-right:1px solid var(--border-dark); border-bottom:1px solid var(--border-dark); margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-size:1.08rem; font-weight:800;">${escapeHtml(c.name)}</div>
                    <div style="font-size:0.84rem; color:var(--text-muted);">${escapeHtml(c.note)}</div>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <span style="font-size:0.72rem; font-weight:800; padding:3px 8px; border-radius:3px; background:var(--bg-card);">${labels[c.status]}</span>
                    <button class="icon-del-btn" data-del-clan="${c.id}">✕</button>
                </div>
            </div>
        </div>`
    ).join("");
}

/* 5. ФЕРМА */
const FARM_STORAGE_KEY = "rustcore_farm_v1";
let farmPlants = [], currentTarget = "yield";

function saveFarmPlants() { localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farmPlants)); }

function getGeneClass(g) {
    if (['G', 'Y', 'H'].includes(g)) return 'gene-good';
    if (['W', 'X'].includes(g)) return 'gene-bad';
    return 'gene-unknown';
}

function renderGeneCircles(str, unknownIndices = []) {
    return str.split('').map((g, i) =>
        unknownIndices.includes(i)
            ? `<span class="gene-circle gene-unknown">?</span>`
            : `<span class="gene-circle ${getGeneClass(g)}">${g}</span>`
    ).join('');
}

function renderFarmPlants() {
    const container = document.getElementById('plantsList');
    if (!container) return;
    if (!farmPlants.length) { container.innerHTML = '<div class="empty-state">Список пуст.</div>'; return; }
    container.innerHTML = farmPlants.map((p, idx) =>
        `<div class="plant-row">
            <div class="plant-row-left">
                <span style="color:var(--text-dim); width:20px;">#${idx+1}</span>
                <div class="plant-row-genes">${renderGeneCircles(p)}</div>
            </div>
            <button class="icon-del-btn" data-del-idx="${idx}">✕</button>
        </div>`
    ).join('');
}

function initFarm() {
    const input = document.getElementById('plantInput'),
          preview = document.getElementById('plantPreview'),
          plantsList = document.getElementById('plantsList'),
          targetGroup = document.getElementById('farmTargetGroup');
    if (!input || !plantsList || !targetGroup) return;

    try { farmPlants = JSON.parse(localStorage.getItem(FARM_STORAGE_KEY)) || []; } catch(e) { farmPlants = []; }
    renderFarmPlants();

    targetGroup.addEventListener('click', e => {
        const btn = e.target.closest('.target-toggle-btn');
        if (!btn) return;
        currentTarget = btn.dataset.target;
        targetGroup.querySelectorAll('.target-toggle-btn').forEach(b => b.classList.toggle('active', b === btn));
    });

    input.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^GYHWX]/g, '');
        preview.innerHTML = this.value.split('').map(g => `<span class="gene-circle ${getGeneClass(g)}">${g}</span>`).join('');
    });

    document.getElementById('addPlantBtn').addEventListener('click', () => {
        if (input.value.length !== 6) return showToast('Нужно 6 генов!');
        farmPlants.push(input.value);
        saveFarmPlants(); renderFarmPlants();
        input.value = ''; preview.innerHTML = '';
    });

    plantsList.addEventListener('click', e => {
        const btn = e.target.closest('[data-del-idx]');
        if (!btn) return;
        farmPlants.splice(parseInt(btn.dataset.delIdx), 1);
        saveFarmPlants(); renderFarmPlants();
    });

    document.getElementById('loadTestPlantsBtn').addEventListener('click', () => {
        ["GYGWXH", "YYYGXX", "GGGWYY", "YGYGWH", "GGYWXX"].forEach(p => {
            if (!farmPlants.includes(p)) farmPlants.push(p);
        });
        saveFarmPlants(); renderFarmPlants();
    });

    document.getElementById('calcFarmBtn').addEventListener('click', () => {
        if (farmPlants.length < 3) return showToast('Нужно минимум 3 ростка!');
        const scoreMap = currentTarget === 'yield'
            ? { Y: 3, G: 2, H: 1, W: -3, X: -3 }
            : { G: 3, Y: 2, H: 1, W: -3, X: -3 };

        let bestScore = -Infinity, bestDonors = [], bestChildStr = '', bestUnknownIndices = [];

        function getCombinations(arr, k) {
            const result = [];
            function helper(start, current) {
                if (current.length === k) { result.push([...current]); return; }
                for (let i = start; i < arr.length; i++) {
                    current.push(arr[i]);
                    helper(i + 1, current);
                    current.pop();
                }
            }
            helper(0, []);
            return result;
        }

        for (let k = 2; k <= 4; k++) {
            if (farmPlants.length < k) continue;
            getCombinations(farmPlants, k).forEach(donors => {
                const child = [], unknown = [];
                for (let i = 0; i < 6; i++) {
                    const weights = {};
                    donors.forEach(d => {
                        const g = d[i], w = ['G','Y','H'].includes(g) ? 0.6 : 1.0;
                        weights[g] = (weights[g] || 0) + w;
                    });
                    let maxW = -1, tied = [];
                    for (const [g, w] of Object.entries(weights)) {
                        if (w > maxW) { maxW = w; tied = [g]; }
                        else if (w === maxW) tied.push(g);
                    }
                    if (tied.length === 1) child.push(tied[0]);
                    else { child.push('?'); unknown.push(i); }
                }
                let score = 0;
                child.forEach(g => { score += g === '?' ? 0 : scoreMap[g]; });
                if (score > bestScore) {
                    bestScore = score;
                    bestDonors = donors;
                    bestChildStr = child.join('');
                    bestUnknownIndices = unknown;
                }
            });
        }

        document.getElementById('farmResult').innerHTML = `
            <div class="result-box">
                <div class="result-title">Итоговый росток:</div>
                <div class="result-genes" style="margin-bottom:12px;">${renderGeneCircles(bestChildStr, bestUnknownIndices)}</div>
                <div class="result-title">Доноры:</div>
                <div style="display:flex; flex-direction:column; gap:6px;">${bestDonors.map(d => renderGeneCircles(d)).join('')}</div>
            </div>`;
    });
}

/* 6. БИНДЫ */
const RUST_BINDS = [
    { title: "Автобег", key: "Z", desc: "Персонаж автоматически бежит вперёд.", cmd: "bind z +forward;+sprint" },
    { title: "Автофарм / добыча", key: "Q", desc: "Атака в приседе (удобно для фарма).", cmd: "bind q +attack;+duck" },
    { title: "Автоприсед", key: "C", desc: "Быстро присесть для стрельбы.", cmd: "bind c +duck" },
    { title: "Combatlog", key: "F2", desc: "Таблица последних попаданий.", cmd: "bind f2 consoletoggle;combatlog" },
    { title: "Быстрый суицид", key: "K", desc: "Мгновенно убить себя.", cmd: "bind k kill" },
    { title: "Авто-фонарик", key: "ЛКМ", desc: "Включает свет при выстреле.", cmd: "bind mouse1 +lighttoggle;+attack" },
    { title: "Зум (ПКМ)", key: "ПКМ", desc: "Прицеливание с FOV 70.", cmd: 'bind mouse2 "+attack2;+graphics.fov 70"' },
    { title: "Быстрый лут", key: "X", desc: "Сбор предметов наведением.", cmd: "bind x +hoverloot" },
    { title: "Крафт бинта", key: "P", desc: "Мгновенно скрафтить бинт.", cmd: "bind p craft.add -2072273936 1" },
    { title: "Центр карты", key: "G", desc: "Открыть карту на себе.", cmd: "bind g +map;+focusmap" },
    { title: "Высокий прыжок", key: "Настройка", desc: "Запрыгивать на полустенки.", cmd: "physics.steps 60" },
    { title: "Уменьшить оружие", key: "Настройка", desc: "Больше обзора в бою.", cmd: "graphics.vm_fov_scale 0" },
    { title: "Убрать фризы", key: "Настройка", desc: "Для ПК с 16+ ГБ ОЗУ.", cmd: "gc.buffer 2048" },
    { title: "Удобный апгрейд", key: "Настройка", desc: "Ставить/апгрейдить сквозь щели.", cmd: "client.lookatradius 20" },
    { title: "Без тряски", key: "Настройка", desc: "Отключить тряску камеры.", cmd: "client.headlerp_inertia false" }
];

function initBinds() {
    const container = document.getElementById("bindsContainer");
    if (!container) return;

    container.innerHTML = RUST_BINDS.map(b =>
        `<div class="bind-card">
            <div class="bind-header">
                <div class="bind-title">${escapeHtml(b.title)}</div>
                <div class="bind-key">[ ${escapeHtml(b.key)} ]</div>
            </div>
            <div class="bind-desc">${escapeHtml(b.desc)}</div>
            <div>
                <div class="bind-code-box">${escapeHtml(b.cmd)}</div>
                <button type="button" class="bind-copy-btn" data-copy="${escapeHtml(b.cmd)}">📋 Копировать</button>
            </div>
        </div>`
    ).join("");

    document.body.addEventListener("click", async function(e) {
        const btn = e.target.closest("[data-copy]");
        if (!btn) return;
        const textToCopy = btn.dataset.copy;
        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast("Команда скопирована!");
            if (btn.classList.contains('bind-copy-btn')) {
                const original = btn.innerHTML;
                btn.innerHTML = "Скопировано! ✓";
                btn.style.background = "var(--rust-olive)";
                btn.style.borderColor = "#88a653";
                setTimeout(() => { btn.innerHTML = original; btn.style.background = ""; btn.style.borderColor = ""; }, 2000);
            }
        } catch (err) {
            const ta = document.createElement("textarea");
            ta.value = textToCopy;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
            showToast("Команда скопирована!");
        }
    });
}

/* 7. СБРОС ВКЛАДОК */
function initResetButtons() {
    document.querySelectorAll('.reset-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === 'raid') {
                raidState.counts = {};
                raidState.selectedMethod = "eco";
                document.querySelectorAll(".method-btn").forEach(b => b.classList.toggle("active", b.dataset.method === "eco"));
                syncRaidInputs(); updateRaidCalculation();
            } else if (tab === 'build') {
                Object.keys(buildState).forEach(k => buildState[k] = 0);
                Object.keys(doorState).forEach(k => doorState[k] = 0);
                BUILD_BLOCKS.forEach(b => {
                    blockMaterials[b.id] = 'wood';
                    document.querySelectorAll(`#mat-sel-${b.id} .mat-btn`).forEach(el => {
                        el.classList.toggle("active", el.dataset.mat === 'wood');
                        el.style.background = el.dataset.mat === 'wood' ? "var(--rust-orange)" : "var(--bg-card)";
                        el.style.color = el.dataset.mat === 'wood' ? "#fff" : "var(--text-muted)";
                        el.style.border = el.dataset.mat === 'wood' ? "none" : "1px solid var(--border-dark)";
                    });
                    updateBlockDesc(b.id);
                });
                syncBuildInputs(); updateBuildCalculation();
            } else if (tab === 'recycler') {
                Object.keys(recyclerState).forEach(k => recyclerState[k] = 0);
                recyclerDeepProcess = false; recyclerSafeZone = false;
                const deepEl = document.getElementById("recyclerDeepProcess");
                const safeEl = document.getElementById("recyclerSafeZone");
                if (deepEl) deepEl.checked = false;
                if (safeEl) safeEl.checked = false;
                const tag = document.getElementById("recEfficiencyTag");
                if (tag) tag.textContent = "100%";
                syncRecyclerInputs(); updateRecyclerCalculation();
            } else if (tab === 'clans') {
                if (confirm('Удалить все досье?')) { clansData = []; saveClans(); renderClans(); }
            } else if (tab === 'farm') {
                farmPlants = []; saveFarmPlants(); renderFarmPlants();
                document.getElementById('plantInput').value = '';
                document.getElementById('plantPreview').innerHTML = '';
                document.getElementById('farmResult').innerHTML = '<div class="empty-state">Добавьте 3+ ростка.</div>';
            }
            showToast('Сброшено');
        });
    });
}

/* ========== АВТОСОХРАНЕНИЕ ========== */
const SAVE_KEY = "rustcore_save_v1";

function saveState() {
    const state = {
        raid: { counts: raidState.counts, method: raidState.selectedMethod },
        build: { blocks: buildState, doors: doorState, materials: blockMaterials },
        recycler: { counts: recyclerState, deep: recyclerDeepProcess, safe: recyclerSafeZone }
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {}
}

function loadState() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw);

        if (state.raid) {
            raidState.counts = state.raid.counts || {};
            raidState.selectedMethod = state.raid.method || "eco";
        }
        if (state.build) {
            Object.assign(buildState, state.build.blocks || {});
            Object.assign(doorState, state.build.doors || {});
            if (state.build.materials) {
                Object.keys(state.build.materials).forEach(id => {
                    if (blockMaterials[id] !== undefined) blockMaterials[id] = state.build.materials[id];
                });
            }
        }
        if (state.recycler) {
            Object.assign(recyclerState, state.recycler.counts || {});
            recyclerDeepProcess = !!state.recycler.deep;
            recyclerSafeZone = !!state.recycler.safe;
        }
    } catch(e) {}
}

function applyLoadedState() {
    syncRaidInputs();
    document.querySelectorAll(".method-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.method === raidState.selectedMethod);
    });

    BUILD_BLOCKS.forEach(b => {
        const mat = blockMaterials[b.id];
        document.querySelectorAll(`#mat-sel-${b.id} .mat-btn`).forEach(el => {
            const isMat = el.dataset.mat === mat;
            el.classList.toggle("active", isMat);
            el.style.background = isMat ? "var(--rust-orange)" : "var(--bg-card)";
            el.style.color = isMat ? "#fff" : "var(--text-muted)";
            el.style.border = isMat ? "none" : "1px solid var(--border-dark)";
        });
        updateBlockDesc(b.id);
    });
    syncBuildInputs();

    const deepEl = document.getElementById("recyclerDeepProcess");
    const safeEl = document.getElementById("recyclerSafeZone");
    if (deepEl) deepEl.checked = recyclerDeepProcess;
    if (safeEl) safeEl.checked = recyclerSafeZone;
    const tag = document.getElementById("recEfficiencyTag");
    if (tag) tag.textContent = recyclerSafeZone ? "80% (Сейф)" : "100% (РТ)";
    syncRecyclerInputs();
}

/* ЗАПУСК */
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    loadState();
    initRaidCalculator();
    initBuildCalculator();
    initRecyclerCalculator();
    initClansDossier();
    initFarm();
    initBinds();
    initResetButtons();
    applyLoadedState();
    setInterval(saveState, 1000);
});