const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start");

const STORAGE_KEY = "ufo-escape-best";

const state = {
  running: false,
  paused: false,
  lastTime: 0,
  speed: 6.1,
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY)) || 0,
  spawnTimer: 0,
  spawnInterval: 980,
  obstacles: [],
  stars: [],
  starTimer: 0,
  bullets: [],
  shootCooldown: 0,
  boss: null,
  bossTimer: 0,
  bossInterval: 28000,
  particles: []
};

const ufo = {
  x: 140,
  y: 0,
  width: 52,
  height: 28,
  speed: 0.5
};

const keys = {
  up: false,
  down: false,
  shoot: false
};

function getCanvasSize() {
  const ratio = window.devicePixelRatio || 1;
  return {
    width: canvas.width / ratio,
    height: canvas.height / ratio
  };
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const { clientWidth, clientHeight } = canvas;
  canvas.width = clientWidth * ratio;
  canvas.height = clientHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function resetGame() {
  state.running = true;
  state.paused = false;
  state.lastTime = 0;
  state.speed = 6.1;
  state.score = 0;
  state.spawnTimer = 0;
  state.spawnInterval = 980;
  state.obstacles = [];
  state.stars = [];
  state.starTimer = 0;
  state.bullets = [];
  state.shootCooldown = 0;
  state.boss = null;
  state.bossTimer = 0;
  state.particles = [];
  const { height } = getCanvasSize();
  ufo.y = height / 2 - ufo.height / 2;
  overlay.classList.add("hidden");
  loop(0);
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  if (!state.paused) {
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}

function addObstacle() {
  const size = 22 + Math.random() * 40;
  const { width: canvasWidth, height: canvasHeight } = getCanvasSize();
  const y = Math.random() * (canvasHeight - size);
  const hp = size > 50 ? 4 : size > 38 ? 3 : 2;
  state.obstacles.push({
    x: canvasWidth + 40,
    y,
    width: size,
    height: size,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() * 0.08 + 0.03) * (Math.random() > 0.5 ? 1 : -1),
    hp
  });
}

function addStar() {
  const { width: canvasWidth, height: canvasHeight } = getCanvasSize();
  state.stars.push({
    x: canvasWidth + 20,
    y: 10 + Math.random() * (canvasHeight - 20),
    size: 1 + Math.random() * 2,
    speed: 1 + Math.random() * 1.5
  });
}

function addBullet() {
  const bullet = {
    x: ufo.x + ufo.width + 6,
    y: ufo.y + ufo.height / 2 - 2,
    width: 12,
    height: 4,
    speed: 10
  };
  state.bullets.push(bullet);
}

function addExplosion(x, y, size) {
  const amount = 10 + Math.floor(size / 6);
  for (let i = 0; i < amount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.2;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 520 + Math.random() * 280,
      size: 2 + Math.random() * 3,
      hue: 28 + Math.random() * 24
    });
  }
}

function spawnBoss() {
  const { width: canvasWidth, height: canvasHeight } = getCanvasSize();
  const bossColors = [
    { base: "#4c1d95", core: "#c4b5fd", accent: "#22c55e" },
    { base: "#0f766e", core: "#5eead4", accent: "#facc15" },
    { base: "#7f1d1d", core: "#fca5a5", accent: "#60a5fa" },
    { base: "#1e3a8a", core: "#93c5fd", accent: "#f472b6" }
  ];
  const palette = bossColors[Math.floor(Math.random() * bossColors.length)];
  state.boss = {
    x: canvasWidth + 120,
    y: canvasHeight / 2 - 60,
    width: 160,
    height: 120,
    hp: 20,
    direction: 1,
    speed: 1.2,
    targetX: canvasWidth - 240,
    shootTimer: 0,
    shootInterval: 1200,
    colors: palette
  };
}

function update(delta) {
  const { height: canvasHeight, width: canvasWidth } = getCanvasSize();
  const move = ufo.speed * delta;
  if (keys.up) ufo.y -= move;
  if (keys.down) ufo.y += move;
  ufo.y = Math.max(12, Math.min(canvasHeight - ufo.height - 12, ufo.y));

  state.shootCooldown = Math.max(0, state.shootCooldown - delta);
  if (keys.shoot && state.shootCooldown === 0) {
    addBullet();
    state.shootCooldown = 220;
  }

  state.spawnTimer += delta;
  if (state.spawnTimer >= state.spawnInterval && !state.boss) {
    state.spawnTimer = 0;
    addObstacle();
    state.spawnInterval = 650 + Math.random() * 550;
  }

  state.starTimer += delta;
  if (state.starTimer >= 200) {
    state.starTimer = 0;
    addStar();
  }

  state.bossTimer += delta;
  if (!state.boss && state.bossTimer >= state.bossInterval) {
    state.bossTimer = 0;
    spawnBoss();
  }

  state.obstacles.forEach((obs) => {
    obs.x -= state.speed;
    obs.rotation += obs.spin;
    const targetY = ufo.y + ufo.height / 2 - obs.height / 2;
    const follow = Math.max(-0.32, Math.min(0.32, targetY - obs.y));
    obs.y += follow;
  });

  state.bullets.forEach((bullet) => {
    bullet.x += bullet.speed;
  });

  state.stars.forEach((star) => {
    star.x -= star.speed;
  });

  state.particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= delta;
  });

  state.obstacles = state.obstacles.filter((obs) => obs.x + obs.width > -40);
  state.bullets = state.bullets.filter(
    (bullet) => bullet.x < canvasWidth + 40 && bullet.x + bullet.width > -40
  );
  state.stars = state.stars.filter((star) => star.x > -20);
  state.particles = state.particles.filter((particle) => particle.life > 0);

  if (state.boss) {
    const boss = state.boss;
    if (boss.x > boss.targetX) {
      boss.x -= state.speed * 0.55;
      if (boss.x < boss.targetX) boss.x = boss.targetX;
    }
    boss.y += boss.direction * boss.speed;
    if (boss.y < 20 || boss.y + boss.height > canvasHeight - 20) {
      boss.direction *= -1;
    }
    boss.shootTimer += delta;
    if (boss.shootTimer >= boss.shootInterval) {
      boss.shootTimer = 0;
      state.bullets.push({
        x: boss.x,
        y: boss.y + boss.height * (0.35 + Math.random() * 0.3),
        width: 10,
        height: 6,
        speed: -6.5,
        fromBoss: true
      });
    }
  }

  state.speed += delta * 0.00018;
  state.score += delta * 0.01;

  scoreEl.textContent = Math.floor(state.score);
  if (state.score > state.best) {
    state.best = Math.floor(state.score);
    bestEl.textContent = state.best;
    localStorage.setItem(STORAGE_KEY, String(state.best));
  }

  checkCollision();
  checkBulletHits();
}

function checkCollision() {
  for (const obs of state.obstacles) {
    const hit =
      ufo.x < obs.x + obs.width &&
      ufo.x + ufo.width > obs.x &&
      ufo.y < obs.y + obs.height &&
      ufo.y + ufo.height > obs.y;

    if (hit) {
      gameOver();
      break;
    }
  }

  if (state.boss) {
    const boss = state.boss;
    const hit =
      ufo.x < boss.x + boss.width &&
      ufo.x + ufo.width > boss.x &&
      ufo.y < boss.y + boss.height &&
      ufo.y + ufo.height > boss.y;
    if (hit) gameOver();
  }

  for (const bullet of state.bullets) {
    if (!bullet.fromBoss) continue;
    const hit =
      ufo.x < bullet.x + bullet.width &&
      ufo.x + ufo.width > bullet.x &&
      ufo.y < bullet.y + bullet.height &&
      ufo.y + ufo.height > bullet.y;
    if (hit) {
      gameOver();
      break;
    }
  }
}

function checkBulletHits() {
  if (!state.bullets.length) return;

  state.bullets.forEach((bullet) => {
    if (bullet.fromBoss) return;
    state.obstacles.forEach((obs) => {
      const hit =
        bullet.x < obs.x + obs.width &&
        bullet.x + bullet.width > obs.x &&
        bullet.y < obs.y + obs.height &&
        bullet.y + bullet.height > obs.y;
      if (hit) {
        obs.hp -= 1;
        bullet.x = 99999;
      }
    });
  });

  state.obstacles = state.obstacles.filter((obs) => {
    if (obs.hp <= 0) {
      addExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width);
      state.score += 12;
      return false;
    }
    return true;
  });

  if (state.boss) {
    const boss = state.boss;
    state.bullets.forEach((bullet) => {
      if (bullet.fromBoss) return;
      const hit =
        bullet.x < boss.x + boss.width &&
        bullet.x + bullet.width > boss.x &&
        bullet.y < boss.y + boss.height &&
        bullet.y + bullet.height > boss.y;
      if (hit) {
        boss.hp -= 1;
        bullet.x = 99999;
      }
    });
    if (boss.hp <= 0) {
      addExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.width);
      state.boss = null;
      state.score += 250;
    }
  }
}

function gameOver() {
  state.running = false;
  overlay.classList.remove("hidden");
  overlay.querySelector("h1").textContent = "Game Over";
  overlay.querySelector("p").textContent = "Use ↑/↓ ou clique em Iniciar";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scale = window.devicePixelRatio || 1;
  const width = canvas.width / scale;
  const height = canvas.height / scale;

  state.stars.forEach((star) => {
    ctx.fillStyle = "rgba(200, 225, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.save();
  ctx.translate(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2);
  ctx.shadowColor = "rgba(57, 255, 20, 0.8)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#39ff14";
  ctx.beginPath();
  ctx.ellipse(0, 2, ufo.width / 2, ufo.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#8bff6a";
  ctx.beginPath();
  ctx.ellipse(0, -6, ufo.width / 4, ufo.height / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  state.obstacles.forEach((obs) => {
    ctx.save();
    ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
    ctx.rotate(obs.rotation);
    const radius = obs.width / 2;
    const spikeCount = obs.width > 50 ? 12 : 9;
    ctx.strokeStyle = "rgba(255, 190, 90, 0.9)";
    ctx.lineWidth = Math.max(1, radius * 0.08);
    for (let i = 0; i < spikeCount; i += 1) {
      const angle = (Math.PI * 2 * i) / spikeCount;
      const inner = radius * 0.9;
      const outer = radius * 1.15;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    const gradient = ctx.createRadialGradient(
      -radius * 0.3,
      -radius * 0.3,
      radius * 0.2,
      0,
      0,
      radius
    );
    gradient.addColorStop(0, obs.width > 50 ? "#f59e0b" : "#fbbf24");
    gradient.addColorStop(1, obs.width > 50 ? "#7c2d12" : "#9a3412");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = Math.max(1, radius * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.arc(-radius * 0.25, -radius * 0.1, radius * 0.22, 0, Math.PI * 2);
    ctx.arc(radius * 0.2, radius * 0.15, radius * 0.16, 0, Math.PI * 2);
    ctx.arc(radius * 0.05, -radius * 0.28, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  state.particles.forEach((particle) => {
    const alpha = Math.max(0, Math.min(1, particle.life / 600));
    ctx.fillStyle = `hsla(${particle.hue}, 90%, 60%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });

  state.bullets.forEach((bullet) => {
    ctx.fillStyle = bullet.fromBoss ? "#f472b6" : "#e2ff5a";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  if (state.boss) {
    const boss = state.boss;
    const base = boss.colors?.base || "#5b21b6";
    const core = boss.colors?.core || "#a78bfa";
    const accent = boss.colors?.accent || "#22c55e";

    ctx.save();
    ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-boss.width * 0.5, 10);
    ctx.lineTo(-boss.width * 0.2, -boss.height * 0.25);
    ctx.lineTo(0, -boss.height * 0.35);
    ctx.lineTo(boss.width * 0.2, -boss.height * 0.25);
    ctx.lineTo(boss.width * 0.5, 10);
    ctx.lineTo(boss.width * 0.3, boss.height * 0.28);
    ctx.lineTo(-boss.width * 0.3, boss.height * 0.28);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0, -boss.height * 0.08, boss.width * 0.22, boss.height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(-boss.width * 0.16, 4, boss.width * 0.06, boss.height * 0.06, 0, 0, Math.PI * 2);
    ctx.ellipse(boss.width * 0.16, 4, boss.width * 0.06, boss.height * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-boss.width * 0.35, boss.height * 0.15);
    ctx.lineTo(boss.width * 0.35, boss.height * 0.15);
    ctx.stroke();
    ctx.restore();

    const barWidth = 140;
    const barX = boss.x + (boss.width - barWidth) / 2;
    const barY = boss.y - 14;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(barX, barY, barWidth, 6);
    ctx.fillStyle = accent;
    ctx.fillRect(barX, barY, (boss.hp / 20) * barWidth, 6);
  }
}

function loop(timestamp) {
  if (!state.running) return;
  if (state.paused) return;
  const delta = state.lastTime ? timestamp - state.lastTime : 16;
  state.lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

function init() {
  resizeCanvas();
  bestEl.textContent = state.best;
  overlay.classList.remove("hidden");
  window.addEventListener("keydown", (event) => {
    if (event.code === "ArrowUp") {
      keys.up = true;
    }
    if (event.code === "ArrowDown") {
      keys.down = true;
    }
    if (event.code === "Space") {
      keys.shoot = true;
    }
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      if (!state.running) {
        resetGame();
      }
    }
    if (event.code === "KeyP") {
      togglePause();
    }
  });
  window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowUp") keys.up = false;
    if (event.code === "ArrowDown") keys.down = false;
    if (event.code === "Space") keys.shoot = false;
  });
  startBtn.addEventListener("click", () => {
    resetGame();
  });
  window.addEventListener("resize", resizeCanvas);
}

init();
