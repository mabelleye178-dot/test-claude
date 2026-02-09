/* ============================================================
   Space Botanics: Alien Defense — Game Logic
   ============================================================
   Single-file, zero-dependency tower defense game.
   Organized into sections:
     1. Constants & Config
     2. Audio (WebAudio beeps)
     3. Game State
     4. Defender / Enemy Definitions
     5. Wave Definitions
     6. DOM Helpers
     7. Board Rendering
     8. Defender Toolbar
     9. Placement & Selling
    10. Projectile System
    11. Enemy Spawning & Movement
    12. Combat & Collisions
    13. Resource System
    14. Wave Manager
    15. Game Loop
    16. UI Wiring (menus, pause, restart)
    17. Initialization
   ============================================================ */

"use strict";

/* ==========================================================
   1. CONSTANTS & CONFIGURATION
   ========================================================== */

const COLS = 9;
const ROWS = 5;
const CELL_W = 80; // matches CSS --cell-w
const CELL_H = 80;

/** Difficulty multipliers applied to enemy stats & spawn rates */
const DIFFICULTY = {
  easy:   { hpMult: 0.7, speedMult: 0.8, spawnMult: 1.3, startDust: 200, passiveDust: 35 },
  normal: { hpMult: 1.0, speedMult: 1.0, spawnMult: 1.0, startDust: 100, passiveDust: 25 },
  hard:   { hpMult: 1.4, speedMult: 1.2, spawnMult: 0.7, startDust: 75,  passiveDust: 18 },
};

const TOTAL_WAVES = 15;

/* ==========================================================
   2. AUDIO — Simple WebAudio Beeps
   ========================================================== */

const SFX = (() => {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctx;
  }

  /** Play a short tone. freq in Hz, duration in seconds. */
  function beep(freq, duration = 0.08, volume = 0.15, type = "square") {
    if (!enabled) return;
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
    } catch (_) { /* ignore audio errors */ }
  }

  return {
    shoot:     () => beep(880, 0.06, 0.1),
    shootPlasma: () => beep(660, 0.08, 0.12, "sawtooth"),
    explode:   () => beep(220, 0.2, 0.2, "sawtooth"),
    place:     () => beep(520, 0.1, 0.1, "sine"),
    sell:      () => beep(330, 0.12, 0.1, "triangle"),
    collect:   () => beep(1200, 0.06, 0.08, "sine"),
    hurt:      () => beep(180, 0.15, 0.15, "sawtooth"),
    waveStart: () => { beep(440, 0.12, 0.15, "sine"); setTimeout(() => beep(660, 0.15, 0.15, "sine"), 140); },
    win:       () => { beep(523, 0.15, 0.2, "sine"); setTimeout(() => beep(659, 0.15, 0.2, "sine"), 170); setTimeout(() => beep(784, 0.25, 0.2, "sine"), 340); },
    lose:      () => { beep(300, 0.2, 0.2, "sawtooth"); setTimeout(() => beep(200, 0.3, 0.2, "sawtooth"), 220); },
    get enabled() { return enabled; },
    set enabled(v) { enabled = v; },
    /** Resume AudioContext after user gesture (required by browsers). */
    resume() { if (ctx && ctx.state === "suspended") ctx.resume(); },
  };
})();

/* ==========================================================
   3. GAME STATE
   ========================================================== */

const state = {
  running: false,
  paused: false,
  difficulty: "normal",
  stardust: 100,
  lives: 10,
  score: 0,
  currentWave: 0,
  waveActive: false,
  waveEnemiesLeft: 0,
  waveSpawnQueue: [],
  spawnTimer: 0,
  passiveTimer: 0,
  selectedDefender: null,

  /** 2D grid [row][col] — null or defender instance */
  grid: [],

  /** Active entity arrays */
  defenders: [],
  enemies: [],
  projectiles: [],
  pickups: [],

  /** Timestamp tracking for the game loop */
  lastFrame: 0,
  animFrameId: null,

  /** Track pending setTimeout IDs so we can cancel them on restart */
  pendingTimers: [],
  /** Flag: waiting between waves (true = need to schedule next wave on unpause) */
  betweenWaves: false,
};

/** Convenience: current difficulty config */
function diff() {
  return DIFFICULTY[state.difficulty];
}

/* ==========================================================
   4. DEFENDER DEFINITIONS
   ========================================================== */

/**
 * Each defender type has:
 *   name, icon (emoji), cost, hp, damage, range (cells), cooldown (ms),
 *   attackType: "single" | "area" | "slow" | "none",
 *   special: optional extra behavior tag,
 *   description: short tooltip text.
 */
const DEFENDERS = {
  photonSprout: {
    key: "photonSprout",
    name: "Photon Sprout",
    icon: "\u{1F331}",       // 🌱
    cost: 50,
    hp: 100,
    damage: 20,
    range: 9,          // shoots across the row
    cooldown: 1400,
    attackType: "single",
    projClass: "photon",
    description: "Basic shooter. Fires photon seeds down the lane.",
  },
  nebulaNut: {
    key: "nebulaNut",
    name: "Nebula Nut",
    icon: "\u{1FAB5}",       // 🪵 (placeholder walnut)
    cost: 50,
    hp: 400,
    damage: 0,
    range: 0,
    cooldown: 0,
    attackType: "none",
    description: "Tough wall. Blocks aliens with high HP.",
  },
  plasmaPea: {
    key: "plasmaPea",
    name: "Plasma Pea",
    icon: "\u{1F52B}",       // 🔫
    cost: 100,
    hp: 80,
    damage: 15,
    range: 9,
    cooldown: 700,
    attackType: "single",
    projClass: "plasma",
    description: "Rapid-fire plasma bolts. Lower damage, faster rate.",
  },
  solarFlare: {
    key: "solarFlare",
    name: "Solar Flare",
    icon: "\u{2600}\u{FE0F}", // ☀️
    cost: 175,
    hp: 80,
    damage: 40,
    range: 4,
    cooldown: 2500,
    attackType: "area",
    projClass: "solar",
    description: "Lobs explosive orbs that deal area damage.",
  },
  cosmicVine: {
    key: "cosmicVine",
    name: "Cosmic Vine",
    icon: "\u{1FAB4}",       // 🪴
    cost: 75,
    hp: 80,
    damage: 8,
    range: 7,
    cooldown: 1800,
    attackType: "slow",
    projClass: "frost",
    description: "Fires frost spores that slow enemies.",
  },
  starBloom: {
    key: "starBloom",
    name: "Star Bloom",
    icon: "\u{1F33B}",       // 🌻
    cost: 50,
    hp: 80,
    damage: 0,
    range: 0,
    cooldown: 8000,
    attackType: "none",
    special: "generate",
    description: "Generates Stardust over time. Click pickups to collect!",
  },
};

/* ==========================================================
   5. ENEMY DEFINITIONS
   ========================================================== */

/**
 * Each enemy type:
 *   name, icon, baseHp, baseSpeed (px/s), damage (to defenders per hit),
 *   attackCooldown (ms), reward (stardust on kill), scoreValue,
 *   special: optional tag ("shield", "fast", "boss").
 */
const ENEMIES = {
  drone: {
    key: "drone",
    name: "Drone",
    icon: "\u{1F47E}",       // 👾
    baseHp: 80,
    baseSpeed: 30,
    damage: 20,
    attackCooldown: 800,
    reward: 15,
    scoreValue: 10,
  },
  runner: {
    key: "runner",
    name: "Runner",
    icon: "\u{1F47D}",       // 👽
    baseHp: 50,
    baseSpeed: 60,
    damage: 15,
    attackCooldown: 600,
    reward: 20,
    scoreValue: 15,
    special: "fast",
  },
  brute: {
    key: "brute",
    name: "Brute",
    icon: "\u{1F9DF}",       // 🧟
    baseHp: 250,
    baseSpeed: 18,
    damage: 35,
    attackCooldown: 1200,
    reward: 30,
    scoreValue: 25,
  },
  shielder: {
    key: "shielder",
    name: "Shielder",
    icon: "\u{1F6E1}\u{FE0F}", // 🛡️
    baseHp: 120,
    baseSpeed: 25,
    damage: 20,
    attackCooldown: 900,
    reward: 25,
    scoreValue: 20,
    special: "shield",
    shieldHp: 80,
  },
  boss: {
    key: "boss",
    name: "Overlord",
    icon: "\u{1F479}",       // 👹
    baseHp: 800,
    baseSpeed: 14,
    damage: 50,
    attackCooldown: 1500,
    reward: 100,
    scoreValue: 100,
    special: "boss",
  },
};

/* ==========================================================
   6. WAVE DEFINITIONS
   ========================================================== */

/**
 * generateWaves() produces an array of wave configs.
 * Each wave: { enemies: [{ type, count, interval(ms) }, ...] }
 * Difficulty scaling is applied at spawn time.
 */
function generateWaves() {
  const waves = [];
  for (let w = 1; w <= TOTAL_WAVES; w++) {
    const enemies = [];
    // Drones every wave, increasing count
    enemies.push({ type: "drone", count: 3 + Math.floor(w * 1.2), interval: 3000 });

    // Runners from wave 3
    if (w >= 3) {
      enemies.push({ type: "runner", count: Math.floor(w * 0.6), interval: 2500 });
    }
    // Brutes from wave 5
    if (w >= 5) {
      enemies.push({ type: "brute", count: Math.floor((w - 3) * 0.5), interval: 5000 });
    }
    // Shielders from wave 7
    if (w >= 7) {
      enemies.push({ type: "shielder", count: Math.floor((w - 5) * 0.4), interval: 4000 });
    }
    // Boss every 5 waves
    if (w % 5 === 0) {
      enemies.push({ type: "boss", count: Math.ceil(w / 5), interval: 8000 });
    }

    waves.push({ enemies });
  }
  return waves;
}

/* ==========================================================
   7. DOM HELPERS
   ========================================================== */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/** Schedule a timeout that is tracked and cancellable via clearGameTimers(). */
function gameTimeout(fn, ms) {
  const id = setTimeout(() => {
    state.pendingTimers = state.pendingTimers.filter(t => t !== id);
    fn();
  }, ms);
  state.pendingTimers.push(id);
  return id;
}

/** Cancel all pending game timers (used on restart / menu). */
function clearGameTimers() {
  state.pendingTimers.forEach(id => clearTimeout(id));
  state.pendingTimers = [];
}

function show(el)  { if (typeof el === "string") el = $(el); el.classList.remove("hidden"); }
function hide(el)  { if (typeof el === "string") el = $(el); el.classList.add("hidden"); }

function switchScreen(id) {
  $$(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

/* ==========================================================
   8. BOARD RENDERING
   ========================================================== */

function createBoard() {
  const board = $("#game-board");
  board.innerHTML = "";

  // Initialize grid
  state.grid = [];
  for (let r = 0; r < ROWS; r++) {
    state.grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      state.grid[r][c] = null;

      const cell = document.createElement("div");
      cell.className = "cell" + (r % 2 === 0 ? " row-even" : "");
      cell.style.left = c * CELL_W + "px";
      cell.style.top  = r * CELL_H + "px";
      cell.dataset.row = r;
      cell.dataset.col = c;
      board.appendChild(cell);
    }
    // Lane entrance marker
    const marker = document.createElement("div");
    marker.className = "lane-entrance";
    marker.style.top = r * CELL_H + "px";
    marker.textContent = "\u{25C0}"; // ◀
    board.appendChild(marker);
  }
}

/* ==========================================================
   9. DEFENDER TOOLBAR
   ========================================================== */

function buildToolbar() {
  const toolbar = $("#defender-toolbar");
  toolbar.innerHTML = "";
  for (const def of Object.values(DEFENDERS)) {
    const card = document.createElement("div");
    card.className = "defender-card";
    card.dataset.key = def.key;
    card.title = def.description;
    card.innerHTML = `
      <span class="icon">${def.icon}</span>
      <span class="name">${def.name}</span>
      <span class="cost">\u{2B50} ${def.cost}</span>
    `;
    toolbar.appendChild(card);
  }
  updateToolbar();
}

function updateToolbar() {
  $$(".defender-card").forEach(card => {
    const def = DEFENDERS[card.dataset.key];
    const canAfford = state.stardust >= def.cost;
    card.classList.toggle("disabled", !canAfford);
    card.classList.toggle("selected", state.selectedDefender === def.key);
  });
}

/* ==========================================================
   10. PLACEMENT & SELLING
   ========================================================== */

function placeDefender(row, col) {
  const defKey = state.selectedDefender;
  if (!defKey) return;
  const template = DEFENDERS[defKey];
  if (state.stardust < template.cost) return;
  if (state.grid[row][col] !== null) return;

  state.stardust -= template.cost;

  const defender = {
    id: Date.now() + Math.random(),
    type: defKey,
    row, col,
    hp: template.hp,
    maxHp: template.hp,
    cooldownLeft: 0,
    generateTimer: 0,
    el: null,
  };

  state.grid[row][col] = defender;
  state.defenders.push(defender);

  // Create DOM element
  const el = document.createElement("div");
  el.className = "entity defender-entity";
  el.style.left = col * CELL_W + "px";
  el.style.top  = row * CELL_H + "px";
  el.innerHTML = `
    <span>${template.icon}</span>
    <div class="hp-bar"><div class="hp-bar-fill" style="width:100%"></div></div>
  `;
  el.dataset.id = defender.id;

  // Right-click to sell
  el.style.pointerEvents = "auto";
  el.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    sellDefender(defender);
  });

  $("#game-board").appendChild(el);
  defender.el = el;

  // Mark cell occupied
  const cell = $(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cell) cell.classList.add("occupied");

  SFX.place();
  updateHUD();
  updateToolbar();
}

function sellDefender(defender) {
  const template = DEFENDERS[defender.type];
  const refund = Math.floor(template.cost * 0.5);
  state.stardust += refund;

  // Remove from grid
  state.grid[defender.row][defender.col] = null;
  const cell = $(`.cell[data-row="${defender.row}"][data-col="${defender.col}"]`);
  if (cell) cell.classList.remove("occupied");

  // Remove DOM
  if (defender.el) defender.el.remove();

  // Remove from array
  state.defenders = state.defenders.filter(d => d.id !== defender.id);

  SFX.sell();
  updateHUD();
  updateToolbar();
}

/* ==========================================================
   11. PROJECTILE SYSTEM
   ========================================================== */

function createProjectile(defender, targetX, targetY) {
  const template = DEFENDERS[defender.type];
  const startX = defender.col * CELL_W + CELL_W / 2;
  const startY = defender.row * CELL_H + CELL_H / 2;

  const proj = {
    id: Date.now() + Math.random(),
    x: startX,
    y: startY,
    targetX,
    targetY,
    speed: 300, // px/s
    damage: template.damage,
    attackType: template.attackType,
    row: defender.row,
    el: null,
  };

  const el = document.createElement("div");
  el.className = "projectile " + (template.projClass || "photon");
  el.style.left = proj.x + "px";
  el.style.top  = proj.y + "px";
  $("#game-board").appendChild(el);
  proj.el = el;

  state.projectiles.push(proj);

  if (template.attackType === "area") {
    SFX.explode();
  } else if (template.projClass === "plasma") {
    SFX.shootPlasma();
  } else {
    SFX.shoot();
  }
}

function updateProjectiles(dt) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = p.speed * dt;

    if (dist <= step + 5) {
      // Reached target — resolve hit
      resolveProjectileHit(p);
      p.el.remove();
      state.projectiles.splice(i, 1);
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
      p.el.style.left = p.x + "px";
      p.el.style.top  = p.y + "px";
    }
  }
}

function resolveProjectileHit(proj) {
  if (proj.attackType === "area") {
    // Splash damage to all enemies within 1.2 cells of impact
    const splashR = CELL_W * 1.2;
    // Show explosion effect
    const boom = document.createElement("div");
    boom.className = "explosion-effect";
    boom.style.left = (proj.targetX - 30) + "px";
    boom.style.top  = (proj.targetY - 30) + "px";
    $("#game-board").appendChild(boom);
    setTimeout(() => boom.remove(), 500);

    // Snapshot the array so splice inside damageEnemy won't skip enemies
    const snapshot = [...state.enemies];
    snapshot.forEach(e => {
      const ex = e.x + 25;
      const ey = e.row * CELL_H + CELL_H / 2;
      const d = Math.sqrt((ex - proj.targetX) ** 2 + (ey - proj.targetY) ** 2);
      if (d < splashR) {
        damageEnemy(e, proj.damage);
      }
    });
  } else {
    // Single-target: hit closest enemy in the row near the impact point
    let closest = null;
    let closestDist = Infinity;
    state.enemies.forEach(e => {
      if (e.row !== proj.row) return;
      const ex = e.x + 25;
      const ey = e.row * CELL_H + CELL_H / 2;
      const d = Math.abs(ex - proj.targetX);
      if (d < CELL_W * 0.8 && d < closestDist) {
        closestDist = d;
        closest = e;
      }
    });
    if (closest) {
      damageEnemy(closest, proj.damage);
      if (proj.attackType === "slow" && !closest.dead) {
        applySlowEffect(closest, 2000);
      }
    }
  }
}

/* ==========================================================
   12. ENEMY SPAWNING & MOVEMENT
   ========================================================== */

function spawnEnemy(typeKey, row) {
  const template = ENEMIES[typeKey];
  const d = diff();

  const enemy = {
    id: Date.now() + Math.random(),
    type: typeKey,
    row: row,
    x: COLS * CELL_W + 10, // start just off-screen right
    hp: Math.round(template.baseHp * d.hpMult),
    maxHp: Math.round(template.baseHp * d.hpMult),
    speed: template.baseSpeed * d.speedMult,
    baseSpeed: template.baseSpeed * d.speedMult,
    damage: template.damage,
    attackCooldown: template.attackCooldown,
    attackTimer: 0,
    reward: template.reward,
    scoreValue: template.scoreValue,
    special: template.special || null,
    shieldHp: template.shieldHp ? Math.round(template.shieldHp * d.hpMult) : 0,
    slowTimer: 0,
    attacking: null, // reference to defender being attacked
    el: null,
  };

  const el = document.createElement("div");
  el.className = "entity enemy-entity";
  if (enemy.shieldHp > 0) el.classList.add("shielded");
  el.style.left = enemy.x + "px";
  el.style.top  = enemy.row * CELL_H + "px";
  el.innerHTML = `
    <span>${template.icon}</span>
    <div class="hp-bar"><div class="hp-bar-fill" style="width:100%"></div></div>
  `;
  $("#game-board").appendChild(el);
  enemy.el = el;

  state.enemies.push(enemy);
}

function updateEnemies(dt) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];

    // Check if slowed
    if (e.slowTimer > 0) {
      e.slowTimer -= dt * 1000;
      e.speed = e.baseSpeed * 0.4;
      if (e.el) e.el.classList.add("slowed");
    } else {
      e.speed = e.baseSpeed;
      if (e.el) e.el.classList.remove("slowed");
    }

    // Check for a defender blocking the path
    const blockingDefender = findBlockingDefender(e);

    if (blockingDefender) {
      // Attack the defender
      e.attacking = blockingDefender;
      e.attackTimer -= dt * 1000;
      if (e.attackTimer <= 0) {
        e.attackTimer = e.attackCooldown;
        damageDefender(blockingDefender, e.damage);
      }
    } else {
      e.attacking = null;
      // Move left
      e.x -= e.speed * dt;
      if (e.el) {
        e.el.style.left = e.x + "px";
      }
    }

    // Reached the left edge — lose a life
    if (e.x < -30) {
      state.lives -= 1;
      SFX.hurt();
      removeEnemy(i);
      if (state.lives <= 0) {
        gameOver(false);
        return;
      }
      updateHUD();
    }
  }
}

function findBlockingDefender(enemy) {
  const row = enemy.row;
  // Check all columns from right to left relative to enemy position
  for (let c = COLS - 1; c >= 0; c--) {
    const def = state.grid[row][c];
    if (!def) continue;
    const defRightEdge = (c + 1) * CELL_W;
    const defLeftEdge = c * CELL_W;
    // Enemy front is at e.x
    if (enemy.x <= defRightEdge + 5 && enemy.x >= defLeftEdge - 5) {
      return def;
    }
  }
  return null;
}

function removeEnemy(index) {
  const e = state.enemies[index];
  if (e.el) {
    e.el.classList.add("entity-dying");
    setTimeout(() => e.el.remove(), 300);
  }
  state.enemies.splice(index, 1);
  state.waveEnemiesLeft -= 1;
}

/* ==========================================================
   13. COMBAT & COLLISIONS
   ========================================================== */

function damageEnemy(enemy, amount) {
  if (enemy.dead) return; // guard against double-kills in the same frame
  // Shield absorbs damage first
  if (enemy.shieldHp > 0) {
    const before = enemy.shieldHp;
    enemy.shieldHp -= amount;
    if (enemy.shieldHp <= 0) {
      // Shield broken — carry overflow damage to HP
      const overflow = -enemy.shieldHp;
      enemy.shieldHp = 0;
      if (enemy.el) enemy.el.classList.remove("shielded");
      if (overflow > 0) enemy.hp -= overflow;
    }
  } else {
    enemy.hp -= amount;
  }

  // Flash
  if (enemy.el) {
    enemy.el.classList.remove("damage-flash");
    void enemy.el.offsetWidth; // force reflow
    enemy.el.classList.add("damage-flash");
  }

  // Update HP bar
  updateEnemyHPBar(enemy);

  if (enemy.hp <= 0) {
    killEnemy(enemy);
  }
}

function killEnemy(enemy) {
  if (enemy.dead) return; // prevent double-reward from simultaneous hits
  enemy.dead = true;
  state.stardust += enemy.reward;
  state.score += enemy.scoreValue;
  const idx = state.enemies.indexOf(enemy);
  if (idx !== -1) removeEnemy(idx);
  updateHUD();
}

function damageDefender(defender, amount) {
  defender.hp -= amount;

  // Flash
  if (defender.el) {
    defender.el.classList.remove("damage-flash");
    void defender.el.offsetWidth;
    defender.el.classList.add("damage-flash");
  }

  // Update HP bar
  updateDefenderHPBar(defender);

  if (defender.hp <= 0) {
    killDefender(defender);
  }
}

function killDefender(defender) {
  state.grid[defender.row][defender.col] = null;
  const cell = $(`.cell[data-row="${defender.row}"][data-col="${defender.col}"]`);
  if (cell) cell.classList.remove("occupied");
  if (defender.el) {
    defender.el.classList.add("entity-dying");
    setTimeout(() => defender.el.remove(), 300);
  }
  state.defenders = state.defenders.filter(d => d.id !== defender.id);
}

function applySlowEffect(enemy, durationMs) {
  enemy.slowTimer = durationMs;
}

function updateEnemyHPBar(enemy) {
  if (!enemy.el) return;
  const fill = enemy.el.querySelector(".hp-bar-fill");
  if (fill) {
    const pct = Math.max(0, enemy.hp / enemy.maxHp * 100);
    fill.style.width = pct + "%";
  }
}

function updateDefenderHPBar(defender) {
  if (!defender.el) return;
  const fill = defender.el.querySelector(".hp-bar-fill");
  if (fill) {
    const pct = Math.max(0, defender.hp / defender.maxHp * 100);
    fill.style.width = pct + "%";
  }
}

/* ==========================================================
   14. DEFENDER ATTACKS
   ========================================================== */

function updateDefenderAttacks(dt) {
  state.defenders.forEach(def => {
    const template = DEFENDERS[def.type];

    // Star Bloom: generate stardust
    if (template.special === "generate") {
      def.generateTimer += dt * 1000;
      if (def.generateTimer >= template.cooldown) {
        def.generateTimer = 0;
        spawnStardustPickup(def.col, def.row);
      }
      return;
    }

    // Non-attacking defenders
    if (template.attackType === "none") return;

    // Cooldown
    def.cooldownLeft -= dt * 1000;
    if (def.cooldownLeft > 0) return;

    // Find a target in the same row, within range, to the right
    let target = null;
    let targetDist = Infinity;
    state.enemies.forEach(e => {
      if (e.row !== def.row) return;
      const eCenterX = e.x + 25;
      const defCenterX = def.col * CELL_W + CELL_W / 2;
      const cellDist = (eCenterX - defCenterX) / CELL_W;
      if (cellDist > 0 && cellDist <= template.range && cellDist < targetDist) {
        targetDist = cellDist;
        target = e;
      }
    });

    if (target) {
      def.cooldownLeft = template.cooldown;
      const targetX = target.x + 25;
      const targetY = target.row * CELL_H + CELL_H / 2;
      createProjectile(def, targetX, targetY);
    }
  });
}

/* ==========================================================
   15. RESOURCE SYSTEM — Stardust Pickups
   ========================================================== */

function spawnStardustPickup(col, row) {
  const pickup = {
    id: Date.now() + Math.random(),
    x: col * CELL_W + 10 + Math.random() * (CELL_W - 20),
    y: row * CELL_H + 10 + Math.random() * (CELL_H - 20),
    value: 25,
    lifetime: 8000, // disappears after 8 seconds
    el: null,
  };

  const el = document.createElement("div");
  el.className = "stardust-pickup";
  el.textContent = "\u{2B50}"; // ⭐
  el.style.left = pickup.x + "px";
  el.style.top  = pickup.y + "px";
  el.addEventListener("click", () => collectPickup(pickup));
  $("#game-board").appendChild(el);
  pickup.el = el;

  state.pickups.push(pickup);
}

function collectPickup(pickup) {
  state.stardust += pickup.value;
  SFX.collect();
  if (pickup.el) pickup.el.remove();
  state.pickups = state.pickups.filter(p => p.id !== pickup.id);
  updateHUD();
  updateToolbar();
}

function updatePickups(dt) {
  for (let i = state.pickups.length - 1; i >= 0; i--) {
    const p = state.pickups[i];
    p.lifetime -= dt * 1000;
    if (p.lifetime <= 0) {
      if (p.el) p.el.remove();
      state.pickups.splice(i, 1);
    } else if (p.lifetime < 2000 && p.el) {
      // Fade out
      p.el.style.opacity = p.lifetime / 2000;
    }
  }
}

/** Passive stardust generation */
function updatePassiveResources(dt) {
  state.passiveTimer += dt * 1000;
  const interval = 4000; // every 4 seconds
  if (state.passiveTimer >= interval) {
    state.passiveTimer -= interval;
    state.stardust += diff().passiveDust;
    updateHUD();
    updateToolbar();
  }
}

/* ==========================================================
   16. WAVE MANAGER
   ========================================================== */

let allWaves = [];

function startNextWave() {
  state.currentWave += 1;
  if (state.currentWave > TOTAL_WAVES) {
    gameOver(true);
    return;
  }

  const wave = allWaves[state.currentWave - 1];
  state.waveActive = true;

  // Build the spawn queue: each entry is { type, row, delay (ms from wave start) }
  const queue = [];
  let time = 0;
  wave.enemies.forEach(group => {
    for (let n = 0; n < group.count; n++) {
      const row = Math.floor(Math.random() * ROWS);
      queue.push({
        type: group.type,
        row,
        delay: time,
      });
      time += group.interval * diff().spawnMult;
    }
  });

  // Shuffle the queue slightly to mix enemy types
  for (let i = queue.length - 1; i > 0; i--) {
    // Keep delay ordering but shuffle within a small window
    const j = Math.max(0, i - Math.floor(Math.random() * 3));
    [queue[i].type, queue[j].type] = [queue[j].type, queue[i].type];
    [queue[i].row, queue[j].row] = [queue[j].row, queue[i].row];
  }

  state.waveSpawnQueue = queue;
  state.waveEnemiesLeft = queue.length;
  state.spawnTimer = 0;

  // Show wave announcement
  announceWave(state.currentWave);
  SFX.waveStart();
  updateHUD();
}

function updateWaveSpawning(dt) {
  if (!state.waveActive) return;

  state.spawnTimer += dt * 1000;

  while (state.waveSpawnQueue.length > 0 && state.waveSpawnQueue[0].delay <= state.spawnTimer) {
    const entry = state.waveSpawnQueue.shift();
    spawnEnemy(entry.type, entry.row);
  }

  // Check if wave is complete (all spawned and all dead)
  if (state.waveSpawnQueue.length === 0 && state.waveEnemiesLeft <= 0) {
    state.waveActive = false;
    state.betweenWaves = true;
    // Short delay before next wave
    scheduleNextWaveTransition();
  }
}

function scheduleNextWaveTransition() {
  gameTimeout(() => {
    if (state.running && !state.paused) {
      state.betweenWaves = false;
      startNextWave();
    }
    // If paused, the unpause handler will re-schedule
  }, 4000);
}

function announceWave(num) {
  const el = $("#wave-announce");
  const text = $("#wave-announce-text");
  if (num > TOTAL_WAVES) return;
  text.textContent = num === TOTAL_WAVES ? `Final Wave!` : `Wave ${num}`;
  show(el);
  setTimeout(() => hide(el), 2200);
}

/* ==========================================================
   17. HUD UPDATE
   ========================================================== */

function updateHUD() {
  $("#stardust-count").textContent = state.stardust;
  $("#wave-count").textContent = state.currentWave;
  $("#lives-count").textContent = state.lives;
  $("#score-count").textContent = state.score;
}

/* ==========================================================
   18. GAME OVER
   ========================================================== */

function gameOver(won) {
  state.running = false;
  if (state.animFrameId) cancelAnimationFrame(state.animFrameId);

  $("#gameover-title").textContent = won ? "Victory!" : "Game Over";
  $("#gameover-message").textContent = won
    ? "You defended the galaxy from all alien waves!"
    : "The aliens broke through your defenses...";
  $("#gameover-score").textContent = state.score;
  show("#gameover-overlay");

  if (won) SFX.win();
  else SFX.lose();
}

/* ==========================================================
   19. GAME LOOP
   ========================================================== */

function gameLoop(timestamp) {
  if (!state.running) return;
  state.animFrameId = requestAnimationFrame(gameLoop);
  if (state.paused) return;

  const dt = Math.min((timestamp - state.lastFrame) / 1000, 0.1); // cap delta
  state.lastFrame = timestamp;

  updateDefenderAttacks(dt);
  updateProjectiles(dt);
  updateEnemies(dt);
  updateWaveSpawning(dt);
  updatePickups(dt);
  updatePassiveResources(dt);
  updateToolbar();
}

/* ==========================================================
   20. GAME START / RESTART / MENU
   ========================================================== */

function startGame() {
  // Cancel any pending timers from a previous game
  clearGameTimers();

  // Reset state
  state.stardust = diff().startDust;
  state.lives = 10;
  state.score = 0;
  state.currentWave = 0;
  state.waveActive = false;
  state.waveEnemiesLeft = 0;
  state.waveSpawnQueue = [];
  state.spawnTimer = 0;
  state.passiveTimer = 0;
  state.selectedDefender = null;
  state.defenders = [];
  state.enemies = [];
  state.projectiles = [];
  state.pickups = [];
  state.paused = false;
  state.betweenWaves = false;

  // Generate waves
  allWaves = generateWaves();

  // Build board & toolbar
  createBoard();
  buildToolbar();
  updateHUD();

  // Hide overlays
  hide("#pause-overlay");
  hide("#gameover-overlay");
  hide("#wave-announce");

  switchScreen("#game-screen");

  // Start loop
  state.running = true;
  state.lastFrame = performance.now();
  state.animFrameId = requestAnimationFrame(gameLoop);

  // Start first wave after brief delay
  gameTimeout(() => {
    if (state.running) startNextWave();
  }, 2000);
}

/* ==========================================================
   21. UI EVENT WIRING
   ========================================================== */

function wireUI() {
  // Start button
  $("#btn-start").addEventListener("click", () => {
    SFX.resume();
    state.difficulty = $("#difficulty-select").value;
    startGame();
  });

  // Pause
  $("#btn-pause").addEventListener("click", () => {
    if (!state.running) return;
    state.paused = !state.paused;
    if (state.paused) {
      show("#pause-overlay");
      $("#btn-pause").innerHTML = "&#9654; Play";
    } else {
      hide("#pause-overlay");
      $("#btn-pause").innerHTML = "&#9208; Pause";
      state.lastFrame = performance.now(); // prevent huge dt after unpause
      // If we paused during wave transition, re-schedule it
      if (state.betweenWaves) {
        scheduleNextWaveTransition();
      }
    }
  });

  // Resume
  $("#btn-resume").addEventListener("click", () => {
    state.paused = false;
    hide("#pause-overlay");
    $("#btn-pause").innerHTML = "&#9208; Pause";
    state.lastFrame = performance.now();
    // If we paused during wave transition, re-schedule it
    if (state.betweenWaves) {
      scheduleNextWaveTransition();
    }
  });

  // Restart
  $("#btn-restart").addEventListener("click", () => {
    state.running = false;
    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
    clearGameTimers();
    startGame();
  });

  // Back to menu
  $("#btn-menu").addEventListener("click", () => {
    state.running = false;
    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
    clearGameTimers();
    hide("#pause-overlay");
    hide("#gameover-overlay");
    switchScreen("#start-menu");
  });

  // Game over buttons
  $("#btn-gameover-restart").addEventListener("click", () => {
    hide("#gameover-overlay");
    startGame();
  });
  $("#btn-gameover-menu").addEventListener("click", () => {
    hide("#gameover-overlay");
    switchScreen("#start-menu");
  });

  // Sound toggle
  $("#btn-sound").addEventListener("click", () => {
    SFX.enabled = !SFX.enabled;
    $("#btn-sound").innerHTML = SFX.enabled ? "&#128266; On" : "&#128263; Off";
    SFX.resume();
  });

  // Defender toolbar selection
  $("#defender-toolbar").addEventListener("click", (e) => {
    const card = e.target.closest(".defender-card");
    if (!card) return;
    SFX.resume();
    const key = card.dataset.key;
    if (card.classList.contains("disabled")) return;
    state.selectedDefender = (state.selectedDefender === key) ? null : key;
    updateToolbar();
  });

  // Board click — place defender
  $("#game-board").addEventListener("click", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell) return;
    if (!state.selectedDefender) return;
    if (!state.running || state.paused) return;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    if (state.grid[row][col] !== null) return;
    placeDefender(row, col);
  });

  // Prevent context menu on the game board
  $("#game-board").addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state.running) {
        $("#btn-pause").click();
      }
    }
  });
}

/* ==========================================================
   22. INITIALIZATION
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  wireUI();
});
