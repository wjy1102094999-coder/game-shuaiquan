(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const waveEl = document.getElementById("wave");
  const levelEl = document.getElementById("level");
  const xpTextEl = document.getElementById("xpText");
  const healthEl = document.getElementById("health");
  const statusEl = document.getElementById("status");
  const finalScoreEl = document.getElementById("finalScore");
  const restartTop = document.getElementById("restartTop");
  const restartMain = document.getElementById("restartMain");
  const typeButton = document.getElementById("typeButton");
  const typeNameEl = document.getElementById("typeName");
  const characterSelectEl = document.getElementById("characterSelect");
  const characterOptionsEl = document.getElementById("characterOptions");
  const characterCloseEl = document.getElementById("characterClose");
  const upgradeEl = document.getElementById("upgrade");
  const upgradeOptionsEl = document.getElementById("upgradeOptions");
  const joystickEl = document.getElementById("joystick");
  const stickEl = document.getElementById("stick");
  const aimJoystickEl = document.getElementById("aimJoystick");
  const aimStickEl = document.getElementById("aimStick");

  const ARENA = { width: 2200, height: 2200, pad: 62 };
  const PLAYER_COLOR = "#4dd7c1";
  const ENEMY_COLORS = ["#ef6351", "#f29f4b", "#8a7cf6", "#c7df54", "#e86198"];
  const TWO_PI = Math.PI * 2;
  const MAX_AIM_TURN_RATE = 12.4;
  const AUTO_AIM_TURN_RATE = 7.4;
  const SPIN_STRESS_START = 6.2;
  const SPIN_STRESS_FULL = 10.6;
  const FIST_HIT_COOLDOWN = 0.18;
  const STRONG_HIT_SPEED = 230;
  const FULL_HIT_SPEED = 720;
  const FIST_SWEEP_PADDING = 4.5;
  const UPGRADE_INTERVAL = 5;
  const PICKUP_LIMIT = 28;
  const PICKUP_MAGNET_RADIUS = 116;
  const ACTION_LOG_DURATION = 2.4;
  const ECHO_ACTION_DELAY = 0.9;
  const ECHO_DELAY_STEP = 0.34;
  const VIEW_SCALE = 0.82;

  const HAZARD_TYPES = {
    bumper: { label: "弹力柱", color: "#f4c84f", radius: 38 },
    vortex: { label: "旋风区", color: "#69a7ff", radius: 112 },
    mud: { label: "缓速泥潭", color: "#6f7f4b", radius: 120 },
    spike: { label: "裂核", color: "#ef6351", radius: 72 },
    spring: { label: "冲刺弹板", color: "#4dd7c1", radius: 58 },
  };

  const EVOLUTIONS = {
    balanced: [
      { level: 4, label: "双核", desc: "生命与伤害提升", apply: () => evolveStats({ maxHealth: 1, damageScale: 0.18, armLength: 4 }) },
      { level: 8, label: "统御", desc: "全面强化并提高容错", apply: () => evolveStats({ maxHealth: 1, damageScale: 0.2, speed: 16, parryPower: 0.22 }) },
    ],
    swift: [
      { level: 4, label: "残影", desc: "冷却缩短并获得回放分身", apply: () => evolveStats({ cooldownScale: 0.86, speed: 22, echo: 1 }) },
      { level: 8, label: "闪击", desc: "转向上限和速度大幅提升", apply: () => evolveStats({ speed: 30, turnRate: 1.2, damageScale: 0.12 }) },
    ],
    brawler: [
      { level: 4, label: "铁腕", desc: "生命和重拳伤害提升", apply: () => evolveStats({ maxHealth: 2, damageScale: 0.38, fistRadius: 2.5 }) },
      { level: 8, label: "破城", desc: "Boss 肢体伤害和臂展提升", apply: () => evolveStats({ damageScale: 0.45, armLength: 9, bossBreaker: 0.45 }) },
    ],
    spring: [
      { level: 4, label: "回环", desc: "反弹与回弹能力提升", apply: () => evolveStats({ parryPower: 0.42, returnBonus: 0.24, turnRate: 0.7 }) },
      { level: 8, label: "反冲", desc: "招架后恢复并强化拳头", apply: () => evolveStats({ parryPower: 0.5, damageScale: 0.18, healOnParry: 0.18 }) },
    ],
  };

  const PLAYER_TYPES = {
    balanced: {
      label: "均衡",
      desc: "3 生命，稳定伤害和容错",
      skill: "均衡成长",
      color: PLAYER_COLOR,
      accent: "#e9fff8",
      bodyRadius: 24,
      fistRadius: 15,
      armLength: 78,
      speed: 310,
      accel: 11.5,
      brake: 9.5,
      maxHealth: 3,
      damageScale: 1.05,
      parryPower: 1,
      hazardResist: 1,
      cooldownScale: 1,
      hitScale: 1,
      returnMultiplier: 1,
      spinRecovery: 1,
      spinPenalty: 0.48,
      sweepPadding: 4.5,
      orbitCarry: 1,
    },
    swift: {
      label: "疾拳",
      desc: "2 生命，极速移动和短冷却",
      skill: "高速连拳",
      color: "#69a7ff",
      accent: "#eaf3ff",
      bodyRadius: 21,
      fistRadius: 13.8,
      armLength: 74,
      speed: 388,
      accel: 14.4,
      brake: 12.2,
      maxHealth: 2,
      damageScale: 0.82,
      parryPower: 0.86,
      hazardResist: 1.08,
      cooldownScale: 0.62,
      hitScale: 0.9,
      returnMultiplier: 1.12,
      spinRecovery: 1.28,
      spinPenalty: 0.52,
      sweepPadding: 5,
      orbitCarry: 1.04,
    },
    brawler: {
      label: "重腕",
      desc: "5 生命，笨重但高伤害",
      skill: "破坏重拳",
      color: "#f4c84f",
      accent: "#fff5c8",
      bodyRadius: 27,
      fistRadius: 18,
      armLength: 86,
      speed: 238,
      accel: 8.3,
      brake: 7.0,
      maxHealth: 5,
      damageScale: 2.1,
      parryPower: 1.32,
      hazardResist: 0.74,
      cooldownScale: 1.22,
      hitScale: 1.44,
      returnMultiplier: 0.78,
      spinRecovery: 0.82,
      spinPenalty: 0.4,
      sweepPadding: 8.2,
      orbitCarry: 0.9,
    },
    spring: {
      label: "弹簧",
      desc: "3 生命，招架反弹和回弹最强",
      skill: "弹性招架",
      color: "#e86198",
      accent: "#ffe8f1",
      bodyRadius: 23,
      fistRadius: 14.6,
      armLength: 82,
      speed: 316,
      accel: 12.8,
      brake: 11.8,
      maxHealth: 3,
      damageScale: 0.98,
      parryPower: 1.58,
      hazardResist: 0.94,
      cooldownScale: 0.88,
      hitScale: 1.03,
      returnMultiplier: 1.9,
      spinRecovery: 1.82,
      spinPenalty: 0.36,
      sweepPadding: 5.4,
      orbitCarry: 1.2,
    },
  };

  const ENEMY_TYPES = {
    normal: {
      label: "游击",
      color: "#ef6351",
      bodyRadius: [20, 23],
      fistRadius: [13.5, 14.5],
      armLength: [66, 72],
      speed: [205, 245],
      accel: [6.8, 8.2],
      brake: 6.5,
      health: 1,
      damageScale: 0.82,
      bodyDamage: 1,
      scoreValue: 1,
      hitScale: 1,
      cooldownScale: 1,
      returnMultiplier: 1,
      spinPenalty: 0.34,
      sweepPadding: 4.5,
      idealRange: 116,
      chaseBias: 0.86,
      retreatBias: -0.72,
      lungeWindow: 0.42,
      lungePower: 0.65,
      lungeInterval: [1.5, 3.2],
      sideWeight: 0.38,
      closePower: 0.46,
    },
    dasher: {
      label: "突袭",
      color: "#f29f4b",
      bodyRadius: [18, 20],
      fistRadius: [12.5, 13.5],
      armLength: [62, 68],
      speed: [285, 330],
      accel: [9.5, 11.2],
      brake: 7.8,
      health: 1,
      damageScale: 0.72,
      bodyDamage: 1,
      scoreValue: 1,
      hitScale: 0.96,
      cooldownScale: 0.86,
      returnMultiplier: 1.08,
      spinPenalty: 0.36,
      sweepPadding: 5,
      idealRange: 136,
      chaseBias: 0.9,
      retreatBias: -0.68,
      lungeWindow: 0.68,
      lungePower: 1.08,
      lungeInterval: [0.9, 1.8],
      sideWeight: 0.34,
      closePower: 0.5,
    },
    brute: {
      label: "重拳",
      color: "#8a7cf6",
      bodyRadius: [27, 31],
      fistRadius: [16, 17.5],
      armLength: [76, 84],
      speed: [150, 180],
      accel: [5.2, 6.4],
      brake: 5.7,
      health: 2.4,
      damageScale: 1.1,
      bodyDamage: 1,
      scoreValue: 2,
      hitScale: 1.18,
      cooldownScale: 1.12,
      returnMultiplier: 0.9,
      spinPenalty: 0.3,
      sweepPadding: 6.2,
      idealRange: 86,
      chaseBias: 0.92,
      retreatBias: -0.5,
      lungeWindow: 0.34,
      lungePower: 0.36,
      lungeInterval: [2.1, 3.8],
      sideWeight: 0.18,
      closePower: 0.72,
    },
    longarm: {
      label: "长臂",
      color: "#c7df54",
      bodyRadius: [18, 21],
      fistRadius: [12.5, 13.8],
      armLength: [92, 104],
      speed: [178, 214],
      accel: [6.2, 7.4],
      brake: 6.3,
      health: 1.4,
      damageScale: 0.9,
      bodyDamage: 1,
      scoreValue: 2,
      hitScale: 1.05,
      cooldownScale: 0.94,
      returnMultiplier: 1.16,
      spinPenalty: 0.32,
      sweepPadding: 5.8,
      idealRange: 184,
      chaseBias: 0.52,
      retreatBias: -0.92,
      lungeWindow: 0.36,
      lungePower: 0.42,
      lungeInterval: [1.4, 2.8],
      sideWeight: 0.46,
      closePower: 0.42,
    },
    guard: {
      label: "回旋",
      color: "#e86198",
      bodyRadius: [23, 26],
      fistRadius: [14.5, 15.8],
      armLength: [70, 78],
      speed: [190, 225],
      accel: [7.4, 8.8],
      brake: 7.1,
      health: 1.8,
      damageScale: 0.96,
      bodyDamage: 1,
      scoreValue: 2,
      hitScale: 1.04,
      cooldownScale: 0.9,
      returnMultiplier: 1.28,
      spinPenalty: 0.26,
      sweepPadding: 5.2,
      idealRange: 108,
      chaseBias: 0.72,
      retreatBias: -0.7,
      lungeWindow: 0.46,
      lungePower: 0.28,
      lungeInterval: [1.0, 2.2],
      sideWeight: 0.66,
      closePower: 0.58,
    },
    boss: {
      label: "碎臂首领",
      color: "#d94f43",
      bodyRadius: [45, 50],
      fistRadius: [20, 23],
      armLength: [112, 126],
      speed: [138, 158],
      accel: [4.4, 5.2],
      brake: 5,
      health: 11,
      damageScale: 1.35,
      bodyDamage: 2,
      scoreValue: 10,
      hitScale: 1.24,
      cooldownScale: 1.16,
      returnMultiplier: 0.88,
      spinPenalty: 0.24,
      sweepPadding: 7,
      idealRange: 132,
      chaseBias: 0.82,
      retreatBias: -0.36,
      lungeWindow: 0.42,
      lungePower: 0.34,
      lungeInterval: [1.8, 3.4],
      sideWeight: 0.24,
      closePower: 0.8,
      boss: true,
      limbHealth: 4,
    },
  };

  const ENEMY_WAVE_SKILLS = {
    surge: {
      label: "疾冲",
      color: "#69a7ff",
      minWave: 3,
      apply: (enemy) => {
        enemy.maxSpeed += 46;
        enemy.accelRate += 1.45;
        enemy.cooldownScale *= 0.9;
        enemy.lungePowerBonus = (enemy.lungePowerBonus || 0) + 0.3;
        enemy.lungeWindowBonus = (enemy.lungeWindowBonus || 0) + 0.12;
      },
    },
    longReach: {
      label: "长臂",
      color: "#c7df54",
      minWave: 4,
      apply: (enemy) => {
        enemy.armLength += 14;
        enemy.sweepPadding += 1.4;
        enemy.idealRangeBonus = (enemy.idealRangeBonus || 0) + 34;
        enemy.hitScale += 0.06;
      },
    },
    guarded: {
      label: "硬壳",
      color: "#f4c84f",
      minWave: 5,
      apply: (enemy) => {
        enemy.maxHealth += enemy.isBoss ? 2.2 : 0.85;
        enemy.health += enemy.isBoss ? 2.2 : 0.85;
        enemy.parryPower += 0.28;
        enemy.hazardResist *= 0.9;
      },
    },
    springArm: {
      label: "弹臂",
      color: "#e86198",
      minWave: 6,
      apply: (enemy) => {
        enemy.returnMultiplier *= 1.22;
        enemy.spinRecovery = (enemy.spinRecovery || 1) + 0.38;
        enemy.orbitCarry = Math.min(1.35, (enemy.orbitCarry || 1) + 0.12);
        enemy.parryPower += 0.18;
        enemy.sideWeightBonus = (enemy.sideWeightBonus || 0) + 0.12;
      },
    },
    brutal: {
      label: "重击",
      color: "#8a7cf6",
      minWave: 7,
      apply: (enemy) => {
        enemy.damageScale += 0.32;
        enemy.fistRadius += 1.6;
        enemy.hitScale += 0.14;
        enemy.maxSpeed -= enemy.isBoss ? 0 : 12;
      },
    },
  };

  const COMMON_UPGRADES = [
    {
      title: "臂展强化",
      desc: "手臂长度提升，拳头更容易够到敌人",
      apply: () => {
        state.upgrades.armBonus += 8;
        state.player.armLength += 8;
      },
    },
    {
      title: "重拳强化",
      desc: "拳头判定和冲击感提升",
      apply: () => {
        state.upgrades.fistBonus += 2.2;
        state.player.fistRadius += 2.2;
      },
    },
    {
      title: "核心强化",
      desc: "最大生命提升并立即恢复",
      apply: () => {
        state.upgrades.maxHealthBonus += 1;
        state.player.maxHealth += 1;
        healFighter(state.player, 1);
      },
    },
    {
      title: "破坏强化",
      desc: "拳头伤害和 Boss 肢体伤害提升",
      apply: () => {
        state.upgrades.damageBonus += 0.18;
        state.upgrades.bossBreaker += 0.12;
        state.player.damageScale += 0.18;
      },
    },
    {
      title: "疾行强化",
      desc: "移动速度和起步响应提升",
      apply: () => {
        state.upgrades.speedBonus += 26;
        state.player.maxSpeed += 26;
        state.player.accelRate += 0.55;
      },
    },
    {
      title: "转轴强化",
      desc: "主动转向速度上限提升",
      apply: () => {
        state.upgrades.turnRateBonus += 1.25;
      },
    },
    {
      title: "连击强化",
      desc: "单拳命中冷却缩短",
      apply: () => {
        state.upgrades.cooldownScale = Math.max(0.52, state.upgrades.cooldownScale * 0.84);
      },
    },
    {
      title: "回弹强化",
      desc: "拳头和身体更快回到控制方向",
      apply: () => {
        state.upgrades.returnBonus = Math.min(1.9, state.upgrades.returnBonus * 1.16);
      },
    },
    {
      title: "招架强化",
      desc: "拳头碰拳反弹更强，招架后获得短暂无敌",
      apply: () => {
        state.upgrades.parryBonus += 0.22;
        state.player.parryPower += 0.22;
      },
    },
    {
      title: "拾取磁场",
      desc: "经验与道具会从更远处吸向身体",
      apply: () => {
        state.upgrades.pickupRadius += 34;
      },
    },
    {
      title: "经验共鸣",
      desc: "之后获得的经验提升",
      apply: () => {
        state.upgrades.xpGainScale += 0.16;
      },
    },
  ];

  const CHARACTER_UPGRADES = {
    balanced: [
      {
        title: "稳定核心",
        desc: "生命、伤害和拾取范围小幅提升",
        apply: () => evolveStats({ maxHealth: 1, damageScale: 0.12, armLength: 3 }),
      },
      {
        title: "均势反击",
        desc: "受击后更快恢复，招架能力提升",
        apply: () => evolveStats({ parryPower: 0.2, returnBonus: 0.12 }),
      },
    ],
    swift: [
      {
        title: "回放分身",
        desc: "疾拳专属，生成一个回放过去动作的分身",
        apply: () => {
          if (state.upgrades.echoCount < 2) {
            state.upgrades.echoCount += 1;
          } else {
            state.upgrades.echoPower = Math.min(1.32, state.upgrades.echoPower + 0.1);
          }
          syncEchoes();
        },
      },
      {
        title: "残影共振",
        desc: "疾拳专属，强化分身拳头和本体转速",
        apply: () => {
          if (state.upgrades.echoCount <= 0) {
            state.upgrades.echoCount = 1;
          }
          state.upgrades.echoPower = Math.min(1.32, state.upgrades.echoPower + 0.14);
          state.upgrades.turnRateBonus += 0.55;
          syncEchoes();
        },
      },
      {
        title: "闪击步伐",
        desc: "速度和连击冷却继续强化",
        apply: () => {
          evolveStats({ speed: 24, cooldownScale: 0.88, turnRate: 0.55 });
        },
      },
    ],
    brawler: [
      {
        title: "重腕蓄势",
        desc: "牺牲一点回弹，换取更高拳头伤害",
        apply: () => {
          state.player.damageScale += 0.32;
          state.upgrades.damageBonus += 0.32;
          state.player.returnMultiplier *= 0.94;
        },
      },
      {
        title: "霸体核心",
        desc: "最大生命和机关抗性提升",
        apply: () => {
          evolveStats({ maxHealth: 1, bossBreaker: 0.12 });
          state.player.hazardResist *= 0.88;
        },
      },
      {
        title: "破臂重击",
        desc: "Boss 肢体破坏效率大幅提升",
        apply: () => {
          evolveStats({ damageScale: 0.2, bossBreaker: 0.34, fistRadius: 1.5 });
        },
      },
    ],
    spring: [
      {
        title: "弹性招架",
        desc: "拳头碰拳反弹更强，回弹更快",
        apply: () => {
          evolveStats({ parryPower: 0.36, returnBonus: 0.2, turnRate: 0.35 });
        },
      },
      {
        title: "反冲疗愈",
        desc: "成功招架后恢复少量生命",
        apply: () => {
          state.upgrades.healOnParry += 0.2;
          state.player.parryPower += 0.18;
        },
      },
      {
        title: "弹簧过载",
        desc: "拳头回正和扫掠判定提升",
        apply: () => {
          state.player.returnMultiplier *= 1.16;
          state.player.sweepPadding += 1.3;
          state.player.hitScale += 0.08;
        },
      },
    ],
  };

  const PICKUP_TYPES = {
    xp: {
      color: "#69a7ff",
      radius: 8,
      glow: 18,
    },
    largeXp: {
      color: "#8a7cf6",
      radius: 12,
      glow: 26,
    },
    turn: {
      color: "#f4c84f",
      radius: 12,
      glow: 24,
    },
    reach: {
      color: "#c7df54",
      radius: 12,
      glow: 24,
    },
    speed: {
      color: "#4dd7c1",
      radius: 12,
      glow: 24,
    },
    echo: {
      color: "#e86198",
      radius: 14,
      glow: 30,
    },
  };

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    score: 0,
    level: 1,
    xp: 0,
    xpToNext: 12,
    wave: 1,
    spawnTimer: 0,
    pickupTimer: 0,
    gameOver: false,
    gameOverTimer: 0,
    shake: 0,
    hitStop: 0,
    nextUpgradeAt: UPGRADE_INTERVAL,
    pendingUpgradeCount: 0,
    pendingUpgrade: false,
    pendingCharacterSelect: false,
    selectedPlayerType: "balanced",
    upgrades: {
      armBonus: 0,
      speedBonus: 0,
      fistBonus: 0,
      cooldownScale: 1,
      returnBonus: 1,
      turnRateBonus: 0,
      pickupRadius: 0,
      xpGainScale: 1,
      echoCount: 0,
      echoPower: 1,
      damageBonus: 0,
      maxHealthBonus: 0,
      parryBonus: 0,
      bossBreaker: 0,
      healOnParry: 0,
      evolutionTier: 0,
      evolutionName: "",
    },
    camera: { x: 0, y: 0 },
    input: { x: 0, y: 0, power: 0, active: false },
    aim: { x: 0, y: 1, power: 0, active: false, angle: Math.PI / 2 },
    keys: new Set(),
    player: null,
    enemies: [],
    echoes: [],
    actionLog: [],
    pickups: [],
    hazards: [],
    particles: [],
    decals: [],
    nextBossWave: 4,
  };

  let nextId = 1;
  let lastTime = performance.now();
  let landscapeLockRequested = false;

  const joystick = {
    pointerId: null,
    centerX: 0,
    centerY: 0,
    radius: 58,
  };

  const aimJoystick = {
    pointerId: null,
    centerX: 0,
    centerY: 0,
    radius: 58,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function approach(current, target, rate, dt) {
    return lerp(current, target, 1 - Math.exp(-rate * dt));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function distSq(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function circleHit(ax, ay, ar, bx, by, br) {
    const r = ar + br;
    return distSq(ax, ay, bx, by) <= r * r;
  }

  function pointSegmentDistSq(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq < 0.0001) {
      return distSq(px, py, ax, ay);
    }

    const t = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0, 1);
    return distSq(px, py, ax + dx * t, ay + dy * t);
  }

  function sweptCircleHit(ax0, ay0, ax1, ay1, ar, bx0, by0, bx1, by1, br) {
    const r = ar + br;
    const relStartX = ax0 - bx0;
    const relStartY = ay0 - by0;
    const relEndX = ax1 - bx1;
    const relEndY = ay1 - by1;
    return pointSegmentDistSq(0, 0, relStartX, relStartY, relEndX, relEndY) <= r * r;
  }

  function normalize(x, y) {
    const length = Math.hypot(x, y);
    if (length < 0.0001) {
      return { x: 0, y: 0, length: 0 };
    }
    return { x: x / length, y: y / length, length };
  }

  function limitVector(x, y, maxLength) {
    const vector = normalize(x, y);
    if (vector.length <= maxLength) {
      return { x, y };
    }

    return { x: vector.x * maxLength, y: vector.y * maxLength };
  }

  function createNode(x, y) {
    return { x, y, prevX: x, prevY: y, vx: 0, vy: 0 };
  }

  function rememberNodePosition(node) {
    node.prevX = node.x;
    node.prevY = node.y;
  }

  function rememberFighterPose(fighter) {
    rememberNodePosition(fighter.body);
    for (const arm of fighter.arms) {
      rememberNodePosition(arm.shoulder);
      rememberNodePosition(arm.elbow);
      rememberNodePosition(arm.fist);
    }
  }

  function snapshotNode(node) {
    return {
      x: node.x,
      y: node.y,
      vx: node.vx,
      vy: node.vy,
    };
  }

  function interpolateNodeSnapshot(a, b, t) {
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      vx: lerp(a.vx, b.vx, t),
      vy: lerp(a.vy, b.vy, t),
    };
  }

  function captureActionFrame(fighter) {
    return {
      time: state.time,
      x: fighter.x,
      y: fighter.y,
      vx: fighter.vx,
      vy: fighter.vy,
      heading: fighter.heading,
      aimAngle: fighter.aimAngle,
      aimTargetAngle: fighter.aimTargetAngle,
      aimPower: fighter.aimPower,
      aimAngularVelocity: fighter.aimAngularVelocity,
      spinStress: fighter.spinStress,
      swingPower: fighter.swingPower,
      pulse: fighter.pulse,
      body: snapshotNode(fighter.body),
      arms: fighter.arms.map((arm) => ({
        shoulder: snapshotNode(arm.shoulder),
        elbow: snapshotNode(arm.elbow),
        fist: snapshotNode(arm.fist),
      })),
    };
  }

  function interpolateActionFrame(a, b, t) {
    return {
      time: lerp(a.time, b.time, t),
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      vx: lerp(a.vx, b.vx, t),
      vy: lerp(a.vy, b.vy, t),
      heading: angleLerp(a.heading, b.heading, t),
      aimAngle: angleLerp(a.aimAngle, b.aimAngle, t),
      aimTargetAngle: angleLerp(a.aimTargetAngle, b.aimTargetAngle, t),
      aimPower: lerp(a.aimPower, b.aimPower, t),
      aimAngularVelocity: lerp(a.aimAngularVelocity, b.aimAngularVelocity, t),
      spinStress: lerp(a.spinStress, b.spinStress, t),
      swingPower: lerp(a.swingPower, b.swingPower, t),
      pulse: lerp(a.pulse, b.pulse, t),
      body: interpolateNodeSnapshot(a.body, b.body, t),
      arms: a.arms.map((arm, index) => ({
        shoulder: interpolateNodeSnapshot(arm.shoulder, b.arms[index].shoulder, t),
        elbow: interpolateNodeSnapshot(arm.elbow, b.arms[index].elbow, t),
        fist: interpolateNodeSnapshot(arm.fist, b.arms[index].fist, t),
      })),
    };
  }

  function recordPlayerAction() {
    if (!state.player || !state.player.alive) return;

    state.actionLog.push(captureActionFrame(state.player));
    const cutoff = state.time - ACTION_LOG_DURATION;
    while (state.actionLog.length > 2 && state.actionLog[0].time < cutoff) {
      state.actionLog.shift();
    }
  }

  function samplePlayerAction(delay) {
    const targetTime = state.time - delay;
    const log = state.actionLog;
    if (log.length < 2 || targetTime < log[0].time) return null;
    if (targetTime >= log[log.length - 1].time) return log[log.length - 1];

    for (let i = log.length - 2; i >= 0; i -= 1) {
      const a = log[i];
      const b = log[i + 1];
      if (targetTime >= a.time && targetTime <= b.time) {
        const span = Math.max(0.0001, b.time - a.time);
        return interpolateActionFrame(a, b, (targetTime - a.time) / span);
      }
    }

    return null;
  }

  function applyNodeSnapshot(node, snapshot) {
    node.x = snapshot.x;
    node.y = snapshot.y;
    node.vx = snapshot.vx;
    node.vy = snapshot.vy;
  }

  function updateSpringNode(node, targetX, targetY, spring, damping, maxSpeed, dt) {
    node.vx += ((targetX - node.x) * spring - node.vx * damping) * dt;
    node.vy += ((targetY - node.y) * spring - node.vy * damping) * dt;

    const velocity = limitVector(node.vx, node.vy, maxSpeed);
    node.vx = velocity.x;
    node.vy = velocity.y;
    node.x += node.vx * dt;
    node.y += node.vy * dt;
  }

  function limitNodeFromAnchor(node, anchor, maxDistance) {
    const fromAnchor = normalize(node.x - anchor.x, node.y - anchor.y);
    if (fromAnchor.length <= maxDistance) return;

    node.x = anchor.x + fromAnchor.x * maxDistance;
    node.y = anchor.y + fromAnchor.y * maxDistance;

    const radialVelocity = node.vx * fromAnchor.x + node.vy * fromAnchor.y;
    if (radialVelocity > 0) {
      node.vx -= fromAnchor.x * radialVelocity * 0.76;
      node.vy -= fromAnchor.y * radialVelocity * 0.76;
    }
  }

  function rotateNodeAroundAnchor(node, anchor, angle, velocityFactor = 1) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = node.x - anchor.x;
    const dy = node.y - anchor.y;
    const vx = node.vx;
    const vy = node.vy;

    node.x = anchor.x + dx * cos - dy * sin;
    node.y = anchor.y + dx * sin + dy * cos;
    node.vx = (vx * cos - vy * sin) * velocityFactor;
    node.vy = (vx * sin + vy * cos) * velocityFactor;
  }

  function angleDelta(from, to) {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from));
  }

  function angleLerp(a, b, t) {
    const delta = angleDelta(a, b);
    return a + delta * t;
  }

  function hexToRgb(hex) {
    const value = Number.parseInt(hex.slice(1), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getBodyCenter(fighter) {
    return fighter.body || fighter;
  }

  function getViewWidth() {
    return state.width / VIEW_SCALE;
  }

  function getViewHeight() {
    return state.height / VIEW_SCALE;
  }

  function getAimBasis(fighter) {
    const forwardX = Math.cos(fighter.aimAngle);
    const forwardY = Math.sin(fighter.aimAngle);

    return {
      forwardX,
      forwardY,
      sideX: -forwardY,
      sideY: forwardX,
    };
  }

  function getRestFistTarget(fighter, sign) {
    const body = getBodyCenter(fighter);
    const basis = getAimBasis(fighter);

    return {
      x:
        body.x +
        basis.sideX * sign * fighter.armLength * 0.95 +
        basis.forwardX * (fighter.bodyRadius * 0.18 + fighter.armLength * 0.2),
      y:
        body.y +
        basis.sideY * sign * fighter.armLength * 0.95 +
        basis.forwardY * (fighter.bodyRadius * 0.18 + fighter.armLength * 0.2),
    };
  }

  function getShoulderTarget(fighter, sign) {
    const body = getBodyCenter(fighter);
    const basis = getAimBasis(fighter);

    return {
      x:
        body.x +
        basis.sideX * sign * fighter.bodyRadius * 0.68 +
        basis.forwardX * fighter.bodyRadius * 0.16,
      y:
        body.y +
        basis.sideY * sign * fighter.bodyRadius * 0.68 +
        basis.forwardY * fighter.bodyRadius * 0.16,
    };
  }

  function getElbowRestTarget(fighter, sign) {
    const body = getBodyCenter(fighter);
    const basis = getAimBasis(fighter);

    return {
      x:
        body.x +
        basis.sideX * sign * fighter.armLength * 0.52 +
        basis.forwardX * (fighter.bodyRadius * 0.42 + fighter.armLength * 0.08),
      y:
        body.y +
        basis.sideY * sign * fighter.armLength * 0.52 +
        basis.forwardY * (fighter.bodyRadius * 0.42 + fighter.armLength * 0.08),
    };
  }

  function getSelectedPlayerSpec() {
    return PLAYER_TYPES[state.selectedPlayerType] || PLAYER_TYPES.balanced;
  }

  function pickEnemyType() {
    const roll = Math.random();
    const wave = state.wave || 1;

    if (wave >= 9) {
      if (roll < 0.18) return "dasher";
      if (roll < 0.42) return "brute";
      if (roll < 0.64) return "guard";
      if (roll < 0.86) return "longarm";
      return "normal";
    }

    if (wave >= 6) {
      if (roll < 0.24) return "dasher";
      if (roll < 0.45) return "brute";
      if (roll < 0.66) return "guard";
      if (roll < 0.84) return "longarm";
      return "normal";
    }

    if (wave >= 4) {
      if (roll < 0.34) return "dasher";
      if (roll < 0.54) return "brute";
      if (roll < 0.72) return "guard";
      if (roll < 0.84) return "longarm";
      return "normal";
    }

    if (wave >= 2) {
      if (roll < 0.46) return "dasher";
      if (roll < 0.58) return "guard";
      return "normal";
    }

    return "normal";
  }

  function addEnemyWaveSkill(enemy, key) {
    const skill = ENEMY_WAVE_SKILLS[key];
    if (!skill || enemy.waveSkills.some((entry) => entry.key === key)) return;

    skill.apply(enemy);
    enemy.waveSkills.push({
      key,
      label: skill.label,
      color: skill.color,
    });
  }

  function applyEnemyWaveSkills(enemy) {
    const wave = state.wave || 1;
    if (wave < 3) return;

    const chance = enemy.isBoss
      ? clamp((wave - 4) * 0.1, 0, 0.7)
      : clamp(0.18 + wave * 0.065, 0.28, 0.88);
    if (Math.random() > chance) return;

    const candidates = Object.entries(ENEMY_WAVE_SKILLS)
      .filter(([, skill]) => wave >= skill.minWave)
      .map(([key]) => key);
    const skillCount = enemy.isBoss
      ? 1
      : wave >= 10 && Math.random() < 0.55
        ? 2
        : 1;

    for (let i = 0; i < skillCount && candidates.length > 0; i += 1) {
      const index = Math.floor(Math.random() * candidates.length);
      addEnemyWaveSkill(enemy, candidates.splice(index, 1)[0]);
    }
  }

  function applyEnemyWaveGrowth(enemy) {
    const wave = state.wave || 1;
    const waveBonus = Math.max(0, wave - 1);
    if (waveBonus <= 0) return;

    enemy.maxSpeed += Math.min(enemy.isBoss ? 42 : 78, waveBonus * (enemy.isBoss ? 2.6 : 4.6));
    enemy.accelRate += Math.min(enemy.isBoss ? 1.2 : 2.4, waveBonus * 0.14);
    enemy.maxHealth += waveBonus * (enemy.isBoss ? 0.34 : 0.14);
    enemy.health = enemy.maxHealth;
    enemy.damageScale += waveBonus * 0.026;
    enemy.bodyDamage += Math.floor(waveBonus / 6) * 0.25;
    applyEnemyWaveSkills(enemy);
  }

  function createFighter(options) {
    const isPlayer = Boolean(options.isPlayer);
    const enemyType = options.enemyType || "normal";
    const enemySpec = ENEMY_TYPES[enemyType] || ENEMY_TYPES.normal;
    const playerType = options.playerType || state.selectedPlayerType || "balanced";
    const playerSpec = PLAYER_TYPES[playerType] || PLAYER_TYPES.balanced;
    const spec = isPlayer ? playerSpec : enemySpec;
    const angle = rand(-Math.PI, Math.PI);
    const bodyRadius = isPlayer
      ? playerSpec.bodyRadius
      : rand(enemySpec.bodyRadius[0], enemySpec.bodyRadius[1]);
    const fistRadius = isPlayer
      ? playerSpec.fistRadius + state.upgrades.fistBonus
      : rand(enemySpec.fistRadius[0], enemySpec.fistRadius[1]);
    const armLength = isPlayer
      ? playerSpec.armLength + state.upgrades.armBonus
      : rand(enemySpec.armLength[0], enemySpec.armLength[1]);
    const maxSpeed = isPlayer
      ? playerSpec.speed + state.upgrades.speedBonus
      : rand(enemySpec.speed[0], enemySpec.speed[1]);
    const maxHealth = isPlayer
      ? playerSpec.maxHealth + state.upgrades.maxHealthBonus
      : enemySpec.health;

    const fighter = {
      id: nextId++,
      x: options.x,
      y: options.y,
      vx: 0,
      vy: 0,
      prevVx: 0,
      prevVy: 0,
      body: createNode(options.x, options.y),
      heading: angle,
      aimAngle: Math.PI / 2,
      aimTargetAngle: Math.PI / 2,
      aimPower: 0,
      aimAngularVelocity: 0,
      spinStress: 0,
      color: options.color || spec.color,
      accent: options.accent || spec.accent || "#f7f1dc",
      isPlayer,
      playerType: isPlayer ? playerType : null,
      enemyType: isPlayer ? "player" : enemyType,
      typeLabel: spec.label,
      skillLabel: spec.skill || spec.label,
      scoreValue: isPlayer ? 0 : enemySpec.scoreValue,
      alive: true,
      invulnTimer: 0,
      hitFlash: 0,
      isBoss: !isPlayer && Boolean(enemySpec.boss),
      maxHealth,
      health: maxHealth,
      bodyRadius,
      fistRadius,
      armLength,
      maxSpeed,
      accelRate: isPlayer
        ? playerSpec.accel + state.upgrades.speedBonus * 0.012
        : rand(enemySpec.accel[0], enemySpec.accel[1]),
      brakeRate: isPlayer ? playerSpec.brake : enemySpec.brake,
      cooldownScale: spec.cooldownScale || 1,
      damageScale:
        (spec.damageScale || 1) + (isPlayer ? state.upgrades.damageBonus : 0),
      parryPower:
        (spec.parryPower || 1) + (isPlayer ? state.upgrades.parryBonus : 0),
      hazardResist: spec.hazardResist || 1,
      bodyDamage: spec.bodyDamage || 1,
      hitScale: spec.hitScale || 1,
      returnMultiplier: spec.returnMultiplier || 1,
      spinRecovery: spec.spinRecovery || 1,
      spinPenalty: spec.spinPenalty,
      sweepPadding: spec.sweepPadding || FIST_SWEEP_PADDING,
      orbitCarry: spec.orbitCarry || 1,
      waveSkills: [],
      idealRangeBonus: 0,
      lungePowerBonus: 0,
      lungeWindowBonus: 0,
      sideWeightBonus: 0,
      swingPhase: rand(0, TWO_PI),
      swingPower: 0,
      pulse: 0,
      arms: [],
      fists: [],
      ai: isPlayer
        ? null
        : {
            wanderAngle: angle,
            modeTimer: rand(0.5, 2.2),
            side: Math.random() > 0.5 ? 1 : -1,
            lungeTimer: rand(1.2, 3.8),
            attackTimer: 0,
            attackDuration: 0,
            attackCooldown: rand(0.45, 1.25),
            attackSide: Math.random() > 0.5 ? 1 : -1,
            caution: rand(0.75, 1.15),
          },
    };

    for (let i = 0; i < 2; i += 1) {
      const sign = i === 0 ? -1 : 1;
      const shoulderTarget = getShoulderTarget(fighter, sign);
      const elbowTarget = getElbowRestTarget(fighter, sign);
      const restTarget = getRestFistTarget(fighter, sign);
      const fist = createNode(restTarget.x, restTarget.y);
      fist.hitCooldown = 0;
      const arm = {
        sign,
        alive: true,
        health: enemySpec.limbHealth || 1,
        maxHealth: enemySpec.limbHealth || 1,
        shoulder: createNode(shoulderTarget.x, shoulderTarget.y),
        elbow: createNode(elbowTarget.x, elbowTarget.y),
        fist,
      };
      fist.arm = arm;

      fighter.arms.push(arm);
      fighter.fists.push(arm.fist);
    }

    return fighter;
  }

  function createDecals() {
    state.decals = [];
    for (let i = 0; i < 140; i += 1) {
      state.decals.push({
        x: rand(90, ARENA.width - 90),
        y: rand(90, ARENA.height - 90),
        r: rand(2, 8),
        alpha: rand(0.05, 0.16),
        color: Math.random() > 0.55 ? "#f4c84f" : "#4dd7c1",
      });
    }
  }

  function createHazards() {
    const kinds = ["bumper", "vortex", "mud", "spike", "spring"];
    state.hazards = [];

    for (let i = 0; i < kinds.length; i += 1) {
      const kind = kinds[i];
      const spec = HAZARD_TYPES[kind];
      const angle = (i / kinds.length) * TWO_PI + rand(-0.32, 0.32);
      const distance = rand(360, 780);
      state.hazards.push({
        id: nextId++,
        kind,
        x: clamp(ARENA.width / 2 + Math.cos(angle) * distance, 180, ARENA.width - 180),
        y: clamp(ARENA.height / 2 + Math.sin(angle) * distance, 180, ARENA.height - 180),
        radius: spec.radius,
        color: spec.color,
        pulse: rand(0, TWO_PI),
        cooldown: 0,
      });
    }
  }

  function resetGame() {
    nextId = 1;
    state.time = 0;
    state.score = 0;
    state.level = 1;
    state.xp = 0;
    state.xpToNext = getXpRequirement(state.level);
    state.wave = 1;
    state.spawnTimer = 2.25;
    state.pickupTimer = 0.8;
    state.gameOver = false;
    state.gameOverTimer = 0;
    state.shake = 0;
    state.hitStop = 0;
    state.nextUpgradeAt = UPGRADE_INTERVAL;
    state.pendingUpgradeCount = 0;
    state.pendingUpgrade = false;
    state.pendingCharacterSelect = false;
    state.upgrades.armBonus = 0;
    state.upgrades.speedBonus = 0;
    state.upgrades.fistBonus = 0;
    state.upgrades.cooldownScale = 1;
    state.upgrades.returnBonus = 1;
    state.upgrades.turnRateBonus = 0;
    state.upgrades.pickupRadius = 0;
    state.upgrades.xpGainScale = 1;
    state.upgrades.echoCount = 0;
    state.upgrades.echoPower = 1;
    state.upgrades.damageBonus = 0;
    state.upgrades.maxHealthBonus = 0;
    state.upgrades.parryBonus = 0;
    state.upgrades.bossBreaker = 0;
    state.upgrades.healOnParry = 0;
    state.upgrades.evolutionTier = 0;
    state.upgrades.evolutionName = "";
    state.aim.x = 0;
    state.aim.y = 1;
    state.aim.power = 0;
    state.aim.active = false;
    state.aim.angle = Math.PI / 2;
    state.particles = [];
    state.enemies = [];
    state.echoes = [];
    state.actionLog = [];
    state.pickups = [];
    state.hazards = [];
    state.nextBossWave = 4;
    const playerSpec = getSelectedPlayerSpec();
    state.player = createFighter({
      x: ARENA.width / 2,
      y: ARENA.height / 2,
      color: playerSpec.color,
      accent: playerSpec.accent,
      playerType: state.selectedPlayerType,
      isPlayer: true,
    });
    state.player.invulnTimer = 2.4;
    state.camera.x = state.player.x - getViewWidth() / 2;
    state.camera.y = state.player.y - getViewHeight() / 2;
    createDecals();
    createHazards();
    for (let i = 0; i < 10; i += 1) {
      spawnPickup(i % 4 === 0 ? "largeXp" : "xp");
    }
    for (let i = 0; i < 4; i += 1) {
      spawnEnemy(true);
    }
    updateHud();
    updateCharacterButton();
    upgradeEl.classList.add("hidden");
    characterSelectEl.classList.add("hidden");
    statusEl.classList.add("hidden");
  }

  function updateHud() {
    scoreEl.textContent = String(state.score);
    waveEl.textContent = String(state.wave);
    levelEl.textContent = String(state.level);
    xpTextEl.textContent = `经验 ${Math.floor(state.xp)}/${state.xpToNext}`;
    healthEl.textContent = state.player
      ? `${Math.ceil(state.player.health)}/${Math.ceil(state.player.maxHealth)}`
      : "0";
  }

  function getXpRequirement(level) {
    return Math.floor(10 + level * 4.5 + level * level * 0.55);
  }

  function healFighter(fighter, amount) {
    if (!fighter || !fighter.alive || amount <= 0) return;
    fighter.health = Math.min(fighter.maxHealth, fighter.health + amount);
    updateHud();
  }

  function evolveStats(change) {
    const player = state.player;
    if (!player) return;

    if (change.maxHealth) {
      state.upgrades.maxHealthBonus += change.maxHealth;
      player.maxHealth += change.maxHealth;
      player.health = Math.min(player.maxHealth, player.health + change.maxHealth);
    }
    if (change.damageScale) {
      state.upgrades.damageBonus += change.damageScale;
      player.damageScale += change.damageScale;
    }
    if (change.speed) {
      state.upgrades.speedBonus += change.speed;
      player.maxSpeed += change.speed;
    }
    if (change.armLength) {
      state.upgrades.armBonus += change.armLength;
      player.armLength += change.armLength;
    }
    if (change.fistRadius) {
      state.upgrades.fistBonus += change.fistRadius;
      player.fistRadius += change.fistRadius;
    }
    if (change.cooldownScale) {
      player.cooldownScale *= change.cooldownScale;
    }
    if (change.turnRate) {
      state.upgrades.turnRateBonus += change.turnRate;
    }
    if (change.returnBonus) {
      state.upgrades.returnBonus = Math.min(2.25, state.upgrades.returnBonus + change.returnBonus);
    }
    if (change.parryPower) {
      state.upgrades.parryBonus += change.parryPower;
      player.parryPower += change.parryPower;
    }
    if (change.bossBreaker) {
      state.upgrades.bossBreaker += change.bossBreaker;
    }
    if (change.healOnParry) {
      state.upgrades.healOnParry += change.healOnParry;
    }
    if (change.echo) {
      state.upgrades.echoCount = Math.min(3, state.upgrades.echoCount + change.echo);
      syncEchoes();
    }
  }

  function applyEvolutionIfNeeded() {
    const evolutions = EVOLUTIONS[state.selectedPlayerType] || [];
    let evolved = false;

    for (const evolution of evolutions) {
      if (state.level >= evolution.level && state.upgrades.evolutionTier < evolution.level) {
        evolution.apply();
        state.upgrades.evolutionTier = evolution.level;
        state.upgrades.evolutionName = evolution.label;
        state.shake = Math.max(state.shake, 8);
        addBurst(state.player.x, state.player.y, state.player.color, 30, 1.05);
        evolved = true;
      }
    }

    if (evolved) {
      updateCharacterButton();
      updateHud();
    }
  }

  function queueUpgrade(count = 1) {
    state.pendingUpgradeCount += count;
    if (!state.pendingUpgrade && !state.gameOver) {
      offerUpgrade();
    }
  }

  function addExperience(amount) {
    if (amount <= 0 || state.gameOver) return;

    state.xp += amount * state.upgrades.xpGainScale;
    let levelUps = 0;
    while (state.xp >= state.xpToNext) {
      state.xp -= state.xpToNext;
      state.level += 1;
      state.xpToNext = getXpRequirement(state.level);
      levelUps += 1;
    }

    if (levelUps > 0) {
      applyEvolutionIfNeeded();
      queueUpgrade(levelUps);
      state.shake = Math.max(state.shake, 5);
      addBurst(state.player.x, state.player.y, state.player.color, 18, 0.75);
    }

    updateHud();
  }

  function updateCharacterButton() {
    const spec = getSelectedPlayerSpec();
    typeNameEl.textContent = state.upgrades.evolutionName
      ? `${spec.label}·${state.upgrades.evolutionName}`
      : spec.label;
    typeButton.style.setProperty("--type-color", spec.color);
  }

  function closeCharacterSelect() {
    state.pendingCharacterSelect = false;
    characterSelectEl.classList.add("hidden");
  }

  function renderCharacterOptions() {
    characterOptionsEl.innerHTML = "";

    for (const [id, spec] of Object.entries(PLAYER_TYPES)) {
      const button = document.createElement("button");
      button.className = `character-card${id === state.selectedPlayerType ? " active" : ""}`;
      button.type = "button";
      button.style.setProperty("--card-color", spec.color);
      button.innerHTML = `<strong>${spec.label}</strong><span>${spec.desc}</span><small>${spec.skill}</small>`;
      button.addEventListener("click", () => {
        const changed = state.selectedPlayerType !== id;
        state.selectedPlayerType = id;
        updateCharacterButton();
        closeCharacterSelect();
        if (changed) {
          resetGame();
        }
      });
      characterOptionsEl.appendChild(button);
    }
  }

  function openCharacterSelect() {
    if (state.pendingUpgrade) return;
    state.pendingCharacterSelect = true;
    renderCharacterOptions();
    characterSelectEl.classList.remove("hidden");
  }

  function pickUpgradeOptions() {
    const rolePool = CHARACTER_UPGRADES[state.selectedPlayerType] || [];
    const pool = [...COMMON_UPGRADES, ...rolePool];
    const picks = [];

    while (picks.length < 3 && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(index, 1)[0]);
    }

    return picks;
  }

  function applyClassRelicFromEchoPickup() {
    const player = state.player;
    const type = state.selectedPlayerType;

    if (type === "balanced") {
      state.upgrades.maxHealthBonus += 0.45;
      player.maxHealth += 0.45;
      player.damageScale += 0.08;
      state.upgrades.damageBonus += 0.08;
      healFighter(player, 0.8);
      return;
    }

    if (type === "brawler") {
      player.damageScale += 0.22;
      player.fistRadius += 1.2;
      state.upgrades.damageBonus += 0.22;
      state.upgrades.fistBonus += 1.2;
      state.upgrades.bossBreaker += 0.18;
      return;
    }

    if (type === "spring") {
      player.returnMultiplier *= 1.1;
      player.parryPower += 0.24;
      state.upgrades.parryBonus += 0.24;
      state.upgrades.healOnParry += 0.08;
      return;
    }

    state.upgrades.turnRateBonus += 0.5;
  }

  function offerUpgrade() {
    if (state.pendingUpgrade || state.gameOver || state.pendingUpgradeCount <= 0) return;

    state.pendingUpgrade = true;
    upgradeOptionsEl.innerHTML = "";

    for (const upgrade of pickUpgradeOptions()) {
      const button = document.createElement("button");
      button.className = "upgrade-card";
      button.type = "button";
      button.innerHTML = `<strong>${upgrade.title}</strong><span>${upgrade.desc}</span>`;
      button.addEventListener("click", () => {
        upgrade.apply();
        state.pendingUpgradeCount = Math.max(0, state.pendingUpgradeCount - 1);
        state.pendingUpgrade = false;
        upgradeEl.classList.add("hidden");
        updateHud();
        if (state.pendingUpgradeCount > 0) {
          window.setTimeout(offerUpgrade, 80);
        }
      });
      upgradeOptionsEl.appendChild(button);
    }

    upgradeEl.classList.remove("hidden");
  }

  function spawnEnemy(initial = false) {
    const player = state.player;
    const angle = rand(-Math.PI, Math.PI);
    const distance = initial ? rand(640, 940) : rand(660, 900);
    const x = clamp(player.x + Math.cos(angle) * distance, 120, ARENA.width - 120);
    const y = clamp(player.y + Math.sin(angle) * distance, 120, ARENA.height - 120);
    const enemyType = initial && Math.random() < 0.75 ? "normal" : pickEnemyType();
    const color = ENEMY_TYPES[enemyType].color || ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
    const enemy = createFighter({
      x,
      y,
      color,
      accent: "#fff4d4",
      isPlayer: false,
      enemyType,
    });

    applyEnemyWaveGrowth(enemy);
    state.enemies.push(enemy);
  }

  function spawnBoss() {
    const player = state.player;
    const angle = rand(-Math.PI, Math.PI);
    const distance = rand(720, 900);
    const x = clamp(player.x + Math.cos(angle) * distance, 180, ARENA.width - 180);
    const y = clamp(player.y + Math.sin(angle) * distance, 180, ARENA.height - 180);
    const boss = createFighter({
      x,
      y,
      color: ENEMY_TYPES.boss.color,
      accent: "#fff4d4",
      isPlayer: false,
      enemyType: "boss",
    });

    boss.maxHealth += state.wave * 0.8;
    boss.health = boss.maxHealth;
    for (const arm of boss.arms) {
      arm.maxHealth += state.wave * 0.22;
      arm.health = arm.maxHealth;
    }
    applyEnemyWaveGrowth(boss);
    state.enemies.push(boss);
    addBurst(x, y, boss.color, 36, 1.1);
    state.shake = Math.max(state.shake, 9);
  }

  function pickRandomPickupKind() {
    const roll = Math.random();
    if (roll < 0.58) return "xp";
    if (roll < 0.72) return "largeXp";
    if (roll < 0.82) return "turn";
    if (roll < 0.9) return "reach";
    if (roll < 0.97) return "speed";
    return "echo";
  }

  function spawnPickup(kind = pickRandomPickupKind(), x = null, y = null, amount = null) {
    if (state.pickups.length >= PICKUP_LIMIT) return;

    const player = state.player;
    const spec = PICKUP_TYPES[kind] || PICKUP_TYPES.xp;
    const nearPlayer = player && Math.random() > 0.34;
    const spawnX =
      x ??
      (nearPlayer
        ? clamp(player.x + rand(-560, 560), 120, ARENA.width - 120)
        : rand(120, ARENA.width - 120));
    const spawnY =
      y ??
      (nearPlayer
        ? clamp(player.y + rand(-420, 420), 120, ARENA.height - 120)
        : rand(120, ARENA.height - 120));

    state.pickups.push({
      id: nextId++,
      kind,
      x: spawnX,
      y: spawnY,
      vx: rand(-18, 18),
      vy: rand(-18, 18),
      radius: spec.radius,
      color: spec.color,
      glow: spec.glow,
      amount: amount ?? (kind === "largeXp" ? rand(5, 8) : rand(2.2, 3.8)),
      pulse: rand(0, TWO_PI),
      collected: false,
    });
  }

  function dropLoot(x, y, value = 1) {
    const xpDrops = Math.min(3, Math.max(1, value));
    for (let i = 0; i < xpDrops; i += 1) {
      spawnPickup(
        i === 0 && value > 1 ? "largeXp" : "xp",
        x + rand(-26, 26),
        y + rand(-26, 26),
        2.4 + value * 1.5,
      );
    }

    const itemChance = 0.16 + value * 0.05;
    if (Math.random() < itemChance) {
      const kind = Math.random() < 0.08 ? "echo" : ["turn", "reach", "speed", "largeXp"][Math.floor(rand(0, 4))];
      spawnPickup(kind, x + rand(-34, 34), y + rand(-34, 34));
    }
  }

  function collectPickup(pickup) {
    if (pickup.collected) return;
    pickup.collected = true;

    const player = state.player;
    addBurst(pickup.x, pickup.y, pickup.color, pickup.kind === "xp" ? 8 : 14, 0.55);

    if (pickup.kind === "xp" || pickup.kind === "largeXp") {
      addExperience(pickup.amount);
      return;
    }

    if (pickup.kind === "turn") {
      state.upgrades.turnRateBonus += 0.38;
      addExperience(1.2);
    } else if (pickup.kind === "reach") {
      state.upgrades.armBonus += 2.4;
      player.armLength += 2.4;
      addExperience(1.2);
    } else if (pickup.kind === "speed") {
      state.upgrades.speedBonus += 7;
      player.maxSpeed += 7;
      player.accelRate += 0.16;
      addExperience(1.2);
    } else if (pickup.kind === "echo") {
      if (state.selectedPlayerType === "swift") {
        if (state.upgrades.echoCount < 2) {
          state.upgrades.echoCount += 1;
        } else {
          state.upgrades.echoPower = Math.min(1.32, state.upgrades.echoPower + 0.1);
        }
        syncEchoes();
      } else {
        applyClassRelicFromEchoPickup();
      }
      addExperience(2);
    }

    updateHud();
  }

  function updatePickupSpawns(dt) {
    state.pickupTimer -= dt;
    if (state.pickupTimer <= 0) {
      spawnPickup();
      state.pickupTimer = rand(1.15, 2.15);
    }
  }

  function updatePickups(dt) {
    const player = state.player;
    if (!player || !player.alive) return;

    const body = getBodyCenter(player);
    const magnetRadius = PICKUP_MAGNET_RADIUS + state.upgrades.pickupRadius;
    for (const pickup of state.pickups) {
      pickup.pulse += dt * 5.4;
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
      pickup.vx *= 1 - Math.min(0.5, dt * 2.2);
      pickup.vy *= 1 - Math.min(0.5, dt * 2.2);

      const toPlayer = normalize(body.x - pickup.x, body.y - pickup.y);
      if (toPlayer.length < magnetRadius) {
        const pull = (1 - toPlayer.length / magnetRadius) * (360 + state.upgrades.pickupRadius * 1.8);
        pickup.vx += toPlayer.x * pull * dt;
        pickup.vy += toPlayer.y * pull * dt;
      }

      if (toPlayer.length < player.bodyRadius + pickup.radius + 12 + state.upgrades.pickupRadius * 0.18) {
        collectPickup(pickup);
      }
    }

    state.pickups = state.pickups.filter((pickup) => !pickup.collected);
  }

  function applyHazardToFighter(hazard, fighter, dt) {
    if (!fighter.alive || fighter.isEcho) return;

    const body = getBodyCenter(fighter);
    const toBody = normalize(body.x - hazard.x, body.y - hazard.y);
    if (toBody.length > hazard.radius + fighter.bodyRadius) return;

    const depth = clamp(1 - toBody.length / (hazard.radius + fighter.bodyRadius), 0, 1);

    if (hazard.kind === "bumper") {
      const force = (420 + depth * 520) * dt;
      fighter.vx += toBody.x * force * 16;
      fighter.vy += toBody.y * force * 16;
      hazard.cooldown = 0.18;
    } else if (hazard.kind === "vortex") {
      const tangentX = -toBody.y;
      const tangentY = toBody.x;
      fighter.vx += (tangentX * 280 - toBody.x * 90) * depth * dt;
      fighter.vy += (tangentY * 280 - toBody.y * 90) * depth * dt;
    } else if (hazard.kind === "mud") {
      fighter.vx *= 1 - Math.min(0.58, dt * (1.8 + depth * 2.8));
      fighter.vy *= 1 - Math.min(0.58, dt * (1.8 + depth * 2.8));
    } else if (hazard.kind === "spike") {
      hazard.cooldown -= dt;
      if (hazard.cooldown <= 0) {
        damageFighter(fighter, fighter.isPlayer ? 1 : 0.55, null, "hazard");
        hazard.cooldown = fighter.isPlayer ? 0.82 : 0.5;
      }
    } else if (hazard.kind === "spring") {
      const basis = getAimBasis(fighter);
      fighter.vx += basis.forwardX * (360 + depth * 380) * dt * 5;
      fighter.vy += basis.forwardY * (360 + depth * 380) * dt * 5;
      hazard.cooldown = 0.22;
    }
  }

  function updateHazards(dt) {
    for (const hazard of state.hazards) {
      hazard.pulse += dt * 3.6;
      hazard.cooldown = Math.max(0, hazard.cooldown - dt);
      applyHazardToFighter(hazard, state.player, dt);
      for (const enemy of state.enemies) {
        applyHazardToFighter(hazard, enemy, dt);
      }
    }
  }

  function readKeyboardInput() {
    let x = 0;
    let y = 0;

    if (state.keys.has("ArrowLeft") || state.keys.has("KeyA")) x -= 1;
    if (state.keys.has("ArrowRight") || state.keys.has("KeyD")) x += 1;
    if (state.keys.has("ArrowUp") || state.keys.has("KeyW")) y -= 1;
    if (state.keys.has("ArrowDown") || state.keys.has("KeyS")) y += 1;

    const dir = normalize(x, y);
    return { x: dir.x, y: dir.y, power: dir.length > 0 ? 1 : 0 };
  }

  function moveFighter(fighter, inputX, inputY, inputPower, dt) {
    const power = clamp(inputPower, 0, 1);
    const targetVx = inputX * fighter.maxSpeed * power;
    const targetVy = inputY * fighter.maxSpeed * power;
    const rate = power > 0.02 ? fighter.accelRate : fighter.brakeRate;

    fighter.vx = approach(fighter.vx, targetVx, rate, dt);
    fighter.vy = approach(fighter.vy, targetVy, rate, dt);
    fighter.x += fighter.vx * dt;
    fighter.y += fighter.vy * dt;

    const minX = ARENA.pad + fighter.bodyRadius;
    const maxX = ARENA.width - ARENA.pad - fighter.bodyRadius;
    const minY = ARENA.pad + fighter.bodyRadius;
    const maxY = ARENA.height - ARENA.pad - fighter.bodyRadius;

    if (fighter.x < minX || fighter.x > maxX) {
      fighter.x = clamp(fighter.x, minX, maxX);
      fighter.vx *= -0.22;
    }

    if (fighter.y < minY || fighter.y > maxY) {
      fighter.y = clamp(fighter.y, minY, maxY);
      fighter.vy *= -0.22;
    }
  }

  function translateFighter(fighter, dx, dy) {
    fighter.x += dx;
    fighter.y += dy;
    fighter.body.x += dx;
    fighter.body.y += dy;
    fighter.body.prevX += dx;
    fighter.body.prevY += dy;

    for (const arm of fighter.arms) {
      for (const node of [arm.shoulder, arm.elbow, arm.fist]) {
        node.x += dx;
        node.y += dy;
        node.prevX += dx;
        node.prevY += dy;
      }
    }
  }

  function updatePose(fighter, dt) {
    rememberFighterPose(fighter);
    fighter.invulnTimer = Math.max(0, (fighter.invulnTimer || 0) - dt);
    fighter.hitFlash = Math.max(0, (fighter.hitFlash || 0) - dt);

    const speed = Math.hypot(fighter.vx, fighter.vy);
    const accelX = dt > 0 ? (fighter.vx - fighter.prevVx) / dt : 0;
    const accelY = dt > 0 ? (fighter.vy - fighter.prevVy) / dt : 0;

    if (speed > 5) {
      fighter.heading = angleLerp(
        fighter.heading,
        Math.atan2(fighter.vy, fighter.vx),
        1 - Math.exp(-12 * dt),
      );
    }

    const previousAimAngle = fighter.aimAngle;
    const aimControl = clamp(fighter.aimPower, 0, 1);
    const turnRate = aimControl > 0.12 ? 34 : 12;
    const desiredTurnStep =
      angleDelta(fighter.aimAngle, fighter.aimTargetAngle) *
      (1 - Math.exp(-turnRate * dt));
    const turnRateBonus = fighter.isPlayer ? state.upgrades.turnRateBonus : 0;
    const maxTurnRate =
      (aimControl > 0.12 ? MAX_AIM_TURN_RATE : AUTO_AIM_TURN_RATE) + turnRateBonus;
    const turnStep = clamp(desiredTurnStep, -maxTurnRate * dt, maxTurnRate * dt);
    fighter.aimAngle += turnStep;
    const aimTurnDelta = angleDelta(previousAimAngle, fighter.aimAngle);
    fighter.aimAngularVelocity = Math.abs(aimTurnDelta) / Math.max(dt, 0.0001);
    const stressStart = SPIN_STRESS_START + turnRateBonus * 0.28;
    const stressFull = SPIN_STRESS_FULL + turnRateBonus * 0.42;
    const spinStressTarget = clamp(
      (fighter.aimAngularVelocity - stressStart) / (stressFull - stressStart),
      0,
      1,
    );
    fighter.spinStress = approach(
      fighter.spinStress,
      spinStressTarget,
      spinStressTarget > fighter.spinStress ? 12 : 5 * (fighter.spinRecovery || 1),
      dt,
    );

    const isSettling = speed < 34;
    const targetSwing = isSettling ? 0 : clamp(speed / fighter.maxSpeed, 0, 0.72);
    fighter.swingPower = approach(fighter.swingPower, targetSwing, isSettling ? 28 : 14, dt);
    fighter.pulse += dt * (4.8 + fighter.swingPower * 3.5);
    const returnBoost =
      (fighter.isPlayer ? state.upgrades.returnBonus : 1) * (fighter.returnMultiplier || 1);

    const bodyDrag = isSettling
      ? { x: 0, y: 0 }
      : limitVector(accelX * 0.0035, accelY * 0.0035, 18 + fighter.swingPower * 7);
    updateSpringNode(
      fighter.body,
      fighter.x - bodyDrag.x,
      fighter.y - bodyDrag.y,
      isSettling ? 260 * returnBoost : 155,
      isSettling ? 26 : 14.5,
      isSettling ? 1650 : 1350,
      dt,
    );

    if (
      isSettling &&
      distSq(fighter.body.x, fighter.body.y, fighter.x, fighter.y) < 1.8 * 1.8 &&
      Math.hypot(fighter.body.vx, fighter.body.vy) < 18
    ) {
      fighter.body.x = fighter.x;
      fighter.body.y = fighter.y;
      fighter.body.vx = 0;
      fighter.body.vy = 0;
    }

    const moveDir = normalize(fighter.vx, fighter.vy);
    const moveSideX = -moveDir.y;
    const moveSideY = moveDir.x;
    const dragScale = 1 - aimControl * 0.68;
    const lag = isSettling ? 0 : (0.055 + fighter.swingPower * 0.018) * dragScale;
    const accelDrag = isSettling
      ? { x: 0, y: 0 }
      : limitVector(
          accelX * 0.003 * dragScale,
          accelY * 0.003 * dragScale,
          (24 + fighter.swingPower * 8) * dragScale,
        );

    if (Math.abs(aimTurnDelta) > 0.0001) {
      const orbitCarry = clamp((aimControl > 0.12 ? 0.92 : 0.45) * (fighter.orbitCarry || 1), 0, 1.14);
      for (const arm of fighter.arms) {
        rotateNodeAroundAnchor(arm.shoulder, fighter.body, aimTurnDelta * orbitCarry, 0.95);
        rotateNodeAroundAnchor(arm.elbow, fighter.body, aimTurnDelta * orbitCarry * 0.9, 0.96);
        rotateNodeAroundAnchor(arm.fist, fighter.body, aimTurnDelta * orbitCarry * 0.82, 0.97);
      }
    }

    for (const arm of fighter.arms) {
      const sign = arm.sign;
      arm.fist.hitCooldown = Math.max(0, (arm.fist.hitCooldown || 0) - dt);
      arm.fist.parryCooldown = Math.max(0, (arm.fist.parryCooldown || 0) - dt);
      const shoulderTarget = getShoulderTarget(fighter, sign);
      const elbowRest = getElbowRestTarget(fighter, sign);
      const restTarget = getRestFistTarget(fighter, sign);
      const curl = fighter.swingPower * fighter.bodyRadius * 0.3;

      updateSpringNode(
        arm.shoulder,
        shoulderTarget.x,
        shoulderTarget.y,
        isSettling ? 520 * returnBoost : 430,
        isSettling ? 34 : 24,
        2300,
        dt,
      );

      const shoulderDriftX = arm.shoulder.x - shoulderTarget.x;
      const shoulderDriftY = arm.shoulder.y - shoulderTarget.y;
      const elbowTargetX = isSettling
        ? elbowRest.x
        : elbowRest.x +
          moveSideX * sign * curl * 0.58 -
          fighter.vx * lag * 0.52 -
          accelDrag.x * 0.68 +
          shoulderDriftX * 0.72;
      const elbowTargetY = isSettling
        ? elbowRest.y
        : elbowRest.y +
          moveSideY * sign * curl * 0.58 -
          fighter.vy * lag * 0.52 -
          accelDrag.y * 0.68 +
          shoulderDriftY * 0.72;

      updateSpringNode(
        arm.elbow,
        elbowTargetX,
        elbowTargetY,
        isSettling ? 410 * returnBoost : 205,
        isSettling ? 30 : 14.5,
        isSettling ? 2100 : 1900,
        dt,
      );

      const elbowDriftX = arm.elbow.x - elbowRest.x;
      const elbowDriftY = arm.elbow.y - elbowRest.y;
      const fistTargetX = isSettling
        ? restTarget.x
        : restTarget.x +
          moveSideX * sign * curl -
          fighter.vx * lag -
          accelDrag.x +
          elbowDriftX * 0.86;
      const fistTargetY = isSettling
        ? restTarget.y
        : restTarget.y +
          moveSideY * sign * curl -
          fighter.vy * lag -
          accelDrag.y +
          elbowDriftY * 0.86;

      updateSpringNode(
        arm.fist,
        fistTargetX,
        fistTargetY,
        isSettling ? 360 * returnBoost : 235,
        isSettling ? 27 : 13.5,
        isSettling ? 2300 : 2350,
        dt,
      );

      limitNodeFromAnchor(arm.elbow, arm.shoulder, fighter.armLength * 0.58);
      limitNodeFromAnchor(arm.fist, arm.elbow, fighter.armLength * 0.66);

      if (isSettling) {
        const settled =
          distSq(arm.shoulder.x, arm.shoulder.y, shoulderTarget.x, shoulderTarget.y) < 2.4 * 2.4 &&
          distSq(arm.elbow.x, arm.elbow.y, elbowRest.x, elbowRest.y) < 2.7 * 2.7 &&
          distSq(arm.fist.x, arm.fist.y, restTarget.x, restTarget.y) < 3.2 * 3.2 &&
          Math.hypot(arm.fist.vx, arm.fist.vy) < 42;

        if (settled) {
          arm.shoulder.x = shoulderTarget.x;
          arm.shoulder.y = shoulderTarget.y;
          arm.shoulder.vx = 0;
          arm.shoulder.vy = 0;
          arm.elbow.x = elbowRest.x;
          arm.elbow.y = elbowRest.y;
          arm.elbow.vx = 0;
          arm.elbow.vy = 0;
          arm.fist.x = restTarget.x;
          arm.fist.y = restTarget.y;
          arm.fist.vx = 0;
          arm.fist.vy = 0;
        }
      }
    }

    fighter.prevVx = fighter.vx;
    fighter.prevVy = fighter.vy;
  }

  function startEnemyAttack(enemy, spec) {
    const ai = enemy.ai;
    const interval = spec.lungeInterval || [1.2, 2.6];
    const skillBoost = enemy.lungePowerBonus || 0;
    const earlyCooldownScale = state.wave <= 2 ? 1.55 : state.wave <= 4 ? 1.25 : 1;

    ai.attackDuration = clamp(0.5 + spec.lungeWindow * 0.34 + skillBoost * 0.12, 0.46, enemy.isBoss ? 0.9 : 0.72);
    ai.attackTimer = ai.attackDuration;
    ai.attackCooldown = rand(interval[0] * 0.48, interval[1] * 0.72) * earlyCooldownScale;
    ai.attackSide = Math.random() > 0.5 ? 1 : -1;
    ai.side = ai.attackSide;
  }

  function getEnemyAttackRange(enemy, player, spec) {
    return (
      enemy.armLength +
      enemy.fistRadius +
      player.bodyRadius +
      enemy.bodyRadius * 0.42 +
      (enemy.idealRangeBonus || 0) * 0.22 +
      spec.sweepPadding
    );
  }

  function updateEnemyAI(enemy, dt) {
    const player = state.player;
    const ai = enemy.ai;
    const type = enemy.enemyType || "normal";
    const spec = ENEMY_TYPES[type] || ENEMY_TYPES.normal;

    ai.modeTimer -= dt;
    ai.lungeTimer -= dt;
    ai.attackCooldown = Math.max(0, (ai.attackCooldown || 0) - dt);

    if (ai.modeTimer <= 0) {
      ai.modeTimer = rand(0.7, 2.2);
      ai.wanderAngle += rand(-1.2, 1.2);
      if (Math.random() > 0.7) ai.side *= -1;
    }

    const leadTime = enemy.isBoss ? 0.2 : 0.15;
    const targetX = player.x + player.vx * leadTime;
    const targetY = player.y + player.vy * leadTime;
    const toPlayer = normalize(targetX - enemy.x, targetY - enemy.y);
    const angleToPlayer = Math.atan2(toPlayer.y, toPlayer.x);
    const sideX = -toPlayer.y * ai.side;
    const sideY = toPlayer.x * ai.side;
    const attackRange = getEnemyAttackRange(enemy, player, spec);
    const earlyAttackScale = state.wave <= 2 ? 0.76 : state.wave <= 4 ? 0.9 : 1;
    const aggroRange = enemy.isBoss ? 1320 : state.wave <= 2 ? 820 : state.wave <= 4 ? 980 : 1180;
    let x = Math.cos(ai.wanderAngle) * 0.72;
    let y = Math.sin(ai.wanderAngle) * 0.72;
    let power = 0.68;

    if (player.alive && toPlayer.length > 0.001) {
      enemy.aimTargetAngle = angleToPlayer;
      enemy.aimPower = 1;
    } else {
      enemy.aimTargetAngle = enemy.heading;
      enemy.aimPower = 0.5;
    }

    if (player.alive && ai.attackTimer > 0) {
      const phase = clamp(1 - ai.attackTimer / Math.max(0.001, ai.attackDuration), 0, 1);
      const sweep = ai.attackSide * lerp(1.05, -0.95, phase);
      const bite = Math.sin(phase * Math.PI);
      const lungePower =
        (1.18 + (spec.lungePower || 0) * 0.66 + (enemy.lungePowerBonus || 0) * 0.55) *
        earlyAttackScale;

      enemy.aimTargetAngle = angleToPlayer + sweep;
      enemy.aimPower = 1;
      x = toPlayer.x * lungePower + sideX * bite * 0.36;
      y = toPlayer.y * lungePower + sideY * bite * 0.36;
      power = 1;
      enemy.vx += toPlayer.x * (70 + lungePower * 24) * dt;
      enemy.vy += toPlayer.y * (70 + lungePower * 24) * dt;
      ai.attackTimer -= dt;
    } else if (player.alive && toPlayer.length < aggroRange) {
      const ideal = spec.idealRange + (enemy.idealRangeBonus || 0) + enemy.bodyRadius + player.bodyRadius;
      const closeBias =
        toPlayer.length < enemy.bodyRadius + player.bodyRadius + 20
          ? spec.retreatBias * 0.35
          : toPlayer.length < attackRange * 0.72
            ? 0.18
            : Math.max(spec.chaseBias, 0.9);
      const lungeWindow = spec.lungeWindow + (enemy.lungeWindowBonus || 0);
      const lungePower = spec.lungePower + (enemy.lungePowerBonus || 0);
      const lunge =
        ai.lungeTimer < lungeWindow && toPlayer.length > enemy.bodyRadius + player.bodyRadius + 46
          ? lungePower
          : 0;
      const sideWeight = spec.sideWeight + (enemy.sideWeightBonus || 0);
      const inAttackRange = toPlayer.length < attackRange + 94;
      const wantsAttack = inAttackRange || (ai.lungeTimer < lungeWindow && toPlayer.length < ideal + 140);

      if (wantsAttack && ai.attackCooldown <= 0) {
        startEnemyAttack(enemy, spec);
      }

      enemy.aimTargetAngle = angleToPlayer + ai.side * clamp((attackRange - toPlayer.length) / attackRange, -0.18, 0.42);
      x = toPlayer.x * (closeBias + lunge + (wantsAttack ? 0.28 : 0)) + sideX * (sideWeight * 0.62 + ai.caution * 0.14);
      y = toPlayer.y * (closeBias + lunge + (wantsAttack ? 0.28 : 0)) + sideY * (sideWeight * 0.62 + ai.caution * 0.14);
      power = toPlayer.length < 88 ? Math.max(spec.closePower, 0.62) : 1;

      if (ai.lungeTimer <= -rand(0.1, 0.3)) {
        ai.lungeTimer = rand(spec.lungeInterval[0], spec.lungeInterval[1]);
      }
    } else if (player.alive) {
      x = toPlayer.x * 0.96 + Math.cos(ai.wanderAngle) * 0.18;
      y = toPlayer.y * 0.96 + Math.sin(ai.wanderAngle) * 0.18;
      power = 0.88;
    }

    const fromCenter = normalize(enemy.x - ARENA.width / 2, enemy.y - ARENA.height / 2);
    if (enemy.x < 150 || enemy.x > ARENA.width - 150 || enemy.y < 150 || enemy.y > ARENA.height - 150) {
      x -= fromCenter.x * 0.95;
      y -= fromCenter.y * 0.95;
    }

    const dir = normalize(x, y);
    moveFighter(enemy, dir.x, dir.y, power, dt);
  }

  function createEcho(index) {
    const player = state.player;
    const echo = createFighter({
      x: player.x,
      y: player.y,
      color: player.color,
      accent: player.accent,
      playerType: state.selectedPlayerType,
      isPlayer: true,
    });

    echo.isEcho = true;
    echo.echoIndex = index;
    echo.replayReady = false;
    echo.alive = false;
    echo.echoDelay = ECHO_ACTION_DELAY + index * ECHO_DELAY_STEP;
    echo.bodyRadius = player.bodyRadius * 0.74;
    echo.fistRadius = player.fistRadius * 0.82;
    echo.armLength = player.armLength * 0.94;
    echo.hitScale = (player.hitScale || 1) * 0.66 * state.upgrades.echoPower;
    echo.cooldownScale = (player.cooldownScale || 1) * 1.18;
    echo.returnMultiplier = (player.returnMultiplier || 1) * 1.18;
    echo.spinPenalty = player.spinPenalty;
    echo.spinRecovery = player.spinRecovery;
    echo.sweepPadding = player.sweepPadding;
    echo.orbitCarry = player.orbitCarry;
    return echo;
  }

  function refreshEchoStats(echo, player) {
    echo.bodyRadius = player.bodyRadius * 0.74;
    echo.fistRadius = player.fistRadius * 0.82;
    echo.armLength = player.armLength * 0.94;
    echo.maxSpeed = player.maxSpeed;
    echo.accelRate = player.accelRate;
    echo.brakeRate = player.brakeRate;
    echo.color = player.color;
    echo.accent = player.accent;
    echo.hitScale = (player.hitScale || 1) * 0.66 * state.upgrades.echoPower;
    echo.cooldownScale = (player.cooldownScale || 1) * 1.18;
    echo.returnMultiplier = (player.returnMultiplier || 1) * 1.18;
    echo.spinPenalty = player.spinPenalty;
    echo.spinRecovery = player.spinRecovery;
    echo.sweepPadding = player.sweepPadding;
    echo.orbitCarry = player.orbitCarry;
  }

  function syncEchoes() {
    const desired = state.gameOver ? 0 : state.upgrades.echoCount;
    while (state.echoes.length < desired) {
      state.echoes.push(createEcho(state.echoes.length));
    }
    while (state.echoes.length > desired) {
      state.echoes.pop();
    }

    for (let i = 0; i < state.echoes.length; i += 1) {
      state.echoes[i].echoIndex = i;
      state.echoes[i].echoDelay = ECHO_ACTION_DELAY + i * ECHO_DELAY_STEP;
    }
  }

  function resetNodePrevious(node) {
    node.prevX = node.x;
    node.prevY = node.y;
  }

  function applyActionFrameToEcho(echo, frame, dt) {
    const wasReady = echo.replayReady;
    if (wasReady) {
      rememberFighterPose(echo);
    }

    echo.alive = true;
    echo.replayReady = true;
    echo.x = frame.x;
    echo.y = frame.y;
    echo.vx = frame.vx;
    echo.vy = frame.vy;
    echo.prevVx = frame.vx;
    echo.prevVy = frame.vy;
    echo.heading = frame.heading;
    echo.aimAngle = frame.aimAngle;
    echo.aimTargetAngle = frame.aimTargetAngle;
    echo.aimPower = frame.aimPower;
    echo.aimAngularVelocity = frame.aimAngularVelocity;
    echo.spinStress = frame.spinStress;
    echo.swingPower = frame.swingPower;
    echo.pulse = frame.pulse;
    applyNodeSnapshot(echo.body, frame.body);

    for (let i = 0; i < echo.arms.length; i += 1) {
      const arm = echo.arms[i];
      const frameArm = frame.arms[i];
      applyNodeSnapshot(arm.shoulder, frameArm.shoulder);
      applyNodeSnapshot(arm.elbow, frameArm.elbow);
      applyNodeSnapshot(arm.fist, frameArm.fist);
      arm.fist.hitCooldown = Math.max(0, (arm.fist.hitCooldown || 0) - dt);
      arm.fist.parryCooldown = Math.max(0, (arm.fist.parryCooldown || 0) - dt);
    }

    if (!wasReady) {
      resetNodePrevious(echo.body);
      for (const arm of echo.arms) {
        resetNodePrevious(arm.shoulder);
        resetNodePrevious(arm.elbow);
        resetNodePrevious(arm.fist);
      }
    }
  }

  function updateEchoes(dt) {
    const player = state.player;
    if (!player || !player.alive) {
      state.echoes = [];
      return;
    }

    syncEchoes();
    for (let i = 0; i < state.echoes.length; i += 1) {
      const echo = state.echoes[i];
      refreshEchoStats(echo, player);
      const frame = samplePlayerAction(echo.echoDelay);
      if (!frame) {
        echo.alive = false;
        echo.replayReady = false;
        continue;
      }

      applyActionFrameToEcho(echo, frame, dt);
    }
  }

  function addBurst(x, y, color, count, force = 1) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(-Math.PI, Math.PI);
      const speed = rand(80, 360) * force;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: rand(2.2, 6.5),
        life: rand(0.28, 0.68),
        maxLife: 0,
        color,
      });
      state.particles[state.particles.length - 1].maxLife =
        state.particles[state.particles.length - 1].life;
    }
  }

  function addDirectionalBurst(x, y, dirX, dirY, color, count, force = 1) {
    const dir = normalize(dirX, dirY);
    for (let i = 0; i < count; i += 1) {
      const spread = rand(-0.95, 0.95);
      const angle = Math.atan2(dir.y, dir.x) + spread;
      const speed = rand(120, 460) * force;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + dir.x * rand(60, 180) * force,
        vy: Math.sin(angle) * speed + dir.y * rand(60, 180) * force,
        radius: rand(2.5, 7.5),
        life: rand(0.24, 0.62),
        maxLife: 0,
        color,
      });
      state.particles[state.particles.length - 1].maxLife =
        state.particles[state.particles.length - 1].life;
    }
  }

  function damageFighter(fighter, amount, attacker = null, source = "hit") {
    if (!fighter.alive || amount <= 0) return false;
    if (fighter.isEcho) return false;
    if (fighter.invulnTimer > 0 && fighter.isPlayer) return false;

    const resist = source === "hazard" ? fighter.hazardResist || 1 : 1;
    const finalDamage = amount * resist;
    fighter.health -= finalDamage;
    fighter.hitFlash = 0.22;

    if (fighter.isPlayer) {
      fighter.invulnTimer = Math.max(fighter.invulnTimer, 0.72);
      state.shake = Math.max(state.shake, 12);
      updateHud();
    }

    const body = getBodyCenter(fighter);
    addDirectionalBurst(
      body.x,
      body.y,
      attacker ? body.x - getBodyCenter(attacker).x : rand(-1, 1),
      attacker ? body.y - getBodyCenter(attacker).y : rand(-1, 1),
      fighter.color,
      fighter.isPlayer ? 18 : 10,
      fighter.isPlayer ? 0.92 : 0.58,
    );

    if (fighter.health <= 0) {
      killFighter(fighter, attacker, source);
      return true;
    }

    return false;
  }

  function killFighter(fighter, attacker, method) {
    if (!fighter.alive) return;

    const body = getBodyCenter(fighter);
    fighter.alive = false;
    state.shake = Math.max(state.shake, fighter.isPlayer ? 16 : 7);
    addBurst(body.x, body.y, fighter.color, fighter.isPlayer ? 32 : 20, fighter.isPlayer ? 1.25 : 1);

    if (!fighter.isPlayer && attacker && attacker.isPlayer && method !== "body") {
      state.score += fighter.scoreValue || 1;
      addExperience(1 + (fighter.scoreValue || 1) * 1.2);
      dropLoot(body.x, body.y, fighter.scoreValue || 1);
      updateHud();
    }

    if (fighter.isPlayer) {
      state.gameOver = true;
      state.gameOverTimer = 0;
      finalScoreEl.textContent = String(state.score);
    }
  }

  function getFistAttackPower(fighter, fist) {
    const stress = clamp(fighter.spinStress || 0, 0, 1);
    const fistSpeed = Math.hypot(fist.vx || 0, fist.vy || 0);
    const speedPower = clamp(
      (fistSpeed - STRONG_HIT_SPEED) / (FULL_HIT_SPEED - STRONG_HIT_SPEED),
      0,
      1,
    );
    const bodyPower = clamp(fighter.swingPower * 0.62, 0, 0.62);
    const turnPower = clamp((fighter.aimAngularVelocity - 2.2) / 5.2, 0, 0.52);

    return clamp(Math.max(speedPower, bodyPower, turnPower) - stress * 0.34, 0, 1);
  }

  function getFistHitRadius(fighter, fist) {
    const stress = clamp(fighter.spinStress || 0, 0, 1);
    if (stress > 0.94) return 0;
    const attackPower = fist ? getFistAttackPower(fighter, fist) : 1;
    const contactScale = 0.96 + attackPower * 0.24;
    const spinPenalty = 1 - stress * (fighter.spinPenalty ?? (fighter.isPlayer ? 0.48 : 0.34));
    return fighter.fistRadius * contactScale * spinPenalty * (fighter.hitScale || 1);
  }

  function getFistCooldown(attacker) {
    return (
      FIST_HIT_COOLDOWN *
      (attacker.cooldownScale || 1) *
      (attacker.isPlayer ? state.upgrades.cooldownScale : 1)
    );
  }

  function getFistDamage(attacker, fist) {
    const attackPower = getFistAttackPower(attacker, fist);
    const base = 1 + attackPower * 0.82;
    return base * (attacker.damageScale || 1);
  }

  function damageBossLimb(boss, arm, amount, attacker, fist) {
    if (!arm.alive) return false;

    const bonus = attacker && attacker.isPlayer ? state.upgrades.bossBreaker : 0;
    arm.health -= amount * (1 + bonus);
    fist.hitCooldown = getFistCooldown(attacker) * 0.82;

    addDirectionalBurst(
      arm.fist.x,
      arm.fist.y,
      arm.fist.x - fist.x,
      arm.fist.y - fist.y,
      boss.color,
      16,
      0.92,
    );
    state.shake = Math.max(state.shake, 7);

    if (arm.health <= 0) {
      arm.alive = false;
      arm.fist.hitCooldown = 999;
      addBurst(arm.fist.x, arm.fist.y, boss.color, 28, 1.05);
      damageFighter(boss, amount * 0.55, attacker, "limb");
    }

    return true;
  }

  function tryBossLimbHit(attacker, fist, boss, contactRadius) {
    if (!boss.isBoss) return false;

    for (const arm of boss.arms) {
      if (!arm.alive) continue;

      const limbRadius = boss.fistRadius * 0.9;
      const hitFist = circleHit(fist.x, fist.y, contactRadius, arm.fist.x, arm.fist.y, limbRadius);
      const hitElbow =
        pointSegmentDistSq(fist.x, fist.y, arm.shoulder.x, arm.shoulder.y, arm.fist.x, arm.fist.y) <=
        (contactRadius + boss.fistRadius * 0.42) ** 2;

      if (hitFist || hitElbow) {
        return damageBossLimb(boss, arm, getFistDamage(attacker, fist), attacker, fist);
      }
    }

    return false;
  }

  function tryFistHit(attacker, fist, target, targetBody) {
    if (!attacker.alive || !target.alive) return false;
    if ((fist.hitCooldown || 0) > 0) return false;
    if (fist.arm && fist.arm.alive === false) return false;

    const hitRadius = getFistHitRadius(attacker, fist);
    if (hitRadius <= 0) return false;

    const fistPrevX = Number.isFinite(fist.prevX) ? fist.prevX : fist.x;
    const fistPrevY = Number.isFinite(fist.prevY) ? fist.prevY : fist.y;
    const targetPrevX = Number.isFinite(target.body.prevX) ? target.body.prevX : targetBody.x;
    const targetPrevY = Number.isFinite(target.body.prevY) ? target.body.prevY : targetBody.y;
    const contactRadius = hitRadius + (attacker.sweepPadding || FIST_SWEEP_PADDING);

    if (target.isBoss && tryBossLimbHit(attacker, fist, target, contactRadius)) {
      return true;
    }

    if (
      !circleHit(fist.x, fist.y, contactRadius, targetBody.x, targetBody.y, target.bodyRadius) &&
      !sweptCircleHit(
        fistPrevX,
        fistPrevY,
        fist.x,
        fist.y,
        contactRadius,
        targetPrevX,
        targetPrevY,
        targetBody.x,
        targetBody.y,
        target.bodyRadius,
      )
    ) {
      return false;
    }

    fist.hitCooldown = getFistCooldown(attacker);
    addDirectionalBurst(
      targetBody.x,
      targetBody.y,
      targetBody.x - fist.x,
      targetBody.y - fist.y,
      target.color,
      target.isPlayer ? 28 : 16,
      target.isPlayer ? 1.18 : 0.9,
    );
    if (attacker.isPlayer || target.isPlayer) {
      state.hitStop = Math.max(state.hitStop, target.isPlayer ? 0.075 : 0.048);
      state.shake = Math.max(state.shake, target.isPlayer ? 17 : 8);
    }
    damageFighter(target, getFistDamage(attacker, fist), attacker, "fist");
    return true;
  }

  function tryFistParry(a, fistA, b, fistB) {
    if (!a.alive || !b.alive) return false;
    if (fistA.arm && fistA.arm.alive === false) return false;
    if (fistB.arm && fistB.arm.alive === false) return false;
    if ((fistA.parryCooldown || 0) > 0 || (fistB.parryCooldown || 0) > 0) return false;

    const radius = a.fistRadius * 0.92 + b.fistRadius * 0.92;
    if (distSq(fistA.x, fistA.y, fistB.x, fistB.y) > radius * radius) return false;

    const normal = normalize(fistA.x - fistB.x, fistA.y - fistB.y);
    const power = 260 * ((a.parryPower || 1) + (b.parryPower || 1)) * 0.5;
    fistA.vx += normal.x * power;
    fistA.vy += normal.y * power;
    fistB.vx -= normal.x * power;
    fistB.vy -= normal.y * power;
    a.vx += normal.x * power * 0.08;
    a.vy += normal.y * power * 0.08;
    b.vx -= normal.x * power * 0.08;
    b.vy -= normal.y * power * 0.08;
    fistA.hitCooldown = Math.max(fistA.hitCooldown || 0, 0.11);
    fistB.hitCooldown = Math.max(fistB.hitCooldown || 0, 0.11);
    fistA.parryCooldown = 0.22;
    fistB.parryCooldown = 0.22;
    if (a.isPlayer || b.isPlayer) {
      state.hitStop = Math.max(state.hitStop, 0.028);
      state.shake = Math.max(state.shake, 5);
      if (state.upgrades.healOnParry > 0) {
        healFighter(state.player, state.upgrades.healOnParry);
      }
    }
    addBurst((fistA.x + fistB.x) * 0.5, (fistA.y + fistB.y) * 0.5, "#f7f1dc", 12, 0.62);
    return true;
  }

  function updateFistParries() {
    const playerTeam = [state.player, ...state.echoes].filter((fighter) => fighter && fighter.alive);
    for (const ally of playerTeam) {
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue;
        for (const fistA of ally.fists) {
          for (const fistB of enemy.fists) {
            tryFistParry(ally, fistA, enemy, fistB);
          }
        }
      }
    }
  }

  function separateEnemyBodies() {
    for (let i = 0; i < state.enemies.length; i += 1) {
      const a = state.enemies[i];
      if (!a.alive) continue;

      for (let j = i + 1; j < state.enemies.length; j += 1) {
        const b = state.enemies[j];
        if (!b.alive) continue;

        const aBody = getBodyCenter(a);
        const bBody = getBodyCenter(b);
        let normal = normalize(bBody.x - aBody.x, bBody.y - aBody.y);
        if (normal.length < 0.001) {
          const angle = rand(-Math.PI, Math.PI);
          normal = { x: Math.cos(angle), y: Math.sin(angle), length: 1 };
        }

        const minDistance = a.bodyRadius + b.bodyRadius + 5;
        if (normal.length >= minDistance) continue;

        const overlap = minDistance - normal.length;
        const aMass = a.isBoss ? 3.2 : 1;
        const bMass = b.isBoss ? 3.2 : 1;
        const totalMass = aMass + bMass;
        const aPush = (overlap * bMass) / totalMass;
        const bPush = (overlap * aMass) / totalMass;

        translateFighter(a, -normal.x * aPush, -normal.y * aPush);
        translateFighter(b, normal.x * bPush, normal.y * bPush);
        a.vx -= normal.x * overlap * 0.9;
        a.vy -= normal.y * overlap * 0.9;
        b.vx += normal.x * overlap * 0.9;
        b.vy += normal.y * overlap * 0.9;
      }
    }
  }

  function updateCollisions() {
    const player = state.player;

    updateFistParries();
    separateEnemyBodies();

    if (player.alive) {
      const playerBody = getBodyCenter(player);
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue;
        const enemyBody = getBodyCenter(enemy);
        if (circleHit(playerBody.x, playerBody.y, player.bodyRadius, enemyBody.x, enemyBody.y, enemy.bodyRadius)) {
          damageFighter(player, enemy.bodyDamage || 1, enemy, "body");
          if (!enemy.isBoss) {
            damageFighter(enemy, 0.48 * (player.damageScale || 1), player, "body");
          }
        }
      }
    }

    if (player.alive) {
      const playerBody = getBodyCenter(player);
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue;
        for (const fist of enemy.fists) {
          if (tryFistHit(enemy, fist, player, playerBody)) {
            break;
          }
        }
      }
    }

    if (player.alive) {
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue;
        const enemyBody = getBodyCenter(enemy);
        for (const fist of player.fists) {
          if (tryFistHit(player, fist, enemy, enemyBody)) {
            break;
          }
        }
      }
    }

    if (player.alive && state.echoes.length > 0) {
      for (const echo of state.echoes) {
        if (!echo.alive) continue;
        for (const enemy of state.enemies) {
          if (!enemy.alive) continue;
          const enemyBody = getBodyCenter(enemy);
          for (const fist of echo.fists) {
            if (tryFistHit(echo, fist, enemy, enemyBody)) {
              break;
            }
          }
        }
      }
    }

    state.enemies = state.enemies.filter((enemy) => enemy.alive);
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 1 - Math.min(0.72, dt * 2.4);
      particle.vy *= 1 - Math.min(0.72, dt * 2.4);
    }

    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function updateCamera(dt) {
    const player = state.player;
    const viewWidth = getViewWidth();
    const viewHeight = getViewHeight();
    const targetX = player.x - viewWidth / 2;
    const targetY = player.y - viewHeight / 2;
    const maxX = Math.max(0, ARENA.width - viewWidth);
    const maxY = Math.max(0, ARENA.height - viewHeight);

    state.camera.x = approach(state.camera.x, clamp(targetX, 0, maxX), 8, dt);
    state.camera.y = approach(state.camera.y, clamp(targetY, 0, maxY), 8, dt);
  }

  function updateSpawn(dt) {
    const nextWave = 1 + Math.floor(state.time / 18);
    if (nextWave !== state.wave) {
      state.wave = nextWave;
      state.spawnTimer = Math.min(state.spawnTimer, 0.08);
      state.shake = Math.max(state.shake, 4 + Math.min(8, state.wave) * 0.45);
      addBurst(state.player.x, state.player.y, "#f4c84f", 12 + Math.min(18, state.wave * 2), 0.58);
      const openerCount = state.wave >= 8 ? 2 : state.wave >= 4 ? 1 : 0;
      for (let i = 0; i < openerCount && state.enemies.length < 24; i += 1) {
        spawnEnemy(false);
      }
      updateHud();
    }
    state.spawnTimer -= dt;

    const bossAlive = state.enemies.some((enemy) => enemy.isBoss && enemy.alive);
    if (state.wave >= state.nextBossWave && !bossAlive) {
      spawnBoss();
      state.nextBossWave += 4;
    }

    const earlyBase = state.wave <= 2 ? 4 : state.wave <= 4 ? 5 : 7;
    const wavePressure = state.wave <= 4 ? Math.floor(state.wave * 0.7) : Math.floor(state.wave * 1.28);
    const scorePressure = Math.floor(state.score / (state.wave <= 4 ? 8 : 5));
    const targetCap = state.wave <= 2 ? 7 : state.wave <= 4 ? 11 : 24;
    const targetCount = clamp(earlyBase + wavePressure + scorePressure - (bossAlive ? 3 : 0), earlyBase, targetCap);
    if (state.spawnTimer <= 0 && state.enemies.length < targetCount) {
      const batch = state.wave >= 7 ? 2 : 1;
      for (let i = 0; i < batch && state.enemies.length < targetCount; i += 1) {
        spawnEnemy(false);
      }
      state.spawnTimer =
        state.wave <= 3
          ? Math.max(1.35, 2.65 - state.wave * 0.18)
          : Math.max(0.42, 2.05 - state.wave * 0.105);
      updateHud();
    }
  }

  function updatePlayerAim() {
    const player = state.player;
    if (!player) return;

    if (state.aim.power > 0.12) {
      player.aimTargetAngle = Math.atan2(state.aim.y, state.aim.x);
      player.aimPower = state.aim.power;
      state.aim.angle = player.aimTargetAngle;
      return;
    }

    player.aimPower = 0;
  }

  function update(dt) {
    state.time += dt;
    state.shake = approach(state.shake, 0, 8, dt);

    if (state.pendingUpgrade || state.pendingCharacterSelect) {
      updateParticles(dt * 0.35);
      return;
    }

    const keyboard = readKeyboardInput();
    const inputX = keyboard.power > 0 ? keyboard.x : state.input.x;
    const inputY = keyboard.power > 0 ? keyboard.y : state.input.y;
    const inputPower = keyboard.power > 0 ? keyboard.power : state.input.power;

    if (!state.gameOver) {
      updatePlayerAim();
      moveFighter(state.player, inputX, inputY, inputPower, dt);
      updateEnemyAIForAll(dt);
      updateSpawn(dt);
      updatePickupSpawns(dt);
      updateHazards(dt);
    } else {
      state.gameOverTimer += dt;
      state.player.vx = approach(state.player.vx, 0, 9, dt);
      state.player.vy = approach(state.player.vy, 0, 9, dt);
      if (state.gameOverTimer > 0.52) {
        statusEl.classList.remove("hidden");
      }
    }

    updatePose(state.player, dt);
    recordPlayerAction();
    updateEchoes(dt);
    for (const enemy of state.enemies) {
      updatePose(enemy, dt);
    }

    if (!state.gameOver) {
      updatePickups(dt);
      updateCollisions();
    }

    updateParticles(dt);
    updateCamera(dt);
  }

  function updateEnemyAIForAll(dt) {
    for (const enemy of state.enemies) {
      updateEnemyAI(enemy, dt);
    }
  }

  function drawArena() {
    ctx.fillStyle = "#17150f";
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);

    const glow = ctx.createRadialGradient(
      ARENA.width * 0.5,
      ARENA.height * 0.46,
      120,
      ARENA.width * 0.5,
      ARENA.height * 0.48,
      ARENA.width * 0.7,
    );
    glow.addColorStop(0, "rgba(244, 200, 79, 0.1)");
    glow.addColorStop(0.5, "rgba(232, 97, 152, 0.035)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);

    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "#3b3529";
    ctx.lineWidth = 1;
    const grid = 110;
    for (let x = 0; x <= ARENA.width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ARENA.height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA.width, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(ARENA.width / 2, ARENA.height / 2);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#2c2317";
    ctx.strokeStyle = "#f4c84f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = Math.PI / 8 + (i / 8) * TWO_PI;
      const radius = i % 2 === 0 ? 500 : 440;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#f7f1dc";
    for (let i = 0; i < 10; i += 1) {
      ctx.rotate(TWO_PI / 10);
      ctx.fillRect(120, -4, 320, 8);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#f4c84f";
    ctx.lineWidth = 3;
    ctx.setLineDash([34, 24]);
    for (let radius = 260; radius < 1250; radius += 230) {
      ctx.beginPath();
      ctx.arc(ARENA.width / 2, ARENA.height / 2, radius, state.time * 0.08, state.time * 0.08 + TWO_PI);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = "#f7f1dc";
    ctx.lineWidth = 4;
    for (let i = 0; i < 18; i += 1) {
      const x = 180 + i * 175;
      const y = i % 2 === 0 ? 180 : ARENA.height - 210;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 72, y - 28);
      ctx.stroke();
    }
    ctx.restore();

    for (const decal of state.decals) {
      ctx.globalAlpha = decal.alpha;
      ctx.fillStyle = decal.color;
      ctx.beginPath();
      ctx.arc(decal.x, decal.y, decal.r, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.strokeStyle = "#d6bb67";
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.75;
    ctx.strokeRect(ARENA.pad / 2, ARENA.pad / 2, ARENA.width - ARENA.pad, ARENA.height - ARENA.pad);
    ctx.restore();

    ctx.save();
    const postSize = 74;
    const posts = [
      [ARENA.pad, ARENA.pad],
      [ARENA.width - ARENA.pad, ARENA.pad],
      [ARENA.width - ARENA.pad, ARENA.height - ARENA.pad],
      [ARENA.pad, ARENA.height - ARENA.pad],
    ];
    for (const [x, y] of posts) {
      ctx.fillStyle = "rgba(9, 10, 7, 0.78)";
      ctx.fillRect(x - postSize / 2, y - postSize / 2, postSize, postSize);
      ctx.strokeStyle = "rgba(244, 200, 79, 0.72)";
      ctx.lineWidth = 5;
      ctx.strokeRect(x - postSize / 2, y - postSize / 2, postSize, postSize);
      ctx.fillStyle = "rgba(239, 99, 81, 0.5)";
      ctx.fillRect(x - postSize * 0.2, y - postSize * 0.2, postSize * 0.4, postSize * 0.4);
    }
    ctx.restore();
  }

  function drawCircle(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TWO_PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function getArmPath(arm) {
    const shoulder = arm.shoulder;
    const elbow = arm.elbow;
    const fist = arm.fist;
    const shoulderToElbow = normalize(elbow.x - shoulder.x, elbow.y - shoulder.y);
    const elbowToFist = normalize(fist.x - elbow.x, fist.y - elbow.y);

    return {
      shoulderX: shoulder.x,
      shoulderY: shoulder.y,
      control1X: shoulder.x + shoulderToElbow.x * shoulderToElbow.length * 0.74,
      control1Y: shoulder.y + shoulderToElbow.y * shoulderToElbow.length * 0.74,
      control2X: elbow.x + elbowToFist.x * elbowToFist.length * 0.42,
      control2Y: elbow.y + elbowToFist.y * elbowToFist.length * 0.42,
      fistX: fist.x,
      fistY: fist.y,
    };
  }

  function strokeArmPath(arm) {
    const path = getArmPath(arm);
    ctx.beginPath();
    ctx.moveTo(path.shoulderX, path.shoulderY);
    ctx.bezierCurveTo(
      path.control1X,
      path.control1Y,
      path.control2X,
      path.control2Y,
      path.fistX,
      path.fistY,
    );
    ctx.stroke();
  }

  function drawHealthBar(fighter, body) {
    if (
      !fighter.maxHealth ||
      (fighter.health >= fighter.maxHealth &&
        !fighter.isBoss &&
        (!fighter.waveSkills || fighter.waveSkills.length === 0))
    ) {
      return;
    }

    const width = fighter.isBoss ? 96 : fighter.bodyRadius * 2.2;
    const height = fighter.isBoss ? 8 : 5;
    const x = body.x - width / 2;
    const y = body.y - fighter.bodyRadius - (fighter.isBoss ? 34 : 18);
    const ratio = clamp(fighter.health / fighter.maxHealth, 0, 1);

    ctx.save();
    ctx.fillStyle = "rgba(8, 9, 6, 0.72)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = fighter.isPlayer ? "#4dd7c1" : fighter.isBoss ? "#ef6351" : "#f4c84f";
    ctx.fillRect(x, y, width * ratio, height);

    if (!fighter.isPlayer && fighter.waveSkills && fighter.waveSkills.length > 0) {
      const dotSize = fighter.isBoss ? 4.5 : 3.6;
      const spacing = dotSize * 2.4;
      const startX = body.x - ((fighter.waveSkills.length - 1) * spacing) / 2;
      for (let i = 0; i < fighter.waveSkills.length; i += 1) {
        ctx.fillStyle = fighter.waveSkills[i].color;
        ctx.beginPath();
        ctx.arc(startX + i * spacing, y - 7, dotSize, 0, TWO_PI);
        ctx.fill();
      }
    }

    if (fighter.isBoss) {
      const aliveArms = fighter.arms.filter((arm) => arm.alive !== false);
      for (let i = 0; i < fighter.arms.length; i += 1) {
        const arm = fighter.arms[i];
        const segmentWidth = width / fighter.arms.length - 3;
        const sx = x + i * (width / fighter.arms.length) + 1.5;
        const sy = y + height + 4;
        ctx.fillStyle = "rgba(8, 9, 6, 0.72)";
        ctx.fillRect(sx, sy, segmentWidth, 4);
        if (arm.alive !== false) {
          ctx.fillStyle = "#f4c84f";
          ctx.fillRect(sx, sy, segmentWidth * clamp(arm.health / arm.maxHealth, 0, 1), 4);
        }
      }
      if (aliveArms.length === 0) {
        ctx.globalAlpha = 0.45;
      }
    }
    ctx.restore();
  }

  function drawFistTrail(fighter, fist) {
    const prevX = Number.isFinite(fist.prevX) ? fist.prevX : fist.x;
    const prevY = Number.isFinite(fist.prevY) ? fist.prevY : fist.y;
    const speed = Math.hypot(fist.vx || 0, fist.vy || 0);
    const travel = Math.hypot(fist.x - prevX, fist.y - prevY);
    const intensity = clamp(Math.max(speed / 980, travel / 34), 0, 1);
    if (intensity < 0.08) return;

    const velocityDir = normalize(
      Math.abs(fist.vx) + Math.abs(fist.vy) > 0.001 ? fist.vx : fist.x - prevX,
      Math.abs(fist.vx) + Math.abs(fist.vy) > 0.001 ? fist.vy : fist.y - prevY,
    );
    if (velocityDir.length < 0.001) return;

    const sign = fist.arm ? fist.arm.sign : 1;
    const length = clamp(speed * 0.045 + travel * 1.1, 16, fighter.isPlayer ? 72 : 58);
    const startX = fist.x - velocityDir.x * length;
    const startY = fist.y - velocityDir.y * length;
    const bend = length * 0.22 * sign;
    const controlX = (startX + fist.x) * 0.5 - velocityDir.y * bend;
    const controlY = (startY + fist.y) * 0.5 + velocityDir.x * bend;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = fighter.fistRadius * (1.25 + intensity * 0.42);
    ctx.strokeStyle = rgba(fighter.color, (fighter.isPlayer ? 0.28 : 0.18) * intensity);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, fist.x, fist.y);
    ctx.stroke();

    ctx.lineWidth = Math.max(3, fighter.fistRadius * 0.38);
    ctx.strokeStyle = rgba("#f7f1dc", 0.2 * intensity);
    ctx.beginPath();
    ctx.moveTo(lerp(startX, fist.x, 0.32), lerp(startY, fist.y, 0.32));
    ctx.quadraticCurveTo(controlX, controlY, fist.x, fist.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawFistModel(fighter, fist, body, activeGlow, fistHitScale) {
    const towardBody = normalize(fist.x - body.x, fist.y - body.y);
    const angle = towardBody.length > 0.001 ? Math.atan2(towardBody.y, towardBody.x) : fighter.aimAngle;
    const hitGlow = (0.18 + activeGlow * 0.2) * (0.25 + fistHitScale * 0.75);

    ctx.save();
    ctx.globalAlpha = hitGlow;
    drawCircle(fist.x, fist.y, fighter.fistRadius + 7 + activeGlow * 5, fighter.color);
    ctx.restore();

    ctx.save();
    ctx.translate(fist.x, fist.y);
    ctx.rotate(angle);

    ctx.globalAlpha = 0.74 + fistHitScale * 0.26;
    ctx.fillStyle = rgba("#090a07", 0.88);
    ctx.beginPath();
    ctx.ellipse(-fighter.fistRadius * 0.12, fighter.fistRadius * 0.08, fighter.fistRadius * 1.04, fighter.fistRadius * 0.88, 0, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = fighter.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, fighter.fistRadius * 0.96, fighter.fistRadius * 0.8, 0, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = rgba(fighter.accent || "#ffffff", fighter.isPlayer ? 0.42 : 0.3);
    ctx.fillRect(-fighter.fistRadius * 0.92, -fighter.fistRadius * 0.48, fighter.fistRadius * 0.26, fighter.fistRadius * 0.96);

    ctx.fillStyle = rgba("#ffffff", fighter.isPlayer ? 0.36 : 0.25);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(
        fighter.fistRadius * 0.3,
        (i - 1) * fighter.fistRadius * 0.32,
        fighter.fistRadius * 0.23,
        fighter.fistRadius * 0.15,
        0,
        0,
        TWO_PI,
      );
      ctx.fill();
    }

    ctx.lineWidth = 2.6;
    ctx.strokeStyle = rgba("#090a07", 0.82);
    ctx.beginPath();
    ctx.ellipse(0, 0, fighter.fistRadius * 0.96, fighter.fistRadius * 0.8, 0, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }

  function drawBodyTypeMark(fighter, radius) {
    const type = fighter.isPlayer ? fighter.playerType : fighter.enemyType;

    ctx.strokeStyle = rgba(fighter.accent || "#ffffff", fighter.isPlayer ? 0.52 : 0.36);
    ctx.fillStyle = rgba(fighter.accent || "#ffffff", fighter.isPlayer ? 0.22 : 0.16);
    ctx.lineWidth = fighter.isBoss ? 4 : 2.4;

    if (type === "brawler" || type === "brute" || fighter.isBoss) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.26, -radius * 0.48);
      ctx.lineTo(radius * 0.38, 0);
      ctx.lineTo(-radius * 0.26, radius * 0.48);
      ctx.stroke();
    } else if (type === "swift" || type === "dasher") {
      ctx.beginPath();
      ctx.moveTo(radius * 0.62, 0);
      ctx.lineTo(-radius * 0.24, -radius * 0.38);
      ctx.lineTo(-radius * 0.08, 0);
      ctx.lineTo(-radius * 0.24, radius * 0.38);
      ctx.closePath();
      ctx.fill();
    } else if (type === "spring" || type === "guard") {
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.46, -Math.PI * 0.35, Math.PI * 1.35);
      ctx.stroke();
    } else if (type === "longarm") {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.38, 0);
      ctx.lineTo(radius * 0.52, 0);
      ctx.moveTo(radius * 0.18, -radius * 0.28);
      ctx.lineTo(radius * 0.52, 0);
      ctx.lineTo(radius * 0.18, radius * 0.28);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.32, 0, TWO_PI);
      ctx.fill();
    }
  }

  function drawBodyModel(fighter, body, aimBasis, activeGlow) {
    const radius = fighter.bodyRadius;
    const attackGlow = !fighter.isPlayer && fighter.ai && fighter.ai.attackTimer > 0
      ? clamp(fighter.ai.attackTimer / Math.max(0.001, fighter.ai.attackDuration), 0, 1)
      : 0;

    ctx.save();
    ctx.globalAlpha = 0.14 + activeGlow * 0.1 + attackGlow * 0.2;
    drawCircle(body.x, body.y, radius + 9 + Math.sin(fighter.pulse) * 1.4 + attackGlow * 6, fighter.color);
    ctx.restore();

    ctx.save();
    ctx.translate(body.x, body.y);
    ctx.rotate(fighter.aimAngle);

    ctx.fillStyle = rgba("#080906", 0.9);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.14, radius * 0.9, 0, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = fighter.hitFlash > 0 ? rgba("#ffffff", 0.55) : fighter.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.78, 0, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = rgba("#090a07", 0.24);
    ctx.beginPath();
    ctx.moveTo(radius * 0.92, 0);
    ctx.lineTo(radius * 0.12, -radius * 0.54);
    ctx.lineTo(radius * 0.26, 0);
    ctx.lineTo(radius * 0.12, radius * 0.54);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(fighter.accent || "#ffffff", fighter.isPlayer ? 0.3 : 0.2);
    ctx.beginPath();
    ctx.ellipse(-radius * 0.24, -radius * 0.3, radius * 0.34, radius * 0.18, -0.28, 0, TWO_PI);
    ctx.fill();

    drawBodyTypeMark(fighter, radius);

    ctx.lineWidth = fighter.isPlayer ? 4 : 3;
    ctx.strokeStyle = rgba("#090a07", 0.88);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.78, 0, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.lineWidth = fighter.isPlayer ? 2.6 : 2;
    ctx.strokeStyle = rgba(fighter.accent || "#ffffff", fighter.isPlayer ? 0.48 : 0.32);
    ctx.beginPath();
    ctx.moveTo(
      body.x + aimBasis.forwardX * radius * 0.62 + aimBasis.sideX * radius * 0.22,
      body.y + aimBasis.forwardY * radius * 0.62 + aimBasis.sideY * radius * 0.22,
    );
    ctx.lineTo(
      body.x + aimBasis.forwardX * radius * 0.9,
      body.y + aimBasis.forwardY * radius * 0.9,
    );
    ctx.lineTo(
      body.x + aimBasis.forwardX * radius * 0.62 - aimBasis.sideX * radius * 0.22,
      body.y + aimBasis.forwardY * radius * 0.62 - aimBasis.sideY * radius * 0.22,
    );
    ctx.stroke();
    ctx.restore();
  }

  function drawFighter(fighter) {
    if (!fighter.alive) return;

    ctx.save();
    if (fighter.isEcho) {
      ctx.globalAlpha *= 0.58;
    } else if (fighter.isPlayer && fighter.invulnTimer > 0) {
      ctx.globalAlpha *= 0.58 + Math.sin(state.time * 38) * 0.18;
    }

    const body = getBodyCenter(fighter);
    const aimBasis = getAimBasis(fighter);
    const speed = Math.hypot(fighter.vx, fighter.vy);
    const activeGlow = clamp(speed / fighter.maxSpeed, 0, 1);

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(body.x, body.y + fighter.bodyRadius * 0.55, fighter.bodyRadius * 1.2, fighter.bodyRadius * 0.55, 0, 0, TWO_PI);
    ctx.fill();
    for (const fist of fighter.fists) {
      if (fist.arm && fist.arm.alive === false) continue;
      ctx.beginPath();
      ctx.ellipse(fist.x, fist.y + fighter.fistRadius * 0.55, fighter.fistRadius * 1.1, fighter.fistRadius * 0.46, 0, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = fighter.isPlayer ? 15 : 13;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
    ctx.translate(0, fighter.isPlayer ? 3 : 2.5);
    for (const arm of fighter.arms) {
      if (arm.alive === false) continue;
      strokeArmPath(arm);
    }
    ctx.translate(0, fighter.isPlayer ? -3 : -2.5);

    ctx.lineWidth = fighter.isPlayer ? 13 : 11;
    ctx.strokeStyle = rgba(fighter.color, 0.84);
    for (const arm of fighter.arms) {
      if (arm.alive === false) continue;
      strokeArmPath(arm);
    }

    ctx.lineWidth = fighter.isPlayer ? 3 : 2.5;
    ctx.strokeStyle = rgba("#f7f1dc", 0.22);
    for (const arm of fighter.arms) {
      if (arm.alive === false) continue;
      strokeArmPath(arm);
    }
    ctx.restore();

    ctx.save();
    for (const arm of fighter.arms) {
      if (arm.alive === false) continue;
      drawCircle(arm.shoulder.x, arm.shoulder.y, fighter.isPlayer ? 5.2 : 4.3, rgba("#090a07", 0.78));
      drawCircle(arm.shoulder.x, arm.shoulder.y, fighter.isPlayer ? 3.4 : 2.8, rgba(fighter.accent || "#ffffff", 0.35));
      drawCircle(arm.elbow.x, arm.elbow.y, fighter.isPlayer ? 4.2 : 3.4, rgba("#090a07", 0.62));
      drawCircle(arm.elbow.x, arm.elbow.y, fighter.isPlayer ? 2.4 : 2, rgba(fighter.color, 0.68));
    }
    ctx.restore();

    for (const fist of fighter.fists) {
      if (fist.arm && fist.arm.alive === false) continue;
      drawFistTrail(fighter, fist);
    }

    for (const fist of fighter.fists) {
      if (fist.arm && fist.arm.alive === false) continue;
      const fistHitScale = clamp(getFistHitRadius(fighter, fist) / fighter.fistRadius, 0, 1);
      drawFistModel(fighter, fist, body, activeGlow, fistHitScale);
    }

    drawBodyModel(fighter, body, aimBasis, activeGlow);
    drawHealthBar(fighter, body);
    ctx.restore();
  }

  function drawHazards() {
    for (const hazard of state.hazards) {
      const spec = HAZARD_TYPES[hazard.kind];
      const pulse = 0.5 + Math.sin(hazard.pulse) * 0.5;
      ctx.save();
      ctx.globalAlpha = hazard.kind === "spike" ? 0.16 + pulse * 0.12 : 0.11 + pulse * 0.08;
      drawCircle(hazard.x, hazard.y, hazard.radius + pulse * 7, hazard.color);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = hazard.kind === "mud" ? 3 : 2;
      ctx.strokeStyle = rgba(spec.color, hazard.kind === "spike" ? 0.75 : 0.58);
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius, 0, TWO_PI);
      ctx.stroke();

      if (hazard.kind === "bumper") {
        drawCircle(hazard.x, hazard.y, hazard.radius * 0.34, hazard.color);
      } else if (hazard.kind === "vortex") {
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius * 0.55, hazard.pulse, hazard.pulse + Math.PI * 1.35);
        ctx.stroke();
      } else if (hazard.kind === "spike") {
        for (let i = 0; i < 6; i += 1) {
          const angle = hazard.pulse * 0.18 + (i / 6) * TWO_PI;
          ctx.beginPath();
          ctx.moveTo(hazard.x, hazard.y);
          ctx.lineTo(
            hazard.x + Math.cos(angle) * hazard.radius * 0.76,
            hazard.y + Math.sin(angle) * hazard.radius * 0.76,
          );
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawPickups() {
    for (const pickup of state.pickups) {
      const pulse = 0.5 + Math.sin(pickup.pulse) * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.16 + pulse * 0.14;
      drawCircle(pickup.x, pickup.y, pickup.glow + pulse * 4, pickup.color);
      ctx.restore();

      ctx.save();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = rgba("#f7f1dc", 0.28 + pulse * 0.2);
      drawCircle(pickup.x, pickup.y, pickup.radius + pulse * 1.2, pickup.color);
      ctx.stroke();

      if (pickup.kind !== "xp") {
        ctx.globalAlpha = 0.58;
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, pickup.radius * 0.44, 0, TWO_PI);
        ctx.fillStyle = rgba("#ffffff", 0.72);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const t = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = t;
      drawCircle(particle.x, particle.y, particle.radius * (0.45 + t), particle.color);
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, state.width, state.height);

    const shakeX = rand(-state.shake, state.shake);
    const shakeY = rand(-state.shake, state.shake);

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.scale(VIEW_SCALE, VIEW_SCALE);
    ctx.translate(-state.camera.x, -state.camera.y);
    drawArena();
    drawHazards();
    drawPickups();
    drawParticles();

    const fighters = [state.player, ...state.echoes, ...state.enemies].sort(
      (a, b) => getBodyCenter(a).y - getBodyCenter(b).y,
    );
    for (const fighter of fighters) {
      drawFighter(fighter);
    }
    ctx.restore();

    drawScreenVignette();
  }

  function drawScreenVignette() {
    const gradient = ctx.createRadialGradient(
      state.width * 0.5,
      state.height * 0.48,
      state.height * 0.2,
      state.width * 0.5,
      state.height * 0.5,
      Math.max(state.width, state.height) * 0.72,
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.38)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    refreshJoystickCenter();
    refreshAimJoystickCenter();
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    if (state.hitStop > 0) {
      state.hitStop = Math.max(0, state.hitStop - dt);
      state.shake = approach(state.shake, 0, 4, dt);
    } else {
      update(dt);
    }
    render();
    requestAnimationFrame(frame);
  }

  function refreshJoystickCenter() {
    const rect = joystickEl.getBoundingClientRect();
    joystick.centerX = rect.left + rect.width / 2;
    joystick.centerY = rect.top + rect.height / 2;
    joystick.radius = rect.width * 0.43;
  }

  function refreshAimJoystickCenter() {
    const rect = aimJoystickEl.getBoundingClientRect();
    aimJoystick.centerX = rect.left + rect.width / 2;
    aimJoystick.centerY = rect.top + rect.height / 2;
    aimJoystick.radius = rect.width * 0.43;
  }

  function getJoystickSize(el) {
    const rect = el.getBoundingClientRect();
    return rect.width || Math.min(state.width * 0.34, 136);
  }

  function clampJoystickCenter(x, y, side, size) {
    const margin = size * 0.5 + 8;
    const middleGap = Math.min(54, state.width * 0.08);
    const minX = side === "left" ? margin : state.width * 0.5 + middleGap;
    const maxX = side === "left" ? state.width * 0.5 - middleGap : state.width - margin;

    return {
      x: clamp(x, minX, maxX),
      y: clamp(y, margin, state.height - margin),
    };
  }

  function placeJoystickBase(control, el, x, y, side) {
    const size = getJoystickSize(el);
    const center = clampJoystickCenter(x, y, side, size);
    control.centerX = center.x;
    control.centerY = center.y;
    control.radius = size * 0.43;

    el.style.left = `${center.x - size / 2}px`;
    el.style.top = `${center.y - size / 2}px`;
    el.style.right = "auto";
    el.style.bottom = "auto";
  }

  function resetJoystickBase(control, el, knobEl, refresh) {
    control.pointerId = null;
    el.classList.remove("active");
    el.style.removeProperty("left");
    el.style.removeProperty("top");
    el.style.removeProperty("right");
    el.style.removeProperty("bottom");
    knobEl.style.setProperty("--stick-x", "0px");
    knobEl.style.setProperty("--stick-y", "0px");
    requestAnimationFrame(refresh);
  }

  function requestLandscapeLock() {
    if (landscapeLockRequested) return;
    landscapeLockRequested = true;

    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
      window.screen.orientation.lock("landscape").catch(() => {});
    }
  }

  function updateFloatingJoystick(control, el, knobEl, event, target, side, neutralY) {
    let dx = event.clientX - control.centerX;
    let dy = event.clientY - control.centerY;
    let length = Math.hypot(dx, dy);
    let nx = length > 0 ? dx / length : 0;
    let ny = length > 0 ? dy / length : neutralY;

    if (length > control.radius) {
      const follow = (length - control.radius) * 0.78;
      placeJoystickBase(
        control,
        el,
        control.centerX + nx * follow,
        control.centerY + ny * follow,
        side,
      );
      dx = event.clientX - control.centerX;
      dy = event.clientY - control.centerY;
      length = Math.hypot(dx, dy);
      nx = length > 0 ? dx / length : 0;
      ny = length > 0 ? dy / length : neutralY;
    }

    const clamped = Math.min(length, control.radius);
    target.x = nx;
    target.y = ny;
    target.power = clamp(length / control.radius, 0, 1);
    target.active = true;

    knobEl.style.setProperty("--stick-x", `${nx * clamped}px`);
    knobEl.style.setProperty("--stick-y", `${ny * clamped}px`);
  }

  function updateJoystickFromPointer(event) {
    updateFloatingJoystick(joystick, joystickEl, stickEl, event, state.input, "left", 0);
  }

  function beginJoystick(event) {
    if (joystick.pointerId !== null) return;
    requestLandscapeLock();
    joystick.pointerId = event.pointerId;
    placeJoystickBase(joystick, joystickEl, event.clientX, event.clientY, "left");
    joystickEl.classList.add("active");
    updateJoystickFromPointer(event);
    event.stopPropagation();
    event.preventDefault();
  }

  function endJoystick(event) {
    if (event.pointerId !== joystick.pointerId) return;
    state.input.x = 0;
    state.input.y = 0;
    state.input.power = 0;
    state.input.active = false;
    resetJoystickBase(joystick, joystickEl, stickEl, refreshJoystickCenter);
  }

  function inJoystickTouchZone(event) {
    return event.clientX < state.width * 0.5;
  }

  function updateAimJoystickFromPointer(event) {
    updateFloatingJoystick(aimJoystick, aimJoystickEl, aimStickEl, event, state.aim, "right", 1);
  }

  function beginAimJoystick(event) {
    if (aimJoystick.pointerId !== null) return;
    requestLandscapeLock();
    aimJoystick.pointerId = event.pointerId;
    placeJoystickBase(aimJoystick, aimJoystickEl, event.clientX, event.clientY, "right");
    aimJoystickEl.classList.add("active");
    updateAimJoystickFromPointer(event);
    event.stopPropagation();
    event.preventDefault();
  }

  function endAimJoystick(event) {
    if (event.pointerId !== aimJoystick.pointerId) return;
    state.aim.power = 0;
    state.aim.active = false;
    resetJoystickBase(aimJoystick, aimJoystickEl, aimStickEl, refreshAimJoystickCenter);
  }

  function inAimJoystickTouchZone(event) {
    return event.clientX >= state.width * 0.5;
  }

  joystickEl.addEventListener("pointerdown", beginJoystick);
  aimJoystickEl.addEventListener("pointerdown", beginAimJoystick);
  canvas.addEventListener("pointerdown", (event) => {
    if (state.pendingUpgrade || state.pendingCharacterSelect) return;
    if (inAimJoystickTouchZone(event)) {
      beginAimJoystick(event);
    } else if (inJoystickTouchZone(event)) {
      beginJoystick(event);
    }
  });
  window.addEventListener("pointermove", (event) => {
    if (event.pointerId === joystick.pointerId) {
      updateJoystickFromPointer(event);
      event.preventDefault();
    }
    if (event.pointerId === aimJoystick.pointerId) {
      updateAimJoystickFromPointer(event);
      event.preventDefault();
    }
  });
  window.addEventListener("pointerup", endJoystick);
  window.addEventListener("pointercancel", endJoystick);
  window.addEventListener("pointerup", endAimJoystick);
  window.addEventListener("pointercancel", endAimJoystick);

  window.addEventListener("keydown", (event) => {
    state.keys.add(event.code);
    if (event.code === "Space" && state.gameOver) {
      resetGame();
    }
  });

  window.addEventListener("keyup", (event) => {
    state.keys.delete(event.code);
  });

  restartTop.addEventListener("click", resetGame);
  restartMain.addEventListener("click", resetGame);
  typeButton.addEventListener("click", openCharacterSelect);
  characterCloseEl.addEventListener("click", closeCharacterSelect);
  characterSelectEl.addEventListener("click", (event) => {
    if (event.target === characterSelectEl) {
      closeCharacterSelect();
    }
  });
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => {
    window.setTimeout(resize, 120);
  });

  resize();
  resetGame();
  requestAnimationFrame(frame);
})();
