/* ============================================================
   ЛЕТУНОВ — цирковой бой
   Мистер Большое Пузо катается по арене в леопардовом кресле,
   а во второй фазе встаёт и пускает в ход живот.
   Вся графика рисуется процедурно на canvas.
   ============================================================ */
(() => {
  'use strict';

  // ---------- константы ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = 1280;
  const H = 720;
  const GROUND = 610;
  const FLOOR_TOP = 590;
  const ARENA_L = 80;
  const ARENA_R = 1200;
  const HERO_W = 30;
  const HERO_H = 86;
  const HERO_CROUCH_H = 44;
  const BASE_HEARTS = 2;
  const HERO_MAX_HP = BASE_HEARTS * 5; // 2 сердца; третье выпадает с Летунова
  const PUNCH_Y = GROUND - 112;
  const PUNCH_R = 32;
  const BELLY_TOP = GROUND - 140;
  const BELLY_BOTTOM = GROUND - 54;
  const BOSS_MAX_HP = 6300; // уменьшено в 2 раза
  const DENIS_MAX_HP = 8400; // уменьшено в 1.5 раза
  const EGOR_MAX_HP = 10500;
  const ELENA_MAX_HP = 7200;
  const NIKITA_MAX_HP = 5600;
  const NIKITA_RIDE_SCALE = 0.55; // Никита на велосипеде ниже, чтобы его можно было перепрыгнуть.
  const SUPER_CARD_DAMAGE = 420;
  // Одна звезда даёт слабый супер, пять — мощный. Урон растёт с числом звёзд.
  const SUPER_MIN_DAMAGE = 120;
  const SUPER_MAX_DAMAGE = 750;
  const TAU = Math.PI * 2;
  const DENIS_PHASE2_AT = 0.5;
  const DENIS_PHASE3_AT = 0.22;
  const EGOR_ARM_Y = 430; // рука Егора во 2 фазе бьёт на уровне героя над облаками

  const DIFFICULTY_CONFIG = {
    easy: {
      id: 'easy',
      name: 'ЛЕГКАЯ',
      short: 'ЛЁГКАЯ',
      hp: 0.8,
      damage: 4,
      speed: 0.88,
      wait: 1.16,
      note: 'Меньше здоровья босса, спокойнее атаки и больше времени на передышку.',
    },
    hard: {
      id: 'hard',
      name: 'СЛОЖНАЯ',
      short: 'СЛОЖНАЯ',
      hp: 1.15,
      damage: 5,
      speed: 1.14,
      wait: 0.84,
      note: 'Больше здоровья, быстрее снаряды и почти нет пауз между атаками.',
    },
  };

  const BOSS_CONFIG = {
    letunov: {
      id: 'letunov',
      name: 'ЛЕТУНОВ',
      site: 'ЦИРК «ГИГАНТ»',
      kicker: 'Цирк «Гигант» · особое представление',
      phase1: 'САМЫЙ ТОЛСТЫЙ · МИСТЕР БОЛЬШОЕ ПУЗО',
      phase2: 'НЕПРОБИВАЕМЫЙ · СЪЕСТ ВСЕХ, КОГО СМОЖЕТ',
      phase3: 'НЕПРОБИВАЕМЫЙ · СЪЕСТ ВСЕХ, КОГО СМОЖЕТ',
      maxHp: BOSS_MAX_HP,
    },
    denis: {
      id: 'denis',
      name: 'ДЕНИС',
      site: 'ШКОЛА №53',
      kicker: 'Школа №53 · большая перемена',
      phase1: 'ШКОЛЬНАЯ ГРОЗА · УЖАС ДНЕВНИКА',
      phase2: 'РАЗБИТЫЕ ОЧКИ · ПАЛЬЦЫ-ПИСТОЛЕТЫ',
      phase3: 'ПОСЛЕДНИЙ ЭТАЖ · БЕТОН И ПТИЦЫ',
      maxHp: DENIS_MAX_HP,
    },
    egor: {
      id: 'egor',
      name: 'ЕГОР',
      site: 'ЛЕС НА КРАЮ ГОРОДКА',
      kicker: 'Лес за деревом · банановая засада',
      phase1: 'БАНАНОВЫЙ СТРЕЛОК · ПАЛЬМА И КОКОСЫ',
      phase2: 'ДЕРЕВО-КАРУСЕЛЬ · ПОГОНЯ ПО ВЕТКАМ',
      phase3: 'ЛЕСНОЙ ПОБЕГ · ВЕТКИ И ФРУКТЫ',
      phase4: 'ФИНАЛЬНОЕ ПОЛЕ · БЫК И СТАЯ',
      maxHp: EGOR_MAX_HP,
    },
    elena: {
      id: 'elena',
      name: 'ЕЛЕНА ГУРЬЕВНА',
      site: 'ШКОЛА №53 · КАБИНЕТ 2-Б',
      kicker: 'Школа №53 · урок, который не закончится',
      phase1: 'УРОК СТРОГОСТИ · ДВОЙКИ И ЛАЗЕРЫ',
      phase2: 'ПЕРЕМЕНА · ЖУРНАЛ, ЗАПАХ И БЫК',
      phase3: 'ПЕРЕМЕНА · ЖУРНАЛ, ЗАПАХ И БЫК',
      maxHp: ELENA_MAX_HP,
    },
    nikita: {
      id: 'nikita',
      name: 'НИКИТА',
      site: 'ШКОЛА №53 · ТЁМНЫЙ КАБИНЕТ',
      kicker: 'Школа №53 · перемена в тёмном коридоре',
      phase1: 'НА ПЛЕЧАХ У СТЕПЫ · ТЕЛЕФОН И КОЛЕСО',
      phase2: 'ВЕЛОСИПЕД · СТЕПА БЬЁТ СВЕРХУ',
      phase3: 'ВЕЛОСИПЕД · СТЕПА БЬЁТ СВЕРХУ',
      maxHp: NIKITA_MAX_HP,
    },
  };

  function difficultyConfig() {
    return DIFFICULTY_CONFIG[game.difficulty] || DIFFICULTY_CONFIG.easy;
  }

  const INK = '#261419';
  const INK_SOFT = '#4a2a25';
  const CREAM = '#f3e3bd';
  const PAPER = '#e8d0a4';
  const RED = '#ad3628';
  const RED_DEEP = '#6d1c27';
  const RUST = '#c95937';
  const TEAL = '#2b625c';
  const GOLD = '#d3a04a';
  const GOLD_BRIGHT = '#f0c877';
  const PLUM = '#76364b';
  const PLUM_DARK = '#5a2538';
  const PLUM_LIGHT = '#8d4559';
  const BROWN = '#4a2d22';
  const WHITE = '#fff8e8';
  const SUIT_BLUE = '#21466f';
  const SUIT_BLUE_LIGHT = '#2f6296';
  const SUIT_BLUE_DARK = '#142c48';
  const SHIRT_MINT = '#b9ded7';
  const SHIRT_MINT_DARK = '#8fbdb5';
  const SKIN = '#e8b38f';
  const SKIN_SHADOW = '#c98b6a';
  const DENIM = '#30364a';
  const DENIM_DARK = '#1d2232';
  const LEOPARD = '#d6a45f';
  const LEOPARD_DARK = '#6b4226';
  const PINK = '#ff7fb2';
  const PINK_BRIGHT = '#ffd0e2';

  const letunovPhoto = new Image();
  letunovPhoto.src = 'letunov.jpg';

  const FONT_DISPLAY = '"Rockwell", "Bookman Old Style", Georgia, "Times New Roman", serif';
  const FONT_BODY = 'Georgia, "Times New Roman", serif';

  // ---------- утилиты ----------
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, speed, dt) => lerp(a, b, 1 - Math.exp(-speed * dt));
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sgn = (v) => (v < 0 ? -1 : 1);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;
  const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
  const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const approach = (v, target, step) =>
    v < target ? Math.min(v + step, target) : Math.max(v - step, target);

  const params = new URLSearchParams(location.search);
  const IS_TOUCH =
    params.has('touch') ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    ('ontouchstart' in window) ||
    navigator.maxTouchPoints > 0;

  if (IS_TOUCH) document.body.classList.add('is-touch');

  // ---------- настройки управления ----------
  const SETTINGS_KEY = 'letunov.settings.v1';
  const DEFAULT_KEYS = {
    left: 'KeyA',
    right: 'KeyD',
    jump: 'Space',
    dash: 'ShiftLeft',
    crouch: 'KeyS',
    shoot: 'KeyX',
    super: 'KeyE',
    aimUp: 'ArrowUp',
    lock: 'KeyC',
  };
  const ACTION_LABELS = {
    left: 'Влево',
    right: 'Вправо',
    jump: 'Прыжок / парирование',
    dash: 'Рывок',
    crouch: 'Присесть',
    shoot: 'Огонь (вручную)',
    super: 'Супер-удар',
    aimUp: 'Прицел вверх',
    lock: 'Замок: стоять и целиться',
  };
  const KEY_LABELS = {
    Space: 'ПРОБЕЛ',
    ShiftLeft: 'SHIFT',
    ShiftRight: 'ПРАВЫЙ SHIFT',
    ControlLeft: 'CTRL',
    ControlRight: 'ПРАВЫЙ CTRL',
    AltLeft: 'ALT',
    AltRight: 'ПРАВЫЙ ALT',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Enter: 'ENTER',
    Backspace: 'BACKSPACE',
    Tab: 'TAB',
    CapsLock: 'CAPS',
    KeyA: 'A',
    KeyB: 'B',
    KeyC: 'C',
    KeyD: 'D',
    KeyE: 'E',
    KeyF: 'F',
    KeyG: 'G',
    KeyH: 'H',
    KeyI: 'I',
    KeyJ: 'J',
    KeyK: 'K',
    KeyL: 'L',
    KeyM: 'M',
    KeyN: 'N',
    KeyO: 'O',
    KeyP: 'P',
    KeyQ: 'Q',
    KeyR: 'R',
    KeyS: 'S',
    KeyT: 'T',
    KeyU: 'U',
    KeyV: 'V',
    KeyW: 'W',
    KeyX: 'X',
    KeyY: 'Y',
    KeyZ: 'Z',
    Digit0: '0',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Digit5: '5',
    Digit6: '6',
    Digit7: '7',
    Digit8: '8',
    Digit9: '9',
  };

  function keyLabel(code) {
    if (!code) return '—';
    if (KEY_LABELS[code]) return KEY_LABELS[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^F\d{1,2}$/.test(code)) return code;
    return code.replace(/^(Numpad|Intl)/, '').toUpperCase();
  }

  const settings = {
    keys: { ...DEFAULT_KEYS },
    autoFire: true,
    touchScale: 1,
    touchOpacity: 0.94,
    touchOffsets: {},
  };

  // ---------- постоянный прогресс: монеты, сердца и баффы ----------
  const PROGRESS_KEY = 'letunov.progress.v1';
  const MAX_BONUS_HEARTS = 1;
  const progress = {
    coins: 0,
    bonusHearts: 0,
    letunovHeart: false,
    heartBought: false,
    smokeDash: false,
    smokeDashOwned: false,
    autoAim: false,
    autoAimOwned: false,
    weapon: 'pistol',
    nutcrackerOwned: false,
    schoolCoin: false,
    nikitaKey: false,
    wins: { letunov: 0, denis: 0, egor: 0, elena: 0, nikita: 0 },
    bossCoins: {
      letunov: { easy: false, hard: false },
      denis: { easy: false, hard: false },
      egor: { easy: false, hard: false },
      elena: { easy: false, hard: false },
      nikita: { easy: false, hard: false },
    },
  };

  function heroMaxHp() {
    return HERO_MAX_HP + progress.bonusHearts * 5;
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      if (Number.isFinite(data.coins)) progress.coins = Math.max(0, Math.floor(data.coins));
      const legacyHeart = !!data.heartBought || (Number.isFinite(data.bonusHearts) && data.bonusHearts > 0);
      progress.letunovHeart = !!data.letunovHeart || legacyHeart;
      progress.bonusHearts = progress.letunovHeart ? 1 : 0;
      progress.heartBought = progress.letunovHeart;
      progress.smokeDashOwned = !!data.smokeDashOwned || !!data.smokeDash;
      progress.smokeDash = progress.smokeDashOwned && !!data.smokeDash;
      progress.autoAimOwned = !!data.autoAimOwned || !!data.autoAim;
      progress.nutcrackerOwned = !!data.nutcrackerOwned;
      const legacyWeapon = progress.nutcrackerOwned && data.weapon === 'nutcracker';
      progress.weapon = legacyWeapon ? 'nutcracker' : 'pistol';
      progress.autoAim = progress.autoAimOwned && !!data.autoAim && !legacyWeapon;
      progress.schoolCoin = !!data.schoolCoin;
      progress.nikitaKey = !!data.nikitaKey;
      if (data.wins && typeof data.wins === 'object') {
        progress.wins.letunov = Math.max(0, Math.floor(data.wins.letunov || 0));
        progress.wins.denis = Math.max(0, Math.floor(data.wins.denis || 0));
        progress.wins.egor = Math.max(0, Math.floor(data.wins.egor || 0));
        progress.wins.elena = Math.max(0, Math.floor(data.wins.elena || 0));
        progress.wins.nikita = Math.max(0, Math.floor(data.wins.nikita || 0));
      }
      if (data.bossCoins && typeof data.bossCoins === 'object') {
        for (const id of Object.keys(progress.bossCoins)) {
          const rec = data.bossCoins[id];
          if (!rec || typeof rec !== 'object') continue;
          progress.bossCoins[id].easy = !!rec.easy;
          progress.bossCoins[id].hard = !!rec.hard;
        }
      }
    } catch (err) {
      /* ignore */
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (err) {
      /* ignore */
    }
  }

  function equippedAttackMod() {
    if (progress.weapon === 'nutcracker' && progress.nutcrackerOwned) return 'nutcracker';
    if (progress.autoAim && progress.autoAimOwned) return 'autoaim';
    return 'pistol';
  }

  function equipAttackMod(mod) {
    progress.weapon = mod === 'nutcracker' && progress.nutcrackerOwned ? 'nutcracker' : 'pistol';
    progress.autoAim = mod === 'autoaim' && progress.autoAimOwned;
    saveProgress();
    updateMetaUI();
  }

  function attackModLabel(mod) {
    if (mod === 'nutcracker') return 'Щелкунчик';
    if (mod === 'autoaim') return 'Автонаводка';
    return 'Пистолет';
  }

  function updateMetaUI() {
    const menuProgress = document.getElementById('menuProgress');
    if (menuProgress) {
      const hearts = BASE_HEARTS + progress.bonusHearts;
      menuProgress.textContent =
        `Монеты: ${progress.coins} · Сердец: ${hearts}` +
        ` · Атака: ${attackModLabel(equippedAttackMod())}` +
        (progress.smokeDash ? ' · Дымовая завеса: экипирована' : '');
    }
    const shopCoins = document.getElementById('shopCoins');
    if (shopCoins) shopCoins.textContent = String(progress.coins);
    const shopStatus = document.getElementById('shopStatus');
    if (shopStatus) {
      const smokeState = progress.smokeDash
        ? 'экипирована'
        : progress.smokeDashOwned
          ? 'куплена'
          : 'нет';
      const aimState = progress.autoAim
        ? 'экипирована'
        : progress.autoAimOwned
          ? 'куплена'
          : 'нет';
      shopStatus.textContent =
        `Сердец: ${BASE_HEARTS + progress.bonusHearts} · Дымовая завеса: ${smokeState}` +
        ` · Автонаводка: ${aimState}` +
        ` · Атака: ${attackModLabel(equippedAttackMod())}` +
        ` · Побед: ${Object.values(progress.wins).reduce((sum, n) => sum + (n || 0), 0)}`;
    }
    updateInventoryUI();
  }

  function slotMarkup(id, title, sub, owned, color, stateText) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('is-owned', !!owned);
    el.style.setProperty('--slot-color', color);
    const state = el.querySelector('.inventory-slot-state');
    if (state) state.textContent = stateText || (owned ? 'ЭКИПИРОВАНО' : 'СЛОТ ПУСТ');
    const name = el.querySelector('.inventory-slot-name');
    if (name) name.textContent = title;
    const desc = el.querySelector('.inventory-slot-sub');
    if (desc) desc.textContent = sub;
  }

  function updateInventoryUI() {
    const attackMod = equippedAttackMod();
    const attackTitle =
      attackMod === 'nutcracker' ? 'ЩЕЛКУНЧИК' : attackMod === 'autoaim' ? 'АВТОНАВОДКА' : 'ПИСТОЛЕТ';
    const attackSub =
      attackMod === 'nutcracker'
        ? 'Красный снаряд, через 2 м — полунаводка · нажми, чтобы сменить'
        : attackMod === 'autoaim'
          ? 'Снаряды сами летят в босса, урон /1.3 · нажми, чтобы сменить'
          : progress.nutcrackerOwned || progress.autoAimOwned
            ? 'Базовое оружие · нажми, чтобы выбрать купленный модификатор'
            : 'Базовое оружие · модификаторы продаются в магазине';
    slotMarkup(
      'invWeapon',
      attackTitle,
      attackSub,
      true,
      attackMod === 'nutcracker' ? '#a83232' : attackMod === 'autoaim' ? '#b4477a' : '#6d63a9'
    );
    slotMarkup(
      'invBuff',
      progress.letunovHeart ? 'СЕРДЦЕ ЛЕТУНОВА' : 'НЕТ БАФФА',
      progress.letunovHeart ? '+1 сердце навсегда' : 'Победи Летунова — сердце выпадет',
      progress.letunovHeart,
      '#b64038'
    );
    slotMarkup(
      'invPerk',
      progress.smokeDashOwned ? 'ДЫМОВАЯ ЗАВЕСА' : 'НЕТ ПЕРКА',
      progress.smokeDash
        ? 'Исчезновение и неуязвимость в рывке · нажми, чтобы снять'
        : progress.smokeDashOwned
          ? 'Куплена · нажми, чтобы экипировать'
          : 'Купи перк в магазине',
      progress.smokeDashOwned,
      '#2b7a6e',
      progress.smokeDash ? 'ЭКИПИРОВАНО' : progress.smokeDashOwned ? 'КУПЛЕНО · НАЖМИ' : null
    );
  }

  loadProgress();

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        if (data.keys && typeof data.keys === 'object') {
          for (const action of Object.keys(DEFAULT_KEYS)) {
            if (typeof data.keys[action] === 'string') settings.keys[action] = data.keys[action];
          }
        }
        if (typeof data.autoFire === 'boolean') settings.autoFire = data.autoFire;
        if (Number.isFinite(data.touchScale)) settings.touchScale = clamp(data.touchScale, 0.7, 1.35);
        if (Number.isFinite(data.touchOpacity)) settings.touchOpacity = clamp(data.touchOpacity, 0.35, 1);
        if (data.touchOffsets && typeof data.touchOffsets === 'object') {
          for (const [action, off] of Object.entries(data.touchOffsets)) {
            if (off && Number.isFinite(off.x) && Number.isFinite(off.y)) {
              settings.touchOffsets[action] = { x: off.x, y: off.y };
            }
          }
        }
      }
    } catch (err) {
      /* localStorage может быть недоступен при открытии файла напрямую */
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      /* ignore */
    }
  }

  function actionForCode(code) {
    for (const action of Object.keys(settings.keys)) {
      if (settings.keys[action] === code) return action;
    }
    return null;
  }

  function updateControlHints() {
    document.querySelectorAll('kbd[data-bind]').forEach((el) => {
      const code = settings.keys[el.dataset.bind];
      el.textContent = keyLabel(code);
    });
    const shootKey = document.getElementById('touchShootKey');
    const shootHint = document.getElementById('touchShootHint');
    if (shootKey) shootKey.textContent = settings.autoFire ? '∞' : '✦';
    if (shootHint) shootHint.textContent = settings.autoFire ? 'стрельба — сама' : 'огонь вручную';
  }

  function applyTouchSettings() {
    document.documentElement.style.setProperty('--touch-scale', String(settings.touchScale));
    document.documentElement.style.setProperty('--touch-opacity', String(settings.touchOpacity));
    document.body.classList.toggle('auto-fire', settings.autoFire);
    document.querySelectorAll('[data-action]').forEach((btn) => {
      const action = btn.dataset.action;
      const off = settings.touchOffsets[action];
      btn.style.translate = off ? `${off.x}vw ${off.y}vh` : '';
    });
    updateControlHints();
  }

  loadSettings();
  applyTouchSettings();


  // ---------- холст и масштабирование ----------
  let viewScale = 1;
  let viewOX = 0;
  let viewOY = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(1, Math.round(rect.width * dpr));
    const ch = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    viewScale = Math.min(cw / W, ch / H);
    viewOX = (cw - W * viewScale) / 2;
    viewOY = (ch - H * viewScale) / 2;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));

  // ---------- звук ----------
  const Sound = (() => {
    let ac = null;
    let master = null;
    let musicBus = null;
    let noiseBuf = null;
    let muted = false;
    let musicPlaying = false;
    let musicNext = 0;
    let musicStep = 0;
    let bpm = 128;

    function init() {
      if (ac) {
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        ac = new AC();
        master = ac.createGain();
        master.gain.value = muted ? 0 : 0.7;
        master.connect(ac.destination);
        musicBus = ac.createGain();
        musicBus.gain.value = 0.16;
        musicBus.connect(master);
        noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 1.2), ac.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        musicNext = ac.currentTime + 0.1;
      } catch (err) {
        ac = null;
      }
    }

    function tone(freq, dur, opts = {}) {
      if (!ac || muted) return;
      const {
        type = 'sine',
        vol = 0.1,
        freqEnd = null,
        delay = 0,
        attack = 0.006,
        dest = master,
      } = opts;
      const t0 = ac.currentTime + delay;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t0);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
      }
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t0);
      osc.stop(t0 + dur + 0.04);
    }

    function noise(dur, opts = {}) {
      if (!ac || muted || !noiseBuf) return;
      const {
        vol = 0.1,
        freq = 900,
        freqEnd = null,
        q = 0.8,
        type = 'bandpass',
        delay = 0,
      } = opts;
      const t0 = ac.currentTime + delay;
      const src = ac.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = type;
      filter.Q.value = q;
      filter.frequency.setValueAtTime(freq, t0);
      if (freqEnd) filter.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t0 + dur);
      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(t0);
      src.stop(t0 + dur + 0.03);
    }

    function sfx(name) {
      init();
      if (!ac || muted) return;
      switch (name) {
        case 'shoot':
          tone(rand(880, 990), 0.065, { type: 'square', vol: 0.032, freqEnd: 480 });
          noise(0.03, { vol: 0.018, freq: 2600, type: 'highpass' });
          break;
        case 'jump':
          tone(300, 0.16, { type: 'triangle', vol: 0.075, freqEnd: 700 });
          break;
        case 'dash':
          noise(0.2, { vol: 0.13, freq: 500, freqEnd: 2800, q: 0.7 });
          tone(190, 0.16, { type: 'sine', vol: 0.055, freqEnd: 60 });
          break;
        case 'land':
          noise(0.09, { vol: 0.035, freq: 500, type: 'lowpass' });
          break;
        case 'bosshit':
          tone(rand(140, 190), 0.07, { type: 'square', vol: 0.03, freqEnd: 80 });
          noise(0.045, { vol: 0.03, freq: 1800, type: 'highpass' });
          break;
        case 'hurt':
          tone(360, 0.34, { type: 'sawtooth', vol: 0.15, freqEnd: 70 });
          noise(0.3, { vol: 0.12, freq: 900, freqEnd: 120, type: 'lowpass' });
          break;
        case 'telegraph':
          tone(76, 0.48, { type: 'triangle', vol: 0.05, freqEnd: 58 });
          noise(0.42, { vol: 0.025, freq: 260, type: 'lowpass' });
          break;
        case 'punch':
          noise(0.24, { vol: 0.14, freq: 500, freqEnd: 2200, q: 0.6 });
          tone(170, 0.17, { type: 'sine', vol: 0.05, freqEnd: 70 });
          break;
        case 'slam':
          tone(150, 0.55, { type: 'sine', vol: 0.32, freqEnd: 32 });
          noise(0.42, { vol: 0.22, freq: 900, freqEnd: 70, type: 'lowpass' });
          break;
        case 'roar':
          tone(92, 0.9, { type: 'sawtooth', vol: 0.15, freqEnd: 52 });
          tone(126, 0.75, { type: 'square', vol: 0.045, freqEnd: 58 });
          noise(0.7, { vol: 0.1, freq: 500, freqEnd: 120, type: 'lowpass' });
          break;
        case 'laser':
          tone(1320, 0.34, { type: 'sawtooth', vol: 0.045, freqEnd: 340 });
          tone(660, 0.3, { type: 'square', vol: 0.028, freqEnd: 190 });
          noise(0.28, { vol: 0.04, freq: 3600, freqEnd: 900, type: 'bandpass', q: 2.4 });
          break;
        case 'bell':
          tone(880, 1.25, { type: 'sine', vol: 0.1 });
          tone(1320, 0.9, { type: 'triangle', vol: 0.045 });
          break;
        case 'click':
          tone(520, 0.05, { type: 'square', vol: 0.035, freqEnd: 480 });
          break;
        case 'parry':
          [720, 960, 1280].forEach((f, i) =>
            tone(f, 0.18, { type: 'triangle', vol: 0.07, delay: i * 0.055 })
          );
          noise(0.12, { vol: 0.04, freq: 3200, type: 'highpass' });
          break;
        case 'card':
          tone(880, 0.12, { type: 'square', vol: 0.04, freqEnd: 1320 });
          tone(1320, 0.18, { type: 'triangle', vol: 0.04, delay: 0.06 });
          break;
        case 'super':
          tone(120, 0.7, { type: 'sawtooth', vol: 0.14, freqEnd: 42 });
          noise(0.55, { vol: 0.18, freq: 600, freqEnd: 2600, q: 0.8 });
          [523, 784, 1046, 1568].forEach((f, i) =>
            tone(f, 0.32, { type: 'triangle', vol: 0.06, delay: i * 0.08 })
          );
          break;
        case 'belly':
          tone(110, 0.55, { type: 'sine', vol: 0.16, freqEnd: 48 });
          noise(0.5, { vol: 0.09, freq: 380, freqEnd: 120, type: 'lowpass' });
          break;
        case 'chair':
          noise(0.16, { vol: 0.04, freq: 1200, type: 'bandpass', q: 1.6 });
          tone(190, 0.1, { type: 'square', vol: 0.025, freqEnd: 120 });
          break;
        case 'platform':
          tone(210, 0.22, { type: 'triangle', vol: 0.05, freqEnd: 90 });
          noise(0.15, { vol: 0.04, freq: 700, type: 'lowpass' });
          break;
        case 'stand':
          tone(86, 0.75, { type: 'sawtooth', vol: 0.12, freqEnd: 44 });
          noise(0.6, { vol: 0.1, freq: 420, freqEnd: 90, type: 'lowpass' });
          break;
        case 'win':
          [523, 659, 784, 1046].forEach((f, i) =>
            tone(f, 0.24, { type: 'triangle', vol: 0.085, delay: i * 0.12 })
          );
          tone(1568, 0.5, { type: 'sine', vol: 0.05, delay: 0.48 });
          break;
        case 'lose':
          [392, 330, 262, 196].forEach((f, i) =>
            tone(f, 0.32, { type: 'triangle', vol: 0.09, delay: i * 0.16 })
          );
          tone(98, 0.7, { type: 'sawtooth', vol: 0.05, delay: 0.62 });
          break;
        default:
          break;
      }
    }

    function startMusic() {
      init();
      if (!ac) return;
      musicPlaying = true;
      musicStep = 0;
      bpm = 130;
      musicNext = ac.currentTime + 0.12;
    }

    function stopMusic() {
      musicPlaying = false;
    }

    function setIntensity(level) {
      bpm = level >= 2 ? 146 : 128;
    }

    function playBass(freq, when) {
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.105, when + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.24);
      osc.connect(gain);
      gain.connect(musicBus);
      osc.start(when);
      osc.stop(when + 0.27);
    }

    function playShaker(when, volume) {
      if (!ac || !noiseBuf) return;
      const src = ac.createBufferSource();
      src.buffer = noiseBuf;
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(volume, when + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(musicBus);
      src.start(when);
      src.stop(when + 0.08);
    }

    const bassLine = [73.42, 0, 55, 0, 87.31, 0, 65.41, 0, 73.42, 0, 55, 0, 98, 0, 65.41, 82.41];

    function tick() {
      if (!ac || muted || !musicPlaying) return;
      if (musicNext < ac.currentTime - 0.4) musicNext = ac.currentTime + 0.06;
      const eighth = 60 / bpm / 2;
      let guard = 0;
      while (musicNext < ac.currentTime + 0.22 && guard++ < 12) {
        const step = musicStep % 32;
        if (step % 4 === 0) {
          const note = bassLine[(step / 4) % bassLine.length];
          if (note) playBass(note, musicNext);
        }
        if (step % 2 === 1) playShaker(musicNext, step % 8 === 3 ? 0.022 : 0.012);
        if (step % 8 === 4) playShaker(musicNext, 0.035);
        musicStep++;
        musicNext += eighth;
      }
    }

    function setMuted(value) {
      muted = value;
      if (master && ac) {
        master.gain.setTargetAtTime(muted ? 0 : 0.7, ac.currentTime, 0.02);
      }
      document.body.classList.toggle('is-muted', muted);
      const btn = document.getElementById('muteButton');
      if (btn) {
        btn.setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
        btn.title = muted ? 'Звук выключен (M)' : 'Звук включён (M)';
      }
    }

    function toggleMute() {
      init();
      setMuted(!muted);
      if (!muted) sfx('click');
    }

    return { init, sfx, startMusic, stopMusic, setIntensity, tick, toggleMute, setMuted };
  })();

  // ---------- ввод ----------
  const held = {
    left: false,
    right: false,
    jump: false,
    dash: false,
    crouch: false,
    shoot: false,
    super: false,
    aimUp: false,
    lock: false,
  };
  const pressed = { jump: false, dash: false, shoot: false, super: false, lock: false };
  const sources = {
    left: new Set(),
    right: new Set(),
    jump: new Set(),
    dash: new Set(),
    crouch: new Set(),
    shoot: new Set(),
    super: new Set(),
    aimUp: new Set(),
    lock: new Set(),
  };
  const touchAim = { x: 0, y: 0, active: false };
  const pointerActions = new Map();

  function setAction(action, source, down) {
    if (!(action in held)) return;
    const set = sources[action];
    if (down) {
      if (set.size === 0) {
        held[action] = true;
        if (action in pressed) pressed[action] = true;
      }
      set.add(source);
    } else {
      set.delete(source);
      if (set.size === 0) held[action] = false;
    }
  }

  function clearPressed() {
    pressed.jump = false;
    pressed.dash = false;
    pressed.shoot = false;
    pressed.super = false;
    pressed.lock = false;
  }

  function releaseAll() {
    Object.keys(sources).forEach((action) => {
      sources[action].clear();
      held[action] = false;
    });
    pointerActions.forEach((rec) => rec.btn.classList.remove('is-down'));
    pointerActions.clear();
    if (typeof releaseJoystick === 'function') releaseJoystick();
    clearPressed();
  }

  window.addEventListener('keydown', (e) => {
    if (captureKeyEvent(e)) {
      e.preventDefault();
      return;
    }
    if (document.body.classList.contains('is-editing-touch')) {
      if (e.code === 'Escape') {
        e.preventDefault();
        finishTouchEdit();
      }
      return;
    }
    if (document.body.classList.contains('settings-open')) {
      if (e.code === 'Escape') {
        e.preventDefault();
        closeSettings();
      }
      return;
    }
    if (game.scene === 'map') {
      if (game.shopOpen) {
        if (e.code === 'Escape') {
          e.preventDefault();
          closeShop();
        }
        return;
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        goMenu();
        return;
      }
      if (e.code === 'Enter') {
        e.preventDefault();
        tryEnterNearby();
        return;
      }
    }
    if (game.scene === 'school') {
      if (pendingBossId) {
        if (e.code === 'Escape') {
          e.preventDefault();
          closeDifficulty();
        }
        return;
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        goMap();
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        schoolInteract();
        return;
      }
    }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      togglePause();
      return;
    }
    if (e.code === 'KeyM') {
      e.preventDefault();
      Sound.toggleMute();
      return;
    }
    if (e.code === 'Enter') {
      if (game.scene === 'menu') goMap();
      else if (game.scene === 'win' || game.scene === 'lose') goMap();
      else if (game.paused) togglePause(false);
      return;
    }
    const action = actionForCode(e.code);
    if (!action) return;
    e.preventDefault();
    Sound.init();
    setAction(action, 'k' + e.code, true);
  });

  window.addEventListener('keyup', (e) => {
    const action = actionForCode(e.code);
    if (!action) return;
    setAction(action, 'k' + e.code, false);
  });

  window.addEventListener('blur', () => {
    releaseAll();
    if (game.scene === 'fight' && !game.paused) togglePause(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.scene === 'fight' && !game.paused) togglePause(true);
  });

  document.addEventListener('contextmenu', (e) => e.preventDefault());

  document.addEventListener(
    'touchmove',
    (e) => {
      if (!e.target.closest('.panel')) e.preventDefault();
    },
    { passive: false }
  );

  // мобильные кнопки
  let touchDrag = null;

  window.addEventListener('pointermove', (e) => {
    if (!touchDrag || e.pointerId !== touchDrag.id) return;
    e.preventDefault();
    const dx = ((e.clientX - touchDrag.startX) / Math.max(1, window.innerWidth)) * 100;
    const dy = ((e.clientY - touchDrag.startY) / Math.max(1, window.innerHeight)) * 100;
    const x = clamp(touchDrag.baseX + dx, -38, 38);
    const y = clamp(touchDrag.baseY + dy, -34, 34);
    settings.touchOffsets[touchDrag.action] = { x, y };
    touchDrag.btn.style.translate = `${x}vw ${y}vh`;
  });

  const endTouchDrag = (e) => {
    if (!touchDrag || (e && e.pointerId !== touchDrag.id)) return;
    touchDrag.btn.classList.remove('is-dragging');
    saveSettings();
    touchDrag = null;
  };

  window.addEventListener('pointerup', endTouchDrag);
  window.addEventListener('pointercancel', endTouchDrag);

  document.querySelectorAll('[data-action]').forEach((btn) => {
    const action = btn.dataset.action;

    const endPress = (e) => {
      releasePointerAction(e.pointerId);
    };

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (document.body.classList.contains('is-editing-touch')) {
        Sound.sfx('click');
        const off = settings.touchOffsets[action] || { x: 0, y: 0 };
        touchDrag = {
          id: e.pointerId,
          btn,
          action,
          startX: e.clientX,
          startY: e.clientY,
          baseX: off.x,
          baseY: off.y,
        };
        btn.classList.add('is-dragging');
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (err) {
          /* ignore */
        }
        return;
      }
      Sound.init();
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      pointerActions.set(e.pointerId, { action, btn });
      setAction(action, 'p' + e.pointerId, true);
      btn.classList.add('is-down');
    });

    btn.addEventListener('pointerup', endPress);
    btn.addEventListener('pointercancel', endPress);
    btn.addEventListener('lostpointercapture', endPress);
  });

  // Страховка от «залипших» кнопок: отпускание пальца где угодно
  // снимает действие, даже если кнопка успела спрятаться при смене сцены.
  function releasePointerAction(pointerId) {
    const rec = pointerActions.get(pointerId);
    if (!rec) return;
    setAction(rec.action, 'p' + pointerId, false);
    rec.btn.classList.remove('is-down');
    pointerActions.delete(pointerId);
  }
  window.addEventListener('pointerup', (e) => releasePointerAction(e.pointerId));
  window.addEventListener('pointercancel', (e) => releasePointerAction(e.pointerId));

  // Аналоговый джойстик: ходьба в приоритете, а направление стика задаёт
  // прицел по всем 360°: вверх, вниз и по диагоналям.
  const joystickEl = document.getElementById('joystick');
  const joystickKnob = document.getElementById('joystickKnob');
  let joystickPointer = null;

  function releaseJoystick() {
    joystickPointer = null;
    touchAim.x = 0;
    touchAim.y = 0;
    touchAim.active = false;
    if (joystickKnob) joystickKnob.style.transform = '';
    if (joystickEl) joystickEl.classList.remove('is-active');
    for (const action of ['left', 'right', 'crouch', 'aimUp']) setAction(action, 'joy', false);
  }

  function applyJoystick() {
    if (!touchAim.active) {
      releaseJoystick();
      return;
    }
    const x = touchAim.x;
    const y = touchAim.y;
    const mag = Math.hypot(x, y);
    if (mag < 0.16) {
      for (const action of ['left', 'right', 'crouch', 'aimUp']) setAction(action, 'joy', false);
      return;
    }
    // Горизонталь всегда ходит — даже когда стик задран вверх или вниз.
    setAction('left', 'joy', x < -0.2);
    setAction('right', 'joy', x > 0.2);
    // Присед только при почти вертикальном движении вниз.
    setAction('crouch', 'joy', y > 0.62 && Math.abs(x) < 0.32);
    // Прицел берётся напрямую из touchAim в updateHero.
    setAction('aimUp', 'joy', false);
  }

  function moveJoystick(e) {
    if (!joystickEl || joystickPointer === null || e.pointerId !== joystickPointer) return;
    e.preventDefault();
    const rect = joystickEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.max(24, Math.min(rect.width, rect.height) * 0.34);
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > radius) {
      dx = (dx / len) * radius;
      dy = (dy / len) * radius;
    }
    touchAim.x = dx / radius;
    touchAim.y = dy / radius;
    touchAim.active = true;
    if (joystickKnob) joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    applyJoystick();
  }

  if (joystickEl) {
    joystickEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (document.body.classList.contains('is-editing-touch')) return;
      Sound.init();
      joystickPointer = e.pointerId;
      joystickEl.classList.add('is-active');
      try {
        joystickEl.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      moveJoystick(e);
    });
    joystickEl.addEventListener('pointermove', moveJoystick);
    joystickEl.addEventListener('pointerup', (e) => {
      if (e.pointerId !== joystickPointer) return;
      e.preventDefault();
      releaseJoystick();
    });
    joystickEl.addEventListener('pointercancel', releaseJoystick);
    joystickEl.addEventListener('lostpointercapture', releaseJoystick);
  }
  window.addEventListener('pointerup', (e) => {
    if (e.pointerId === joystickPointer) releaseJoystick();
  });
  window.addEventListener('pointercancel', (e) => {
    if (e.pointerId === joystickPointer) releaseJoystick();
  });

  // ---------- состояние игры ----------
  const game = {
    scene: 'menu',
    bossId: 'letunov',
    difficulty: 'easy',
    paused: false,
    ended: false,
    introT: 0,
    fightTime: 0,
    hitsTaken: 0,
    time: 0,
    hitStop: 0,
    shake: 0,
    flash: 0,
    flashColor: '#fff3d2',
    endTimer: 0,
    endingWin: false,
    grainSeed: 1,
    lastBell: false,
    coinEarned: false,
    shopOpen: false,
    schoolFloor: 1,
    schoolParkour: false,
    parkourHazardT: 0,
    roofHintT: 0,
    egorChase: false,
    egorField: false,
    egorClouds: false,
    egorCloudFinale: false,
    elenaArea: 'classroom',
    elenaEscape: false,
    elenaExitHint: 0,
  };

  const hero = {
    x: 280,
    y: GROUND,
    vx: 0,
    vy: 0,
    onGround: true,
    face: 1,
    lastMove: 1,
    hp: HERO_MAX_HP,
    maxHp: HERO_MAX_HP,
    jumpBuf: 0,
    coyote: 0,
    dashT: 0,
    dashCd: 0,
    dashDir: 1,
    airDashUsed: false,
    invuln: 0,
    hurtT: 0,
    shootCd: 0,
    shootAnim: 0,
    runT: 0,
    landT: 0,
    idleT: 0,
    ghostT: 0,
    crouchK: 0,
    dropT: 0,
    parryCd: 0,
    parryT: 0,
    cards: 0,
    cardCharge: 0,
    superCd: 0,
    superT: 0,
    smokeT: 0,
    smokeDashActive: false,
    dead: false,
    deadT: 0,
    deadSide: 1,
    aimX: 1,
    aimY: 0,
  };

  const boss = {
    x: 950,
    y: GROUND,
    hp: BOSS_MAX_HP,
    maxHp: BOSS_MAX_HP,
    hpShown: BOSS_MAX_HP,
    phase: 1,
    state: 'idle',
    timer: 0,
    face: -1,
    airY: 0,
    jumpFromX: 950,
    jumpToX: 950,
    jumpDur: 0.8,
    jumpHeight: 260,
    markX: 950,
    slamLeft: 0,
    punchLeft: 0,
    fist: { dist: 0, prevDist: 0, active: false },
    hitFlash: 0,
    breathe: 0,
    blink: 2,
    lastAttack: null,
    attackCount: 0,
    pendingRage: false,
    enraged: false,
    hatOn: true,
    dying: false,
    deathT: 0,
    exploded: false,
    steamT: 0,
    inChair: true,
    chairTarget: 950,
    wheelT: 0,
    chairPropX: 1120,
    chairPropA: 0,
    bellyExtend: 0,
    hopLeft: 0,
    standK: 0,
    parryTimer: 4.5,
    cannonK: 0,
    cannonFlash: 0,
    cannonShotT: 0,
    fallBulletDelay: 0,
    fallBulletCount: 0,
    fallBulletT: 0,
    platformTimer: 6,
    rageShown: false,
    parryTipShown: false,
    glassesBroken: false,
    buttonsOut: 0,
    buttonsReturnT: 0,
    flowerCount: 0,
    springCount: 0,
    birdCount: 0,
    parkourSpawned: false,
    thirdFloor: false,
    pendingPhase3: false,
    egorRunT: 0,
    egorAttackT: 2.2,
    egorPattern: 0,
    egorTopY: 250,
    egorLog: null,
    egorCloudLift: null,
    egorCloudShotT: 0,
    egorCloudShotIndex: 0,
    egorCloudTargets: null,
    egorArmSide: 1,
    egorArmP: 0,
    egorArmHit: false,
    egorFinale: false,
    egorBullT: 4.5,
    egorBirdsT: 5.5,
    egorRainT: 7,
    egorScreamT: 6,
    egorBranchT: 5.5,
    egorFruitT: 3.5,
    egorShake: 0,
    laser: {
      active: false,
      mirrorX: ARENA_L + 18,
      mirrorY: GROUND - 120,
      startY: GROUND - 120,
      targetY: GROUND - 120,
      pattern: 0,
      pulse: 0,
    },
  };

  const bullets = [];
  const waves = [];
  const soundWaves = [];
  const windCharges = [];
  const bossShots = [];
  const particles = [];
  const ghosts = [];
  const craters = [];
  const motes = [];
  const platforms = [];
  const parryOrbs = [];
  const denisBirds = [];
  const turrets = [];

  const MAP_BUILDINGS = [
    {
      id: 'letunov',
      kind: 'circus',
      x: 250,
      doorX: 250,
      name: 'ЦИРК',
      sub: 'ЛЕТУНОВ',
      color: '#a8382c',
    },
    {
      id: 'denis',
      kind: 'school',
      x: 640,
      doorX: 640,
      name: 'ШКОЛА №53',
      sub: 'ДЕНИС',
      color: '#2c625b',
    },
    {
      id: 'shop',
      kind: 'shop',
      x: 950,
      doorX: 950,
      name: 'МАГАЗИН',
      sub: 'БАФФЫ',
      color: '#b67a32',
    },
    {
      id: 'egor',
      kind: 'forest',
      x: 1186,
      doorX: 1180,
      name: 'ЛЕС',
      sub: 'ЕГОР',
      color: '#3f6b3e',
    },
  ];

  const mapState = {
    near: null,
    toast: '',
    toastT: 0,
    t: 0,
  };

  const schoolState = {
    near: null,
    toast: '',
    toastT: 0,
    t: 0,
  };

  function resetHero() {
    Object.assign(hero, {
      x: 280,
      y: GROUND,
      vx: 0,
      vy: 0,
      onGround: true,
      face: 1,
      lastMove: 1,
      hp: heroMaxHp(),
      maxHp: heroMaxHp(),
      jumpBuf: 0,
      coyote: 0,
      dashT: 0,
      dashCd: 0,
      dashDir: 1,
      airDashUsed: false,
      invuln: 0,
      hurtT: 0,
      shootCd: 0,
      shootAnim: 0,
      runT: 0,
      landT: 0,
      idleT: 0,
      ghostT: 0,
      crouchK: 0,
      dropT: 0,
      parryCd: 0,
      parryT: 0,
      cards: 0,
      cardCharge: 0,
      superCd: 0,
      superT: 0,
      smokeT: 0,
      smokeDashActive: false,
      dead: false,
      deadT: 0,
      deadSide: 1,
    });
  }

  function resetBoss() {
    const cfg = BOSS_CONFIG[game.bossId] || BOSS_CONFIG.letunov;
    const isLetunov = cfg.id === 'letunov';
    const isElena = cfg.id === 'elena';
    const isNikita = cfg.id === 'nikita';
    const isStepa = cfg.id === 'stepa';
    const maxHp = Math.round(cfg.maxHp * difficultyConfig().hp);
    Object.assign(boss, {
      x: isLetunov ? 950 : isElena ? 1040 : isNikita ? 930 : isStepa ? 1010 : 1108,
      y: GROUND,
      hp: maxHp,
      maxHp,
      hpShown: maxHp,
      phase: 1,
      state: 'idle',
      timer: 0,
      face: -1,
      airY: 0,
      jumpFromX: 950,
      jumpToX: 950,
      jumpDur: 0.8,
      jumpHeight: 260,
      markX: 950,
      slamLeft: 0,
      punchLeft: 0,
      fist: { dist: 0, prevDist: 0, active: false },
      hitFlash: 0,
      breathe: 0,
      blink: 2,
      lastAttack: null,
      attackCount: 0,
      pendingRage: false,
      enraged: false,
      hatOn: isLetunov,
      dying: false,
      deathT: 0,
      exploded: false,
      steamT: 0,
      inChair: isLetunov,
      chairTarget: 950,
      wheelT: 0,
      chairPropX: 1120,
      chairPropA: 0,
      bellyExtend: 0,
      hopLeft: 0,
      standK: isLetunov ? 0 : 1,
      parryTimer: 4.5,
      cannonK: 0,
      cannonFlash: 0,
      cannonShotT: 0,
      fallBulletDelay: 0,
      fallBulletCount: 0,
      fallBulletT: 0,
      platformTimer: 6,
      rageShown: false,
      parryTipShown: false,
      chalkCount: 0,
      chalkShot: 0,
      screamCount: 0,
      screamWaveT: 0,
      glassesBroken: false,
      buttonsOut: 0,
      buttonsReturnT: 0,
      flowerCount: 0,
      petalTrapT: 1.4,
      springCount: 0,
      birdCount: 0,
      parkourSpawned: false,
      thirdFloor: false,
      denisClimb: false,
      climbHintShown: false,
      pendingPhase3: false,
      egorBurstType: '',
      egorBurstLeft: 0,
      egorBurstT: 0,
      egorRunT: 0,
      egorAttackT: 2.2,
      egorPattern: 0,
      egorTopY: 250,
      egorLog: null,
      egorCloudLift: null,
      egorCloudShotT: 0,
      egorCloudShotIndex: 0,
      egorCloudTargets: null,
      egorArmSide: 1,
      egorArmP: 0,
      egorArmHit: false,
      egorFinale: false,
      egorBullT: 4.5,
      egorBirdsT: 5.5,
      egorRainT: 7,
      egorScreamT: 6,
      egorBranchT: 5.5,
      egorFruitT: 3.5,
      egorShake: 0,
      laser: {
        active: false,
        mirrorX: ARENA_L + 18,
        mirrorY: GROUND - 120,
        startY: GROUND - 120,
        targetY: GROUND - 120,
        pattern: 0,
        pulse: 0,
      },
      elenaPattern: 0,
      elenaAttackT: 1.4,
      elenaLaserOn: false,
      elenaLaserTargets: [],
      elenaPunchDist: 0,
      elenaPunchPrev: 0,
      elenaBreathT: 0,
      elenaStinkT: 0,
      elenaBookT: 0,
      elenaFootUp: 0,
      elenaChaseSpeed: 0,
      egorPalmSide: 1,
      // Никита и Степа: у каждого свои тайминги, чтобы не пересекаться
      // с атаками старых боссов.
      nkState: 'nkIntro',
      nkAttackT: 1.6,
      nkPattern: 0,
      nkTransition: false,
      nkPunchP: 0,
      nkPunchActive: false,
      nkRideDir: 1,
      nkRideSpeed: 310,
      nkRideT: 0,
      nkBgPunchT: 2.2,
      nkBgPunchX: W / 2,
      nkBgPunchP: 0,
      nkBgFistActive: false,
      nkWheelFlyT: 0,
      nkFallT: 0,
      nkDeathFlee: 0,
      stState: 'idle',
      stAttackT: 1.7,
      stPattern: 0,
      stPunchP: 0,
      stPunchActive: false,
      stTransition: false,
      stPlatT: 0,
      stHazardT: 0,
      stBoltT: 0,
      stBoltX: 0,
      stBoltY: 0,
      stBoltOn: false,
      stVehicleT: 0,
      stScrollT: 0,
      stScrollDist: 0,
      stScrollSpeed: 190,
      stExit: false,
      stCrashT: 0,
      stRideStartT: 0,
      stHairSpark: 0,
    });
  }

  function resetWorld() {
    resetHero();
    resetBoss();
    bullets.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    windCharges.length = 0;
    bossShots.length = 0;
    particles.length = 0;
    ghosts.length = 0;
    craters.length = 0;
    platforms.length = 0;
    parryOrbs.length = 0;
    denisBirds.length = 0;
    turrets.length = 0;
    Object.assign(game, {
      paused: false,
      ended: false,
      introT: 0,
      fightTime: 0,
      hitsTaken: 0,
      hitStop: 0,
      shake: 0,
      flash: 0,
      endTimer: 0,
      coinEarned: false,
      shopOpen: false,
      endingWin: false,
      lastBell: false,
      schoolFloor: 1,
      schoolParkour: false,
      parkourHazardT: 0,
      roofHintT: 0,
      egorChase: false,
      egorField: false,
      egorClouds: false,
      egorCloudFinale: false,
      elenaArea: 'classroom',
      elenaEscape: false,
      elenaExitHint: 0,
      nikitaDark: false,
      stepaScroll: false,
    });
    motes.length = 0;
    for (let i = 0; i < 34; i++) {
      motes.push({
        x: rand(60, 1220),
        y: rand(130, 560),
        r: rand(0.6, 2.1),
        speed: rand(3, 12),
        phase: rand(0, TAU),
        drift: rand(-7, 7),
        alpha: rand(0.12, 0.35),
      });
    }
  }

  // ---------- рисовальные помощники ----------
  function roundRect(g, x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    g.beginPath();
    g.moveTo(x + radius, y);
    g.arcTo(x + w, y, x + w, y + h, radius);
    g.arcTo(x + w, y + h, x, y + h, radius);
    g.arcTo(x, y + h, x, y, radius);
    g.arcTo(x, y, x + w, y, radius);
    g.closePath();
  }

  function ellipsePath(g, cx, cy, rx, ry, rot = 0) {
    g.beginPath();
    g.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), rot, 0, TAU);
  }

  function starPath(g, cx, cy, spikes, outer, inner, rot = -Math.PI / 2) {
    g.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = rot + (i * Math.PI) / spikes;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
  }

  function fillStroke(g, fill, stroke = INK, width = 4) {
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    if (stroke) {
      g.strokeStyle = stroke;
      g.lineWidth = width;
      g.lineJoin = 'round';
      g.stroke();
    }
  }

  function circle(g, x, y, r, fill, stroke = INK, width = 4) {
    ellipsePath(g, x, y, r, r);
    fillStroke(g, fill, stroke, width);
  }

  function seeded(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // ---------- цирковая арена и карта городка (статические фоны) ----------
  let bgCanvas = null;
  let schoolBgCanvas = null;
  let schoolFloor3BgCanvas = null;
  let mapBgCanvas = null;

  function drawPoster(g, x, y, w, h) {
    g.save();
    g.translate(x, y);
    g.rotate(-0.035);
    g.fillStyle = 'rgba(40, 20, 14, 0.22)';
    roundRect(g, 7, 9, w, h, 3);
    g.fill();

    g.fillStyle = '#e8d2a3';
    roundRect(g, 0, 0, w, h, 3);
    fillStroke(g, '#e8d2a3', INK, 3);

    g.strokeStyle = 'rgba(109, 28, 39, 0.55)';
    g.lineWidth = 1.5;
    g.strokeRect(7, 7, w - 14, h - 14);

    g.fillStyle = '#7a3a2a';
    g.font = `700 8px ${FONT_BODY}`;
    g.textAlign = 'center';
    g.fillText('ЦИРК «ГИГАНТ»', w / 2, 25);

    starPath(g, w / 2, 62, 8, 35, 19, -Math.PI / 2);
    fillStroke(g, GOLD, INK, 2.5);
    starPath(g, w / 2, 62, 8, 23, 12, -Math.PI / 2);
    fillStroke(g, RED_DEEP, null, 0);

    g.fillStyle = '#5d1a20';
    g.font = `900 ${Math.round(w * 0.115)}px ${FONT_DISPLAY}`;
    g.fillText('ЛЕТУНОВ', w / 2, 128);

    g.font = `700 7.5px ${FONT_BODY}`;
    g.fillStyle = '#7a3a2a';
    g.fillText('САМЫЙ ТОЛСТЫЙ', w / 2, 145);

    g.strokeStyle = 'rgba(93, 26, 32, 0.5)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(22, 157);
    g.lineTo(w - 22, 157);
    g.stroke();

    g.fillStyle = '#3b211c';
    g.font = `italic 8px ${FONT_BODY}`;
    g.fillText('МИСТЕР БОЛЬШОЕ ПУЗО', w / 2, 174);
    g.fillText('НЕПРОБИВАЕМЫЙ', w / 2, 186);
    g.fillText('СЪЕСТ ВСЕХ, КОГО СМОЖЕТ', w / 2, 198);

    // потрёпанные уголки
    g.fillStyle = 'rgba(120, 76, 38, 0.18)';
    for (let i = 0; i < 22; i++) {
      const px = seeded(i + x) * w;
      const py = seeded(i * 3.7 + y) * h;
      g.fillRect(px, py, 1.5, 1.5);
    }
    g.restore();
  }

  function drawSunburst(g, cx, cy, radius, rays) {
    g.save();
    g.translate(cx, cy);
    for (let i = 0; i < rays; i++) {
      const a1 = (i / rays) * TAU;
      const a2 = ((i + 1) / rays) * TAU;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a1) * radius, Math.sin(a1) * radius);
      g.lineTo(Math.cos(a2) * radius, Math.sin(a2) * radius);
      g.closePath();
      g.fillStyle = i % 2 === 0 ? 'rgba(211, 160, 74, 0.055)' : 'rgba(109, 28, 39, 0.04)';
      g.fill();
    }
    g.strokeStyle = 'rgba(109, 28, 39, 0.1)';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(0, 0, radius * 0.78, 0, TAU);
    g.stroke();
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(0, 0, radius * 0.88, 0, TAU);
    g.stroke();
    g.restore();
  }

  function drawGarland(g) {
    const p0 = { x: 30, y: 186 };
    const p1 = { x: 640, y: 254 };
    const p2 = { x: 1250, y: 176 };

    const pointAt = (t) => ({
      x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
      y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
    });

    g.strokeStyle = 'rgba(58, 32, 22, 0.55)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(p0.x, p0.y);
    g.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    g.stroke();

    const colors = [RED_DEEP, TEAL, GOLD, RED, CREAM];
    let idx = 0;
    for (let t = 0.045; t < 0.97; t += 0.049) {
      const p = pointAt(t);
      const size = 10 + seeded(idx + 4) * 3;
      const drop = 24 + seeded(idx + 10) * 8;
      const tilt = (seeded(idx + 20) - 0.5) * 0.25;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(tilt);
      g.beginPath();
      g.moveTo(-size, 0);
      g.lineTo(size, 0);
      g.lineTo(0, drop);
      g.closePath();
      g.fillStyle = colors[idx % colors.length];
      g.fill();
      g.strokeStyle = 'rgba(38, 20, 25, 0.7)';
      g.lineWidth = 1.3;
      g.stroke();
      g.strokeStyle = 'rgba(38, 20, 25, 0.5)';
      g.beginPath();
      g.arc(p.x, p.y, 2.2, 0, TAU);
      g.fillStyle = 'rgba(38, 20, 25, 0.55)';
      g.fill();
      g.restore();
      idx++;
    }
  }

  function buildBackground() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    g.lineCap = 'round';

    // стена
    const wall = g.createLinearGradient(0, 110, 0, 560);
    wall.addColorStop(0, '#e7cfa6');
    wall.addColorStop(0.55, '#efddb8');
    wall.addColorStop(1, '#d5b78a');
    g.fillStyle = wall;
    g.fillRect(0, 0, W, 560);

    // полосы на стене
    for (let i = 0; i < 12; i++) {
      const x = 20 + i * 108;
      g.fillStyle = i % 2 === 0 ? 'rgba(173, 54, 40, 0.075)' : 'rgba(43, 98, 92, 0.055)';
      g.fillRect(x, 128, 54, 424);
      g.fillStyle = 'rgba(255, 250, 234, 0.11)';
      g.fillRect(x + 54, 128, 8, 424);
    }

    // тонкие швы обоев
    g.strokeStyle = 'rgba(94, 55, 31, 0.06)';
    g.lineWidth = 1;
    for (let x = 0; x < W; x += 54) {
      g.beginPath();
      g.moveTo(x, 128);
      g.lineTo(x + 3, 552);
      g.stroke();
    }

    drawSunburst(g, 930, 388, 305, 30);

    // верхний занавес
    const drape = g.createLinearGradient(0, 0, 0, 145);
    drape.addColorStop(0, '#8b2b32');
    drape.addColorStop(0.65, '#6f1d27');
    drape.addColorStop(1, '#5a1620');
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(W, 0);
    g.lineTo(W, 88);
    for (let x = W; x > 0; x -= 120) {
      g.quadraticCurveTo(x - 60, 143, x - 120, 88);
    }
    g.closePath();
    g.fillStyle = drape;
    g.fill();
    g.strokeStyle = 'rgba(38, 20, 25, 0.55)';
    g.lineWidth = 2;
    g.stroke();

    // складки занавеса
    for (let x = 40; x < W; x += 86) {
      g.strokeStyle = 'rgba(28, 8, 12, 0.13)';
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(x, 0);
      g.quadraticCurveTo(x + 8, 55, x + 2, 108);
      g.stroke();
      g.strokeStyle = 'rgba(255, 207, 140, 0.055)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + 20, 0);
      g.quadraticCurveTo(x + 26, 55, x + 22, 102);
      g.stroke();
    }

    // золотая кромка по низу драпировки
    g.strokeStyle = 'rgba(211, 160, 74, 0.62)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 91);
    for (let x = W; x > 0; x -= 120) {
      g.quadraticCurveTo(x - 60, 146, x - 120, 91);
    }
    g.stroke();

    // кисточки
    for (let x = W - 60; x > 0; x -= 120) {
      g.strokeStyle = 'rgba(211, 160, 74, 0.6)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, 111);
      g.lineTo(x, 128);
      g.stroke();
      g.fillStyle = GOLD;
      g.beginPath();
      g.moveTo(x - 4, 127);
      g.lineTo(x + 4, 127);
      g.lineTo(x, 138);
      g.closePath();
      g.fill();
    }

    drawGarland(g);
    drawPoster(g, 132, 200, 164, 218);
    drawPoster(g, 997, 208, 132, 176);

    // нижний бортик арены
    g.fillStyle = 'rgba(63, 28, 24, 0.18)';
    g.fillRect(0, 548, W, 6);
    const apron = g.createLinearGradient(0, 552, 0, 592);
    apron.addColorStop(0, '#7a2530');
    apron.addColorStop(1, '#591621');
    g.fillStyle = apron;
    g.fillRect(0, 552, W, 40);
    g.fillStyle = GOLD;
    g.fillRect(0, 549, W, 3);
    g.fillStyle = 'rgba(38, 20, 25, 0.25)';
    g.fillRect(0, 589, W, 3);

    // складки бортика
    for (let x = 0; x < W; x += 46) {
      g.fillStyle = 'rgba(28, 8, 12, 0.13)';
      g.beginPath();
      g.moveTo(x, 553);
      g.lineTo(x + 15, 553);
      g.lineTo(x + 3, 589);
      g.lineTo(x - 12, 589);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255, 205, 140, 0.035)';
      g.beginPath();
      g.moveTo(x + 25, 553);
      g.lineTo(x + 30, 553);
      g.lineTo(x + 18, 589);
      g.lineTo(x + 13, 589);
      g.closePath();
      g.fill();
    }

    // лампочки на бортике
    for (let x = 30; x < W; x += 54) {
      const glow = g.createRadialGradient(x, 574, 1, x, 574, 12);
      glow.addColorStop(0, 'rgba(255, 226, 150, 0.5)');
      glow.addColorStop(1, 'rgba(255, 226, 150, 0)');
      g.fillStyle = glow;
      g.fillRect(x - 12, 562, 24, 24);
      g.fillStyle = '#f5d795';
      g.beginPath();
      g.arc(x, 574, 3.2, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255, 255, 240, 0.85)';
      g.beginPath();
      g.arc(x - 0.8, 573.2, 1.1, 0, TAU);
      g.fill();
    }

    // дощатый пол
    const floor = g.createLinearGradient(0, FLOOR_TOP, 0, H);
    floor.addColorStop(0, '#c79c6c');
    floor.addColorStop(0.45, '#b48455');
    floor.addColorStop(1, '#8d5e3c');
    g.fillStyle = floor;
    g.fillRect(0, FLOOR_TOP, W, H - FLOOR_TOP);

    // доски
    for (let y = FLOOR_TOP + 14; y < H; y += 27) {
      g.strokeStyle = 'rgba(70, 40, 24, 0.22)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
      g.strokeStyle = 'rgba(255, 230, 185, 0.05)';
      g.beginPath();
      g.moveTo(0, y + 2);
      g.lineTo(W, y + 2);
      g.stroke();
    }

    // стыки досок
    for (let y = FLOOR_TOP + 14, row = 0; y < H; y += 27, row++) {
      for (let x = (row % 2) * 90; x < W; x += 180) {
        g.strokeStyle = 'rgba(70, 40, 24, 0.14)';
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(x + seeded(row * 7 + x) * 22, y);
        g.lineTo(x + 18 + seeded(row * 3 + x) * 12, y + 27);
        g.stroke();
      }
    }

    // нарисованный круг на полу
    g.save();
    g.strokeStyle = 'rgba(109, 28, 39, 0.2)';
    g.setLineDash([17, 12]);
    g.lineWidth = 3;
    ellipsePath(g, 640, 665, 370, 36);
    g.stroke();
    g.setLineDash([8, 10]);
    g.lineWidth = 1.5;
    ellipsePath(g, 640, 666, 405, 42);
    g.stroke();
    g.restore();

    // опилки и потёртости
    for (let i = 0; i < 380; i++) {
      const x = seeded(i * 2.1) * W;
      const y = FLOOR_TOP + 5 + seeded(i * 5.7) * (H - FLOOR_TOP - 8);
      g.fillStyle =
        i % 5 === 0 ? 'rgba(255, 238, 190, 0.22)' : 'rgba(74, 44, 28, 0.16)';
      g.fillRect(x, y, seeded(i + 8) * 3 + 0.7, 1.2);
    }

    // тёмный передний край сцены
    const front = g.createLinearGradient(0, 680, 0, H);
    front.addColorStop(0, 'rgba(58, 29, 18, 0)');
    front.addColorStop(1, 'rgba(42, 20, 14, 0.34)');
    g.fillStyle = front;
    g.fillRect(0, 680, W, 40);

    // боковые кулисы
    const curtain = (side) => {
      const cw = 74;
      const baseX = side === 0 ? 0 : W - cw;
      const grad = g.createLinearGradient(baseX, 0, baseX + cw, 0);
      if (side === 0) {
        grad.addColorStop(0, '#4a101c');
        grad.addColorStop(0.65, '#651a26');
        grad.addColorStop(1, '#3f0f18');
      } else {
        grad.addColorStop(0, '#3f0f18');
        grad.addColorStop(0.35, '#651a26');
        grad.addColorStop(1, '#4a101c');
      }
      g.fillStyle = grad;
      g.fillRect(baseX, 0, cw, H);
      for (let i = 0; i < 4; i++) {
        const foldX = baseX + 10 + i * 17;
        g.strokeStyle = i % 2 === 0 ? 'rgba(20, 4, 8, 0.24)' : 'rgba(255, 190, 130, 0.06)';
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(foldX, 0);
        g.quadraticCurveTo(foldX + 12, 280, foldX + 2, H);
        g.stroke();
      }
      // золотая кромка
      g.fillStyle = 'rgba(211, 160, 74, 0.55)';
      g.fillRect(side === 0 ? cw - 4 : W - cw, 0, 4, H);
      // кисть-подхват
      const tieY = 338;
      g.fillStyle = 'rgba(211, 160, 74, 0.8)';
      g.beginPath();
      g.ellipse(side === 0 ? cw - 6 : W - cw + 6, tieY, 10, 16, 0, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(38, 20, 25, 0.6)';
      g.lineWidth = 2;
      g.stroke();
    };
    curtain(0);
    curtain(1);

    // дальняя тень под занавесом
    const sideShadow = g.createLinearGradient(0, 0, 110, 0);
    sideShadow.addColorStop(0, 'rgba(38, 20, 25, 0.16)');
    sideShadow.addColorStop(1, 'rgba(38, 20, 25, 0)');
    g.fillStyle = sideShadow;
    g.fillRect(74, 0, 36, H);
    g.save();
    g.translate(W, 0);
    g.scale(-1, 1);
    g.fillStyle = sideShadow;
    g.fillRect(74, 0, 36, H);
    g.restore();

    // состаренная бумага
    for (let i = 0; i < 700; i++) {
      g.fillStyle = i % 3 === 0 ? 'rgba(255, 250, 230, 0.07)' : 'rgba(70, 38, 20, 0.045)';
      g.fillRect(seeded(i * 1.3) * W, seeded(i * 4.7) * H, 1.2, 1.2);
    }

    bgCanvas = c;
  }

  // ---------- школьная арена (статичный фон) ----------
  function buildSchoolBackground() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    g.lineCap = 'round';

    const wall = g.createLinearGradient(0, 90, 0, 590);
    wall.addColorStop(0, '#d9cfad');
    wall.addColorStop(0.52, '#e7d8b2');
    wall.addColorStop(1, '#bfa97e');
    g.fillStyle = wall;
    g.fillRect(0, 0, W, 590);

    // верхний карниз и панель
    g.fillStyle = '#8b6b42';
    g.fillRect(0, 78, W, 18);
    g.fillStyle = 'rgba(255, 244, 212, 0.23)';
    g.fillRect(0, 96, W, 4);
    g.fillStyle = 'rgba(68, 45, 28, 0.15)';
    g.fillRect(0, 556, W, 34);

    // большие окна слева и справа
    const drawWindow = (x, y, w, h) => {
      g.fillStyle = 'rgba(50, 34, 22, 0.45)';
      roundRect(g, x - 9, y - 9, w + 18, h + 18, 7);
      g.fill();
      const sky = g.createLinearGradient(0, y, 0, y + h);
      sky.addColorStop(0, '#557f86');
      sky.addColorStop(0.55, '#8fb0a3');
      sky.addColorStop(1, '#d8bf8c');
      g.fillStyle = sky;
      roundRect(g, x, y, w, h, 4);
      g.fill();
      g.strokeStyle = '#5d422c';
      g.lineWidth = 6;
      g.stroke();
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x + w / 2, y + 4);
      g.lineTo(x + w / 2, y + h - 4);
      g.moveTo(x + 4, y + h * 0.48);
      g.lineTo(x + w - 4, y + h * 0.48);
      g.stroke();
      g.fillStyle = 'rgba(255, 250, 230, 0.2)';
      g.beginPath();
      g.moveTo(x + 12, y + 8);
      g.lineTo(x + w * 0.38, y + 8);
      g.lineTo(x + w * 0.16, y + h - 8);
      g.lineTo(x + 7, y + h - 8);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(38, 24, 20, 0.22)';
      g.fillRect(x - 12, y + h + 9, w + 24, 5);
      // шторы
      g.fillStyle = '#8f3036';
      g.beginPath();
      g.moveTo(x - 20, y - 20);
      g.quadraticCurveTo(x + 8, y + h * 0.35, x - 16, y + h + 18);
      g.lineTo(x - 32, y + h + 18);
      g.lineTo(x - 32, y - 20);
      g.closePath();
      g.fill();
      g.beginPath();
      g.moveTo(x + w + 20, y - 20);
      g.quadraticCurveTo(x + w - 8, y + h * 0.35, x + w + 16, y + h + 18);
      g.lineTo(x + w + 32, y + h + 18);
      g.lineTo(x + w + 32, y - 20);
      g.closePath();
      g.fill();
    };
    drawWindow(58, 155, 210, 255);
    drawWindow(1012, 155, 210, 255);

    // доска
    const bx = 336;
    const by = 142;
    const bw = 608;
    const bh = 266;
    g.fillStyle = '#684a2e';
    roundRect(g, bx - 15, by - 15, bw + 30, bh + 30, 8);
    g.fill();
    g.strokeStyle = '#3f2a1d';
    g.lineWidth = 6;
    g.stroke();
    const board = g.createLinearGradient(0, by, 0, by + bh);
    board.addColorStop(0, '#264a40');
    board.addColorStop(0.5, '#1e403a');
    board.addColorStop(1, '#17322e');
    g.fillStyle = board;
    roundRect(g, bx, by, bw, bh, 4);
    g.fill();
    g.strokeStyle = 'rgba(218, 232, 202, 0.16)';
    g.lineWidth = 2;
    g.stroke();
    g.strokeStyle = 'rgba(240, 235, 208, 0.5)';
    g.lineWidth = 2;
    g.font = `italic 15px ${FONT_BODY}`;
    g.fillStyle = 'rgba(245, 239, 214, 0.42)';
    g.fillText('ШКОЛА №53', bx + 35, by + 38);
    g.font = `italic 22px ${FONT_BODY}`;
    g.fillStyle = 'rgba(245, 239, 214, 0.55)';
    g.fillText('Домашнее задание: выжить на перемене', bx + 35, by + 70);
    g.font = `italic 18px ${FONT_BODY}`;
    g.fillText('x + 7 = 53', bx + 60, by + 126);
    g.fillText('Летунов = 7 × Денис?', bx + 300, by + 124);
    g.strokeStyle = 'rgba(245, 239, 214, 0.38)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(bx + 48, by + 154);
    g.quadraticCurveTo(bx + 120, by + 178, bx + 205, by + 163);
    g.moveTo(bx + 338, by + 164);
    g.lineTo(bx + 520, by + 142);
    g.stroke();
    // меловой звёздный человечек
    starPath(g, bx + 300, by + 210, 8, 30, 14, -Math.PI / 2);
    g.strokeStyle = 'rgba(244, 238, 207, 0.42)';
    g.lineWidth = 3;
    g.stroke();
    g.beginPath();
    g.arc(bx + 300, by + 210, 42, 0, TAU);
    g.stroke();
    // полка для мела
    g.fillStyle = '#4a3322';
    g.fillRect(bx + 20, by + bh - 2, bw - 40, 11);
    g.fillStyle = '#efe5c8';
    for (let i = 0; i < 4; i++) g.fillRect(bx + 46 + i * 44, by + bh - 8, 24, 4);
    g.fillStyle = '#d87858';
    g.fillRect(bx + bw - 76, by + bh - 10, 34, 6);

    // часы
    g.save();
    g.translate(640, 92);
    circle(g, 0, 0, 31, '#f1dfb2', '#4a3424', 5);
    circle(g, 0, 0, 26, 'rgba(255,255,255,0.18)', null, 0);
    g.strokeStyle = '#3f2b20';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -17);
    g.moveTo(0, 0);
    g.lineTo(12, 7);
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      g.fillStyle = '#5b4230';
      g.beginPath();
      g.arc(Math.cos(a) * 21, Math.sin(a) * 21, 1.6, 0, TAU);
      g.fill();
    }
    g.restore();

    // растяжка с флажками
    const p0 = { x: 30, y: 132 };
    const p1 = { x: 640, y: 188 };
    const p2 = { x: 1250, y: 126 };
    g.strokeStyle = 'rgba(76, 47, 29, 0.65)';
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(p0.x, p0.y);
    g.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    g.stroke();
    for (let i = 0; i < 18; i++) {
      const t = 0.04 + i * 0.052;
      const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
      g.beginPath();
      g.moveTo(x - 10, y);
      g.lineTo(x + 10, y);
      g.lineTo(x, y + 24);
      g.closePath();
      g.fillStyle = i % 3 === 0 ? '#ad3628' : i % 3 === 1 ? '#2b625c' : '#d3a04a';
      g.fill();
      g.strokeStyle = 'rgba(38, 20, 25, 0.5)';
      g.lineWidth = 1;
      g.stroke();
    }

    // шкафчики у стен
    const locker = (x, w) => {
      g.fillStyle = '#466a64';
      roundRect(g, x, 390, w, 180, 5);
      fillStroke(g, '#466a64', '#2d423e', 4);
      for (let i = 0; i < 3; i++) {
        const lx = x + 6 + i * (w - 12) / 3;
        g.fillStyle = 'rgba(26, 48, 44, 0.36)';
        g.fillRect(lx + 1, 397, (w - 12) / 3 - 4, 166);
        g.fillStyle = GOLD;
        g.fillRect(lx + (w - 12) / 6 - 2, 474, 4, 10);
      }
    };
    locker(34, 176);
    locker(1070, 176);

    // плакаты
    const poster = (x, y, w, h, title) => {
      g.fillStyle = 'rgba(40, 24, 16, 0.18)';
      g.fillRect(x + 5, y + 7, w, h);
      g.fillStyle = '#ead7ac';
      roundRect(g, x, y, w, h, 2);
      fillStroke(g, '#ead7ac', '#5a3d28', 3);
      g.fillStyle = '#7a3a2a';
      g.font = `700 9px ${FONT_BODY}`;
      g.textAlign = 'center';
      g.fillText(title, x + w / 2, y + 17);
      g.strokeStyle = 'rgba(90, 61, 40, 0.4)';
      g.strokeRect(x + 6, y + 24, w - 12, h - 30);
      g.fillStyle = 'rgba(87, 58, 37, 0.28)';
      for (let i = 0; i < 4; i++) g.fillRect(x + 12, y + 34 + i * 13, w - 24, 2);
      g.textAlign = 'left';
    };
    poster(280, 448, 44, 70, 'ТИШИНА');
    poster(956, 450, 50, 68, 'СПОРТ');

    // пол
    const floor = g.createLinearGradient(0, FLOOR_TOP, 0, H);
    floor.addColorStop(0, '#b88d5d');
    floor.addColorStop(0.55, '#a4764b');
    floor.addColorStop(1, '#7f5637');
    g.fillStyle = floor;
    g.fillRect(0, FLOOR_TOP, W, H - FLOOR_TOP);
    g.fillStyle = 'rgba(71, 42, 24, 0.26)';
    g.fillRect(0, FLOOR_TOP, W, 5);
    for (let y = FLOOR_TOP + 16; y < H; y += 29) {
      g.strokeStyle = 'rgba(74, 44, 26, 0.22)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
      g.strokeStyle = 'rgba(255, 231, 185, 0.055)';
      g.beginPath();
      g.moveTo(0, y + 2);
      g.lineTo(W, y + 2);
      g.stroke();
    }
    for (let i = 0; i < 520; i++) {
      const x = seeded(i * 3.1 + 11) * W;
      const y = FLOOR_TOP + 5 + seeded(i * 7.9 + 3) * (H - FLOOR_TOP - 10);
      g.fillStyle = i % 4 === 0 ? 'rgba(255, 242, 204, 0.2)' : 'rgba(62, 38, 23, 0.15)';
      g.fillRect(x, y, seeded(i + 8) * 3 + 0.6, 1.2);
    }
    // тёплые полосы от окон
    const beam = g.createLinearGradient(0, 200, 0, 600);
    beam.addColorStop(0, 'rgba(255, 240, 186, 0.13)');
    beam.addColorStop(1, 'rgba(255, 240, 186, 0)');
    g.fillStyle = beam;
    g.beginPath();
    g.moveTo(100, 160);
    g.lineTo(330, 160);
    g.lineTo(455, 600);
    g.lineTo(185, 600);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(980, 160);
    g.lineTo(1210, 160);
    g.lineTo(1120, 600);
    g.lineTo(850, 600);
    g.closePath();
    g.fill();

    // состаренная бумага
    for (let i = 0; i < 650; i++) {
      g.fillStyle = i % 3 === 0 ? 'rgba(255, 250, 230, 0.06)' : 'rgba(70, 38, 20, 0.04)';
      g.fillRect(seeded(i * 1.7 + 5) * W, seeded(i * 4.1 + 9) * H, 1.2, 1.2);
    }
    schoolBgCanvas = c;
  }

  // ---------- третий этаж школы: небо, пролом и бетон ----------
  function buildThirdFloorBackground() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    g.lineCap = 'round';

    const sky = g.createLinearGradient(0, 0, 0, 520);
    sky.addColorStop(0, '#7caab8');
    sky.addColorStop(0.46, '#b7c7b5');
    sky.addColorStop(0.78, '#d9c397');
    sky.addColorStop(1, '#b08d68');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    // солнце и облака
    g.save();
    g.globalAlpha = 0.42;
    const sun = g.createRadialGradient(942, 118, 12, 942, 118, 150);
    sun.addColorStop(0, 'rgba(255, 245, 197, 0.96)');
    sun.addColorStop(0.35, 'rgba(255, 229, 150, 0.44)');
    sun.addColorStop(1, 'rgba(255, 229, 150, 0)');
    g.fillStyle = sun;
    g.beginPath();
    g.arc(942, 118, 150, 0, TAU);
    g.fill();
    g.restore();
    for (let i = 0; i < 6; i++) {
      const x = 80 + seeded(i * 8.2) * 1080;
      const y = 70 + seeded(i * 3.7 + 2) * 220;
      const s = 0.7 + seeded(i * 5.4 + 5) * 0.9;
      g.save();
      g.translate(x, y);
      g.scale(s, s);
      g.globalAlpha = 0.26;
      g.fillStyle = '#f5edd9';
      g.beginPath();
      g.ellipse(0, 0, 82, 22, 0, 0, TAU);
      g.ellipse(-54, 6, 42, 16, 0, 0, TAU);
      g.ellipse(48, 7, 49, 18, 0, 0, TAU);
      g.fill();
      g.restore();
    }

    // город на горизонте
    g.fillStyle = 'rgba(83, 91, 88, 0.3)';
    for (let i = 0; i < 18; i++) {
      const bx = i * 78 - 20;
      const bh = 52 + seeded(i * 9.4) * 145;
      g.fillRect(bx, 490 - bh, 58 + seeded(i + 4) * 18, bh);
    }
    g.fillStyle = 'rgba(255, 239, 190, 0.22)';
    for (let i = 0; i < 50; i++) {
      const x = seeded(i * 7.7 + 9) * W;
      const y = 380 + seeded(i * 2.6 + 3) * 100;
      g.fillRect(x, y, 4, 7);
    }

    // пролом в потолке: рваная тёмная кромка
    g.fillStyle = '#604d3e';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(W, 0);
    g.lineTo(W, 92);
    g.lineTo(1148, 104);
    g.lineTo(1080, 82);
    g.lineTo(1010, 123);
    g.lineTo(938, 90);
    g.lineTo(864, 118);
    g.lineTo(792, 74);
    g.lineTo(704, 110);
    g.lineTo(638, 84);
    g.lineTo(564, 127);
    g.lineTo(486, 90);
    g.lineTo(424, 115);
    g.lineTo(352, 82);
    g.lineTo(274, 118);
    g.lineTo(206, 88);
    g.lineTo(132, 110);
    g.lineTo(0, 88);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(212, 196, 164, 0.22)';
    g.fillRect(0, 86, W, 8);
    for (let i = 0; i < 15; i++) {
      const x = 80 + seeded(i * 4.1) * 1120;
      g.fillStyle = 'rgba(52, 42, 36, 0.28)';
      g.beginPath();
      g.moveTo(x, 90 + seeded(i) * 28);
      g.lineTo(x + 13, 112 + seeded(i + 2) * 30);
      g.lineTo(x + 4, 144 + seeded(i + 4) * 24);
      g.strokeStyle = 'rgba(52, 42, 36, 0.3)';
      g.lineWidth = 3;
      g.stroke();
    }

    // уцелевшие стены слева и справа
    g.fillStyle = '#8c6a48';
    g.fillRect(0, 88, 92, 470);
    g.fillRect(W - 94, 88, 94, 470);
    g.fillStyle = 'rgba(255, 231, 185, 0.08)';
    for (let y = 110; y < 540; y += 34) {
      g.fillRect(0, y, 92, 3);
      g.fillRect(W - 94, y, 94, 3);
    }
    g.fillStyle = 'rgba(37, 28, 22, 0.25)';
    g.fillRect(90, 90, 10, 470);
    g.fillRect(W - 104, 90, 10, 470);

    // табличка школы №53
    g.save();
    g.translate(642, 188);
    g.rotate(-0.035);
    g.fillStyle = 'rgba(35, 24, 18, 0.24)';
    roundRect(g, -159, -37, 326, 80, 8);
    g.fill();
    g.fillStyle = '#e6d2a5';
    roundRect(g, -166, -44, 326, 80, 8);
    fillStroke(g, '#e6d2a5', '#5d4028', 5);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#713a2b';
    g.font = `900 29px ${FONT_DISPLAY}`;
    g.fillText('ШКОЛА №53', 0, -10);
    g.font = `700 9px Verdana, sans-serif`;
    g.fillStyle = 'rgba(88, 55, 34, 0.78)';
    g.fillText('ТРЕТИЙ ЭТАЖ · ВЫХОД НА КРЫШУ', 0, 16);
    g.restore();

    // бетонный пол/крыша
    const floor = g.createLinearGradient(0, 520, 0, H);
    floor.addColorStop(0, '#9a9182');
    floor.addColorStop(0.35, '#807a6f');
    floor.addColorStop(1, '#5e5a54');
    g.fillStyle = floor;
    g.fillRect(0, 520, W, H - 520);
    g.fillStyle = 'rgba(240, 231, 205, 0.18)';
    g.fillRect(0, 520, W, 5);
    g.strokeStyle = 'rgba(48, 42, 36, 0.24)';
    g.lineWidth = 2;
    for (let y = 548; y < H; y += 38) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const x = seeded(i * 9.1 + 3) * W;
      g.strokeStyle = 'rgba(44, 37, 31, 0.28)';
      g.beginPath();
      g.moveTo(x, 540);
      g.lineTo(x + 30, 590);
      g.lineTo(x + 10, 650);
      g.stroke();
    }

    // обломки бетона по краям
    for (let i = 0; i < 12; i++) {
      const x = i < 6 ? 20 + seeded(i * 4.4) * 120 : W - 150 + seeded(i * 3.2) * 120;
      const y = 540 + seeded(i * 6.7) * 120;
      g.save();
      g.translate(x, y);
      g.rotate(seeded(i * 8.3) * 2);
      g.fillStyle = '#777064';
      roundRect(g, -26, -14, 52, 28, 5);
      fillStroke(g, '#777064', 'rgba(43, 37, 31, 0.6)', 2);
      g.restore();
    }

    // потёки и пыль
    for (let i = 0; i < 450; i++) {
      g.fillStyle = i % 4 === 0 ? 'rgba(255, 247, 219, 0.09)' : 'rgba(42, 35, 29, 0.06)';
      g.fillRect(seeded(i * 1.9 + 8) * W, seeded(i * 3.3 + 1) * H, 1.3, 1.3);
    }

    schoolFloor3BgCanvas = c;
  }

  // ---------- карта городка (статичный фон) ----------
  function buildLegacyMapBackground() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    g.lineCap = 'round';

    const sky = g.createLinearGradient(0, 0, 0, 560);
    sky.addColorStop(0, '#213b44');
    sky.addColorStop(0.4, '#5d6f66');
    sky.addColorStop(0.72, '#c39b67');
    sky.addColorStop(1, '#e6c88d');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, 590);

    // луна и звёзды
    g.fillStyle = 'rgba(247, 229, 176, 0.9)';
    g.beginPath();
    g.arc(1060, 102, 34, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255, 243, 200, 0.11)';
    g.beginPath();
    g.arc(1060, 102, 72, 0, TAU);
    g.fill();
    for (let i = 0; i < 46; i++) {
      const x = seeded(i * 2.3 + 1) * W;
      const y = 34 + seeded(i * 5.1 + 2) * 250;
      g.fillStyle = `rgba(255, 244, 208, ${0.2 + seeded(i + 4) * 0.55})`;
      g.fillRect(x, y, 1.8, 1.8);
    }

    // облака
    for (let i = 0; i < 5; i++) {
      const x = 90 + i * 260 + seeded(i) * 80;
      const y = 138 + seeded(i + 3) * 75;
      g.fillStyle = 'rgba(230, 210, 174, 0.13)';
      g.beginPath();
      g.ellipse(x, y, 90, 20, 0, 0, TAU);
      g.ellipse(x + 45, y - 12, 55, 18, 0, 0, TAU);
      g.fill();
    }

    // далёкие крыши и холмы
    g.fillStyle = '#34473f';
    g.beginPath();
    g.moveTo(0, 470);
    g.quadraticCurveTo(140, 390, 300, 452);
    g.quadraticCurveTo(440, 372, 620, 450);
    g.quadraticCurveTo(820, 380, 980, 454);
    g.quadraticCurveTo(1140, 398, 1280, 456);
    g.lineTo(1280, 600);
    g.lineTo(0, 600);
    g.closePath();
    g.fill();
    for (let i = 0; i < 9; i++) {
      const x = 80 + i * 145;
      const y = 440 - seeded(i * 3) * 62;
      g.fillStyle = 'rgba(48, 55, 43, 0.7)';
      g.fillRect(x, y, 60, 110);
      g.beginPath();
      g.moveTo(x - 9, y);
      g.lineTo(x + 30, y - 38);
      g.lineTo(x + 69, y);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(247, 210, 128, 0.35)';
      g.fillRect(x + 18, y + 28, 10, 14);
      if (i % 2 === 0) g.fillRect(x + 40, y + 28, 10, 14);
    }

    // трава/земля
    const ground = g.createLinearGradient(0, 512, 0, H);
    ground.addColorStop(0, '#57664f');
    ground.addColorStop(0.3, '#6b7354');
    ground.addColorStop(1, '#4b5845');
    g.fillStyle = ground;
    g.fillRect(0, 512, W, H - 512);

    // дорога
    const road = g.createLinearGradient(0, 566, 0, H);
    road.addColorStop(0, '#b99a6b');
    road.addColorStop(0.5, '#a4855c');
    road.addColorStop(1, '#7f6547');
    g.fillStyle = road;
    g.fillRect(0, 574, W, H - 574);
    g.fillStyle = '#d0b283';
    g.fillRect(0, 570, W, 9);
    g.fillStyle = 'rgba(62, 41, 27, 0.22)';
    g.fillRect(0, 579, W, 4);
    for (let y = 600; y < H; y += 28) {
      g.strokeStyle = 'rgba(67, 46, 29, 0.25)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
      g.strokeStyle = 'rgba(255, 233, 190, 0.05)';
      g.beginPath();
      g.moveTo(0, y + 2);
      g.lineTo(W, y + 2);
      g.stroke();
    }
    for (let i = 0; i < 260; i++) {
      const x = seeded(i * 2.8 + 4) * W;
      const y = 586 + seeded(i * 6.2 + 8) * (H - 590);
      g.fillStyle = i % 3 === 0 ? 'rgba(255, 239, 195, 0.16)' : 'rgba(65, 45, 29, 0.15)';
      g.fillRect(x, y, 1 + seeded(i + 2) * 4, 1.2);
    }

    // тротуары и фонари
    for (let x = 0; x < W; x += 128) {
      g.strokeStyle = 'rgba(71, 51, 32, 0.3)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, 570);
      g.lineTo(x + 8, 606);
      g.stroke();
    }
    const lamp = (x, y) => {
      g.strokeStyle = '#3b3027';
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y - 115);
      g.stroke();
      g.fillStyle = '#3b3027';
      g.beginPath();
      g.ellipse(x, y - 120, 17, 9, 0, 0, TAU);
      g.fill();
      g.fillStyle = '#f2ce7c';
      g.beginPath();
      g.ellipse(x, y - 115, 10, 5, 0, 0, TAU);
      g.fill();
      const glow = g.createRadialGradient(x, y - 116, 3, x, y - 116, 72);
      glow.addColorStop(0, 'rgba(255, 219, 126, 0.34)');
      glow.addColorStop(1, 'rgba(255, 219, 126, 0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(x, y - 116, 72, 0, TAU);
      g.fill();
    };
    lamp(515, 610);
    lamp(815, 610);

    // цирк
    g.fillStyle = '#87342e';
    g.beginPath();
    g.moveTo(300, 154);
    g.quadraticCurveTo(96, 320, 48, 532);
    g.lineTo(552, 532);
    g.quadraticCurveTo(504, 320, 300, 154);
    g.closePath();
    fillStroke(g, '#a83b2f', '#4a1f1d', 6);
    // полосы шатра
    for (let i = 0; i < 12; i++) {
      const a = -0.95 + i * 0.17;
      g.save();
      g.translate(300, 160);
      g.rotate(a);
      g.fillStyle = i % 2 ? 'rgba(243, 227, 189, 0.72)' : 'rgba(122, 32, 34, 0.5)';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(470, -40);
      g.lineTo(470, 60);
      g.closePath();
      g.fill();
      g.restore();
    }
    g.strokeStyle = 'rgba(58, 29, 23, 0.55)';
    g.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.moveTo(300, 168);
      g.quadraticCurveTo(70 + i * 76, 330, 60 + i * 78, 540);
      g.stroke();
    }
    // корпус
    g.fillStyle = '#8d2b2e';
    roundRect(g, 122, 386, 356, 190, 10);
    fillStroke(g, '#8d2b2e', '#4a1f1d', 5);
    for (let i = 0; i < 8; i++) {
      const x = 140 + i * 44;
      g.fillStyle = i % 2 ? 'rgba(243, 227, 189, 0.76)' : 'rgba(116, 28, 33, 0.58)';
      g.fillRect(x, 392, 28, 178);
    }
    // вход
    g.fillStyle = '#321f24';
    roundRect(g, 234, 462, 132, 114, 60);
    fillStroke(g, '#321f24', '#d3a04a', 5);
    g.fillStyle = 'rgba(255, 214, 131, 0.17)';
    g.beginPath();
    g.ellipse(300, 526, 54, 35, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#f3e3bd';
    g.fillRect(291, 446, 18, 24);
    // вывеска
    g.save();
    g.translate(300, 408);
    roundRect(g, -120, -27, 240, 48, 8);
    fillStroke(g, '#e8d0a4', '#4a1f1d', 4);
    g.fillStyle = '#7a2225';
    g.font = `900 27px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ЦИРК', 0, -2);
    g.font = `700 8px Verdana, sans-serif`;
    g.fillText('ЛЕТУНОВ', 0, 17);
    g.restore();
    // флаг
    g.strokeStyle = '#37251d';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(300, 154);
    g.lineTo(300, 82);
    g.stroke();
    g.fillStyle = GOLD;
    g.beginPath();
    g.moveTo(302, 84);
    g.lineTo(366, 100);
    g.lineTo(302, 120);
    g.closePath();
    g.fill();
    // лампочки
    for (let i = 0; i < 9; i++) {
      const x = 156 + i * 36;
      g.fillStyle = 'rgba(255, 222, 138, 0.8)';
      g.beginPath();
      g.arc(x, 471 - Math.abs(3.5 - i) * 3, 3, 0, TAU);
      g.fill();
    }
    // портрет Летунова на тумбе
    if (letunovPhoto.complete && letunovPhoto.naturalWidth > 0) {
      g.save();
      g.translate(144, 490);
      g.fillStyle = '#3d2721';
      g.fillRect(-5, -54, 74, 96);
      g.strokeStyle = GOLD;
      g.lineWidth = 4;
      g.strokeRect(-2, -51, 68, 90);
      g.beginPath();
      g.rect(-1, -50, 66, 88);
      g.clip();
      g.drawImage(letunovPhoto, -1, -50, 66, 88);
      g.restore();
    }

    // школа
    g.fillStyle = '#b38358';
    roundRect(g, 480, 278, 320, 292, 6);
    fillStroke(g, '#c39a6c', '#4a3322', 5);
    g.fillStyle = 'rgba(80, 50, 30, 0.18)';
    for (let y = 300; y < 560; y += 34) g.fillRect(486, y, 308, 2);
    // крыша
    g.fillStyle = '#4d3630';
    g.beginPath();
    g.moveTo(466, 286);
    g.lineTo(500, 238);
    g.lineTo(780, 238);
    g.lineTo(814, 286);
    g.closePath();
    fillStroke(g, '#4d3630', '#34221d', 5);
    g.fillStyle = '#d3a04a';
    g.fillRect(498, 270, 284, 7);
    // окна
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 506 + col * 70;
        const y = 304 + row * 105;
        g.fillStyle = '#3f514b';
        roundRect(g, x, y, 38, 52, 3);
        g.fill();
        g.strokeStyle = '#4a3322';
        g.lineWidth = 3;
        g.stroke();
        g.fillStyle = 'rgba(246, 220, 157, 0.33)';
        g.fillRect(x + 5, y + 6, 12, 14);
        g.strokeStyle = 'rgba(244, 236, 204, 0.22)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x + 19, y + 3);
        g.lineTo(x + 19, y + 49);
        g.moveTo(x + 3, y + 25);
        g.lineTo(x + 35, y + 25);
        g.stroke();
      }
    }
    // дверь
    g.fillStyle = '#35332d';
    roundRect(g, 594, 486, 92, 82, 40);
    fillStroke(g, '#35332d', '#3f2a1d', 4);
    g.fillStyle = '#d3a04a';
    g.beginPath();
    g.arc(676, 526, 3, 0, TAU);
    g.fill();
    // вывеска школы
    g.save();
    g.translate(640, 326);
    roundRect(g, -122, -30, 244, 54, 6);
    fillStroke(g, '#e5d1a5', '#4a3322', 4);
    g.fillStyle = '#2c625b';
    g.font = `900 26px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ШКОЛА №53', 0, -3);
    g.font = `700 8px Verdana, sans-serif`;
    g.fillStyle = '#7a3a2a';
    g.fillText('ДЕНИС · БОЛЬШАЯ ПЕРЕМЕНА', 0, 16);
    g.restore();
    // флаг школы
    g.strokeStyle = '#4a3322';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(640, 238);
    g.lineTo(640, 186);
    g.stroke();
    g.fillStyle = '#2c625b';
    g.beginPath();
    g.moveTo(642, 188);
    g.lineTo(698, 202);
    g.lineTo(642, 218);
    g.closePath();
    g.fill();
    // меловая табличка с Денисом
    g.save();
    g.translate(742, 450);
    g.rotate(0.03);
    g.fillStyle = '#24443c';
    g.fillRect(-35, -44, 70, 80);
    g.strokeStyle = '#d3a04a';
    g.lineWidth = 3;
    g.strokeRect(-35, -44, 70, 80);
    g.strokeStyle = 'rgba(241, 235, 208, 0.65)';
    g.lineWidth = 2;
    circle(g, -10, -14, 5, null, 'rgba(241, 235, 208, 0.7)', 2);
    circle(g, 10, -14, 5, null, 'rgba(241, 235, 208, 0.7)', 2);
    g.beginPath();
    g.moveTo(-5, -14);
    g.lineTo(5, -14);
    g.moveTo(-13, 2);
    g.quadraticCurveTo(0, 12, 13, 2);
    g.stroke();
    g.restore();

    // магазин
    g.fillStyle = '#7b4a32';
    roundRect(g, 824, 346, 252, 224, 7);
    fillStroke(g, '#8f5a3b', '#3f2a1d', 5);
    g.fillStyle = '#5e3b2a';
    g.beginPath();
    g.moveTo(816, 346);
    g.lineTo(850, 306);
    g.lineTo(1050, 306);
    g.lineTo(1084, 346);
    g.closePath();
    fillStroke(g, '#5e3b2a', '#34221d', 4);
    // вывеска
    g.save();
    g.translate(950, 276);
    roundRect(g, -116, -28, 232, 54, 8);
    fillStroke(g, '#e8d0a4', '#3f2a1d', 4);
    g.fillStyle = '#7a3a2a';
    g.font = `900 26px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('БАФФЫ', 0, -3);
    g.font = `700 8px Verdana, sans-serif`;
    g.fillText('СЕРДЦА · ДЫМ · МОНЕТЫ', 0, 16);
    g.restore();
    // навес
    for (let i = 0; i < 7; i++) {
      const x = 830 + i * 35;
      g.fillStyle = i % 2 ? '#f0dfb5' : '#a33b32';
      g.beginPath();
      g.moveTo(x, 356);
      g.lineTo(x + 35, 356);
      g.lineTo(x + 35, 390);
      g.quadraticCurveTo(x + 17, 408, x, 390);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(72, 38, 25, 0.5)';
      g.lineWidth = 1.4;
      g.stroke();
    }
    // витрина
    g.fillStyle = 'rgba(226, 206, 164, 0.9)';
    roundRect(g, 840, 408, 128, 88, 4);
    fillStroke(g, 'rgba(226, 206, 164, 0.9)', '#3f2a1d', 4);
    g.fillStyle = '#ad3628';
    g.font = `900 34px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.fillText('♥', 876, 462);
    g.fillStyle = '#2b625c';
    g.font = `900 28px ${FONT_BODY}`;
    g.fillText('☁', 928, 461);
    g.fillStyle = 'rgba(243, 227, 189, 0.84)';
    g.font = `700 7px Verdana, sans-serif`;
    g.fillText('1 МОНЕТА', 876, 484);
    g.fillText('2 МОНЕТЫ', 928, 484);
    // дверь
    g.fillStyle = '#3b2a26';
    roundRect(g, 1000, 428, 60, 142, 5);
    fillStroke(g, '#3b2a26', '#d3a04a', 3);
    g.fillStyle = '#d3a04a';
    g.beginPath();
    g.arc(1014, 500, 3, 0, TAU);
    g.fill();
    // горшок слева
    g.fillStyle = '#4b382b';
    g.fillRect(812, 538, 32, 30);
    g.fillStyle = '#3b5e4c';
    g.beginPath();
    g.ellipse(828, 526, 26, 25, 0, 0, TAU);
    g.fill();
    // куст справа
    g.fillStyle = '#3b5e4c';
    g.beginPath();
    g.ellipse(1082, 548, 20, 22, 0, 0, TAU);
    g.fill();

    // деревья на переднем плане
    const tree = (x, y, s) => {
      g.save();
      g.translate(x, y);
      g.scale(s, s);
      g.fillStyle = '#3b2c20';
      g.fillRect(-9, -100, 18, 118);
      g.fillStyle = '#354c3d';
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(-25 + i * 18, -112 - (i % 2) * 23, 44, 0, TAU);
        g.fill();
      }
      g.fillStyle = 'rgba(255, 216, 132, 0.12)';
      g.beginPath();
      g.arc(-9, -127, 34, 0, TAU);
      g.fill();
      g.restore();
    };
    tree(62, 610, 1.05);
    tree(1214, 612, 0.9);

    // состаренная бумага
    for (let i = 0; i < 800; i++) {
      g.fillStyle = i % 3 === 0 ? 'rgba(255, 250, 230, 0.055)' : 'rgba(45, 26, 18, 0.035)';
      g.fillRect(seeded(i * 1.5 + 2) * W, seeded(i * 4.4 + 7) * H, 1.2, 1.2);
    }
    mapBgCanvas = c;
  }

  // ---------- сценарии и оверлеи ----------
  const $ = (id) => document.getElementById(id);
  const overlayEl = $('overlay');
  const menuPanel = $('menuPanel');
  const pausePanel = $('pausePanel');
  const resultPanel = $('resultPanel');
  const pauseButton = $('pauseButton');
  const muteButton = $('muteButton');
  const mapBackButton = $('mapBackButton');
  const shopPanel = $('shopPanel');
  const inventoryPanel = $('inventoryPanel');
  const dashTouchBtn = document.querySelector('[data-action="dash"]');
  const superTouchBtn = document.querySelector('[data-action="super"]');
  let dashRingDeg = -1;
  let superTouchReady = null;
  const resultTitle = $('resultTitle');
  const resultKicker = $('resultKicker');
  const resultSub = $('resultSub');
  const resultTime = $('resultTime');
  const resultHits = $('resultHits');
  const panelMap = { menu: menuPanel, pause: pausePanel, result: resultPanel, shop: shopPanel, inventory: inventoryPanel };

  // Настройки управления: переназначение клавиш и редактор мобильных кнопок.
  let keyCaptureAction = null;
  let touchEditActive = false;
  let settingsReturnToPause = false;
  const settingsPanel = document.createElement('section');
  settingsPanel.id = 'settingsPanel';
  settingsPanel.className = 'panel settings-panel';
  settingsPanel.hidden = true;
  settingsPanel.innerHTML = `
    <div class="poster-kicker">Настройки арены</div>
    <h2 class="panel-title">УПРАВЛЕНИЕ</h2>
    <p class="panel-copy">Нажми на клавишу справа и введи новую. На телефоне можно двигать кнопки пальцем.</p>
    <div id="keyBindings" class="key-bindings"></div>
    <div class="settings-options">
      <label class="auto-fire-option"><input id="autoFireSetting" type="checkbox"><span>Автоматическая стрельба</span></label>
      <label class="range-option"><span>Размер кнопок</span><input id="touchScaleSetting" type="range" min="70" max="135" value="100"></label>
      <label class="range-option"><span>Прозрачность</span><input id="touchOpacitySetting" type="range" min="35" max="100" value="94"></label>
    </div>
    <div class="btn-row settings-buttons">
      <button id="editTouchButton" class="btn btn-secondary" type="button">РАССТАВИТЬ КНОПКИ</button>
      <button id="resetTouchButton" class="btn btn-ghost" type="button">СБРОСИТЬ РАСКЛАДКУ</button>
      <button id="closeSettingsButton" class="btn btn-primary" type="button">ГОТОВО</button>
    </div>
    <p id="touchEditHint" class="controls-tip" hidden>Перетаскивай кнопки пальцем. Нажми «ГОТОВО» сверху, чтобы закончить.</p>`;
  overlayEl.appendChild(settingsPanel);

  // Выбор сложности перед каждым боссом.
  const difficultyPanel = document.createElement('section');
  difficultyPanel.id = 'difficultyPanel';
  difficultyPanel.className = 'panel panel-small difficulty-panel';
  difficultyPanel.hidden = true;
  difficultyPanel.innerHTML = `
    <div class="poster-kicker">Выбор босса</div>
    <h2 class="panel-title">СЛОЖНОСТЬ</h2>
    <p id="difficultyBossLine" class="panel-copy">Выбери, каким будет бой.</p>
    <div class="difficulty-grid">
      <button class="difficulty-card is-easy" type="button" data-difficulty="easy">
        <span class="difficulty-icon">☀</span>
        <span class="difficulty-name">ЛЕГКАЯ</span>
        <span class="difficulty-copy">Меньше HP у босса, спокойнее атаки.<br>Хорошо для первого захода.</span>
        <span class="difficulty-tag">РЕКОМЕНДУЕТСЯ</span>
      </button>
      <button class="difficulty-card is-hard" type="button" data-difficulty="hard">
        <span class="difficulty-icon">☠</span>
        <span class="difficulty-name">СЛОЖНАЯ</span>
        <span class="difficulty-copy">Больше HP, быстрее снаряды.<br>Для тех, кто уже видел финал.</span>
        <span class="difficulty-tag">ИСПЫТАНИЕ</span>
      </button>
    </div>
    <div class="btn-row">
      <button id="difficultyBackButton" class="btn btn-ghost" type="button">НАЗАД НА КАРТУ</button>
    </div>`;
  overlayEl.appendChild(difficultyPanel);
  panelMap.difficulty = difficultyPanel;

  const touchEditDone = document.createElement('button');
  touchEditDone.id = 'touchEditDone';
  touchEditDone.className = 'btn btn-primary touch-edit-done';
  touchEditDone.type = 'button';
  touchEditDone.textContent = 'ГОТОВО';
  touchEditDone.hidden = true;
  document.body.appendChild(touchEditDone);

  function renderKeyBindings() {
    const host = $('keyBindings');
    if (!host) return;
    host.innerHTML = '';
    Object.entries(ACTION_LABELS).forEach(([action, label]) => {
      const row = document.createElement('div');
      row.className = 'key-binding-row';
      const name = document.createElement('span');
      name.textContent = label;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'key-bind-button';
      button.textContent = keyLabel(settings.keys[action]);
      button.addEventListener('click', () => {
        keyCaptureAction = action;
        button.textContent = 'НАЖМИ КЛАВИШУ…';
        button.classList.add('is-capturing');
      });
      row.append(name, button);
      host.appendChild(row);
    });
    updateControlHints();
  }

  function captureKeyEvent(e) {
    if (!keyCaptureAction) return false;
    if (['Escape', 'Tab', 'Enter', 'KeyM', 'KeyP'].includes(e.code)) return true;
    const action = keyCaptureAction;
    const conflict = Object.keys(settings.keys).find((a) => a !== action && settings.keys[a] === e.code);
    if (conflict) {
      const old = settings.keys[action];
      settings.keys[action] = e.code;
      settings.keys[conflict] = old;
    } else settings.keys[action] = e.code;
    keyCaptureAction = null;
    saveSettings();
    renderKeyBindings();
    Sound.sfx('click');
    return true;
  }

  function openSettings() {
    settingsReturnToPause = game.scene === 'fight' && game.paused;
    if (game.scene === 'fight' && !game.paused) togglePause(true);
    Object.keys(panelMap).forEach((key) => { panelMap[key].hidden = true; });
    settingsPanel.hidden = false;
    overlayEl.classList.remove('is-hidden');
    document.body.classList.add('settings-open');
    $('autoFireSetting').checked = settings.autoFire;
    $('touchScaleSetting').value = Math.round(settings.touchScale * 100);
    $('touchOpacitySetting').value = Math.round(settings.touchOpacity * 100);
    renderKeyBindings();
  }

  function closeSettings() {
    keyCaptureAction = null;
    finishTouchEdit();
    settingsPanel.hidden = true;
    document.body.classList.remove('settings-open');
    if (settingsReturnToPause && game.scene === 'fight') showPanel('pause');
    else if (game.scene === 'menu') showPanel('menu');
    else showPanel(null);
  }

  function finishTouchEdit() {
    touchEditActive = false;
    document.body.classList.remove('is-editing-touch');
    $('touchEditHint').hidden = true;
    touchEditDone.hidden = true;
    settingsPanel.hidden = false;
    overlayEl.classList.remove('is-hidden');
    $('editTouchButton').textContent = 'РАССТАВИТЬ КНОПКИ';
    saveSettings();
  }

  $('autoFireSetting').addEventListener('change', (e) => { settings.autoFire = e.target.checked; saveSettings(); applyTouchSettings(); });
  $('touchScaleSetting').addEventListener('input', (e) => { settings.touchScale = Number(e.target.value) / 100; saveSettings(); applyTouchSettings(); });
  $('touchOpacitySetting').addEventListener('input', (e) => { settings.touchOpacity = Number(e.target.value) / 100; saveSettings(); applyTouchSettings(); });
  $('editTouchButton').addEventListener('click', () => {
    touchEditActive = !touchEditActive;
    document.body.classList.toggle('is-editing-touch', touchEditActive);
    if (touchEditActive) { settingsPanel.hidden = true; overlayEl.classList.add('is-hidden'); touchEditDone.hidden = false; } else { finishTouchEdit(); }
    $('touchEditHint').hidden = !touchEditActive;
    $('editTouchButton').textContent = touchEditActive ? 'ЗАВЕРШИТЬ РАССТАНОВКУ' : 'РАССТАВИТЬ КНОПКИ';
  });
  touchEditDone.addEventListener('click', finishTouchEdit);
  $('resetTouchButton').addEventListener('click', () => { settings.touchOffsets = {}; applyTouchSettings(); saveSettings(); });
  $('closeSettingsButton').addEventListener('click', closeSettings);
  $('menuSettingsButton').addEventListener('click', openSettings);
  $('pauseSettingsButton').addEventListener('click', openSettings);

  // Установка игры как отдельного приложения (PWA).
  let installPrompt = null;
  const installButton = $('installButton');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    if (installButton) installButton.hidden = true;
  });
  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      try {
        await installPrompt.userChoice;
      } catch (err) {
        /* пользователь мог закрыть окно установки */
      }
      installPrompt = null;
      installButton.hidden = true;
    });
  }

  function showPanel(name) {
    overlayEl.classList.toggle('is-hidden', !name);
    Object.keys(panelMap).forEach((key) => {
      panelMap[key].hidden = key !== name;
    });
    if (mapBackButton) mapBackButton.hidden = !((game.scene === 'map' || game.scene === 'school') && !name);
  }

  function setShopNotice(text) {
    const el = $('shopNotice');
    if (el) el.textContent = text;
  }

  function renderShop() {
    updateMetaUI();
    const buySmoke = $('buySmokeButton');
    const buyAim = $('buyAimButton');
    const buyNutcracker = $('buyNutcrackerButton');
    if (!buySmoke) return;
    buySmoke.disabled = progress.smokeDashOwned || progress.coins < 2;
    buySmoke.textContent = progress.smokeDashOwned ? 'КУПЛЕНО' : '2 МОНЕТЫ';
    if (buyAim) {
      buyAim.disabled = progress.autoAimOwned || progress.coins < 2;
      buyAim.textContent = progress.autoAimOwned ? 'КУПЛЕНО' : '2 МОНЕТЫ';
    }
    if (buyNutcracker) {
      buyNutcracker.disabled = progress.nutcrackerOwned || progress.coins < 3;
      buyNutcracker.textContent = progress.nutcrackerOwned ? 'КУПЛЕНО' : '3 МОНЕТЫ';
    }
  }

  function openShop() {
    game.shopOpen = true;
    setShopNotice('');
    renderShop();
    showPanel('shop');
    Sound.sfx('click');
    releaseAll();
  }

  function closeShop() {
    game.shopOpen = false;
    showPanel(null);
    setShopNotice('');
    clearPressed();
    Sound.sfx('click');
  }

  function buyAutoAim() {
    if (progress.autoAimOwned) {
      setShopNotice('Автонаводка уже куплена. Экипируй её в инвентаре.');
      return;
    }
    if (progress.coins < 2) {
      setShopNotice('Нужно 2 монеты. Победи боссов ещё раз!');
      Sound.sfx('hurt');
      return;
    }
    progress.coins -= 2;
    progress.autoAimOwned = true;
    saveProgress();
    updateMetaUI();
    renderShop();
    setShopNotice('Автонаводка куплена. Это модификатор атаки — экипируй его в инвентаре.');
    Sound.sfx('win');
  }

  function buySmoke() {
    if (progress.smokeDashOwned) {
      setShopNotice('Дымовая завеса уже куплена. Экипируй её в инвентаре.');
      return;
    }
    if (progress.coins < 2) {
      setShopNotice('Нужно 2 монеты. Победи боссов ещё раз!');
      Sound.sfx('hurt');
      return;
    }
    progress.coins -= 2;
    progress.smokeDashOwned = true;
    saveProgress();
    updateMetaUI();
    renderShop();
    setShopNotice('Дымовая завеса куплена. Экипируй перк в инвентаре.');
    Sound.sfx('win');
  }

  function buyNutcracker() {
    if (progress.nutcrackerOwned) {
      setShopNotice('Щелкунчик уже куплен. Экипируй его в инвентаре.');
      Sound.sfx('click');
      return;
    }
    if (progress.coins < 3) {
      setShopNotice('Нужно 3 монеты. Монета также лежит в школьном коридоре!');
      Sound.sfx('hurt');
      return;
    }
    progress.coins -= 3;
    progress.nutcrackerOwned = true;
    saveProgress();
    updateMetaUI();
    renderShop();
    setShopNotice('Щелкунчик куплен. Это модификатор атаки — экипируй его в инвентаре.');
    Sound.sfx('win');
  }

  if ($('buySmokeButton')) $('buySmokeButton').addEventListener('click', buySmoke);
  if ($('buyAimButton')) $('buyAimButton').addEventListener('click', buyAutoAim);
  if ($('buyNutcrackerButton')) $('buyNutcrackerButton').addEventListener('click', buyNutcracker);
  if ($('closeShopButton')) $('closeShopButton').addEventListener('click', closeShop);

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function startGame(bossId, difficulty) {
    if (typeof bossId === 'string' && BOSS_CONFIG[bossId]) game.bossId = bossId;
    if (!BOSS_CONFIG[game.bossId]) game.bossId = 'letunov';
    if (typeof difficulty === 'string' && DIFFICULTY_CONFIG[difficulty]) game.difficulty = difficulty;
    Sound.init();
    resetWorld();
    if (game.bossId === 'elena') setupElenaArena();
    // Егор больше не начинает с банановой фазы: сразу вторая фаза,
    // где он сидит на дереве, а по бокам стоят пальмы.
    if (game.bossId === 'egor') {
      startEgorPhase2();
      game.egorClouds = false;
    }
    game.scene = 'fight';
    game.introT = 1.9;
    game.fightTime = 0;
    game.hitsTaken = 0;
    game.coinEarned = false;
    document.body.dataset.scene = 'fight';
    document.body.classList.remove('is-paused');
    showPanel(null);
    Sound.setIntensity(1);
    Sound.startMusic();
    Sound.sfx('click');
    releaseAll();
  }

  function goMenu() {
    Sound.stopMusic();
    Sound.setIntensity(1);
    game.bossId = 'letunov';
    resetWorld();
    game.scene = 'menu';
    document.body.dataset.scene = 'menu';
    document.body.classList.remove('is-paused');
    showPanel('menu');
    updateMetaUI();
    releaseAll();
  }

  function goMap() {
    Sound.stopMusic();
    Sound.setIntensity(1);
    resetWorld();
    game.scene = 'map';
    hero.x = 620;
    hero.hp = hero.maxHp;
    hero.face = 1;
    hero.vx = 0;
    document.body.dataset.scene = 'map';
    document.body.classList.remove('is-paused');
    showPanel(null);
    updateMetaUI();
    releaseAll();
  }

  function togglePause(force) {
    if (game.scene !== 'fight' || game.ended) return;
    const want = force === undefined ? !game.paused : !!force;
    if (want === game.paused) return;
    game.paused = want;
    document.body.classList.toggle('is-paused', want);
    clearPressed();
    if (want) {
      releaseAll();
      Sound.stopMusic();
      showPanel('pause');
      Sound.sfx('click');
    } else {
      showPanel(null);
      Sound.startMusic();
      Sound.sfx('click');
    }
  }

  function finishGame(win) {
    if (game.ended) return;
    game.ended = true;
    game.scene = win ? 'win' : 'lose';
    game.paused = false;
    document.body.dataset.scene = game.scene;
    document.body.classList.remove('is-paused');
    releaseAll();
    Sound.stopMusic();
    Sound.sfx(win ? 'win' : 'lose');
    const cfg = BOSS_CONFIG[game.bossId] || BOSS_CONFIG.letunov;
    let rewardText = '';
    if (win) {
      progress.wins[cfg.id] = (progress.wins[cfg.id] || 0) + 1;
      const diffKey = game.difficulty === 'hard' ? 'hard' : 'easy';
      if (!progress.bossCoins[cfg.id]) {
        progress.bossCoins[cfg.id] = { easy: false, hard: false };
      }
      let heartDropped = false;
      if (!progress.bossCoins[cfg.id][diffKey]) {
        progress.bossCoins[cfg.id][diffKey] = true;
        progress.coins += 1;
        rewardText = ' Получена 1 монета!';
      } else {
        rewardText = ' Монета за эту сложность уже получена.';
      }
      if (cfg.id === 'letunov' && !progress.letunovHeart) {
        progress.letunovHeart = true;
        progress.bonusHearts = 1;
        progress.heartBought = true;
        heartDropped = true;
        hero.maxHp = heroMaxHp();
        hero.hp = hero.maxHp;
      }
      // Ключи — постоянный прогресс, как и монеты.
      if (cfg.id === 'elena' && !progress.nikitaKey) {
        progress.nikitaKey = true;
        rewardText += ' Ключ от тёмного кабинета получен!';
      }
      saveProgress();
      if (heartDropped) {
        rewardText += ' Сердце Летунова выпало: +1 сердце навсегда!';
      }
      updateMetaUI();
    }
    resultKicker.textContent = win ? 'Финал представления' : 'Публика ахнула';
    resultTitle.textContent = win ? 'ПОБЕДА!' : 'НОКАУТ!';
    const diffLabel = DIFFICULTY_CONFIG[game.difficulty]?.name || 'ЛЕГКАЯ';
    if (win) {
      resultSub.textContent =
        `${cfg.name} повержен на сложности «${diffLabel}»!${rewardText} ` +
        'Загляни на карту — монеты пригодятся в магазине.';
    } else {
      resultSub.textContent =
        cfg.id === 'denis'
          ? `Денис снова взял верх на сложности «${diffLabel}». Прокачайся в магазине и попробуй ещё раз.`
          : cfg.id === 'egor'
            ? `Егор снова ушёл в лес на сложности «${diffLabel}». Купи усиления в магазине и возвращайся.`
            : cfg.id === 'elena'
              ? `Елена Гурьевна оставила тебя после уроков на сложности «${diffLabel}». Соберись и зайди в кабинет снова.`
              : cfg.id === 'nikita'
                ? `Никита и Степа снова скрылись в тёмном кабинете на сложности «${diffLabel}». Запасись сердцем и возвращайся.`
                : `Летунов ещё катается по арене на сложности «${diffLabel}». Отдышись и попробуй снова.`;
    }
    resultTime.textContent = formatTime(game.fightTime);
    resultHits.textContent = String(game.hitsTaken);
    resultPanel.classList.toggle('is-win', win);
    resultPanel.classList.toggle('is-lose', !win);
    showPanel('result');
    clearPressed();
  }

  $('startButton').addEventListener('click', goMap);
  let inventoryReturnPanel = 'menu';
  if ($('menuInventoryButton')) {
    $('menuInventoryButton').addEventListener('click', () => {
      Sound.sfx('click');
      inventoryReturnPanel = 'menu';
      updateInventoryUI();
      showPanel('inventory');
    });
  }
  if ($('openShopInventoryButton')) {
    $('openShopInventoryButton').addEventListener('click', () => {
      Sound.sfx('click');
      inventoryReturnPanel = 'shop';
      updateInventoryUI();
      showPanel('inventory');
    });
  }
  if ($('closeInventoryButton')) {
    $('closeInventoryButton').addEventListener('click', () => {
      Sound.sfx('click');
      if (inventoryReturnPanel === 'shop' && game.shopOpen) {
        renderShop();
        showPanel('shop');
      } else {
        showPanel('menu');
      }
    });
  }
  const invWeaponEl = $('invWeapon');
  if (invWeaponEl) {
    invWeaponEl.addEventListener('click', () => {
      const order = ['pistol'];
      if (progress.nutcrackerOwned) order.push('nutcracker');
      if (progress.autoAimOwned) order.push('autoaim');
      if (order.length > 1) {
        const current = order.indexOf(equippedAttackMod());
        equipAttackMod(order[(current + 1) % order.length]);
      }
      Sound.sfx('click');
    });
  }
  const invPerkEl = $('invPerk');
  if (invPerkEl) {
    invPerkEl.addEventListener('click', () => {
      if (!progress.smokeDashOwned) {
        Sound.sfx('click');
        return;
      }
      progress.smokeDash = !progress.smokeDash;
      saveProgress();
      updateMetaUI();
      Sound.sfx('click');
    });
  }
  $('retryButton').addEventListener('click', () => startGame(game.bossId));
  $('resumeButton').addEventListener('click', () => togglePause(false));
  $('restartButton').addEventListener('click', () => startGame(game.bossId));
  $('quitButton').addEventListener('click', goMenu);
  $('menuButton').addEventListener('click', goMap);
  if (mapBackButton) mapBackButton.addEventListener('click', () => {
    if (game.scene === 'school') goMap();
    else goMenu();
  });
  pauseButton.addEventListener('click', () => {
    Sound.sfx('click');
    togglePause();
  });
  muteButton.addEventListener('click', () => Sound.toggleMute());

  function canvasToWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / Math.max(1, rect.width));
    const py = (e.clientY - rect.top) * (canvas.height / Math.max(1, rect.height));
    return { x: (px - viewOX) / viewScale, y: (py - viewOY) / viewScale };
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (game.scene !== 'map' || game.shopOpen) return;
    const p = canvasToWorld(e);
    if (p.y < 120 || p.y > GROUND + 30) return;
    for (const b of MAP_BUILDINGS) {
      if (Math.abs(p.x - b.x) < 190) {
        e.preventDefault();
        enterBuilding(b.id);
        return;
      }
    }
  });

  // ---------- герой ----------
  // Есть ли под указанной платформой пол, на который можно упасть.
  function floorLevelBelow(y, x) {
    let best = game.egorClouds ? null : GROUND;
    for (const p of platforms) {
      if (!p.solid) continue;
      if (p.y <= y + 6) continue;
      if (Math.abs(x - p.x) > p.w / 2 - 6) continue;
      if (best === null || p.y < best) best = p.y;
    }
    return best;
  }

  // Ближайшее облако под героем. Нужно для спуска вниз через приседание.
  // Если облака ниже нет (нижнее облако), падать нельзя.
  function cloudLevelBelow(y, x) {
    let best = null;
    for (const p of platforms) {
      if (p.kind !== 'egorCloud' || !p.solid) continue;
      if (p.y <= y + 8) continue;
      if (Math.abs(x - p.x) > p.w / 2 - 6) continue;
      if (best === null || p.y < best) best = p.y;
    }
    return best;
  }

  function updateHero(dt) {
    const h = hero;

    h.idleT += dt;
    h.invuln = Math.max(0, h.invuln - dt);
    h.dashCd = Math.max(0, h.dashCd - dt);
    if (dashTouchBtn) {
      const deg = Math.round(clamp(1 - h.dashCd / 0.72, 0, 1) * 360);
      if (deg !== dashRingDeg) {
        dashRingDeg = deg;
        dashTouchBtn.style.setProperty('--cd', deg + 'deg');
      }
    }
    if (superTouchBtn) {
      const readyNow = h.cards >= 1 && h.superCd <= 0 && !h.dead;
      if (readyNow !== superTouchReady) {
        superTouchReady = readyNow;
        superTouchBtn.classList.toggle('is-ready', readyNow);
      }
    }
    h.shootCd = Math.max(0, h.shootCd - dt);
    h.shootAnim = Math.max(0, h.shootAnim - dt * 7);
    h.hurtT = Math.max(0, h.hurtT - dt);
    h.landT = Math.max(0, h.landT - dt);
    h.jumpBuf = Math.max(0, h.jumpBuf - dt);
    h.coyote = Math.max(0, h.coyote - dt);
    h.dropT = Math.max(0, h.dropT - dt);
    h.parryT = Math.max(0, h.parryT - dt);
    h.superCd = Math.max(0, h.superCd - dt);
    h.superT = Math.max(0, h.superT - dt);
    if (h.smokeDashActive) {
      h.smokeT = Math.max(0, h.smokeT - dt);
      if (h.smokeT <= 0) {
        h.smokeDashActive = false;
        spawnDust(h.x, h.y, 10, 1.1);
        spawnRing(h.x, GROUND - 42, 'rgba(236, 229, 204, 0.7)', 26);
        Sound.sfx('dash');
      }
    }

    if (h.dead) {
      h.deadT += dt;
      h.vy += 2600 * dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.vx = damp(h.vx, 0, 2.6, dt);
      h.x = clamp(h.x, ARENA_L, ARENA_R);
      if (h.y >= GROUND) {
        h.y = GROUND;
        h.vy = 0;
      }
      return;
    }

    // парирование: нажать прыжок в воздухе рядом с розовым сердцем.
    // Никакой перезарядки нет — цепочку парирований можно делать сразу.
    if (pressed.jump && !held.lock && !h.onGround && tryParry()) {
      pressed.jump = false;
      h.jumpBuf = 0;
    }

    if (pressed.jump && !held.lock) h.jumpBuf = 0.13;
    // Супер запускается ТОЛЬКО кнопкой (E или ★), никогда сам.
    if (pressed.super) trySuperAttack();
    if (pressed.lock) {
      spawnComic('ЗАМОК · ТОЛЬКО ПРИЦЕЛ', h.x, h.y - 156, 18, '#9fd7ff');
      Sound.sfx('click');
    }

    const locked = held.lock;
    const moveInput = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    const move = h.hurtT > 0 || locked ? 0 : moveInput;
    if (locked && moveInput !== 0) {
      // В замке A/D и горизонталь джойстика только поворачивают героя.
      h.face = moveInput;
      h.lastMove = moveInput;
    } else if (move !== 0) {
      h.face = move;
      h.lastMove = move;
    } else if (touchAim.active && Math.abs(touchAim.x) > 0.24) {
      // джойстик вверх-влево/вверх-вправо только поворачивает героя
      h.face = touchAim.x < 0 ? -1 : 1;
      h.lastMove = h.face;
    }

    // Прицел: горизонтально, вверх или по диагонали. Вниз оружие больше
    // не опускается — нижняя половина джойстика только приседает.
    let aimX = h.face;
    let aimY = 0;
    const joyAim = touchAim.active ? Math.hypot(touchAim.x, touchAim.y) : 0;
    if (joyAim > 0.22) {
      const ax = Math.abs(touchAim.x) < 0.16 ? 0 : touchAim.x;
      const ay = Math.abs(touchAim.y) < 0.16 ? 0 : touchAim.y;
      aimX = ax;
      aimY = ay;
      if (aimX === 0 && aimY === 0) aimX = h.face;
    } else if (held.aimUp) {
      const side = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      aimX = side === 0 ? 0 : side;
      aimY = -1;
    }
    if (aimY > 0) aimY = 0;
    if (aimX === 0 && aimY === 0) aimX = h.face;
    const aimLen = Math.hypot(aimX, aimY) || 1;
    h.aimX = aimX / aimLen;
    h.aimY = aimY / aimLen;

    // присед спасает от растянутого живота и от кулака
    const wantCrouch = held.crouch && h.onGround && h.dashT <= 0 && h.hurtT <= 0 && !h.dead;
    h.crouchK = approach(h.crouchK, wantCrouch ? 1 : 0, dt * 9);
    const crouched = h.crouchK > 0.6;

    const canShoot =
      game.scene === 'fight' && game.introT <= 0.9 && !boss.dying && h.hurtT <= 0;
    const shooting =
      canShoot && (settings.autoFire || held.shoot) && h.dashT <= 0;

    // старт рывка
    if (
      pressed.dash &&
      h.dashT <= 0 &&
      h.dashCd <= 0 &&
      h.hurtT <= 0 &&
      (h.onGround || !h.airDashUsed)
    ) {
      const dir = move || h.lastMove || h.face;
      h.dashT = 0.17;
      h.dashDir = dir;
      h.face = dir;
      h.dashCd = 0.72;
      if (progress.smokeDash) h.invuln = Math.max(h.invuln, 0.58);
      h.vy = 0;
      h.ghostT = 0;
      if (!h.onGround) h.airDashUsed = true;
      spawnDust(h.x, h.y, 5, 0.7);
      if (progress.smokeDash) {
        h.smokeT = 0.22;
        h.smokeDashActive = true;
        spawnSmokeCloud(h.x, h.y);
      } else {
        addGhost();
      }
      Sound.sfx('dash');
      game.shake = Math.max(game.shake, 2.5);
    }

    // С облака Егора можно спрыгнуть только приседом и прыжком сразу.
    let wantCloudDrop = false;
    if (
      pressed.jump &&
      held.crouch &&
      h.onGround &&
      game.egorClouds &&
      !game.egorCloudFinale
    ) {
      for (const p of platforms) {
        if (p.kind !== 'egorCloud' || !p.solid) continue;
        if (Math.abs(h.x - p.x) > p.w / 2 - 6) continue;
        if (Math.abs(h.y - p.y) > 6) continue;
        if (cloudLevelBelow(p.y, h.x) === null) continue;
        wantCloudDrop = true;
        break;
      }
    }
    if (wantCloudDrop) {
      h.jumpBuf = 0;
      h.dropT = 0.34;
      h.onGround = false;
      h.vy = 240;
      h.y += 2;
      spawnDust(h.x, h.y, 4, 0.6);
      Sound.sfx('dash');
    } else if (
      h.jumpBuf > 0 &&
      (h.onGround || h.coyote > 0) &&
      h.dashT <= 0 &&
      h.hurtT <= 0
    ) {
      h.vy = -940;
      h.onGround = false;
      h.coyote = 0;
      h.jumpBuf = 0;
      h.landT = 0;
      h.crouchK = 0;
      spawnDust(h.x, h.y, 6, 0.8);
      Sound.sfx('jump');
    }

    if (h.dashT > 0) {
      h.dashT = Math.max(0, h.dashT - dt);
      h.vx = h.dashDir * 935;
      h.vy = 0;
      h.ghostT -= dt;
      if (h.ghostT <= 0) {
        h.ghostT = 0.032;
        addGhost();
      }
    } else if (h.hurtT > 0) {
      h.vx = damp(h.vx, 0, 2.1, dt);
      h.vy = Math.min(h.vy + 2900 * dt, 1500);
    } else {
      const accel = h.onGround ? (crouched ? 1800 : 3800) : 2600;
      const maxSpeed = crouched ? 105 : 330;
      h.vx = approach(h.vx, move * maxSpeed, accel * dt);
      const gravity = h.vy < 0 ? (held.jump ? 2350 : 3800) : 3100;
      h.vy = Math.min(h.vy + gravity * dt, 1500);
    }

    // огонь: ровно один выстрел каждые 0.2 секунды, урон прежний
    if (shooting && h.shootCd <= 0) {
      h.shootCd = 0.2;
      h.shootAnim = 1;
      fireBullet();
      game.shake = Math.max(game.shake, 0.5);
    }
    if (h.hurtT > 0) h.shootAnim = 0;

    // интеграция
    const prevY = h.y;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    if (h.x < ARENA_L) {
      h.x = ARENA_L;
      h.vx = Math.max(0, h.vx);
    } else if (h.x > ARENA_R) {
      h.x = ARENA_R;
      h.vx = Math.min(0, h.vx);
    }
    // За спину Дениса не зайти: он стоит у правого края арены.
    if (game.scene === 'fight' && game.bossId === 'denis' && !boss.dying) {
      const denisWall = boss.x - 176;
      if (h.x > denisWall) {
        h.x = denisWall;
        h.vx = Math.min(0, h.vx);
      }
    }

    // одна-единственная платформа под ногами — трамплин-доска
    let floorY = game.egorClouds ? Infinity : GROUND;
    if (h.vy >= 0) {
      for (const p of platforms) {
        if (!p.solid) continue;
        if (Math.abs(h.x - p.x) > p.w / 2 - 6) continue;
        if (prevY <= p.y + 3 && h.y >= p.y) {
          // Присед на обычной платформе: падаем вниз, если под ней есть пол.
          // Присед на облаке: падаем на облако ниже. С нижнего облака
          // падать нельзя — там бездна, поэтому герой остаётся на месте.
          const canDropCloud =
            game.egorClouds &&
            !game.egorCloudFinale &&
            p.kind === 'egorCloud' &&
            h.dropT > 0 &&
            cloudLevelBelow(p.y, h.x) !== null;
          const canDropNormal =
            !game.egorClouds && held.crouch && floorLevelBelow(p.y, h.x) !== null;
          if (canDropCloud || canDropNormal) {
            h.dropT = 0.18;
            continue;
          }
          // Самое нижнее облако всегда ловит героя, даже если он только что
          // провалился сквозь верхнее на большой скорости.
          const lowestCloud =
            game.egorClouds &&
            p.kind === 'egorCloud' &&
            cloudLevelBelow(p.y, h.x) === null;
          if (h.dropT > 0 && !lowestCloud) continue;
          floorY = Math.min(floorY, p.y);
        }
      }
      if (h.y >= floorY) {
        if (!h.onGround && h.vy > 380) {
          h.landT = 0.14;
          spawnDust(h.x, floorY, 5, 0.9);
          Sound.sfx('land');
          game.shake = Math.max(game.shake, 1.6);
        }
        h.y = floorY;
        h.vy = 0;
        h.onGround = true;
        h.airDashUsed = false;
        h.coyote = 0.09;
      } else {
        h.onGround = false;
      }
    } else {
      h.onGround = false;
    }

    if (h.onGround && h.dashT <= 0) {
      h.runT += Math.abs(h.vx) * dt * 0.045;
    }
  }

  function parrySuccess(x, y, label = 'ПАРИРУЙ!') {
    const h = hero;
    h.vy = -880;
    h.onGround = false;
    h.parryT = 0.55;
    h.invuln = Math.max(h.invuln, 0.75);
    h.cards = Math.min(5, h.cards + 1);
    game.flash = 0.22;
    game.flashColor = PINK_BRIGHT;
    game.shake = Math.max(game.shake, 5);
    spawnRing(x, y, PINK_BRIGHT, 34);
    spawnRing(x, y, CREAM, 18);
    for (let k = 0; k < 18; k++) {
      addParticle({
        kind: 'star',
        x,
        y,
        vx: rand(-280, 280),
        vy: rand(-320, 90),
        life: rand(0.3, 0.8),
        maxLife: 0.8,
        size: rand(3, 9),
        color: pick([PINK, PINK_BRIGHT, GOLD_BRIGHT]),
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        grav: 420,
        drag: 0.8,
      });
    }
    spawnComic(label, x, y - 42, 30, PINK_BRIGHT);
    Sound.sfx('parry');
  }

  // Парировать можно только при реальном касании розового предмета:
  // сверяем пиксели предмета с телом героя, без большого радиуса-подсказки.
  function parryTouchesCircle(x, y, r, extra = 0) {
    return circleRect(x, y, r + extra, heroRect());
  }

  function parryTouchesRect(rect, extra = 0) {
    if (extra <= 0) return overlap(heroRect(), rect);
    const padded = {
      x: rect.x - extra,
      y: rect.y - extra,
      w: rect.w + extra * 2,
      h: rect.h + extra * 2,
    };
    return overlap(heroRect(), padded);
  }

  function parryWaveRect(w) {
    // Волна рисуется от пола на ~50 px вверх и шириной ~90 px.
    return { x: w.x - 45, y: GROUND - 50, w: 90, h: 50 };
  }

  function tryParry() {
    // Парируются только розовые атаки боссов, а не случайные орбы.
    for (let i = soundWaves.length - 1; i >= 0; i--) {
      const w = soundWaves[i];
      if (!w.parryable || !parryTouchesCircle(w.x, w.y, w.r, 4)) continue;
      soundWaves.splice(i, 1);
      parrySuccess(w.x, w.y);
      return true;
    }
    for (let i = bossShots.length - 1; i >= 0; i--) {
      const s = bossShots[i];
      if (!s.parryable || !parryTouchesCircle(s.x, s.y, s.r, 4)) continue;
      bossShots.splice(i, 1);
      if (s.kind === 'flower') spawnPetalBurst(s.x, s.y, s.color, 14);
      parrySuccess(s.x, s.y);
      return true;
    }
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i];
      if (!w.parryable || !parryTouchesRect(parryWaveRect(w), 4)) continue;
      waves.splice(i, 1);
      parrySuccess(w.x, GROUND - 40);
      return true;
    }
    for (let i = windCharges.length - 1; i >= 0; i--) {
      const w = windCharges[i];
      if (!w.parryable || !parryTouchesCircle(w.x, w.y, w.r, 4)) continue;
      windCharges.splice(i, 1);
      spawnRing(w.x, w.y, PINK_BRIGHT, 34);
      parrySuccess(w.x, w.y);
      return true;
    }
    for (const t of turrets) {
      if (!t.parryable || t.dive) continue;
      if (!parryTouchesCircle(t.x, t.y, 32, 4)) continue;
      t.parryable = false;
      t.fireT = 0;
      parrySuccess(t.x, t.y, 'ТУРЕЛЬ!');
      return true;
    }
    return false;
  }

  function addSuperCharge(amount) {
    if (hero.cards >= 5) return;
    hero.cardCharge += amount;
    while (hero.cardCharge >= SUPER_CARD_DAMAGE && hero.cards < 5) {
      hero.cardCharge -= SUPER_CARD_DAMAGE;
      hero.cards++;
      Sound.sfx('card');
      spawnComic('ЗВЕЗДА!', hero.x, hero.y - 130, 22, GOLD_BRIGHT);
    }
    if (hero.cards >= 5) hero.cardCharge = 0;
  }

  function trySuperAttack() {
    const h = hero;
    const cards = clamp(h.cards, 0, 5);
    if (game.scene !== 'fight' || h.dead || h.superCd > 0 || cards < 1) return;
    const ultimate = cards >= 5;
    // Без пяти карт тратится ровно одна звезда. Пять карт — ульта,
    // одинаковая для любого оружия.
    const spent = ultimate ? 5 : 1;
    const power = ultimate ? SUPER_MAX_DAMAGE : SUPER_MIN_DAMAGE;
    const scale = ultimate ? 1.2 : 0.55;
    h.cards -= spent;
    if (h.cards < 0) h.cards = 0;
    if (ultimate) h.cardCharge = 0;
    h.superCd = 1.2;
    h.superT = 1;
    h.invuln = Math.max(h.invuln, 1.35);
    h.shootAnim = 0;
    game.hitStop = 0.06 + (ultimate ? 0.06 : 0.012);
    game.flash = ultimate ? 0.5 : 0.3;
    game.flashColor = ultimate ? GOLD_BRIGHT : '#e46b62';
    game.shake = Math.max(game.shake, (ultimate ? 6 : 4) + spent * 2.4);
    waves.length = 0;
    const ax = h.aimX || h.face || 1;
    const ay = h.aimY || 0;
    const dir = ax >= 0 ? 1 : -1;

    if (!ultimate && progress.weapon === 'nutcracker') {
      spawnNutcrackerTurret();
      spawnComic('ТУРЕЛЬ ЩЕЛКУНЧИКА!', h.x, h.y - 150, 26, '#ff7a6b');
      spawnRing(h.x, h.y - 60, '#ff8b71', 70);
      Sound.sfx('super');
      return;
    }

    bullets.push({
      x: h.x + ax * 48,
      y: h.y - 56 + ay * 44,
      vx: ax * 980,
      vy: ay * 980,
      life: 1.4,
      t: 0,
      dir,
      dead: false,
      big: true,
      dmg: power / (progress.autoAim ? 1.3 : 1),
      r: 54 * scale,
      superScale: scale,
      superCards: cards,
    });
    spawnComic(ultimate ? 'МОЩНАЯ СУПЕР-ЗВЕЗДА!' : 'СУПЕР ЗА 1 КАРТУ!', h.x, h.y - 150, ultimate ? 42 : 30, GOLD_BRIGHT);
    spawnRing(h.x, h.y - 60, GOLD_BRIGHT, 70);
    spawnRing(h.x, h.y - 60, CREAM, 44);
    for (let i = 0; i < 18 + spent * 4; i++) {
      addParticle({
        kind: 'star',
        x: h.x + rand(-40, 40),
        y: h.y - rand(20, 130),
        vx: rand(-330, 330),
        vy: rand(-430, 40),
        life: rand(0.4, 1.1),
        maxLife: 1.1,
        size: rand(4, 12),
        color: pick([GOLD, GOLD_BRIGHT, CREAM, RUST]),
        rot: rand(0, TAU),
        vr: rand(-12, 12),
        grav: 380,
        drag: 0.7,
      });
    }
    Sound.sfx('super');
  }

  function fireBullet() {
    const h = hero;
    // Прицел идёт за джойстиком/стрелкой вверх: горизонтально, вверх или наискосок.
    const ax = h.aimX || h.face || 1;
    const ay = h.aimY || 0;
    const crouchK = clamp(h.crouchK, 0, 1);
    const bx = h.x + ax * 34;
    const by = h.y - lerp(52, 32, crouchK) + ay * 32;
    const nutcracker = progress.weapon === 'nutcracker' && progress.nutcrackerOwned;
    // Щелкунчик: сначала обычный красный снаряд летит прямо, а через
    // пару метров начинает мягко подруливать к боссу (полунаводка).
    const baseAng = Math.atan2(ay || 0, ax || 1);
    const speed = nutcracker ? 1050 : 1180;
    bullets.push({
      x: bx,
      y: by,
      vx: Math.cos(baseAng) * speed,
      vy: Math.sin(baseAng) * speed,
      life: nutcracker ? 1.7 : 1.5,
      t: 0,
      dir: Math.cos(baseAng) >= 0 ? 1 : -1,
      dead: false,
      dmg: 9 / (progress.autoAim ? 1.3 : 1),
      nutcracker,
      green: false,
      homing: false,
      homingAfter: nutcracker ? 132 : 0,
      travel: 0,
      hitSomething: false,
    });
    for (let i = 0; i < 4; i++) {
      addParticle({
        kind: 'spark',
        x: bx,
        y: by,
        vx: ax * rand(40, 240) + rand(-60, 60),
        vy: ay * rand(40, 240) + rand(-110, 90),
        life: rand(0.08, 0.2),
        maxLife: 0.2,
        size: rand(2, 5),
        color: nutcracker ? pick(['#ff8e7c', '#ffc2b8', '#ff5f4f']) : pick([GOLD_BRIGHT, CREAM, RUST]),
        rot: rand(0, TAU),
        vr: rand(-10, 10),
        grav: 300,
        drag: 2,
      });
    }
    Sound.sfx('shoot');
  }

  function spawnNutcrackerTurret() {
    const h = hero;
    const standing = turrets.find((t) => !t.dive && !t.dead && t.life > 0);
    if (standing) {
      // Если турель уже стоит, новая сразу летит в босса.
      turrets.push({
        x: h.x + 18,
        y: Math.max(130, h.y - 170),
        t: 0,
        life: 5,
        dive: true,
        parryable: false,
        dead: false,
        vx: 0,
        vy: 0,
        spin: 0,
      });
      Sound.sfx('shoot');
      return;
    }
    turrets.push({
      x: h.x,
      y: Math.max(130, h.y - 190),
      baseY: Math.max(130, h.y - 190),
      t: 0,
      life: 8,
      shotsLeft: 6,
      fireT: 0.55,
      parryable: true,
      dive: false,
      dead: false,
      spin: 0,
    });
    spawnRing(h.x, h.y - 190, '#ff7a6b', 26);
  }

  function updateTurrets(dt) {
    for (let i = turrets.length - 1; i >= 0; i--) {
      const t = turrets[i];
      t.t += dt;
      t.life -= dt;
      t.spin += dt * 2.4;
      if (t.dive) {
        const target = autoAimPoint() || { x: W / 2, y: GROUND - 220 };
        const dx = target.x - t.x;
        const dy = target.y - t.y;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 1050;
        t.vx = (dx / dist) * speed;
        t.vy = (dy / dist) * speed;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        if (dist < 42) {
          damageBoss(120, t.x, t.y, false);
          game.shake = Math.max(game.shake, 11);
          game.flash = Math.max(game.flash, 0.18);
          game.flashColor = '#ff9d7d';
          spawnRing(t.x, t.y, '#ff8b71', 40);
          spawnRing(t.x, t.y, CREAM, 22);
          spawnComic('ТУРЕЛЬ-СНАРЯД!', t.x, t.y - 40, 20, '#ffb08e');
          addSuperCharge(120);
          t.dead = true;
        }
        if (t.life <= 0 || t.x < -80 || t.x > W + 80) t.dead = true;
      } else {
        t.y = t.baseY + Math.sin(t.t * 3.1) * 5;
        t.fireT -= dt;
        if (t.shotsLeft > 0 && t.fireT <= 0) {
          const target = autoAimPoint();
          const tx = target ? target.x : t.x + 500;
          const ty = target ? target.y : t.y;
          const ang = Math.atan2(ty - t.y, tx - t.x);
          bullets.push({
            x: t.x + Math.cos(ang) * 20,
            y: t.y + Math.sin(ang) * 20,
            vx: Math.cos(ang) * 1150,
            vy: Math.sin(ang) * 1150,
            life: 1.6,
            t: 0,
            dir: Math.cos(ang) >= 0 ? 1 : -1,
            dead: false,
            dmg: 9 / (progress.autoAim ? 1.3 : 1),
            turretShot: true,
            hitSomething: false,
          });
          spawnRing(t.x, t.y, '#ff9d7d', 10);
          t.shotsLeft--;
          t.fireT = 0.28;
          Sound.sfx('shoot');
        }
        if ((t.shotsLeft <= 0 && t.fireT <= -0.5) || t.life <= 0) t.dead = true;
      }
      if (t.dead) turrets.splice(i, 1);
    }
  }

  function addGhost() {
    if (ghosts.length > 9) ghosts.shift();
    ghosts.push({ x: hero.x, y: hero.y, face: hero.face, life: 0.22, maxLife: 0.22 });
  }

  // ---------- босс ----------
  function setBossState(state) {
    boss.state = state;
    boss.timer = 0;
  }

  function enterSlamWind(short) {
    const b = boss;
    setBossState('slamWind');
    b.face = hero.x < b.x ? -1 : 1;
    b.markX = clamp(hero.x + hero.vx * 0.22, 320, 1040);
    b.airY = 0;
    b.fist.active = false;
    b.slamShort = !!short;
    Sound.sfx('telegraph');
  }

  function startSlam() {
    boss.slamLeft = boss.phase === 2 && Math.random() < 0.5 ? 1 : 0;
    enterSlamWind();
  }

  function enterPunchWind() {
    const b = boss;
    setBossState('punchWind');
    b.face = hero.x < b.x ? -1 : 1;
    b.fist.dist = 0;
    b.fist.active = false;
    b.airY = 0;
    Sound.sfx('telegraph');
  }

  function startPunch() {
    boss.punchLeft = boss.phase === 2 && Math.random() < 0.4 ? 2 : 1;
    enterPunchWind();
  }

  function enterBellyWind() {
    const b = boss;
    setBossState('bellyWind');
    b.face = hero.x < b.x ? -1 : 1;
    b.bellyExtend = 0;
    b.fist.active = false;
    Sound.sfx('telegraph');
  }

  function enterHopWind(short) {
    const b = boss;
    setBossState('hopWind');
    b.face = hero.x < b.x ? -1 : 1;
    b.markX = clamp(hero.x + hero.vx * 0.2, 240, 1080);
    b.airY = 0;
    b.fist.active = false;
    b.hopShort = !!short;
    if (b.hopLeft <= 0) b.hopLeft = 2;
    Sound.sfx('telegraph');
  }

  function enterChalkWind() {
    const b = boss;
    setBossState('chalkWind');
    b.face = hero.x < b.x ? -1 : 1;
    b.airY = 0;
    b.fist.active = false;
    b.bellyExtend = 0;
    Sound.sfx('telegraph');
    spawnComic('МЕЛОВОЙ ЗАЛП!', b.x, GROUND - 448, 18, GOLD_BRIGHT);
  }

  function spawnChalkShot(index, count) {
    const b = boss;
    const center = hero.y - HERO_H * 0.5;
    const y = clamp(center + (index - (count - 1) / 2) * 54, GROUND - 258, GROUND - 32);
    const parryable = count > 1 && index === Math.floor(count / 2);
    bossShots.push({
      x: b.x + b.face * 92,
      y,
      vx: b.face * (b.phase === 2 ? 500 : 430),
      r: 13,
      life: 3.4,
      t: 0,
      parryable,
      spin: rand(0, TAU),
      dir: b.face,
    });
    if (parryable && !b.parryTipShown) {
      b.parryTipShown = true;
      spawnComic('РОЗОВЫЙ МЕЛ — ПАРИРУЙ В ПРЫЖКЕ!', W / 2, GROUND - 340, 15, PINK_BRIGHT);
    }
  }

  function enterScreamWind() {
    const b = boss;
    setBossState('screamWind');
    b.face = hero.x < b.x ? -1 : 1;
    b.airY = 0;
    b.fist.active = false;
    b.bellyExtend = 0;
    b.screamCount = 0;
    b.screamWaveT = 0;
    Sound.sfx('telegraph');
    spawnComic('СЕЙЧАС КАК КРИКНУ!', W / 2, GROUND - 340, 17, PINK_BRIGHT);
  }

  function enterCannonAttack() {
    const b = boss;
    setBossState('cannonRoll');
    b.face = hero.x < b.x ? -1 : 1;
    b.airY = 0;
    b.fist.active = false;
    b.bellyExtend = 0;
    b.cannonK = 0;
    b.cannonFlash = 0;
    b.cannonShotT = 0;
    Sound.sfx('telegraph');
    spawnComic('КРЕСЛО-ПУШКИ!', W / 2, GROUND - 360, 18, GOLD_BRIGHT);
  }

  function spawnFallingBullet() {
    const x = clamp(hero.x + rand(-260, 260), ARENA_L + 28, ARENA_R - 28);
    const vx = rand(-26, 26);
    const vy = rand(400, 510);
    const gravity = 280;
    const y0 = -26;
    const landT = (-vy + Math.sqrt(vy * vy + 2 * gravity * (GROUND - y0))) / gravity;
    bossShots.push({
      kind: 'fallBullet',
      x,
      y: y0,
      vx,
      vy,
      gravity,
      markX: clamp(x + vx * landT, ARENA_L + 12, ARENA_R - 12),
      r: 11,
      t: 0,
      life: 3.2,
      parryable: false,
      spin: rand(0, TAU),
      dir: 1,
      color: '#5a4a44',
    });
  }

  function spawnWindCharge() {
    const b = boss;
    const dir = hero.x < b.x ? -1 : 1;
    const parryable = Math.random() < 0.42;
    windCharges.push({
      x: clamp(b.x + dir * 96, ARENA_L + 40, ARENA_R - 40),
      y: GROUND - 78,
      vx: dir * rand(240, 330),
      vy: rand(-640, -520),
      r: 23,
      t: 0,
      life: 7.5,
      hp: 2,
      parryable,
      spin: rand(0, TAU),
      squash: 1,
      bounces: 0,
    });
    if (parryable && !b.parryTipShown) {
      b.parryTipShown = true;
      spawnComic('РОЗОВЫЙ ВЕТРОВОЙ ЗАРЯД — ПАРИРУЙ!', W / 2, GROUND - 330, 15, PINK_BRIGHT);
    }
  }

  function updateWindCharges(dt) {
    for (let i = windCharges.length - 1; i >= 0; i--) {
      const w = windCharges[i];
      w.t += dt;
      w.life -= dt;
      w.spin += dt * 5.5 * (w.vx >= 0 ? 1 : -1);
      w.vy += 1560 * dt;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.squash = damp(w.squash, 1, 9, dt);
      if (w.y > GROUND - w.r) {
        w.y = GROUND - w.r;
        w.vy = -Math.abs(w.vy) * 0.94;
        if (Math.abs(w.vy) < 220) w.vy = -560;
        w.vx *= 1.015;
        w.squash = 0.68;
        w.bounces++;
        spawnRing(w.x, GROUND - 4, w.parryable ? PINK_BRIGHT : '#bfe4d6', 16);
        spawnDust(w.x, GROUND, 3, 0.5);
        Sound.sfx('land');
      }
      if (w.x < ARENA_L + w.r) {
        w.x = ARENA_L + w.r;
        w.vx = Math.abs(w.vx);
      } else if (w.x > ARENA_R - w.r) {
        w.x = ARENA_R - w.r;
        w.vx = -Math.abs(w.vx);
      }
      if (w.life <= 0) {
        spawnRing(w.x, w.y, '#bfe4d6', 22);
        windCharges.splice(i, 1);
        continue;
      }
      if (Math.random() < dt * 26) {
        addParticle({
          kind: 'dot',
          x: w.x + rand(-16, 16),
          y: w.y + rand(-16, 16),
          vx: -w.vx * 0.15 + rand(-40, 40),
          vy: rand(-60, 60),
          life: rand(0.18, 0.4),
          maxLife: 0.4,
          size: rand(1.4, 3.4),
          color: w.parryable ? PINK_BRIGHT : '#cfeee2',
          rot: 0,
          vr: 0,
          grav: -20,
          drag: 0.7,
        });
      }
    }
  }

  function hitWindCharge(index, x, y, byBullet = false) {
    const w = windCharges[index];
    if (!w) return;
    w.hp -= byBullet ? 1 : 2;
    w.squash = 0.72;
    spawnRing(w.x, w.y, w.parryable ? PINK_BRIGHT : '#cfeee2', 18);
    for (let k = 0; k < 8; k++) {
      addParticle({
        kind: 'spark',
        x: w.x,
        y: w.y,
        vx: rand(-220, 220),
        vy: rand(-220, 160),
        life: rand(0.2, 0.5),
        maxLife: 0.5,
        size: rand(2, 5),
        color: w.parryable ? PINK_BRIGHT : '#cfeee2',
        rot: rand(0, TAU),
        vr: rand(-8, 8),
        grav: 260,
        drag: 0.8,
      });
    }
    if (w.hp <= 0) {
      windCharges.splice(index, 1);
      spawnRing(w.x, w.y, CREAM, 32);
      spawnComic('ХЛОП!', w.x, w.y - 34, 22, CREAM);
      Sound.sfx('slam');
    } else {
      Sound.sfx('click');
    }
  }

  function spawnSoundWave(angle, parryable) {
    const b = boss;
    const speed = b.phase === 2 ? 430 : 365;
    const ox = b.x + Math.cos(angle) * 54;
    const oy = GROUND - 292 + Math.sin(angle) * 54;
    soundWaves.push({
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      r: 29,
      t: 0,
      life: 2.6,
      parryable: !!parryable,
      hot: b.phase === 2,
    });
  }

  function spawnScreamBurst() {
    const b = boss;
    const count = b.phase === 2 ? 16 : 12;
    const offset = rand(0, TAU);
    for (let i = 0; i < count; i++) {
      const angle = offset + (i / count) * TAU;
      spawnSoundWave(angle, i % (b.phase === 2 ? 5 : 4) === 1);
    }
    spawnRing(b.x, GROUND - 292, PINK_BRIGHT, 72);
    spawnComic('ВО ВСЕ СТОРОНЫ!', W / 2, GROUND - 362, 17, CREAM);
    if (!b.parryTipShown) {
      b.parryTipShown = true;
      spawnComic('РОЗОВАЯ ВОЛНА — ПРЫГНИ И ЖМИ ПРЫЖОК!', W / 2, GROUND - 330, 13, PINK_BRIGHT);
    }
  }

  function chooseAttack() {
    const b = boss;
    let attack;
    if (game.bossId === 'denis') {
      if (b.phase === 1) {
        if (b.attackCount === 0) attack = 'chalk';
        else if (b.attackCount === 1) attack = 'punch';
        else attack = b.lastAttack === 'punch' ? (Math.random() < 0.55 ? 'chalk' : 'slam') : 'punch';
      } else if (b.attackCount === 0) attack = 'chalk';
      else if (b.attackCount === 1) attack = 'slam';
      else {
        const roll = Math.random();
        if (b.lastAttack === 'chalk') attack = roll < 0.45 ? 'hop' : 'punch';
        else if (b.lastAttack === 'hop') attack = roll < 0.5 ? 'chalk' : 'slam';
        else if (b.lastAttack === 'slam') attack = roll < 0.5 ? 'chalk' : 'punch';
        else attack = roll < 0.45 ? 'chalk' : 'slam';
      }
    } else if (b.phase === 1) {
      // В первой фазе Летунов не бьёт рукой: прыжки, удары креслом и пушки.
      // Пушки кресла доступны только на сложной сложности.
      const hard = game.difficulty === 'hard';
      if (b.attackCount === 0) attack = 'slam';
      else if (b.attackCount === 1) attack = 'hop';
      else if (b.attackCount === 2) {
        attack = hard ? 'cannon' : (b.lastAttack === 'slam' ? 'hop' : 'slam');
      } else {
        const pool = ['slam', 'hop'];
        if (hard) pool.push('cannon');
        attack = pick(pool.filter((a) => a !== b.lastAttack));
      }
    } else {
      if (b.attackCount === 0) attack = 'belly';
      else if (b.attackCount === 1) attack = 'hop';
      else if (b.attackCount === 2) attack = 'scream';
      else {
        const roll = Math.random();
        if (b.lastAttack === 'belly') attack = roll < 0.45 ? 'hop' : roll < 0.72 ? 'scream' : 'punch';
        else if (b.lastAttack === 'hop') attack = roll < 0.42 ? 'belly' : roll < 0.68 ? 'scream' : 'punch';
        else if (b.lastAttack === 'scream') attack = roll < 0.55 ? 'belly' : 'hop';
        else attack = roll < 0.4 ? 'belly' : roll < 0.72 ? 'hop' : 'scream';
      }
    }
    b.attackCount++;
    b.lastAttack = attack;
    if (attack === 'punch') startPunch();
    else if (attack === 'slam') startSlam();
    else if (attack === 'belly') enterBellyWind();
    else if (attack === 'scream') enterScreamWind();
    else if (attack === 'chalk') enterChalkWind();
    else if (attack === 'cannon') enterCannonAttack();
    else enterHopWind();
  }

  function toIdle() {
    const b = boss;
    if (b.pendingRage && !b.dying) {
      startRage();
      return;
    }
    setBossState('idle');
    if (b.inChair) {
      b.chairTarget = rand(720, 1060);
    } else {
      b.standK = 1;
    }
  }

  function startRage() {
    const b = boss;
    setBossState('rage');
    b.phase = 2;
    b.enraged = true;
    b.pendingRage = false;
    b.airY = 0;
    b.fist.active = false;
    b.hatOn = false;
    if (game.bossId === 'letunov') {
      b.chairPropX = b.x;
      b.chairPropA = 0;
    }
    b.bellyExtend = 0;
    b.attackCount = 0;
    b.hopLeft = 0;
    game.shake = Math.max(game.shake, 14);
    game.hitStop = 0.07;
    game.flash = 0.32;
    game.flashColor = game.bossId === 'denis' ? '#9ac7b4' : '#ffb36b';
    Sound.setIntensity(2);
    Sound.sfx('stand');
    spawnSteam(b.x, GROUND - 220, 18);
    if (game.bossId === 'denis') {
      spawnComic('ВТОРОГОДНИК!', b.x, GROUND - 400, 32, GOLD_BRIGHT);
      spawnComic('СЪЕЛ ВСЮ СМЕНУ!', b.x - 60, GROUND - 350, 21, CREAM);
    } else {
      spawnComic('МИСТЕР БОЛЬШОЕ ПУЗО!', b.x, GROUND - 380, 34, GOLD_BRIGHT);
      spawnComic('НЕПРОБИВАЕМЫЙ!', b.x - 70, GROUND - 335, 22, CREAM);
    }
    for (let i = 0; i < 26; i++) {
      addParticle({
        kind: 'star',
        x: b.x + rand(-150, 150),
        y: GROUND - rand(40, 300),
        vx: rand(-200, 200),
        vy: rand(-260, -40),
        life: rand(0.4, 0.9),
        maxLife: 0.9,
        size: rand(4, 10),
        color: pick([GOLD, GOLD_BRIGHT, RUST]),
        rot: rand(0, TAU),
        vr: rand(-8, 8),
        grav: 300,
        drag: 1,
      });
    }
  }

  function startBossDeath() {
    const b = boss;
    b.dying = true;
    b.deathT = 0;
    b.exploded = false;
    setBossState('death');
    b.airY = 0;
    b.fist.active = false;
    b.hatOn = false;
    waves.length = 0;
    bullets.length = 0;
    game.endTimer = 2.55;
    game.endingWin = true;
    game.hitStop = 0.1;
    game.shake = Math.max(game.shake, 16);
    game.flash = 0.35;
    game.flashColor = '#ffe8b5';
    Sound.sfx('roar');
    spawnComic('НОКАУТ!', b.x, GROUND - 330, 48, GOLD_BRIGHT);
    if (!b.inChair) spawnSteam(b.x, GROUND - 120, 8);
    for (let i = 0; i < 26; i++) {
      addParticle({
        kind: 'star',
        x: b.x + rand(-130, 130),
        y: GROUND - rand(30, 340),
        vx: rand(-220, 220),
        vy: rand(-280, -30),
        life: rand(0.5, 1.1),
        maxLife: 1.1,
        size: rand(4, 12),
        color: pick([GOLD, GOLD_BRIGHT, CREAM]),
        rot: rand(0, TAU),
        vr: rand(-10, 10),
        grav: 260,
        drag: 0.9,
      });
    }
  }

  // ---------- Денис: сидит справа за партой ----------
  function denisEyePos() {
    return { x: boss.x - 58, y: GROUND - 326 };
  }

  function denisToIdle() {
    const b = boss;
    if (b.dying) return;
    if (b.pendingPhase3) {
      b.pendingPhase3 = false;
      startDenisPhase3();
      return;
    }
    b.state = 'idle';
    b.timer = 0;
    b.laser.active = false;
  }

  function denisWaitTime() {
    const d = difficultyConfig();
    let wait = d.wait;
    if (boss.phase === 2) wait *= 0.86;
    if (boss.phase === 3) wait *= 0.82;
    return wait;
  }

  function startDenisPhase2() {
    const b = boss;
    if (b.dying || b.phase >= 2) return;
    b.phase = 2;
    b.enraged = true;
    b.glassesBroken = true;
    b.attackCount = 0;
    b.lastAttack = null;
    b.buttonsOut = 0;
    b.pendingPhase3 = false;
    b.laser.active = false;
    setBossState('denisGlassesBreak');
    waves.length = 0;
    soundWaves.length = 0;
    bossShots.length = 0;
    b.fist.active = false;
    game.shake = Math.max(game.shake, 17);
    game.hitStop = 0.09;
    game.flash = 0.34;
    game.flashColor = '#d8eee8';
    Sound.setIntensity(2);
    Sound.sfx('hurt');
    spawnComic('ОЧКИ — ВДРЕБЕЗГИ!', b.x - 90, GROUND - 430, 31, PINK_BRIGHT);
    spawnComic('ПАЛЬЦЫ-ПИСТОЛЕТЫ!', b.x - 60, GROUND - 382, 21, GOLD_BRIGHT);
    for (let i = 0; i < 22; i++) {
      addParticle({
        kind: 'spark',
        x: b.x - 55 + rand(-24, 24),
        y: GROUND - 326 + rand(-18, 18),
        vx: rand(-330, 250),
        vy: rand(-300, 160),
        life: rand(0.35, 0.9),
        maxLife: 0.9,
        size: rand(3, 8),
        color: pick([PINK_BRIGHT, CREAM, '#bfe4dc', WHITE]),
        rot: rand(0, TAU),
        vr: rand(-14, 14),
        grav: 780,
        drag: 0.6,
      });
    }
    spawnRing(b.x - 58, GROUND - 326, PINK_BRIGHT, 56);
  }

  function startDenisPhase3() {
    const b = boss;
    if (b.dying || b.phase >= 3) return;
    b.phase = 3;
    b.pendingPhase3 = false;
    b.attackCount = 0;
    b.lastAttack = null;
    b.laser.active = false;
    b.parkourSpawned = false;
    b.thirdFloor = false;
    b.denisClimb = false;
    b.climbHintShown = false;
    b.buttonsOut = 0;
    b.buttonsReturnT = 0;
    setBossState('denisCeilLaserWind');
    game.schoolFloor = 1;
    game.schoolParkour = false;
    game.parkourHazardT = 0;
    game.roofHintT = 0;
    waves.length = 0;
    soundWaves.length = 0;
    bossShots.length = 0;
    denisBirds.length = 0;
    platforms.length = 0;
    hero.invuln = Math.max(hero.invuln, 2.4);
    hero.hp = Math.min(hero.maxHp, hero.hp + 15);
    hero.vy = Math.min(hero.vy, 0);
    game.shake = Math.max(game.shake, 20);
    game.hitStop = 0.1;
    game.flash = 0.48;
    game.flashColor = '#fff0c9';
    Sound.setIntensity(2);
    Sound.sfx('roar');
    spawnComic('ЛАЗЕР В ПОТОЛОК!', b.x - 150, GROUND - 440, 32, PINK_BRIGHT);
    spawnComic('ПОТОЛОК РУШИТСЯ!', W / 2, GROUND - 365, 24, GOLD_BRIGHT);
    spawnRing(b.x - 58, GROUND - 326, PINK_BRIGHT, 72);
  }

  function addDenisParkourPlatforms() {
    platforms.length = 0;
    boss.denisClimb = true;
    const route = [
      { x: 214, y: GROUND - 108, w: 186, h: 22, kind: 'desk' },
      { x: 456, y: GROUND - 218, w: 188, h: 22, kind: 'books' },
      { x: 704, y: GROUND - 326, w: 188, h: 22, kind: 'desk' },
      { x: 1014, y: GROUND - 414, w: 320, h: 24, kind: 'roof' },
    ];
    route.forEach((p, i) => {
      platforms.push({
        ...p,
        targetY: p.y,
        vy: 0,
        life: 9999,
        solid: true,
        landed: true,
        fixed: true,
        route: true,
        routeIndex: i,
      });
    });
    spawnDust(1014, GROUND - 414, 14, 1.2);
    spawnRing(1014, GROUND - 414, GOLD_BRIGHT, 44);
  }

  function startDenisThirdFloor() {
    const b = boss;
    if (b.dying || game.schoolFloor === 3) return;
    game.schoolFloor = 3;
    game.schoolParkour = false;
    game.roofHintT = 0;
    b.thirdFloor = true;
    b.denisClimb = false;
    b.climbHintShown = false;
    b.attackCount = 0;
    b.lastAttack = null;
    b.parkourSpawned = false;
    b.laser.active = false;
    setBossState('denisThirdFloorIntro');
    platforms.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    bossShots.length = 0;
    denisBirds.length = 0;
    hero.x = 280;
    hero.y = GROUND;
    hero.vx = 0;
    hero.vy = 0;
    hero.onGround = true;
    hero.invuln = Math.max(hero.invuln, 2.2);
    hero.hp = Math.min(hero.maxHp, hero.hp + 10);
    b.x = 1108;
    game.shake = Math.max(game.shake, 24);
    game.hitStop = 0.12;
    game.flash = 0.55;
    game.flashColor = '#ffe9ad';
    Sound.sfx('stand');
    spawnComic('ТРЕТИЙ ЭТАЖ!', W / 2, GROUND - 390, 43, GOLD_BRIGHT);
    spawnComic('ПТИЦЫ И БЕТОН!', W / 2, GROUND - 328, 22, CREAM);
    for (let i = 0; i < 28; i++) {
      addParticle({
        kind: 'star',
        x: rand(200, 1100),
        y: rand(130, 420),
        vx: rand(-180, 180),
        vy: rand(-260, 20),
        life: rand(0.5, 1.2),
        maxLife: 1.2,
        size: rand(3, 9),
        color: pick([GOLD, GOLD_BRIGHT, CREAM, '#8fbdb5']),
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        grav: 300,
        drag: 0.7,
      });
    }
  }

  function prepareDenisLaser() {
    const b = boss;
    const patterns = [
      { start: GROUND - 55, target: GROUND - 55 },
      { start: GROUND - 55, target: GROUND - 410 },
      { start: GROUND - 370, target: GROUND - 116 },
      { start: GROUND - 152, target: GROUND - 152 },
    ];
    const pattern = patterns[b.attackCount % patterns.length];
    b.laser.pattern = b.attackCount % patterns.length;
    b.laser.startY = pattern.start;
    b.laser.targetY = pattern.target;
    b.laser.mirrorY = clamp(b.laser.mirrorY, GROUND - 520, GROUND - 40);
    b.laser.active = false;
    setBossState('denisLaserWind');
    Sound.sfx('telegraph');
    spawnComic('ЛАЗЕР ИЗ ГЛАЗ!', b.x - 150, GROUND - 420, 23, PINK_BRIGHT);
  }

  function spawnDenisFlowers() {
    const b = boss;
    const specs = [
      { color: '#e75b5b', shade: '#9e2f38', baseX: 350, baseY: GROUND - 330, parryable: true, dir: 1, phase: 0.2 },
      { color: '#f0c04e', shade: '#b07824', baseX: 590, baseY: GROUND - 410, parryable: true, dir: -1, phase: 2.1 },
      { color: '#79a7ea', shade: '#3e5f9c', baseX: 820, baseY: GROUND - 250, parryable: false, dir: 1, phase: 4.2 },
    ];
    b.flowerCount = specs.length;
    specs.forEach((spec, index) => {
      bossShots.push({
        kind: 'flower',
        x: spec.baseX,
        y: spec.baseY,
        baseX: spec.baseX,
        baseY: spec.baseY,
        vx: 0,
        vy: 0,
        dir: spec.dir,
        phase: spec.phase,
        r: 28,
        t: 0,
        life: spec.parryable ? 8.2 : 6.2,
        leaveAt: spec.parryable ? 6.2 : 4,
        spin: rand(0, TAU),
        parryable: spec.parryable,
        color: spec.color,
        shade: spec.shade,
        harmless: false,
        petalT: 0.9 + index * 1.05,
      });
    });
    spawnComic('2 ЦВЕТКА ПАРИРУЙ!', W / 2, GROUND - 342, 18, PINK_BRIGHT);
    spawnComic('ТРЕТИЙ УЛЕТИТ ЧЕРЕЗ 4 СЕКУНДЫ', W / 2, GROUND - 306, 12, CREAM);
    Sound.sfx('card');
  }

  function spawnDenisButtons() {
    const b = boss;
    b.buttonsOut = 4;
    b.buttonsReturnT = 4.2;
    b.buttonsGone = 0;
    for (let i = 0; i < 4; i++) {
      const bx = b.x - 58 + (i % 2) * 16;
      const by = GROUND - 382 + i * 18;
      bossShots.push({
        kind: 'button',
        x: bx,
        y: by,
        vx: rand(-470, -220) - i * 20,
        vy: rand(-680, -380),
        r: 11,
        t: 0,
        life: 4.4,
        spin: rand(0, TAU),
        dir: -1,
        parryable: false,
        returning: false,
        homeX: b.x - 54,
        homeY: GROUND - 384 + i * 15,
        color: i % 2 ? '#f2e6c5' : '#9ec9b8',
        harmless: false,
      });
    }
    spawnComic('ПУГОВИЦЫ ВЫЛЕТЕЛИ!', W / 2, GROUND - 360, 18, GOLD_BRIGHT);
    Sound.sfx('shoot');
  }

  function spawnPoprygunchik(index, total) {
    const b = boss;
    const origin = { x: b.x - 92, y: GROUND - 260 };
    const toward = sgn(hero.x - origin.x) || -1;
    bossShots.push({
      kind: 'spring',
      x: origin.x + rand(-14, 14),
      y: origin.y + rand(-10, 10),
      vx: toward * rand(160, 310) + (index - (total - 1) / 2) * 40,
      vy: rand(-820, -650),
      r: 17,
      t: 0,
      life: 5.8,
      spin: rand(0, TAU),
      dir: toward,
      parryable: true,
      color: index % 2 ? PINK : '#ff9cc5',
      harmless: false,
    });
    if (!b.parryTipShown) {
      b.parryTipShown = true;
      spawnComic('ПОПРЫГУНЧИКИ ПАРИРУЮТСЯ!', W / 2, GROUND - 350, 16, PINK_BRIGHT);
    }
  }

  function spawnDenisBird(side, index) {
    const dir = side < 0 ? 1 : -1;
    denisBirds.push({
      x: side < 0 ? -50 - index * 24 : W + 50 + index * 24,
      y: 150 + index * 48 + rand(-12, 12),
      baseY: 150 + index * 48,
      vx: dir * rand(76, 118) * difficultyConfig().speed,
      phase: rand(0, TAU),
      t: 0,
      life: 11,
      eggT: rand(0.7, 1.5),
      flap: rand(0, TAU),
      dir,
    });
  }

  function spawnDenisBirds() {
    const b = boss;
    const count = game.difficulty === 'hard' ? 3 : 2;
    b.birdCount = count;
    for (let i = 0; i < count; i++) spawnDenisBird(i % 2 === 0 ? -1 : 1, i);
    setBossState('denisBirdsWind');
    spawnComic('ПТИЦЫ!', W / 2, GROUND - 375, 28, GOLD_BRIGHT);
    spawnComic('НЕ СТОЙ ПОД ЯЙЦАМИ', W / 2, GROUND - 340, 14, CREAM);
    Sound.sfx('telegraph');
  }

  function spawnDenisConcrete(x, parkour = false) {
    bossShots.push({
      kind: 'concrete',
      x: x === undefined ? rand(140, 1140) : x,
      y: -40 - rand(0, 150),
      vx: rand(-24, 24),
      vy: rand(70, 140),
      r: parkour ? 24 : 30,
      t: 0,
      life: 5,
      spin: rand(0, TAU),
      dir: 1,
      parryable: false,
      harmless: false,
      parkour,
      seed: rand(0, 1000),
    });
  }

  function chooseDenisAttack() {
    const b = boss;
    let attack;
    if (b.phase === 1) {
      if (b.attackCount === 0) attack = 'flowers';
      else if (b.attackCount === 1) attack = 'laser';
      else if (b.attackCount === 2) attack = 'buttons';
      else {
        const pool = ['flowers', 'laser', 'buttons'].filter((a) => a !== b.lastAttack);
        attack = pick(pool);
      }
    } else if (b.phase === 2) {
      if (b.attackCount === 0) attack = 'finger';
      else if (b.attackCount === 1) attack = 'laser';
      else if (b.attackCount === 2) attack = 'flowers';
      else {
        const pool = ['finger', 'laser', 'flowers', 'buttons'].filter((a) => a !== b.lastAttack);
        attack = pick(pool);
      }
    } else {
      // На третьем этаже Денис не только роняет бетон: он снова пускает
      // лазер, цветы, пуговицы и пальцы-пистолеты.
      if (b.attackCount === 0) attack = 'birds';
      else if (b.attackCount === 1) attack = 'concrete';
      else {
        const pool = ['laser', 'flowers', 'buttons', 'finger', 'birds', 'concrete'].filter(
          (a) => a !== b.lastAttack
        );
        attack = pick(pool);
        // Птицы и бетон всё же остаются основой финальной фазы.
        if (Math.random() < 0.38) attack = pick(['birds', 'concrete'].filter((a) => a !== b.lastAttack));
      }
    }
    b.attackCount++;
    b.lastAttack = attack;
    if (attack === 'flowers') {
      setBossState('denisFlowerWind');
      Sound.sfx('telegraph');
    } else if (attack === 'laser') {
      prepareDenisLaser();
    } else if (attack === 'buttons') {
      setBossState('denisButtonsWind');
      Sound.sfx('telegraph');
    } else if (attack === 'finger') {
      setBossState('denisFingerWind');
      b.springCount = 0;
      Sound.sfx('telegraph');
      spawnComic('ПАЛЬЦЫ-ПИСТОЛЕТЫ!', b.x - 160, GROUND - 390, 21, GOLD_BRIGHT);
    } else if (attack === 'birds') {
      spawnDenisBirds();
    } else if (attack === 'concrete') {
      setBossState('denisConcreteWind');
      Sound.sfx('telegraph');
      spawnComic('БЕТОН СВЕРХУ!', W / 2, GROUND - 370, 24, CREAM);
    } else if (attack === 'both') {
      spawnDenisBirds();
      b.bothConcrete = true;
    }
  }

  function updateDenisBirds(dt) {
    const diff = difficultyConfig();
    for (let i = denisBirds.length - 1; i >= 0; i--) {
      const bird = denisBirds[i];
      bird.t += dt;
      bird.life -= dt;
      bird.flap += dt * 13;
      bird.x += bird.vx * dt;
      bird.y = bird.baseY + Math.sin(bird.t * 2.2 + bird.phase) * 17;
      bird.eggT -= dt;
      if (bird.eggT <= 0 && bird.x > 60 && bird.x < W - 60) {
        bird.eggT = rand(1.15, 1.8) / diff.speed;
        bossShots.push({
          kind: 'egg',
          x: bird.x,
          y: bird.y + 22,
          vx: bird.vx * 0.22,
          vy: 90,
          r: 11,
          t: 0,
          life: 5,
          spin: rand(0, TAU),
          dir: bird.dir,
          parryable: false,
          harmless: false,
        });
        Sound.sfx('chalk');
      }
      if (bird.life <= 0 || bird.x < -120 || bird.x > W + 120) {
        denisBirds.splice(i, 1);
      }
    }
  }

  function updateDenisLaser(dt) {
    const b = boss;
    const laser = b.laser;
    const diff = difficultyConfig();
    if (b.state === 'denisLaserWind') {
      const p = clamp(b.timer / (0.92 / diff.speed), 0, 1);
      laser.mirrorY = lerp(laser.mirrorY, laser.startY, easeOutCubic(p));
      laser.active = false;
      if (b.timer >= 0.92 / diff.speed) {
        setBossState('denisLaserFire');
        laser.active = true;
        laser.mirrorY = laser.startY;
        Sound.sfx('laser');
        game.shake = Math.max(game.shake, 8);
        game.flash = 0.13;
        game.flashColor = PINK_BRIGHT;
      }
    } else if (b.state === 'denisLaserFire') {
      const p = clamp(b.timer / (1.45 / diff.speed), 0, 1);
      laser.mirrorY = lerp(laser.startY, laser.targetY, easeInOutQuad(p));
      laser.pulse += dt * 15;
      laser.active = true;
      if (b.timer >= 1.45 / diff.speed) {
        setBossState('denisLaserFade');
        laser.active = false;
        spawnRing(laser.mirrorX, laser.mirrorY, PINK_BRIGHT, 34);
        Sound.sfx('slam');
      }
    } else if (b.state === 'denisLaserFade') {
      laser.active = false;
      if (b.timer >= 0.36) denisToIdle();
    }
  }

  function updateDenisBoss(dt) {
    const b = boss;
    b.timer += dt;
    b.breathe += dt;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.hpShown = damp(b.hpShown, b.hp, 9, dt);
    b.x = 1108;
    b.face = -1;
    if (b.buttonsReturnT > 0) {
      b.buttonsReturnT -= dt;
      if (b.buttonsReturnT <= 0) {
        b.buttonsOut = 0;
        b.buttonsReturnT = 0;
      }
    }

    if (b.dying) {
      b.deathT += dt;
      b.laser.active = false;
      if (!b.exploded && b.deathT > 1.2) {
        b.exploded = true;
        explodeBoss();
      }
      if (b.deathT < 1.2 && Math.random() < dt * 34) {
        spawnSteam(b.x - 90 + rand(-70, 70), GROUND - rand(100, 330), 1);
      }
      return;
    }

    if (hero.dead) {
      b.laser.active = false;
      if (b.state !== 'idle') setBossState('idle');
      b.timer = Math.min(b.timer, 0.1);
      updateDenisBirds(dt);
      return;
    }

    updateDenisBirds(dt);

    if (b.state === 'denisParkour') {
      if (game.schoolParkour && hero.onGround && hero.y <= GROUND - 408 && hero.x > 880) {
        startDenisThirdFloor();
        return;
      }
    }

    switch (b.state) {
      case 'idle': {
        b.laser.active = false;
        if (game.introT > 0.05) {
          b.timer = Math.min(b.timer, 0.25);
          break;
        }
        if (b.pendingPhase3) {
          b.pendingPhase3 = false;
          startDenisPhase3();
          break;
        }
        if (b.timer > denisWaitTime()) chooseDenisAttack();
        break;
      }
      case 'denisGlassesBreak': {
        b.laser.active = false;
        if (b.timer > 1.55) denisToIdle();
        break;
      }
      case 'denisFlowerWind': {
        b.laser.active = false;
        if (b.timer >= 0.56) {
          spawnDenisFlowers();
          setBossState('denisFlowerRecover');
        }
        break;
      }
      case 'denisFlowerRecover': {
        b.laser.active = false;
        if (b.timer >= 0.8) denisToIdle();
        break;
      }
      case 'denisButtonsWind': {
        b.laser.active = false;
        if (b.timer >= 0.55) {
          spawnDenisButtons();
          setBossState('denisButtonsRecover');
        }
        break;
      }
      case 'denisButtonsRecover': {
        b.laser.active = false;
        if (b.timer >= 0.95) denisToIdle();
        break;
      }
      case 'denisLaserWind':
      case 'denisLaserFire':
      case 'denisLaserFade': {
        updateDenisLaser(dt);
        break;
      }
      case 'denisFingerWind': {
        b.laser.active = false;
        if (b.timer >= 0.68 / difficultyConfig().speed) {
          setBossState('denisFingerFire');
          b.springCount = 0;
          Sound.sfx('punch');
          game.shake = Math.max(game.shake, 4);
        }
        break;
      }
      case 'denisFingerFire': {
        b.laser.active = false;
        const total = game.difficulty === 'hard' ? 4 : 3;
        const interval = 0.17 / difficultyConfig().speed;
        const shouldHave = Math.min(total, Math.floor(b.timer / interval) + 1);
        while (b.springCount < shouldHave) {
          spawnPoprygunchik(b.springCount, total);
          b.springCount++;
        }
        if (b.timer > total * interval + 0.38) denisToIdle();
        break;
      }
      case 'denisCeilLaserWind': {
        b.laser.active = false;
        if (Math.random() < dt * 30) {
          addParticle({
            kind: 'dot',
            x: rand(300, 900),
            y: rand(60, 140),
            vx: rand(-40, 40),
            vy: rand(-20, 45),
            life: rand(0.2, 0.5),
            maxLife: 0.5,
            size: rand(1.5, 4),
            color: pick([CREAM, '#d8c8ab', PINK_BRIGHT]),
            rot: 0,
            vr: 0,
            grav: 240,
            drag: 0.4,
          });
        }
        if (b.timer >= 1.7) {
          setBossState('denisCollapse');
          game.shake = Math.max(game.shake, 24);
          game.flash = 0.35;
          game.flashColor = '#fff0c9';
          Sound.sfx('slam');
          spawnComic('БУМ!', W / 2, 190, 44, RUST);
          for (let i = 0; i < 24; i++) {
            addParticle({
              kind: 'smoke',
              x: rand(200, 1080),
              y: rand(50, 180),
              vx: rand(-120, 120),
              vy: rand(-30, 80),
              life: rand(0.7, 1.6),
              maxLife: 1.6,
              size: rand(14, 34),
              grow: rand(20, 45),
              color: pick(['#c9c0ae', '#a89f8d', '#e7dcc4']),
              rot: 0,
              vr: 0,
              grav: 120,
              drag: 0.8,
            });
          }
        }
        break;
      }
      case 'denisCollapse': {
        b.laser.active = false;
        if (Math.random() < dt * 26) {
          addParticle({
            kind: 'star',
            x: rand(120, 1160),
            y: rand(-10, 100),
            vx: rand(-90, 90),
            vy: rand(80, 220),
            life: rand(0.7, 1.4),
            maxLife: 1.4,
            size: rand(4, 10),
            color: pick(['#8b8376', '#b0a897', '#6d675e']),
            rot: rand(0, TAU),
            vr: rand(-9, 9),
            grav: 700,
            drag: 0.2,
          });
        }
        if (!b.parkourSpawned && b.timer >= 1.25) {
          b.parkourSpawned = true;
          addDenisParkourPlatforms();
          game.schoolParkour = true;
          game.roofHintT = 5.5;
          game.parkourHazardT = 0.9;
          setBossState('denisParkour');
          spawnComic('ЛЕЗЬ НА 3 ЭТАЖ!', W / 2, GROUND - 360, 31, GOLD_BRIGHT);
          spawnComic('ДЕНИС ЖДЁТ НАВЕРХУ — ПРЫГАЙ ПО ПАРТАМ', W / 2, GROUND - 320, 12, CREAM);
          Sound.sfx('telegraph');
        }
        break;
      }
      case 'denisParkour': {
        b.laser.active = false;
        game.parkourHazardT -= dt;
        if (game.parkourHazardT <= 0) {
          game.parkourHazardT = rand(1.0, 1.5) / difficultyConfig().speed;
          spawnDenisConcrete(hero.x + rand(-170, 170), true);
        }
        break;
      }
      case 'denisThirdFloorIntro': {
        b.laser.active = false;
        if (b.timer > 2.0) {
          denisToIdle();
          Sound.setIntensity(2);
          spawnComic('ФИНАЛЬНЫЙ ЭТАЖ!', W / 2, GROUND - 380, 27, GOLD_BRIGHT);
        }
        break;
      }
      case 'denisBirdsWind': {
        b.laser.active = false;
        if (b.timer > 0.9) {
          if (b.bothConcrete) {
            b.bothConcrete = false;
            setBossState('denisConcreteRain');
            b.bothRain = true;
          } else {
            setBossState('denisBirdsRecover');
          }
        }
        break;
      }
      case 'denisBirdsRecover': {
        b.laser.active = false;
        if (b.timer > 2.25) denisToIdle();
        break;
      }
      case 'denisConcreteWind': {
        b.laser.active = false;
        if (b.timer >= 0.78 / difficultyConfig().speed) {
          setBossState('denisConcreteRain');
          b.concreteCount = 0;
          b.bothRain = false;
        }
        break;
      }
      case 'denisConcreteRain': {
        b.laser.active = false;
        const duration = b.bothRain ? 1.25 : 1.65;
        if (b.timer < duration) {
          const interval = 0.2 / difficultyConfig().speed;
          const shouldHave = Math.floor(b.timer / interval) + 1;
          while ((b.concreteCount || 0) < shouldHave) {
            spawnDenisConcrete(rand(140, 1140), false);
            b.concreteCount = (b.concreteCount || 0) + 1;
          }
        }
        if (b.timer > duration + 0.35) {
          b.bothRain = false;
          denisToIdle();
        }
        break;
      }
      default:
        denisToIdle();
        break;
    }
  }

  function updateBoss(dt) {
    if (game.bossId === 'nikita') {
      updateNikitaBoss(dt);
      return;
    }
    if (game.bossId === 'stepa') {
      updateStepaBoss(dt);
      return;
    }
    if (game.bossId === 'elena') {
      updateElenaBoss(dt);
      return;
    }
    if (game.bossId === 'denis') {
      updateDenisBoss(dt);
      return;
    }
    if (game.bossId === 'egor') {
      updateEgorBoss(dt);
      return;
    }
    const b = boss;
    b.timer += dt;
    b.breathe += dt;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.hpShown = damp(b.hpShown, b.hp, 9, dt);
    b.fist.prevDist = b.fist.dist;

    if (b.dying) {
      b.deathT += dt;
      b.bellyExtend = damp(b.bellyExtend, 0, 8, dt);
      if (!b.exploded && b.deathT > 1.2) {
        b.exploded = true;
        explodeBoss();
      }
      if (b.phase === 2 && b.deathT < 1.2) {
        b.steamT -= dt;
        if (b.steamT <= 0) {
          b.steamT = 0.09;
          spawnSteam(b.x + rand(-90, 90), GROUND - rand(100, 300), 1);
        }
      }
      return;
    }

    if (hero.dead) {
      if (b.state !== 'idle') {
        setBossState('idle');
        b.airY = 0;
        b.fist.active = false;
        b.bellyExtend = damp(b.bellyExtend, 0, 8, dt);
      }
      b.timer = Math.min(b.timer, 0.1);
      return;
    }

    if (b.phase === 2 && game.bossId === 'letunov') {
      b.steamT -= dt;
      if (b.steamT <= 0) {
        b.steamT = 0.3;
        spawnSteam(b.x + rand(-80, 80), GROUND - rand(140, 290), 1);
      }
    }

    b.cannonFlash = Math.max(0, b.cannonFlash - dt * 7);

    // После пушек кресла через три секунды сверху начинают падать пули.
    if (game.bossId === 'letunov' && b.phase === 1 && game.difficulty === 'hard' && !b.dying) {
      if (b.fallBulletDelay > 0) {
        b.fallBulletDelay -= dt;
        if (b.fallBulletDelay <= 0) {
          b.fallBulletDelay = 0;
          b.fallBulletCount = 5;
          b.fallBulletT = 0;
          spawnComic('СВЕРХУ ПУЛИ!', W / 2, GROUND - 400, 20, '#ffd36e');
          Sound.sfx('telegraph');
        }
      } else if (b.fallBulletCount > 0) {
        b.fallBulletT -= dt;
        if (b.fallBulletT <= 0) {
          spawnFallingBullet();
          b.fallBulletCount--;
          b.fallBulletT = 0.22;
        }
      }
    }

    switch (b.state) {
      case 'idle': {
        if (game.introT > 0.05) {
          b.timer = Math.min(b.timer, 0.25);
          b.face = hero.x < b.x ? -1 : 1;
          if (b.inChair) b.wheelT += dt * 0.4;
          break;
        }
        if (b.pendingRage) {
          startRage();
          break;
        }
        b.face = hero.x < b.x ? -1 : 1;
        const wait = (b.phase === 2 ? 1.35 : 1.75) * difficultyConfig().wait;

        if (b.inChair) {
          // кресло катается по арене
          const dx = b.chairTarget - b.x;
          if (Math.abs(dx) > 10 && b.timer < wait) {
            const step = Math.min(Math.abs(dx), 128 * dt);
            b.x += sgn(dx) * step;
            b.wheelT += step / 24;
            if (Math.random() < dt * 12) {
              spawnDust(b.x + rand(-100, 100), GROUND, 1, 0.4);
              if (Math.random() < 0.28) Sound.sfx('chair');
            }
          } else if (b.timer > wait) {
            chooseAttack();
          }
        } else {
          // во второй фазе он подходит ближе, но не вплотную
          const dx = hero.x - b.x;
          if (Math.abs(dx) > 270) b.x += sgn(dx) * 78 * dt;
          else if (Math.abs(dx) < 165) b.x -= sgn(dx) * 62 * dt;
          b.x = clamp(b.x, 420, 1110);
          if (b.timer > wait) chooseAttack();
        }
        break;
      }
      case 'slamWind': {
        const dur = b.slamShort ? 0.78 : b.phase === 2 ? 1.05 : 1.28;
        if (Math.random() < dt * 30) {
          addParticle({
            kind: 'dot',
            x: b.x + rand(-90, 90),
            y: GROUND - rand(120, 250),
            vx: rand(-30, 30),
            vy: rand(-70, -20),
            life: rand(0.15, 0.3),
            maxLife: 0.3,
            size: rand(1.5, 3.5),
            color: CREAM,
            rot: 0,
            vr: 0,
            grav: -100,
            drag: 0.5,
          });
        }
        if (b.timer >= dur) {
          setBossState('slamJump');
          b.jumpFromX = b.x;
          b.jumpToX = clamp(b.markX, 330, 1040);
          b.jumpDur = b.phase === 2 ? 0.72 : 0.85;
          b.jumpHeight = b.phase === 2 ? 290 : 250;
          b.airY = 0;
          spawnWheelBurst(b.x, GROUND, 5);
        }
        break;
      }
      case 'slamJump': {
        const t = clamp(b.timer / b.jumpDur, 0, 1);
        b.airY = Math.sin(Math.PI * t) * b.jumpHeight;
        b.x = lerp(b.jumpFromX, b.jumpToX, easeInOutQuad(t));
        if (t >= 1) {
          b.x = b.jumpToX;
          b.airY = 0;
          landSlam();
        }
        break;
      }
      case 'slamLand': {
        const dur = 0.52;
        if (b.timer >= dur) {
          if (b.slamLeft > 0) {
            b.slamLeft--;
            enterSlamWind(true);
          } else {
            toIdle();
          }
        }
        break;
      }
      case 'punchWind': {
        const dur = b.phase === 2 ? 0.78 : 1.0;
        b.fist.dist = 0;
        if (b.timer >= dur) {
          setBossState('punchOut');
          b.fist.active = true;
          b.fist.dist = 0;
          Sound.sfx('punch');
          game.shake = Math.max(game.shake, 3);
        }
        break;
      }
      case 'punchOut': {
        const dur = b.phase === 2 ? 0.48 : 0.6;
        const p = clamp(b.timer / dur, 0, 1);
        b.fist.dist = easeInOutQuad(p) * 1480;
        if (p >= 1) {
          setBossState('punchHold');
          b.fist.dist = 1480;
        }
        break;
      }
      case 'punchHold': {
        b.fist.dist = 1480;
        if (b.timer >= 0.16) setBossState('punchRetract');
        break;
      }
      case 'punchRetract': {
        const p = clamp(b.timer / 0.4, 0, 1);
        b.fist.dist = 1480 * easeInOutQuad(1 - p);
        if (p >= 1) {
          b.fist.active = false;
          b.fist.dist = 0;
          b.punchLeft--;
          if (b.punchLeft > 0) enterPunchWind();
          else toIdle();
        }
        break;
      }
      case 'bellyWind': {
        b.bellyExtend = 0;
        if (b.timer >= 1.15) {
          setBossState('bellyStretch');
          Sound.sfx('belly');
          game.shake = Math.max(game.shake, 8);
        }
        break;
      }
      case 'bellyStretch': {
        const p = clamp(b.timer / 0.52, 0, 1);
        b.bellyExtend = easeOutCubic(p);
        if (p >= 1) {
          b.bellyExtend = 1;
          setBossState('bellyHold');
        }
        break;
      }
      case 'bellyHold': {
        b.bellyExtend = 1;
        if (b.timer >= 0.95) setBossState('bellyRetract');
        break;
      }
      case 'bellyRetract': {
        const p = clamp(b.timer / 0.55, 0, 1);
        b.bellyExtend = 1 - easeInOutQuad(p);
        if (p >= 1) {
          b.bellyExtend = 0;
          toIdle();
        }
        break;
      }
      case 'hopWind': {
        if (b.timer >= (b.hopShort ? 0.5 : 0.85)) {
          setBossState('hopJump');
          b.jumpFromX = b.x;
          b.jumpToX = clamp(b.markX, 260, 1080);
          b.jumpDur = 0.62;
          b.jumpHeight = 250;
          b.airY = 0;
          spawnWheelBurst(b.x, GROUND, 5);
        }
        break;
      }
      case 'hopJump': {
        const t = clamp(b.timer / b.jumpDur, 0, 1);
        b.airY = Math.sin(Math.PI * t) * b.jumpHeight;
        b.x = lerp(b.jumpFromX, b.jumpToX, easeInOutQuad(t));
        if (t >= 1) {
          b.x = b.jumpToX;
          b.airY = 0;
          landHop();
        }
        break;
      }
      case 'hopLand': {
        if (b.timer >= 0.42) {
          if (b.hopLeft > 0) {
            b.hopLeft--;
            if (b.hopLeft > 0) {
              b.markX = clamp(hero.x + hero.vx * 0.2, 240, 1080);
              setBossState('hopWind');
              b.hopShort = true;
              Sound.sfx('telegraph');
            } else {
              toIdle();
            }
          } else {
            toIdle();
          }
        }
        break;
      }
      case 'screamWind': {
        if (Math.random() < dt * 22) {
          addParticle({
            kind: 'dot',
            x: b.x + rand(-80, 80),
            y: GROUND - rand(120, 280),
            vx: rand(-40, 40),
            vy: rand(-90, -20),
            life: rand(0.15, 0.3),
            maxLife: 0.3,
            size: rand(1.5, 3.5),
            color: PINK_BRIGHT,
            rot: 0,
            vr: 0,
            grav: -80,
            drag: 0.5,
          });
        }
        if (b.timer >= 0.92) {
          setBossState('scream');
          b.screamCount = 0;
          b.screamWaveT = 0;
          game.shake = Math.max(game.shake, 12);
          game.flash = 0.12;
          game.flashColor = PINK_BRIGHT;
          Sound.sfx('roar');
          spawnComic('КРИК!', b.x, GROUND - 350, 46, PINK_BRIGHT);
          spawnRing(b.x, GROUND - 240, PINK_BRIGHT, 80);
        }
        break;
      }
      case 'scream': {
        if (b.screamCount === 0) {
          spawnScreamBurst();
          b.screamCount = 1;
          Sound.sfx('slam');
          game.shake = Math.max(game.shake, 7);
        }
        if (b.timer > 2.25) toIdle();
        break;
      }
      case 'cannonRoll': {
        const target = 640;
        const dx = target - b.x;
        if (Math.abs(dx) > 8) {
          const step = Math.min(Math.abs(dx), 440 * dt);
          b.x += sgn(dx) * step;
          b.wheelT += step / 24;
          if (Math.random() < dt * 18) spawnDust(b.x + rand(-100, 100), GROUND, 1, 0.45);
        } else if (b.timer >= 0.55) {
          b.x = target;
          setBossState('cannonDeploy');
          Sound.sfx('stand');
          spawnComic('ПУШКИ!', b.x, GROUND - 300, 26, GOLD_BRIGHT);
        }
        break;
      }
      case 'cannonDeploy': {
        b.cannonK = clamp(b.timer / 0.42, 0, 1);
        if (Math.random() < dt * 22) {
          spawnSteam(b.x + rand(-110, 110), GROUND - rand(150, 240), 1);
        }
        if (b.timer >= 0.5) {
          b.cannonK = 1;
          setBossState('cannonFire');
          b.cannonShotT = 0;
        }
        break;
      }
      case 'cannonFire': {
        b.cannonK = 1;
        b.cannonShotT -= dt;
        if (b.cannonShotT <= 0) {
          b.cannonShotT = 0.15;
          b.cannonFlash = 1;
          game.shake = Math.max(game.shake, 3.5);
          for (const side of [-1, 1]) {
            const mx = b.x + side * 112;
            const my = GROUND - 186;
            for (let i = 0; i < 4; i++) {
              addParticle({
                kind: 'spark',
                x: mx,
                y: my,
                vx: rand(-80, 80),
                vy: rand(-440, -180),
                life: rand(0.18, 0.4),
                maxLife: 0.4,
                size: rand(3, 7),
                color: pick([GOLD_BRIGHT, CREAM, RUST]),
                rot: rand(0, TAU),
                vr: rand(-10, 10),
                grav: 220,
                drag: 0.7,
              });
            }
            spawnRing(mx, my, GOLD_BRIGHT, 18);
          }
          Sound.sfx('shoot');
        }
        if (b.timer > 1.5) setBossState('cannonPack');
        break;
      }
      case 'cannonPack': {
        b.cannonK = clamp(1 - b.timer / 0.4, 0, 1);
        if (b.timer >= 0.45) {
          b.cannonK = 0;
          if (game.difficulty === 'hard') {
            b.fallBulletDelay = 2.2;
            b.fallBulletCount = 0;
            b.fallBulletT = 0;
            spawnComic('ЧЕРЕЗ 2 СЕКУНДЫ СВЕРХУ ПУЛИ!', W / 2, GROUND - 360, 15, '#ffd36e');
          }
          toIdle();
        }
        break;
      }
      case 'chalkWind': {
        if (b.timer >= (b.phase === 2 ? 0.72 : 0.92)) {
          setBossState('chalkThrow');
          b.chalkCount = b.phase === 2 ? 3 : 2;
          b.chalkShot = 0;
          Sound.sfx('punch');
          game.shake = Math.max(game.shake, 3);
        }
        break;
      }
      case 'chalkThrow': {
        const interval = 0.19;
        const shouldHave = Math.min(b.chalkCount, Math.floor(b.timer / interval) + 1);
        while (b.chalkShot < shouldHave) {
          spawnChalkShot(b.chalkShot, b.chalkCount);
          b.chalkShot++;
        }
        if (b.timer > b.chalkCount * interval + 0.28) toIdle();
        break;
      }
      case 'rage': {
        b.standK = clamp((b.timer - 0.5) / 0.7, 0, 1);
        b.chairPropA = clamp((b.timer - 0.35) / 0.5, 0, 1);
        b.chairPropX = lerp(b.chairPropX, 1210, clamp(dt * 2.2, 0, 1));
        if (b.timer > 0.72) b.inChair = false;
        if (b.timer > 1.65) {
          b.standK = 1;
          toIdle();
        }
        break;
      }
      default:
        break;
    }
  }

  function landSlam() {
    const b = boss;
    setBossState('slamLand');
    game.shake = Math.max(game.shake, 16);
    game.hitStop = 0.045;
    game.flash = 0.17;
    game.flashColor = '#ffe6b3';
    Sound.sfx('slam');
    spawnDust(b.x, GROUND, 20, 1.7);
    spawnWheelBurst(b.x, GROUND, 3);
    spawnRing(b.x, GROUND - 8, CREAM, 40);
    spawnRing(b.x, GROUND - 8, GOLD, 20);
    spawnComic(pick(['БА-БАХ!', 'ШЛЁП!', 'БУМ!']), b.x, GROUND - 150, 38, RUST);
    addCrater(b.x);

    const speed = b.phase === 2 ? 520 : 430;
    const parrySide = Math.random() < (b.phase === 2 ? 0.58 : 0.34) ? (Math.random() < 0.5 ? -1 : 1) : 0;
    waves.push({ x: b.x - 76, dir: -1, speed, t: 0, hot: b.phase === 2, parryable: parrySide === -1 });
    waves.push({ x: b.x + 76, dir: 1, speed, t: 0, hot: b.phase === 2, parryable: parrySide === 1 });
    if (parrySide !== 0 && !b.parryTipShown) {
      b.parryTipShown = true;
      spawnComic('РОЗОВАЯ ВОЛНА — ПРЫГНИ И ЖМИ ПРЫЖОК!', W / 2, GROUND - 340, 15, PINK_BRIGHT);
    }

    for (let i = 0; i < 10; i++) {
      addParticle({
        kind: 'star',
        x: b.x + rand(-100, 100),
        y: GROUND - rand(2, 40),
        vx: rand(-320, 320),
        vy: rand(-330, -60),
        life: rand(0.35, 0.8),
        maxLife: 0.8,
        size: rand(3, 8),
        color: pick([GOLD, CREAM, RUST]),
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        grav: 900,
        drag: 0.7,
      });
    }
  }

  function landHop() {
    const b = boss;
    setBossState('hopLand');
    game.shake = Math.max(game.shake, 15);
    game.hitStop = 0.04;
    game.flash = 0.16;
    game.flashColor = '#ffe6b3';
    Sound.sfx('slam');
    spawnDust(b.x, GROUND, 18, 1.55);
    spawnWheelBurst(b.x, GROUND, 3);
    spawnRing(b.x, GROUND - 8, CREAM, 38);
    addCrater(b.x);
    spawnComic(pick(['ТОП!', 'БУМ!', 'ПЛЮХ!']), b.x, GROUND - 170, 34, RUST);

    const speed = 500;
    const parrySide = Math.random() < 0.5 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    waves.push({ x: b.x - 76, dir: -1, speed, t: 0, hot: true, parryable: parrySide === -1 });
    waves.push({ x: b.x + 76, dir: 1, speed, t: 0, hot: true, parryable: parrySide === 1 });
    if (parrySide !== 0 && !b.parryTipShown) {
      b.parryTipShown = true;
      spawnComic('РОЗОВАЯ ВОЛНА — ПРЫГНИ И ЖМИ ПРЫЖОК!', W / 2, GROUND - 340, 15, PINK_BRIGHT);
    }
    for (let i = 0; i < 8; i++) {
      addParticle({
        kind: 'star',
        x: b.x + rand(-100, 100),
        y: GROUND - rand(2, 40),
        vx: rand(-300, 300),
        vy: rand(-320, -50),
        life: rand(0.3, 0.7),
        maxLife: 0.7,
        size: rand(3, 7),
        color: pick([GOLD, CREAM, RUST]),
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        grav: 900,
        drag: 0.7,
      });
    }
  }

  function explodeBoss() {
    const b = boss;
    game.shake = Math.max(game.shake, 20);
    game.flash = 0.35;
    game.flashColor = '#fff0c9';
    Sound.sfx('slam');
    spawnRing(b.x, GROUND - 160, CREAM, 120);
    spawnRing(b.x, GROUND - 160, GOLD, 80);
    for (let i = 0; i < 36; i++) {
      addParticle({
        kind: 'smoke',
        x: b.x + rand(-130, 130),
        y: GROUND - rand(40, 320),
        vx: rand(-180, 180),
        vy: rand(-200, -20),
        life: rand(0.6, 1.3),
        maxLife: 1.3,
        size: rand(20, 48),
        grow: rand(20, 50),
        color: pick([CREAM, '#d9bd93', '#c8a97f']),
        rot: 0,
        vr: 0,
        grav: -20,
        drag: 1.1,
      });
    }
    for (let i = 0; i < 30; i++) {
      addParticle({
        kind: 'star',
        x: b.x + rand(-80, 80),
        y: GROUND - rand(80, 320),
        vx: rand(-500, 500),
        vy: rand(-600, -120),
        life: rand(0.6, 1.4),
        maxLife: 1.4,
        size: rand(5, 14),
        color: pick([GOLD, GOLD_BRIGHT, CREAM, RUST]),
        rot: rand(0, TAU),
        vr: rand(-14, 14),
        grav: 700,
        drag: 0.25,
      });
    }
  }

  // ---------- столкновения и урон ----------
  function bossBodyRect() {
    const b = boss;
    if (game.bossId === 'nikita') {
      if (b.phase === 2) {
        return { x: b.x - 50, y: GROUND - 128, w: 100, h: 128 };
      }
      return { x: b.x - 88, y: GROUND - 300, w: 168, h: 300 };
    }
    if (game.bossId === 'stepa') {
      if (b.phase === 2) {
        return { x: b.x - 64, y: GROUND - 220, w: 128, h: 220 };
      }
      return { x: b.x - 58, y: GROUND - 330, w: 116, h: 330 };
    }
    if (game.bossId === 'elena') {
      if (b.state === 'elenaBull') {
        return { x: b.x - 58, y: GROUND - 148, w: 150, h: 148 };
      }
      if (b.phase === 1) {
        return { x: b.x - 58, y: GROUND - 248, w: 118, h: 248 };
      }
      return { x: b.x - 56, y: GROUND - 238, w: 112, h: 238 };
    }
    if (game.bossId === 'egor') {
      if (b.phase === 1) return { x: b.x - 46, y: 150, w: 196, h: 190 };
      if (b.phase === 2) return { x: b.x - 88, y: 156, w: 176, h: 146 };
      if (b.phase === 3) return { x: b.x - 76, y: 170, w: 196, h: 208 };
      return { x: b.x - 104, y: GROUND - 300, w: 208, h: 300 };
    }
    if (game.bossId === 'denis') {
      return {
        x: b.x - 166,
        y: GROUND - 392,
        w: 238,
        h: 392,
      };
    }
    if (b.inChair) {
      return {
        x: b.x - 158,
        y: GROUND - b.airY - 450,
        w: 316,
        h: 450,
      };
    }
    return {
      x: b.x - 108,
      y: GROUND - b.airY - 400,
      w: 216,
      h: 398,
    };
  }

  function heroRect() {
    const h = hero;
    const height = lerp(HERO_H, HERO_CROUCH_H, clamp(h.crouchK, 0, 1));
    return { x: h.x - 14, y: h.y - height, w: 28, h: height };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleRect(cx, cy, r, rect) {
    const nx = clamp(cx, rect.x, rect.x + rect.w);
    const ny = clamp(cy, rect.y, rect.y + rect.h);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  }

  function segmentHitsRect(x1, y1, x2, y2, rect, thickness = 8) {
    const steps = Math.max(8, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 12));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (circleRect(lerp(x1, x2, t), lerp(y1, y2, t), thickness, rect)) return true;
    }
    return false;
  }

  function denisLaserSegments() {
    const b = boss;
    const eye = denisEyePos();
    const mirrorX = ARENA_L + 18;
    const mirrorY = b.laser.mirrorY;
    return [
      { x1: eye.x, y1: eye.y, x2: mirrorX, y2: mirrorY },
      { x1: mirrorX, y1: mirrorY, x2: W - 26, y2: mirrorY },
    ];
  }

  function denisLaserHits(rect) {
    if (!boss.laser.active) return false;
    const hard = game.difficulty === 'hard';
    const thickness = hard ? 14 : 8;
    // На сложной сложности присед не уменьшает хитбокс: луч прожигает
    // героя на всей высоте стоящего тела.
    const hitRect = hard
      ? { x: rect.x, y: rect.y + rect.h - HERO_H, w: rect.w, h: HERO_H }
      : rect;
    return denisLaserSegments().some((s) =>
      segmentHitsRect(s.x1, s.y1, s.x2, s.y2, hitRect, thickness)
    );
  }

  function damageBoss(amount, x, y, charge = true) {
    const b = boss;
    if (b.dying || game.ended || b.egorFinale) return;
    // Никиту нельзя бить, пока Степа несёт его или пока идёт смена фазы.
    if (game.bossId === 'nikita' && (b.nkState === 'nkIntro' || b.nkTransition)) return;
    // Во второй фазе Степа уже на скейте — его нельзя добить раньше выхода.
    // Попадания только сбивают спесь и заряжают супер, но HP не падает до нуля.
    if (game.bossId === 'stepa' && (b.stTransition || b.stState === 'stCrash')) return;
    if (game.bossId === 'stepa' && b.phase === 2) {
      b.hp = Math.max(1, b.hp - amount * 0.25);
      b.hitFlash = 0.085;
      b.shotTick = (b.shotTick || 0) + 1;
      spawnHitSparks(x, y);
      if (b.shotTick % 2 === 0) Sound.sfx('bosshit');
      if (charge) addSuperCharge(amount * 0.45);
      return;
    }
    // Пока Денис поднимается на третий этаж, его нельзя бить.
    if (game.bossId === 'denis' && b.denisClimb) {
      if (!b.climbHintShown) {
        b.climbHintShown = true;
        spawnComic('ДЕНИС НА 3 ЭТАЖЕ — ЛЕЗЬ ЗА НИМ!', W / 2, 152, 18, GOLD_BRIGHT);
      }
      return;
    }
    b.hp = Math.max(0, b.hp - amount);
    b.hitFlash = 0.085;
    b.shotTick = (b.shotTick || 0) + 1;
    spawnHitSparks(x, y);
    if (b.shotTick % 2 === 0) Sound.sfx('bosshit');
    if (charge) addSuperCharge(amount);
    if (Math.random() < 0.055) {
      spawnComic(pick(['ПУФ!', 'ЧПОК!', 'ХЛОП!']), x + rand(-20, 20), y - 26, 19, GOLD_BRIGHT, false);
    }

    if (game.bossId === 'denis') {
      if (b.phase === 1 && b.hp <= b.maxHp * DENIS_PHASE2_AT) {
        b.hp = Math.max(1, b.hp);
        startDenisPhase2();
        return;
      }
      if (b.phase === 2 && b.hp <= b.maxHp * DENIS_PHASE3_AT) {
        b.hp = Math.max(1, b.hp);
        if (b.state === 'denisGlassesBreak' || b.state === 'denisPhase2Rage') {
          b.pendingPhase3 = true;
        } else {
          startDenisPhase3();
        }
        return;
      }
    }
    if (game.bossId === 'egor') {
      if (b.phase === 1 && b.hp <= b.maxHp * 0.82) {
        b.hp = Math.max(1, b.hp);
        startEgorPhase2();
        return;
      }
      if (b.phase === 2 && b.hp <= b.maxHp * 0.4 && !b.egorFinale) {
        b.hp = Math.max(1, b.hp);
        startEgorCloudFinale();
        return;
      }
      if (b.phase === 3 && b.hp <= b.maxHp * 0.18) {
        b.hp = Math.max(1, b.hp);
        startEgorPhase4();
        return;
      }
    }
    if (game.bossId === 'elena' && b.phase === 1 && b.hp <= b.maxHp / 3) {
      b.hp = Math.max(1, b.hp);
      startElenaPhase2();
      return;
    }
    if (game.bossId === 'nikita' && b.phase === 1 && b.hp <= b.maxHp * 0.5) {
      b.hp = Math.max(1, b.hp);
      startNikitaPhase2();
      return;
    }
    if (game.bossId === 'stepa' && b.phase === 1 && b.hp <= b.maxHp * 0.5) {
      b.hp = Math.max(1, b.hp);
      startStepaPhase2();
      return;
    }

    if (b.hp <= 0) {
      startBossDeath();
      return;
    }

    if (game.bossId !== 'denis' && b.phase === 1 && b.hp <= b.maxHp * 0.5) {
      if (
        b.state === 'idle' ||
        b.state === 'slamWind' ||
        b.state === 'punchWind' ||
        b.state === 'rage'
      ) {
        startRage();
      } else {
        b.pendingRage = true;
      }
    }
  }

  function hurtHero(sourceX) {
    const h = hero;
    if (h.dead || h.invuln > 0 || boss.dying || game.ended) return;
    // 75 единиц = 15 сердец по 5. Сложность меняет силу удара.
    h.hp = Math.max(0, h.hp - difficultyConfig().damage);
    game.hitsTaken++;
    h.invuln = 1.65;
    h.hurtT = 0.38;
    h.dashT = 0;
    h.vy = -430;
    h.onGround = false;
    const dir = sgn(h.x - sourceX) || 1;
    h.vx = dir * 400;
    h.face = dir;
    h.deadSide = dir;
    h.lastMove = dir;

    game.shake = Math.max(game.shake, 12);
    game.hitStop = Math.max(game.hitStop, 0.07);
    game.flash = 0.32;
    game.flashColor = '#d94a35';
    Sound.sfx('hurt');

    for (let i = 0; i < 12; i++) {
      addParticle({
        kind: 'star',
        x: h.x + rand(-18, 18),
        y: h.y - rand(28, 80),
        vx: rand(-260, 260),
        vy: rand(-330, -40),
        life: rand(0.3, 0.7),
        maxLife: 0.7,
        size: rand(3, 8),
        color: pick([RUST, GOLD, CREAM]),
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        grav: 850,
        drag: 0.6,
      });
    }
    spawnComic(pick(['ОЙ!', 'АЙ!', 'ОХ!']), h.x, h.y - 120, 30, GOLD_BRIGHT);

    if (h.hp <= 0) {
      h.hp = 0;
      h.dead = true;
      h.deadT = 0;
      h.vy = -470;
      h.vx = dir * 240;
      h.hurtT = 1;
      game.endTimer = 1.9;
      game.endingWin = false;
      spawnComic('НОКАУТ…', h.x, h.y - 150, 34, CREAM);
      for (let i = 0; i < 10; i++) {
        addParticle({
          kind: 'star',
          x: h.x + rand(-40, 40),
          y: h.y - rand(60, 120),
          vx: rand(-120, 120),
          vy: rand(-160, -20),
          life: rand(0.5, 1.1),
          maxLife: 1.1,
          size: rand(3, 8),
          color: GOLD_BRIGHT,
          rot: rand(0, TAU),
          vr: rand(-6, 6),
          grav: 120,
          drag: 0.8,
        });
      }
    }
  }

  function resolveHeroDamage() {
    if (hero.dead || hero.invuln > 0 || boss.dying || game.ended) return;
    if (game.endTimer > 0) return;
    const rect = heroRect();

    // Егор во второй фазе — гигантский фон за облаками: касание его тела не бьёт,
    // урон проходит только по голове (см. bossBodyRect) и по руке из-за края.
    const egorBackdrop = game.bossId === 'egor' && boss.phase === 2;
    // Елена в погоне не бьёт касанием — герой должен успеть убежать к выходу.
    const elenaChase = game.bossId === 'elena' && boss.state === 'elenaChase';
    if (!egorBackdrop && !elenaChase && overlap(rect, bossBodyRect())) {
      hurtHero(boss.x);
      return;
    }

    const egorArm = egorArmRect();
    if (egorArm && overlap(rect, egorArm)) {
      hurtHero((boss.egorArmSide || 1) < 0 ? -160 : W + 160);
      return;
    }

    if (
      boss.bellyExtend > 0.5 &&
      (boss.state === 'bellyStretch' || boss.state === 'bellyHold' || boss.state === 'bellyRetract')
    ) {
      const bellyRect = {
        x: 36,
        y: BELLY_TOP,
        w: W - 72,
        h: BELLY_BOTTOM - BELLY_TOP,
      };
      if (overlap(rect, bellyRect)) {
        hurtHero(boss.x);
        return;
      }
    }

    if (boss.fist.active && boss.state === 'punchOut') {
      // кулак несётся быстро — проверяем отрезок, который он пролетел за кадр
      const fx = boss.x + boss.face * (104 + boss.fist.dist);
      const prevDist = boss.fist.prevDist === undefined ? boss.fist.dist : boss.fist.prevDist;
      const px = boss.x + boss.face * (104 + prevDist);
      const left = Math.min(fx, px);
      const right = Math.max(fx, px);
      const r = PUNCH_R;
      if (
        rect.y < PUNCH_Y + r &&
        rect.y + rect.h > PUNCH_Y - r &&
        rect.x < right + r &&
        rect.x + rect.w > left - r
      ) {
        hurtHero(fx);
        return;
      }
    }

    for (const w of waves) {
      const wh = w.hot ? 38 : 34;
      const wr = { x: w.x - 25, y: GROUND - wh, w: 50, h: wh };
      if (overlap(rect, wr)) {
        hurtHero(w.x);
        return;
      }
    }

    for (const w of soundWaves) {
      if (circleRect(w.x, w.y, w.r + 2, rect)) {
        hurtHero(w.x);
        return;
      }
    }

    for (const w of windCharges) {
      if (circleRect(w.x, w.y, w.r - 2, rect)) {
        hurtHero(w.x);
        return;
      }
    }

    if (game.bossId === 'denis' && denisLaserHits(rect)) {
      hurtHero(boss.x - 58);
      return;
    }

    if (game.bossId === 'elena') {
      if (elenaLaserHits(rect)) {
        hurtHero(boss.x - 40);
        return;
      }
      const fist = elenaPunchRect();
      if (fist && overlap(rect, fist)) {
        hurtHero(fist.x);
        return;
      }
      if (boss.state === 'elenaBreath' && elenaBreathHits(rect)) {
        hurtHero(boss.x - 60);
        return;
      }
    }

    if (game.bossId === 'nikita') {
      const punch = nikitaPunchRect();
      if (punch && overlap(rect, punch)) {
        hurtHero(punch.x + punch.w);
        return;
      }
      const bgFist = nikitaBgFistRect();
      if (bgFist && overlap(rect, bgFist)) {
        hurtHero(boss.nkBgPunchX);
        return;
      }
    }

    if (game.bossId === 'stepa') {
      const punch = stepaPunchRect();
      if (punch && overlap(rect, punch)) {
        hurtHero(punch.x + punch.w);
        return;
      }
      if (boss.stBoltOn) {
        const line = stepaHairLine();
        if (segmentHitsRect(line.x1, line.y1, line.x2, line.y2, rect, 13)) {
          hurtHero(boss.x);
          return;
        }
      }
      for (const s of bossShots) {
        if (s.kind !== 'stepaHairBolt') continue;
        if (segmentHitsRect(s.x1, s.y1, s.x2, s.y2, rect, 11)) {
          hurtHero(s.x2);
          bossShots.splice(bossShots.indexOf(s), 1);
          return;
        }
      }
    }

    for (const s of bossShots) {
      if (s.kind === 'stepaHairBolt') continue;
      if (s.harmless) continue;
      if (circleRect(s.x, s.y, s.r + 3, rect)) {
        hurtHero(s.x);
        bossShots.splice(bossShots.indexOf(s), 1);
        if (s.kind === 'button') boss.buttonsOut = Math.max(0, boss.buttonsOut - 1);
        return;
      }
    }
  }

  function autoAimPoint() {
    if (boss.dying || boss.exploded) return null;
    const r = bossBodyRect();
    return { x: r.x + r.w * 0.5, y: r.y + r.h * 0.42 };
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b) break;
      b.t += dt;
      b.life -= dt;

      // Щелкунчик сначала летит прямо; через пару метров включается
      // полунаводка. Автонаводка — отдельный модификатор атаки.
      if (b.nutcracker && !b.homing) {
        b.travel = (b.travel || 0) + Math.hypot(b.vx, b.vy) * dt;
        if (b.travel >= (b.homingAfter || 132)) {
          b.homing = true;
          spawnRing(b.x, b.y, '#ff8e7c', 14);
        }
      }
      const homing = b.nutcracker ? b.homing : progress.autoAim || b.homing;
      if (homing) {
        const target = autoAimPoint();
        if (target) {
          const speed = Math.hypot(b.vx, b.vy) || 1180;
          const desired = Math.atan2(target.y - b.y, target.x - b.x);
          let cur = Math.atan2(b.vy || 0, b.vx || 1);
          let diff = ((desired - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          const turn = b.big ? 4.4 : b.homing ? 2.2 : 9.5;
          cur += clamp(diff, -turn * dt, turn * dt);
          b.vx = Math.cos(cur) * speed;
          b.vy = Math.sin(cur) * speed;
        }
      }

      b.x += b.vx * dt;
      b.y += (b.vy || 0) * dt;
      if (Math.abs(b.vx) > 30) b.dir = b.vx >= 0 ? 1 : -1;
      if (b.life <= 0 || b.x < 24 || b.x > W - 24 || b.y < 8 || b.y > GROUND + 30) {
        bullets.splice(i, 1);
        continue;
      }
      if (b.t > 0.02 && Math.random() < dt * 20) {
        addParticle({
          kind: 'dot',
          x: b.x - b.dir * 10,
          y: b.y + rand(-4, 4),
          vx: -b.dir * rand(20, 80),
          vy: rand(-30, 30),
          life: rand(0.1, 0.24),
          maxLife: 0.24,
          size: rand(1, 2.6),
          color: b.green ? pick(['#7dff9a', '#b8ffd0']) : b.nutcracker ? pick(['#ff8e7c', '#ffc2b8']) : pick([GOLD_BRIGHT, CREAM]),
          rot: 0,
          vr: 0,
          grav: 0,
          drag: 1,
        });
      }
      // Снаряды ломают ветровые заряды Летунова.
      let chargeHit = false;
      for (let w = windCharges.length - 1; w >= 0; w--) {
        const charge = windCharges[w];
        const radius = b.big ? b.r || 54 : 5;
        if (circleRect(b.x, b.y, radius, { x: charge.x - charge.r, y: charge.y - charge.r, w: charge.r * 2, h: charge.r * 2 })) {
          hitWindCharge(w, b.x, b.y, true);
          if (!b.big) {
            bullets.splice(i, 1);
            chargeHit = true;
            b.hitSomething = true;
          }
          break;
        }
      }
      if (chargeHit) continue;

      // Медленные «двойки» из журнала можно разбить выстрелом.
      let markBroken = false;
      for (let k = bossShots.length - 1; k >= 0; k--) {
        const s = bossShots[k];
        if (!s.breakable) continue;
        const radius = b.big ? b.r || 54 : 12;
        if (!circleRect(b.x, b.y, radius, { x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2 })) continue;
        s.hp = (s.hp === undefined ? 1 : s.hp) - 1;
        b.hitSomething = true;
        spawnPaperBurst(s.x, s.y, s.journal ? '#ff9a8a' : '#e8d9b8', 8);
        if (s.hp <= 0) bossShots.splice(k, 1);
        if (!b.big) {
          spawnRing(b.x, b.y, '#ffd8c4', 18);
          bullets.splice(i, 1);
          markBroken = true;
        }
        break;
      }
      if (markBroken) continue;

      if (!boss.dying && !boss.exploded) {
        const r = bossBodyRect();
        const radius = b.big ? b.r || 54 : 5;
        if (circleRect(b.x, b.y, radius, r)) {
          bullets.splice(i, 1);
          b.hitSomething = true;
          if (b.big) {
            damageBoss(b.dmg || SUPER_MAX_DAMAGE, b.x, b.y, false);
            game.flash = Math.max(game.flash, 0.22);
            game.flashColor = GOLD_BRIGHT;
            game.shake = Math.max(game.shake, 13);
            spawnRing(b.x, b.y, GOLD_BRIGHT, 74);
            spawnRing(b.x, b.y, CREAM, 42);
            spawnComic('БУМ!', b.x, b.y - 54, 36, GOLD_BRIGHT);
            for (let k = 0; k < 22; k++) {
              addParticle({
                kind: 'star',
                x: b.x + rand(-28, 28),
                y: b.y + rand(-28, 28),
                vx: rand(-390, 390),
                vy: rand(-430, 160),
                life: rand(0.3, 0.9),
                maxLife: 0.9,
                size: rand(4, 11),
                color: pick([GOLD, GOLD_BRIGHT, CREAM, RUST]),
                rot: rand(0, TAU),
                vr: rand(-13, 13),
                grav: 520,
                drag: 0.7,
              });
            }
          } else {
            damageBoss(b.dmg === undefined ? 9 : b.dmg, b.x, b.y);
          }
        }
      }
    }
  }

  function updateWaves(dt) {
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i];
      w.t += dt;
      w.x += w.dir * w.speed * dt;
      if (w.x < 30 || w.x > W - 30) {
        waves.splice(i, 1);
        continue;
      }
      if (Math.random() < dt * 26) {
        addParticle({
          kind: 'dot',
          x: w.x - w.dir * rand(10, 40),
          y: GROUND - rand(2, 26),
          vx: -w.dir * rand(20, 90),
          vy: rand(-150, -20),
          life: rand(0.2, 0.5),
          maxLife: 0.5,
          size: rand(2, 5),
          color: pick([CREAM, GOLD, PAPER]),
          rot: 0,
          vr: 0,
          grav: 500,
          drag: 0.8,
        });
      }
    }
  }

  function updateSoundWaves(dt) {
    for (let i = soundWaves.length - 1; i >= 0; i--) {
      const w = soundWaves[i];
      w.t += dt;
      w.x += w.vx * dt;
      w.y += w.vy * dt;

      // Волна гаснет сразу, как только коснулась земли.
      if (w.y >= GROUND - 10) {
        spawnRing(w.x, GROUND - 4, w.parryable ? PINK_BRIGHT : '#bfe4d6', 18);
        spawnDust(w.x, GROUND, 3, 0.55);
        soundWaves.splice(i, 1);
        continue;
      }
      if (
        w.t > w.life ||
        w.x < ARENA_L - 70 ||
        w.x > ARENA_R + 70 ||
        w.y < -90
      ) {
        soundWaves.splice(i, 1);
        continue;
      }
      if (Math.random() < dt * 22) {
        addParticle({
          kind: 'dot',
          x: w.x - (w.vx / 400) * rand(8, 26),
          y: w.y - (w.vy / 400) * rand(8, 26),
          vx: -w.vx * rand(0.12, 0.35),
          vy: -w.vy * rand(0.12, 0.35),
          life: rand(0.18, 0.42),
          maxLife: 0.42,
          size: rand(2, 4.5),
          color: w.parryable ? pick([PINK, PINK_BRIGHT]) : pick([CREAM, GOLD, '#9ac7b4']),
          rot: 0,
          vr: 0,
          grav: 260,
          drag: 0.8,
        });
      }
    }
  }

  function updateBossShots(dt) {
    for (let i = bossShots.length - 1; i >= 0; i--) {
      const s = bossShots[i];
      s.t += dt;
      s.life -= dt;
      const dir = s.dir || 1;
      s.spin += dt * (s.kind === 'flower' ? 2.4 : s.kind === 'spring' ? 8 : 9) * dir;

      if (s.kind === 'nikitaPhone') {
        s.vy += (s.gravity || 900) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.spin += dt * 8;
        if (s.y >= GROUND - 12) {
          spawnDust(s.x, GROUND, 5, 0.7);
          spawnRing(s.x, GROUND - 6, '#7ee0ff', 14);
          bossShots.splice(i, 1);
          continue;
        }
        if (s.life <= 0 || s.x < -60 || s.x > W + 60) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'bikeWheel') {
        s.x += s.vx * dt;
        s.spin += dt * 9 * (s.vx >= 0 ? 1 : -1);
        if (Math.random() < dt * 18) {
          spawnDust(s.x, GROUND - 2, 1, 0.3);
        }
        if (s.life <= 0 || s.x < -90) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'stepaVehicle' || s.kind === 'stepaScooter') {
        s.x += s.vx * dt;
        s.spin += dt * (s.kind === 'stepaScooter' ? 7 : 5);
        if (s.life <= 0 || s.x < -100) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'stepaHairBolt') {
        if (s.life <= 0) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'elenaGlobe') {
        s.vy += 1500 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.spin += dt * 4.6 * (s.vx >= 0 ? 1 : -1);
        if (s.y > GROUND - s.r) {
          s.y = GROUND - s.r;
          s.vy = -Math.abs(s.vy) * 0.8;
          if (Math.abs(s.vy) < 300) s.vy = -360;
          s.vx *= 0.97;
          s.bounces++;
          spawnDust(s.x, GROUND, 4, 0.65);
          spawnRing(s.x, GROUND - 5, PINK_BRIGHT, 16);
          if (s.bounces <= 3) Sound.sfx('land');
        }
        if (s.x < ARENA_L + s.r) {
          s.x = ARENA_L + s.r;
          s.vx = Math.abs(s.vx);
        } else if (s.x > ARENA_R - s.r) {
          s.x = ARENA_R - s.r;
          s.vx = -Math.abs(s.vx);
        }
        if (s.life <= 0) {
          spawnRing(s.x, s.y, PINK_BRIGHT, 28);
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'elenaPencil') {
        s.vy += 95 * dt;
        s.y += s.vy * dt;
        s.x += s.vx * dt;
        s.spin += dt * 1.8;
        if (s.y >= GROUND - 8) {
          spawnDust(s.x, GROUND, 5, 0.8);
          spawnRing(s.x, GROUND - 4, '#ffd8a8', 14);
          spawnPaperBurst(s.x, GROUND - 12, '#e0563c', 6);
          bossShots.splice(i, 1);
          continue;
        }
        if (s.life <= 0) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'elenaMark') {
        // Все «двойки» ломаются выстрелами и слегка сами наводятся на героя.
        const desired = Math.atan2(hero.y - 48 - s.y, hero.x - s.x);
        let cur = Math.atan2(s.vy || 0, s.vx || -1);
        let diff = ((desired - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const turn = s.journal ? 0.85 : 1.15;
        cur += clamp(diff, -turn * dt, turn * dt);
        const speed = Math.hypot(s.vx, s.vy) || 170;
        s.vx = Math.cos(cur) * speed;
        s.vy = Math.sin(cur) * speed;
        s.x += s.vx * dt;
        s.y += (s.vy || 0) * dt;
        if (s.life <= 0 || s.x < -40 || s.x > W + 40 || s.y > GROUND - 6) {
          if (s.journal) spawnPaperBurst(clamp(s.x, 20, W - 20), Math.min(s.y, GROUND - 8), '#ff9a8a', 6);
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'stinkCloud') {
        s.x += s.vx * dt;
        s.y = s.baseY + Math.sin(s.t * 2.1 + s.phase) * 16;
        if (Math.random() < dt * 20) {
          addParticle({
            kind: 'smoke',
            x: s.x + rand(-10, 10),
            y: s.y + rand(-8, 8),
            vx: rand(-30, 10),
            vy: rand(-35, -8),
            life: rand(0.4, 0.8),
            maxLife: 0.8,
            size: rand(5, 11),
            grow: rand(6, 14),
            color: pick(['#a8d97b', '#c6e9a2', '#8fc46d']),
            rot: 0,
            vr: 0,
            grav: -12,
            drag: 1.1,
          });
        }
        if (s.life <= 0 || s.x < -60) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'banana') {
        if (s.rain) s.vy += 240 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life <= 0 || s.x < ARENA_L - 60 || s.x > ARENA_R + 60 || s.y > GROUND + 30) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }
      if (s.kind === 'coconutBomb') {
        s.vy += (s.gravity || 700) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.fuse -= dt;
        if (s.fuse <= 0 || s.y > GROUND - 10 || s.life <= 0) {
          explodeEgorCoconut(s.x, s.y);
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }
      if (s.kind === 'coconutShard') {
        s.vy += (s.gravity || 520) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life <= 0 || s.y > GROUND - 4 || s.x < ARENA_L - 50 || s.x > ARENA_R + 50) {
          spawnDust(clamp(s.x, ARENA_L, ARENA_R), Math.min(GROUND, s.y), 2, 0.4);
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }
      if (s.kind === 'cloudZap') {
        continue;
      }
      if (s.kind === 'elenaTooth') {
        if (s.mode === 'fall') {
          s.vy += 1500 * dt;
        } else {
          s.vy += 1900 * dt;
          s.dir = hero.x < s.x ? -1 : 1;
          s.vx = s.dir * 150 * difficultyConfig().speed;
        }
        const wasAirborne = s.mode === 'run' && s.y < GROUND - s.r - 0.6;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.y >= GROUND - s.r) {
          s.y = GROUND - s.r;
          if (s.mode === 'fall') {
            if (!s.bounced) {
              s.bounced = true;
              s.vy = -Math.abs(s.vy) * 0.28;
              s.vx *= 0.7;
              spawnDust(s.x, GROUND, 2, 0.35);
            } else {
              s.mode = 'run';
              s.vy = 0;
              s.hopT = rand(0.18, 0.55);
              spawnDust(s.x, GROUND, 2, 0.45);
            }
          } else {
            s.vy = 0;
            if (wasAirborne) {
              s.hopT = rand(0.5, 0.95) / Math.max(0.7, difficultyConfig().speed);
              spawnDust(s.x, GROUND, 1, 0.3);
            }
          }
        }
        if (s.mode === 'run' && !wasAirborne && s.y >= GROUND - s.r - 0.6 && s.vy >= 0) {
          s.hopT -= dt;
          if (s.hopT <= 0) {
            s.vy = -rand(340, 460);
            s.y -= 1;
            spawnDust(s.x, GROUND, 1, 0.3);
          }
        }
        if (s.life <= 0 || s.x < ARENA_L - 30 || s.x > ARENA_R + 30) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }
      if (s.kind === 'coconut') {
        s.vy += 900 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.y > GROUND - s.r) {
          s.y = GROUND - s.r;
          s.vy = -Math.abs(s.vy) * 0.4;
          s.vx = Math.min(s.vx, -85);
          spawnDust(s.x, GROUND, 3, 0.5);
          Sound.sfx('land');
        }
        if (s.life <= 0 || s.x < ARENA_L - 40) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }
      if (s.kind === 'branch' || s.kind === 'fruit') {
        s.vy += (s.kind === 'branch' ? 900 : 680) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life <= 0 || s.y > GROUND - 4 || s.x < ARENA_L - 40 || s.x > ARENA_R + 40) {
          spawnDust(clamp(s.x, ARENA_L, ARENA_R), GROUND, 3, 0.45);
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }
      if (s.kind === 'screamRing') {
        s.x += s.vx * dt;
        s.y += Math.sin(s.t * 7) * 18 * dt;
        if (s.life <= 0 || s.x < ARENA_L - 50) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }
      if (s.kind === 'bull') {
        s.x += s.vx * dt;
        s.t += 0;
        if (s.life <= 0 || s.x < ARENA_L - 120) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }
      if (s.kind === 'bird') {
        if (s.delay > 0) {
          s.delay -= dt;
          continue;
        }
        s.x += s.vx * dt;
        const bob = s.bobAmp === undefined ? 26 : s.bobAmp;
        s.y = s.baseY + Math.sin(s.t * 4 + s.phase) * bob;
        if (s.life <= 0 || s.x < ARENA_L - 60) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'petal') {
        s.vy = Math.min(s.vy + 760 * dt, 620);
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        // Лепесток исчезает сразу при касании пола, а не лежит на нём.
        if (s.life <= 0 || s.y >= GROUND - 4) {
          spawnPetalBurst(s.x, GROUND - 6, s.color, 2);
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'flower') {
        if (s.t < s.leaveAt) {
          s.x = s.baseX + Math.sin(s.t * 1.35 + s.phase) * 158;
          s.y = s.baseY + Math.cos(s.t * 1.9 + s.phase) * 42;
        } else {
          s.vx = dir * 620;
          s.vy = -36 + Math.sin(s.t * 3.2 + s.phase) * 55;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (s.x < ARENA_L - 90 || s.x > ARENA_R + 90) {
            bossShots.splice(i, 1);
            continue;
          }
        }
        if (s.life <= 0) {
          bossShots.splice(i, 1);
          continue;
        }
        if (Math.random() < dt * 22) {
          addParticle({
            kind: 'dot',
            x: s.x + rand(-22, 22),
            y: s.y + rand(-18, 18),
            vx: rand(-24, 24),
            vy: rand(-50, 10),
            life: rand(0.2, 0.55),
            maxLife: 0.55,
            size: rand(1.5, 3.5),
            color: s.parryable ? pick([PINK, PINK_BRIGHT]) : s.color,
            rot: 0,
            vr: 0,
            grav: -30,
            drag: 0.6,
          });
        }
        // Каждый цветок выпускает ровно один лепесток раз в 3 секунды.
        // Таймеры сдвинуты, поэтому лепестки не вылетают залпом.
        s.petalT = (s.petalT === undefined ? 1.2 : s.petalT) - dt;
        if (s.petalT <= 0) {
          s.petalT = 3;
          const heroCenterY = hero.y - HERO_H * 0.5;
          const tooClose = Math.hypot(hero.x - s.x, heroCenterY - s.y) < 96;
          if (s.t < s.leaveAt - 0.15 && !hero.dead && !tooClose) {
            bossShots.push({
              kind: 'petal',
              x: s.x + rand(-10, 10),
              y: s.y + rand(-8, 8),
              vx: -s.dir * rand(18, 64),
              vy: 26,
              r: 9,
              t: 0,
              life: 3.6,
              parryable: false,
              color: s.color,
              spin: rand(0, TAU),
              dir: 1,
            });
          }
        }
        continue;
      }

      if (s.kind === 'button') {
        if (!s.returning && s.t < 2.45) {
          s.vy += 1320 * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (s.y > GROUND - 10) {
            s.y = GROUND - 10;
            s.vy = -Math.abs(s.vy) * 0.78;
            spawnDust(s.x, GROUND, 2, 0.4);
          }
          if (s.x < ARENA_L + 16) {
            s.x = ARENA_L + 16;
            s.vx = Math.abs(s.vx) * 0.86;
          } else if (s.x > ARENA_R - 16) {
            s.x = ARENA_R - 16;
            s.vx = -Math.abs(s.vx) * 0.86;
          }
        } else {
          s.returning = true;
          const dx = s.homeX - s.x;
          const dy = s.homeY - s.y;
          const dist = Math.hypot(dx, dy);
          const speed = 760;
          if (dist < 26) {
            boss.buttonsOut = Math.max(0, boss.buttonsOut - 1);
            spawnRing(s.homeX, s.homeY, GOLD_BRIGHT, 14);
            bossShots.splice(i, 1);
            continue;
          }
          s.x += (dx / dist) * speed * dt;
          s.y += (dy / dist) * speed * dt;
          s.spin += dt * 12;
        }
        if (s.life <= 0) {
          boss.buttonsOut = Math.max(0, boss.buttonsOut - 1);
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'spring') {
        s.vy += 1960 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.y > GROUND - s.r) {
          s.y = GROUND - s.r;
          s.vy = -Math.abs(s.vy) * 0.84;
          spawnDust(s.x, GROUND, 2, 0.35);
          Sound.sfx('land');
        }
        if (s.x < ARENA_L + 20) {
          s.x = ARENA_L + 20;
          s.vx = Math.abs(s.vx) * 0.94;
        } else if (s.x > ARENA_R - 20) {
          s.x = ARENA_R - 20;
          s.vx = -Math.abs(s.vx) * 0.94;
        }
        if (s.y < 120) {
          s.y = 120;
          s.vy = Math.abs(s.vy) * 0.72;
        }
        if (s.life <= 0) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'egg' || s.kind === 'concrete') {
        const gravity = s.kind === 'concrete' ? 980 : 1480;
        s.vy += gravity * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.y >= GROUND - 7) {
          if (s.kind === 'concrete') {
            spawnDust(s.x, GROUND, 16, 1.15);
            spawnRing(s.x, GROUND - 4, '#b5ab98', 28);
            spawnRing(s.x, GROUND - 4, CREAM, 14);
            game.shake = Math.max(game.shake, 8);
            addCrater(s.x);
            spawnComic(pick(['БУМ!', 'БАХ!', 'ХРУС!']), s.x, GROUND - 76, 25, RUST);
          } else {
            spawnDust(s.x, GROUND, 5, 0.55);
            for (let k = 0; k < 5; k++) {
              addParticle({
                kind: 'dot',
                x: s.x + rand(-10, 10),
                y: GROUND - rand(2, 12),
                vx: rand(-70, 70),
                vy: rand(-110, -20),
                life: rand(0.2, 0.45),
                maxLife: 0.45,
                size: rand(2, 4.5),
                color: pick(['#f4e7bf', '#d8c28e', '#b99a5c']),
                rot: 0,
                vr: 0,
                grav: 700,
                drag: 0.5,
              });
            }
          }
          bossShots.splice(i, 1);
          continue;
        }
        if (s.life <= 0) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      if (s.kind === 'fallBullet') {
        s.vy += (s.gravity || 280) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (Math.random() < dt * 34) {
          addParticle({
            kind: 'dot',
            x: s.x + rand(-5, 5),
            y: s.y - 10,
            vx: rand(-20, 20),
            vy: rand(-50, 20),
            life: rand(0.12, 0.3),
            maxLife: 0.3,
            size: rand(1.4, 3.4),
            color: pick(['#ffcf7a', CREAM, RUST]),
            rot: 0,
            vr: 0,
            grav: 40,
            drag: 0.8,
          });
        }
        if (s.life <= 0 || s.y > GROUND + 24) {
          bossShots.splice(i, 1);
          continue;
        }
        continue;
      }

      s.x += s.vx * dt;
      if (s.life <= 0 || s.x < ARENA_L - 30 || s.x > ARENA_R + 30) {
        bossShots.splice(i, 1);
        continue;
      }
      if (Math.random() < dt * 18) {
        addParticle({
          kind: 'dot',
          x: s.x - dir * 10,
          y: s.y + rand(-6, 6),
          vx: -dir * rand(20, 70),
          vy: rand(-30, 30),
          life: rand(0.1, 0.3),
          maxLife: 0.3,
          size: rand(1, 3),
          color: s.parryable ? PINK_BRIGHT : pick([CREAM, '#e6dcca']),
          rot: 0,
          vr: 0,
          grav: 0,
          drag: 1,
        });
      }
    }
  }

  // ---------- эффекты ----------
  function addParticle(p) {
    if (particles.length > 420) particles.shift();
    particles.push(p);
  }

  function spawnHitSparks(x, y) {
    for (let i = 0; i < 5; i++) {
      addParticle({
        kind: 'spark',
        x: x + rand(-6, 6),
        y: y + rand(-8, 8),
        vx: rand(-220, 260),
        vy: rand(-240, 100),
        life: rand(0.16, 0.4),
        maxLife: 0.4,
        size: rand(3, 7),
        color: pick([GOLD_BRIGHT, CREAM, RUST]),
        rot: rand(0, TAU),
        vr: rand(-14, 14),
        grav: 700,
        drag: 1.4,
      });
    }
    addParticle({
      kind: 'ring',
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.18,
      maxLife: 0.18,
      size: 10,
      color: CREAM,
      rot: 0,
      vr: 0,
      grav: 0,
      drag: 0,
    });
  }

  function spawnPetalBurst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      addParticle({
        kind: 'petal',
        x: x + rand(-18, 18),
        y: y + rand(-18, 18),
        vx: rand(-260, 260),
        vy: rand(-300, 80),
        life: rand(0.6, 1.25),
        maxLife: 1.25,
        size: rand(5, 10),
        color: i % 3 === 0 ? '#f5d069' : color,
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        grav: 420,
        drag: 0.55,
      });
    }
  }

  function spawnPaperBurst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      addParticle({
        kind: 'spark',
        x: x + rand(-12, 12),
        y: y + rand(-12, 12),
        vx: rand(-240, 240),
        vy: rand(-260, 70),
        life: rand(0.25, 0.6),
        maxLife: 0.6,
        size: rand(3, 7),
        color: pick([color, '#fff2dc', '#e26b62']),
        rot: rand(0, TAU),
        vr: rand(-12, 12),
        grav: 640,
        drag: 0.8,
      });
    }
    spawnRing(x, y, color, 16);
  }

  function spawnPetalTrap() {
    const h = hero;
    if (h.dead) return;
    const baseX = clamp(h.x, ARENA_L + 30, ARENA_R - 30);
    spawnRing(baseX, GROUND - 6, 'rgba(231, 91, 91, 0.7)', 30);
    spawnDust(baseX, GROUND, 5, 0.7);
    for (let i = 0; i < 6; i++) {
      bossShots.push({
        kind: 'petal',
        x: baseX + rand(-46, 46),
        y: GROUND + rand(6, 34),
        vx: rand(-120, 120),
        vy: rand(-580, -430),
        r: 9,
        t: 0,
        life: 2.8,
        parryable: false,
        color: pick(['#e75b5b', '#f0c04e', '#79a7ea']),
        spin: rand(0, TAU),
        dir: 1,
        fromTrap: true,
      });
    }
    Sound.sfx('shoot');
  }

  function spawnWheelBurst(x, y = GROUND, count = 4) {
    for (let i = 0; i < count; i++) {
      addParticle({
        kind: 'wheel',
        x: x + rand(-90, 90),
        y: y - rand(10, 44),
        vx: rand(-430, 430),
        vy: rand(-760, -260),
        life: rand(0.8, 1.5),
        maxLife: 1.5,
        size: rand(15, 24),
        color: '#9b6734',
        rot: rand(0, TAU),
        vr: rand(-15, 15),
        grav: 1650,
        drag: 0.08,
      });
    }
  }

  function spawnDust(x, y, count, power = 1) {
    for (let i = 0; i < count; i++) {
      addParticle({
        kind: 'smoke',
        x: x + rand(-26, 26) * power,
        y: y - rand(0, 8),
        vx: rand(-180, 180) * power,
        vy: rand(-150, -30) * power,
        life: rand(0.35, 0.8),
        maxLife: 0.8,
        size: rand(7, 16) * Math.min(1.5, power),
        grow: rand(20, 48),
        color: pick([CREAM, '#ddc7a0', PAPER]),
        rot: 0,
        vr: 0,
        grav: -40,
        drag: 1.4,
      });
    }
  }

  function spawnSmokeCloud(x, y) {
    for (let i = 0; i < 18; i++) {
      addParticle({
        kind: 'smoke',
        x: x + rand(-34, 34),
        y: y - rand(4, 82),
        vx: rand(-150, 150),
        vy: rand(-110, 30),
        life: rand(0.45, 0.95),
        maxLife: 0.95,
        size: rand(14, 30),
        grow: rand(24, 52),
        color: pick(['#d7d0bb', '#b9b6a7', '#efe3c7', '#8e9288']),
        rot: rand(0, TAU),
        vr: rand(-1.8, 1.8),
        grav: -20,
        drag: 1.1,
      });
    }
  }

  function spawnRing(x, y, color, size) {
    addParticle({
      kind: 'ring',
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.45,
      maxLife: 0.45,
      size,
      color,
      rot: 0,
      vr: 0,
      grav: 0,
      drag: 0,
    });
  }

  function spawnComic(text, x, y, size = 30, color = GOLD_BRIGHT, burst = true) {
    addParticle({
      kind: 'comic',
      x,
      y,
      vx: rand(-14, 14),
      vy: -46,
      life: 0.85,
      maxLife: 0.85,
      size,
      color,
      text,
      burst,
      rot: rand(-0.14, 0.14),
      vr: rand(-0.4, 0.4),
      grav: -10,
      drag: 0.8,
    });
  }

  function spawnSteam(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      addParticle({
        kind: 'smoke',
        x: x + rand(-14, 14),
        y: y + rand(-8, 8),
        vx: rand(-34, 34),
        vy: rand(-100, -30),
        life: rand(0.5, 1),
        maxLife: 1,
        size: rand(6, 14),
        grow: rand(16, 30),
        color: pick(['#e7d8bc', '#f3e6cc', '#d4c1a2']),
        rot: 0,
        vr: 0,
        grav: -30,
        drag: 0.7,
      });
    }
  }

  function spawnHat(x, y) {
    addParticle({
      kind: 'hat',
      x,
      y,
      vx: rand(-260, -120),
      vy: rand(-650, -420),
      life: 2.2,
      maxLife: 2.2,
      size: 34,
      color: TEAL,
      rot: rand(-0.4, 0.4),
      vr: rand(-7, 7),
      grav: 900,
      drag: 0.1,
    });
  }

  function addCrater(x) {
    if (craters.length > 7) craters.shift();
    craters.push({ x, seed: rand(0, 1000) });
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.grav || 0) * dt;
      if (p.drag) {
        const d = Math.exp(-p.drag * dt);
        p.vx *= d;
        p.vy *= d;
      }
      p.rot += p.vr * dt;
      if (p.kind === 'smoke' && p.grow) p.size += p.grow * dt;
    }
  }

  function updateGhosts(dt) {
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].life -= dt;
      if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    }
  }

  function updateMotes(dt) {
    for (const m of motes) {
      m.y -= m.speed * dt;
      m.x += Math.sin(game.time * 0.4 + m.phase) * m.drift * dt;
      if (m.y < 120) {
        m.y = 560;
        m.x = rand(60, 1220);
      }
    }
  }

  function updateCamera(dt) {
    if (game.shake > 0) {
      game.shake = Math.max(0, game.shake - game.shake * 7 * dt - 6 * dt);
      if (game.shake < 0.05) game.shake = 0;
    }
    game.flash = Math.max(0, game.flash - dt * 2.2);
  }

  function updateMenu(dt) {
    // сцена-афиша: персонажи просто дышат на фоне
    hero.idleT += dt;
    boss.breathe += dt;
    boss.face = -1;
    hero.face = 1;
    if (Math.random() < dt * 0.7) {
      addParticle({
        kind: 'dot',
        x: rand(200, 1100),
        y: rand(180, 520),
        vx: rand(-10, 10),
        vy: rand(-20, -4),
        life: rand(1, 2),
        maxLife: 2,
        size: rand(1, 3),
        color: GOLD_BRIGHT,
        rot: 0,
        vr: 0,
        grav: 0,
        drag: 0,
      });
    }
  }

  function updateArenaHazards(dt) {
    if (game.bossId === 'letunov' && boss.phase === 2 && !boss.dying) {
      boss.platformTimer -= dt;
      if (boss.platformTimer <= 0 && platforms.length < 3) {
        boss.platformTimer = rand(4.2, 5.8);
        const x = clamp(hero.x + rand(-300, 300), 190, 1090);
        platforms.push({ x, y: -45, targetY: GROUND - rand(148, 162), w: rand(132, 172), h: 18, vy: rand(170, 215), life: 9, solid: false, landed: false });
        spawnComic('ПЛАТФОРМА!', x, 100, 18, GOLD_BRIGHT);
      }
    }
    for (let i = platforms.length - 1; i >= 0; i--) {
      const p = platforms[i];
      p.life -= dt;
      if (p.kind === 'egorCloud') {
        const prevY = p.y;
        if (p.lifting) {
          p.liftT += dt;
          const k = clamp(p.liftT / p.liftDur, 0, 1);
          p.y = lerp(p.startY, p.targetY, easeOutCubic(k));
          if (k >= 1) p.lifting = false;
          if (Math.random() < dt * 16) spawnDust(p.x + rand(-60, 60), p.y + 8, 1, 0.35);
        } else {
          p.y = p.bobAmp ? p.baseY + Math.sin(game.time * p.bobSpeed + p.bobPhase) * p.bobAmp : p.baseY;
        }
        const dy = p.y - prevY;
        if (
          hero.onGround &&
          Math.abs(hero.x - p.x) <= p.w / 2 - 6 &&
          Math.abs(hero.y - prevY) < 8
        ) {
          hero.y += dy;
        }
        if (p.life <= 0) platforms.splice(i, 1);
        continue;
      }
      if (!p.solid) {
        p.y += p.vy * dt;
        if (p.y >= p.targetY) {
          p.y = p.targetY;
          p.solid = true;
          p.landed = true;
          spawnDust(p.x, p.y, 8, 0.7);
          Sound.sfx('land');
          game.shake = Math.max(game.shake, 2);
        }
      }
      if (p.life <= 0) platforms.splice(i, 1);
    }
    for (let i = parryOrbs.length - 1; i >= 0; i--) {
      const orb = parryOrbs[i];
      orb.life -= dt;
      orb.pulse += dt * 5;
      if (orb.life <= 0) parryOrbs.splice(i, 1);
    }
  }

  function drawSchoolRoutePlatform(p) {
    const half = p.w / 2;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.kind === 'roof') {
      ctx.fillStyle = 'rgba(26, 13, 12, 0.25)';
      roundRect(ctx, -half + 5, -9, p.w, 30, 7);
      ctx.fill();
      roundRect(ctx, -half, -14, p.w, 28, 6);
      fillStroke(ctx, '#8e6b47', INK, 3);
      ctx.fillStyle = '#b98b58';
      ctx.fillRect(-half + 8, -10, p.w - 16, 6);
      ctx.fillStyle = 'rgba(255, 232, 181, 0.2)';
      ctx.fillRect(-half + 10, -8, p.w - 20, 2);
      // люк на крышу
      const hx = half - 70;
      roundRect(ctx, hx - 36, -52, 72, 40, 4);
      fillStroke(ctx, 'rgba(35, 28, 23, 0.88)', GOLD_BRIGHT, 2.5);
      ctx.strokeStyle = GOLD_BRIGHT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx - 14, -20);
      ctx.lineTo(hx - 14, -38);
      ctx.lineTo(hx, -48);
      ctx.lineTo(hx + 14, -38);
      ctx.lineTo(hx + 14, -20);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.font = `900 8px Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('КРЫША', hx, -2);
      ctx.restore();
      return;
    }
    // парта/полка: деревянная доска, ножки и книги
    ctx.fillStyle = 'rgba(26, 13, 12, 0.3)';
    roundRect(ctx, -half + 4, -7, p.w, 26, 5);
    ctx.fill();
    roundRect(ctx, -half, -12, p.w, 26, 5);
    fillStroke(ctx, '#a97443', INK, 3);
    ctx.fillStyle = 'rgba(255, 226, 164, 0.28)';
    ctx.fillRect(-half + 8, -8, p.w - 16, 3);
    ctx.fillStyle = '#70472c';
    roundRect(ctx, -half + 12, 13, 12, 36, 3);
    fillStroke(ctx, '#70472c', INK, 2);
    roundRect(ctx, half - 26, 13, 12, 36, 3);
    fillStroke(ctx, '#70472c', INK, 2);
    if (p.kind === 'books') {
      for (let i = 0; i < 4; i++) {
        const bw = 29 - i * 2;
        const bx = -half + 24 + i * 28;
        roundRect(ctx, bx, -24 - i * 2, bw, 9, 2);
        fillStroke(ctx, i % 2 ? '#b24b3d' : '#3e746a', INK, 1.5);
      }
    } else {
      roundRect(ctx, -half + 28, -26, 54, 10, 2);
      fillStroke(ctx, '#e4d3ad', INK, 1.6);
      ctx.strokeStyle = 'rgba(80, 55, 36, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-half + 35, -22);
      ctx.lineTo(-half + 72, -22);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(45, 24, 18, 0.55)';
    ctx.font = `700 7px Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ШКОЛА №53', 0, 3);
    ctx.restore();
  }

  function drawEgorCloud(p) {
    const half = p.w / 2;
    const alpha = p.life < 0.5 ? clamp(p.life / 0.34, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    // мягкое свечение
    const glow = ctx.createRadialGradient(0, 6, 8, 0, 6, half + 34);
    glow.addColorStop(0, 'rgba(221, 246, 235, 0.3)');
    glow.addColorStop(1, 'rgba(221, 246, 235, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 6, half + 34, 34, 0, 0, TAU);
    ctx.fill();
    // нижняя тень
    ctx.fillStyle = 'rgba(31, 62, 60, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 17, half * 0.92, 13, 0, 0, TAU);
    ctx.fill();
    // пушистые клубы: чем шире облако, тем больше шапок
    const puffs = clamp(Math.round(p.w / 92), 7, 18);
    for (let i = 0; i < puffs; i++) {
      const u = puffs === 1 ? 0 : i / (puffs - 1);
      const px = lerp(-half + 22, half - 22, u);
      const lift = Math.sin(u * Math.PI) * 10;
      const r = 20 + Math.sin(u * Math.PI) * 9 + (i % 2) * 2;
      ctx.beginPath();
      ctx.arc(px, -6 - lift, r, 0, TAU);
      fillStroke(ctx, i % 2 ? '#e8f5ee' : '#d7ece5', '#52716c', 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.36)';
      ctx.beginPath();
      ctx.ellipse(px - r * 0.24, -6 - lift - r * 0.34, r * 0.5, r * 0.26, -0.45, 0, TAU);
      ctx.fill();
    }
    // плоская верхняя кромка, на которую можно встать
    roundRect(ctx, -half + 8, -11, p.w - 16, 16, 8);
    fillStroke(ctx, '#edf7f0', '#52716c', 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    roundRect(ctx, -half + 18, -8, p.w - 36, 4, 2);
    ctx.fill();
    ctx.restore();
  }

  function drawArenaHazards() {
    for (const p of platforms) {
      if (p.route) {
        drawSchoolRoutePlatform(p);
        continue;
      }
      if (p.kind === 'egorCloud') {
        drawEgorCloud(p);
        continue;
      }
      if (p.kind === 'egorLog') {
        drawEgorLog(p);
        continue;
      }
      if (p.kind === 'egorBranch') {
        drawEgorBranchPlatform(p);
        continue;
      }
      if (p.kind === 'elenaDesk') {
        continue;
      }
      const alpha = p.life < 1 ? clamp(p.life, 0, 1) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;

      if (!p.solid) {
        // метка, куда приземлится платформа
        const targetY = p.targetY;
        ctx.strokeStyle = 'rgba(240, 200, 119, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 7]);
        ctx.lineDashOffset = -game.time * 40;
        ctx.beginPath();
        ctx.moveTo(p.x - p.w / 2, targetY);
        ctx.lineTo(p.x + p.w / 2, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
        for (let i = -1; i <= 1; i += 2) {
          const bx = p.x + i * (p.w / 2 + 13);
          ctx.fillStyle = 'rgba(240, 200, 119, 0.62)';
          ctx.beginPath();
          ctx.moveTo(bx - 8, targetY - 6);
          ctx.lineTo(bx + 8, targetY - 6);
          ctx.lineTo(bx, targetY + 6);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255, 240, 196, 0.14)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 10]);
        ctx.beginPath();
        ctx.moveTo(p.x - p.w / 2 + 8, p.y - 30);
        ctx.lineTo(p.x - p.w / 2 + 8, targetY - 10);
        ctx.moveTo(p.x + p.w / 2 - 8, p.y - 30);
        ctx.lineTo(p.x + p.w / 2 - 8, targetY - 10);
        ctx.stroke();
        ctx.setLineDash([]);
        // полосы движения
        ctx.strokeStyle = 'rgba(255, 231, 182, 0.24)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(p.x + i * 28, p.y - 26);
          ctx.lineTo(p.x + i * 28, p.y - 66 - Math.abs(i) * 14);
          ctx.stroke();
        }
      }

      ctx.translate(p.x, p.y);
      ctx.shadowColor = 'rgba(20, 8, 7, 0.35)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, 7);
      fillStroke(ctx, '#b9793e', INK, 3);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255,226,164,.72)';
      ctx.fillRect(-p.w / 2 + 8, -p.h / 2 + 3, p.w - 16, 3);
      ctx.fillStyle = 'rgba(86, 47, 26, 0.32)';
      ctx.fillRect(-p.w / 2 + 8, p.h / 2 - 5, p.w - 16, 2);
      for (let i = -2; i <= 2; i++) circle(ctx, i * 23, 0, 2.5, GOLD_BRIGHT, INK, 1);
      // золотые ленточки по краям
      ctx.fillStyle = p.solid ? GOLD : 'rgba(211, 160, 74, 0.65)';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * (p.w / 2 - 2), -p.h / 2 + 4);
        ctx.lineTo(side * (p.w / 2 + 14), -p.h / 2 - 5 + Math.sin(game.time * 5 + p.x) * 2);
        ctx.lineTo(side * (p.w / 2 + 12), p.h / 2 - 3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    for (const orb of parryOrbs) {
      const pulse = 1 + Math.sin(orb.pulse) * 0.11;
      const fade = orb.life < 0.75 ? clamp(orb.life / 0.75, 0, 1) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(orb.x, orb.y);
      // мягкое розовое свечение
      const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 48);
      glow.addColorStop(0, 'rgba(255, 157, 195, 0.5)');
      glow.addColorStop(0.5, 'rgba(255, 110, 164, 0.2)');
      glow.addColorStop(1, 'rgba(255, 110, 164, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, TAU);
      ctx.fill();

      ctx.save();
      ctx.scale(pulse, pulse);
      ctx.rotate(Math.sin(orb.pulse * 0.6) * 0.08);
      ctx.beginPath();
      ctx.moveTo(0, 17);
      ctx.bezierCurveTo(-26, 3, -18, -17, 0, -7);
      ctx.bezierCurveTo(18, -17, 26, 3, 0, 17);
      ctx.closePath();
      fillStroke(ctx, PINK, INK, 3.5);
      ctx.fillStyle = 'rgba(255, 235, 243, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-7, -4, 5, 3, -0.4, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 208, 226, 0.82)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 6]);
      ctx.lineDashOffset = -game.time * 30;
      ctx.beginPath();
      ctx.arc(0, 0, 29, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `900 8px Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.strokeText('ПАРИ', 0, -37);
      ctx.fillStyle = PINK_BRIGHT;
      ctx.fillText('ПАРИ', 0, -37);
      ctx.restore();
    }
  }

  function updateFight(dt) {
    game.fightTime += dt;

    if (game.introT > 0) {
      const prev = game.introT;
      game.introT = Math.max(0, game.introT - dt);
      if (prev > 0.85 && game.introT <= 0.85) {
        Sound.sfx('bell');
        game.shake = Math.max(game.shake, 2);
      }
    }

    updateHero(dt);
    updateBoss(dt);
    updateBullets(dt);
    updateTurrets(dt);
    updateWaves(dt);
    updateSoundWaves(dt);
    updateWindCharges(dt);
    updateBossShots(dt);
    updateArenaHazards(dt);

    if (!game.ended) resolveHeroDamage();

    if (game.endTimer > 0) {
      game.endTimer -= dt;
      if (game.endTimer <= 0) {
        game.endTimer = 0;
        finishGame(game.endingWin);
        return;
      }
    }
  }

  // ---------- школа: коридор с двумя кабинетами ----------
  const SCHOOL_DOORS = [
    { kind: 'closed', x: 315, label: 'КАБИНЕТ ЗАКРЫТ', sub: 'Ключ у Елены Гурьевны' },
    { kind: 'elena', x: 790, label: 'КАБИНЕТ 2-Б', sub: 'ЕЛЕНА ГУРЬЕВНА · УРОК' },
    { kind: 'denis', x: 1155, label: 'ДЕНИС', sub: 'СТОИТ В КОНЦЕ КОРИДОРА' },
    { kind: 'trash', x: 540, label: 'МУСОРКА', sub: 'МОНЕТА ВНУТРИ' },
  ];

  function enterSchool() {
    Sound.stopMusic();
    game.bossId = 'denis';
    resetWorld();
    game.scene = 'school';
    hero.x = 130;
    hero.y = GROUND;
    hero.vx = 0;
    hero.vy = 0;
    hero.face = 1;
    hero.hp = hero.maxHp;
    hero.cards = 0;
    document.body.dataset.scene = 'school';
    document.body.classList.remove('is-paused');
    showPanel(null);
    if (mapBackButton) mapBackButton.hidden = false;
    schoolState.near = null;
    schoolState.toast = 'Два кабинета. Один закрыт. Денис ждёт в конце коридора.';
    schoolState.toastT = 3.2;
    schoolState.t = 0;
    releaseAll();
  }

  function schoolInteract() {
    const n = schoolState.near;
    if (!n) {
      schoolState.toast = 'Прогуляйся по коридору: слева закрытый кабинет, справа урок, в конце — Денис.';
      schoolState.toastT = 2.2;
      return;
    }
    if (n.kind === 'closed') {
      if (progress.nikitaKey) {
        Sound.sfx('click');
        startGame('nikita');
        return;
      }
      schoolState.toast = 'Кабинет закрыт. Из-за двери слышно, как кто-то точит красный карандаш.';
      schoolState.toastT = 2.6;
      Sound.sfx('hurt');
      return;
    }
    if (n.kind === 'nikita') {
      Sound.sfx('click');
      startGame('nikita');
      return;
    }
    if (n.kind === 'elena') {
      Sound.sfx('click');
      startGame('elena');
      return;
    }
    if (n.kind === 'denis') {
      Sound.sfx('click');
      openDifficulty('denis');
      return;
    }
    if (n.kind === 'trash') {
      if (progress.schoolCoin) {
        schoolState.toast = 'В мусорке только фантики. Монета уже у тебя.';
        schoolState.toastT = 2.2;
        Sound.sfx('click');
        return;
      }
      progress.schoolCoin = true;
      progress.coins += 1;
      saveProgress();
      updateMetaUI();
      schoolState.toast = '+1 монета! Теперь можно купить Щелкунчика в магазине.';
      schoolState.toastT = 3;
      spawnRing(540, GROUND - 60, GOLD_BRIGHT, 26);
      for (let i = 0; i < 14; i++) {
        addParticle({
          kind: 'star',
          x: 540 + rand(-10, 10),
          y: GROUND - 66 + rand(-8, 8),
          vx: rand(-220, 220),
          vy: rand(-300, -40),
          life: rand(0.35, 0.8),
          maxLife: 0.8,
          size: rand(3, 8),
          color: pick([GOLD, GOLD_BRIGHT, CREAM]),
          rot: rand(0, TAU),
          vr: rand(-10, 10),
          grav: 500,
          drag: 0.7,
        });
      }
      Sound.sfx('card');
      return;
    }
  }

  function updateSchool(dt) {
    schoolState.t += dt;
    schoolState.toastT = Math.max(0, schoolState.toastT - dt);
    if (pendingBossId) return;
    const h = hero;
    const move = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    h.vx = approach(h.vx, move * 300, 2900 * dt);
    h.x = clamp(h.x + h.vx * dt, 76, 1210);
    if (Math.abs(h.vx) > 20) {
      h.face = h.vx > 0 ? 1 : -1;
      h.lastMove = h.face;
      h.runT += Math.abs(h.vx) * dt * 0.045;
    }
    h.idleT += dt;
    h.y = GROUND;
    h.vy = 0;
    h.onGround = true;
    h.crouchK = 0;
    h.shootAnim = Math.max(0, h.shootAnim - dt * 5);

    let near = null;
    let best = 126;
    for (const d of SCHOOL_DOORS) {
      const dist = Math.abs(h.x - d.x);
      if (dist < best) {
        best = dist;
        near = d;
      }
    }
    schoolState.near = near;
    if (pressed.jump) {
      pressed.jump = false;
      schoolInteract();
    }
  }

  function drawDenisCorridorFigure(x) {
    const t = schoolState.t;
    ctx.save();
    ctx.translate(x, GROUND);
    ctx.fillStyle = 'rgba(32, 20, 16, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 44, 8, 0, 0, TAU);
    ctx.fill();
    // ноги
    ctx.strokeStyle = '#26344d';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -66);
    ctx.lineTo(-18, -6);
    ctx.moveTo(12, -66);
    ctx.lineTo(20, -6);
    ctx.stroke();
    ctx.fillStyle = '#2a1f1b';
    roundRect(ctx, -30, -10, 26, 10, 4);
    fillStroke(ctx, '#2a1f1b', INK, 2);
    roundRect(ctx, 8, -10, 28, 10, 4);
    fillStroke(ctx, '#2a1f1b', INK, 2);
    // рюкзак
    roundRect(ctx, -34, -154, 24, 62, 9);
    fillStroke(ctx, '#7a2d2a', INK, 3);
    // тело
    roundRect(ctx, -24, -164, 48, 98, 18);
    fillStroke(ctx, '#3f5f56', INK, 3.2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, -16, -154, 13, 46, 6);
    ctx.fill();
    // руки
    ctx.strokeStyle = '#3f5f56';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-22, -150);
    ctx.lineTo(-34, -106);
    ctx.moveTo(22, -150);
    ctx.lineTo(34, -108);
    ctx.stroke();
    circle(ctx, -35, -103, 6, SKIN, INK, 2.4);
    circle(ctx, 35, -105, 6, SKIN, INK, 2.4);
    // голова
    const bob = Math.sin(t * 1.8) * 1.5;
    circle(ctx, 0, -186 + bob, 25, SKIN, INK, 3.4);
    ctx.beginPath();
    ctx.moveTo(-26, -196 + bob);
    ctx.quadraticCurveTo(-16, -228 + bob, 12, -216 + bob);
    ctx.quadraticCurveTo(27, -205 + bob, 24, -190 + bob);
    ctx.quadraticCurveTo(4, -202 + bob, -12, -190 + bob);
    ctx.closePath();
    fillStroke(ctx, '#2b201c', INK, 2.6);
    circle(ctx, -8, -184 + bob, 2.4, INK, null, 0);
    circle(ctx, 7, -184 + bob, 2.4, INK, null, 0);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -176 + bob);
    ctx.quadraticCurveTo(0, -172 + bob, 8, -177 + bob);
    ctx.stroke();
    // телефон в руке
    roundRect(ctx, 28, -112, 12, 20, 3);
    fillStroke(ctx, '#111', '#7ee0ff', 1.5);
    ctx.restore();
  }

  function drawCorridorDoor(x, open, kind) {
    // дверная рама
    if (open) {
      const glow = ctx.createRadialGradient(x, GROUND - 140, 18, x, GROUND - 140, 160);
      glow.addColorStop(0, 'rgba(255, 227, 160, 0.4)');
      glow.addColorStop(1, 'rgba(255, 227, 160, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, GROUND - 140, 160, 0, TAU);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(x, GROUND);
    roundRect(ctx, -72, -262, 144, 262, 10);
    fillStroke(ctx, open ? '#2d5f57' : '#3c2a24', INK, 4);
    if (open) {
      if (kind === 'nikita') {
        // Тёмный кабинет: свет почти не проходит, у стены сидит
        // маленький Никита и ждёт.
        roundRect(ctx, -61, -250, 122, 250, 6);
        fillStroke(ctx, '#17161b', '#4d4436', 3);
        const glow = ctx.createRadialGradient(0, -118, 9, 0, -118, 94);
        glow.addColorStop(0, 'rgba(255, 214, 140, 0.28)');
        glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -118, 94, 0, TAU);
        ctx.fill();
        // доска и парты в темноте
        ctx.fillStyle = 'rgba(31, 64, 53, 0.75)';
        roundRect(ctx, -48, -222, 96, 74, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(185, 135, 83, 0.48)';
        roundRect(ctx, -48, -104, 38, 7, 3);
        ctx.fill();
        roundRect(ctx, 8, -80, 38, 7, 3);
        ctx.fill();
        // Никита: маленький силуэт с телефоном
        ctx.save();
        ctx.translate(-2, -20);
        ctx.fillStyle = '#1d1a1c';
        roundRect(ctx, -16, -74, 32, 56, 12);
        ctx.fill();
        circle(ctx, 0, -92, 17, '#2b2424', INK, 2.6);
        ctx.strokeStyle = '#2b2424';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-12, -62);
        ctx.lineTo(-24, -40);
        ctx.moveTo(13, -62);
        ctx.lineTo(25, -45);
        ctx.stroke();
        ctx.fillStyle = '#7ee0ff';
        roundRect(ctx, 20, -54, 8, 14, 2);
        ctx.fill();
        ctx.restore();
      } else {
        // проём и класс за дверью
        roundRect(ctx, -61, -250, 122, 250, 6);
        fillStroke(ctx, '#f0d9a0', '#8b6a41', 3);
        ctx.fillStyle = '#2f4d3f';
        roundRect(ctx, -48, -220, 96, 92, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 247, 220, 0.75)';
        ctx.font = `700 11px Verdana, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('2 · 2 = ?', 0, -178);
        // парты в глубине
        ctx.fillStyle = '#b98753';
        roundRect(ctx, -48, -96, 42, 8, 3);
        ctx.fill();
        roundRect(ctx, 8, -96, 42, 8, 3);
        ctx.fill();
        // приоткрытая створка
        ctx.save();
        ctx.translate(66, -126);
        ctx.rotate(-0.32);
        roundRect(ctx, 0, -124, 34, 250, 6);
        fillStroke(ctx, '#497f73', INK, 3);
        ctx.fillStyle = GOLD;
        circle(ctx, 21, 0, 3.4, GOLD, INK, 1.6);
        ctx.restore();
      }
    } else {
      roundRect(ctx, -61, -250, 122, 250, 6);
      fillStroke(ctx, '#5b3b2c', INK, 3);
      ctx.strokeStyle = 'rgba(28, 16, 12, 0.4)';
      ctx.lineWidth = 2;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-54, -250 + i * 62);
        ctx.lineTo(54, -250 + i * 62);
        ctx.stroke();
      }
      // табличка
      roundRect(ctx, -40, -228, 80, 24, 4);
      fillStroke(ctx, '#d8c49a', INK, 2);
      ctx.fillStyle = '#7d2220';
      ctx.font = `900 13px ${FONT_DISPLAY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(kind === 'closed' ? 'ЗАКРЫТО' : '2-Б', 0, -216);
      ctx.fillStyle = '#d9b05f';
      circle(ctx, 44, -120, 4.6, GOLD, INK, 1.8);
      // цепь
      ctx.strokeStyle = '#9a9a92';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-58, -158);
      ctx.lineTo(58, -116);
      ctx.stroke();
      ctx.fillStyle = '#7b7b72';
      roundRect(ctx, -12, -142, 24, 20, 4);
      fillStroke(ctx, '#7b7b72', INK, 1.8);
    }
    ctx.restore();
    // подпись
    ctx.save();
    roundRect(ctx, x - 92, GROUND - 302, 184, 28, 6);
    fillStroke(ctx, 'rgba(34, 20, 16, 0.82)', 'rgba(211, 160, 74, 0.5)', 1.2);
    ctx.fillStyle = CREAM;
    ctx.font = `700 10px Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      kind === 'closed'
        ? 'КАБИНЕТ ЗАКРЫТ'
        : kind === 'nikita'
          ? 'ТЁМНЫЙ КАБИНЕТ · ОТКРЫТ'
          : 'КАБИНЕТ 2-Б · ОТКРЫТ',
      x,
      GROUND - 288
    );
    ctx.restore();
  }

  function drawSchoolTrash() {
    const x = 540;
    ctx.save();
    ctx.translate(x, GROUND);
    ctx.fillStyle = 'rgba(30, 20, 14, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 34, 7, 0, 0, TAU);
    ctx.fill();
    // ведро
    ctx.beginPath();
    ctx.moveTo(-25, -62);
    ctx.lineTo(25, -62);
    ctx.lineTo(19, 0);
    ctx.lineTo(-19, 0);
    ctx.closePath();
    fillStroke(ctx, '#59615e', INK, 2.8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-17, -50);
    ctx.lineTo(-13, -8);
    ctx.stroke();
    // крышка
    roundRect(ctx, -29, -70, 58, 12, 5);
    fillStroke(ctx, '#6e7773', INK, 2.4);
    // бумажки
    ctx.fillStyle = '#e6d9b7';
    ctx.save();
    ctx.translate(8, -72);
    ctx.rotate(0.4);
    roundRect(ctx, -9, -3, 18, 10, 2);
    ctx.fill();
    ctx.restore();
    if (!progress.schoolCoin) {
      const bob = Math.sin(schoolState.t * 3.2) * 3;
      const glow = ctx.createRadialGradient(0, -78 + bob, 4, 0, -78 + bob, 30);
      glow.addColorStop(0, 'rgba(255, 219, 120, 0.55)');
      glow.addColorStop(1, 'rgba(255, 219, 120, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -78 + bob, 30, 0, TAU);
      ctx.fill();
      circle(ctx, 0, -78 + bob, 10, GOLD, INK, 2.2);
      circle(ctx, 0, -78 + bob, 6, GOLD_BRIGHT, null, 0);
      ctx.fillStyle = '#b58a2e';
      ctx.font = `900 9px ${FONT_DISPLAY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₽', 0, -77 + bob);
    }
    ctx.restore();
  }

  function drawSchoolCorridor() {
    const t = schoolState.t;
    const wall = ctx.createLinearGradient(0, 0, 0, GROUND);
    wall.addColorStop(0, '#d9c9a5');
    wall.addColorStop(0.52, '#cdb98e');
    wall.addColorStop(1, '#b9a173');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, GROUND);
    // верхний бордюр и панель
    ctx.fillStyle = '#7a5b3d';
    ctx.fillRect(0, 0, W, 26);
    ctx.fillStyle = '#41655b';
    ctx.fillRect(0, 386, W, GROUND - 386);
    ctx.fillStyle = 'rgba(255, 246, 218, 0.17)';
    ctx.fillRect(0, 392, W, 5);
    // плинтус
    ctx.fillStyle = '#5a4130';
    ctx.fillRect(0, GROUND - 16, W, 18);
    // пол
    const floor = ctx.createLinearGradient(0, GROUND, 0, H);
    floor.addColorStop(0, '#6b4c34');
    floor.addColorStop(1, '#3b271d');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.strokeStyle = 'rgba(255, 235, 196, 0.16)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 13; i++) {
      const x = i * 108 + ((t * 6) % 108);
      ctx.beginPath();
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x - 60, H);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(30, 18, 12, 0.22)';
    ctx.lineWidth = 3;
    for (let i = 1; i < 4; i++) {
      const y = GROUND + i * 33;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // потолочные лампы
    for (let i = 0; i < 4; i++) {
      const x = 170 + i * 330;
      ctx.fillStyle = 'rgba(255, 240, 190, 0.18)';
      ctx.beginPath();
      ctx.moveTo(x - 56, 12);
      ctx.lineTo(x + 56, 12);
      ctx.lineTo(x + 120, 170);
      ctx.lineTo(x - 120, 170);
      ctx.closePath();
      ctx.fill();
      roundRect(ctx, x - 42, 4, 84, 12, 5);
      fillStroke(ctx, '#f6edcf', '#6e5639', 2);
    }
    // плакаты
    ctx.save();
    ctx.translate(635, 210);
    ctx.rotate(-0.03);
    roundRect(ctx, -70, -48, 140, 96, 5);
    fillStroke(ctx, '#efe1ba', '#7f6340', 2.4);
    ctx.fillStyle = '#a53a2f';
    ctx.font = `900 18px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('МЫ ЛЮБИМ', 0, -18);
    ctx.fillStyle = '#355e50';
    ctx.font = `900 24px ${FONT_DISPLAY}`;
    ctx.fillText('УЧИТЬСЯ', 0, 12);
    ctx.fillStyle = '#7d6a45';
    ctx.font = `600 8px Verdana, sans-serif`;
    ctx.fillText('ШКОЛА №53', 0, 34);
    ctx.restore();
    // часы
    circle(ctx, 965, 112, 26, '#f3e8c9', '#6b5337', 3);
    ctx.strokeStyle = '#3c2c20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(965, 112);
    ctx.lineTo(965, 96);
    ctx.moveTo(965, 112);
    ctx.lineTo(978, 117);
    ctx.stroke();

    drawCorridorDoor(
      SCHOOL_DOORS[0].x,
      !!progress.nikitaKey,
      progress.nikitaKey ? 'nikita' : 'closed'
    );
    drawCorridorDoor(SCHOOL_DOORS[1].x, true, 'elena');
    drawSchoolTrash();
    drawDenisCorridorFigure(SCHOOL_DOORS[2].x);
    // бейдж Дениса
    ctx.save();
    roundRect(ctx, 1085, 358, 140, 42, 8);
    fillStroke(ctx, 'rgba(31, 18, 14, 0.82)', 'rgba(211, 160, 74, 0.45)', 1.2);
    ctx.fillStyle = CREAM;
    ctx.font = `900 15px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ДЕНИС', 1155, 372);
    ctx.fillStyle = 'rgba(240, 200, 119, 0.8)';
    ctx.font = `600 7.5px Verdana, sans-serif`;
    ctx.fillText('КОНЕЦ КОРИДОРА', 1155, 388);
    ctx.restore();

    drawHero();
    drawSchoolCorridorPrompt();
    drawForeground();

    // заголовок
    ctx.save();
    roundRect(ctx, 388, 24, 504, 58, 9);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.78)', 'rgba(211, 160, 74, 0.5)', 1.5);
    ctx.fillStyle = CREAM;
    ctx.font = `900 25px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ШКОЛА №53 · КОРИДОР', W / 2, 47);
    ctx.fillStyle = 'rgba(240, 200, 119, 0.82)';
    ctx.font = `700 8px Verdana, sans-serif`;
    ctx.fillText('ДВА КАБИНЕТА · ОДИН ЗАКРЫТ · ДЕНИС В КОНЦЕ', W / 2, 67);
    ctx.restore();

    // подсказка внизу
    ctx.save();
    roundRect(ctx, 286, 668, 708, 34, 9);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.72)', 'rgba(211, 160, 74, 0.3)', 1.1);
    ctx.fillStyle = 'rgba(244, 227, 189, 0.76)';
    ctx.font = `600 9px Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      IS_TOUCH ? 'Джойстик — идти · Прыжок — войти · ESC — на карту' : 'A / D — идти · ПРОБЕЛ или ENTER — войти · ESC — на карту',
      W / 2,
      685
    );
    ctx.restore();

    if (schoolState.toastT > 0) {
      const a = clamp(schoolState.toastT / 0.4, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      roundRect(ctx, W / 2 - 300, 552, 600, 52, 10);
      fillStroke(ctx, 'rgba(24, 12, 16, 0.92)', 'rgba(211, 160, 74, 0.55)', 1.4);
      ctx.fillStyle = CREAM;
      ctx.font = `600 11px Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(schoolState.toast, W / 2, 578);
      ctx.restore();
    }
  }

  function drawSchoolCorridorPrompt() {
    const n = schoolState.near;
    if (!n) return;
    const x = clamp(n.x, 230, 1040);
    const y = 428;
    ctx.save();
    ctx.translate(x, y);
    roundRect(ctx, -172, -44, 344, 88, 12);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.9)', 'rgba(240, 200, 119, 0.82)', 2.2);
    ctx.fillStyle = CREAM;
    ctx.font = `900 20px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.kind === 'trash' && progress.schoolCoin ? 'МУСОРКА ПУСТА' : n.label, 0, -14);
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.font = `700 9px Verdana, sans-serif`;
    ctx.fillText(IS_TOUCH ? 'НАЖМИ ПРЫЖОК' : 'ПРОБЕЛ / ENTER', 0, 7);
    ctx.fillStyle = 'rgba(244, 227, 189, 0.62)';
    ctx.font = `500 8px Verdana, sans-serif`;
    ctx.fillText(n.sub, 0, 24);
    ctx.fillStyle = 'rgba(24, 12, 16, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-9, 44);
    ctx.lineTo(9, 44);
    ctx.lineTo(0, 56);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------- карта городка ----------
  function updateMap(dt) {
    if (game.shopOpen) return;
    mapState.t += dt;
    mapState.toastT = Math.max(0, mapState.toastT - dt);

    const h = hero;
    h.invuln = 0;
    h.hurtT = 0;
    h.dashT = 0;
    h.crouchK = 0;
    h.shootAnim = 0;
    h.onGround = true;
    h.vy = 0;
    h.y = GROUND;
    const move = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    if (move !== 0) {
      h.face = move;
      h.lastMove = move;
      h.runT += dt * 9;
    }
    h.vx = approach(h.vx, move * 280, 2400 * dt);
    h.x = clamp(h.x + h.vx * dt, 105, 1224);

    let near = null;
    let best = 999;
    for (const b of MAP_BUILDINGS) {
      const d = Math.abs(h.x - b.doorX);
      if (d < best && d < 190) {
        best = d;
        near = b;
      }
    }
    mapState.near = near;

    if (pressed.jump && near) {
      pressed.jump = false;
      enterBuilding(near.id);
    }
  }

  function tryEnterNearby() {
    if (game.scene !== 'map') return;
    if (game.shopOpen) return;
    if (mapState.near) enterBuilding(mapState.near.id);
    else {
      mapState.toast = 'Подойди к цирку, школе, магазину или дереву в конце карты';
      mapState.toastT = 2.2;
      Sound.sfx('click');
    }
  }

  let pendingBossId = null;

  function openDifficulty(id) {
    if (!BOSS_CONFIG[id]) return;
    pendingBossId = id;
    const cfg = BOSS_CONFIG[id];
    const line = $('difficultyBossLine');
    if (line) {
      line.textContent =
        `${cfg.name} · ${cfg.site}. ` +
        (id === 'denis'
          ? 'Очки, лазер, кнопки и цветы, а на третьем этаже — птицы и бетон.'
          : id === 'egor'
            ? 'Сразу вторая фаза: Егор сидит на дереве, облака, кокосы и рука из-за края.'
            : id === 'nikita'
              ? 'Степа держит Никиту на плечах, телефон, кулак и колесо. Потом — велосипед.'
              : 'Кресло, кулаки, живот и крик. Классика цирка.');
    }
    game.shopOpen = false;
    showPanel('difficulty');
    Sound.sfx('click');
    releaseAll();
  }

  function closeDifficulty() {
    pendingBossId = null;
    if (game.scene === 'map' || game.scene === 'school') showPanel(null);
    else showPanel('menu');
    clearPressed();
    Sound.sfx('click');
  }

  function chooseDifficulty(difficulty) {
    const id = pendingBossId || 'letunov';
    if (!DIFFICULTY_CONFIG[difficulty]) return;
    pendingBossId = null;
    startGame(id, difficulty);
  }

  difficultyPanel.querySelectorAll('[data-difficulty]').forEach((button) => {
    button.addEventListener('click', () => chooseDifficulty(button.dataset.difficulty));
  });
  const difficultyBackButton = $('difficultyBackButton');
  if (difficultyBackButton) difficultyBackButton.addEventListener('click', closeDifficulty);

  function enterBuilding(id) {
    if (id === 'shop') {
      openShop();
      return;
    }
    if (id === 'denis') {
      enterSchool();
      return;
    }
    if (id === 'letunov' || id === 'egor') {
      openDifficulty(id);
      return;
    }
  }

  // ---------- атмосфера и мелкие эффекты ----------
  let grainPattern = null;
  let vignetteGrad = null;

  function makeFilmGrain() {
    const nc = document.createElement('canvas');
    nc.width = 180;
    nc.height = 180;
    const g = nc.getContext('2d');
    const img = g.createImageData(180, 180);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() < 0.5 ? 0 : 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = Math.floor(Math.random() * 26);
    }
    g.putImageData(img, 0, 0);
    grainPattern = ctx.createPattern(nc, 'repeat');
  }

  function drawSpotlights() {
    const t = game.time;
    const hot = boss.phase === 2 && game.scene !== 'menu';
    const base = hot ? [255, 150, 105] : [255, 244, 200];
    const drawCone = (x, spread, alpha) => {
      const grad = ctx.createLinearGradient(x, 118, x, GROUND);
      grad.addColorStop(0, `rgba(${base[0]},${base[1]},${base[2]},${alpha})`);
      grad.addColorStop(0.75, `rgba(${base[0]},${base[1]},${base[2]},${alpha * 0.32})`);
      grad.addColorStop(1, `rgba(${base[0]},${base[1]},${base[2]},0)`);
      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x - 15, 125);
      ctx.lineTo(x + 15, 125);
      ctx.lineTo(x + spread, GROUND);
      ctx.lineTo(x - spread, GROUND);
      ctx.closePath();
      ctx.fill();
      const pool = ctx.createRadialGradient(x, GROUND - 6, 4, x, GROUND - 6, spread * 0.8);
      pool.addColorStop(0, `rgba(${base[0]},${base[1]},${base[2]},${alpha * 0.55})`);
      pool.addColorStop(1, `rgba(${base[0]},${base[1]},${base[2]},0)`);
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(x, GROUND - 4, spread * 0.9, 28, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    };
    drawCone(270 + Math.sin(t * 0.33) * 55, 280, hot ? 0.085 : 0.07);
    drawCone(1020 + Math.sin(t * 0.27 + 2.1) * 62, 250, hot ? 0.075 : 0.06);
  }

  function drawMotes() {
    ctx.save();
    for (const m of motes) {
      ctx.globalAlpha = m.alpha;
      ctx.fillStyle = 'rgba(255, 240, 195, 0.9)';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCraters() {
    for (const c of craters) {
      const s = c.seed;
      ctx.save();
      ctx.translate(c.x, GROUND);
      ctx.fillStyle = 'rgba(55, 29, 18, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 68, 10, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 27, 17, 0.5)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI + (i / 4) * Math.PI + (seeded(s + i) - 0.5) * 0.5;
        const len = 45 + seeded(s + i * 3) * 55;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 8, 2);
        ctx.lineTo(Math.cos(angle) * len * 0.55, 2 + Math.sin(angle) * len * 0.12);
        ctx.lineTo(Math.cos(angle) * len, 2 + Math.sin(angle) * len * 0.2);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255, 233, 186, 0.13)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 2, 54, 7, 0, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSchoolLight() {
    const t = game.time;
    const hot = boss.phase === 2;
    const alpha = hot ? 0.16 : 0.12;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const side of [-1, 1]) {
      const x = W / 2 + side * 470;
      const grad = ctx.createLinearGradient(x, 130, x - side * 230, GROUND);
      grad.addColorStop(0, `rgba(255, 241, 190, ${alpha})`);
      grad.addColorStop(0.55, `rgba(255, 225, 153, ${alpha * 0.38})`);
      grad.addColorStop(1, 'rgba(255, 225, 153, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x - 48, 148);
      ctx.lineTo(x + 48, 148);
      ctx.lineTo(x - side * 70 + 246, GROUND);
      ctx.lineTo(x - side * 70 - 246, GROUND);
      ctx.closePath();
      ctx.fill();
    }
    // пылинки в лучах
    for (let i = 0; i < 16; i++) {
      const seed = i * 8.31;
      const cycle = (t * (0.03 + seeded(seed) * 0.04) + seeded(seed + 4)) % 1;
      const x = 180 + seeded(seed + 1) * (W - 360) + Math.sin(t * 0.4 + i) * 16;
      const y = 180 + cycle * 380;
      ctx.globalAlpha = 0.28 * Math.sin(Math.PI * cycle);
      ctx.fillStyle = '#fff2c9';
      ctx.beginPath();
      ctx.arc(x, y, 1.3 + seeded(seed + 9) * 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShadow(x, groundY, rx, airY, alpha) {
    const k = clamp(1 - airY / 720, 0.25, 1);
    ctx.save();
    ctx.globalAlpha = alpha * (0.55 + 0.45 * k);
    ctx.fillStyle = '#3a2118';
    ctx.beginPath();
    ctx.ellipse(x, groundY + 2, rx * k, 11 * k, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSlamWarning() {
    const b = boss;
    if (b.dying) return;
    const slam = b.state === 'slamWind' || b.state === 'slamJump';
    const hop = b.state === 'hopWind' || b.state === 'hopJump';
    if (!slam && !hop) return;
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 13);
    const jump = b.state === 'slamJump' || b.state === 'hopJump';
    ctx.save();
    ctx.translate(b.markX, GROUND + 2);
    ctx.globalAlpha = jump ? 0.85 : 0.55 + pulse * 0.3;
    ctx.fillStyle = 'rgba(186, 52, 38, 0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 100, 22, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = RUST;
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 9]);
    ctx.lineDashOffset = -game.time * 60;
    ctx.beginPath();
    ctx.ellipse(0, 0, 100, 22, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 239, 203, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 84, 17, 0, 0, TAU);
    ctx.stroke();

    // стрелка вниз
    const bob = Math.sin(game.time * 14) * 6;
    ctx.globalAlpha = 0.75 + pulse * 0.2;
    ctx.fillStyle = RUST;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13, -104 + bob);
    ctx.lineTo(13, -104 + bob);
    ctx.lineTo(13, -78 + bob);
    ctx.lineTo(26, -78 + bob);
    ctx.lineTo(0, -50 + bob);
    ctx.lineTo(-26, -78 + bob);
    ctx.lineTo(-13, -78 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // подпись над маркером
    ctx.globalAlpha = 0.92;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = `900 19px ${FONT_DISPLAY}`;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.strokeText(hop ? 'ПРЫЖОК!' : 'СЮДА!', 0, -150 + bob * 0.4);
    ctx.fillStyle = hop ? PINK_BRIGHT : GOLD_BRIGHT;
    ctx.fillText(hop ? 'ПРЫЖОК!' : 'СЮДА!', 0, -150 + bob * 0.4);
    ctx.font = `700 8px Verdana, sans-serif`;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeText(hop ? 'НЕ СТОЙ НА МЕТКЕ' : 'ПРЫГНИ ИЛИ УЙДИ', 0, -133 + bob * 0.4);
    ctx.fillStyle = CREAM;
    ctx.fillText(hop ? 'НЕ СТОЙ НА МЕТКЕ' : 'ПРЫГНИ ИЛИ УЙДИ', 0, -133 + bob * 0.4);
    ctx.restore();
  }

  function drawPunchWarning() {
    const b = boss;
    if (b.dying || b.state !== 'punchWind') return;
    const side = b.face;
    const startX = b.x + side * 105;
    const endX = side > 0 ? W - 54 : 54;
    const left = Math.min(startX, endX);
    const width = Math.abs(endX - startX);
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 16);
    const top = PUNCH_Y - 34;

    ctx.save();

    // тревожная полоса по высоте кулака
    const bandFill = ctx.createLinearGradient(0, top, 0, top + 68);
    bandFill.addColorStop(0, `rgba(109, 28, 39, ${0.015 + pulse * 0.02})`);
    bandFill.addColorStop(0.5, `rgba(186, 52, 38, ${0.1 + pulse * 0.05})`);
    bandFill.addColorStop(1, `rgba(109, 28, 39, ${0.015 + pulse * 0.02})`);
    ctx.fillStyle = bandFill;
    ctx.fillRect(left, top, width, 68);
    ctx.strokeStyle = `rgba(38, 20, 25, ${0.18 + pulse * 0.14})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(left, top, width, 68);

    // тёмная подложка + золотая пунктирная линия
    ctx.setLineDash([22, 16]);
    ctx.lineDashOffset = -game.time * 120 * side;
    ctx.strokeStyle = 'rgba(38, 20, 25, 0.6)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(startX, PUNCH_Y);
    ctx.lineTo(endX, PUNCH_Y);
    ctx.stroke();
    ctx.strokeStyle = `rgba(240, 200, 119, ${0.58 + pulse * 0.32})`;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(startX, PUNCH_Y);
    ctx.lineTo(endX, PUNCH_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // крупные шевроны по направлению удара
    ctx.globalAlpha = 0.72 + pulse * 0.24;
    for (let i = 0; i < 7; i++) {
      const x = startX + side * (80 + i * 150);
      if ((side > 0 && x > endX - 24) || (side < 0 && x < endX + 24)) break;
      ctx.save();
      ctx.translate(x, PUNCH_Y);
      ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(-12, -14);
      ctx.lineTo(5, 0);
      ctx.lineTo(-12, 14);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // табличка у конца полосы: куда прилетит и как увернуться
    const labelX = side > 0 ? W - 138 : 138;
    const labelY = PUNCH_Y - 86;
    ctx.globalAlpha = 0.92;
    roundRect(ctx, labelX - 100, labelY - 23, 200, 46, 8);
    fillStroke(ctx, 'rgba(38, 18, 20, 0.86)', 'rgba(240, 200, 119, 0.72)', 1.6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 20px ${FONT_DISPLAY}`;
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.fillText('КУЛАК!', labelX, labelY - 6);
    ctx.font = `700 8px Verdana, sans-serif`;
    ctx.fillStyle = CREAM;
    ctx.fillText('ПРЫЖОК ИЛИ ПРИСЕД', labelX, labelY + 12);
    ctx.restore();
  }

  function drawBellyWarning() {
    const b = boss;
    if (b.dying) return;
    const active =
      b.state === 'bellyStretch' || b.state === 'bellyHold' || b.state === 'bellyRetract';
    const wind = b.state === 'bellyWind';
    if (!wind && !active) return;
    if (!wind && b.bellyExtend < 0.4) return;

    const top = BELLY_TOP;
    const height = BELLY_BOTTOM - BELLY_TOP;
    const bottom = top + height;
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 12);
    const remaining = Math.max(0, 1.15 - b.timer);

    ctx.save();
    // полоса опасности — видно, на какой высоте пройдёт живот
    const grad = ctx.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0, `rgba(196, 54, 70, ${0.08 + pulse * 0.06})`);
    grad.addColorStop(0.35, `rgba(255, 127, 178, ${0.2 + pulse * 0.08})`);
    grad.addColorStop(0.7, `rgba(196, 54, 70, ${0.2 + pulse * 0.08})`);
    grad.addColorStop(1, `rgba(109, 28, 39, ${0.08 + pulse * 0.04})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, top, W, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, W, height);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 226, 213, 0.16)';
    ctx.lineWidth = 5;
    for (let x = -height; x < W + height; x += 38) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x + height, bottom);
      ctx.stroke();
    }
    ctx.restore();

    ctx.setLineDash([16, 10]);
    ctx.lineDashOffset = -game.time * 55;
    ctx.strokeStyle = `rgba(255, 208, 226, ${0.68 + pulse * 0.25})`;
    ctx.lineWidth = 3;
    for (const y of [top, bottom]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // стрелки вниз по краям
    ctx.globalAlpha = 0.78 + pulse * 0.2;
    for (const x of [124, W - 124]) {
      const bob = Math.sin(game.time * 13 + x) * 4;
      ctx.fillStyle = PINK_BRIGHT;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - 12, top - 56 + bob);
      ctx.lineTo(x + 12, top - 56 + bob);
      ctx.lineTo(x + 12, top - 35 + bob);
      ctx.lineTo(x + 23, top - 35 + bob);
      ctx.lineTo(x, top - 13 + bob);
      ctx.lineTo(x - 23, top - 35 + bob);
      ctx.lineTo(x - 12, top - 35 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // центральная табличка
    const signW = 430;
    const signH = 56;
    const signX = W / 2 - signW / 2;
    const signY = 100;
    roundRect(ctx, signX, signY, signW, signH, 11);
    fillStroke(ctx, 'rgba(54, 16, 27, 0.9)', 'rgba(255, 208, 226, 0.8)', 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = `900 30px ${FONT_DISPLAY}`;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.strokeText('ПРИСЕСТЬ!', W / 2, signY + 23);
    ctx.fillStyle = PINK_BRIGHT;
    ctx.fillText('ПРИСЕСТЬ!', W / 2, signY + 23);
    ctx.font = `700 8.5px Verdana, sans-serif`;
    ctx.fillStyle = CREAM;
    ctx.fillText(
      wind ? `ЖИВОТ ПО ВСЕЙ АРЕНЕ · ${remaining.toFixed(1).replace('.', ',')} С` : '↓ ЖИВОТ ПО ВСЕЙ АРЕНЕ ↓',
      W / 2,
      signY + 46
    );
    ctx.restore();
  }

  function drawScreamWarning() {
    const b = boss;
    if (b.dying || b.state !== 'screamWind') return;
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 15);
    const mouthY = GROUND - (b.inChair ? 408 : 348);
    const dir = b.face;
    ctx.save();
    // конус крика
    const cone = ctx.createLinearGradient(b.x, mouthY, b.x + dir * 720, mouthY);
    cone.addColorStop(0, `rgba(255, 166, 204, ${0.2 + pulse * 0.14})`);
    cone.addColorStop(0.65, `rgba(255, 127, 178, ${0.09 + pulse * 0.06})`);
    cone.addColorStop(1, 'rgba(255, 127, 178, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(b.x + dir * 54, mouthY - 32);
    ctx.quadraticCurveTo(b.x + dir * 380, mouthY - 180, b.x + dir * 820, mouthY - 226);
    ctx.lineTo(b.x + dir * 820, mouthY + 80);
    ctx.quadraticCurveTo(b.x + dir * 420, mouthY + 90, b.x + dir * 54, mouthY + 32);
    ctx.closePath();
    ctx.fill();

    // концентрические звуковые кольца
    for (let i = 0; i < 4; i++) {
      const r = 46 + i * 28 + pulse * 7;
      ctx.strokeStyle = `rgba(255, 208, 226, ${0.44 - i * 0.075})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x + dir * 40, mouthY + 4, r, -0.95, 0.95);
      ctx.stroke();
    }

    // предупреждение на полу
    ctx.setLineDash([15, 11]);
    ctx.lineDashOffset = -game.time * 66;
    ctx.strokeStyle = `rgba(255, 208, 226, ${0.45 + pulse * 0.25})`;
    ctx.lineWidth = 2.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(ARENA_L + 20, GROUND - 18);
      ctx.lineTo(ARENA_R - 20, GROUND - 18);
      ctx.stroke();
      break;
    }
    ctx.setLineDash([]);

    const signW = 504;
    const signH = 58;
    const signX = W / 2 - signW / 2;
    const signY = 105;
    roundRect(ctx, signX, signY, signW, signH, 11);
    fillStroke(ctx, 'rgba(58, 15, 30, 0.91)', 'rgba(255, 208, 226, 0.82)', 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = `900 29px ${FONT_DISPLAY}`;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.strokeText('КРИК! ПРЫГАЙ!', W / 2, signY + 23);
    ctx.fillStyle = PINK_BRIGHT;
    ctx.fillText('КРИК! ПРЫГАЙ!', W / 2, signY + 23);
    ctx.font = `700 8.5px Verdana, sans-serif`;
    ctx.fillStyle = CREAM;
    ctx.fillText('УДАРНЫЕ ВОЛНЫ РИКОШЕТЯТ ОТ СТЕН · РОЗОВУЮ МОЖНО ПАРИРОВАТЬ', W / 2, signY + 46);
    ctx.restore();
  }

  function drawChalkWarning() {
    const b = boss;
    if (b.dying || b.state !== 'chalkWind') return;
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 14);
    const startX = b.x + b.face * 92;
    const centerY = clamp(hero.y - HERO_H * 0.5, GROUND - 258, GROUND - 32);
    ctx.save();
    for (let i = -1; i <= 1; i++) {
      const y = clamp(centerY + i * 54, GROUND - 258, GROUND - 32);
      const pink = i === 0;
      ctx.setLineDash([14, 12]);
      ctx.lineDashOffset = -game.time * 75 * b.face;
      ctx.strokeStyle = pink
        ? `rgba(255, 180, 214, ${0.62 + pulse * 0.28})`
        : `rgba(244, 227, 189, ${0.19 + pulse * 0.1})`;
      ctx.lineWidth = pink ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(b.face > 0 ? W - 36 : 36, y);
      ctx.stroke();
      if (pink) {
        ctx.font = `900 8px Verdana, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = PINK_BRIGHT;
        ctx.fillText('ПАРИ', (startX + (b.face > 0 ? W - 36 : 36)) / 2, y - 9);
      }
    }
    ctx.setLineDash([]);
    const signW = 410;
    const signH = 54;
    const signX = W / 2 - signW / 2;
    const signY = 108;
    roundRect(ctx, signX, signY, signW, signH, 10);
    fillStroke(ctx, 'rgba(36, 34, 27, 0.91)', 'rgba(240, 200, 119, 0.8)', 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = `900 27px ${FONT_DISPLAY}`;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.strokeText('МЕЛОВОЙ ЗАЛП!', W / 2, signY + 21);
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.fillText('МЕЛОВОЙ ЗАЛП!', W / 2, signY + 21);
    ctx.font = `700 8.2px Verdana, sans-serif`;
    ctx.fillStyle = CREAM;
    ctx.fillText('ПРЫЖОК · РОЗОВЫЙ МЕЛ ПАРИРУЕТСЯ В ВОЗДУХЕ', W / 2, signY + 42);
    ctx.restore();
  }

  function drawSoundWaves() {
    for (const w of soundWaves) {
      const pink = w.parryable;
      const ang = Math.atan2(w.vy, w.vx);
      const pulse = 1 + Math.sin(w.t * 16) * 0.12;
      ctx.save();
      ctx.translate(w.x, w.y);

      const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 54);
      glow.addColorStop(0, pink ? 'rgba(255, 133, 186, 0.48)' : 'rgba(154, 210, 195, 0.38)');
      glow.addColorStop(1, pink ? 'rgba(255, 110, 170, 0)' : 'rgba(135, 201, 186, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 54, 0, TAU);
      ctx.fill();

      ctx.rotate(ang);
      ctx.scale(pulse, pulse);

      // хвост, показывающий прямую траекторию
      ctx.strokeStyle = pink ? 'rgba(255, 212, 232, 0.42)' : 'rgba(224, 240, 223, 0.36)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-20 - i * 9, -10 + i * 10);
        ctx.lineTo(-38 - i * 11, -14 + i * 14);
        ctx.stroke();
      }

      // расходящиеся дуги звука
      for (let i = 2; i >= 0; i--) {
        ctx.beginPath();
        ctx.arc(-4 - i * 3, 0, 15 + i * 7, -0.95, 0.95);
        ctx.strokeStyle = pink ? 'rgba(255, 228, 240, 0.82)' : 'rgba(226, 247, 235, 0.74)';
        ctx.lineWidth = 3.4 - i * 0.5;
        ctx.stroke();
      }

      // ядро волны
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, TAU);
      fillStroke(ctx, pink ? '#f58dbb' : '#9ac7b4', INK, 3.6);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(-3, -4, 4.5, 3, -0.5, 0, TAU);
      ctx.fill();
      ctx.restore();

      if (pink) {
        ctx.save();
        ctx.translate(w.x, w.y - 46 - Math.sin(w.t * 9) * 3);
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.bezierCurveTo(-18, 2, -13, -12, 0, -5);
        ctx.bezierCurveTo(13, -12, 18, 2, 0, 12);
        ctx.closePath();
        fillStroke(ctx, PINK, INK, 2.5);
        ctx.fillStyle = PINK_BRIGHT;
        ctx.font = `900 8px Verdana, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.strokeText('ПАРИ', 0, -21);
        ctx.fillText('ПАРИ', 0, -21);
        ctx.restore();
      }
    }
  }

  function drawDenisFlower(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.parryable) {
      const pulse = 1 + Math.sin(s.t * 8) * 0.08;
      const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 66);
      glow.addColorStop(0, 'rgba(255, 158, 199, 0.5)');
      glow.addColorStop(1, 'rgba(255, 110, 170, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 66, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.scale(pulse, pulse);
      ctx.rotate(s.spin);
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i / 6) * TAU);
        ellipsePath(ctx, 0, -23, 13, 19);
        fillStroke(ctx, s.parryable ? PINK : s.color, INK, 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-3, -27, 4, 6, -0.2, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      circle(ctx, 0, 0, 17, s.parryable ? PINK_BRIGHT : '#f5d069', INK, 3);
      ctx.fillStyle = s.shade;
      ctx.beginPath();
      ctx.arc(-5, -2, 2.2, 0, TAU);
      ctx.arc(5, -2, 2.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 3, 6, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(0, -49);
      const marker = 1 + Math.sin(s.t * 10) * 0.1;
      ctx.scale(marker, marker);
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.bezierCurveTo(-16, 2, -12, -11, 0, -5);
      ctx.bezierCurveTo(12, -11, 16, 2, 0, 11);
      ctx.closePath();
      fillStroke(ctx, PINK, INK, 2.5);
      ctx.fillStyle = PINK_BRIGHT;
      ctx.font = `900 8px Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.strokeText('ПАРИ', 0, -19);
      ctx.fillText('ПАРИ', 0, -19);
      ctx.restore();
    } else {
      ctx.globalAlpha = 0.95;
      ctx.rotate(s.spin * 0.7);
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i / 5) * TAU);
        ellipsePath(ctx, 0, -22, 15, 22);
        fillStroke(ctx, s.color, INK, 3);
        ctx.restore();
      }
      circle(ctx, 0, 0, 17, '#e1ad42', INK, 3);
      // сонные глаза
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(-9, -2);
      ctx.lineTo(-3, -2);
      ctx.moveTo(3, -2);
      ctx.lineTo(9, -2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 4, 6, Math.PI + 0.2, TAU - 0.2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(40, 24, 20, 0.6)';
      ctx.font = `700 7px Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('УЛЕТАЕТ', 0, 39);
    }
    ctx.restore();
  }

  function drawDenisButton(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin);
    ctx.fillStyle = 'rgba(255, 240, 202, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, s.r + 7, 0, TAU);
    ctx.fill();
    circle(ctx, 0, 0, s.r, s.color, INK, 3);
    circle(ctx, 0, 0, s.r - 3, 'rgba(255, 255, 255, 0.14)', null, 0);
    ctx.fillStyle = INK;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 4.3, Math.sin(a) * 4.3, 1.7, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-2, -2, 6, Math.PI, Math.PI * 1.6);
    ctx.stroke();
    if (s.returning) {
      ctx.strokeStyle = 'rgba(255, 236, 187, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(-s.homeX + s.x, -s.homeY + s.y);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawDenisSpring(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.parryable) {
      const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 48);
      glow.addColorStop(0, 'rgba(255, 150, 196, 0.54)');
      glow.addColorStop(1, 'rgba(255, 110, 170, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, TAU);
      ctx.fill();
    }
    ctx.rotate(s.spin * 0.4);
    // пружинка
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const y = 16 + i * 6;
      ctx.moveTo(-10, y);
      ctx.quadraticCurveTo(0, y + (i % 2 ? 8 : -5), 10, y + 4);
    }
    ctx.stroke();
    ctx.strokeStyle = '#a5c8be';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const y = 16 + i * 6;
      ctx.moveTo(-10, y);
      ctx.quadraticCurveTo(0, y + (i % 2 ? 8 : -5), 10, y + 4);
    }
    ctx.stroke();
    circle(ctx, 0, 2, s.r, s.parryable ? PINK : s.color, INK, 3.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-5, -4, 7, 4, -0.35, 0, TAU);
    ctx.fill();
    // злая рожица
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(-3, 0);
    ctx.moveTo(8, -2);
    ctx.lineTo(3, 0);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-4, 2, 1.6, 0, TAU);
    ctx.arc(4, 2, 1.6, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 6, 5, Math.PI + 0.2, TAU - 0.2);
    ctx.stroke();
    ctx.fillStyle = PINK_BRIGHT;
    ctx.font = `900 8px Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeText('ПАРИ', 0, -31);
    ctx.fillText('ПАРИ', 0, -31);
    ctx.restore();
  }

  function drawDenisFallingShot(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.kind === 'egg') {
      ctx.rotate(s.spin);
      ellipsePath(ctx, 0, 0, s.r * 0.82, s.r * 1.08);
      fillStroke(ctx, '#f4e6bd', INK, 3);
      ctx.fillStyle = 'rgba(185, 151, 92, 0.55)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-5 + i * 5, -4 + (i % 2) * 6, 2.2, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(-3, -4, 4, Math.PI * 1.1, Math.PI * 1.6);
      ctx.stroke();
    } else {
      // предупреждение под падающим бетоном
      const shadowY = GROUND - s.y;
      ctx.save();
      ctx.translate(0, shadowY);
      ctx.globalAlpha = clamp(0.14 + (s.y / GROUND) * 0.2, 0, 0.34);
      ctx.fillStyle = '#241b18';
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 9, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    ctx.rotate(s.spin);
      ctx.beginPath();
      const r = s.r;
      ctx.moveTo(-r, -r * 0.55);
      ctx.lineTo(-r * 0.35, -r);
      ctx.lineTo(r * 0.55, -r * 0.86);
      ctx.lineTo(r, -r * 0.18);
      ctx.lineTo(r * 0.62, r * 0.82);
      ctx.lineTo(-r * 0.18, r);
      ctx.lineTo(-r * 0.88, r * 0.42);
      ctx.closePath();
      fillStroke(ctx, '#827b6e', INK, 3.4);
      ctx.strokeStyle = 'rgba(255, 243, 212, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.3);
      ctx.lineTo(-r * 0.1, -r * 0.55);
      ctx.lineTo(r * 0.4, -r * 0.35);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(50, 42, 35, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, r * 0.1);
      ctx.lineTo(-r * 0.05, r * 0.35);
      ctx.lineTo(r * 0.38, r * 0.06);
      ctx.stroke();
      ctx.strokeStyle = '#5a4b3d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.9);
      ctx.lineTo(r * 0.1, -r * 1.25);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFallingBullet(s) {
    const near = clamp(1 - Math.max(0, GROUND - s.y) / 640, 0, 1);
    // Метка предсказанного места падения, чтобы пулю было видно заранее.
    if (s.markX !== undefined) {
      const pulse = 0.55 + Math.sin(game.time * 10 + s.x) * 0.22;
      ctx.save();
      ctx.translate(s.markX, GROUND - 5);
      ctx.globalAlpha = 0.35 + near * 0.5;
      ctx.strokeStyle = `rgba(255, 196, 92, ${pulse})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24 - near * 6, 8 - near * 2, 0, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.moveTo(0, -7);
      ctx.lineTo(0, 7);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 196, 92, ${0.18 + near * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18 - near * 4, 5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.18 + near * 0.6;
    ctx.fillStyle = '#2a1712';
    ctx.beginPath();
    ctx.ellipse(s.x, GROUND - 2, 10 + near * 12, 4 + near * 3, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin + s.t * 3);
    ctx.fillStyle = '#4f3b36';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, TAU);
    fillStroke(ctx, '#5c443c', INK, 2.6);
    ctx.fillStyle = 'rgba(255, 238, 198, 0.36)';
    ctx.beginPath();
    ctx.arc(-4, -4, 4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 214, 130, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 8, -0.5, 0.9);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(s.x, s.y - 14);
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.beginPath();
    ctx.arc(Math.sin(game.time * 9) * 2, -2, 3.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawWindCharges() {
    const t = game.time;
    for (const w of windCharges) {
      const s = clamp(w.squash, 0.55, 1.2);
      ctx.save();
      ctx.translate(w.x, w.y);
      // тень на земле
      ctx.globalAlpha = clamp(1 - (GROUND - 4 - w.y) / 560, 0.12, 0.4);
      ctx.fillStyle = '#24170f';
      ctx.beginPath();
      ctx.ellipse(0, GROUND - 4 - w.y, 22, 6, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (w.parryable) {
        const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 52);
        glow.addColorStop(0, 'rgba(255, 146, 193, 0.5)');
        glow.addColorStop(1, 'rgba(255, 110, 170, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 52, 0, TAU);
        ctx.fill();
      }

      ctx.scale(1 / s, s);
      ctx.rotate(w.spin);
      const body = w.parryable ? '#ff9cc5' : '#bfe4d6';
      const shade = w.parryable ? '#d64c88' : '#6fb39f';
      ctx.beginPath();
      ctx.arc(0, 0, w.r, 0, TAU);
      fillStroke(ctx, body, INK, 3.2);
      // спираль ветра
      ctx.strokeStyle = shade;
      ctx.lineWidth = 3.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2.9; a += 0.16) {
        const rr = 3 + a * 2.1;
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // глаза
      ctx.fillStyle = CREAM;
      ctx.beginPath();
      ctx.arc(-6, -5, 4.2, 0, TAU);
      ctx.arc(6, -5, 4.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-5, -4.4, 1.9, 0, TAU);
      ctx.arc(7, -4.4, 1.9, 0, TAU);
      ctx.fill();
      // хвостики ветра
      ctx.rotate(-w.spin);
      ctx.strokeStyle = w.parryable ? 'rgba(255, 226, 240, 0.8)' : 'rgba(235, 255, 247, 0.75)';
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 3; i++) {
        const off = (t * 240 + i * 30) % 74;
        ctx.beginPath();
        ctx.moveTo(-w.vx * 0.06 - off, -8 + i * 8);
        ctx.lineTo(-w.vx * 0.06 - off - 18, -8 + i * 8);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawFallingPetal(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin);
    // лёгкое свечение, чтобы лепесток читался на фоне
    if (!s.fromTrap) {
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 10, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.bezierCurveTo(11, -7, 11, 5, 0, 12);
    ctx.bezierCurveTo(-11, 5, -11, -7, 0, -11);
    ctx.closePath();
    fillStroke(ctx, s.color, INK, 2);
    ctx.strokeStyle = 'rgba(60, 24, 26, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawBossShots() {
    for (const s of bossShots) {
      if (
        s.kind === 'nikitaPhone' ||
        s.kind === 'bikeWheel' ||
        s.kind === 'stepaVehicle' ||
        s.kind === 'stepaScooter'
      ) {
        drawNikitaStepaShot(s);
        continue;
      }
      if (s.kind === 'stepaHairBolt') {
        drawStepaHairBolt(s.x1, s.y1, s.x2, s.y2, 1);
        continue;
      }
      if (s.kind === 'elenaGlobe') {
        drawElenaGlobe(s);
        continue;
      }
      if (s.kind === 'elenaPencil') {
        drawElenaPencil(s);
        continue;
      }
      if (s.kind === 'elenaMark' || s.kind === 'stinkCloud') {
        drawElenaShot(s);
        continue;
      }
      if (s.kind === 'elenaTooth') {
        drawElenaTooth(s);
        continue;
      }
      if (
        s.kind === 'banana' ||
        s.kind === 'coconut' ||
        s.kind === 'branch' ||
        s.kind === 'fruit' ||
        s.kind === 'screamRing' ||
        s.kind === 'bull' ||
        s.kind === 'bird' ||
        s.kind === 'coconutBomb' ||
        s.kind === 'coconutShard' ||
        s.kind === 'cloudZap'
      ) {
        drawEgorShot(s);
        continue;
      }
      if (s.kind === 'petal') {
        drawFallingPetal(s);
        continue;
      }
      if (s.kind === 'flower') {
        drawDenisFlower(s);
        continue;
      }
      if (s.kind === 'button') {
        drawDenisButton(s);
        continue;
      }
      if (s.kind === 'spring') {
        drawDenisSpring(s);
        continue;
      }
      if (s.kind === 'egg' || s.kind === 'concrete') {
        drawDenisFallingShot(s);
        continue;
      }
      if (s.kind === 'fallBullet') {
        drawFallingBullet(s);
        continue;
      }
      ctx.save();
      ctx.translate(s.x, s.y);
      if (s.parryable) {
        const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 48);
        glow.addColorStop(0, 'rgba(255, 146, 193, 0.55)');
        glow.addColorStop(1, 'rgba(255, 110, 170, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, TAU);
        ctx.fill();
      }
      ctx.rotate(s.spin);
      ctx.fillStyle = 'rgba(239, 231, 208, 0.82)';
      roundRect(ctx, -19, -8, 38, 16, 7);
      fillStroke(ctx, s.parryable ? '#ffb2d0' : '#efe7d0', INK, 2.6);
      ctx.fillStyle = s.parryable ? PINK : '#cfc3a5';
      roundRect(ctx, -12, -3, 24, 5, 2.5);
      ctx.fill();
      ctx.strokeStyle = s.parryable ? PINK_BRIGHT : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-13, -2);
      ctx.lineTo(14, -2);
      ctx.stroke();
      if (s.parryable) {
        starPath(ctx, 0, -24, 5, 7, 3, -Math.PI / 2);
        fillStroke(ctx, PINK_BRIGHT, INK, 1.4);
      }
      ctx.restore();
    }
  }

  function drawWaves() {
    for (const w of waves) {
      const h = w.hot ? 46 : 42;
      ctx.save();
      ctx.translate(w.x, GROUND);
      // тень
      ctx.fillStyle = 'rgba(46, 24, 16, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, -2, 44, 8, 0, 0, TAU);
      ctx.fill();

      // линии скорости позади
      ctx.strokeStyle = 'rgba(61, 32, 20, 0.24)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-w.dir * (50 + i * 9), -12 - i * 9);
        ctx.lineTo(-w.dir * (74 + i * 9), -12 - i * 9);
        ctx.stroke();
      }

      const wobble = Math.sin(w.t * 22) * 2;
      if (w.parryable) {
        const glow = ctx.createRadialGradient(0, -60, 8, 0, -60, 92);
        glow.addColorStop(0, 'rgba(255, 143, 190, 0.38)');
        glow.addColorStop(1, 'rgba(255, 112, 170, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -60, 92, 0, TAU);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.bezierCurveTo(-50, -h * 0.65, -25, -h + 4 + wobble, -2, -h + wobble);
      ctx.bezierCurveTo(24, -h + 2 - wobble, 50, -h * 0.55, 45, 0);
      ctx.closePath();
      fillStroke(ctx, w.parryable ? '#ff9cc5' : w.hot ? '#eec690' : '#f1dfb8', INK, 5);

      ctx.fillStyle = w.parryable ? 'rgba(255, 240, 247, 0.5)' : w.hot ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 250, 232, 0.38)';
      ctx.beginPath();
      ctx.ellipse(-12, -h * 0.62, 15, h * 0.2, -0.35, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(17, -h * 0.42, 12, h * 0.17, 0.25, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = 'rgba(70, 40, 24, 0.32)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -h * 0.5, 12, -1.2, 0.9);
      ctx.stroke();

      // мелкие камешки
      for (let i = 0; i < 2; i++) {
        const s = Math.sin(w.t * 30 + i * 2);
        ctx.fillStyle = w.parryable ? PINK_BRIGHT : GOLD;
        ctx.beginPath();
        ctx.arc(-w.dir * (10 + i * 8), -h - 8 - s * 4, 2.6, 0, TAU);
        ctx.fill();
      }
      if (w.parryable) {
        const pulse = 1 + Math.sin(w.t * 9) * 0.1;
        ctx.save();
        ctx.translate(0, -156);
        ctx.scale(pulse, pulse);
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.bezierCurveTo(-18, 2, -13, -12, 0, -5);
        ctx.bezierCurveTo(13, -12, 18, 2, 0, 12);
        ctx.closePath();
        fillStroke(ctx, PINK, INK, 2.5);
        ctx.fillStyle = PINK_BRIGHT;
        ctx.font = `900 8px Verdana, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.strokeText('ПАРИ', 0, -20);
        ctx.fillText('ПАРИ', 0, -20);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  function drawGhosts() {
    ctx.save();
    for (const g of ghosts) {
      const k = g.life / g.maxLife;
      ctx.globalAlpha = k * 0.22;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.scale(g.face, 1);
      ctx.fillStyle = CREAM;
      ctx.beginPath();
      ctx.ellipse(0, -72, 21, 23, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = TEAL;
      roundRect(ctx, -15, -54, 30, 34, 10);
      ctx.fill();
      ctx.strokeStyle = CREAM;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, -20);
      ctx.lineTo(-9, 0);
      ctx.moveTo(6, -20);
      ctx.lineTo(9, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBullets() {
    for (const b of bullets) {
      ctx.save();
      ctx.translate(b.x, b.y);
      const superScale = b.big ? (b.superScale || 1) : 1;
      if (superScale !== 1) ctx.scale(superScale, superScale);
      const rot = game.time * 14 * b.dir;
      const greenBullet = !b.big && !b.nutcracker && (b.green || b.homing || (progress.autoAim && !b.turretShot));
      if (greenBullet) {
        const pulse = 1 + Math.sin(game.time * 18) * 0.08;
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
        glow.addColorStop(0, 'rgba(160, 255, 178, 0.7)');
        glow.addColorStop(0.5, 'rgba(87, 230, 120, 0.32)');
        glow.addColorStop(1, 'rgba(70, 220, 110, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(150, 255, 170, 0.7)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-b.dir * 10, 0);
        ctx.lineTo(-b.dir * 28, 0);
        ctx.stroke();
        ctx.rotate(rot);
        ctx.scale(pulse, pulse);
        starPath(ctx, 0, 0, 5, b.homing ? 8 : 7, 3.1, -Math.PI / 2);
        fillStroke(ctx, '#7dff9a', '#1f5f34', 2);
        circle(ctx, 0, 0, 2.2, '#eaffd6', null, 0);
        ctx.restore();
        continue;
      }
      if (!b.big && (b.nutcracker || b.turretShot)) {
        const red = b.turretShot ? '#ffb06e' : '#ff5f4f';
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
        glow.addColorStop(0, 'rgba(255, 150, 120, 0.55)');
        glow.addColorStop(1, 'rgba(255, 80, 60, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 140, 110, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-b.dir * 8, 0);
        ctx.lineTo(-b.dir * 24, 0);
        ctx.stroke();
        ctx.rotate(rot);
        if (b.turretShot) {
          starPath(ctx, 0, 0, 4, 6, 2.4, -Math.PI / 2);
        } else {
          starPath(ctx, 0, 0, 5, 9, 3.4, -Math.PI / 2);
        }
        fillStroke(ctx, red, '#5e1a16', 2);
        circle(ctx, 0, 0, 2.4, '#ffe9d2', null, 0);
        ctx.restore();
        continue;
      }
      if (b.big) {
        const pulse = 1 + Math.sin(game.time * 18) * 0.055;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 104);
        glow.addColorStop(0, 'rgba(255, 249, 218, 0.9)');
        glow.addColorStop(0.32, 'rgba(255, 211, 102, 0.5)');
        glow.addColorStop(0.7, 'rgba(255, 151, 62, 0.18)');
        glow.addColorStop(1, 'rgba(255, 120, 40, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 104, 0, TAU);
        ctx.fill();
        ctx.restore();

        // длинный огненный хвост
        ctx.save();
        ctx.scale(b.dir, 1);
        const tail = ctx.createLinearGradient(-10, 0, -145, 0);
        tail.addColorStop(0, 'rgba(255, 238, 174, 0.8)');
        tail.addColorStop(0.45, 'rgba(240, 163, 65, 0.3)');
        tail.addColorStop(1, 'rgba(240, 120, 45, 0)');
        ctx.fillStyle = tail;
        ctx.beginPath();
        ctx.moveTo(-8, -40);
        ctx.quadraticCurveTo(-94, -24, -156, 0);
        ctx.quadraticCurveTo(-94, 24, -8, 40);
        ctx.closePath();
        ctx.fill();
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = `rgba(255, 233, 174, ${0.24 - i * 0.06})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(-28 - i * 20, 0, 24 + i * 16, 0.5, Math.PI - 0.5);
          ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.scale(pulse, pulse);
        ctx.rotate(game.time * 4.2 * b.dir);
        starPath(ctx, 0, 0, 10, 66, 49, -Math.PI / 2);
        fillStroke(ctx, 'rgba(255, 216, 118, 0.24)', 'rgba(255, 243, 192, 0.5)', 2.5);
        ctx.restore();

        ctx.save();
        ctx.rotate(-game.time * 8.5 * b.dir);
        starPath(ctx, 0, 0, 8, 46, 31, -Math.PI / 2);
        fillStroke(ctx, GOLD_BRIGHT, INK, 4);
        ctx.rotate(game.time * 11 * b.dir);
        starPath(ctx, 0, 0, 5, 25, 10, -Math.PI / 2);
        fillStroke(ctx, CREAM, RUST, 2);
        circle(ctx, 0, 0, 8, '#fff8d7', '#d18b35', 2);
        ctx.restore();

        // маленькие искры вокруг
        for (let i = 0; i < 5; i++) {
          const a = game.time * (2.2 + i * 0.2) + i * 1.7;
          const rr = 54 + i * 7;
          starPath(ctx, Math.cos(a) * rr, Math.sin(a) * rr * 0.7, 4, 4.5, 1.6, a);
          ctx.fillStyle = i % 2 ? CREAM : GOLD_BRIGHT;
          ctx.fill();
        }
        ctx.restore();
        continue;
      }

      ctx.strokeStyle = 'rgba(240, 200, 119, 0.38)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-b.dir * 12, 0);
      ctx.lineTo(-b.dir * 34, 0);
      ctx.stroke();

      ctx.rotate(rot);
      starPath(ctx, 0, 0, 5, 10, 4.2, -Math.PI / 2);
      fillStroke(ctx, GOLD_BRIGHT, INK, 2.5);
      circle(ctx, 0, 0, 2.4, CREAM, null, 0);
      ctx.restore();
    }
  }

  function drawTurrets() {
    for (const t of turrets) {
      ctx.save();
      ctx.translate(t.x, t.y);
      if (t.dive) {
        ctx.rotate(Math.atan2(t.vy || 0, t.vx || 1));
      } else {
        ctx.rotate(Math.sin(t.t * 2) * 0.05);
      }
      if (t.parryable) {
        const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 70);
        glow.addColorStop(0, 'rgba(255, 146, 193, 0.45)');
        glow.addColorStop(0.6, 'rgba(255, 104, 100, 0.18)');
        glow.addColorStop(1, 'rgba(255, 104, 100, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 70, 0, TAU);
        ctx.fill();
      }
      // винт
      ctx.save();
      ctx.translate(0, -30);
      ctx.rotate(t.t * 22);
      ctx.strokeStyle = '#3a1714';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(20, 0);
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 18);
      ctx.stroke();
      ctx.fillStyle = '#ffd0b8';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fill();
      ctx.restore();
      // корпус
      roundRect(ctx, -23, -20, 46, 40, 12);
      fillStroke(ctx, t.parryable ? '#ff9cc5' : '#b6372e', INK, 3.2);
      ctx.fillStyle = 'rgba(255, 210, 190, 0.22)';
      roundRect(ctx, -16, -14, 13, 11, 5);
      ctx.fill();
      // ствол
      roundRect(ctx, 15, -9, 30, 18, 7);
      fillStroke(ctx, t.parryable ? '#d64c88' : '#7e211c', INK, 3);
      circle(ctx, 44, 0, 8, t.parryable ? PINK : '#3c1513', INK, 2.4);
      // глаза-лампы
      circle(ctx, -4, -2, 5, '#ffe6a8', INK, 1.8);
      circle(ctx, 8, -2, 5, '#ffe6a8', INK, 1.8);
      // патроны
      for (let i = 0; i < 6; i++) {
        const lit = i < (t.shotsLeft === undefined ? 6 : t.shotsLeft);
        circle(ctx, -18 + i * 7, 15, 2.2, lit ? '#ffd36e' : 'rgba(60, 20, 18, 0.55)', null, 0);
      }
      if (t.parryable) {
        starPath(ctx, 0, -52, 5, 8, 3.4, Math.PI / 2);
        fillStroke(ctx, PINK_BRIGHT, INK, 1.6);
      }
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const k = clamp(p.life / p.maxLife, 0, 1);
      ctx.save();
      switch (p.kind) {
        case 'spark': {
          ctx.globalAlpha = Math.min(1, k * 1.7);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          starPath(ctx, 0, 0, 4, p.size, p.size * 0.28, 0);
          ctx.fillStyle = p.color;
          ctx.fill();
          break;
        }
        case 'star': {
          ctx.globalAlpha = Math.min(1, k * 1.6);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          starPath(ctx, 0, 0, 5, p.size, p.size * 0.42, 0);
          fillStroke(ctx, p.color, 'rgba(38,20,25,0.55)', Math.max(1, p.size * 0.12));
          break;
        }
        case 'dot': {
          ctx.globalAlpha = Math.min(1, k * 1.5);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, TAU);
          ctx.fill();
          break;
        }
        case 'smoke': {
          ctx.globalAlpha = k * 0.34;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, TAU);
          ctx.fill();
          break;
        }
        case 'ring': {
          const prog = 1 - k;
          ctx.globalAlpha = k * 0.8;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2 + k * 5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + prog * 90, 0, TAU);
          ctx.stroke();
          break;
        }
        case 'comic': {
          const appear = clamp((1 - k) / 0.18, 0, 1);
          const fade = clamp(k / 0.35, 0, 1);
          ctx.globalAlpha = fade;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(0.6 + appear * 0.4, 0.6 + appear * 0.4);
          if (p.burst) {
            starPath(ctx, 0, 0, 12, p.size * 2.25, p.size * 1.45, -Math.PI / 2);
            fillStroke(ctx, CREAM, INK, 5);
            starPath(ctx, 0, 0, 12, p.size * 1.9, p.size * 1.2, -Math.PI / 2 + 0.1);
            ctx.fillStyle = 'rgba(217, 160, 74, 0.18)';
            ctx.fill();
          }
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `900 ${p.size}px ${FONT_DISPLAY}`;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = INK;
          ctx.lineWidth = Math.max(3, p.size * 0.17);
          ctx.strokeText(p.text, 0, 2);
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, 0, 2);
          break;
        }
        case 'wheel': {
          ctx.globalAlpha = Math.min(1, k * 2);
          drawBossWheel(ctx, p.x, p.y, p.size, p.rot, 1);
          break;
        }
        case 'petal': {
          ctx.globalAlpha = Math.min(1, k * 1.8);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.52, 0, 0, TAU);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(54, 30, 24, 0.42)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
          ctx.beginPath();
          ctx.ellipse(-p.size * 0.25, -p.size * 0.12, p.size * 0.38, p.size * 0.16, 0, 0, TAU);
          ctx.fill();
          break;
        }
        case 'hat': {
          ctx.globalAlpha = Math.min(1, k * 2);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          const s = p.size / 34;
          ctx.scale(s, s);
          ctx.fillStyle = TEAL;
          ctx.strokeStyle = INK;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(0, 0, 34, 9, 0, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-22, 0);
          ctx.bezierCurveTo(-22, -30, 18, -32, 24, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = GOLD;
          ctx.fillRect(-21, -10, 43, 5);
          break;
        }
        default:
          break;
      }
      ctx.restore();
    }
  }

  function drawParryPrompt() {
    if (hero.dead || hero.onGround || hero.parryCd > 0) return;
    let near = null;
    let best = Infinity;
    const considerCircle = (x, y, r) => {
      if (!parryTouchesCircle(x, y, r, 12)) return;
      const dx = x - hero.x;
      const dy = y - (hero.y - HERO_H * 0.5);
      const d2 = dx * dx + dy * dy;
      if (d2 < best) {
        best = d2;
        near = { x, y };
      }
    };
    const considerRect = (rect) => {
      if (!parryTouchesRect(rect, 12)) return;
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const dx = cx - hero.x;
      const dy = cy - (hero.y - HERO_H * 0.5);
      const d2 = dx * dx + dy * dy;
      if (d2 < best) {
        best = d2;
        near = { x: cx, y: cy };
      }
    };
    for (const s of bossShots) {
      if (s.parryable) considerCircle(s.x, s.y, s.r);
    }
    for (const w of waves) {
      if (w.parryable) considerRect(parryWaveRect(w));
    }
    for (const w of soundWaves) {
      if (w.parryable) considerCircle(w.x, w.y, w.r);
    }
    for (const w of windCharges) {
      if (w.parryable) considerCircle(w.x, w.y, w.r);
    }
    for (const t of turrets) {
      if (t.parryable && !t.dive) considerCircle(t.x, t.y, 32);
    }
    if (!near) return;
    const pulse = 0.6 + 0.4 * Math.sin(game.time * 14);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = `rgba(255, 143, 187, ${0.5 + pulse * 0.4})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 7]);
    ctx.lineDashOffset = -game.time * 36;
    ctx.beginPath();
    ctx.arc(0, 0, 42 + pulse * 4, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = `900 14px ${FONT_DISPLAY}`;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.strokeText('ПАРИ!', 0, -64);
    ctx.fillStyle = PINK_BRIGHT;
    ctx.fillText('ПАРИ!', 0, -64);
    ctx.font = `700 7px Verdana, sans-serif`;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeText('ЖМИ ПРЫЖОК', 0, -51);
    ctx.fillStyle = CREAM;
    ctx.fillText('ЖМИ ПРЫЖОК', 0, -51);
    ctx.restore();
  }

  function drawBossAlert() {
    const b = boss;
    if (b.dying || b.exploded) return;
    if (
      b.state !== 'slamWind' &&
      b.state !== 'punchWind' &&
      b.state !== 'bellyWind' &&
      b.state !== 'hopWind' &&
      b.state !== 'screamWind' &&
      b.state !== 'chalkWind' &&
      b.state !== 'rage'
    )
      return;
    const pulse = 1 + Math.sin(game.time * 14) * 0.08;
    const y = GROUND - b.airY - (b.inChair ? 488 : 438);
    ctx.save();
    ctx.translate(b.x, y);
    ctx.scale(pulse, pulse);
    ctx.rotate(Math.sin(game.time * 4) * 0.04);
    starPath(ctx, 0, 0, 10, 30, 23, -Math.PI / 2);
    fillStroke(ctx, CREAM, INK, 4);
    ctx.fillStyle = RED;
    ctx.font = `900 34px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 2);
    ctx.restore();
  }

  function drawForeground() {
    // нижнее затемнение под кнопки и общий контраст
    const bottom = ctx.createLinearGradient(0, 580, 0, H);
    bottom.addColorStop(0, 'rgba(38, 18, 14, 0)');
    bottom.addColorStop(1, 'rgba(30, 13, 11, 0.26)');
    ctx.fillStyle = bottom;
    ctx.fillRect(0, 580, W, 140);

    if (!vignetteGrad) {
      vignetteGrad = ctx.createRadialGradient(W / 2, 350, 280, W / 2, 360, 760);
      vignetteGrad.addColorStop(0, 'rgba(28, 10, 14, 0)');
      vignetteGrad.addColorStop(0.62, 'rgba(28, 10, 14, 0.08)');
      vignetteGrad.addColorStop(1, 'rgba(20, 6, 10, 0.5)');
    }
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, W, H);

    if (boss.phase === 2 && game.scene === 'fight') {
      const heat = ctx.createRadialGradient(W / 2, 420, 180, W / 2, 420, 780);
      heat.addColorStop(0, 'rgba(174, 58, 38, 0)');
      heat.addColorStop(1, 'rgba(174, 58, 38, 0.09)');
      ctx.fillStyle = heat;
      ctx.fillRect(0, 0, W, H);
    }

    if (grainPattern) {
      ctx.save();
      ctx.globalAlpha = 0.05 + Math.sin(game.time * 1.9) * 0.008;
      const ox = (Math.floor(game.time * 12) * 41) % 180;
      const oy = (Math.floor(game.time * 9) * 67) % 180;
      ctx.translate(ox, oy);
      ctx.fillStyle = grainPattern;
      ctx.fillRect(-180, -180, W + 360, H + 360);
      ctx.restore();
    }

    // редкие царапины плёнки
    const tick = Math.floor(game.time * 6);
    if (tick % 17 === 0) {
      const x = 120 + seeded(tick) * (W - 240);
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = '#fff4d8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 80);
      ctx.lineTo(x + 8, 520);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ================= КАРТА-ОСТРОВ В СТИЛЕ CUPHEAD =================
  function buildMapBackground() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    g.lineCap = 'round';

    // ---------- море и небо ----------
    const sea = g.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#cdeee6');
    sea.addColorStop(0.16, '#94d7d1');
    sea.addColorStop(0.44, '#5fb8ba');
    sea.addColorStop(0.74, '#338e9c');
    sea.addColorStop(1, '#21697b');
    g.fillStyle = sea;
    g.fillRect(0, 0, W, H);

    // мягкие облака
    const cloud = (x, y, s, alpha) => {
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = '#fff9e8';
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.ellipse(x + i * 34 * s, y - (i % 2) * 13 * s, 52 * s, 21 * s, 0, 0, TAU);
        g.fill();
      }
      g.restore();
    };
    cloud(90, 104, 1.08, 0.32);
    cloud(470, 68, 0.86, 0.26);
    cloud(842, 128, 1.16, 0.3);
    cloud(1120, 72, 0.8, 0.24);

    // далёкие острова на горизонте
    const distantIsland = (x, y, w, h, alpha) => {
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = '#3f7d6b';
      g.beginPath();
      g.moveTo(x - w / 2, y + h);
      g.bezierCurveTo(x - w / 2, y + h * 0.3, x - w * 0.3, y, x, y);
      g.bezierCurveTo(x + w * 0.3, y, x + w / 2, y + h * 0.35, x + w / 2, y + h);
      g.closePath();
      g.fill();
      g.fillStyle = '#2f6557';
      g.fillRect(x - w * 0.26, y - 10, w * 0.52, 6);
      g.restore();
    };
    distantIsland(130, 250, 190, 46, 0.55);
    distantIsland(370, 232, 150, 40, 0.42);
    distantIsland(985, 238, 210, 44, 0.5);
    distantIsland(1180, 264, 170, 38, 0.42);

    // домик с сиреневой крышей на дальнем острове (как в Cuphead)
    g.save();
    g.globalAlpha = 0.6;
    g.fillStyle = '#3c7367';
    g.beginPath();
    g.ellipse(1120, 260, 100, 28, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#ddd2b4';
    roundRect(g, 1092, 222, 52, 38, 3);
    g.fill();
    g.fillStyle = '#7868a8';
    g.beginPath();
    g.moveTo(1084, 224);
    g.lineTo(1118, 196);
    g.lineTo(1152, 224);
    g.closePath();
    g.fill();
    g.fillStyle = '#4a3f63';
    g.fillRect(1114, 238, 9, 16);
    g.restore();

    // маленький маяк на дальнем островке слева
    g.save();
    g.globalAlpha = 0.68;
    g.fillStyle = '#4a8070';
    g.beginPath();
    g.ellipse(160, 314, 82, 22, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#efe5c9';
    g.beginPath();
    g.moveTo(146, 300);
    g.lineTo(156, 242);
    g.lineTo(178, 242);
    g.lineTo(188, 300);
    g.closePath();
    g.fill();
    g.fillStyle = '#b04a3e';
    g.fillRect(152, 258, 30, 11);
    g.fillRect(148, 280, 38, 9);
    g.fillStyle = '#7d3a33';
    g.fillRect(151, 232, 32, 12);
    g.fillStyle = '#f4d47c';
    g.fillRect(156, 236, 22, 5);
    g.restore();

    // ---------- волны ----------
    for (let i = 0; i < 150; i++) {
      const x = seeded(i * 3.1 + 1) * W;
      const y = 210 + seeded(i * 7.7 + 2) * 500;
      const w = 9 + seeded(i * 2.2 + 3) * 30;
      g.strokeStyle =
        i % 3 === 0
          ? `rgba(236, 255, 249, ${0.1 + seeded(i + 5) * 0.16})`
          : 'rgba(20, 88, 102, 0.13)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.ellipse(x, y, w, 2.2, 0, 0, TAU);
      g.stroke();
    }
    // крупная зыбь
    for (let i = 0; i < 9; i++) {
      const y = 380 + i * 38;
      g.strokeStyle = `rgba(230, 255, 247, ${0.07 + (i % 3) * 0.02})`;
      g.lineWidth = 2;
      g.beginPath();
      for (let x = 0; x <= W; x += 24) {
        const yy = y + Math.sin(x * 0.013 + i * 1.4) * 7;
        if (x === 0) g.moveTo(x, yy);
        else g.lineTo(x, yy);
      }
      g.stroke();
    }

    // ---------- острова ----------
    const leftIsland = new Path2D();
    leftIsland.moveTo(14, 664);
    leftIsland.bezierCurveTo(2, 556, 26, 468, 88, 436);
    leftIsland.bezierCurveTo(152, 402, 262, 402, 330, 440);
    leftIsland.bezierCurveTo(366, 460, 384, 520, 380, 578);
    leftIsland.bezierCurveTo(374, 638, 344, 682, 302, 704);
    leftIsland.lineTo(56, 704);
    leftIsland.bezierCurveTo(32, 696, 18, 682, 14, 664);
    leftIsland.closePath();

    const centerIsland = new Path2D();
    centerIsland.moveTo(404, 662);
    centerIsland.bezierCurveTo(394, 538, 418, 398, 494, 352);
    centerIsland.bezierCurveTo(544, 318, 606, 332, 662, 314);
    centerIsland.bezierCurveTo(746, 290, 828, 316, 890, 356);
    centerIsland.bezierCurveTo(960, 402, 1000, 486, 1004, 570);
    centerIsland.bezierCurveTo(1008, 638, 974, 688, 928, 706);
    centerIsland.lineTo(470, 706);
    centerIsland.bezierCurveTo(430, 692, 410, 682, 404, 662);
    centerIsland.closePath();

    const rightIsland = new Path2D();
    rightIsland.moveTo(1024, 664);
    rightIsland.bezierCurveTo(1016, 566, 1040, 482, 1102, 450);
    rightIsland.bezierCurveTo(1158, 422, 1228, 438, 1262, 488);
    rightIsland.bezierCurveTo(1284, 542, 1278, 622, 1252, 680);
    rightIsland.bezierCurveTo(1244, 698, 1230, 702, 1214, 706);
    rightIsland.lineTo(1062, 706);
    rightIsland.bezierCurveTo(1040, 694, 1028, 682, 1024, 664);
    rightIsland.closePath();

    const islandPaths = [leftIsland, centerIsland, rightIsland];

    const drawIsland = (path, seed) => {
      // тень над водой
      g.save();
      g.shadowColor = 'rgba(9, 52, 62, 0.45)';
      g.shadowBlur = 30;
      g.shadowOffsetY = 18;
      g.fillStyle = '#2c7b6a';
      g.fill(path);
      g.restore();

      const grass = g.createLinearGradient(0, 280, 0, 706);
      grass.addColorStop(0, '#a3cf70');
      grass.addColorStop(0.5, '#84b45b');
      grass.addColorStop(1, '#5d8d46');
      g.fillStyle = grass;
      g.fill(path);
      g.strokeStyle = 'rgba(42, 70, 39, 0.9)';
      g.lineWidth = 4.5;
      g.stroke(path);

      g.save();
      g.clip(path);
      // травяная фактура
      for (let i = 0; i < 260; i++) {
        const x = seeded(seed + i * 2.3) * W;
        const y = 300 + seeded(seed + i * 5.1) * 300;
        g.fillStyle =
          i % 5 === 0 ? 'rgba(255, 248, 194, 0.17)' : 'rgba(62, 108, 53, 0.2)';
        g.fillRect(x, y, 1.6, 2.7);
      }
      // скалы
      const cliff = g.createLinearGradient(0, 602, 0, 716);
      cliff.addColorStop(0, '#d4b07d');
      cliff.addColorStop(0.32, '#b78e5f');
      cliff.addColorStop(0.72, '#8d6840');
      cliff.addColorStop(1, '#6b4d2f');
      g.fillStyle = cliff;
      g.fillRect(0, 602, W, 118);
      for (let i = 0; i < 9; i++) {
        const y = 614 + i * 11;
        g.strokeStyle = `rgba(74, 49, 28, ${0.3 - i * 0.016})`;
        g.lineWidth = 2;
        g.beginPath();
        for (let x = 0; x <= W; x += 18) {
          const yy = y + Math.sin(x * 0.021 + i * 1.7) * 2.6;
          if (x === 0) g.moveTo(x, yy);
          else g.lineTo(x, yy);
        }
        g.stroke();
      }
      for (let i = 0; i < 22; i++) {
        const x = seeded(seed + i * 6.6) * W;
        const y = 624 + seeded(seed + i * 3.3) * 66;
        g.fillStyle = 'rgba(70, 44, 26, 0.22)';
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 3, y + 18 + seeded(i) * 22);
        g.lineTo(x - 3, y + 12);
        g.closePath();
        g.fill();
      }
      // зелёный край и трава
      g.fillStyle = '#4e7d3e';
      g.fillRect(0, 598, W, 13);
      for (let x = 0; x < W; x += 11) {
        g.fillStyle = x % 22 === 0 ? '#73a252' : '#578640';
        g.beginPath();
        g.moveTo(x, 602);
        g.lineTo(x + 5, 589);
        g.lineTo(x + 10, 602);
        g.closePath();
        g.fill();
      }
      // прибой у кромки
      for (let i = 0; i < 34; i++) {
        const x = seeded(seed + i * 4.4) * W;
        g.fillStyle = `rgba(232, 255, 246, ${0.1 + seeded(i + 8) * 0.16})`;
        g.beginPath();
        g.ellipse(x, 700 + seeded(i + 2) * 14, 10 + seeded(i) * 20, 2.4, 0, 0, TAU);
        g.fill();
      }
      g.restore();
    };

    islandPaths.forEach((path, i) => drawIsland(path, i * 17.3 + 4));

    // ---------- деревья ----------
    const drawTree = (x, y, s, tone = 0) => {
      g.save();
      g.translate(x, y);
      g.scale(s, s);
      g.fillStyle = 'rgba(30, 50, 28, 0.24)';
      g.beginPath();
      g.ellipse(0, 2, 44, 10, 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.moveTo(-10, 0);
      g.quadraticCurveTo(-6, -40, -12, -74);
      g.lineTo(12, -70);
      g.quadraticCurveTo(8, -36, 12, 0);
      g.closePath();
      fillStroke(g, '#6b4a2e', '#3f2b1b', 3);
      const blobs = [
        [-34, -86, 34],
        [-10, -108, 39],
        [24, -98, 35],
        [44, -74, 27],
        [0, -76, 33],
        [-27, -66, 23],
      ];
      const palette = ['#4f8a45', '#5b9a4d', '#437a3e', '#69a457', '#3f743b', '#579047'];
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        g.fillStyle = palette[(i + tone) % palette.length];
        g.beginPath();
        g.ellipse(b[0], b[1], b[2], b[2] * 0.82, 0, 0, TAU);
        g.fill();
        g.strokeStyle = 'rgba(34, 58, 30, 0.62)';
        g.lineWidth = 2.4;
        g.stroke();
      }
      g.fillStyle = 'rgba(238, 255, 190, 0.16)';
      g.beginPath();
      g.ellipse(-10, -118, 22, 13, -0.4, 0, TAU);
      g.fill();
      g.restore();
    };

    const bush = (x, y, s, tone = 0) => {
      g.save();
      g.translate(x, y);
      g.scale(s, s);
      const palette = ['#3e7238', '#4c8342', '#356331'];
      for (let i = 0; i < 4; i++) {
        g.fillStyle = palette[(i + tone) % 3];
        g.beginPath();
        g.ellipse(-18 + i * 12, -6 - (i % 2) * 8, 17, 12, 0, 0, TAU);
        g.fill();
      }
      g.restore();
    };

    // деревья на островах (до зданий, чтобы кроны были позади)
    drawTree(62, 596, 1.02, 0);
    drawTree(148, 566, 0.78, 2);
    drawTree(372, 604, 0.62, 3);
    drawTree(444, 470, 0.78, 1);
    drawTree(520, 392, 0.72, 3);
    drawTree(742, 372, 0.82, 0);
    drawTree(842, 414, 0.9, 4);
    drawTree(930, 530, 0.7, 2);
    drawTree(1052, 548, 0.74, 1);
    drawTree(1236, 590, 0.68, 3);
    bush(118, 612, 0.9, 0);
    bush(352, 622, 0.7, 1);
    bush(430, 622, 0.8, 2);
    bush(1004, 610, 0.7, 0);
    bush(1080, 622, 0.8, 1);

    // верхушки деревьев на гребне центрального острова
    for (let i = 0; i < 7; i++) {
      const x = 560 + i * 58;
      const y = 330 + Math.sin(i * 1.3) * 12;
      g.fillStyle = ['#3d7138', '#457d3e', '#356532'][i % 3];
      g.beginPath();
      g.ellipse(x, y, 42, 24, 0, 0, TAU);
      g.fill();
    }

    // ---------- тропинки ----------
    const pathLine = (pts, width, color) => {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      pts.forEach((p, i) => {
        if (i === 0) g.moveTo(p[0], p[1]);
        else g.lineTo(p[0], p[1]);
      });
      g.stroke();
    };
    const leftPath = [[34, 626], [110, 622], [200, 606], [290, 604], [368, 606]];
    const centerPath = [[430, 622], [520, 612], [610, 604], [700, 610], [790, 602], [880, 606], [986, 610]];
    const rightPath = [[1042, 616], [1110, 608], [1180, 604], [1242, 596]];
    for (const pts of [leftPath, centerPath, rightPath]) {
      pathLine(pts, 62, 'rgba(72, 50, 30, 0.5)');
      pathLine(pts, 54, '#c9a978');
      pathLine(pts, 22, 'rgba(232, 207, 158, 0.55)');
    }
    // камешки на тропе
    for (let i = 0; i < 90; i++) {
      const x = 30 + seeded(i * 2.7) * 1210;
      const y = 594 + seeded(i * 5.9 + 1) * 26;
      g.fillStyle = i % 3 === 0 ? 'rgba(255, 240, 199, 0.35)' : 'rgba(89, 63, 37, 0.22)';
      g.beginPath();
      g.ellipse(x, y, 1.2 + seeded(i + 3) * 2.2, 1, 0, 0, TAU);
      g.fill();
    }

    // ---------- мосты ----------
    const bridge = (x1, x2, deckY) => {
      const w = x2 - x1;
      g.save();
      // тень
      g.fillStyle = 'rgba(10, 42, 48, 0.34)';
      g.beginPath();
      g.ellipse((x1 + x2) / 2, deckY + 16, w / 2 + 10, 8, 0, 0, TAU);
      g.fill();
      // опоры
      g.strokeStyle = '#4b3320';
      g.lineWidth = 8;
      for (const px of [x1 + 10, (x1 + x2) / 2, x2 - 10]) {
        g.beginPath();
        g.moveTo(px, deckY - 2);
        g.lineTo(px, deckY + 40);
        g.stroke();
      }
      // настил
      roundRect(g, x1, deckY - 8, w, 18, 3);
      fillStroke(g, '#a5774a', '#4b3320', 3);
      for (let x = x1 + 12; x < x2 - 6; x += 14) {
        g.strokeStyle = 'rgba(74, 49, 28, 0.55)';
        g.lineWidth = 1.3;
        g.beginPath();
        g.moveTo(x, deckY - 6);
        g.lineTo(x, deckY + 8);
        g.stroke();
      }
      // перила
      g.strokeStyle = '#5d3f26';
      g.lineWidth = 4;
      for (const px of [x1 + 8, x2 - 8]) {
        g.beginPath();
        g.moveTo(px, deckY - 8);
        g.lineTo(px, deckY - 54);
        g.stroke();
      }
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x1 + 8, deckY - 46);
      g.quadraticCurveTo((x1 + x2) / 2, deckY - 66, x2 - 8, deckY - 46);
      g.stroke();
      g.beginPath();
      g.moveTo(x1 + 8, deckY - 20);
      g.quadraticCurveTo((x1 + x2) / 2, deckY - 40, x2 - 8, deckY - 20);
      g.stroke();
      // флажки
      for (let i = 0; i < 5; i++) {
        const fx = x1 + 14 + i * ((w - 28) / 4);
        const fy = deckY - 48 - Math.sin((fx - x1) / w * Math.PI) * 10;
        g.fillStyle = i % 2 ? '#e8d0a4' : '#b23a30';
        g.beginPath();
        g.moveTo(fx, fy);
        g.lineTo(fx + 8, fy + 2);
        g.lineTo(fx, fy + 11);
        g.closePath();
        g.fill();
      }
      g.restore();
    };
    bridge(366, 432, 610);
    bridge(984, 1050, 610);

    // ---------- цирк Летунова ----------
    g.save();
    g.translate(-50, 0);
    // тень
    g.fillStyle = 'rgba(34, 22, 16, 0.32)';
    g.beginPath();
    g.ellipse(300, 610, 118, 15, 0, 0, TAU);
    g.fill();
    const tent = new Path2D();
    tent.moveTo(300, 304);
    tent.quadraticCurveTo(236, 390, 194, 594);
    tent.quadraticCurveTo(246, 610, 300, 610);
    tent.quadraticCurveTo(354, 610, 406, 594);
    tent.quadraticCurveTo(364, 390, 300, 304);
    tent.closePath();
    g.fillStyle = '#b33a30';
    g.fill(tent);
    g.save();
    g.clip(tent);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = i % 2 ? 'rgba(244, 227, 189, 0.82)' : 'rgba(126, 32, 36, 0.12)';
      g.fillRect(182 + i * 36, 292, 36, 326);
    }
    g.fillStyle = 'rgba(56, 22, 20, 0.16)';
    g.fillRect(182, 520, 240, 100);
    g.restore();
    g.strokeStyle = '#4a1f1d';
    g.lineWidth = 5;
    g.stroke(tent);
    // фестоны
    for (let i = 0; i < 9; i++) {
      const fx = 194 + i * 26.5;
      g.fillStyle = i % 2 ? '#f0dfb5' : '#a83b2f';
      g.beginPath();
      g.ellipse(fx + 13, 594, 14, 13, 0, 0, Math.PI);
      g.fill();
      g.strokeStyle = 'rgba(58, 29, 23, 0.5)';
      g.lineWidth = 1.4;
      g.stroke();
    }
    // вход
    g.fillStyle = '#35211f';
    g.beginPath();
    g.moveTo(252, 610);
    g.quadraticCurveTo(254, 522, 300, 510);
    g.quadraticCurveTo(346, 522, 348, 610);
    g.closePath();
    g.fill();
    g.strokeStyle = '#d3a04a';
    g.lineWidth = 4;
    g.stroke();
    for (let i = 0; i < 7; i++) {
      g.fillStyle = 'rgba(255, 215, 131, 0.78)';
      g.beginPath();
      g.arc(204 + i * 32, 568 - Math.abs(3 - i) * 4, 2.6, 0, TAU);
      g.fill();
    }
    // вывеска
    g.save();
    g.translate(300, 486);
    roundRect(g, -58, -19, 116, 38, 5);
    fillStroke(g, '#e8d0a4', '#4a1f1d', 3.4);
    g.fillStyle = '#7a2225';
    g.font = `900 20px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ЦИРК', 0, 1);
    g.restore();
    // флаг
    g.strokeStyle = '#37251d';
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(300, 306);
    g.lineTo(300, 240);
    g.stroke();
    g.fillStyle = GOLD;
    g.beginPath();
    g.moveTo(302, 242);
    g.lineTo(362, 258);
    g.lineTo(302, 278);
    g.closePath();
    g.fill();
    // афиша Летунова
    if (letunovPhoto.complete && letunovPhoto.naturalWidth > 0) {
      g.save();
      g.translate(154, 520);
      g.fillStyle = '#3d2721';
      g.fillRect(-4, -44, 56, 74);
      g.strokeStyle = GOLD;
      g.lineWidth = 3;
      g.strokeRect(-1, -41, 50, 68);
      g.beginPath();
      g.rect(0, -40, 48, 66);
      g.clip();
      g.drawImage(letunovPhoto, 0, -40, 48, 66);
      g.restore();
    }
    g.restore();

    // ---------- школа №53 ----------
    g.save();
    g.fillStyle = 'rgba(34, 22, 16, 0.3)';
    g.beginPath();
    g.ellipse(640, 612, 142, 15, 0, 0, TAU);
    g.fill();
    // корпус
    roundRect(g, 520, 404, 240, 208, 4);
    fillStroke(g, '#c9a273', '#4a3322', 4.5);
    g.fillStyle = 'rgba(78, 50, 30, 0.14)';
    for (let y = 432; y < 600; y += 30) g.fillRect(526, y, 228, 2);
    // крыша
    g.beginPath();
    g.moveTo(506, 408);
    g.lineTo(542, 360);
    g.lineTo(738, 360);
    g.lineTo(774, 408);
    g.closePath();
    fillStroke(g, '#4d3630', '#34221d', 4.5);
    g.fillStyle = '#d3a04a';
    g.fillRect(540, 394, 200, 6);
    // окна
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const wx = 546 + col * 68;
        const wy = 424 + row * 62;
        g.fillStyle = '#3f514b';
        roundRect(g, wx, wy, 34, 46, 3);
        g.fill();
        g.strokeStyle = '#4a3322';
        g.lineWidth = 2.4;
        g.stroke();
        g.fillStyle = 'rgba(246, 220, 157, 0.3)';
        g.fillRect(wx + 4, wy + 5, 10, 12);
        g.strokeStyle = 'rgba(244, 236, 204, 0.2)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(wx + 17, wy + 2);
        g.lineTo(wx + 17, wy + 44);
        g.moveTo(wx + 2, wy + 23);
        g.lineTo(wx + 32, wy + 23);
        g.stroke();
      }
    }
    // дверь
    g.fillStyle = '#35332d';
    roundRect(g, 606, 532, 68, 80, 32);
    fillStroke(g, '#35332d', '#3f2a1d', 3.5);
    g.fillStyle = '#d3a04a';
    g.beginPath();
    g.arc(662, 572, 2.6, 0, TAU);
    g.fill();
    // вывеска
    g.save();
    g.translate(640, 382);
    roundRect(g, -102, -20, 204, 40, 5);
    fillStroke(g, '#e5d1a5', '#4a3322', 3.4);
    g.fillStyle = '#2c625b';
    g.font = `900 18px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ШКОЛА №53', 0, 0);
    g.restore();
    // флаг
    g.strokeStyle = '#4a3322';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(640, 360);
    g.lineTo(640, 320);
    g.stroke();
    g.fillStyle = '#2c625b';
    g.beginPath();
    g.moveTo(642, 322);
    g.lineTo(684, 333);
    g.lineTo(642, 346);
    g.closePath();
    g.fill();
    g.restore();

    // ---------- магазин ----------
    g.save();
    g.translate(-40, 0);
    g.fillStyle = 'rgba(34, 22, 16, 0.3)';
    g.beginPath();
    g.ellipse(946, 612, 84, 13, 0, 0, TAU);
    g.fill();
    roundRect(g, 872, 462, 148, 150, 5);
    fillStroke(g, '#8f5a3b', '#3f2a1d', 4.4);
    g.beginPath();
    g.moveTo(864, 466);
    g.lineTo(890, 432);
    g.lineTo(1004, 432);
    g.lineTo(1028, 466);
    g.closePath();
    fillStroke(g, '#5e3b2a', '#34221d', 4);
    // навес
    for (let i = 0; i < 5; i++) {
      const x = 874 + i * 30;
      g.fillStyle = i % 2 ? '#f0dfb5' : '#a33b32';
      g.beginPath();
      g.moveTo(x, 466);
      g.lineTo(x + 30, 466);
      g.lineTo(x + 30, 490);
      g.quadraticCurveTo(x + 15, 502, x, 490);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(72, 38, 25, 0.5)';
      g.lineWidth = 1.2;
      g.stroke();
    }
    // витрина
    g.fillStyle = 'rgba(226, 206, 164, 0.92)';
    roundRect(g, 884, 506, 58, 66, 3);
    fillStroke(g, 'rgba(226, 206, 164, 0.92)', '#3f2a1d', 3);
    g.fillStyle = '#ad3628';
    g.font = `900 26px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.fillText('♥', 913, 544);
    // дверь
    g.fillStyle = '#3b2a26';
    roundRect(g, 962, 520, 44, 92, 4);
    fillStroke(g, '#3b2a26', '#d3a04a', 2.6);
    g.fillStyle = '#d3a04a';
    g.beginPath();
    g.arc(996, 566, 2.4, 0, TAU);
    g.fill();
    // вывеска
    g.save();
    g.translate(948, 448);
    roundRect(g, -62, -17, 124, 34, 5);
    fillStroke(g, '#e8d0a4', '#3f2a1d', 3.2);
    g.fillStyle = '#7a3a2a';
    g.font = `900 17px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('БАФФЫ', 0, 0);
    g.restore();
    // горшок
    g.fillStyle = '#4b382b';
    g.fillRect(866, 586, 26, 24);
    g.fillStyle = '#3b5e4c';
    g.beginPath();
    g.ellipse(879, 578, 21, 20, 0, 0, TAU);
    g.fill();
    g.restore();

    // ---------- мелочи на карте ----------
    // лодка у правого берега
    g.save();
    g.translate(960, 668);
    g.rotate(-0.05);
    g.fillStyle = '#a83b36';
    g.beginPath();
    g.moveTo(-34, 0);
    g.quadraticCurveTo(0, 22, 34, 0);
    g.quadraticCurveTo(0, 10, -34, 0);
    g.closePath();
    g.fill();
    g.strokeStyle = '#5c2a25';
    g.lineWidth = 2.4;
    g.stroke();
    g.strokeStyle = '#5c3a22';
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(0, -2);
    g.lineTo(0, -30);
    g.stroke();
    g.fillStyle = '#e8d0a4';
    g.beginPath();
    g.moveTo(1, -30);
    g.lineTo(20, -24);
    g.lineTo(1, -16);
    g.closePath();
    g.fill();
    g.restore();

    // камни в воде
    for (let i = 0; i < 12; i++) {
      const x = seeded(i * 8.8 + 5) * W;
      const y = 648 + seeded(i * 4.2) * 56;
      g.fillStyle = 'rgba(63, 94, 87, 0.55)';
      g.beginPath();
      g.ellipse(x, y, 4 + seeded(i) * 9, 2.5 + seeded(i + 2) * 4, 0, 0, TAU);
      g.fill();
    }

    // чайки
    g.strokeStyle = 'rgba(44, 72, 68, 0.6)';
    g.lineWidth = 2;
    const gull = (x, y, s) => {
      g.beginPath();
      g.moveTo(x - 7 * s, y);
      g.quadraticCurveTo(x - 3 * s, y - 5 * s, x, y);
      g.quadraticCurveTo(x + 3 * s, y - 5 * s, x + 7 * s, y);
      g.stroke();
    };
    gull(760, 168, 1);
    gull(790, 156, 0.8);
    gull(1010, 180, 0.9);

    // водопад с центрального острова
    const fall = g.createLinearGradient(0, 610, 0, 690);
    fall.addColorStop(0, 'rgba(205, 247, 240, 0.8)');
    fall.addColorStop(1, 'rgba(205, 247, 240, 0)');
    g.fillStyle = fall;
    g.fillRect(414, 610, 10, 76);
    g.fillStyle = 'rgba(238, 255, 248, 0.6)';
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.ellipse(419 + Math.sin(i) * 4, 678 + i * 4, 12 + i * 2, 3, 0, 0, TAU);
      g.fill();
    }

    // состаренная бумага / зерно
    for (let i = 0; i < 900; i++) {
      g.fillStyle =
        i % 3 === 0 ? 'rgba(255, 250, 230, 0.06)' : 'rgba(45, 26, 18, 0.035)';
      g.fillRect(seeded(i * 1.5 + 2) * W, seeded(i * 4.4 + 7) * H, 1.2, 1.2);
    }

    mapBgCanvas = c;
  }

  function drawMap() {
    if (mapBgCanvas) ctx.drawImage(mapBgCanvas, 0, 0);
    else {
      ctx.fillStyle = '#283d42';
      ctx.fillRect(0, 0, W, H);
    }

    // тёплые пятна у дверей
    for (const b of MAP_BUILDINGS) {
      const near = mapState.near && mapState.near.id === b.id;
      const pulse = 0.18 + Math.sin(game.time * 3 + b.x) * 0.04 + (near ? 0.18 : 0);
      const glow = ctx.createRadialGradient(b.doorX, 596, 8, b.doorX, 596, near ? 120 : 74);
      glow.addColorStop(0, `rgba(255, 219, 133, ${pulse})`);
      glow.addColorStop(1, 'rgba(255, 219, 133, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(b.doorX, 596, near ? 120 : 74, 28, 0, 0, TAU);
      ctx.fill();
      if (near) {
        ctx.strokeStyle = `rgba(255, 226, 147, ${0.42 + Math.sin(game.time * 4) * 0.14})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 7]);
        ctx.lineDashOffset = -game.time * 34;
        ctx.beginPath();
        ctx.ellipse(b.doorX, 600, 66, 16, 0, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    drawForestEntrance();
    drawHero();
    drawMapPrompt();
    drawForeground();
    drawMapHUD();
  }

  // ================= НИКИТА И СТЕПА: ШКОЛА И СКЕЙТ-ПАРК =================

  function nikitaToIdle(delay) {
    const b = boss;
    b.nkState = 'idle';
    b.nkAttackT = delay === undefined ? 1.45 : delay;
    b.nkPunchP = 0;
    b.nkPunchActive = false;
  }

  function startNikitaPhase2() {
    const b = boss;
    if (b.dying || b.phase >= 2) return;
    b.phase = 2;
    b.hp = Math.max(1, b.hp);
    b.nkTransition = true;
    b.nkState = 'nkFlee';
    b.timer = 0;
    b.nkPunchP = 0;
    b.nkPunchActive = false;
    b.nkBgPunchP = 0;
    b.nkBgFistActive = false;
    b.nkBgPunchT = 2.3;
    b.nkRideT = 0;
    b.nkWheelFlyT = 0;
    b.nkFallT = 0;
    b.nkRideDir = hero.x < W / 2 ? 1 : -1;
    bossShots.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    platforms.length = 0;
    game.shake = Math.max(game.shake, 10);
    game.flash = Math.max(game.flash, 0.2);
    Sound.sfx('roar');
    spawnComic('СТЕПА ПАДАЕТ!', b.x, 154, 25, GOLD_BRIGHT);
    spawnComic('НИКИТА ЛЕТИТ ВНИЗ!', b.x, 194, 15, CREAM);
  }

  function spawnNikitaPhone() {
    const b = boss;
    const riding = b.phase === 2;
    const fromX = riding ? b.x + b.face * 26 : b.x + 34;
    const fromY = riding ? GROUND - 96 : GROUND - 286;
    const targetX = clamp(hero.x, ARENA_L + 30, ARENA_R - 30);
    const targetY = hero.y - 54;
    const fuse = 0.78;
    const gravity = 900;
    bossShots.push({
      kind: 'nikitaPhone',
      x: fromX,
      y: fromY,
      vx: (targetX - fromX) / fuse,
      vy: (targetY - fromY) / fuse - 0.5 * gravity * fuse,
      gravity,
      r: 15,
      t: 0,
      life: 4,
      spin: rand(0, TAU),
      dir: b.face,
    });
    spawnComic('ТЕЛЕФОН!', b.x - 110, 160, 18, '#7ee0ff');
    Sound.sfx('shoot');
  }

  function spawnNikitaWheel() {
    bossShots.push({
      kind: 'bikeWheel',
      x: W + 64,
      y: GROUND - 36,
      vx: -430 * difficultyConfig().speed,
      vy: 0,
      r: 36,
      t: 0,
      life: 5,
      spin: rand(0, TAU),
      dir: -1,
    });
    spawnComic('КОЛЕСО!', W - 180, 190, 20, GOLD_BRIGHT);
    Sound.sfx('telegraph');
  }

  function nikitaPunchRect() {
    const b = boss;
    if (game.bossId !== 'nikita' || b.phase !== 1 || !b.nkPunchActive) return null;
    const reach = 440 * clamp(b.nkPunchP, 0, 1);
    return {
      x: b.x - 74 - reach,
      y: GROUND - 196,
      w: reach + 70,
      h: 78,
    };
  }

  function nikitaBgFistRect() {
    const b = boss;
    if (game.bossId !== 'nikita' || b.phase !== 2 || !b.nkBgFistActive) return null;
    const p = clamp(b.nkBgPunchP, 0, 2);
    if (p <= 0.2 || p >= 1.5) return null;
    const k = p <= 1 ? easeOutCubic(p) : easeInCubic(2 - p);
    const fy = lerp(-80, GROUND - 44, k);
    return {
      x: b.nkBgPunchX - 54,
      y: fy - 54,
      w: 108,
      h: 108,
    };
  }

  function updateNikitaBoss(dt) {
    const b = boss;
    b.timer += dt;
    b.breathe += dt;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.hpShown = damp(b.hpShown, b.hp, 9, dt);
    b.nkDeathFlee += dt;

    if (b.dying) {
      b.deathT += dt;
      return;
    }

    if (hero.dead) {
      b.nkPunchActive = false;
      b.nkBgFistActive = false;
      return;
    }

    if (b.phase === 1) {
      if (b.nkState === 'nkIntro') {
        if (game.introT > 0.05) {
          b.timer = 0;
          return;
        }
        if (b.timer >= 1.5) nikitaToIdle(1.1);
        return;
      }
      if (b.nkState === 'idle') {
        b.nkAttackT -= dt;
        if (b.nkAttackT <= 0) {
          const type = b.nkPattern++ % 3;
          if (type === 0) {
            b.nkState = 'nkPhoneWind';
            b.timer = 0;
            spawnComic('НИКИТА КИДАЕТ ТЕЛЕФОН!', b.x, 148, 19, '#7ee0ff');
            Sound.sfx('telegraph');
          } else if (type === 1) {
            b.nkState = 'nkPunchWind';
            b.timer = 0;
            b.nkPunchP = 0;
            spawnComic('СТЕПА БЬЁТ РУКОЙ!', b.x - 90, 166, 19, GOLD_BRIGHT);
            Sound.sfx('telegraph');
          } else {
            b.nkState = 'nkWheelWind';
            b.timer = 0;
            spawnComic('КОЛЕСО С ПРАВА!', W - 200, 178, 19, GOLD_BRIGHT);
            Sound.sfx('telegraph');
          }
        }
      } else if (b.nkState === 'nkPhoneWind') {
        if (b.timer >= 0.58) {
          spawnNikitaPhone();
          b.nkState = 'nkPhoneRecover';
          b.timer = 0;
        }
      } else if (b.nkState === 'nkPhoneRecover') {
        if (b.timer >= 0.38) nikitaToIdle(1.2);
      } else if (b.nkState === 'nkPunchWind') {
        b.nkPunchP = clamp(b.timer / 0.68, 0, 1) * 0.14;
        if (b.timer >= 0.68) {
          b.nkState = 'nkPunchOut';
          b.timer = 0;
          b.nkPunchP = 0.14;
          b.nkPunchActive = true;
          Sound.sfx('punch');
        }
      } else if (b.nkState === 'nkPunchOut') {
        b.nkPunchP = lerp(0.14, 1, easeOutCubic(clamp(b.timer / 0.22, 0, 1)));
        if (b.timer >= 0.42) {
          b.nkState = 'nkPunchRecover';
          b.timer = 0;
          b.nkPunchActive = false;
        }
      } else if (b.nkState === 'nkPunchRecover') {
        b.nkPunchP = lerp(1, 0, easeInOutQuad(clamp(b.timer / 0.4, 0, 1)));
        if (b.timer >= 0.4) nikitaToIdle(1.15);
      } else if (b.nkState === 'nkWheelWind') {
        if (b.timer >= 0.72) {
          spawnNikitaWheel();
          b.nkState = 'nkWheelRecover';
          b.timer = 0;
        }
      } else if (b.nkState === 'nkWheelRecover') {
        if (b.timer >= 0.55) nikitaToIdle(1.25);
      }
      return;
    }

    // ---------- вторая фаза: Никита на велосипеде ----------
    if (b.nkState === 'nkFlee') {
      b.nkTransition = true;
      if (b.timer >= 1.55) {
        b.nkState = 'nkFall';
        b.timer = 0;
        b.nkFallT = 0;
        spawnDust(W / 2, GROUND, 10, 1);
        game.shake = Math.max(game.shake, 5);
        Sound.sfx('land');
      }
      return;
    }
    if (b.nkState === 'nkFall') {
      b.nkFallT = clamp(b.timer / 0.9, 0, 1);
      if (b.timer >= 0.98) {
        b.nkState = 'nkWheelFly';
        b.timer = 0;
        spawnComic('КОЛЕСО СЛЕВА СВЕРХУ!', W / 2, 180, 19, GOLD_BRIGHT);
        Sound.sfx('telegraph');
      }
      return;
    }
    if (b.nkState === 'nkWheelFly') {
      if (b.timer >= 0.85) {
        b.nkState = 'nkBikeBuild';
        b.timer = 0;
        game.shake = Math.max(game.shake, 9);
        Sound.sfx('land');
      }
      return;
    }
    if (b.nkState === 'nkBikeBuild') {
      if (b.timer >= 0.85) {
        b.x = W / 2;
        b.nkState = 'nkRide';
        b.timer = 0;
        b.nkTransition = false;
        b.nkRideDir = 1;
        b.nkAttackT = 1.4;
        b.nkBgPunchT = 2.2;
        b.nkRideT = 0;
        spawnComic('ПОЕХАЛИ!', W / 2, 170, 26, GOLD_BRIGHT);
        Sound.sfx('roar');
      }
      return;
    }
    if (b.nkState === 'nkRide') {
      // Никита катается по всей карте туда-сюда.
      b.nkRideT += dt;
      b.x += b.nkRideDir * b.nkRideSpeed * dt;
      if (b.x > W - 210) {
        b.x = W - 210;
        b.nkRideDir = -1;
      } else if (b.x < 210) {
        b.x = 210;
        b.nkRideDir = 1;
      }
      b.face = b.nkRideDir;
      b.nkAttackT -= dt;
      if (b.nkAttackT <= 0) {
        if (b.nkPattern++ % 2 === 0) spawnNikitaPhone();
        else spawnNikitaWheel();
        b.nkAttackT = 2.65 * difficultyConfig().wait;
      }
      // Степа появляется на заднем плане и бьёт сверху.
      b.nkBgPunchT -= dt;
      if (!b.nkBgFistActive && b.nkBgPunchT <= 0) {
        b.nkBgFistActive = true;
        b.nkBgPunchP = 0;
        b.nkBgPunchX = clamp(hero.x, 170, W - 170);
        b.nkBgPunchT = 3.2 * difficultyConfig().wait;
        spawnComic('СТЕПА БЬЁТ СВЕРХУ!', b.nkBgPunchX, 156, 19, GOLD_BRIGHT);
        Sound.sfx('telegraph');
      }
      if (b.nkBgFistActive) {
        const prevPunch = b.nkBgPunchP;
        b.nkBgPunchP += dt * 2.6;
        if (prevPunch < 1 && b.nkBgPunchP >= 1) {
          // Кулак Степы долетает до самого пола.
          spawnDust(b.nkBgPunchX, GROUND, 14, 1.25);
          spawnRing(b.nkBgPunchX, GROUND - 6, '#e8d7b0', 42);
          game.shake = Math.max(game.shake, 9);
          Sound.sfx('slam');
        }
        if (b.nkBgPunchP >= 2) {
          b.nkBgFistActive = false;
          b.nkBgPunchP = 0;
          game.shake = Math.max(game.shake, 5);
        }
      }
    }
  }

  function stepaToIdle(delay) {
    const b = boss;
    b.stState = 'idle';
    b.stAttackT = delay === undefined ? 1.5 : delay;
    b.stPunchP = 0;
    b.stPunchActive = false;
    b.stBoltOn = false;
  }

  function startStepaPhase2() {
    const b = boss;
    if (b.dying || b.phase >= 2) return;
    b.phase = 2;
    b.hp = Math.max(1, b.hp);
    b.stState = 'stRideStart';
    b.stTransition = true;
    b.timer = 0;
    b.stRideStartT = 0;
    b.stScrollT = 0;
    b.stScrollDist = 0;
    b.stScrollSpeed = 190;
    b.stExit = false;
    b.stCrashT = 0;
    b.stAttackT = 1.5;
    b.stPlatT = 0;
    b.stHazardT = 0;
    b.stBoltOn = false;
    b.stPunchActive = false;
    bossShots.length = 0;
    platforms.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    hero.x = 260;
    hero.y = GROUND;
    hero.vx = 0;
    hero.vy = 0;
    hero.onGround = true;
    game.stepaScroll = true;
    game.stepaScrollDist = 0;
    game.shake = Math.max(game.shake, 12);
    game.flash = Math.max(game.flash, 0.22);
    Sound.sfx('roar');
    spawnComic('СТЕПА ВСТАЛ НА СКЕЙТ!', W / 2, 150, 27, GOLD_BRIGHT);
    spawnComic('БЕГИ К ВЫХОДУ!', W / 2, 194, 16, CREAM);
  }

  function spawnStepaVehicle(kind) {
    const type = kind || pick(['bike', 'skate', 'scooter']);
    bossShots.push({
      kind: 'stepaVehicle',
      vehicle: type,
      x: W + 70,
      y: GROUND - 30,
      vx: -330 * difficultyConfig().speed,
      vy: 0,
      r: 34,
      t: 0,
      life: 7,
      spin: 0,
      dir: -1,
    });
    Sound.sfx('telegraph');
  }

  function spawnStepaScrollPlatform() {
    platforms.push({
      kind: 'skatePlatform',
      x: W + 120,
      y: GROUND - rand(130, 210),
      w: rand(150, 210),
      h: 18,
      solid: true,
      life: 20,
    });
  }

  function spawnStepaScooter() {
    bossShots.push({
      kind: 'stepaScooter',
      x: W + 60,
      y: GROUND - 24,
      vx: -(300 + rand(0, 90)) * difficultyConfig().speed,
      vy: 0,
      r: 30,
      t: 0,
      life: 8,
      spin: 0,
      dir: -1,
    });
  }

  function stepaPunchRect() {
    const b = boss;
    if (game.bossId !== 'stepa' || b.phase !== 1 || !b.stPunchActive) return null;
    const reach = 290 * clamp(b.stPunchP, 0, 1);
    return {
      x: b.x - 58 - reach,
      y: GROUND - 170,
      w: reach + 54,
      h: 66,
    };
  }

  function stepaHairLine() {
    const b = boss;
    return {
      x1: b.x - 26,
      y1: GROUND - 302,
      x2: b.stBoltX,
      y2: b.stBoltY,
    };
  }

  function updateStepaBoss(dt) {
    const b = boss;
    b.timer += dt;
    b.breathe += dt;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.hpShown = damp(b.hpShown, b.hp, 9, dt);
    b.stHairSpark = Math.max(0, b.stHairSpark - dt * 2.5);

    if (b.dying) {
      b.deathT += dt;
      return;
    }
    if (hero.dead) {
      b.stPunchActive = false;
      b.stBoltOn = false;
      return;
    }

    if (b.phase === 1) {
      if (b.stState === 'idle') {
        b.stAttackT -= dt;
        if (b.stAttackT <= 0) {
          const type = b.stPattern++ % 3;
          b.timer = 0;
          if (type === 0) {
            b.stState = 'stHairWind';
            b.stBoltX = clamp(hero.x, 90, W - 90);
            b.stBoltY = hero.y - 40;
            spawnComic('ВОЛОСЫ-МОЛНИИ!', b.x - 100, 150, 19, '#9ce8ff');
          } else if (type === 1) {
            b.stState = 'stVehicleWind';
            spawnComic('ТРАНСПОРТ С ПРАВА!', W - 210, 170, 19, GOLD_BRIGHT);
          } else {
            b.stState = 'stPunchWind';
            b.stPunchP = 0;
            spawnComic('СТЕПА БЬЁТ!', b.x - 90, 165, 19, GOLD_BRIGHT);
          }
          Sound.sfx('telegraph');
        }
      } else if (b.stState === 'stHairWind') {
        b.stHairSpark = 1;
        if (b.timer >= 0.82) {
          b.stState = 'stHairFire';
          b.timer = 0;
          b.stBoltOn = true;
          Sound.sfx('chalk');
          game.shake = Math.max(game.shake, 5);
        }
      } else if (b.stState === 'stHairFire') {
        b.stBoltOn = true;
        if (b.timer >= 0.36) {
          b.stBoltOn = false;
          b.stState = 'stHairRecover';
          b.timer = 0;
        }
      } else if (b.stState === 'stHairRecover') {
        if (b.timer >= 0.42) stepaToIdle(1.35);
      } else if (b.stState === 'stVehicleWind') {
        if (b.timer >= 0.72) {
          spawnStepaVehicle();
          b.stState = 'stVehicleRecover';
          b.timer = 0;
        }
      } else if (b.stState === 'stVehicleRecover') {
        if (b.timer >= 0.55) stepaToIdle(1.3);
      } else if (b.stState === 'stPunchWind') {
        b.stPunchP = clamp(b.timer / 0.62, 0, 1) * 0.12;
        if (b.timer >= 0.62) {
          b.stState = 'stPunchOut';
          b.timer = 0;
          b.stPunchActive = true;
          b.stPunchP = 0.12;
          Sound.sfx('punch');
        }
      } else if (b.stState === 'stPunchOut') {
        b.stPunchP = lerp(0.12, 1, easeOutCubic(clamp(b.timer / 0.2, 0, 1)));
        if (b.timer >= 0.4) {
          b.stState = 'stPunchRecover';
          b.timer = 0;
          b.stPunchActive = false;
        }
      } else if (b.stState === 'stPunchRecover') {
        b.stPunchP = lerp(1, 0, easeInOutQuad(clamp(b.timer / 0.38, 0, 1)));
        if (b.timer >= 0.38) stepaToIdle(1.25);
      }
      return;
    }

    // ---------- вторая фаза: бегущий скейт-парк ----------
    if (b.stState === 'stRideStart') {
      b.stTransition = true;
      b.stRideStartT += dt;
      if (b.stRideStartT >= 1.15) {
        b.stState = 'stRide';
        b.stTransition = false;
        b.stScrollT = 0;
        b.stAttackT = 1.7;
        b.stPlatT = 0.4;
        b.stHazardT = 0.8;
        spawnComic('ДОГОНЯЙ!', W / 2, 160, 24, GOLD_BRIGHT);
      }
      return;
    }

    if (b.stState === 'stCrash') {
      b.stCrashT += dt;
      if (b.stCrashT >= 1.15) {
        b.hp = 0;
        startBossDeath();
      }
      return;
    }

    if (b.stState === 'stRide') {
      b.stScrollT += dt;
      b.stScrollSpeed = Math.min(345, 190 + b.stScrollT * 9);
      const dx = b.stScrollSpeed * dt;
      b.stScrollDist += dx;
      game.stepaScrollDist = b.stScrollDist;
      // Мир едет навстречу герою.
      for (let i = platforms.length - 1; i >= 0; i--) {
        const p = platforms[i];
        p.x -= dx;
        if (p.x < -160) platforms.splice(i, 1);
      }
      b.stPlatT -= dt;
      if (b.stPlatT <= 0 && platforms.length < 5) {
        spawnStepaScrollPlatform();
        b.stPlatT = rand(1.15, 1.8);
      }
      b.stHazardT -= dt;
      if (b.stHazardT <= 0) {
        spawnStepaScooter();
        b.stHazardT = rand(0.95, 1.45) * difficultyConfig().wait;
      }
      b.stAttackT -= dt;
      if (b.stAttackT <= 0) {
        b.stAttackT = 2.15 * difficultyConfig().wait;
        b.stBoltX = clamp(hero.x, 100, W - 100);
        b.stBoltY = hero.y - 40;
        bossShots.push({
          kind: 'stepaHairBolt',
          x1: W - 110,
          y1: GROUND - 300,
          x2: b.stBoltX,
          y2: b.stBoltY,
          r: 16,
          t: 0,
          life: 0.34,
          spin: 0,
          dir: -1,
        });
        Sound.sfx('chalk');
      }
      b.x = W - 108;
      b.face = -1;
      if (!b.stExit && b.stScrollDist >= 2750) {
        b.stExit = true;
        b.stState = 'stCrash';
        b.stCrashT = 0;
        b.stBoltOn = false;
        game.stepaScroll = false;
        game.shake = Math.max(game.shake, 18);
        game.flash = Math.max(game.flash, 0.3);
        spawnComic('ВЫХОД!', W / 2, 160, 30, GOLD_BRIGHT);
        spawnComic('СТЕПА ВРЕЗАЕТСЯ!', W / 2, 204, 17, CREAM);
        Sound.sfx('slam');
      }
    }
  }

  function drawStepaHairBolt(x1, y1, x2, y2, alpha = 1) {
    const t = game.time;
    ctx.save();
    ctx.globalAlpha = alpha;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const points = [];
    const segs = 9;
    for (let i = 0; i <= segs; i++) {
      const k = i / segs;
      const jag = i === 0 || i === segs ? 0 : Math.sin(t * 42 + i * 2.7) * 13;
      points.push({ x: lerp(x1, x2, k) + nx * jag, y: lerp(y1, y2, k) + ny * jag });
    }
    for (const pass of [
      { color: 'rgba(120, 230, 255, 0.22)', width: 24 },
      { color: 'rgba(140, 240, 255, 0.65)', width: 9 },
      { color: '#f4ffff', width: 3 },
    ]) {
      ctx.strokeStyle = pass.color;
      ctx.lineWidth = pass.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(190, 250, 255, 0.7)';
    for (let i = 1; i < points.length - 1; i += 2) {
      circle(ctx, points[i].x, points[i].y, 3.5, 'rgba(210, 252, 255, 0.75)', null, 0);
    }
    ctx.restore();
  }

  function drawNikitaStepaShot(s) {
    if (s.kind === 'nikitaPhone') {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.spin);
      ctx.fillStyle = 'rgba(126, 224, 255, 0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, TAU);
      ctx.fill();
      roundRect(ctx, -18, -28, 36, 56, 8);
      fillStroke(ctx, '#181b22', INK, 3);
      ctx.fillStyle = '#7ee0ff';
      roundRect(ctx, -13, -20, 26, 38, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(-9, -16, 18, 3);
      ctx.fillStyle = '#d9e9ef';
      circle(ctx, 0, 22, 2.6, '#d9e9ef', null, 0);
      ctx.restore();
      return;
    }
    if (s.kind === 'bikeWheel') {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.spin);
      circle(ctx, 0, 0, 36, '#2b2727', INK, 4);
      circle(ctx, 0, 0, 28, 'rgba(210, 205, 190, 0.18)', null, 0);
      ctx.strokeStyle = '#b9b3a4';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 29, Math.sin(a) * 29);
        ctx.stroke();
      }
      circle(ctx, 0, 0, 6, '#9a9489', INK, 2);
      ctx.restore();
      return;
    }
    const scooter = s.kind === 'stepaScooter' || s.vehicle === 'scooter';
    const bike = s.vehicle === 'bike';
    ctx.save();
    ctx.translate(s.x, s.y);
    // тень
    ctx.fillStyle = 'rgba(20, 16, 14, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 28, 42, 7, 0, 0, TAU);
    ctx.fill();
    if (bike) {
      drawBikeVector(ctx, -46, 0, 34, s.spin, 1);
      drawBikeVector(ctx, 46, 0, 34, s.spin, 1);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-46, 0);
      ctx.lineTo(-10, -34);
      ctx.lineTo(26, -34);
      ctx.lineTo(46, 0);
      ctx.moveTo(-10, -34);
      ctx.lineTo(10, 0);
      ctx.lineTo(-46, 0);
      ctx.stroke();
      ctx.strokeStyle = '#b23b32';
      ctx.lineWidth = 3.4;
      ctx.stroke();
    } else if (scooter) {
      roundRect(ctx, -40, 6, 76, 10, 5);
      fillStroke(ctx, '#2c4b53', INK, 3);
      circle(ctx, -30, 22, 13, '#2b2727', INK, 3);
      circle(ctx, 30, 22, 13, '#2b2727', INK, 3);
      ctx.strokeStyle = '#2c4b53';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(34, 8);
      ctx.lineTo(42, -52);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.strokeStyle = '#2c4b53';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(34, 8);
      ctx.lineTo(42, -52);
      ctx.stroke();
      ctx.strokeStyle = '#3d3a38';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(27, -56);
      ctx.lineTo(57, -56);
      ctx.stroke();
    } else {
      // скейтборд
      ctx.save();
      ctx.rotate(-0.08);
      roundRect(ctx, -48, 4, 96, 11, 5);
      fillStroke(ctx, '#b94835', INK, 3);
      circle(ctx, -31, 22, 12, '#2b2727', INK, 3);
      circle(ctx, 31, 22, 12, '#2b2727', INK, 3);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBikeVector(g, x, y, r, spin, scale = 1) {
    g.save();
    g.translate(x, y);
    g.rotate(spin);
    circle(g, 0, 0, r, '#2a2626', INK, 3.4);
    circle(g, 0, 0, r * 0.74, 'rgba(230, 225, 210, 0.15)', null, 0);
    g.strokeStyle = '#bdb6a6';
    g.lineWidth = 1.8;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * r * 0.76, Math.sin(a) * r * 0.76);
      g.stroke();
    }
    circle(g, 0, 0, r * 0.16, '#999183', INK, 1.8);
    g.restore();
  }

  function drawStepaBoy(g, t, opts = {}) {
    const face = opts.face || -1;
    const scale = opts.scale || 1;
    const walk = opts.walk || 0;
    const carry = !!opts.carry;
    const battered = !!opts.battered;
    const armsUp = !!opts.armsUp;
    const glow = opts.hairGlow || 0;
    const slouch = opts.slouch === undefined ? 1 : opts.slouch;
    g.save();
    g.scale(face * scale, scale);
    const bob = opts.bob === undefined ? Math.sin(t * 2.2) * 1.5 : opts.bob;
    const legA = Math.sin(walk) * 0.55;
    const legB = -Math.sin(walk) * 0.55;
    // ноги
    g.strokeStyle = '#27313c';
    g.lineWidth = 20;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-14, -120);
    g.lineTo(-18 + Math.sin(legA) * 20, -8);
    g.moveTo(14, -120);
    g.lineTo(18 + Math.sin(legB) * 20, -8);
    g.stroke();
    g.fillStyle = '#241b18';
    roundRect(g, -32, -12, 28, 11, 4);
    fillStroke(g, '#241b18', INK, 2);
    roundRect(g, 8, -12, 30, 11, 4);
    fillStroke(g, '#241b18', INK, 2);
    // туловище — белая рубашка, сутулая
    g.save();
    g.translate(slouch * 9, bob);
    g.rotate(slouch * 0.1);
    roundRect(g, -35, -258, 70, 142, 22);
    fillStroke(g, battered ? '#d8d0bd' : '#f3eee0', INK, 4);
    g.fillStyle = 'rgba(120, 100, 80, 0.18)';
    roundRect(g, -27, -246, 17, 92, 8);
    g.fill();
    // воротник
    g.fillStyle = '#e2dbc9';
    g.beginPath();
    g.moveTo(-20, -258);
    g.lineTo(0, -238);
    g.lineTo(20, -258);
    g.closePath();
    fillStroke(g, '#e2dbc9', INK, 1.8);
    // галстук
    g.fillStyle = '#3f5f56';
    g.beginPath();
    g.moveTo(-5, -250);
    g.lineTo(5, -250);
    g.lineTo(7, -224);
    g.lineTo(0, -212);
    g.lineTo(-7, -224);
    g.closePath();
    fillStroke(g, '#3f5f56', INK, 1.6);
    if (battered) {
      g.strokeStyle = 'rgba(70, 50, 40, 0.7)';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(-22, -212);
      g.lineTo(11, -192);
      g.moveTo(-4, -236);
      g.lineTo(23, -222);
      g.stroke();
    }
    // руки
    const shoulderY = -236;
    g.strokeStyle = INK;
    g.lineWidth = 19;
    g.lineCap = 'round';
    g.beginPath();
    if (armsUp) {
      g.moveTo(-24, shoulderY);
      g.quadraticCurveTo(-42, shoulderY - 42, -58, shoulderY - 68);
      g.moveTo(24, shoulderY);
      g.quadraticCurveTo(42, shoulderY - 42, 58, shoulderY - 68);
    } else {
      g.moveTo(-24, shoulderY);
      g.quadraticCurveTo(-46, shoulderY + 42, -34, shoulderY + 72);
      g.moveTo(24, shoulderY);
      g.quadraticCurveTo(40, shoulderY + 46, 30, shoulderY + 76);
    }
    g.stroke();
    g.strokeStyle = '#f3eee0';
    g.lineWidth = 13;
    g.stroke();
    g.fillStyle = SKIN;
    if (armsUp) {
      circle(g, -60, shoulderY - 70, 9, SKIN, INK, 2.2);
      circle(g, 60, shoulderY - 70, 9, SKIN, INK, 2.2);
    } else {
      circle(g, -34, shoulderY + 76, 9, SKIN, INK, 2.2);
      circle(g, 30, shoulderY + 80, 9, SKIN, INK, 2.2);
    }
    // голова
    const headY = -300;
    g.save();
    if (glow > 0) {
      const grd = g.createRadialGradient(0, headY - 20, 6, 0, headY - 20, 62);
      grd.addColorStop(0, 'rgba(150, 240, 255, 0.4)');
      grd.addColorStop(1, 'rgba(150, 240, 255, 0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, headY - 20, 62, 0, TAU);
      g.fill();
    }
    circle(g, 0, headY, 28, SKIN, INK, 4);
    // кудри
    g.fillStyle = '#2a1d18';
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI * 0.98 + (i / 10) * Math.PI * 0.96;
      const r = 10 + (i % 3) * 2.4;
      circle(g, Math.cos(a) * 27, headY - 12 + Math.sin(a) * 25, r, '#2a1d18', INK, 2);
    }
    // глаза и рот
    g.fillStyle = CREAM;
    ellipsePath(g, -10, headY - 2, 7, 4.6);
    g.fill();
    ellipsePath(g, 10, headY - 2, 7, 4.6);
    g.fill();
    g.fillStyle = INK;
    circle(g, -8, headY - 1, 2.2, INK, null, 0);
    circle(g, 12, headY - 1, 2.2, INK, null, 0);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-9, headY + 13);
    g.quadraticCurveTo(0, headY + 18, 10, headY + 12);
    g.stroke();
    if (glow > 0) {
      g.strokeStyle = `rgba(160, 245, 255, ${0.5 + glow * 0.5})`;
      g.lineWidth = 2.4;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.8 + i * 0.35;
        g.beginPath();
        g.moveTo(Math.cos(a) * 34, headY - 22 + Math.sin(a) * 30);
        g.lineTo(Math.cos(a) * 48 + Math.sin(t * 20 + i) * 6, headY - 24 + Math.sin(a) * 44);
        g.stroke();
      }
    }
    g.restore();
    g.restore();
    if (carry) {
      // Никита сидит на плечах Степы, а не стоит рядом. Координаты
      // локальные: Степа уже зеркалится по направлению взгляда.
      drawNikitaKid(g, t, {
        x: 28,
        y: -230,
        scale: 0.6,
        riding: true,
        face: 1,
        bob: Math.sin(t * 2.6) * 1.2,
      });
    }
    g.restore();
  }

  function drawNikitaKid(g, t, opts = {}) {
    const scale = opts.scale || 1;
    const face = opts.face || 1;
    g.save();
    g.translate(opts.x || 0, opts.y || 0);
    g.scale(face * scale, scale);
    const bob = opts.bob === undefined ? Math.sin(t * 2.6) * 1.2 : opts.bob;
    // ноги
    g.strokeStyle = '#2a2a36';
    g.lineWidth = 15;
    g.lineCap = 'round';
    g.beginPath();
    if (opts.riding) {
      g.moveTo(-10, -64);
      g.lineTo(-34, -16);
      g.moveTo(10, -64);
      g.lineTo(30, -16);
    } else {
      g.moveTo(-10, -66);
      g.lineTo(-14, -4);
      g.moveTo(10, -66);
      g.lineTo(16, -4);
    }
    g.stroke();
    g.fillStyle = '#1c1718';
    roundRect(g, -28, -8, 25, 10, 4);
    fillStroke(g, '#1c1718', INK, 2);
    roundRect(g, 4, -8, 27, 10, 4);
    fillStroke(g, '#1c1718', INK, 2);
    // тело — тёмная куртка
    roundRect(g, -26, -136 + bob, 52, 78, 15);
    fillStroke(g, '#333a4c', INK, 3.4);
    g.fillStyle = 'rgba(126, 224, 255, 0.35)';
    roundRect(g, -18, -126 + bob, 36, 12, 5);
    g.fill();
    // руки
    g.strokeStyle = INK;
    g.lineWidth = 14;
    g.beginPath();
    g.moveTo(-22, -124 + bob);
    g.lineTo(-34, -84 + bob);
    g.moveTo(22, -124 + bob);
    g.lineTo(34, -86 + bob);
    g.stroke();
    g.strokeStyle = '#333a4c';
    g.lineWidth = 9;
    g.stroke();
    g.fillStyle = SKIN;
    circle(g, -35, -80 + bob, 6, SKIN, INK, 2);
    circle(g, 35, -82 + bob, 6, SKIN, INK, 2);
    // телефон
    roundRect(g, 31, -92 + bob, 13, 22, 3);
    fillStroke(g, '#111', '#7ee0ff', 1.6);
    // голова
    const hy = -158 + bob;
    circle(g, 0, hy, 23, SKIN, INK, 3.2);
    g.fillStyle = '#241a18';
    g.beginPath();
    g.moveTo(-24, hy - 8);
    g.quadraticCurveTo(-16, hy - 35, 9, hy - 27);
    g.quadraticCurveTo(25, hy - 20, 22, hy - 4);
    g.quadraticCurveTo(2, hy - 18, -12, hy - 5);
    g.closePath();
    fillStroke(g, '#241a18', INK, 2.4);
    g.fillStyle = INK;
    circle(g, -7, hy, 2, INK, null, 0);
    circle(g, 7, hy, 2, INK, null, 0);
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(-6, hy + 11);
    g.quadraticCurveTo(0, hy + 14, 7, hy + 10);
    g.stroke();
    g.restore();
  }

  function drawNikitaHallway() {
    const t = game.time;
    const dark = boss.phase === 2;
    const wall = ctx.createLinearGradient(0, 0, 0, GROUND);
    wall.addColorStop(0, dark ? '#17191b' : '#1c1e20');
    wall.addColorStop(0.5, dark ? '#222526' : '#292b2a');
    wall.addColorStop(1, '#171513');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, GROUND);
    // потолок
    ctx.fillStyle = '#101112';
    ctx.fillRect(0, 0, W, 38);
    // панель
    ctx.fillStyle = '#263a35';
    ctx.fillRect(0, 390, W, GROUND - 390);
    ctx.fillStyle = 'rgba(255, 235, 190, 0.08)';
    ctx.fillRect(0, 396, W, 4);
    // пол
    const floor = ctx.createLinearGradient(0, GROUND, 0, H);
    floor.addColorStop(0, '#2b2420');
    floor.addColorStop(1, '#0d0b0a');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    // шкафчики
    for (const side of [0, 1]) {
      const x0 = side ? W - 250 : 26;
      for (let i = 0; i < 4; i++) {
        const x = x0 + (side ? i * 54 : i * 54);
        roundRect(ctx, x, 322, 44, 228, 4);
        fillStroke(ctx, i % 2 ? '#334344' : '#2d3b3d', INK, 2.2);
        ctx.fillStyle = 'rgba(210, 220, 210, 0.18)';
        ctx.fillRect(x + 6, 334, 32, 3);
        circle(ctx, x + 22, 438, 2.2, '#aeb8b2', null, 0);
      }
    }
    // двери
    for (const x of [315, 790, 1150]) {
      roundRect(ctx, x - 58, 342, 116, 268, 5);
      fillStroke(ctx, '#2f2622', INK, 3);
      roundRect(ctx, x - 49, 352, 98, 248, 4);
      fillStroke(ctx, x === 1150 ? '#17161b' : '#49372b', '#6b5337', 2);
      circle(ctx, x + 38, 484, 3, GOLD, INK, 1.4);
      if (x !== 1150) {
        ctx.fillStyle = 'rgba(230, 214, 170, 0.25)';
        roundRect(ctx, x - 34, 372, 68, 26, 3);
        ctx.fill();
      }
    }
    // лампа
    const lampGlow = ctx.createRadialGradient(640, 50, 8, 640, 50, 280);
    lampGlow.addColorStop(0, 'rgba(255, 232, 170, 0.22)');
    lampGlow.addColorStop(1, 'rgba(255, 232, 170, 0)');
    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(640, 50, 280, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d8c799';
    ctx.fillRect(600, 18, 80, 7);
    // табличка тёмного кабинета
    ctx.save();
    roundRect(ctx, 1076, 242, 148, 32, 5);
    fillStroke(ctx, 'rgba(14, 13, 15, 0.94)', 'rgba(150, 220, 190, 0.45)', 1.4);
    ctx.fillStyle = '#cde7d9';
    ctx.font = `900 12px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ТЁМНЫЙ КАБИНЕТ', 1150, 258);
    ctx.restore();
    // трещины/пыль
    ctx.strokeStyle = 'rgba(230, 220, 200, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const x = 120 + seeded(i * 4.3) * 1040;
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x + 12, 130);
      ctx.lineTo(x - 5, 190);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 240, 210, 0.35)';
    for (let i = 0; i < 28; i++) {
      const x = (seeded(i * 3.7) * W + t * (6 + (i % 4) * 4)) % W;
      const y = 90 + ((seeded(i * 6.1) * 430 + t * (7 + (i % 5) * 6)) % 430);
      ctx.fillRect(x, y, 1.4, 1.4);
    }
  }

  function drawNikitaAtmosphere() {
    const dark = boss.phase === 2 ? 0.36 : 0.26;
    const vig = ctx.createRadialGradient(W / 2, 330, 160, W / 2, 330, 780);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, `rgba(3, 5, 6, ${dark})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    if (boss.nkBgFistActive) {
      ctx.fillStyle = 'rgba(120, 200, 220, 0.06)';
      ctx.fillRect(0, 0, W, GROUND);
    }
  }

  function drawStepaSkatePark() {
    const t = game.time;
    const scroll = game.stepaScroll ? game.stepaScrollDist : 0;
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#2b5f77');
    sky.addColorStop(0.55, '#7fa6a1');
    sky.addColorStop(1, '#e0b06c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, GROUND);
    // солнце
    ctx.fillStyle = 'rgba(255, 224, 150, 0.9)';
    ctx.beginPath();
    ctx.arc(1010, 130, 42, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 224, 150, 0.14)';
    ctx.beginPath();
    ctx.arc(1010, 130, 110, 0, TAU);
    ctx.fill();
    // дальние дома
    for (let i = 0; i < 12; i++) {
      const span = W + 500;
      const x = ((i * 147 - scroll * 0.18 + seeded(i * 3.1) * 200) % span + span) % span - 250;
      const bh = 150 + seeded(i * 5.7) * 130;
      ctx.fillStyle = i % 2 ? 'rgba(54, 74, 73, 0.55)' : 'rgba(66, 84, 79, 0.5)';
      ctx.fillRect(x, GROUND - 120 - bh, 90, bh);
      ctx.fillStyle = 'rgba(255, 225, 160, 0.22)';
      for (let w = 0; w < 3; w++) ctx.fillRect(x + 12 + w * 24, GROUND - 100 - bh + 20, 12, 16);
    }
    // забор
    ctx.strokeStyle = 'rgba(70, 65, 58, 0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 30; i++) {
      const x = ((i * 56 - scroll * 0.5) % (W + 120) + W + 120) % (W + 120) - 60;
      ctx.beginPath();
      ctx.moveTo(x, 470);
      ctx.lineTo(x, 540);
      ctx.stroke();
    }
    // асфальт
    const groundGrad = ctx.createLinearGradient(0, 540, 0, H);
    groundGrad.addColorStop(0, '#756f63');
    groundGrad.addColorStop(1, '#373631');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 540, W, H - 540);
    ctx.fillStyle = 'rgba(255, 238, 190, 0.12)';
    ctx.fillRect(0, 540, W, 4);
    // разметка
    ctx.strokeStyle = 'rgba(240, 230, 200, 0.22)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const x = ((i * 110 - scroll) % (W + 140) + W + 140) % (W + 140) - 70;
      ctx.beginPath();
      ctx.moveTo(x, 642);
      ctx.lineTo(x + 52, 642);
      ctx.stroke();
    }
    // рампы и перила
    const rampOffset = scroll % 420;
    for (let i = -1; i < 5; i++) {
      const x = i * 420 - rampOffset + 90;
      // рампа
      ctx.beginPath();
      ctx.moveTo(x, 600);
      ctx.lineTo(x + 128, 548);
      ctx.lineTo(x + 214, 548);
      ctx.lineTo(x + 214, 600);
      ctx.closePath();
      fillStroke(ctx, '#9a8564', INK, 4);
      ctx.strokeStyle = 'rgba(255, 240, 200, 0.24)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 10, 594);
      ctx.lineTo(x + 130, 546);
      ctx.stroke();
      // перила
      ctx.strokeStyle = '#39474b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + 250, 600);
      ctx.lineTo(x + 250, 512);
      ctx.lineTo(x + 380, 512);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200, 230, 230, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // выход
    const exitVisible = !game.stepaScroll && boss.phase === 2 || (boss.phase === 2 && game.stepaScrollDist > 2100);
    if (exitVisible) {
      const ex = game.stepaScroll ? clamp(W - 120 - (2750 - game.stepaScrollDist) * 0.4, 860, W - 80) : W - 170;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = GOLD_BRIGHT;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(ex - 110, 600);
      ctx.lineTo(ex - 110, 330);
      ctx.lineTo(ex + 110, 330);
      ctx.lineTo(ex + 110, 600);
      ctx.stroke();
      ctx.fillStyle = 'rgba(24, 12, 16, 0.8)';
      roundRect(ctx, ex - 124, 288, 248, 40, 7);
      fillStroke(ctx, 'rgba(24, 12, 16, 0.9)', GOLD_BRIGHT, 2);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.font = `900 21px ${FONT_DISPLAY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ВЫХОД', ex, 309);
      ctx.restore();
    }
    if (game.stepaScroll) {
      // линии скорости
      ctx.strokeStyle = 'rgba(255, 250, 230, 0.18)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 11; i++) {
        const y = 120 + i * 39;
        const x = W - ((t * (420 + i * 35)) % (W + 180));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 120 + (i % 4) * 40, y);
        ctx.stroke();
      }
    }
  }

  function drawStepaAtmosphere() {
    const vig = ctx.createRadialGradient(W / 2, 330, 180, W / 2, 330, 820);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(10, 8, 6, 0.25)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    if (boss.stBoltOn || boss.stHairSpark > 0.2) {
      ctx.fillStyle = 'rgba(130, 235, 255, 0.05)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawNewBossWarnings() {
    if (game.bossId === 'nikita' && boss.phase === 2 && boss.nkBgFistActive) {
      const p = clamp(boss.nkBgPunchP, 0, 2);
      if (p > 0.1 && p < 1.45) {
        ctx.save();
        const a = 0.4 + Math.sin(game.time * 12) * 0.2;
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#9ce8ff';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(boss.nkBgPunchX, 58);
        ctx.lineTo(boss.nkBgPunchX, GROUND - 160);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
    if (game.bossId === 'stepa' && boss.phase === 2) {
      const total = 2750;
      const frac = clamp(boss.stScrollDist / total, 0, 1);
      ctx.save();
      roundRect(ctx, W / 2 - 180, 118, 360, 32, 8);
      fillStroke(ctx, 'rgba(20, 14, 12, 0.82)', 'rgba(211, 160, 74, 0.45)', 1.2);
      ctx.fillStyle = 'rgba(244, 227, 189, 0.7)';
      ctx.font = `700 9px Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(boss.stState === 'stCrash' ? 'СТЕПА ВРЕЗАЛСЯ!' : 'ДО ВЫХОДА', W / 2, 128);
      roundRect(ctx, W / 2 - 160, 134, 320 * frac, 7, 3);
      fillStroke(ctx, boss.stState === 'stCrash' ? GOLD_BRIGHT : '#8fd8c4', null, 0);
      ctx.restore();
    }
  }

  function drawNikitaBoss() {
    const b = boss;
    const t = game.time;
    if (b.dying) {
      // Никита лежит, Степа убегает вправо.
      ctx.save();
      ctx.translate(b.x, GROUND);
      drawNikitaKid(ctx, t, { x: 0, y: 0, scale: 1.05, riding: true, face: -1, bob: 0 });
      ctx.restore();
      const fleeX = b.x + 140 + b.deathT * 250;
      if (fleeX < W + 140) {
        ctx.save();
        ctx.translate(fleeX, GROUND);
        drawStepaBoy(ctx, t, {
          face: 1,
          scale: 0.96,
          walk: t * 15,
          battered: true,
          slouch: 0.7,
        });
        ctx.restore();
        spawnDust(fleeX, GROUND, 0.2, 0.3);
      }
      ctx.save();
      ctx.fillStyle = 'rgba(20, 14, 12, 0.35)';
      ctx.beginPath();
      ctx.ellipse(b.x, GROUND + 2, 80, 14, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (b.phase === 1) {
      let stepaX = b.x;
      let alpha = 1;
      let bob = 0;
      if (b.nkState === 'nkIntro') {
        const p = easeOutCubic(clamp(b.timer / 1.5, 0, 1));
        stepaX = lerp(W + 170, b.x, p);
        alpha = 1;
      }
      const running = b.nkState === 'nkIntro';
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(stepaX, GROUND);
      drawStepaBoy(ctx, t, {
        face: -1,
        scale: 1.08,
        walk: running ? t * 22 : 0,
        carry: true,
        slouch: running ? 1.15 : 1,
        bob,
      });
      ctx.restore();
      // рука Степы в ударе
      if (b.nkPunchActive || b.nkState === 'nkPunchOut' || b.nkState === 'nkPunchRecover') {
        const reach = 440 * clamp(b.nkPunchP, 0, 1);
        ctx.save();
        ctx.translate(stepaX, GROUND - 236);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 30;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-28 - reach * 0.65, 16);
        ctx.stroke();
        ctx.strokeStyle = '#f3eee0';
        ctx.lineWidth = 22;
        ctx.stroke();
        ctx.fillStyle = SKIN;
        ellipsePath(ctx, -36 - reach, 22, 27, 22, 0.2);
        fillStroke(ctx, SKIN, INK, 3.5);
        ctx.strokeStyle = 'rgba(255, 240, 200, 0.3)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-70 - reach - i * 20, 2 + i * 16);
          ctx.lineTo(-126 - reach - i * 26, 2 + i * 16);
          ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }

    // ---------- вторая фаза ----------
    if (b.nkState === 'nkFlee') {
      // Степа бросает Никиту и убегает вправо, Никита падает сверху.
      const fleeX = b.x + 20 + b.timer * 260;
      ctx.save();
      ctx.translate(fleeX, GROUND);
      drawStepaBoy(ctx, t, {
        face: 1,
        scale: 1.02,
        walk: t * 20,
        battered: true,
        slouch: 0.75,
      });
      ctx.restore();
      const fp = clamp(b.timer / 1.55, 0, 1);
      const fallY = lerp(-130, GROUND, fp * fp);
      ctx.save();
      ctx.translate(W / 2, fallY);
      drawNikitaKid(ctx, t, { x: 0, y: 0, scale: 1.05, face: 1, riding: false, bob: 0 });
      ctx.restore();
      return;
    }

    if (b.nkState === 'nkFall' || b.nkState === 'nkWheelFly' || b.nkState === 'nkBikeBuild') {
      const fallY = GROUND;
      ctx.save();
      ctx.translate(W / 2, fallY);
      drawNikitaKid(ctx, t, { x: 0, y: 0, scale: 1.05, face: 1, riding: b.nkState !== 'nkFall', bob: 0 });
      ctx.restore();
      if (b.nkState === 'nkWheelFly' || b.nkState === 'nkBikeBuild') {
        const wheelP = b.nkState === 'nkWheelFly' ? clamp(b.timer / 0.85, 0, 1) : 1;
        const wx = lerp(-80, W / 2 - 50, easeOutCubic(wheelP));
        const wy = lerp(-80, GROUND - 36, easeInCubic(wheelP));
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(t * 8);
        drawBikeVector(ctx, 0, 0, 36, 0, 1);
        ctx.restore();
      }
      if (b.nkState === 'nkBikeBuild') {
        drawBikeVector(ctx, W / 2 - 50, GROUND - 36, 34, t * 3, 1);
        drawBikeVector(ctx, W / 2 + 50, GROUND - 36, 34, t * 3, 1);
      }
      return;
    }

    // езда на велосипеде
    ctx.save();
    ctx.translate(b.x, GROUND);
    // тень уже нарисована в drawStage
    // Весь велосипед с Никитой уменьшен вокруг уровня земли: его голова
    // опускается до высоты, которую берёт обычный прыжок героя.
    ctx.scale(NIKITA_RIDE_SCALE, NIKITA_RIDE_SCALE);
    drawBikeVector(ctx, -50, -36, 34, b.nkRideT * 7.5, 1);
    drawBikeVector(ctx, 50, -36, 34, b.nkRideT * 7.5, 1);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-50, -36);
    ctx.lineTo(-12, -76);
    ctx.lineTo(28, -76);
    ctx.lineTo(50, -36);
    ctx.moveTo(-12, -76);
    ctx.lineTo(14, -36);
    ctx.lineTo(-50, -36);
    ctx.stroke();
    ctx.strokeStyle = '#b23b32';
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.strokeStyle = '#b23b32';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(28, -76);
    ctx.lineTo(36, -112);
    ctx.lineTo(50, -112);
    ctx.stroke();
    drawNikitaKid(ctx, t, {
      x: 0,
      y: -46,
      scale: 1.0,
      face: b.nkRideDir,
      riding: true,
      bob: Math.sin(t * 9) * 1.4,
    });
    // линии скорости
    ctx.strokeStyle = 'rgba(255, 240, 200, 0.22)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-b.nkRideDir * (70 + i * 18), -34 - i * 20);
      ctx.lineTo(-b.nkRideDir * (130 + i * 24), -34 - i * 20);
      ctx.stroke();
    }
    ctx.restore();

    // рука Степы сверху
    if (b.nkBgFistActive) {
      const p = clamp(b.nkBgPunchP, 0, 2);
      const k = p <= 1 ? easeOutCubic(p) : easeInCubic(2 - p);
      const fy = lerp(-80, GROUND - 44, k);
      // На заднем плане появляется сам Степа — видно, чей это кулак.
      const bgStepX = W / 2;
      const bgStepFeet = 352;
      const bgStepScale = 0.62;
      ctx.save();
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = '#0d0b0c';
      ctx.beginPath();
      ctx.ellipse(bgStepX, bgStepFeet + 2, 44, 8, 0, 0, TAU);
      ctx.fill();
      ctx.translate(bgStepX, bgStepFeet);
      drawStepaBoy(ctx, t, {
        face: 1,
        scale: bgStepScale,
        walk: 0,
        battered: true,
        armsUp: true,
        slouch: 0.7,
        bob: 0,
      });
      ctx.restore();
      // Рукав тянется от Степы на заднем плане к кулаку.
      const sx = bgStepX;
      const sy = bgStepFeet - 236 * bgStepScale - 18;
      const ex = b.nkBgPunchX;
      const ey = fy - 18;
      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2 - 34;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.lineCap = 'round';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 44;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(midX, midY, ex, ey);
      ctx.stroke();
      ctx.strokeStyle = '#f3eee0';
      ctx.lineWidth = 31;
      ctx.stroke();
      ctx.translate(ex, fy);
      // манжета
      circle(ctx, 0, -24, 25, '#e2dbc9', INK, 3);
      ctx.fillStyle = SKIN;
      ellipsePath(ctx, 0, 0, 54, 44);
      fillStroke(ctx, SKIN, INK, 4);
      // пальцы, чтобы кулак не читался как палец
      ctx.strokeStyle = 'rgba(120, 70, 50, 0.55)';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 19, 26);
        ctx.quadraticCurveTo(i * 19 + 5, 4, i * 19, -10);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 235, 215, 0.28)';
      ellipsePath(ctx, -28, -16, 13, 9, -0.4);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawStepaBoss() {
    const b = boss;
    const t = game.time;
    if (b.dying) {
      ctx.save();
      ctx.translate(b.x, GROUND);
      if (b.stState === 'stCrash') {
        ctx.rotate(-0.12);
        drawStepaBoy(ctx, t, {
          face: -1,
          scale: 1.0,
          walk: 0,
          battered: true,
          armsUp: true,
          slouch: 0.4,
          bob: 0,
        });
        ctx.restore();
        ctx.save();
        ctx.translate(b.x, GROUND);
        ctx.rotate(0.2);
        roundRect(ctx, -90, -24, 180, 18, 8);
        fillStroke(ctx, '#b94835', INK, 3);
        ctx.restore();
      } else {
        ctx.rotate(0.32);
        drawStepaBoy(ctx, t, {
          face: -1,
          scale: 1.0,
          battered: true,
          slouch: 0.5,
          bob: 0,
        });
        ctx.restore();
      }
      return;
    }

    const riding = b.phase === 2;
    ctx.save();
    ctx.translate(b.x, GROUND);
    if (riding) {
      // скейтборд
      ctx.save();
      ctx.rotate(-0.06 + Math.sin(t * 8) * 0.02);
      roundRect(ctx, -58, 8, 116, 12, 5);
      fillStroke(ctx, '#b94835', INK, 3);
      circle(ctx, -36, 26, 13, '#2b2727', INK, 3);
      circle(ctx, 36, 26, 13, '#2b2727', INK, 3);
      ctx.restore();
      ctx.save();
      ctx.rotate(-0.08);
      drawStepaBoy(ctx, t, {
        face: -1,
        scale: 1.0,
        walk: 0,
        slouch: 0.55,
        hairGlow: 0.5 + Math.sin(t * 14) * 0.2,
        bob: Math.sin(t * 8) * 1.2,
      });
      ctx.restore();
      // линии скорости
      ctx.strokeStyle = 'rgba(255, 245, 210, 0.28)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(30 + i * 18, -40 - i * 24);
        ctx.lineTo(100 + i * 26, -40 - i * 24);
        ctx.stroke();
      }
    } else {
      drawStepaBoy(ctx, t, {
        face: -1,
        scale: 1.06,
        walk: 0,
        slouch: 1.15,
        hairGlow: b.stHairSpark > 0.2 || b.stBoltOn ? 1 : 0,
        bob: Math.sin(t * 2.4) * 1.5,
      });
    }
    ctx.restore();

    // рука в ударе
    if (b.stPunchActive || b.stState === 'stPunchOut' || b.stState === 'stPunchRecover') {
      const reach = 290 * clamp(b.stPunchP, 0, 1);
      ctx.save();
      ctx.translate(b.x, GROUND - 208);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 32;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-24 - reach * 0.7, 14);
      ctx.stroke();
      ctx.strokeStyle = '#f3eee0';
      ctx.lineWidth = 23;
      ctx.stroke();
      ctx.fillStyle = SKIN;
      ellipsePath(ctx, -32 - reach, 20, 26, 21, 0.2);
      fillStroke(ctx, SKIN, INK, 3.5);
      ctx.restore();
    }

    // молния из волос в первой фазе
    if (b.stBoltOn) {
      const line = stepaHairLine();
      drawStepaHairBolt(line.x1, line.y1, line.x2, line.y2, 1);
    }
  }

  // ================= ЕГОР: ЛЕС, ПАЛЬМА И ЧЕТЫРЕ ФАЗЫ =================
  function egorWaitTime() {
    return 2.1 * difficultyConfig().wait;
  }

  function egorToIdle(delay) {
    const b = boss;
    setBossState('idle');
    b.egorBurstLeft = 0;
    b.egorAttackT = delay === undefined ? egorWaitTime() : delay;
  }

  function spawnEgorCloud(x, y, w, opts = {}) {
    const cloud = {
      kind: 'egorCloud',
      x,
      y,
      baseY: y,
      targetY: opts.targetY === undefined ? y : opts.targetY,
      startY: y,
      w,
      h: 26,
      vy: 0,
      life: 9999,
      solid: true,
      landed: true,
      bobPhase: rand(0, TAU),
      bobSpeed: rand(0.85, 1.3),
      bobAmp: opts.bobAmp === undefined ? rand(4, 8) : opts.bobAmp,
      lifting: !!opts.lifting,
      liftT: 0,
      liftDur: opts.liftDur || 2.35,
    };
    platforms.push(cloud);
    return cloud;
  }

  function startEgorPhase2() {
    const b = boss;
    if (b.dying || b.phase >= 2) return;
    b.phase = 2;
    b.enraged = true;
    b.x = W / 2;
    b.egorBurstLeft = 0;
    b.egorAttackT = 1.9;
    b.egorPattern = 0;
    b.egorFinale = false;
    b.egorCloudShotT = 0;
    b.egorCloudShotIndex = 0;
    b.egorCloudTargets = null;
    b.egorArmSide = 1;
    b.egorArmP = 0;
    b.egorArmHit = false;
    b.egorLog = null;
    platforms.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    windCharges.length = 0;
    bossShots.length = 0;
    game.egorClouds = false;
    game.egorCloudFinale = false;
    game.egorChase = false;
    game.egorField = false;

    // Первое облако появляется у героя. На него нужно запрыгнуть,
    // после чего Егор поднимет его к себе.
    const liftSpots = [300, 500, 700, 900, 1090];
    let liftX = liftSpots[0];
    for (const spot of liftSpots) {
      if (Math.abs(hero.x - spot) < Math.abs(hero.x - liftX)) liftX = spot;
    }
    const lift = spawnEgorCloud(liftX, GROUND - 18, 200, { bobAmp: 0, targetY: 520 });
    lift.liftTargetY = 520;
    b.egorCloudLift = lift;

    setBossState('egorCloudBlow');
    game.shake = Math.max(game.shake, 9);
    game.hitStop = 0.05;
    Sound.sfx('roar');
    spawnComic('ЕГОР ДУЕТ!', W / 2, 158, 30, GOLD_BRIGHT);
    spawnComic('ОБЛАКО ПОДХВАТИТ ТЕБЯ!', W / 2, 202, 16, CREAM);
  }

  function beginEgorCloudLift() {
    const b = boss;
    const lift = b.egorCloudLift;
    game.egorClouds = true;
    game.egorCloudFinale = false;
    game.shake = Math.max(game.shake, 13);
    game.flash = 0.22;
    game.flashColor = '#d8f0e4';
    Sound.sfx('stand');
    if (lift) {
      lift.lifting = true;
      lift.liftT = 0;
      lift.liftDur = 2.35;
      lift.startY = lift.y;
      lift.targetY = 520;
      lift.baseY = 520;
      lift.x = W / 2;
      lift.w = 1240;
      // Если герой стоит у облака, он автоматически оказывается на нём.
      if (hero.onGround && Math.abs(hero.x - lift.x) < lift.w / 2 + 24 && hero.y >= lift.y - 8) {
        hero.x = clamp(hero.x, lift.x - lift.w / 2 + 22, lift.x + lift.w / 2 - 22);
        hero.y = lift.y;
        hero.vy = 0;
        hero.onGround = true;
      }
    }

    // Ровно три огромных облака: нижнее, среднее и верхнее.
    // Нижнее — это то самое облако, которое подняло героя.
    const supportClouds = [
      { x: W / 2, y: 385, w: 1240 },
      { x: W / 2, y: 255, w: 1240 },
    ];
    supportClouds.forEach((spec) => {
      const cloud = spawnEgorCloud(spec.x, spec.y, spec.w, { bobAmp: 0 });
      cloud.bobPhase = 0;
      spawnDust(spec.x, spec.y + 12, 6, 0.75);
      spawnRing(spec.x, spec.y, 'rgba(224, 244, 232, 0.34)', 24);
    });
    setBossState('egorCloudLift');
    b.timer = 0;
    spawnComic('ПОЛЕТЕЛИ К ЕГОРУ!', W / 2, 150, 22, GOLD_BRIGHT);
    spawnComic('ТРИ БОЛЬШИХ ОБЛАКА!', W / 2, 190, 14, CREAM);
  }

  function startEgorCloudFinale() {
    const b = boss;
    if (b.dying || b.egorFinale) return;
    b.egorFinale = true;
    b.egorBurstLeft = 0;
    b.egorCloudShotT = 0.25;
    b.egorCloudShotIndex = 0;
    b.egorCloudTargets = platforms.filter((p) => p.kind === 'egorCloud');
    bossShots.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    windCharges.length = 0;
    game.egorCloudFinale = true;
    hero.invuln = Math.max(hero.invuln, 4.2);
    setBossState('egorCloudFinale');
    b.timer = 0;
    game.shake = Math.max(game.shake, 11);
    Sound.sfx('telegraph');
    spawnComic('ЕГОР СТРЕЛЯЕТ ПО ОБЛАКАМ!', W / 2, 148, 25, GOLD_BRIGHT);
    spawnComic('БЕЗ УРОНА — ПРОСТО ПАДАЙ ВНИЗ', W / 2, 190, 13, CREAM);
  }

  function egorCloudFall() {
    const h = hero;
    if (h.dead || game.egorCloudFinale) return;
    h.hp = Math.max(0, h.hp - 5);
    game.hitsTaken++;
    h.invuln = 1.6;
    h.hurtT = 0.38;
    h.vx = 0;
    h.vy = 0;
    game.shake = Math.max(game.shake, 10);
    game.flash = 0.28;
    game.flashColor = '#d94a35';
    Sound.sfx('hurt');
    spawnComic('МИМО ОБЛАКА!', clamp(h.x, 200, 1080), 250, 26, GOLD_BRIGHT);
    for (let i = 0; i < 10; i++) {
      addParticle({
        kind: 'star',
        x: h.x + rand(-18, 18),
        y: h.y - rand(10, 70),
        vx: rand(-220, 220),
        vy: rand(-260, -30),
        life: rand(0.3, 0.7),
        maxLife: 0.7,
        size: rand(3, 8),
        color: pick([RUST, GOLD, CREAM]),
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        grav: 850,
        drag: 0.6,
      });
    }
    if (h.hp <= 0) {
      h.hp = 0;
      h.dead = true;
      h.deadT = 0;
      h.vy = -470;
      h.vx = -240;
      h.hurtT = 1;
      game.endTimer = 1.9;
      game.endingWin = false;
      spawnComic('НОКАУТ…', h.x, h.y - 150, 34, CREAM);
      return;
    }
    const safeClouds = platforms.filter((p) => p.kind === 'egorCloud' && p.solid);
    let safe = null;
    let best = Infinity;
    for (const cloud of safeClouds) {
      const d = Math.abs(cloud.x - h.x);
      if (d < best) {
        best = d;
        safe = cloud;
      }
    }
    if (safe) {
      h.x = safe.x;
      h.y = safe.y;
      h.vy = 0;
      h.vx = 0;
      h.onGround = true;
      spawnRing(safe.x, safe.y, 'rgba(224, 244, 232, 0.72)', 30);
      spawnDust(safe.x, safe.y + 8, 7, 0.8);
    } else {
      h.x = clamp(h.x, ARENA_L + 80, ARENA_R - 80);
      h.y = GROUND - 190;
      h.vy = 0;
      h.vx = 0;
      h.onGround = false;
    }
    spawnComic('НА ОБЛАКО!', h.x, h.y - 105, 22, PINK_BRIGHT);
  }

  function startEgorPhase3() {
    const b = boss;
    if (b.dying || b.phase >= 3) return;
    b.phase = 3;
    b.enraged = true;
    b.x = 1040;
    b.egorBurstLeft = 0;
    b.egorAttackT = 1.8;
    b.egorFruitT = 1.1;
    b.egorPattern = 0;
    b.egorLog = null;
    b.egorCloudLift = null;
    b.egorCloudTargets = null;
    b.egorArmSide = 1;
    b.egorArmP = 0;
    b.egorArmHit = false;
    b.egorFinale = false;
    platforms.length = 0;
    game.egorClouds = false;
    game.egorCloudFinale = false;
    for (const spec of [
      { x: 420, y: GROUND - 176, w: 206 },
      { x: 690, y: GROUND - 292, w: 224 },
      { x: 966, y: GROUND - 190, w: 196 },
    ]) {
      platforms.push({
        kind: 'egorBranch',
        x: spec.x,
        y: spec.y,
        targetY: spec.y,
        w: spec.w,
        h: 24,
        vy: 0,
        life: 9999,
        solid: true,
        landed: true,
      });
    }
    bossShots.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    game.egorChase = true;
    game.egorField = false;
    if (hero.y > GROUND - 20) {
      hero.y = GROUND;
      hero.vy = 0;
      hero.onGround = true;
    }
    setBossState('egorTrip');
    game.shake = Math.max(game.shake, 15);
    game.hitStop = 0.07;
    game.flash = 0.28;
    game.flashColor = '#b7e6a5';
    Sound.sfx('stand');
    spawnComic('ЕГОР СПОТКНУЛСЯ!', W / 2, 176, 28, GOLD_BRIGHT);
    spawnComic('ЛЕСНОЙ ПОБЕГ!', W / 2, 218, 17, CREAM);
  }

  function startEgorPhase4() {
    const b = boss;
    if (b.dying || b.phase >= 4) return;
    b.phase = 4;
    b.enraged = true;
    b.egorBurstLeft = 0;
    b.egorAttackT = 1.5;
    b.egorBullT = 1.8;
    b.egorRainT = 2.6;
    b.egorBirdsT = 3.8;
    b.egorLog = null;
    b.egorCloudLift = null;
    b.egorCloudTargets = null;
    b.egorFinale = false;
    b.x = 1080;
    platforms.length = 0;
    bossShots.length = 0;
    game.egorClouds = false;
    game.egorCloudFinale = false;
    game.egorChase = false;
    game.egorField = true;
    setBossState('egorFieldIntro');
    game.shake = Math.max(game.shake, 18);
    game.hitStop = 0.08;
    game.flash = 0.32;
    game.flashColor = '#ffe6a3';
    Sound.sfx('bell');
    spawnComic('ФИНАЛЬНОЕ ПОЛЕ!', W / 2, 176, 30, GOLD_BRIGHT);
    spawnComic('БЫК, БАНАНЫ И СТАЯ!', W / 2, 218, 16, CREAM);
  }

  function spawnEgorBanana(aimed) {
    const b = boss;
    const fromX = b.x - 38;
    const fromY = b.phase >= 4 ? GROUND - 190 : GROUND - 425;
    let vx = -520;
    let vy = 40;
    if (aimed) {
      const ang = Math.atan2(hero.y - 44 - fromY, hero.x - fromX);
      const speed = (b.phase >= 4 ? 610 : 500) * difficultyConfig().speed;
      vx = Math.cos(ang) * speed;
      vy = Math.sin(ang) * speed;
    }
    bossShots.push({
      kind: 'banana',
      x: fromX,
      y: fromY,
      vx,
      vy,
      r: 15,
      t: 0,
      life: 4.2,
      spin: rand(0, TAU),
      dir: vx >= 0 ? 1 : -1,
    });
    Sound.sfx('shoot');
  }

  function spawnEgorCoconut() {
    bossShots.push({
      kind: 'coconut',
      x: boss.x + rand(-35, 95),
      y: GROUND - 408,
      vx: -rand(34, 82),
      vy: rand(-20, 40),
      r: 19,
      t: 0,
      life: 9,
      spin: rand(0, TAU),
      dir: -1,
    });
  }

  function spawnEgorBranchFromSky() {
    bossShots.push({
      kind: 'branch',
      x: clamp(hero.x + rand(-250, 250), ARENA_L + 40, ARENA_R - 40),
      y: -46,
      vx: rand(-30, 30),
      vy: 160,
      r: 20,
      t: 0,
      life: 4,
      spin: rand(0, TAU),
      dir: 1,
    });
  }

  function spawnEgorRainBanana() {
    bossShots.push({
      kind: 'banana',
      x: rand(ARENA_L + 50, ARENA_R - 50),
      y: -30,
      vx: rand(-45, 45),
      vy: rand(280, 380),
      r: 15,
      t: 0,
      life: 4.5,
      spin: rand(0, TAU),
      dir: 1,
      rain: true,
    });
  }

  function spawnEgorFruit() {
    bossShots.push({
      kind: 'fruit',
      x: clamp(hero.x + rand(-240, 240), ARENA_L + 36, ARENA_R - 36),
      y: -34,
      vx: rand(-40, 40),
      vy: rand(180, 280),
      r: 16,
      t: 0,
      life: 4.5,
      spin: rand(0, TAU),
      dir: 1,
      fruitColor: pick(['#d6503f', '#e0a83e', '#8ab04e']),
    });
  }

  function spawnEgorScream() {
    bossShots.push({
      kind: 'screamRing',
      x: boss.x - 40,
      y: GROUND - 152,
      vx: -540,
      vy: 0,
      r: 44,
      t: 0,
      life: 3,
      spin: 0,
      dir: -1,
      parryable: true,
    });
    Sound.sfx('roar');
    game.shake = Math.max(game.shake, 7);
    spawnComic('КРИК!', boss.x - 70, GROUND - 300, 27, PINK_BRIGHT);
  }

  function spawnEgorBull() {
    bossShots.push({
      kind: 'bull',
      x: W + 80,
      y: GROUND - 58,
      vx: -700,
      vy: 0,
      r: 44,
      t: 0,
      life: 4,
      spin: 0,
      dir: -1,
    });
    spawnComic('БЫК!', W - 170, GROUND - 250, 28, '#ffd36e');
    game.shake = Math.max(game.shake, 6);
    Sound.sfx('slam');
  }

  function spawnEgorBirdFlock() {
    // Птицы вылетают не всей стеной: каждая полоса запускается со своей
    // задержкой, чтобы между ними оставалось окно для манёвра.
    for (let i = 0; i < 5; i++) {
      bossShots.push({
        kind: 'bird',
        x: W + 60 + rand(0, 30),
        y: 205 + i * 43 + rand(-16, 16),
        baseY: 205 + i * 43,
        phase: rand(0, TAU),
        vx: -430 - i * 12,
        vy: 0,
        r: 16,
        t: 0,
        life: 6.5,
        delay: 0.42 * i,
        spin: 0,
        dir: -1,
      });
    }
    spawnComic('СТАЯ ПО ОДНОЙ!', W - 190, 238, 24, CREAM);
  }

  function spawnEgorCloudBirds() {
    // Птицы летят низко над облаками одной линией, чтобы их можно было
    // перепрыгнуть обычным прыжком. Никаких птиц на высоте головы.
    // Птицы летят на каждой высоте облаков, чтобы не было безопасной
    // платформы: и нижняя, и средняя, и верхняя простреливаются.
    const levels = [];
    for (const cloud of platforms) {
      if (cloud.kind !== 'egorCloud' || !cloud.solid) continue;
      if (!levels.some((y) => Math.abs(y - cloud.y) < 16)) levels.push(cloud.y);
    }
    if (!levels.length) levels.push(522);
    levels.sort((a, b) => a - b);
    const spawnOne = (cloudY, index) => {
      const baseY = cloudY - 32 + rand(-3, 3);
      bossShots.push({
        kind: 'bird',
        x: W + 70 + index * 150,
        y: baseY,
        baseY,
        bobAmp: 3,
        phase: rand(0, TAU),
        vx: -(205 + index * 12) * difficultyConfig().speed,
        vy: 0,
        r: 15,
        t: 0,
        life: 6.5,
        spin: 0,
        dir: -1,
      });
    };
    let birdIndex = 0;
    for (const cloudY of levels) {
      spawnOne(cloudY, birdIndex++);
    }
    if (game.difficulty === 'hard') {
      let heroCloud = levels[0];
      for (const cloudY of levels) {
        if (Math.abs(cloudY - hero.y) < Math.abs(heroCloud - hero.y)) heroCloud = cloudY;
      }
      spawnOne(heroCloud + 22, birdIndex++);
    }
    spawnComic('ПЕРЕПРЫГНИ ПТИЦ!', W - 250, 118, 16, GOLD_BRIGHT);
  }

  function spawnEgorCoconutBomb() {
    const b = boss;
    // Кокосы вылетают по очереди из боковых пальм.
    b.egorPalmSide = -(b.egorPalmSide || 1);
    const fromX = b.egorPalmSide < 0 ? 132 : W - 132;
    const fromY = 306;
    const fuse = 1.18;
    const targetX = clamp(hero.x, ARENA_L + 40, ARENA_R - 40);
    const targetY = clamp(hero.y - 46, 190, GROUND - 80);
    const gravity = 620;
    const vx = (targetX - fromX) / fuse;
    const vy = (targetY - fromY) / fuse - 0.5 * gravity * fuse;
    bossShots.push({
      kind: 'coconutBomb',
      x: fromX,
      y: fromY,
      vx,
      vy,
      gravity,
      r: 19,
      fuse,
      t: 0,
      life: 4,
      spin: rand(0, TAU),
      dir: b.egorPalmSide < 0 ? 1 : -1,
      fromPalm: true,
    });
    spawnComic('КОКОС С ПАЛЬМЫ!', fromX, 250, 17, GOLD_BRIGHT);
    Sound.sfx('shoot');
  }

  function explodeEgorCoconut(x, y) {
    spawnRing(x, y, GOLD_BRIGHT, 30);
    spawnRing(x, y, CREAM, 18);
    spawnDust(x, y, 8, 0.85);
    game.shake = Math.max(game.shake, 7);
    Sound.sfx('slam');
    const angles = [0.3, Math.PI / 2, Math.PI - 0.3];
    for (const angle of angles) {
      bossShots.push({
        kind: 'coconutShard',
        x,
        y,
        vx: Math.cos(angle) * 300,
        vy: Math.sin(angle) * 300,
        gravity: 460,
        r: 8,
        t: 0,
        life: 2.6,
        spin: rand(0, TAU),
        dir: 1,
      });
    }
  }

  function startEgorBurst(type, count) {
    boss.egorBurstType = type;
    boss.egorBurstLeft = count;
    boss.egorBurstT = 0;
  }

  function updateEgorBurst(dt) {
    const b = boss;
    if (!b.egorBurstLeft) return;
    b.egorBurstT -= dt;
    if (b.egorBurstT > 0) return;
    if (b.egorBurstType === 'branch') {
      spawnEgorBranchFromSky();
      b.egorBurstT = 0.26;
    } else if (b.egorBurstType === 'rain') {
      spawnEgorRainBanana();
      b.egorBurstT = 0.14;
    } else if (b.egorBurstType === 'fruit') {
      spawnEgorFruit();
      b.egorBurstT = 0.22;
    } else if (b.egorBurstType === 'coconutBomb') {
      spawnEgorCoconutBomb();
      b.egorBurstT = 0.9;
    }
    b.egorBurstLeft--;
  }

  // Рука Егора вылетает из-за края экрана. Хитбокс — только сама рука.
  function egorArmHandX() {
    const b = boss;
    const side = b.egorArmSide || 1;
    const p = clamp(b.egorArmP || 0, 0, 1);
    const startX = side < 0 ? -90 : W + 90;
    const endX = side < 0 ? 800 : W - 800;
    return lerp(startX, endX, easeOutCubic(p));
  }

  function egorArmRect() {
    const b = boss;
    if (game.bossId !== 'egor' || b.phase !== 2) return null;
    if (b.state !== 'egorArmSweep' && b.state !== 'egorArmHold') return null;
    const side = b.egorArmSide || 1;
    const handX = egorArmHandX();
    const y = (b.egorArmY || EGOR_ARM_Y) - 44;
    const h = 88;
    if (side < 0) return { x: -220, y, w: handX + 220, h };
    return { x: handX, y, w: W + 220 - handX, h };
  }

  function beginEgorArmAttack() {
    const b = boss;
    b.egorArmSide = Math.random() < 0.5 ? -1 : 1;
    // Рука идёт на высоте героя: достаёт и нижнее, и среднее, и верхнее облако.
    b.egorArmY = clamp(hero.y - 72, 150, GROUND - 40);
    b.egorArmP = 0.08;
    b.egorArmHit = false;
    setBossState('egorArmWind');
    Sound.sfx('telegraph');
    spawnComic(
      b.egorArmSide < 0 ? 'РУКА СЛЕВА!' : 'РУКА СПРАВА!',
      W / 2,
      152,
      24,
      GOLD_BRIGHT
    );
  }

  function updateEgorBoss(dt) {
    const b = boss;
    b.timer += dt;
    b.breathe += dt;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.hpShown = damp(b.hpShown, b.hp, 9, dt);
    b.egorRunT += dt * (b.phase >= 3 ? 16 : 10);
    b.egorShake = Math.max(0, (b.egorShake || 0) - dt * 4);

    if (b.dying) {
      b.deathT += dt;
      if (!b.exploded && b.deathT > 1.2) {
        b.exploded = true;
        explodeBoss();
      }
      return;
    }
    if (hero.dead) {
      if (b.state !== 'idle') setBossState('idle');
      b.timer = Math.min(b.timer, 0.1);
      return;
    }

    if (b.phase === 1) {
      if (b.state === 'idle') {
        if (game.introT > 0.05) {
          b.timer = Math.min(b.timer, 0.25);
        } else {
          b.egorAttackT -= dt;
          if (b.egorAttackT <= 0) {
            b.egorPattern++;
            if (b.egorPattern % 2 === 1) {
              setBossState('egorBananaWind');
              spawnComic('БАНАН-ПУШКА!', b.x - 150, 150, 19, GOLD_BRIGHT);
            } else {
              setBossState('egorCoconutWind');
              spawnComic('КОКОСЫ С ПАЛЬМЫ!', b.x - 150, 150, 19, GOLD_BRIGHT);
            }
            Sound.sfx('telegraph');
          }
        }
      } else if (b.state === 'egorBananaWind') {
        if (b.timer >= 0.68) {
          setBossState('egorBananaFire');
          b.egorBurstLeft = 3;
          b.egorBurstT = 0;
        }
      } else if (b.state === 'egorBananaFire') {
        b.egorBurstT -= dt;
        if (b.egorBurstLeft > 0 && b.egorBurstT <= 0) {
          spawnEgorBanana(true);
          b.egorBurstT = 0.25;
          b.egorBurstLeft--;
          b.egorShake = 1;
        }
        if (b.egorBurstLeft <= 0 && b.timer > 1.15) egorToIdle();
      } else if (b.state === 'egorCoconutWind') {
        if (b.timer >= 0.62) {
          setBossState('egorCoconutDrop');
          b.egorBurstLeft = 3;
          b.egorBurstT = 0;
          game.shake = Math.max(game.shake, 5);
        }
      } else if (b.state === 'egorCoconutDrop') {
        b.egorBurstT -= dt;
        if (b.egorBurstLeft > 0 && b.egorBurstT <= 0) {
          spawnEgorCoconut();
          b.egorBurstT = 0.42;
          b.egorBurstLeft--;
        }
        if (b.egorBurstLeft <= 0 && b.timer > 1.35) egorToIdle();
      }
    } else if (b.phase === 2) {
      if (b.state === 'egorCloudBlow') {
        // Егор дует, облако держится у ног героя.
        if (b.egorCloudLift) {
          b.egorCloudLift.x = clamp(hero.x, ARENA_L + 100, ARENA_R - 100);
        }
        if (Math.random() < dt * 30) {
          addParticle({
            kind: 'smoke',
            x: b.x - 120 + rand(-40, 40),
            y: 292 + rand(-24, 24),
            vx: -rand(160, 300),
            vy: rand(-45, 45),
            life: rand(0.3, 0.65),
            maxLife: 0.65,
            size: rand(8, 17),
            grow: rand(18, 36),
            color: pick(['#d8f0e4', '#eaf7ec', '#bcdccd']),
            rot: 0,
            vr: 0,
            grav: -18,
            drag: 1.2,
          });
        }
        if (b.timer >= 1.15) beginEgorCloudLift();
      } else if (b.state === 'egorCloudLift') {
        if (b.timer >= (b.egorCloudLift ? b.egorCloudLift.liftDur : 2.35) + 0.05) {
          setBossState('egorCloudFight');
          b.timer = 0;
          b.egorAttackT = 1.6;
          b.egorPattern = 0;
          spawnComic('ДЕРЖИСЬ НА ОБЛАКАХ!', W / 2, 140, 22, GOLD_BRIGHT);
          spawnComic('ПТИЦЫ · КОКОС · РУКА', W / 2, 180, 13, CREAM);
        }
      } else if (b.state === 'egorCloudFight') {
        b.egorAttackT -= dt;
        updateEgorBurst(dt);
        if (b.egorAttackT <= 0) {
          b.egorAttackT = 2.3 * difficultyConfig().wait;
          const type = b.egorPattern++ % 3;
          if (type === 0) {
            spawnEgorCloudBirds();
          } else if (type === 1) {
            startEgorBurst('coconutBomb', 1);
          } else {
            beginEgorArmAttack();
          }
        }
      } else if (b.state === 'egorArmWind') {
        b.egorArmP = 0.08 + Math.sin(b.timer * 22) * 0.014;
        if (b.timer >= 0.9) {
          setBossState('egorArmSweep');
          b.egorArmP = 0.08;
          b.egorArmHit = false;
          game.shake = Math.max(game.shake, 8);
          Sound.sfx('punch');
        }
      } else if (b.state === 'egorArmSweep') {
        const p = clamp(b.timer / 0.38, 0, 1);
        b.egorArmP = lerp(0.08, 1, easeOutCubic(p));
        if (p >= 1) {
          setBossState('egorArmHold');
          b.egorArmP = 1;
        }
      } else if (b.state === 'egorArmHold') {
        b.egorArmP = 1;
        if (b.timer >= 0.14) {
          setBossState('egorArmRecover');
          b.egorArmP = 1;
        }
      } else if (b.state === 'egorArmRecover') {
        const p = clamp(b.timer / 0.42, 0, 1);
        b.egorArmP = lerp(1, 0.08, easeInOutQuad(p));
        if (p >= 1) {
          b.egorArmP = 0;
          setBossState('egorCloudFight');
          b.timer = 0;
          b.egorAttackT = 1.4;
        }
      } else if (b.state === 'egorCloudFinale') {
        b.egorBurstLeft = 0;
        b.egorCloudShotT -= dt;
        const targets = b.egorCloudTargets || [];
        if (b.egorCloudShotT <= 0 && b.egorCloudShotIndex < targets.length) {
          const cloud = targets[b.egorCloudShotIndex];
          if (cloud) {
            bossShots.push({
              kind: 'cloudZap',
              x1: b.x - 18,
              y1: 302,
              x2: cloud.x,
              y2: cloud.y,
              t: 0,
              life: 0.24,
              r: 0,
              harmless: true,
            });
            spawnDust(cloud.x, cloud.y + 6, 9, 1.1);
            spawnPetalBurst(cloud.x, cloud.y, '#eaf7ec', 6);
            cloud.solid = false;
            cloud.life = 0.34;
            b.egorCloudShotIndex++;
            game.shake = Math.max(game.shake, 3.5);
            Sound.sfx('chalk');
          }
          b.egorCloudShotT = 0.34;
        }
        if (b.timer >= 2.85) {
          startEgorPhase3();
        }
      }
    } else if (b.phase === 3) {
      if (b.state === 'egorTrip') {
        if (b.timer >= 1.25) {
          setBossState('egorChase');
          b.egorAttackT = 1.2;
          b.egorFruitT = 0.9;
          spawnComic('БЕГИ ПО ВЕТКАМ!', W / 2, 132, 20, GOLD_BRIGHT);
        }
      } else if (b.state === 'egorChase') {
        b.egorFruitT -= dt;
        if (b.egorFruitT <= 0) {
          spawnEgorFruit();
          b.egorFruitT = 0.52 * difficultyConfig().wait;
        }
        b.egorAttackT -= dt;
        updateEgorBurst(dt);
        if (b.egorAttackT <= 0) {
          b.egorAttackT = 3.4 * difficultyConfig().wait;
          if (b.egorPattern++ % 2 === 0) startEgorBurst('rain', 8);
          else spawnEgorScream();
        }
      }
    } else if (b.phase === 4) {
      if (b.state === 'egorFieldIntro') {
        if (b.timer >= 1.6) {
          setBossState('egorFieldFight');
          b.egorBullT = 1.6;
          b.egorRainT = 2.4;
          b.egorBirdsT = 3.8;
          b.egorAttackT = 1.2;
        }
      } else if (b.state === 'egorFieldFight') {
        b.egorAttackT -= dt;
        b.egorBullT -= dt;
        b.egorRainT -= dt;
        b.egorBirdsT -= dt;
        updateEgorBurst(dt);
        if (b.egorAttackT <= 0) {
          spawnEgorBanana(true);
          spawnEgorBanana(true);
          b.egorAttackT = 1.9 * difficultyConfig().wait;
          b.egorShake = 1;
        }
        if (b.egorBullT <= 0) {
          spawnEgorBull();
          b.egorBullT = 5.4 * difficultyConfig().wait;
        }
        if (b.egorRainT <= 0) {
          startEgorBurst('rain', 9);
          b.egorRainT = 6.2 * difficultyConfig().wait;
        }
        if (b.egorBirdsT <= 0) {
          spawnEgorBirdFlock();
          b.egorBirdsT = 7 * difficultyConfig().wait;
        }
      }
    }

    if (
      b.phase === 2 &&
      game.egorClouds &&
      !game.egorCloudFinale &&
      !hero.dead &&
      !(b.egorCloudLift && b.egorCloudLift.lifting) &&
      hero.y > 546
    ) {
      egorCloudFall();
    }
  }

  function drawEgorForest() {
    const t = game.time;
    const chase = game.egorChase;
    const field = game.egorField;
    const speed = chase ? 150 : 22;
    const sky = ctx.createLinearGradient(0, 0, 0, 600);
    if (field) {
      sky.addColorStop(0, '#2d4f55');
      sky.addColorStop(0.5, '#7d8c62');
      sky.addColorStop(1, '#c9a766');
    } else {
      sky.addColorStop(0, '#16343a');
      sky.addColorStop(0.45, '#4d766b');
      sky.addColorStop(0.78, '#caa15f');
      sky.addColorStop(1, '#e4c887');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = field ? 'rgba(255, 225, 156, 0.92)' : 'rgba(255, 214, 131, 0.84)';
    ctx.beginPath();
    ctx.arc(field ? 990 : 1030, 150, 44, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 230, 165, 0.13)';
    ctx.beginPath();
    ctx.arc(field ? 990 : 1030, 150, 108, 0, TAU);
    ctx.fill();

    for (let i = 0; i < 16; i++) {
      const span = W + 300;
      const x = ((i * 173 + t * speed + seeded(i * 4.7) * 180) % span) - 140;
      const h = 260 + seeded(i * 2.3) * 260;
      ctx.globalAlpha = 0.24 + (i % 3) * 0.05;
      ctx.fillStyle = i % 2 ? '#2e4b3e' : '#3a5c49';
      ctx.beginPath();
      ctx.moveTo(x - 13, GROUND);
      ctx.lineTo(x - 8, GROUND - h);
      ctx.lineTo(x + 7, GROUND - h);
      ctx.lineTo(x + 15, GROUND);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - 34, GROUND - h - 8, 58, 24, -0.2, 0, TAU);
      ctx.ellipse(x + 34, GROUND - h - 14, 64, 26, 0.2, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = 'rgba(28, 56, 40, 0.55)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const x = 90 + i * 190 + Math.sin(t * 0.7 + i) * 20;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 28, 130, x - 24, 260, x + 12, 380);
      ctx.stroke();
      ctx.fillStyle = 'rgba(66, 108, 66, 0.5)';
      ctx.beginPath();
      ctx.ellipse(x + 12, 350, 17, 7, 0.5, 0, TAU);
      ctx.fill();
    }

    if (game.bossId === 'egor' && boss.phase === 2) {
      // Гигантское дерево, на котором сидит Егор.
      const tx = boss.x;
      ctx.save();
      ctx.fillStyle = 'rgba(16, 26, 18, 0.34)';
      ctx.beginPath();
      ctx.ellipse(tx, 552, 178, 26, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx - 54, 560);
      ctx.bezierCurveTo(tx - 30, 500, tx - 72, 450, tx - 38, 380);
      ctx.quadraticCurveTo(tx - 20, 356, tx, 352);
      ctx.quadraticCurveTo(tx + 22, 356, tx + 40, 380);
      ctx.bezierCurveTo(tx + 76, 452, tx + 30, 500, tx + 56, 560);
      ctx.closePath();
      fillStroke(ctx, '#5b3c27', INK, 5);
      ctx.strokeStyle = 'rgba(230, 190, 123, 0.24)';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(tx - 24 + i * 3, 536 - i * 29);
        ctx.quadraticCurveTo(tx + 6, 520 - i * 29, tx + 32 + i * 2, 500 - i * 29);
        ctx.stroke();
      }
      // ветка-сиденье
      ctx.strokeStyle = INK;
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx - 118, 372);
      ctx.quadraticCurveTo(tx - 20, 356, tx + 116, 368);
      ctx.stroke();
      ctx.strokeStyle = '#67452c';
      ctx.lineWidth = 15;
      ctx.stroke();
      // листва
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * 0.94 + (i / 8) * Math.PI * 0.88;
        ctx.save();
        ctx.translate(tx + Math.sin(t * 0.9 + i) * 5, 348);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(54, -34, 112, -20, 148, 10);
        ctx.bezierCurveTo(94, 20, 40, 24, 0, 0);
        ctx.closePath();
        fillStroke(ctx, i % 2 ? '#315c36' : '#3d7140', INK, 3.2);
        ctx.restore();
      }
      // боковые пальмы, из которых вылетают кокосы
      for (const side of [-1, 1]) {
        const px = side < 0 ? 118 : W - 118;
        const sway = Math.sin(t * 1.2 + side) * 8;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(px, GROUND);
        ctx.bezierCurveTo(px - 18, 500, px + 26, 390, px + sway, 300);
        ctx.stroke();
        ctx.strokeStyle = '#7b5430';
        ctx.lineWidth = 13;
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI * 0.92 + (i / 5) * Math.PI * 0.9;
          ctx.save();
          ctx.translate(px + sway, 302);
          ctx.rotate(a + Math.sin(t * 1.5 + i + side) * 0.04);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(38, -26, 86, -16, 112, 8);
          ctx.bezierCurveTo(72, 16, 32, 20, 0, 0);
          ctx.closePath();
          fillStroke(ctx, i % 2 ? '#3f7340' : '#4f8a4b', INK, 2.8);
          ctx.restore();
        }
        for (let i = 0; i < 3; i++) {
          circle(ctx, px + sway + side * (10 + i * 9), 322 + (i % 2) * 13, 8, '#5a3b22', INK, 2);
        }
      }
      ctx.restore();
    }

    if (game.egorClouds) {
      // Пол исчез: под облаками только тёмная бездна.
      const abyss = ctx.createLinearGradient(0, 548, 0, H);
      abyss.addColorStop(0, 'rgba(18, 34, 33, 0.9)');
      abyss.addColorStop(0.5, '#0c1817');
      abyss.addColorStop(1, '#050a0a');
      ctx.fillStyle = abyss;
      ctx.fillRect(0, 548, W, H - 548);
      ctx.fillStyle = 'rgba(166, 209, 190, 0.05)';
      for (let i = 0; i < 9; i++) {
        const x = ((i * 157 + t * 18) % (W + 200)) - 100;
        ctx.beginPath();
        ctx.ellipse(x, 600 + (i % 3) * 34, 90, 20, 0, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(215, 245, 230, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 548);
      ctx.lineTo(W, 548);
      ctx.stroke();
    } else {
      const groundGrad = ctx.createLinearGradient(0, 548, 0, H);
      groundGrad.addColorStop(0, field ? '#7d8a4e' : '#4b5f3c');
      groundGrad.addColorStop(1, field ? '#3d4a2c' : '#2c3927');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 548, W, H - 548);
      ctx.fillStyle = 'rgba(255, 223, 154, 0.09)';
      ctx.fillRect(0, 548, W, 4);
      for (let i = 0; i < 120; i++) {
        const x = seeded(i * 7.1) * W;
        const y = 560 + seeded(i * 3.3) * 150;
        ctx.strokeStyle = i % 3 ? 'rgba(105, 138, 72, 0.4)' : 'rgba(196, 178, 104, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 4, y - 5 - seeded(i) * 8);
        ctx.stroke();
      }

      if (field) {
        ctx.strokeStyle = '#5c442c';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(0, 492);
        ctx.lineTo(W, 486);
        ctx.moveTo(0, 538);
        ctx.lineTo(W, 532);
        ctx.stroke();
        ctx.lineWidth = 11;
        ctx.strokeStyle = '#4b3622';
        for (let x = 26; x < W + 60; x += 96) {
          ctx.beginPath();
          ctx.moveTo(x, 452);
          ctx.lineTo(x + 3, 594);
          ctx.stroke();
          ctx.fillStyle = '#6d512f';
          ctx.beginPath();
          ctx.moveTo(x - 5, 452);
          ctx.lineTo(x + 3, 436);
          ctx.lineTo(x + 11, 452);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255, 230, 168, 0.14)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 487);
        ctx.lineTo(W, 481);
        ctx.stroke();
      }
    }

    if (chase) {
      ctx.strokeStyle = 'rgba(240, 255, 220, 0.16)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 22; i++) {
        const y = 90 + seeded(i * 9.7) * 460;
        const len = 90 + seeded(i * 2.1) * 180;
        const x = W - ((t * (520 + i * 14) + i * 97) % (W + 320));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();
      }
    }
  }

  function drawEgorAtmosphere() {
    const t = game.time;
    for (let i = 0; i < 16; i++) {
      const speed = game.egorChase ? 250 : 38;
      const x = W - ((t * speed + i * 137) % (W + 120));
      const y = 120 + ((t * (28 + i * 3) + i * 91) % 430);
      const a = 0.18 + (i % 4) * 0.05;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.8 + i);
      ctx.fillStyle = i % 3 ? `rgba(214, 190, 105, ${a})` : `rgba(124, 178, 107, ${a})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3.4, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    if (game.egorField) {
      ctx.fillStyle = 'rgba(255, 224, 150, 0.08)';
      ctx.fillRect(0, 400, W, 180);
    }
  }

  function egorFigure(g, mode, t, opts = {}) {
    const run = opts.run || 0;
    const face = opts.face || -1;
    const scale = opts.scale || 1;
    const sit = mode === 'sit';
    const walking = mode === 'run';
    const trip = mode === 'trip';
    const armSwing = walking ? Math.sin(run) * 12 : 0;
    const legSwing = walking ? Math.sin(run) * 0.55 : 0;
    const bob = walking ? Math.abs(Math.cos(run)) * 4 : Math.sin(t * 2.2) * 1.6;
    g.save();
    g.translate(opts.x || 0, opts.y || 0);
    g.scale(face * scale, scale);
    g.rotate(opts.rot || 0);
    if (opts.shake) g.translate(Math.sin(t * 90) * opts.shake, 0);

    // ноги
    if (sit) {
      g.strokeStyle = INK;
      g.lineWidth = 20;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-22, -58);
      g.quadraticCurveTo(-48, -24, -28, 4);
      g.moveTo(22, -58);
      g.quadraticCurveTo(48, -24, 28, 4);
      g.stroke();
      g.strokeStyle = '#32445f';
      g.lineWidth = 13;
      g.beginPath();
      g.moveTo(-22, -58);
      g.quadraticCurveTo(-48, -24, -28, 4);
      g.moveTo(22, -58);
      g.quadraticCurveTo(48, -24, 28, 4);
      g.stroke();
      for (const fx of [-28, 28]) {
        roundRect(g, fx - 13, -3, 30, 12, 5);
        fillStroke(g, '#2a1a16', INK, 2.4);
      }
    } else {
      const legA = trip ? -0.9 : legSwing;
      const legB = trip ? 0.8 : -legSwing;
      for (let i = 0; i < 2; i++) {
        g.save();
        g.translate(i === 0 ? -15 : 15, -76 + bob);
        g.rotate(i === 0 ? legA : legB);
        g.strokeStyle = INK;
        g.lineWidth = 22;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(0, 66);
        g.stroke();
        g.strokeStyle = '#32445f';
        g.lineWidth = 15;
        g.stroke();
        roundRect(g, -11, 60, 27, 13, 5);
        fillStroke(g, '#2a1a16', INK, 2.2);
        g.restore();
      }
    }

    // туловище
    const bodyY = sit ? -78 : -142 + bob;
    roundRect(g, -45, bodyY, 90, sit ? 88 : 104, 26);
    fillStroke(g, '#3f6b3e', INK, 4.2);
    g.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(g, -31, bodyY + 11, 28, 46, 12);
    g.fill();
    roundRect(g, -46, bodyY + (sit ? 64 : 78), 92, 14, 5);
    fillStroke(g, '#2f3028', INK, 2.4);
    g.fillStyle = GOLD;
    g.fillRect(-8, bodyY + (sit ? 67 : 81), 16, 8);

    // голова
    const headY = sit ? -138 : -204 + bob;
    circle(g, 0, headY, 33, '#171313', INK, 4.4);
    for (const side of [-1, 1]) {
      ellipsePath(g, side * 31, headY + 2, 7, 11);
      fillStroke(g, '#171313', INK, 2.2);
    }
    g.beginPath();
    g.moveTo(-34, headY - 15);
    g.quadraticCurveTo(-18, headY - 52, 22, headY - 34);
    g.quadraticCurveTo(40, headY - 23, 28, headY - 8);
    g.quadraticCurveTo(4, headY - 23, -18, headY - 14);
    g.closePath();
    fillStroke(g, '#3a2418', INK, 3);
    g.fillStyle = CREAM;
    ellipsePath(g, -11, headY + 2, 8, 5.4);
    g.fill();
    ellipsePath(g, 12, headY + 1, 8, 5.4);
    g.fill();
    g.fillStyle = INK;
    g.beginPath();
    g.arc(-10, headY + 2, 2.6, 0, TAU);
    g.arc(13, headY + 1, 2.6, 0, TAU);
    g.fill();
    g.strokeStyle = '#2c1a12';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-19, headY - 8);
    g.lineTo(-4, headY - 5);
    g.moveTo(5, headY - 5);
    g.lineTo(20, headY - 8);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = 2.2;
    g.beginPath();
    if (trip || walking) g.arc(2, headY + 14, 7, 0.1, Math.PI - 0.1);
    else {
      g.moveTo(-6, headY + 15);
      g.quadraticCurveTo(2, headY + 19, 9, headY + 14);
    }
    g.stroke();
    ellipsePath(g, 4, headY + 8, 4.4, 3.4);
    fillStroke(g, '#3a2f2b', INK, 1.6);

    const shoulderY = sit ? bodyY + 14 : -196 + bob;
    g.strokeStyle = INK;
    g.lineWidth = 19;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-34, shoulderY);
    g.quadraticCurveTo(-54, shoulderY + 42, -48 + armSwing, shoulderY + 68);
    g.stroke();
    g.strokeStyle = '#3f6b3e';
    g.lineWidth = 12;
    g.stroke();

    // рука с бананом
    g.save();
    g.translate(34, shoulderY);
    g.rotate((opts.aimUp ? -0.55 : 0.08) + (opts.recoil || 0));
    g.strokeStyle = INK;
    g.lineWidth = 21;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(18, 20, 46, 18);
    g.stroke();
    g.strokeStyle = '#3f6b3e';
    g.lineWidth = 14;
    g.stroke();
    circle(g, 51, 18, 10, '#171313', INK, 2.6);
    if (opts.banana === false) {
      // сжатый кулак вместо банана (вторая фаза)
      g.strokeStyle = 'rgba(120, 64, 42, 0.55)';
      g.lineWidth = 2.2;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(53, 11 + i * 7, 6, -1.2, 1.2);
        g.stroke();
      }
    } else {
      g.save();
      g.translate(58, 21);
      g.rotate(-0.14);
      g.beginPath();
      g.moveTo(0, -9);
      g.bezierCurveTo(28, -20, 60, -12, 66, 2);
      g.bezierCurveTo(54, 6, 28, 2, 0, 9);
      g.closePath();
      fillStroke(g, '#f2cf58', INK, 2.8);
      g.strokeStyle = 'rgba(126, 88, 27, 0.55)';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(10, -3);
      g.quadraticCurveTo(34, -10, 56, -3);
      g.stroke();
      g.restore();
    }
    g.restore();

    // шляпа из листьев
    if (opts.hat !== false && !trip) {
      g.save();
      g.translate(2, headY - 27);
      g.rotate(-0.08);
      g.beginPath();
      g.ellipse(-8, 0, 34, 8, 0.08, 0, TAU);
      fillStroke(g, '#4e7b42', INK, 2.6);
      g.beginPath();
      g.ellipse(8, 0, 27, 7, -0.1, 0, TAU);
      fillStroke(g, '#62984e', INK, 2.2);
      g.restore();
    }
    g.restore();
  }

  function drawEgor() {
    const b = boss;
    const t = game.time;
    if (b.phase === 1) {
      const sway = Math.sin(t * 1.1) * 4;
      const baseX = b.x + 42;
      ctx.fillStyle = 'rgba(20, 14, 10, 0.3)';
      ctx.beginPath();
      ctx.ellipse(baseX, GROUND + 2, 120, 16, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(baseX - 24, GROUND);
      ctx.bezierCurveTo(baseX - 10, 500, baseX + 48, 340, baseX + 18 + sway, 226);
      ctx.lineTo(baseX + 50 + sway, 226);
      ctx.bezierCurveTo(baseX + 78, 348, baseX + 32, 500, baseX + 26, GROUND);
      ctx.closePath();
      fillStroke(ctx, '#6e4a2c', INK, 5);
      ctx.strokeStyle = 'rgba(227, 187, 120, 0.36)';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(baseX - 8 + i * 3, 566 - i * 44);
        ctx.quadraticCurveTo(baseX + 22, 548 - i * 44, baseX + 42 + i * 2, 520 - i * 44);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(baseX + 30 + sway, 226);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.96 + (i / 6) * Math.PI * 0.94;
        ctx.save();
        ctx.rotate(a + Math.sin(t * 1.4 + i) * 0.035);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(46, -34, 96, -20, 128, 10);
        ctx.bezierCurveTo(82, 18, 38, 22, 0, 0);
        ctx.closePath();
        fillStroke(ctx, i % 2 ? '#3f7340' : '#4f8a4b', INK, 3);
        ctx.restore();
      }
      ctx.restore();
      for (let i = 0; i < 3; i++) {
        circle(ctx, baseX + 18 + i * 15, 254 + (i % 2) * 12, 9, '#5a3b22', INK, 2.2);
      }
      ctx.save();
      ctx.translate(baseX + 8 + sway * 0.4, 304);
      egorFigure(ctx, 'sit', t, {
        scale: 0.98,
        shake: b.hitFlash > 0 ? 1 : 0,
        recoil: b.state === 'egorBananaFire' ? -0.18 : 0,
      });
      ctx.restore();
      if (b.state === 'egorBananaFire' && b.egorBurstT > 0.1) {
        ctx.save();
        ctx.translate(baseX + 72, 310);
        ctx.fillStyle = GOLD_BRIGHT;
        starPath(ctx, 0, 0, 5, 12, 6, t * 8);
        ctx.fill();
        ctx.restore();
      }
    } else if (b.phase === 2) {
      // Егор сидит на ветке дерева. Руки опущены, поэтому голова
      // больше не тонет в огромном кулаке, как в старой постановке.
      const headX = b.x;
      const look = hero.x < headX ? -1 : 1;
      const sway = Math.sin(t * 1.25) * 3.5;
      ctx.save();
      egorFigure(ctx, 'sit', t, {
        scale: 1.26,
        x: headX + sway,
        y: 371,
        face: look,
        banana: false,
        shake: b.hitFlash > 0 ? 1.1 : 0,
        recoil: b.egorShake > 0.2 ? -0.1 : 0,
      });
      ctx.restore();
      // дымка между Егором и облаками
      const haze = ctx.createLinearGradient(0, 250, 0, 480);
      haze.addColorStop(0, 'rgba(36, 64, 54, 0)');
      haze.addColorStop(0.5, 'rgba(36, 64, 54, 0.3)');
      haze.addColorStop(1, 'rgba(17, 34, 30, 0.72)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 250, W, 230);

      if (b.state === 'egorCloudBlow') {
        ctx.save();
        ctx.strokeStyle = 'rgba(216, 240, 228, 0.7)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const y = 252 + i * 10;
          const wave = Math.sin(t * 12 + i) * 10;
          ctx.beginPath();
          ctx.moveTo(headX + look * 38, y);
          ctx.quadraticCurveTo(headX + look * 150, y + 28 + wave, headX + look * 280, 336 + i * 12 + wave);
          ctx.stroke();
        }
        ctx.restore();
      }
    } else if (b.phase === 3) {
      const topY = 286;
      const runX = 1040 + Math.sin(t * 1.2) * 66;
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(runX - 240, topY + 10);
      ctx.quadraticCurveTo(runX - 40, topY + 30, runX + 230, topY + 4);
      ctx.stroke();
      ctx.strokeStyle = '#6a4a2d';
      ctx.lineWidth = 12;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(runX, topY);
      if (b.state === 'egorTrip') {
        ctx.translate(0, 4);
        ctx.rotate(-1.32);
        egorFigure(ctx, 'stand', t, { scale: 0.9, shake: 2 });
      } else {
        egorFigure(ctx, 'run', t, {
          scale: 0.98,
          run: b.egorRunT,
          shake: b.hitFlash > 0 ? 1 : 0,
          aimUp: true,
          recoil: b.egorShake > 0.2 ? -0.2 : 0,
        });
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(239, 247, 209, 0.28)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(runX + 52 + i * 24, 196 + i * 20);
        ctx.lineTo(runX + 112 + i * 24, 196 + i * 20);
        ctx.stroke();
      }
    } else {
      const px = b.x;
      drawShadow(px, GROUND, 84, 0, 0.3);
      ctx.save();
      ctx.translate(px, GROUND);
      egorFigure(ctx, 'stand', t, {
        scale: 1.28,
        shake: b.hitFlash > 0 ? 1.4 : 0,
        recoil: b.egorShake > 0.2 ? -0.22 : 0,
      });
      ctx.restore();
      if (b.egorShake > 0.3) {
        ctx.save();
        ctx.translate(px - 108, GROUND - 150);
        ctx.fillStyle = GOLD_BRIGHT;
        starPath(ctx, 0, 0, 5, 14, 7, t * 10);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawEgorArm() {
    const b = boss;
    const active =
      b.state === 'egorArmWind' ||
      b.state === 'egorArmSweep' ||
      b.state === 'egorArmHold' ||
      b.state === 'egorArmRecover';
    if (!active) return;
    const side = b.egorArmSide || 1;
    const dir = side < 0 ? 1 : -1;
    let handX = egorArmHandX();
    const y = b.egorArmY || EGOR_ARM_Y;
    if (b.state === 'egorArmWind') handX += Math.sin(game.time * 46) * 5;
    const baseX = side < 0 ? -320 : W + 320;
    ctx.save();

    // рукав от края экрана
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, y);
    ctx.lineTo(handX, y);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 90;
    ctx.stroke();
    ctx.strokeStyle = '#3f6b3e';
    ctx.lineWidth = 72;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 16;
    ctx.stroke();

    // манжета
    ctx.save();
    ctx.translate(handX - dir * 62, y);
    roundRect(ctx, -22, -43, 44, 86, 16);
    fillStroke(ctx, '#2f3028', INK, 4.4);
    ctx.fillStyle = GOLD;
    roundRect(ctx, -7, -36, 14, 72, 6);
    ctx.fill();
    ctx.restore();

    // кулак
    ctx.save();
    ctx.translate(handX, y);
    ctx.scale(dir, 1);
    roundRect(ctx, -58, -30, 42, 60, 18);
    fillStroke(ctx, '#171313', INK, 4.4);
    ellipsePath(ctx, 10, 0, 53, 47);
    fillStroke(ctx, '#171313', INK, 5);
    // костяшки
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(30 - i * 2, -22 + i * 22, 13, -1.2, 1.2);
      ctx.stroke();
    }
    // большой палец
    ellipsePath(ctx, -10, 30, 22, 16, 0.42);
    fillStroke(ctx, '#171313', INK, 4);
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(4, -10, 30, Math.PI * 1.12, Math.PI * 1.45);
    ctx.stroke();
    ctx.restore();

    // линии скорости при ударе
    if (b.state === 'egorArmSweep') {
      ctx.strokeStyle = 'rgba(255, 226, 158, 0.55)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const ly = y - 54 + i * 36;
        ctx.beginPath();
        ctx.moveTo(handX - dir * (130 + i * 28), ly);
        ctx.lineTo(handX - dir * (70 + i * 18), ly);
        ctx.stroke();
      }
    }

    // предупреждение у края
    if (b.state === 'egorArmWind') {
      const pulse = 0.5 + Math.sin(game.time * 15) * 0.5;
      ctx.fillStyle = `rgba(255, 214, 122, ${0.4 + pulse * 0.5})`;
      const ax = side < 0 ? 34 : W - 34;
      for (let i = 0; i < 3; i++) {
        const bx = ax + dir * (18 + i * 24);
        ctx.beginPath();
        ctx.moveTo(bx, y - 72);
        ctx.lineTo(bx + dir * 22, y - 48);
        ctx.lineTo(bx, y - 24);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawEgorWarnings() {
    const b = boss;
    if (b.dying || b.exploded) return;
    const t = game.time;
    let text = '';
    let sub = '';
    if (b.state === 'egorArmWind') {
      text = b.egorArmSide < 0 ? 'РУКА ЕГОРА СЛЕВА!' : 'РУКА ЕГОРА СПРАВА!';
      sub = 'ОТБЕГИ ОТ КРАЯ ЭКРАНА · ПЕРЕПРЫГНИ РУКУ';
    } else if (b.state === 'egorArmSweep') {
      text = 'РУКА ИДЁТ ЧЕРЕЗ АРЕНУ!';
      sub = 'ПРЫГАЙ ЧЕРЕЗ РУКУ ИЛИ ОТБЕГИ';
    } else if (b.state === 'egorArmHold') {
      text = 'КУЛАК ЗАВИС!';
      sub = 'ПЕРЕЖДИ И ЦЕЛЬСЯ В ГОЛОВУ ЕГОРА';
    } else if (b.state === 'egorCloudBlow') {
      text = 'ЕГОР ДУЕТ НА ОБЛАКО!';
      sub = 'ОБЛАКО ПОДХВАТИТ ТЕБЯ И ПОДНИМЕТ К ЕГОРУ';
    } else if (b.state === 'egorCloudLift') {
      text = 'ОБЛАКО ПОДНИМАЕТ ТЕБЯ!';
      sub = 'ДВА РЯДА ОБЛАКОВ · ПРЫГАЙ ВЫШЕ';
    } else if (b.state === 'egorCloudFight') {
      text = 'ДЕРЖИСЬ НА ОБЛАКАХ!';
      sub = 'ПРИСЕД — СПУСК ВНИЗ · ПТИЦЫ · РУКА';
    } else if (b.state === 'egorCloudFinale') {
      text = 'ЕГОР СТРЕЛЯЕТ ПО ОБЛАКАМ!';
      sub = 'БЕЗ УРОНА · ПАДАЙ ВНИЗ К ТРЕТЬЕЙ ФАЗЕ';
    } else if (b.state === 'egorTrip') {
      text = 'ЕГОР СПОТКНУЛСЯ!';
      sub = 'ЛЕСНОЙ ПОБЕГ · ВЕТКИ И ПАДАЮЩИЕ ФРУКТЫ';
    } else if (b.state === 'egorFieldIntro') {
      text = 'ФИНАЛЬНОЕ ПОЛЕ!';
      sub = 'БЫК · БАНАНЫ · СТАЯ ПТИЦ';
    } else if (b.phase === 1) {
      text = 'ЕГОР НА ПАЛЬМЕ СВЕРХУ!';
      sub = 'ЦЕЛЬСЯ ВВЕРХ: ↑ + D / A ИЛИ ДЖОЙСТИК';
    } else if (b.phase === 2) {
      text = 'ЕГОР — ГИГАНТ ЗА ОБЛАКАМИ!';
      sub = 'ЦЕЛЬСЯ ВВЕРХ В ЕГО ГОЛОВУ · БЕРЕГИСЬ РУК';
    } else if (b.phase === 3) {
      text = 'ЛЕСНОЙ ПОБЕГ!';
      sub = 'ПРЫГАЙ ПО ВЕТКАМ · БЕРЕГИСЬ ФРУКТОВ';
    }
    if (!text) return;
    ctx.save();
    ctx.globalAlpha = 0.82 + Math.sin(t * 4) * 0.18;
    ctx.translate(W / 2, 126);
    roundRect(ctx, -252, -26, 504, 54, 12);
    fillStroke(ctx, 'rgba(22, 14, 12, 0.82)', 'rgba(240, 200, 119, 0.67)', 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = CREAM;
    ctx.font = `900 20px ${FONT_DISPLAY}`;
    ctx.fillText(text, 0, -6);
    ctx.fillStyle = 'rgba(255, 232, 166, 0.8)';
    ctx.font = `700 8px Verdana, sans-serif`;
    ctx.fillText(sub, 0, 15);
    ctx.restore();
  }

  function drawEgorLog(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(20, 12, 8, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, p.h / 2 + 8, p.w * 0.5, 12, 0, 0, TAU);
    ctx.fill();
    const spin = boss.egorLog ? boss.egorLog.roll || 0 : 0;
    roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.h / 2);
    fillStroke(ctx, '#6b4729', INK, 4);
    ctx.beginPath();
    ctx.arc(p.w / 2 - p.h / 2, 0, p.h / 2 - 3, 0, TAU);
    fillStroke(ctx, '#9a6c3d', INK, 3);
    ctx.beginPath();
    ctx.arc(p.w / 2 - p.h / 2, 0, p.h / 2 - 10, 0, TAU);
    ctx.strokeStyle = 'rgba(70, 38, 18, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(47, 27, 14, 0.62)';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 7; i++) {
      const x = -p.w / 2 + 24 + i * (p.w - 58) / 7;
      ctx.beginPath();
      ctx.moveTo(x, -p.h / 2 + 5);
      ctx.quadraticCurveTo(x + Math.sin(spin * 0.2 + i) * 6, 0, x - 4, p.h / 2 - 5);
      ctx.stroke();
    }
    ctx.fillStyle = '#4d7a3f';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(-p.w * 0.28 + i * 92, -p.h / 2 - 5, 22, 9, -0.3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEgorBranchPlatform(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-p.w / 2, 0);
    ctx.quadraticCurveTo(0, -10, p.w / 2, 2);
    ctx.stroke();
    ctx.strokeStyle = '#78502f';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = '#4f803f';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-p.w * 0.34 + i * p.w * 0.32, -9, 20, 7, -0.25 + i * 0.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEgorShot(s) {
    const t = game.time;
    if (s.kind === 'banana') {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.spin);
      ctx.beginPath();
      ctx.moveTo(-16, -5);
      ctx.bezierCurveTo(-4, -17, 13, -11, 20, 4);
      ctx.bezierCurveTo(6, 10, -9, 9, -16, -5);
      ctx.closePath();
      fillStroke(ctx, '#f2cf58', INK, 2.6);
      ctx.strokeStyle = 'rgba(120, 84, 25, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-11, -3);
      ctx.quadraticCurveTo(2, -9, 14, 2);
      ctx.stroke();
      ctx.fillStyle = '#4e3a20';
      ctx.fillRect(-19, -3, 4, 7);
      ctx.restore();
      return;
    }
    if (s.kind === 'coconut') {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.spin);
      circle(ctx, 0, 0, s.r, '#5a3b22', INK, 3.2);
      ctx.fillStyle = 'rgba(255, 224, 176, 0.18)';
      ctx.beginPath();
      ctx.ellipse(-6, -7, 7, 4, -0.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#342113';
      for (const p of [[-5, -4], [6, -2], [1, 6]]) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 2.2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    if (s.kind === 'coconutBomb') {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.spin + s.t * 5);
      circle(ctx, 0, 0, s.r, '#5a3b22', INK, 3.4);
      ctx.fillStyle = 'rgba(255, 224, 176, 0.2)';
      ctx.beginPath();
      ctx.ellipse(-6, -7, 8, 4, -0.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#342113';
      for (const p of [[-5, -4], [6, -2], [1, 6]]) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 2.3, 0, TAU);
        ctx.fill();
      }
      // горящий фитиль
      ctx.strokeStyle = '#3b2a1d';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, -s.r + 2);
      ctx.quadraticCurveTo(7, -s.r - 8, 12, -s.r - 13);
      ctx.stroke();
      const spark = 3 + Math.sin(t * 24) * 1.4;
      ctx.fillStyle = '#ffd36e';
      ctx.beginPath();
      ctx.arc(12, -s.r - 14, spark, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (s.kind === 'coconutShard') {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.spin + s.t * 9);
      ctx.beginPath();
      ctx.moveTo(-10, -7);
      ctx.lineTo(11, -4);
      ctx.lineTo(7, 9);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      fillStroke(ctx, '#7a5230', INK, 2.4);
      ctx.strokeStyle = 'rgba(45, 27, 14, 0.6)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(5, 4);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (s.kind === 'cloudZap') {
      ctx.save();
      ctx.globalAlpha = clamp(s.life / 0.24, 0, 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255, 210, 110, 0.85)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 250, 226, 0.95)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (s.kind === 'branch') {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.spin);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-34, 8);
      ctx.quadraticCurveTo(0, -8, 34, 0);
      ctx.stroke();
      ctx.strokeStyle = '#74502f';
      ctx.lineWidth = 9;
      ctx.stroke();
      ctx.fillStyle = '#4f803f';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * 21, -6, 13, 6, side * 0.3, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    if (s.kind === 'fruit') {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.spin);
      circle(ctx, 0, 0, s.r, s.fruitColor || '#d6503f', INK, 2.8);
      ctx.strokeStyle = '#3f6b3e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -s.r + 2);
      ctx.quadraticCurveTo(7, -s.r - 9, 13, -s.r - 6);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (s.kind === 'screamRing') {
      ctx.save();
      ctx.translate(s.x, s.y);
      const wobble = 1 + Math.sin(t * 15) * 0.06;
      ctx.scale(wobble, wobble);
      const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 70);
      glow.addColorStop(0, 'rgba(255, 146, 193, 0.45)');
      glow.addColorStop(1, 'rgba(255, 110, 170, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = PINK;
      ctx.lineWidth = 9;
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.72 - i * 0.19;
        ctx.beginPath();
        ctx.arc(0, 0, s.r - i * 10, -1.1, 1.1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = PINK_BRIGHT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, s.r, -1.05, 1.05);
      ctx.stroke();
      ctx.font = `900 11px ${FONT_DISPLAY}`;
      ctx.fillStyle = PINK_BRIGHT;
      ctx.textAlign = 'center';
      ctx.fillText('А-А-А!', 0, -s.r - 8);
      ctx.restore();
      return;
    }
    if (s.kind === 'bull') {
      ctx.save();
      ctx.translate(s.x, s.y);
      const charge = Math.sin(s.t * 28) * 2;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const lx = -32 + i * 20;
        ctx.beginPath();
        ctx.moveTo(lx, 20);
        ctx.lineTo(lx + (i % 2 ? 8 : -8), 48 + charge * (i % 2 ? 1 : -1));
        ctx.stroke();
      }
      roundRect(ctx, -58, -26, 116, 58, 26);
      fillStroke(ctx, '#4b3a34', INK, 4);
      circle(ctx, -67, -8, 30, '#57433b', INK, 4);
      ctx.fillStyle = CREAM;
      ctx.beginPath();
      ctx.moveTo(-84, -34);
      ctx.lineTo(-96, -54);
      ctx.lineTo(-72, -39);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-78, -9, 3.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = RUST;
      ctx.beginPath();
      ctx.arc(-55, 4, 4.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 212, 118, 0.6)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-108 - i * 12, -22 + i * 15);
        ctx.lineTo(-88 - i * 12, -22 + i * 15);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (s.kind === 'bird') {
      ctx.save();
      ctx.translate(s.x, s.y);
      const flap = Math.sin(t * 16 + s.phase) * 12;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.quadraticCurveTo(-10, -12 - flap, 0, 0);
      ctx.quadraticCurveTo(10, -12 + flap, 20, 0);
      ctx.stroke();
      ctx.strokeStyle = '#43433a';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.fillStyle = '#b85a3a';
      ctx.beginPath();
      ctx.ellipse(0, 2, 7, 5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawForestEntrance() {
    const x = 1186;
    const t = game.time;
    const near = mapState.near && mapState.near.id === 'egor';
    ctx.save();
    // тень дерева
    ctx.fillStyle = 'rgba(26, 18, 13, 0.32)';
    ctx.beginPath();
    ctx.ellipse(x - 12, 598, 94, 15, 0, 0, TAU);
    ctx.fill();
    // ствол
    ctx.beginPath();
    ctx.moveTo(x - 42, 596);
    ctx.bezierCurveTo(x - 32, 478, x - 50, 364, x - 26, 248);
    ctx.lineTo(x + 24, 248);
    ctx.bezierCurveTo(x + 4, 374, x + 32, 482, x + 42, 596);
    ctx.closePath();
    fillStroke(ctx, '#4a3524', INK, 5);
    ctx.strokeStyle = 'rgba(158, 112, 62, 0.45)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 28 + i * 4, 552 - i * 40);
      ctx.bezierCurveTo(x - 18, 532 - i * 40, x - 8, 514 - i * 40, x - 2, 498 - i * 40);
      ctx.stroke();
    }
    // дупло-вход
    ctx.save();
    ctx.fillStyle = near ? '#3a1d14' : '#231a12';
    ctx.beginPath();
    ctx.ellipse(x, 550, 30, 42, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = near ? GOLD_BRIGHT : 'rgba(240, 200, 119, 0.32)';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (near) {
      const glow = ctx.createRadialGradient(x, 544, 4, x, 544, 56);
      glow.addColorStop(0, 'rgba(255, 220, 139, 0.55)');
      glow.addColorStop(1, 'rgba(255, 220, 139, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, 544, 56, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // крона — растёт вверх и вправо, не залезая на магазин
    const crowns = [
      [-24, 228, 62],
      [34, 202, 76],
      [4, 150, 58],
      [96, 246, 50],
      [134, 300, 38],
      [62, 282, 44],
    ];
    for (let i = 0; i < crowns.length; i++) {
      const c = crowns[i];
      ctx.fillStyle = ['#2f5c3d', '#3b6d45', '#295039', '#44784d', '#315f40', '#3a6a45'][i];
      ctx.beginPath();
      ctx.ellipse(x + c[0], c[1] + Math.sin(t * 0.8 + i) * 3, c[2], c[2] * 0.66, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 36, 25, 0.55)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // светлячки у тропы
    for (let i = 0; i < 8; i++) {
      const px = x - 74 + Math.sin(t * 0.9 + i * 1.7) * 46;
      const py = 430 + Math.cos(t * 0.7 + i) * 86;
      ctx.fillStyle = `rgba(255, 232, 143, ${0.35 + Math.sin(t * 3 + i) * 0.25})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, TAU);
      ctx.fill();
    }
    // табличка на стволе
    ctx.save();
    ctx.translate(x + 6, 494);
    ctx.rotate(-0.04);
    roundRect(ctx, -56, -18, 112, 34, 4);
    fillStroke(ctx, '#7d5230', INK, 3);
    ctx.fillStyle = CREAM;
    ctx.font = `900 10px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ЛЕС ЕГОРА', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  function drawMapPrompt() {
    const b = mapState.near;
    if (!b) return;
    const forest = b.kind === 'forest';
    const x = forest ? clamp(hero.x, 220, W - 160) : clamp(hero.x, 230, 980);
    const y = forest ? 178 : 430;
    const label = b.kind === 'school'
      ? 'ВОЙТИ В ШКОЛУ'
      : b.kind === 'circus'
        ? 'ВОЙТИ В ЦИРК'
        : b.kind === 'forest'
          ? 'ВОЙТИ В ЛЕС К ЕГОРУ'
          : 'ОТКРЫТЬ МАГАЗИН';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(game.time * 1.7) * 0.006);
    roundRect(ctx, -160, -42, 320, 84, 12);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.9)', 'rgba(240, 200, 119, 0.82)', 2.2);
    ctx.fillStyle = CREAM;
    ctx.font = `900 19px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, -13);
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.font = `700 9px Verdana, sans-serif`;
    ctx.fillText(IS_TOUCH ? 'НАЖМИ НА ДЕРЕВО' : 'ПРОБЕЛ / ENTER', 0, 8);
    ctx.fillStyle = 'rgba(244, 227, 189, 0.62)';
    ctx.font = `500 8px Verdana, sans-serif`;
    ctx.fillText(
      b.kind === 'shop'
        ? 'Дымовая завеса · Автонаводка'
        : forest
          ? 'СРАЗУ 2 ФАЗА · ДЕРЕВО · ПАЛЬМЫ'
          : b.sub,
      0,
      25
    );
    // указатель вниз
    ctx.fillStyle = 'rgba(24, 12, 16, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-9, 42);
    ctx.lineTo(9, 42);
    ctx.lineTo(0, 54);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawMapHUD() {
    // заголовок
    ctx.save();
    roundRect(ctx, 366, 18, 548, 64, 10);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.74)', 'rgba(211, 160, 74, 0.56)', 1.6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = CREAM;
    ctx.font = `900 30px ${FONT_DISPLAY}`;
    ctx.fillText('ОСТРОВ ЛЕТУНОВА', W / 2, 43);
    ctx.fillStyle = 'rgba(240, 200, 119, 0.82)';
    ctx.font = `700 8px Verdana, sans-serif`;
    ctx.fillText('ВЫБЕРИ, КУДА ПОЙТИ: ЦИРК · ШКОЛА · МАГАЗИН · ЛЕС', W / 2, 64);

    // монеты и прогресс
    roundRect(ctx, 1004, 18, 252, 64, 10);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.74)', 'rgba(211, 160, 74, 0.46)', 1.3);
    circle(ctx, 1028, 41, 12, GOLD, INK, 2);
    circle(ctx, 1028, 41, 7, 'rgba(255, 245, 205, 0.35)', null, 0);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.font = `900 20px ${FONT_DISPLAY}`;
    ctx.fillText(String(progress.coins), 1046, 42);
    ctx.font = `700 8px Verdana, sans-serif`;
    ctx.fillStyle = 'rgba(244, 227, 189, 0.66)';
    ctx.fillText('МОНЕТЫ', 1080, 41);
    ctx.fillStyle = RED;
    ctx.font = `900 18px ${FONT_DISPLAY}`;
    ctx.fillText('♥', 1156, 42);
    ctx.fillStyle = CREAM;
    ctx.font = `700 9px Verdana, sans-serif`;
    ctx.fillText(String(BASE_HEARTS + progress.bonusHearts), 1174, 42);
    ctx.fillStyle = progress.smokeDash ? 'rgba(160, 218, 203, 0.9)' : 'rgba(244, 227, 189, 0.38)';
    ctx.font = `600 8px Verdana, sans-serif`;
    ctx.fillText(progress.smokeDash ? '☁ ДЫМ ЕСТЬ' : '☁ ДЫМА НЕТ', 1028, 67);

    // подсказка внизу
    roundRect(ctx, 314, 668, 652, 34, 10);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.7)', 'rgba(211, 160, 74, 0.28)', 1.1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(244, 227, 189, 0.72)';
    ctx.font = `600 9px Verdana, sans-serif`;
    ctx.fillText(
      IS_TOUCH ? 'Нажми на здание · ESC — меню' : 'A / D — идти · ПРОБЕЛ или ENTER — войти · ESC — меню',
      W / 2,
      685
    );

    if (mapState.toastT > 0) {
      const a = clamp(mapState.toastT / 0.4, 0, 1);
      ctx.globalAlpha = a;
      roundRect(ctx, W / 2 - 240, 538, 480, 40, 10);
      fillStroke(ctx, 'rgba(24, 12, 16, 0.9)', 'rgba(211, 160, 74, 0.55)', 1.4);
      ctx.fillStyle = CREAM;
      ctx.font = `700 12px Verdana, sans-serif`;
      ctx.fillText(mapState.toast, W / 2, 558);
    }
    ctx.restore();
  }

  function drawSchoolDesk(g, x, baseY, scale, tilt, index, moving) {
    g.save();
    g.translate(x, baseY);
    g.rotate(tilt);
    g.scale(scale, scale);
    g.fillStyle = 'rgba(35, 21, 15, 0.2)';
    g.beginPath();
    g.ellipse(0, 3, 82, 11, 0, 0, TAU);
    g.fill();

    // стул с высокой спинкой
    roundRect(g, -92, -126, 36, 122, 8);
    fillStroke(g, '#77502f', INK, 3);
    roundRect(g, -88, -116, 26, 66, 5);
    fillStroke(g, '#8d5f37', INK, 2);
    roundRect(g, -100, -36, 60, 17, 5);
    fillStroke(g, '#9d7044', INK, 2.5);
    roundRect(g, -94, -23, 9, 26, 3);
    fillStroke(g, '#684328', INK, 2);
    roundRect(g, -54, -23, 9, 26, 3);
    fillStroke(g, '#684328', INK, 2);

    // парта
    roundRect(g, -68, -74, 146, 18, 4);
    const wood = g.createLinearGradient(0, -78, 0, -56);
    wood.addColorStop(0, '#bb8a54');
    wood.addColorStop(1, '#8a5b33');
    fillStroke(g, wood, INK, 3.4);
    g.fillStyle = 'rgba(255, 235, 188, 0.24)';
    g.fillRect(-59, -71, 104, 3);
    for (const side of [-1, 1]) {
      roundRect(g, side * 56 - 6, -56, 12, 58, 3);
      fillStroke(g, '#6c472c', INK, 2.2);
    }
    // выдвижной ящик и номер школы
    roundRect(g, 28, -54, 42, 28, 3);
    fillStroke(g, '#7a4f2e', INK, 2);
    circle(g, 49, -40, 2.3, GOLD, INK, 1);
    g.fillStyle = 'rgba(58, 34, 21, 0.54)';
    g.font = `900 8px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.fillText('№ 53', -14, -39);

    // тетрадь и пенал
    g.save();
    g.translate(-38, -84);
    g.rotate(-0.09 + Math.sin(index * 2.1) * 0.02);
    roundRect(g, -23, -10, 48, 20, 2);
    fillStroke(g, '#e8d8b4', INK, 1.8);
    g.strokeStyle = 'rgba(83, 55, 35, 0.38)';
    g.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(-17, -4 + i * 5);
      g.lineTo(18, -4 + i * 5);
      g.stroke();
    }
    g.restore();
    roundRect(g, 4, -87, 36, 11, 4);
    fillStroke(g, '#3e746a', INK, 1.6);
    g.fillStyle = GOLD;
    g.fillRect(11, -84, 23, 2);
    if (moving) {
      g.strokeStyle = 'rgba(58, 34, 21, 0.24)';
      g.lineWidth = 1.4;
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.moveTo(-84 - i * 6, -68 + i * 8);
        g.lineTo(-106 - i * 9, -68 + i * 8);
        g.stroke();
      }
    }
    g.restore();
  }

  function drawSchoolDesks() {
    if (game.bossId !== 'denis' || boss.exploded) return;
    const b = boss;
    const moving = true;
    const amp = b.phase === 2 ? 9 : b.phase === 3 ? 5 : 3;
    const back = [
      { x: 178, y: GROUND - 62, scale: 0.76, seed: 1 },
      { x: 372, y: GROUND - 72, scale: 0.72, seed: 2 },
      { x: 566, y: GROUND - 59, scale: 0.78, seed: 3 },
      { x: 752, y: GROUND - 68, scale: 0.73, seed: 4 },
    ];
    const front = [
      { x: 292, y: GROUND + 1, scale: 0.96, seed: 5 },
      { x: 548, y: GROUND + 3, scale: 1, seed: 6 },
      { x: 814, y: GROUND + 1, scale: 0.93, seed: 7 },
    ];
    ctx.save();
    for (const row of [back, front]) {
      const isBack = row === back;
      ctx.globalAlpha = isBack ? 0.82 : 1;
      row.forEach((desk, i) => {
        const t = game.time * (b.phase === 2 ? 1.9 : 1.15) + desk.seed * 1.7;
        const dx = Math.sin(t) * amp + Math.sin(t * 0.43 + i) * amp * 0.4;
        const tilt = Math.sin(t * 0.8) * (b.phase === 2 ? 0.015 : 0.007);
        drawSchoolDesk(ctx, desk.x + dx, desk.y, desk.scale, tilt, desk.seed, moving);
        if (b.phase >= 2) {
          ctx.globalAlpha = 0.24;
          ctx.strokeStyle = '#3e2a1e';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(desk.x - 58, desk.y + 5);
          ctx.lineTo(desk.x - 78 - Math.sign(dx) * 10, desk.y + 5);
          ctx.stroke();
          ctx.globalAlpha = isBack ? 0.82 : 1;
        }
      });
    }
    ctx.restore();
  }

  function drawSchoolCeilingBreak() {
    if (game.bossId !== 'denis' || game.schoolFloor === 3) return;
    if (boss.phase < 3 && !game.schoolParkour) return;
    const t = game.time;
    ctx.save();
    // рваная кромка потолка
    ctx.fillStyle = 'rgba(48, 39, 31, 0.92)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 70);
    ctx.lineTo(1178, 88);
    ctx.lineTo(1102, 64);
    ctx.lineTo(1020, 102);
    ctx.lineTo(942, 66);
    ctx.lineTo(856, 108);
    ctx.lineTo(770, 62);
    ctx.lineTo(680, 96);
    ctx.lineTo(600, 58);
    ctx.lineTo(512, 110);
    ctx.lineTo(430, 68);
    ctx.lineTo(348, 100);
    ctx.lineTo(272, 64);
    ctx.lineTo(182, 98);
    ctx.lineTo(96, 68);
    ctx.lineTo(0, 84);
    ctx.closePath();
    ctx.fill();
    // балки и арматура
    ctx.strokeStyle = 'rgba(30, 24, 20, 0.7)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      const x = 180 + i * 210;
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x + 20, 82);
      ctx.lineTo(x + 12, 118 + (i % 2) * 16);
      ctx.stroke();
    }
    // трещины по стенам
    ctx.strokeStyle = 'rgba(38, 28, 22, 0.5)';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 6; i++) {
      const x = 120 + seeded(i * 7.2) * 980;
      ctx.beginPath();
      ctx.moveTo(x, 84);
      ctx.lineTo(x + 8, 132);
      ctx.lineTo(x - 8, 170);
      ctx.lineTo(x + 3, 214);
      ctx.stroke();
    }
    // падающая пыль
    ctx.fillStyle = 'rgba(247, 228, 183, 0.5)';
    for (let i = 0; i < 35; i++) {
      const x = (seeded(i * 4.7) * W + t * (18 + (i % 5) * 9)) % W;
      const y = 80 + ((seeded(i * 9.1) * 520 + t * (22 + (i % 7) * 15)) % 500);
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    if (game.schoolParkour) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 6);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = 'rgba(255, 239, 190, 0.1)';
      ctx.beginPath();
      ctx.moveTo(904, 70);
      ctx.lineTo(1088, 70);
      ctx.lineTo(1190, GROUND);
      ctx.lineTo(820, GROUND);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDenisBirds() {
    if (game.bossId !== 'denis' || !denisBirds.length) return;
    for (const bird of denisBirds) {
      const flap = Math.sin(bird.flap);
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.scale(bird.dir, 1);
      // тень на полу
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#16100d';
      ctx.beginPath();
      ctx.ellipse(0, GROUND - bird.y - 3, 30, 7, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      // хвост
      ctx.fillStyle = '#8a8c87';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-22, 4);
      ctx.lineTo(-52, -8);
      ctx.lineTo(-37, 7);
      ctx.lineTo(-54, 15);
      ctx.lineTo(-19, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // тело
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 20, -0.05, 0, TAU);
      fillStroke(ctx, '#b9bbb4', INK, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(-7, -6, 15, 7, -0.26, 0, TAU);
      ctx.fill();
      // крыло
      ctx.save();
      ctx.rotate(-0.2 + flap * 0.55);
      ctx.beginPath();
      ctx.moveTo(-16, 2);
      ctx.bezierCurveTo(-6, -26, 22, -35, 31, -4);
      ctx.bezierCurveTo(18, 10, -2, 14, -16, 2);
      ctx.closePath();
      fillStroke(ctx, '#d4d4ca', INK, 2.8);
      ctx.strokeStyle = 'rgba(55, 55, 50, 0.35)';
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-4, -1 + i * 4);
        ctx.lineTo(18, -9 + i * 5);
        ctx.stroke();
      }
      ctx.restore();
      // голова
      circle(ctx, 27, -12, 13, '#d2d2c8', INK, 3);
      ctx.fillStyle = '#e59b44';
      ctx.beginPath();
      ctx.moveTo(38, -12);
      ctx.lineTo(53, -7);
      ctx.lineTo(38, -2);
      ctx.closePath();
      fillStroke(ctx, '#e59b44', INK, 1.8);
      circle(ctx, 31, -16, 3.5, WHITE, INK, 1.4);
      circle(ctx, 32, -16, 1.6, INK, null, 0);
      // лапки
      ctx.strokeStyle = '#7b4d2c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, 17);
      ctx.lineTo(-6, 28);
      ctx.moveTo(8, 16);
      ctx.lineTo(11, 27);
      ctx.stroke();
      // яйцо, готовое упасть
      if (bird.eggT < 0.35) {
        ctx.save();
        ctx.translate(4, 24);
        ctx.rotate(Math.sin(bird.flap * 0.6) * 0.15);
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 9, 0, 0, TAU);
        fillStroke(ctx, '#f4e6bd', INK, 2);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  function drawDenisLaser() {
    const b = boss;
    if (game.bossId !== 'denis') return;
    const laserStates = [
      'denisLaserWind',
      'denisLaserFire',
      'denisLaserFade',
      'denisCeilLaserWind',
    ];
    if (!laserStates.includes(b.state)) return;
    const t = game.time;
    const eye = denisEyePos();
    const mirrorX = ARENA_L + 18;
    const mirrorY = b.laser.mirrorY;
    ctx.save();

    if (b.state === 'denisCeilLaserWind') {
      const ceilX = b.x - 240;
      const charge = clamp(b.timer / 1.7, 0, 1);
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(ceilX, 22, 3, ceilX, 22, 120 + charge * 90);
      glow.addColorStop(0, `rgba(255, 236, 206, ${0.5 + charge * 0.4})`);
      glow.addColorStop(0.22, `rgba(255, 104, 148, ${0.3 + charge * 0.3})`);
      glow.addColorStop(1, 'rgba(255, 80, 140, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ceilX, 22, 120 + charge * 90, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.setLineDash([13, 10]);
      ctx.lineDashOffset = -t * 70;
      ctx.strokeStyle = `rgba(255, 151, 188, ${0.62 + Math.sin(t * 22) * 0.18})`;
      ctx.lineWidth = 2 + charge * 2;
      ctx.beginPath();
      ctx.moveTo(eye.x, eye.y);
      ctx.lineTo(ceilX, 22);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 239, 217, 0.6)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(ceilX - 60, 22);
      ctx.lineTo(ceilX + 62, 22);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // рельс зеркала на стене
    ctx.strokeStyle = 'rgba(36, 24, 19, 0.45)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(mirrorX, GROUND - 500);
    ctx.lineTo(mirrorX, GROUND - 76);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 226, 165, 0.22)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 12]);
    ctx.beginPath();
    ctx.moveTo(mirrorX, GROUND - 510);
    ctx.lineTo(mirrorX, GROUND - 70);
    ctx.stroke();
    ctx.setLineDash([]);

    const firing = b.state === 'denisLaserFire';
    const fading = b.state === 'denisLaserFade';
    const fadeA = fading ? clamp(1 - b.timer / 0.36, 0, 1) : 1;
    const segments = denisLaserSegments();
    const drawSegment = (s, width, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    };

    if (firing || fading) {
      ctx.globalAlpha = fadeA;
      ctx.globalCompositeOperation = 'lighter';
      for (const s of segments) {
        drawSegment(s, 30, 'rgba(255, 67, 139, 0.16)');
        drawSegment(s, 19, 'rgba(255, 112, 166, 0.34)');
        drawSegment(s, 10, 'rgba(255, 202, 226, 0.72)');
        drawSegment(s, 4, 'rgba(255, 253, 244, 0.98)');
      }
      // пульсирующие искры на луче
      for (let i = 0; i < 11; i++) {
        const s = segments[i % 2];
        const p = (t * (0.42 + i * 0.07) +i * 0.13) % 1;
        const x = lerp(s.x1, s.x2, p);
        const y = lerp(s.y1, s.y2, p);
        const r = 2.5 + (i % 4);
        ctx.fillStyle = i % 3 ? 'rgba(255, 246, 220, 0.82)' : 'rgba(255, 133, 180, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
      // зайчик на правой стене
      const hitX = W - 26;
      const hitY = mirrorY;
      const flare = ctx.createRadialGradient(hitX, hitY, 2, hitX, hitY, 74);
      flare.addColorStop(0, 'rgba(255, 252, 238, 0.85)');
      flare.addColorStop(0.25, 'rgba(255, 129, 178, 0.44)');
      flare.addColorStop(1, 'rgba(255, 80, 140, 0)');
      ctx.fillStyle = flare;
      ctx.beginPath();
      ctx.arc(hitX, hitY, 74, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // предупреждение: пунктир от глаза к зеркалу и вдоль будущего луча
      ctx.setLineDash([10, 12]);
      ctx.lineDashOffset = -t * 54;
      ctx.strokeStyle = `rgba(255, 140, 186, ${0.42 + Math.sin(t * 14) * 0.16})`;
      ctx.lineWidth = 2.2;
      for (const s of segments) {
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // само зеркало
    ctx.save();
    ctx.translate(mirrorX, mirrorY);
    ctx.rotate(firing ? Math.sin(t * 8) * 0.02 : 0.02);
    ctx.fillStyle = 'rgba(29, 19, 16, 0.32)';
    ctx.beginPath();
    ctx.ellipse(8, 7, 28, 34, 0.2, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.rotate(-0.22);
    roundRect(ctx, -20, -27, 38, 54, 10);
    fillStroke(ctx, '#c9b176', INK, 3.4);
    roundRect(ctx, -14, -21, 26, 42, 7);
    const glass = ctx.createLinearGradient(-14, -21, 14, 21);
    glass.addColorStop(0, 'rgba(231, 249, 243, 0.85)');
    glass.addColorStop(0.45, 'rgba(155, 211, 210, 0.54)');
    glass.addColorStop(1, 'rgba(241, 250, 244, 0.82)');
    fillStroke(ctx, glass, INK, 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(2, -2);
    ctx.lineTo(-7, 10);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 238, 191, 0.85)';
    ctx.font = `700 7px Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ЗЕРКАЛО', 0, 42);
    ctx.restore();

    // наконечник и свечение у глаза
    if (firing || fading || b.state === 'denisLaserWind') {
      const charge = b.state === 'denisLaserWind' ? clamp(b.timer / 0.92, 0, 1) : 1;
      const eyeGlow = ctx.createRadialGradient(eye.x, eye.y, 2, eye.x, eye.y, 54);
      eyeGlow.addColorStop(0, `rgba(255, 252, 236, ${0.7 + charge * 0.3})`);
      eyeGlow.addColorStop(0.3, `rgba(255, 105, 157, ${0.4 + charge * 0.3})`);
      eyeGlow.addColorStop(1, 'rgba(255, 80, 140, 0)');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, 54, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDenisWarnings() {
    if (game.bossId !== 'denis' || boss.exploded) return;
    const b = boss;
    const t = game.time;
    if (b.state === 'denisParkour' && game.schoolParkour) {
      ctx.save();
      const pulse = 0.7 + Math.sin(t * 5) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = 'rgba(23, 14, 13, 0.84)';
      ctx.strokeStyle = GOLD_BRIGHT;
      ctx.lineWidth = 2;
      roundRect(ctx, W / 2 - 215, 138, 430, 54, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = CREAM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 21px ${FONT_DISPLAY}`;
      ctx.fillText('ЗАБЕРИСЬ НА КРЫШУ!', W / 2, 158);
      ctx.fillStyle = 'rgba(255, 232, 166, 0.82)';
      ctx.font = `700 9px Verdana, sans-serif`;
      ctx.fillText('ПРЫГАЙ ПО ПАРТАМ И ПОЛКАМ →', W / 2, 177);
      // указатель на люк
      const roof = platforms.find((p) => p.kind === 'roof');
      if (roof) {
        ctx.globalAlpha = 0.6 + Math.sin(t * 7) * 0.3;
        ctx.translate(roof.x + roof.w * 0.23, roof.y - 92 + Math.sin(t * 5) * 6);
        ctx.fillStyle = GOLD_BRIGHT;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-17, -24);
        ctx.lineTo(-6, -24);
        ctx.lineTo(-6, -54);
        ctx.lineTo(6, -54);
        ctx.lineTo(6, -24);
        ctx.lineTo(17, -24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    }

    if (b.state === 'denisThirdFloorIntro') {
      const p = clamp(b.timer / 2, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.9;
      ctx.translate(W / 2, 330);
      ctx.rotate(-0.02);
      ctx.fillStyle = 'rgba(26, 14, 12, 0.86)';
      ctx.strokeStyle = GOLD_BRIGHT;
      ctx.lineWidth = 3;
      roundRect(ctx, -300, -76, 600, 152, 14);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = CREAM;
      ctx.font = `900 58px ${FONT_DISPLAY}`;
      ctx.fillText('3-Й ЭТАЖ', 0, -20);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.font = `900 17px ${FONT_DISPLAY}`;
      ctx.fillText('ПТИЦЫ · БЕТОН · БЕЗУМИЕ', 0, 35);
      ctx.restore();
    }
  }

  function drawThirdFloorAtmosphere() {
    if (game.schoolFloor !== 3) return;
    const t = game.time;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#eef5ef';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const y = 160 + i * 43 + Math.sin(t * 0.7 + i) * 10;
      const x = (t * (38 + i * 5) + i * 149) % (W + 200) - 100;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 90, y + 5);
      ctx.stroke();
    }
    // движущиеся облака
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = '#f7f0dd';
    for (let i = 0; i < 4; i++) {
      const x = ((t * (12 + i * 5) + i * 300) % (W + 260)) - 130;
      const y = 120 + i * 56;
      ctx.beginPath();
      ctx.ellipse(x, y, 100, 20, 0, 0, TAU);
      ctx.ellipse(x - 45, y + 5, 50, 14, 0, 0, TAU);
      ctx.ellipse(x + 55, y + 6, 60, 16, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // ================= ЕЛЕНА ГУРЬЕВНА: КЛАСС И КОРИДОР =================
  function elenaEyePos() {
    const b = boss;
    if (b.phase === 1) return { x: b.x - 22, y: GROUND - 196 };
    return { x: b.x - 20, y: GROUND - 204 };
  }

  function elenaPunchRect() {
    const b = boss;
    if (game.bossId !== 'elena') return null;
    if (b.state !== 'elenaPunchOut' && b.state !== 'elenaPunchHold') return null;
    const d = b.elenaPunchDist || 0;
    return { x: b.x - 88 - d, y: GROUND - 165, w: d + 58, h: 100 };
  }

  function elenaLaserHits(rect) {
    const b = boss;
    if (game.bossId !== 'elena' || b.state !== 'elenaLaser' || !b.elenaLaserOn) return false;
    const eye = elenaEyePos();
    const thickness = game.difficulty === 'hard' ? 12 : 8;
    return (b.elenaLaserTargets || []).some((target) =>
      segmentHitsRect(eye.x, eye.y, target.x, GROUND - 8, rect, thickness)
    );
  }

  function elenaBreathHits(rect) {
    const b = boss;
    if (game.bossId !== 'elena' || b.state !== 'elenaBreath') return false;
    const cone = { x: b.x - 420, y: GROUND - 255, w: 370, h: 185 };
    return overlap(rect, cone);
  }

  function setupElenaArena() {
    platforms.length = 0;
    game.elenaArea = 'classroom';
    game.elenaEscape = false;
    game.elenaExitHint = 0;
  }

  function elenaToIdle(delay) {
    const b = boss;
    if (b.dying) return;
    b.state = 'idle';
    b.timer = 0;
    b.elenaLaserOn = false;
    b.elenaFootUp = 0;
    b.elenaAttackT = delay === undefined ? 1.05 : delay;
  }

  function spawnElenaMark(opts = {}) {
    const b = boss;
    const startX = b.x - 76;
    const startY = GROUND - (opts.launchY === undefined ? 186 : opts.launchY);
    const targetX = hero.x;
    const targetY = hero.y - 48;
    let ang = Math.atan2(targetY - startY, targetX - startX);
    ang += opts.angleOffset || 0;
    const speed = (opts.speed || 420) * difficultyConfig().speed;
    bossShots.push({
      kind: 'elenaMark',
      x: startX,
      y: startY,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: opts.r || 23,
      t: 0,
      life: opts.life || 3.6,
      parryable: false,
      breakable: opts.breakable !== false,
      journal: !!opts.journal,
      hp: opts.hp || 1,
      spin: rand(-0.3, 0.3),
      dir: -1,
    });
  }

  function spawnElenaJournalMarks() {
    for (let i = 0; i < 3; i++) {
      spawnElenaMark({
        speed: 168,
        launchY: 150 + i * 26,
        angleOffset: (i - 1) * 0.2,
        breakable: true,
        journal: true,
        r: 22,
        life: 4.6,
      });
    }
    spawnComic('ЖУРНАЛ! РАЗБЕЙ ДВОЙКИ!', W / 2, 150, 20, '#ff9a8a');
  }

  function spawnElenaPencils() {
    const b = boss;
    const count = 6;
    const base = clamp(hero.x, ARENA_L + 60, ARENA_R - 60);
    for (let i = 0; i < count; i++) {
      const x = clamp(base + (i - (count - 1) / 2) * 154 + rand(-26, 26), ARENA_L + 34, ARENA_R - 34);
      bossShots.push({
        kind: 'elenaPencil',
        x,
        y: -70 - i * 34,
        vx: 0,
        vy: (365 + i * 15) * difficultyConfig().speed,
        r: 15,
        t: 0,
        life: 5,
        parryable: false,
        breakable: false,
        markX: x,
        spin: rand(-0.2, 0.2),
        dir: -1,
      });
    }
    spawnComic('КАРАНДАШИ СВЕРХУ!', W / 2, 150, 20, '#ff8b71');
  }

  function spawnElenaGlobe() {
    const b = boss;
    const dir = hero.x < b.x ? -1 : 1;
    bossShots.push({
      kind: 'elenaGlobe',
      x: b.x - 86,
      y: GROUND - 248,
      vx: dir * 315 * difficultyConfig().speed,
      vy: -560,
      r: 28,
      t: 0,
      life: 7,
      parryable: true,
      breakable: false,
      bounces: 0,
      spin: rand(0, TAU),
      dir,
    });
    spawnComic('ГЛОБУС! ПАРИРУЙ!', W / 2, 150, 21, PINK_BRIGHT);
    Sound.sfx('chalk');
    game.shake = Math.max(game.shake, 3);
  }

  function spawnElenaStink() {
    const b = boss;
    bossShots.push({
      kind: 'stinkCloud',
      x: b.x - 78,
      y: GROUND - 170,
      baseY: GROUND - 150 + rand(-56, 42),
      vx: -235 * difficultyConfig().speed,
      vy: 0,
      r: rand(20, 30),
      t: 0,
      life: 3.6,
      parryable: false,
      spin: 0,
      dir: -1,
      phase: rand(0, TAU),
    });
  }

  function spawnElenaTeeth() {
    const b = boss;
    // Зубы выпадают изо рта, приземляются, а потом бегут за героем
    // и подпрыгивают, как маленькие злые солдатики.
    for (let i = 0; i < 6; i++) {
      bossShots.push({
        kind: 'elenaTooth',
        x: b.x - 18 + rand(-16, 16),
        y: GROUND - 192 + rand(-12, 10),
        vx: rand(-95, 55),
        vy: rand(-390, -190),
        r: 11,
        t: 0,
        life: 9,
        mode: 'fall',
        bounced: false,
        hopT: rand(0.18, 0.55),
        spin: rand(0, TAU),
        dir: -1,
      });
    }
    spawnComic('ЗУБЫ ВРАССЫПНУЮ!', W / 2, 150, 20, PINK_BRIGHT);
    Sound.sfx('chalk');
  }

  function elenaSpawnWave(dir) {
    const b = boss;
    waves.push({
      x: clamp(b.x - 70, 120, W - 120),
      y: GROUND,
      dir,
      speed: 470 * difficultyConfig().speed,
      t: 0,
      hot: true,
    });
    game.shake = Math.max(game.shake, 9);
    spawnDust(b.x - 60, GROUND, 9, 1);
    Sound.sfx('slam');
  }

  function startElenaPhase2() {
    const b = boss;
    if (b.dying || b.phase >= 2) return;
    b.phase = 2;
    b.enraged = true;
    b.x = Math.max(b.x, 760);
    b.elenaPattern = 0;
    b.elenaLaserOn = false;
    b.elenaLaserTargets = [];
    b.elenaPunchDist = 0;
    b.elenaFootUp = 0;
    bossShots.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    setBossState('elenaStand');
    game.elenaEscape = true;
    game.elenaExitHint = 0;
    game.flash = 0.32;
    game.flashColor = '#ffc0a4';
    game.shake = Math.max(game.shake, 14);
    Sound.sfx('roar');
    spawnComic('ЕЛЕНА ГУРЬЕВНА ВСТАЁТ!', W / 2, 146, 31, GOLD_BRIGHT);
    spawnComic('БЕГИ ВЛЕВО · ВЫХОД ИЗ КЛАССА!', W / 2, 192, 16, CREAM);
  }

  function enterElenaHallway() {
    const b = boss;
    game.elenaArea = 'hallway';
    game.elenaEscape = false;
    platforms.length = 0;
    bossShots.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    b.x = 1020;
    b.face = -1;
    b.elenaPattern = 0;
    b.elenaLaserOn = false;
    b.elenaLaserTargets = [];
    b.elenaPunchDist = 0;
    b.elenaFootUp = 0;
    hero.x = 220;
    hero.y = GROUND;
    hero.vx = 0;
    hero.vy = 0;
    hero.onGround = true;
    hero.invuln = Math.max(hero.invuln, 1.4);
    elenaToIdle(1.5);
    game.flash = 0.25;
    game.flashColor = '#e8d7a6';
    game.shake = Math.max(game.shake, 10);
    Sound.sfx('stand');
    spawnComic('ШКОЛЬНЫЙ КОРИДОР!', W / 2, 146, 30, GOLD_BRIGHT);
    spawnComic('ТЕПЕРЬ ЕЛЕНА ГУРЬЕВНА НЕ ОТСТАНЕТ', W / 2, 190, 14, CREAM);
  }

  function updateElenaBoss(dt) {
    const b = boss;
    b.timer += dt;
    b.breathe += dt;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.hpShown = damp(b.hpShown, b.hp, 9, dt);

    if (b.dying) {
      b.deathT += dt;
      if (!b.exploded && b.deathT > 1.2) {
        b.exploded = true;
        explodeBoss();
      }
      return;
    }
    if (hero.dead) {
      if (b.state !== 'idle') elenaToIdle(1.5);
      b.elenaLaserOn = false;
      return;
    }

    if (b.phase === 1) {
      // Страховка: если здоровье уже ниже порога, вторая фаза включается
      // даже посреди любой атаки.
      if (b.hp <= b.maxHp / 3) {
        startElenaPhase2();
        return;
      }
      if (b.state === 'idle') {
        b.elenaAttackT -= dt;
        if (b.elenaAttackT <= 0) {
          const type = b.elenaPattern++ % 5;
          if (type === 0) {
            setBossState('elenaMarkWind');
            b.face = hero.x < b.x ? -1 : 1;
            spawnComic('ДВОЙКА!', b.x - 40, GROUND - 300, 22, '#ff6b5e');
            Sound.sfx('telegraph');
          } else if (type === 1) {
            setBossState('elenaSlamWind');
            b.face = hero.x < b.x ? -1 : 1;
            spawnComic('СТОЛ!', b.x - 30, GROUND - 280, 24, GOLD_BRIGHT);
            Sound.sfx('telegraph');
          } else if (type === 2) {
            setBossState('elenaPencilWind');
            b.face = hero.x < b.x ? -1 : 1;
            spawnComic('ПАЧКА КАРАНДАШЕЙ!', b.x - 40, GROUND - 300, 21, '#ff8b71');
            Sound.sfx('telegraph');
          } else if (type === 3) {
            setBossState('elenaGlobeWind');
            b.face = hero.x < b.x ? -1 : 1;
            spawnComic('ГЛОБУС!', b.x - 40, GROUND - 300, 22, PINK_BRIGHT);
            Sound.sfx('telegraph');
          } else {
            setBossState('elenaLaserWind');
            b.face = hero.x < b.x ? -1 : 1;
            spawnComic('ЛАЗЕРЫ!', b.x - 40, GROUND - 300, 24, '#ff6b5e');
            Sound.sfx('telegraph');
          }
        }
      } else if (b.state === 'elenaMarkWind') {
        if (b.timer >= 0.52) {
          spawnElenaMark({ speed: 440, launchY: 188, r: 24 });
          if (boss.phase === 1 && Math.random() < 0.45) {
            spawnElenaMark({ speed: 370, launchY: 154, angleOffset: -0.12, r: 20 });
          }
          Sound.sfx('chalk');
          setBossState('elenaMarkRecover');
        }
      } else if (b.state === 'elenaMarkRecover') {
        if (b.timer >= 0.5) elenaToIdle(0.9 * difficultyConfig().wait);
      } else if (b.state === 'elenaSlamWind') {
        if (b.timer >= 0.62) {
          elenaSpawnWave(-1);
          setBossState('elenaSlamRecover');
          b.face = -1;
        }
      } else if (b.state === 'elenaSlamRecover') {
        if (b.timer >= 0.55) elenaToIdle(0.95 * difficultyConfig().wait);
      } else if (b.state === 'elenaLaserWind') {
        if (b.timer >= 0.8) {
          const cx = clamp(hero.x + hero.vx * 0.16, ARENA_L + 80, ARENA_R - 80);
          b.elenaLaserTargets = [
            { x: clamp(cx - 125, ARENA_L + 50, ARENA_R - 50) },
            { x: clamp(cx + 125, ARENA_L + 50, ARENA_R - 50) },
          ];
          b.elenaLaserOn = false;
          setBossState('elenaLaser');
          Sound.sfx('telegraph');
        }
      } else if (b.state === 'elenaLaser') {
        if (b.timer >= 0.42) b.elenaLaserOn = true;
        if (b.timer >= 1.18) {
          b.elenaLaserOn = false;
          setBossState('elenaLaserRecover');
        }
      } else if (b.state === 'elenaLaserRecover') {
        if (b.timer >= 0.35) elenaToIdle(1.0 * difficultyConfig().wait);
      } else if (b.state === 'elenaPencilWind') {
        // Она замахивается пачкой карандашей вверх.
        if (b.timer >= 0.72) {
          setBossState('elenaPencilThrow');
          b.elenaFootUp = 0;
          spawnElenaPencils();
          Sound.sfx('chalk');
          game.shake = Math.max(game.shake, 4);
        }
      } else if (b.state === 'elenaPencilThrow') {
        if (b.timer >= 0.55) setBossState('elenaPencilRecover');
      } else if (b.state === 'elenaPencilRecover') {
        if (b.timer >= 0.55) elenaToIdle(0.9 * difficultyConfig().wait);
      } else if (b.state === 'elenaGlobeWind') {
        if (b.timer >= 0.6) {
          spawnElenaGlobe();
          setBossState('elenaGlobeRecover');
        }
      } else if (b.state === 'elenaGlobeRecover') {
        if (b.timer >= 0.75) elenaToIdle(1.0 * difficultyConfig().wait);
      }
      return;
    }

    // ---------- вторая фаза: школьный коридор ----------
    if (b.state === 'elenaStand') {
      b.x = damp(b.x, 820, 2.4, dt);
      if (b.timer >= 0.95) {
        setBossState('elenaChase');
        game.shake = Math.max(game.shake, 8);
        spawnComic('ОНА ИДЁТ ЗА ТОБОЙ!', W / 2, 160, 24, GOLD_BRIGHT);
      }
      return;
    }
    if (b.state === 'elenaChase') {
      b.face = -1;
      b.x = Math.max(150, b.x - 185 * dt);
      if (Math.random() < dt * 18) spawnDust(b.x + 30, GROUND, 1, 0.5);
      if (b.x <= 150) b.x = 150;
      if (hero.x <= 140) enterElenaHallway();
      return;
    }

    if (b.state === 'idle') {
      b.x = damp(b.x, 1020, 2.2, dt);
      b.elenaAttackT -= dt;
      if (b.elenaAttackT <= 0) {
        const type = b.elenaPattern++ % 6;
        if (type === 0) {
          setBossState('elenaBullWind');
          b.face = -1;
          spawnComic('РАЗБЕГ! ПЕРЕПРЫГНИ!', W / 2, 150, 22, '#ff8b71');
          Sound.sfx('telegraph');
        } else if (type === 1) {
          setBossState('elenaJournalWind');
          b.face = -1;
          spawnComic('ДОСТАЁТ ЖУРНАЛ…', W / 2, 150, 18, '#ffb08e');
          Sound.sfx('telegraph');
        } else if (type === 2) {
          setBossState('elenaBreathWind');
          b.face = -1;
          spawnComic('ЗАПАХ ИЗО РТА!', W / 2, 150, 20, '#b7e68a');
          Sound.sfx('telegraph');
        } else if (type === 3) {
          setBossState('elenaStompWind');
          b.face = -1;
          spawnComic('ТОП! ПРЫГАЙ!', W / 2, 150, 21, GOLD_BRIGHT);
          Sound.sfx('telegraph');
        } else if (type === 4) {
          setBossState('elenaPunchWind');
          b.face = -1;
          spawnComic('РУКА!', b.x - 70, GROUND - 300, 22, '#ff8b71');
          Sound.sfx('telegraph');
        } else {
          setBossState('elenaTeethWind');
          b.face = -1;
          spawnComic('ЗУБЫ ВЫПАДАЮТ!', W / 2, 150, 22, PINK_BRIGHT);
          Sound.sfx('telegraph');
        }
      }
    } else if (b.state === 'elenaBullWind') {
      b.elenaChaseSpeed = Math.min(1, b.timer / 0.62);
      if (b.timer >= 0.68) {
        setBossState('elenaBull');
        b.face = -1;
        Sound.sfx('punch');
      }
    } else if (b.state === 'elenaBull') {
      b.x -= 800 * dt;
      if (Math.random() < dt * 36) spawnDust(b.x + 46, GROUND, 1, 0.7);
      if (b.x <= 208) {
        b.x = 208;
        b.elenaChaseSpeed = 0;
        setBossState('elenaBullReturn');
        b.face = 1;
      }
    } else if (b.state === 'elenaBullReturn') {
      b.x += 560 * dt;
      if (b.x >= 1020) {
        b.x = 1020;
        b.face = -1;
        elenaToIdle(1.25 * difficultyConfig().wait);
      }
    } else if (b.state === 'elenaJournalWind') {
      if (b.timer >= 0.62) {
        spawnElenaJournalMarks();
        setBossState('elenaJournalRecover');
      }
    } else if (b.state === 'elenaJournalRecover') {
      if (b.timer >= 0.9) elenaToIdle(1.0 * difficultyConfig().wait);
    } else if (b.state === 'elenaBreathWind') {
      if (b.timer >= 0.68) {
        b.elenaStinkT = 0.04;
        setBossState('elenaBreath');
        Sound.sfx('roar');
      }
    } else if (b.state === 'elenaBreath') {
      b.elenaStinkT -= dt;
      if (b.elenaStinkT <= 0) {
        spawnElenaStink();
        b.elenaStinkT = 0.2;
      }
      if (b.timer >= 1.75) elenaToIdle(1.1 * difficultyConfig().wait);
    } else if (b.state === 'elenaStompWind') {
      b.elenaFootUp = Math.min(1, b.timer / 0.52);
      if (b.timer >= 0.55) {
        elenaSpawnWave(-1);
        spawnRing(b.x - 50, GROUND - 4, '#f0d9a0', 32);
        setBossState('elenaStompRecover');
      }
    } else if (b.state === 'elenaStompRecover') {
      b.elenaFootUp = Math.max(0, b.elenaFootUp - dt * 4);
      if (b.timer >= 0.62) elenaToIdle(1.05 * difficultyConfig().wait);
    } else if (b.state === 'elenaPunchWind') {
      b.elenaPunchDist = 0;
      if (b.timer >= 0.52) {
        setBossState('elenaPunchOut');
        b.elenaPunchPrev = 0;
        Sound.sfx('punch');
      }
    } else if (b.state === 'elenaPunchOut') {
      const p = clamp(b.timer / 0.3, 0, 1);
      b.elenaPunchDist = lerp(0, 530, easeOutCubic(p));
      if (p >= 1) setBossState('elenaPunchHold');
    } else if (b.state === 'elenaPunchHold') {
      b.elenaPunchDist = 530;
      if (b.timer >= 0.13) setBossState('elenaPunchRecover');
    } else if (b.state === 'elenaPunchRecover') {
      const p = clamp(b.timer / 0.38, 0, 1);
      b.elenaPunchDist = lerp(530, 0, easeInOutQuad(p));
      if (p >= 1) elenaToIdle(1.0 * difficultyConfig().wait);
    } else if (b.state === 'elenaTeethWind') {
      if (b.timer >= 0.78) {
        spawnElenaTeeth();
        setBossState('elenaTeethRecover');
        Sound.sfx('roar');
        game.shake = Math.max(game.shake, 5);
      }
    } else if (b.state === 'elenaTeethRecover') {
      if (b.timer >= 1.15) elenaToIdle(1.05 * difficultyConfig().wait);
    }
  }

  function drawElenaGlobe(s) {
    // тень на полу
    const shadowK = clamp(1 - (GROUND - s.y) / 620, 0.15, 1);
    ctx.save();
    ctx.globalAlpha = 0.26 * shadowK;
    ctx.fillStyle = '#2a1712';
    ctx.beginPath();
    ctx.ellipse(s.x, GROUND - 4, s.r * (0.8 + shadowK * 0.5), 7 * shadowK + 3, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.parryable) {
      const pulse = 1 + Math.sin(s.t * 10) * 0.08;
      const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, s.r * 2.6);
      glow.addColorStop(0, 'rgba(255, 146, 193, 0.45)');
      glow.addColorStop(1, 'rgba(255, 110, 170, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, s.r * 2.6, 0, TAU);
      ctx.fill();
      ctx.scale(pulse, pulse);
      // сердечко-подсказка над глобусом
      ctx.save();
      ctx.translate(0, -s.r - 26 - Math.sin(s.t * 9) * 3);
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.bezierCurveTo(-15, 2, -11, -10, 0, -4);
      ctx.bezierCurveTo(11, -10, 15, 2, 0, 10);
      ctx.closePath();
      fillStroke(ctx, PINK, INK, 2.2);
      ctx.fillStyle = PINK_BRIGHT;
      ctx.font = `900 8px Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.strokeText('ПАРИ', 0, -17);
      ctx.fillText('ПАРИ', 0, -17);
      ctx.restore();
    }

    // подставка-меридиан
    ctx.save();
    ctx.rotate(-0.32);
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, s.r + 5, -0.35, Math.PI + 0.35);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, s.r + 7.5, -0.35, Math.PI + 0.35);
    ctx.stroke();
    ctx.restore();

    // сам глобус
    ctx.save();
    ctx.rotate(s.spin * 0.35);
    const sea = ctx.createRadialGradient(-8, -9, 4, 0, 0, s.r);
    sea.addColorStop(0, s.parryable ? '#ffd3e4' : '#8fd4e8');
    sea.addColorStop(1, s.parryable ? '#e0649b' : '#3d87ad');
    circle(ctx, 0, 0, s.r, sea, INK, 3.4);
    // континенты
    ctx.fillStyle = s.parryable ? '#ffa8ca' : '#7bbf6a';
    ctx.strokeStyle = s.parryable ? 'rgba(139, 40, 79, 0.7)' : 'rgba(45, 79, 42, 0.7)';
    ctx.lineWidth = 1.4;
    const blobs = [
      [-10, -11, 9, 6, -0.4],
      [9, -3, 7, 10, 0.35],
      [-8, 10, 8, 6, 0.2],
    ];
    for (const [bx, by, rx, ry, rot] of blobs) {
      ctx.beginPath();
      ctx.ellipse(bx, by, rx, ry, rot, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-7, -9, 9, 4, -0.5, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // ось
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-s.r - 6, s.r + 2);
    ctx.lineTo(s.r + 6, -s.r - 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawElenaPencil(s) {
    const near = clamp(1 - Math.max(0, GROUND - s.y) / 620, 0, 1);
    // Метка падения, чтобы карандаш было видно заранее.
    if (s.markX !== undefined) {
      const pulse = 0.4 + Math.sin(game.time * 12 + s.x) * 0.2;
      ctx.save();
      ctx.translate(s.markX, GROUND - 5);
      ctx.globalAlpha = 0.4 + near * 0.5;
      ctx.strokeStyle = `rgba(255, 128, 98, ${pulse + 0.35})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 - near * 5, 7 - near * 2, 0, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 7);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 128, 98, ${0.13 + near * 0.24})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 - near * 3, 4.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.25 + near * 0.65;
    ctx.fillStyle = '#2a1712';
    ctx.beginPath();
    ctx.ellipse(s.x, GROUND - 2, 8 + near * 9, 3.5 + near * 2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin);
    // корпус карандаша
    roundRect(ctx, -6.5, -27, 13, 46, 3);
    fillStroke(ctx, '#e0563c', INK, 2.6);
    ctx.fillStyle = 'rgba(255, 224, 200, 0.45)';
    ctx.fillRect(-4.5, -23, 3, 36);
    // деревянный кончик
    ctx.beginPath();
    ctx.moveTo(-6.5, 19);
    ctx.lineTo(0, 36);
    ctx.lineTo(6.5, 19);
    ctx.closePath();
    fillStroke(ctx, '#f1d6a4', INK, 2.2);
    ctx.beginPath();
    ctx.moveTo(-2.6, 30);
    ctx.lineTo(0, 36);
    ctx.lineTo(2.6, 30);
    ctx.closePath();
    fillStroke(ctx, '#2c2734', INK, 1.4);
    // ластик
    roundRect(ctx, -6.5, -34, 13, 8, 3);
    fillStroke(ctx, '#efc3a0', INK, 2);
    // блик скорости
    ctx.strokeStyle = 'rgba(255, 220, 190, 0.5)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-13, -18);
    ctx.lineTo(-20, -8);
    ctx.moveTo(13, -18);
    ctx.lineTo(20, -8);
    ctx.stroke();
    ctx.restore();
  }

  function drawElenaTooth(s) {
    const running = s.mode === 'run';
    const airborne = running && s.vy < -40;
    const step = airborne ? 7 : Math.sin(s.t * 22) * 3;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.sin(s.t * 11) * 0.12 + (s.dir || -1) * 0.07);
    // лапки
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, 3);
    ctx.lineTo(-6 - step, 11);
    ctx.moveTo(5, 3);
    ctx.lineTo(6 + step, 11);
    ctx.stroke();
    // тело зуба с двумя корнями
    ctx.beginPath();
    ctx.moveTo(-11, -12);
    ctx.quadraticCurveTo(-12, -21, 0, -21);
    ctx.quadraticCurveTo(12, -21, 11, -12);
    ctx.quadraticCurveTo(10, -2, 7, 6);
    ctx.lineTo(4, -2);
    ctx.lineTo(0, 7);
    ctx.lineTo(-4, -2);
    ctx.lineTo(-7, 6);
    ctx.quadraticCurveTo(-10, -2, -11, -12);
    ctx.closePath();
    fillStroke(ctx, '#fff8e8', '#7a5a45', 2.6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-4, -14, 4, 2.6, -0.3, 0, TAU);
    ctx.fill();
    // злые глазки и брови
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-4, -9, 1.8, 0, TAU);
    ctx.arc(4, -9, 1.8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(-3, -12);
    ctx.moveTo(8, -14);
    ctx.lineTo(3, -12);
    ctx.stroke();
    // рот
    ctx.strokeStyle = '#8e2f2b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -3, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawElenaShot(s) {
    if (s.kind === 'stinkCloud') {
      ctx.save();
      ctx.translate(s.x, s.y);
      const wob = Math.sin(s.t * 5 + s.phase) * 0.1;
      ctx.rotate(wob);
      ctx.globalAlpha = 0.72;
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, s.r * 2.3);
      glow.addColorStop(0, 'rgba(178, 235, 132, 0.5)');
      glow.addColorStop(1, 'rgba(120, 190, 86, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, s.r * 2.3, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const a = s.t * 1.6 + i * 1.7;
        const rr = s.r * (0.3 + i * 0.17);
        circle(ctx, Math.cos(a) * rr, Math.sin(a * 1.3) * rr * 0.7, s.r * (0.5 - i * 0.07), i % 2 ? '#b7e68a' : '#97cf6d', 'rgba(58, 92, 49, 0.6)', 1.6);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      return;
    }
    // красная «двойка»
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin + Math.sin(s.t * 7) * 0.12);
    const w = s.journal ? 37 : 33;
    const h = s.journal ? 46 : 42;
    const paper = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    paper.addColorStop(0, '#fff1df');
    paper.addColorStop(1, '#e9cbb4');
    roundRect(ctx, -w / 2, -h / 2, w, h, 5);
    fillStroke(ctx, paper, '#7d2d27', 2.6);
    ctx.fillStyle = 'rgba(160, 40, 32, 0.16)';
    ctx.fillRect(-w / 2 + 4, -h / 2 + 7, w - 8, 2);
    ctx.fillStyle = '#c02f28';
    ctx.font = `900 ${s.journal ? 27 : 24}px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2', 0, 2);
    if (s.journal) {
      ctx.strokeStyle = 'rgba(141, 48, 42, 0.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 4, h / 2 - 8);
      ctx.lineTo(w / 2 - 4, h / 2 - 11);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawElenaWarnings() {
    const b = boss;
    if (b.phase === 1 && b.state === 'elenaLaserWind') {
      const eye = elenaEyePos();
      const cx = clamp(hero.x + hero.vx * 0.16, ARENA_L + 80, ARENA_R - 80);
      for (const dx of [-125, 125]) {
        const x = clamp(cx + dx, ARENA_L + 50, ARENA_R - 50);
        const pulse = 0.3 + Math.sin(game.time * 12) * 0.12;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 100, 80, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 7]);
        ctx.beginPath();
        ctx.arc(x, GROUND - 6, 34, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(x, GROUND - 6);
        ctx.stroke();
        ctx.restore();
      }
    }
    if (b.phase === 1 && b.state === 'elenaSlamWind') {
      const a = 0.2 + Math.sin(game.time * 14) * 0.08;
      ctx.fillStyle = `rgba(255, 118, 82, ${a})`;
      ctx.fillRect(ARENA_L, GROUND - 12, b.x - ARENA_L - 40, 12);
    }
  }

  function drawElenaLaser() {
    const b = boss;
    if (b.state !== 'elenaLaser' || !b.elenaLaserTargets || !b.elenaLaserTargets.length) return;
    const eye = elenaEyePos();
    const on = b.elenaLaserOn;
    for (const target of b.elenaLaserTargets) {
      ctx.save();
      if (on) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255, 90, 70, 0.35)';
        ctx.lineWidth = 26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(target.x, GROUND - 8);
        ctx.stroke();
        ctx.strokeStyle = '#ffd4b8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(target.x, GROUND - 8);
        ctx.stroke();
        const glow = ctx.createRadialGradient(target.x, GROUND - 8, 2, target.x, GROUND - 8, 48);
        glow.addColorStop(0, 'rgba(255, 236, 190, 0.8)');
        glow.addColorStop(1, 'rgba(255, 90, 60, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(target.x, GROUND - 8, 48, 0, TAU);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(255, 120, 90, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 9]);
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(target.x, GROUND - 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
    // свечение глаз
    if (on || b.state === 'elenaLaser') {
      for (const side of [-1, 1]) {
        const x = eye.x + side * 11;
        circle(ctx, x, eye.y, 6 + Math.sin(game.time * 24) * 1.5, '#ff9a7d', '#7d1e18', 1.6);
      }
    }
  }

  // ---------- отрисовка Elena Guryevna ----------
  function elenaFace(g, seated, t) {
    const headY = seated ? -196 : -208;
    // шея и белый воротник
    g.fillStyle = SKIN_SHADOW;
    g.fillRect(-9, headY + 28, 18, 14);
    g.beginPath();
    g.moveTo(-25, headY + 34);
    g.lineTo(0, headY + 52);
    g.lineTo(25, headY + 34);
    g.closePath();
    fillStroke(g, '#f4eddd', INK, 2.4);
    // голова
    circle(g, 0, headY, 34, SKIN, INK, 4);
    // рыжие короткие волосы
    g.beginPath();
    g.moveTo(-35, headY - 8);
    g.quadraticCurveTo(-44, headY - 52, -8, headY - 56);
    g.quadraticCurveTo(32, headY - 58, 38, headY - 16);
    g.quadraticCurveTo(30, headY - 33, 12, headY - 36);
    g.quadraticCurveTo(-12, headY - 40, -22, headY - 22);
    g.quadraticCurveTo(-28, headY - 8, -35, headY - 8);
    g.closePath();
    fillStroke(g, '#a9432f', INK, 3.4);
    g.fillStyle = 'rgba(255, 190, 140, 0.24)';
    g.beginPath();
    g.ellipse(-12, headY - 38, 14, 5, -0.35, 0, TAU);
    g.fill();
    // очки
    roundRect(g, -30, headY - 12, 23, 19, 6);
    fillStroke(g, 'rgba(220, 242, 235, 0.26)', '#332a24', 2.8);
    roundRect(g, 7, headY - 12, 23, 19, 6);
    fillStroke(g, 'rgba(220, 242, 235, 0.26)', '#332a24', 2.8);
    g.strokeStyle = '#332a24';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-7, headY - 3);
    g.lineTo(7, headY - 3);
    g.moveTo(-30, headY - 4);
    g.lineTo(-36, headY - 7);
    g.stroke();
    g.fillStyle = INK;
    g.beginPath();
    g.arc(-18, headY - 2, 2.2, 0, TAU);
    g.arc(19, headY - 2, 2.2, 0, TAU);
    g.fill();
    // брови
    g.strokeStyle = '#6d2a20';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-28, headY - 18);
    g.lineTo(-10, headY - 15);
    g.moveTo(9, headY - 15);
    g.lineTo(28, headY - 19);
    g.stroke();
    // нос и губы
    g.strokeStyle = 'rgba(95, 57, 44, 0.7)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-3, headY + 4);
    g.quadraticCurveTo(-6, headY + 12, 1, headY + 13);
    g.stroke();
    const mouthOpen =
      boss.state === 'elenaBreath' ||
      boss.state === 'elenaBreathWind' ||
      boss.state === 'elenaTeethWind' ||
      boss.state === 'elenaTeethRecover';
    g.fillStyle = '#8e2f2b';
    if (mouthOpen) {
      g.beginPath();
      g.ellipse(0, headY + 22, 9, 7 + Math.sin(t * 16) * 1.2, 0, 0, TAU);
      g.fill();
    } else {
      g.strokeStyle = '#8e2f2b';
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(-8, headY + 22);
      g.quadraticCurveTo(0, headY + 26, 8, headY + 22);
      g.stroke();
    }
    // серьги
    circle(g, -33, headY + 12, 2.6, GOLD_BRIGHT, INK, 1);
    circle(g, 33, headY + 12, 2.6, GOLD_BRIGHT, INK, 1);
  }

  function elenaBody(g, seated, t) {
    if (seated) {
      // стул
      g.fillStyle = '#6f4b2e';
      roundRect(g, -46, -104, 92, 18, 6);
      fillStroke(g, '#6f4b2e', INK, 2.8);
      roundRect(g, -44, -216, 16, 118, 6);
      fillStroke(g, '#6f4b2e', INK, 2.6);
      // ноги под столом
      g.strokeStyle = '#2b2b33';
      g.lineWidth = 18;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-12, -72);
      g.quadraticCurveTo(-46, -38, -58, -8);
      g.moveTo(12, -72);
      g.quadraticCurveTo(42, -38, 50, -8);
      g.stroke();
      g.strokeStyle = '#8a2f2a';
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(-58, -8);
      g.lineTo(-72, -5);
      g.moveTo(50, -8);
      g.lineTo(64, -5);
      g.stroke();
    } else {
      // ноги
      const run = Math.sin(t * 9) * (boss.state === 'elenaChase' || boss.state === 'elenaBull' ? 22 : 3);
      g.strokeStyle = '#2b2b33';
      g.lineWidth = 19;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-13, -78);
      g.lineTo(-18 + run * 0.4, -6);
      g.moveTo(13, -78);
      g.lineTo(18 - run * 0.4, -6);
      g.stroke();
      g.strokeStyle = '#8a2f2a';
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(-18 + run * 0.4, -5);
      g.lineTo(-30 + run * 0.4, -2);
      g.moveTo(18 - run * 0.4, -5);
      g.lineTo(30 - run * 0.4, -2);
      g.stroke();
      if (boss.elenaFootUp > 0.01) {
        const lift = boss.elenaFootUp * 62;
        g.strokeStyle = '#2b2b33';
        g.lineWidth = 19;
        g.beginPath();
        g.moveTo(13, -78);
        g.lineTo(40, -6 - lift);
        g.stroke();
        g.strokeStyle = '#8a2f2a';
        g.lineWidth = 12;
        g.beginPath();
        g.moveTo(40, -6 - lift);
        g.lineTo(58, -4 - lift);
        g.stroke();
      }
      // юбка
      g.beginPath();
      g.moveTo(-35, -150);
      g.lineTo(35, -150);
      g.lineTo(48, -70);
      g.lineTo(-48, -70);
      g.closePath();
      fillStroke(g, '#2b2b33', INK, 3.4);
    }
    // корпус: тёмный пиджак и белая блузка
    const torsoTop = seated ? -232 : -236;
    const torsoBottom = seated ? -104 : -140;
    g.beginPath();
    g.moveTo(-42, torsoTop);
    g.quadraticCurveTo(-58, torsoTop + 56, -46, torsoBottom);
    g.lineTo(46, torsoBottom);
    g.quadraticCurveTo(58, torsoTop + 56, 42, torsoTop);
    g.closePath();
    fillStroke(g, '#2b2b33', INK, 4);
    g.beginPath();
    g.moveTo(-23, torsoTop + 2);
    g.lineTo(0, torsoTop + 56);
    g.lineTo(23, torsoTop + 2);
    g.closePath();
    fillStroke(g, '#f4eddd', '#5a5147', 2);
    // красный платок
    g.beginPath();
    g.moveTo(-13, torsoTop + 48);
    g.lineTo(0, torsoTop + 64);
    g.lineTo(13, torsoTop + 48);
    g.closePath();
    fillStroke(g, '#a5332c', INK, 2);
    // пуговицы
    for (let i = 0; i < 3; i++) circle(g, 0, torsoTop + 90 + i * 22, 2.6, GOLD, INK, 1);
    // руки
    const throwing = boss.state === 'elenaMarkWind';
    const pencilThrow = boss.state === 'elenaPencilWind' || boss.state === 'elenaPencilThrow';
    const globeThrow = boss.state === 'elenaGlobeWind';
    const armUp = throwing || pencilThrow || globeThrow;
    const slamming = boss.state === 'elenaSlamWind';
    const journal = boss.state === 'elenaJournalWind';
    const punch = boss.state === 'elenaPunchWind' || boss.state === 'elenaPunchOut' || boss.state === 'elenaPunchHold' || boss.state === 'elenaPunchRecover';
    // левая рука (ближе к герою)
    g.strokeStyle = '#2b2b33';
    g.lineWidth = 20;
    g.beginPath();
    g.moveTo(-38, torsoTop + 36);
    if (slamming) {
      g.lineTo(-72, torsoTop + 116);
      g.lineTo(-58, torsoTop + 154);
    } else if (armUp) {
      g.lineTo(-72, torsoTop - 20);
      g.lineTo(-60, torsoTop - 58);
    } else if (journal) {
      g.lineTo(-86, torsoTop + 70);
    } else {
      g.lineTo(-62, torsoTop + 94);
    }
    g.stroke();
    // кисть
    const handX = slamming ? -58 : armUp ? -60 : journal ? -90 : -62;
    const handY = slamming ? torsoTop + 154 : armUp ? torsoTop - 58 : journal ? torsoTop + 70 : torsoTop + 94;
    circle(g, handX, handY, 9, SKIN, INK, 2.8);
    // красный журнал / двойка
    if (journal) {
      g.save();
      g.translate(handX - 4, handY - 4);
      g.rotate(-0.22);
      roundRect(g, -16, -22, 32, 44, 3);
      fillStroke(g, '#b5352c', INK, 2.4);
      g.fillStyle = '#f2dfb8';
      g.fillRect(-9, -12, 18, 4);
      g.fillRect(-9, -2, 14, 3);
      g.restore();
    }
    if (throwing) {
      g.save();
      g.translate(handX, handY - 4);
      g.rotate(0.12);
      roundRect(g, -15, -20, 30, 40, 3);
      fillStroke(g, '#ffe9cf', '#8f2a24', 2.2);
      g.fillStyle = '#c02f28';
      g.font = `900 22px ${FONT_DISPLAY}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('2', 0, 1);
      g.restore();
    }
    if (pencilThrow) {
      g.save();
      g.translate(handX, handY - 2);
      g.rotate(-0.22);
      for (let i = 0; i < 5; i++) {
        g.save();
        g.translate((i - 2) * 4.6, Math.abs(i - 2) * 1.6);
        roundRect(g, -3.2, -26, 6.4, 48, 2);
        fillStroke(g, i % 2 ? '#d94a35' : '#e0563c', INK, 1.5);
        g.beginPath();
        g.moveTo(-3.2, 22);
        g.lineTo(0, 34);
        g.lineTo(3.2, 22);
        g.closePath();
        fillStroke(g, '#f1d6a4', INK, 1.2);
        g.beginPath();
        g.moveTo(-1.4, 29);
        g.lineTo(0, 34);
        g.lineTo(1.4, 29);
        g.closePath();
        fillStroke(g, '#2c2734', INK, 0.9);
        roundRect(g, -3.2, -32, 6.4, 7, 2);
        fillStroke(g, '#efc3a0', INK, 1.2);
        g.restore();
      }
      roundRect(g, -15, -6, 30, 8, 3);
      fillStroke(g, '#3a3f56', INK, 1.6);
      g.restore();
    }
    if (globeThrow) {
      g.save();
      g.translate(handX - 2, handY - 18);
      g.rotate(0.2);
      circle(g, 0, 0, 15, '#5fa9c8', INK, 2.4);
      g.fillStyle = '#7bbf6a';
      g.beginPath();
      g.ellipse(-4, -3, 6, 4, -0.4, 0, TAU);
      g.fill();
      g.beginPath();
      g.ellipse(5, 4, 4, 5, 0.3, 0, TAU);
      g.fill();
      g.strokeStyle = '#c9a24a';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 0, 18, -0.3, Math.PI + 0.3);
      g.stroke();
      g.restore();
    }
    // правая рука
    g.strokeStyle = '#2b2b33';
    g.lineWidth = 20;
    g.beginPath();
    g.moveTo(38, torsoTop + 36);
    g.lineTo(58, torsoTop + 98);
    g.stroke();
    circle(g, 59, torsoTop + 101, 9, SKIN, INK, 2.8);
    // вытянутая рука-удар
    if (punch) {
      const p = boss.elenaPunchDist || 0;
      g.strokeStyle = '#2b2b33';
      g.lineWidth = 26;
      g.beginPath();
      g.moveTo(-38, torsoTop + 52);
      g.lineTo(-88 - p, -120);
      g.stroke();
      ellipsePath(g, -104 - p, -118, 34, 28);
      fillStroke(g, SKIN, INK, 3.4);
      g.fillStyle = '#f0c6aa';
      g.beginPath();
      g.ellipse(-118 - p, -122, 12, 9, -0.2, 0, TAU);
      g.fill();
    }
  }

  function drawElena() {
    const b = boss;
    const t = game.time;
    if (b.exploded) return;
    ctx.save();
    ctx.translate(b.x, GROUND);
    if (b.face > 0) ctx.scale(-1, 1);
    if (b.dying) {
      ctx.globalAlpha = clamp(1.2 - b.deathT / 2.2, 0.2, 1);
      ctx.rotate(clamp(b.deathT, 0, 1) * 0.5);
      ctx.translate(0, Math.min(80, b.deathT * 30));
    }
    if (b.phase === 2) {
      if (b.state === 'elenaBullWind') {
        ctx.rotate(-0.15 * (b.elenaChaseSpeed || 0));
      } else if (b.state === 'elenaBull') {
        ctx.rotate(-0.42);
        ctx.translate(0, 12);
      } else if (b.state === 'elenaStand') {
        const k = clamp(b.timer / 0.95, 0, 1);
        ctx.translate(0, (1 - k) * 90);
        ctx.scale(1, 0.6 + k * 0.4);
      }
    }
    const seated = b.phase === 1;
    const bob = Math.sin(t * 2.1 + b.breathe) * (seated ? 1.4 : 2.2);
    ctx.translate(0, bob);
    elenaBody(ctx, seated, t);
    elenaFace(ctx, seated, t);
    // указка в первой фазе
    if (seated && b.state === 'elenaSlamWind') {
      ctx.save();
      ctx.translate(-62, -230);
      ctx.rotate(-0.5 - Math.sin(t * 20) * 0.08);
      ctx.strokeStyle = '#7b4a25';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 96);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawElenaDeskPlatform(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    // столешница
    roundRect(ctx, -p.w / 2, -12, p.w, 18, 4);
    const wood = ctx.createLinearGradient(0, -14, 0, 8);
    wood.addColorStop(0, '#c3935c');
    wood.addColorStop(1, '#8e5f36');
    fillStroke(ctx, wood, INK, 3);
    ctx.fillStyle = 'rgba(255, 238, 196, 0.3)';
    ctx.fillRect(-p.w / 2 + 8, -9, p.w - 24, 3);
    // ножки
    ctx.fillStyle = '#674227';
    ctx.fillRect(-p.w / 2 + 12, 6, 8, 41);
    ctx.fillRect(p.w / 2 - 20, 6, 8, 41);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(-p.w / 2 + 12, 6, 8, 41);
    ctx.strokeRect(p.w / 2 - 20, 6, 8, 41);
    // стул сзади
    roundRect(ctx, -p.w / 2 - 26, -58, 34, 66, 6);
    fillStroke(ctx, '#8d6039', INK, 2.4);
    ctx.fillStyle = 'rgba(255, 235, 196, 0.2)';
    roundRect(ctx, -p.w / 2 - 21, -52, 24, 30, 4);
    ctx.fill();
    ctx.restore();
  }

  function drawElenaClassroom() {
    const t = game.time;
    const wall = ctx.createLinearGradient(0, 0, 0, GROUND);
    wall.addColorStop(0, '#d8c69f');
    wall.addColorStop(0.55, '#c6ad82');
    wall.addColorStop(1, '#a98b63');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, GROUND);
    // панель
    ctx.fillStyle = '#335e54';
    ctx.fillRect(0, 402, W, GROUND - 402);
    ctx.fillStyle = 'rgba(255, 244, 210, 0.15)';
    ctx.fillRect(0, 407, W, 4);
    // доска
    ctx.save();
    ctx.translate(500, 248);
    roundRect(ctx, -250, -148, 500, 296, 10);
    fillStroke(ctx, '#2f5a4a', '#253a31', 8);
    ctx.strokeStyle = 'rgba(238, 247, 231, 0.58)';
    ctx.lineWidth = 2.4;
    ctx.font = `700 18px ${FONT_DISPLAY}`;
    ctx.textAlign = 'left';
    ctx.fillText('КОНТРОЛЬНАЯ', -212, -94);
    ctx.font = `600 14px ${FONT_DISPLAY}`;
    ctx.fillText('1) 2 × 2 = ?', -212, -52);
    ctx.fillText('2) 3 × 3 = ?', -212, -14);
    ctx.fillText('3) СДАЙ ЖУРНАЛ', -212, 24);
    ctx.strokeStyle = 'rgba(238, 247, 231, 0.26)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-212, 54);
    ctx.lineTo(150, 54);
    ctx.stroke();
    // мел
    ctx.fillStyle = '#f1ecd9';
    roundRect(ctx, 130, 126, 37, 7, 3);
    ctx.fill();
    ctx.restore();
    // окна слева
    for (let i = 0; i < 2; i++) {
      const x = 132 + i * 152;
      roundRect(ctx, x - 56, 140, 112, 180, 5);
      fillStroke(ctx, '#9fd3dc', '#6c5739', 5);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 143);
      ctx.lineTo(x, 317);
      ctx.moveTo(x - 54, 230);
      ctx.lineTo(x + 54, 230);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 250, 220, 0.2)';
      ctx.beginPath();
      ctx.moveTo(x - 48, 146);
      ctx.lineTo(x - 8, 146);
      ctx.lineTo(x - 46, 314);
      ctx.lineTo(x - 54, 314);
      ctx.closePath();
      ctx.fill();
    }
    // шкаф
    roundRect(ctx, 858, 290, 160, 218, 6);
    fillStroke(ctx, '#7a5a3b', INK, 4);
    ctx.strokeStyle = 'rgba(30, 18, 12, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(938, 292);
    ctx.lineTo(938, 508);
    ctx.stroke();
    // пол
    const floor = ctx.createLinearGradient(0, GROUND, 0, H);
    floor.addColorStop(0, '#6b4d35');
    floor.addColorStop(1, '#3d291f');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.strokeStyle = 'rgba(255, 236, 200, 0.14)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const x = i * 88;
      ctx.beginPath();
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x - 48, H);
      ctx.stroke();
    }
    // дверь выхода слева
    roundRect(ctx, 0, 268, 108, 342, 4);
    fillStroke(ctx, '#4e3728', INK, 4);
    roundRect(ctx, 10, 280, 86, 320, 3);
    fillStroke(ctx, '#6b4b33', INK, 2.4);
    ctx.fillStyle = GOLD;
    circle(ctx, 82, 450, 4.5, GOLD, INK, 1.6);
    roundRect(ctx, 15, 236, 78, 24, 4);
    fillStroke(ctx, '#d9c49b', INK, 2);
    ctx.fillStyle = '#7b2a24';
    ctx.font = `900 12px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ВЫХОД', 54, 248);
    // журнал на учительском столе
    roundRect(ctx, 1008, 494, 70, 24, 4);
    fillStroke(ctx, '#b5352c', INK, 2.4);
    ctx.fillStyle = '#f0dfba';
    ctx.fillRect(1015, 499, 34, 5);
    // лёгкая тень и пыль
    ctx.fillStyle = 'rgba(255, 246, 210, 0.07)';
    for (let i = 0; i < 30; i++) {
      const x = (seeded(i * 3.1) * W + t * 8) % W;
      const y = 80 + seeded(i * 5.3) * 430;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, TAU);
      ctx.fill();
    }
  }

  function drawElenaHallway() {
    const t = game.time;
    const wall = ctx.createLinearGradient(0, 0, 0, GROUND);
    wall.addColorStop(0, '#cdbb98');
    wall.addColorStop(0.5, '#bda67f');
    wall.addColorStop(1, '#9d825d');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, GROUND);
    // панель
    ctx.fillStyle = '#3f6b5e';
    ctx.fillRect(0, 402, W, GROUND - 402);
    ctx.fillStyle = 'rgba(255, 244, 210, 0.15)';
    ctx.fillRect(0, 407, W, 4);
    // шкафчики
    for (let i = 0; i < 8; i++) {
      const x = 60 + i * 152;
      roundRect(ctx, x, 224, 132, 178, 4);
      fillStroke(ctx, i % 2 ? '#4f7b6f' : '#467065', '#2f443d', 3);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, 234);
      ctx.lineTo(x + 124, 234);
      ctx.moveTo(x + 66, 234);
      ctx.lineTo(x + 66, 398);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      circle(ctx, x + 58, 314, 3.2, GOLD, INK, 1.2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = `600 7px Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), x + 66, 254);
    }
    // двери классов
    for (let i = 0; i < 3; i++) {
      const x = 210 + i * 390;
      roundRect(ctx, x, 286, 122, 324, 4);
      fillStroke(ctx, '#5b3d2b', INK, 4);
      roundRect(ctx, x + 10, 298, 102, 302, 3);
      fillStroke(ctx, '#74513a', INK, 2);
      ctx.fillStyle = '#d8c399';
      roundRect(ctx, x + 33, 314, 56, 22, 3);
      ctx.fill();
      ctx.fillStyle = '#6e2a24';
      ctx.font = `900 10px ${FONT_DISPLAY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i === 1 ? '2-Б' : i === 0 ? '2-А' : '3-А', x + 61, 325);
      ctx.fillStyle = GOLD;
      circle(ctx, x + 101, 452, 4.2, GOLD, INK, 1.4);
    }
    // часы/лампа
    circle(ctx, 640, 100, 24, '#f3e8cb', '#6b5337', 3);
    ctx.strokeStyle = '#3c2c20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(640, 100);
    ctx.lineTo(640, 86);
    ctx.moveTo(640, 100);
    ctx.lineTo(652, 105);
    ctx.stroke();
    // пол
    const floor = ctx.createLinearGradient(0, GROUND, 0, H);
    floor.addColorStop(0, '#654832');
    floor.addColorStop(1, '#38251b');
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.strokeStyle = 'rgba(255, 236, 200, 0.14)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const x = i * 88;
      ctx.beginPath();
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x - 44, H);
      ctx.stroke();
    }
    // дальний свет в конце коридора
    const glow = ctx.createRadialGradient(1180, 280, 20, 1180, 280, 260);
    glow.addColorStop(0, 'rgba(255, 233, 171, 0.34)');
    glow.addColorStop(1, 'rgba(255, 233, 171, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(940, 60, 340, 500);
    ctx.fillStyle = 'rgba(255, 246, 210, 0.05)';
    for (let i = 0; i < 26; i++) {
      const x = (seeded(i * 4.2) * W + t * 10) % W;
      const y = 90 + seeded(i * 2.7) * 420;
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, TAU);
      ctx.fill();
    }
  }

  function drawElenaStage() {
    if (game.elenaArea === 'hallway') drawElenaHallway();
    else drawElenaClassroom();
    for (const p of platforms) {
      if (p.kind === 'elenaDesk') drawElenaDeskPlatform(p);
    }
    if (game.elenaArea === 'classroom' && game.elenaEscape) {
      // стрелка к выходу
      const a = 0.45 + Math.sin(game.time * 7) * 0.18;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.font = `900 42px ${FONT_DISPLAY}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('← ВЫХОД', 150, 214);
      ctx.restore();
    }
  }

  function drawElenaTeacherDesk() {
    const b = boss;
    const x = 1052;
    ctx.save();
    ctx.translate(x, GROUND);
    // стол учителя
    roundRect(ctx, -88, -142, 176, 20, 5);
    fillStroke(ctx, '#a9794a', INK, 3.4);
    ctx.fillStyle = 'rgba(255, 238, 196, 0.28)';
    ctx.fillRect(-76, -138, 144, 4);
    roundRect(ctx, -74, -122, 22, 122, 4);
    fillStroke(ctx, '#6c492c', INK, 2.4);
    roundRect(ctx, 52, -122, 22, 122, 4);
    fillStroke(ctx, '#6c492c', INK, 2.4);
    // стопка тетрадей
    for (let i = 0; i < 3; i++) {
      roundRect(ctx, -58, -158 - i * 9, 48, 9, 2);
      fillStroke(ctx, i % 2 ? '#d7e2c8' : '#ecd9b4', INK, 1.4);
    }
    // глобус
    circle(ctx, 46, -178, 25, '#7fb8c4', INK, 2.6);
    ctx.strokeStyle = 'rgba(48, 100, 110, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(46, -178, 11, 25, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(23, -178);
    ctx.lineTo(69, -178);
    ctx.stroke();
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(42, -154, 8, 10);
    ctx.restore();
  }

  function drawElenaAtmosphere() {
    // тёплый свет и пыль класса
    const light = ctx.createLinearGradient(0, 0, 0, GROUND);
    light.addColorStop(0, 'rgba(255, 240, 190, 0.06)');
    light.addColorStop(1, 'rgba(40, 18, 12, 0.04)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, GROUND);
    if (game.elenaArea === 'hallway' && boss.phase === 2) {
      const danger = ctx.createRadialGradient(W - 180, 380, 60, W - 180, 380, 700);
      danger.addColorStop(0, 'rgba(150, 40, 30, 0)');
      danger.addColorStop(1, 'rgba(150, 40, 30, 0.12)');
      ctx.fillStyle = danger;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawStage() {
    const school = game.bossId === 'denis';
    const egor = game.bossId === 'egor';
    const elena = game.bossId === 'elena';
    const nikita = game.bossId === 'nikita';
    const stepa = game.bossId === 'stepa';
    const floor3 = school && game.schoolFloor === 3;
    if (nikita) drawNikitaHallway();
    else if (stepa) drawStepaSkatePark();
    else if (elena) drawElenaStage();
    else if (egor) drawEgorForest();
    else if (floor3 && schoolFloor3BgCanvas) ctx.drawImage(schoolFloor3BgCanvas, 0, 0);
    else if (school && schoolBgCanvas) ctx.drawImage(schoolBgCanvas, 0, 0);
    else if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0);

    if (boss.phase >= 2 && game.scene !== 'menu' && !egor && !elena && !nikita && !stepa) {
      ctx.fillStyle = school ? 'rgba(37, 87, 76, 0.045)' : 'rgba(120, 30, 25, 0.045)';
      ctx.fillRect(0, 0, W, GROUND + 20);
    }

    if (nikita) {
      drawNikitaAtmosphere();
    } else if (stepa) {
      drawStepaAtmosphere();
    } else if (elena) {
      drawElenaAtmosphere();
    } else if (egor) {
      drawEgorAtmosphere();
    } else if (!school) {
      drawSpotlights();
    } else {
      if (floor3) drawThirdFloorAtmosphere();
      drawSchoolDesks();
      drawSchoolLight();
      drawSchoolCeilingBreak();
    }
    drawMotes();
    drawCraters();
    if (nikita || stepa) {
      drawNewBossWarnings();
    } else if (egor) {
      drawEgorWarnings();
    } else if (elena) {
      drawElenaWarnings();
    } else if (!school) {
      drawSlamWarning();
      drawPunchWarning();
      drawBellyWarning();
      drawScreamWarning();
      drawChalkWarning();
    } else {
      drawDenisWarnings();
    }

    if (!boss.exploded) {
      const shadowR = nikita ? 96 : stepa ? 82 : elena ? 80 : egor ? 120 : school ? 172 : boss.inChair ? 148 : 108;
      drawShadow(boss.x, GROUND, shadowR, boss.airY, 0.32);
    }
    if (!game.egorClouds) {
      drawShadow(hero.x, GROUND, 27, Math.max(0, GROUND - hero.y), 0.26);
    }

    drawBoss();
    if (elena && game.elenaArea === 'classroom') drawElenaTeacherDesk();
    drawArenaHazards();
    drawWaves();
    drawSoundWaves();
    drawWindCharges();
    drawBossShots();
    drawDenisBirds();
    drawGhosts();
    drawHero();
    if (egor && boss.phase === 2) drawEgorArm();
    drawParryPrompt();
    drawDenisLaser();
    if (elena) drawElenaLaser();
    drawBossPunchArm();
    drawBullets();
    drawTurrets();
    drawParticles();
    drawBossAlert();
    drawForeground();
  }

  // ---------- герой ----------
  function heroLimb(g, ax, ay, cx, cy, bx, by, color = CREAM, width = 7) {
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(ax, ay);
    g.quadraticCurveTo(cx, cy, bx, by);
    g.strokeStyle = INK;
    g.lineWidth = width + 5;
    g.stroke();
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }

  function heroGlove(g, x, y, r = 8) {
    circle(g, x, y, r, '#fff7e6', INK, 2.8);
    g.strokeStyle = 'rgba(86, 50, 32, 0.4)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(x, y + 1, r * 0.55, 0.25, Math.PI - 0.25);
    g.stroke();
  }

  function heroShoe(g, x, y) {
    g.save();
    g.translate(x, y);
    g.fillStyle = BROWN;
    roundRect(g, -6, -5, 20, 11, 4.5);
    fillStroke(g, BROWN, INK, 2.6);
    g.fillStyle = '#2c1a15';
    roundRect(g, -4, 3, 15, 3, 1.5);
    g.fill();
    g.fillStyle = 'rgba(255, 235, 200, 0.15)';
    g.beginPath();
    g.ellipse(6, -2, 5, 2, -0.1, 0, TAU);
    g.fill();
    g.restore();
  }

  function heroLeg(g, hipX, hipY, footX, footY, kneeBend = 0) {
    const kneeX = (hipX + footX) / 2 + kneeBend;
    const kneeY = (hipY + footY) / 2;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(hipX, hipY);
    g.quadraticCurveTo(kneeX, kneeY, footX, footY - 4);
    g.strokeStyle = INK;
    g.lineWidth = 10;
    g.stroke();
    g.strokeStyle = '#3b2a27';
    g.lineWidth = 5.5;
    g.stroke();
    heroShoe(g, footX, footY);
  }

  function drawHero() {
    const h = hero;
    const t = game.time;
    if (h.dead) {
      drawHeroDead();
      return;
    }
    if (h.smokeDashActive && h.smokeT > 0) return;

    const moving = h.onGround && Math.abs(h.vx) > 30 && h.dashT <= 0;
    const air = !h.onGround;
    const dash = h.dashT > 0;
    const hurt = h.hurtT > 0;
    const firing = h.shootAnim > 0.2 && !hurt;
    const victory = game.scene === 'win';
    const run = h.runT;
    const landK = h.landT > 0 ? h.landT / 0.14 : 0;

    ctx.save();
    if (h.invuln > 0 && !h.dead && Math.floor(t * 18) % 2 === 0) {
      ctx.globalAlpha = 0.48;
    }
    ctx.translate(h.x, h.y);
    ctx.scale(h.face, 1);

    // присед действительно виден: герой складывается почти вдвое
    const crouchK = clamp(h.crouchK, 0, 1);
    ctx.scale(1 + crouchK * 0.17, 1 - crouchK * 0.485);

    let bob = moving ? Math.abs(Math.sin(run * 2)) * 2 : Math.sin(t * 3) * 1.3;
    if (crouchK > 0.3) bob *= 0.25;
    if (air) bob = 0;
    if (dash) {
      ctx.rotate(-0.13);
      ctx.translate(5, 0);
    }
    if (hurt) ctx.rotate(Math.sin(t * 44) * 0.05);

    const sx = 1 + landK * 0.1;
    const sy = 1 - landK * 0.13;
    ctx.translate(0, bob);
    ctx.scale(sx, sy);

    // линии скорости
    if (dash) {
      ctx.save();
      ctx.globalAlpha = 0.36;
      ctx.strokeStyle = CREAM;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const y = -18 - i * 17;
        ctx.beginPath();
        ctx.moveTo(-26 - i * 7, y);
        ctx.lineTo(-52 - i * 12, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ноги
    let footA;
    let footB;
    if (air) {
      footA = { x: -11, y: -12 };
      footB = { x: 10, y: -16 };
    } else if (dash) {
      footA = { x: -19, y: -4 };
      footB = { x: -7, y: -2 };
    } else if (moving) {
      const s = Math.sin(run);
      const c = Math.cos(run);
      footA = { x: -7 + s * 11, y: -Math.max(0, c) * 7 };
      footB = { x: 5 - s * 11, y: -Math.max(0, -c) * 7 };
    } else {
      footA = { x: -8, y: -1 };
      footB = { x: 7, y: -1 };
    }
    heroLeg(ctx, -7, -27, footA.x, footA.y, -4);
    heroLeg(ctx, 7, -27, footB.x, footB.y, -4);

    // шарф-хвост сзади
    const flutter = Math.sin(t * 9 + 0.5) * 3 + (dash ? -8 : 0);
    ctx.beginPath();
    ctx.moveTo(-8, -55);
    ctx.bezierCurveTo(-22, -52 + flutter, -31, -44 + flutter, -35, -34 + flutter);
    ctx.bezierCurveTo(-28, -37, -23, -39 + flutter * 0.4, -16, -45);
    ctx.closePath();
    fillStroke(ctx, RED, INK, 2.6);

    // задняя рука
    if (victory) {
      heroLimb(ctx, -11, -46, -20, -62, -15, -78, CREAM, 6.5);
      heroGlove(ctx, -15, -80, 7.5);
    } else if (air) {
      heroLimb(ctx, -11, -46, -23, -56, -20, -68, CREAM, 6.5);
      heroGlove(ctx, -20, -70, 7);
    } else {
      const swing = moving ? Math.sin(run + Math.PI) * 8 : 0;
      heroLimb(ctx, -11, -46, -18, -40, -20 + swing * 0.4, -28 - Math.abs(swing) * 0.3, CREAM, 6.5);
      heroGlove(ctx, -20 + swing * 0.4, -28, 7);
    }

    // туловище
    ellipsePath(ctx, 0, -41, 15.5, 18);
    fillStroke(ctx, CREAM, INK, 4.2);

    // комбинезон
    ctx.fillStyle = TEAL;
    roundRect(ctx, -14, -40, 28, 21, 7);
    fillStroke(ctx, TEAL, INK, 3.4);
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -53);
    ctx.lineTo(-8, -40);
    ctx.moveTo(8, -53);
    ctx.lineTo(6, -40);
    ctx.stroke();
    circle(ctx, -8, -48, 2, GOLD, null, 0);
    circle(ctx, 6, -48, 2, GOLD, null, 0);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-12, -30);
    ctx.lineTo(11, -30);
    ctx.stroke();

    // воротник-шарф
    roundRect(ctx, -12, -57, 24, 6.5, 3);
    fillStroke(ctx, RED, INK, 2.6);

    // голова
    circle(ctx, 1, -72, 23, CREAM, INK, 4.2);
    circle(ctx, -20, -70, 5, CREAM, INK, 2.4);

    // волосы
    ctx.strokeStyle = '#5a3526';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-13, -89, 5, 0.6, 3.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-21, -78, 4, 1.5, 4.2);
    ctx.stroke();

    // глаза / лицо
    const blink = (t % 3.9) < 0.11;
    if (hurt) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.6;
      for (const eyeX of [5, 16]) {
        ctx.beginPath();
        ctx.moveTo(eyeX - 3, -80);
        ctx.lineTo(eyeX + 3, -74);
        ctx.moveTo(eyeX + 3, -80);
        ctx.lineTo(eyeX - 3, -74);
        ctx.stroke();
      }
      ellipsePath(ctx, 12, -60, 4.5, 5.5);
      fillStroke(ctx, '#5a2a26', INK, 2);
      ctx.fillStyle = '#e48a7c';
      ctx.beginPath();
      ctx.ellipse(12, -57.5, 2.6, 1.7, 0, 0, TAU);
      ctx.fill();
    } else {
      if (blink) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(2, -75);
        ctx.lineTo(8, -75);
        ctx.moveTo(13, -74);
        ctx.lineTo(19, -74);
        ctx.stroke();
      } else {
        for (const eye of [{ x: 5, y: -76 }, { x: 16, y: -75 }]) {
          ellipsePath(ctx, eye.x, eye.y, 3.4, 5);
          fillStroke(ctx, INK, null, 0);
          ctx.fillStyle = WHITE;
          ctx.beginPath();
          ctx.arc(eye.x + 1, eye.y - 1.8, 1.2, 0, TAU);
          ctx.fill();
        }
      }
      // брови
      ctx.strokeStyle = '#5a3526';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      if (firing) {
        ctx.moveTo(2, -84);
        ctx.lineTo(8, -82);
        ctx.moveTo(14, -82);
        ctx.lineTo(19, -84);
      } else {
        ctx.moveTo(2, -83);
        ctx.lineTo(8, -84);
        ctx.moveTo(14, -83);
        ctx.lineTo(19, -82);
      }
      ctx.stroke();
      // нос
      ellipsePath(ctx, 21, -67, 4.2, 3.5);
      fillStroke(ctx, '#dd9a72', INK, 2);
      // улыбка
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      if (firing || victory) {
        ctx.arc(12, -63, 5.5, 0.15, Math.PI - 0.15);
      } else {
        ctx.arc(12, -64, 4.5, 0.2, Math.PI - 0.3);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(201, 90, 70, 0.18)';
      ctx.beginPath();
      ctx.ellipse(23, -64, 3.6, 2.2, 0, 0, TAU);
      ctx.fill();
    }

    // феска
    ctx.save();
    ctx.translate(2, -94);
    ctx.rotate(-0.1 + Math.sin(t * 3) * 0.02);
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(14, 0);
    ctx.lineTo(10, -17);
    ctx.lineTo(-5, -17);
    ctx.closePath();
    fillStroke(ctx, RED, INK, 2.8);
    ctx.fillStyle = GOLD;
    ctx.fillRect(-9, -4, 22, 3);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(6, -17);
    ctx.quadraticCurveTo(13, -19, 15, -13 + Math.sin(t * 8) * 2);
    ctx.stroke();
    circle(ctx, 15, -12 + Math.sin(t * 8) * 2, 2.2, GOLD, INK, 1.4);
    ctx.restore();

    // передняя рука
    if (victory) {
      heroLimb(ctx, 11, -46, 22, -62, 20, -82, CREAM, 6.5);
      heroGlove(ctx, 20, -85, 8);
      starPath(ctx, 31, -96, 4, 7, 2, game.time);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.fill();
    } else if (firing) {
      const recoil = h.shootAnim * 2;
      const aimAng = Math.atan2(h.aimY || 0, (h.aimX || 1) * (h.face || 1));
      ctx.save();
      ctx.translate(11, -47);
      ctx.rotate(aimAng);
      heroLimb(ctx, 0, 0, 11, -4, 23 - recoil, -5, CREAM, 6.5);
      heroGlove(ctx, 25 - recoil, -5, 7.2);
      if (h.shootAnim > 0.35) {
        ctx.save();
        ctx.translate(34 - recoil, -5);
        ctx.rotate(t * 12);
        starPath(ctx, 0, 0, 5, 9 + h.shootAnim * 5, 3.5, -Math.PI / 2);
        fillStroke(ctx, GOLD_BRIGHT, INK, 2);
        ctx.restore();
      }
      ctx.restore();
    } else if (air) {
      heroLimb(ctx, 11, -46, 21, -57, 20, -69, CREAM, 6.5);
      heroGlove(ctx, 20, -71, 7);
    } else {
      const swing = moving ? Math.sin(run) * 8 : 0;
      heroLimb(ctx, 11, -46, 17, -40, 20 + swing * 0.4, -28 - Math.abs(swing) * 0.35, CREAM, 6.5);
      heroGlove(ctx, 20 + swing * 0.4, -28, 7);
    }

    // маленькие искры при победе
    if (victory && Math.random() < 0.1) {
      addParticle({
        kind: 'spark',
        x: h.x + rand(-30, 30),
        y: h.y - rand(40, 110),
        vx: rand(-30, 30),
        vy: rand(-80, -20),
        life: rand(0.3, 0.6),
        maxLife: 0.6,
        size: rand(2, 5),
        color: GOLD_BRIGHT,
        rot: rand(0, TAU),
        vr: rand(-6, 6),
        grav: 80,
        drag: 0.4,
      });
    }

    ctx.restore();
  }

  function drawHeroDead() {
    const h = hero;
    const t = game.time;
    ctx.save();
    ctx.translate(h.x, GROUND);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(38, -4);
    ctx.scale(1, 1);

    // тень
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#3a2118';
    ctx.beginPath();
    ctx.ellipse(0, 4, 54, 11, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ноги
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.lineTo(-32, -4);
    ctx.stroke();
    ctx.strokeStyle = '#3b2a27';
    ctx.lineWidth = 5;
    ctx.stroke();
    heroShoe(ctx, -36, -2);

    // туловище
    ellipsePath(ctx, 0, -12, 17, 15);
    fillStroke(ctx, CREAM, INK, 4);
    ctx.fillStyle = TEAL;
    roundRect(ctx, -13, -18, 26, 16, 6);
    fillStroke(ctx, TEAL, INK, 3);

    // голова
    circle(ctx, 25, -16, 21, CREAM, INK, 4);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    for (const eyeX of [20, 30]) {
      ctx.beginPath();
      ctx.moveTo(eyeX - 3, -21);
      ctx.lineTo(eyeX + 3, -15);
      ctx.moveTo(eyeX + 3, -21);
      ctx.lineTo(eyeX - 3, -15);
      ctx.stroke();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(27, -9, 4, Math.PI + 0.2, 0.4);
    ctx.stroke();

    // феска на земле
    ctx.save();
    ctx.translate(-40, -4);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(12, 0);
    ctx.lineTo(8, -15);
    ctx.lineTo(-4, -15);
    ctx.closePath();
    fillStroke(ctx, RED, INK, 2.4);
    ctx.restore();

    // нимб
    if (h.deadT > 0.45) {
      const a = clamp((h.deadT - 0.45) / 0.4, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * (0.7 + Math.sin(t * 3) * 0.15);
      ctx.strokeStyle = GOLD_BRIGHT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(22, -52, 17, 5.5, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // звёздочки над головой
    if (h.deadT < 2) {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.2 + (i / 3) * TAU;
        const x = 24 + Math.cos(a) * 27;
        const y = -50 + Math.sin(a) * 7;
        starPath(ctx, x, y, 4, 4.5, 1.5, a);
        ctx.fillStyle = GOLD_BRIGHT;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- босс ----------
  function bossBodyPath(g, bulge) {
    const wb = 1 + bulge;
    g.beginPath();
    g.moveTo(-70, -206);
    g.bezierCurveTo(-126 * wb, -188, -148 * wb, -112, -124 * wb, -62);
    g.bezierCurveTo(-110 * wb, -38, -72, -29, -44, -28);
    g.bezierCurveTo(-18, -27, 18, -27, 44, -28);
    g.bezierCurveTo(72, -29, 110 * wb, -38, 126 * wb, -64);
    g.bezierCurveTo(150 * wb, -114, 126 * wb, -188, 68, -207);
    g.closePath();
  }

  function drawBossLegs(g, tuck) {
    const lift = tuck ? 14 : 0;
    g.lineCap = 'round';
    for (const leg of [
      { hip: -46, ankle: -58, lift: lift + 4 },
      { hip: 44, ankle: 56, lift },
    ]) {
      g.beginPath();
      g.moveTo(leg.hip, -44);
      g.quadraticCurveTo(leg.ankle - 4, -28, leg.ankle, -16 - leg.lift * 0.15);
      g.strokeStyle = INK;
      g.lineWidth = 42;
      g.stroke();
      g.strokeStyle = PLUM_DARK;
      g.lineWidth = 30;
      g.stroke();
      g.strokeStyle = 'rgba(255, 190, 140, 0.08)';
      g.lineWidth = 4;
      g.stroke();
    }

    // сапоги
    for (const boot of [
      { x: -58, dir: -1, lift: lift + 4 },
      { x: 56, dir: 1, lift },
    ]) {
      g.save();
      g.translate(boot.x, -10 - boot.lift);
      g.fillStyle = '#3d2a20';
      g.beginPath();
      g.moveTo(-30, 2);
      g.bezierCurveTo(-34, -14, -16, -23, 6, -22);
      g.bezierCurveTo(28, -21, 36, -12, 34, 0);
      g.closePath();
      fillStroke(g, '#3d2a20', INK, 4.5);
      g.fillStyle = '#5b3d2c';
      g.beginPath();
      g.ellipse(boot.dir * 16, -9, 13, 8, -0.2, 0, TAU);
      g.fill();
      g.fillStyle = GOLD;
      roundRect(g, -12, -17, 12, 5, 2);
      g.fill();
      g.strokeStyle = 'rgba(20, 9, 8, 0.35)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-20, -2);
      g.lineTo(24, -2);
      g.stroke();
      g.restore();
    }
  }

  function drawBossGlove(g, x, y, angle, scale = 1, glow = 0) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(scale, scale);

    if (glow > 0) {
      const glowGrad = g.createRadialGradient(0, 0, 6, 0, 0, 58);
      glowGrad.addColorStop(0, `rgba(255, 196, 96, ${0.3 * glow})`);
      glowGrad.addColorStop(1, 'rgba(255, 196, 96, 0)');
      g.fillStyle = glowGrad;
      g.beginPath();
      g.arc(0, 0, 58, 0, TAU);
      g.fill();
    }

    // манжета
    roundRect(g, -39, -17, 20, 34, 8);
    fillStroke(g, CREAM, INK, 3.5);
    g.strokeStyle = 'rgba(90, 52, 30, 0.3)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-31, -15);
    g.lineTo(-31, 15);
    g.stroke();

    // перчатка
    ellipsePath(g, 6, 0, 33, 27);
    fillStroke(g, RUST, INK, 4.5);
    ellipsePath(g, -1, 20, 13, 10, -0.35);
    fillStroke(g, RUST, INK, 3.5);
    g.fillStyle = 'rgba(255, 222, 176, 0.22)';
    g.beginPath();
    g.ellipse(2, -10, 17, 8, -0.25, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(72, 28, 24, 0.4)';
    g.lineWidth = 2;
    g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(12, -5 + i * 7, 9, -0.9, 0.4);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255, 240, 210, 0.2)';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(8, 0, 20, -2.2, -1.1);
    g.stroke();
    g.restore();
  }

  function drawBossArm(g, sx, sy, gx, gy, opts = {}) {
    const bendX = opts.bendX || 0;
    const bendY = opts.bendY || 0;
    const cx = lerp(sx, gx, 0.5) + bendX;
    const cy = lerp(sy, gy, 0.5) + bendY;
    const width = opts.width || 22;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(cx, cy, gx, gy);
    g.strokeStyle = INK;
    g.lineWidth = width + 12;
    g.stroke();
    g.strokeStyle = PLUM;
    g.lineWidth = width;
    g.stroke();
    g.strokeStyle = 'rgba(255, 190, 150, 0.07)';
    g.lineWidth = 5;
    g.stroke();
    drawBossGlove(
      g,
      gx,
      gy,
      Math.atan2(gy - sy, gx - sx),
      opts.gloveScale || 1,
      opts.glow || 0
    );
  }

  function bossArmTargets(pose, t, bob) {
    const sway = Math.sin(t * 1.7) * 5;
    const targets = {
      idle: {
        rear: { x: -146 + sway * 0.4, y: -72 + sway * 0.3, bx: -18, by: 8 },
        front: { x: 148 - sway * 0.3, y: -84 - sway * 0.4, bx: 16, by: 5 },
      },
      up: {
        rear: { x: -166, y: -224 + sway, bx: -22, by: -6 },
        front: { x: 170, y: -214 - sway, bx: 22, by: -8 },
      },
      flail: {
        rear: { x: -180, y: -162 + sway, bx: -18, by: -18 },
        front: { x: 184, y: -238 - sway, bx: 20, by: -10 },
      },
      out: {
        rear: { x: -178, y: -98, bx: -16, by: 12 },
        front: { x: 180, y: -108, bx: 16, by: 12 },
      },
      cock: {
        rear: { x: -122, y: -112, bx: -16, by: 12 },
        front: { x: 58, y: -154 - sway * 0.3, bx: 34, by: 18 },
      },
      brace: {
        rear: { x: -120, y: -108, bx: -12, by: 10 },
        front: null,
      },
      flex: {
        rear: { x: -158, y: -222 + Math.sin(t * 8) * 4, bx: -24, by: -3 },
        front: { x: 162, y: -216 - Math.sin(t * 8) * 4, bx: 24, by: -3 },
      },
      droop: {
        rear: { x: -154, y: -38, bx: -20, by: 16 },
        front: { x: 156, y: -34, bx: 20, by: 16 },
      },
    };
    const p = targets[pose] || targets.idle;
    return {
      rear: { ...p.rear, y: p.rear.y + bob },
      front: p.front ? { ...p.front, y: p.front.y + bob } : null,
    };
  }

  function drawBossHead(g, expr, t, hatOn, phase) {
    g.save();
    g.translate(0, -238);
    const tilt =
      Math.sin(t * 1.5) * 0.018 +
      (expr === 'rage' ? Math.sin(t * 22) * 0.03 : 0) +
      (expr === 'dead' ? Math.sin(t * 15) * 0.06 : 0);
    g.rotate(tilt);

    // шея и подбородок
    g.fillStyle = 'rgba(68, 25, 34, 0.35)';
    g.beginPath();
    g.ellipse(0, 46, 41, 12, 0, 0, TAU);
    g.fill();

    // уши
    circle(g, -50, -2, 12, CREAM, INK, 3.5);
    circle(g, 52, -3, 13, CREAM, INK, 3.5);
    circle(g, -50, -2, 5, 'rgba(201, 128, 100, 0.5)', null, 0);
    circle(g, 52, -3, 5, 'rgba(201, 128, 100, 0.5)', null, 0);

    // золотая серьга
    g.strokeStyle = GOLD;
    g.lineWidth = 2.8;
    g.beginPath();
    g.arc(58, 16, 9, -0.2, Math.PI + 0.4);
    g.stroke();
    g.strokeStyle = 'rgba(38, 20, 25, 0.5)';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(58, 16, 9, -0.2, Math.PI + 0.4);
    g.stroke();

    // рога (видны без шляпы)
    if (!hatOn) {
      g.save();
      g.fillStyle = PLUM;
      g.strokeStyle = INK;
      g.lineWidth = 4;
      for (const horn of [
        { x: -34, y: -40, rot: -0.45 },
        { x: 22, y: -48, rot: 0.25 },
      ]) {
        g.save();
        g.translate(horn.x, horn.y);
        g.rotate(horn.rot);
        g.beginPath();
        g.moveTo(-8, 10);
        g.bezierCurveTo(-5, -12, 4, -24, 12, -28);
        g.bezierCurveTo(10, -14, 9, 1, 8, 10);
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
      }
      g.restore();
    }

    // голова
    circle(g, 0, 0, 52, CREAM, INK, 5.5);
    // блик
    g.fillStyle = 'rgba(255, 252, 235, 0.26)';
    g.beginPath();
    g.ellipse(-18, -24, 22, 14, -0.5, 0, TAU);
    g.fill();

    const glow = expr === 'rage';
    if (glow) {
      const aura = g.createRadialGradient(0, 4, 8, 0, 4, 46);
      aura.addColorStop(0, 'rgba(255, 205, 90, 0.22)');
      aura.addColorStop(1, 'rgba(255, 205, 90, 0)');
      g.fillStyle = aura;
      g.fillRect(-52, -44, 104, 96);
    }

    // глаза
    if (expr === 'dead') {
      g.strokeStyle = INK;
      g.lineWidth = 4;
      g.lineCap = 'round';
      for (const eye of [
        { x: 4, y: -14, s: 8 },
        { x: 32, y: -16, s: 7 },
      ]) {
        g.beginPath();
        g.moveTo(eye.x - eye.s, eye.y - eye.s);
        g.lineTo(eye.x + eye.s, eye.y + eye.s);
        g.moveTo(eye.x + eye.s, eye.y - eye.s);
        g.lineTo(eye.x - eye.s, eye.y + eye.s);
        g.stroke();
      }
      // язык
      g.fillStyle = '#d77874';
      g.strokeStyle = INK;
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(30, 33, 11, 8, 0.2, 0, TAU);
      g.fill();
      g.stroke();
    } else {
      const angry = expr === 'angry' || expr === 'rage' || expr === 'dizzy';
      for (const eye of [
        { x: 4, y: -14, rx: 8, ry: 10 },
        { x: 32, y: -16, rx: 7, ry: 9 },
      ]) {
        if (glow) {
          ellipsePath(g, eye.x, eye.y, eye.rx + 6, eye.ry + 6);
          fillStroke(g, 'rgba(255, 207, 100, 0.32)', null, 0);
        }
        ellipsePath(g, eye.x, eye.y, eye.rx, eye.ry);
        fillStroke(g, inkEyeColor(expr), null, 0);
        if (glow) {
          ellipsePath(g, eye.x, eye.y, 4.5, 5);
          fillStroke(g, GOLD_BRIGHT, null, 0);
        } else {
          g.fillStyle = WHITE;
          g.beginPath();
          g.arc(eye.x - 2, eye.y - 3, 1.8, 0, TAU);
          g.fill();
        }
      }
      // брови
      g.strokeStyle = INK;
      g.lineWidth = 6.5;
      g.lineCap = 'round';
      g.beginPath();
      if (angry) {
        g.moveTo(-6, -32);
        g.lineTo(10, -25);
        g.moveTo(23, -27);
        g.lineTo(39, -35);
      } else {
        g.moveTo(-5, -30);
        g.lineTo(9, -33);
        g.moveTo(24, -34);
        g.lineTo(39, -31);
      }
      g.stroke();
    }

    // нос
    ellipsePath(g, 40, 12, 16, 13);
    fillStroke(g, '#d88f68', INK, 4);
    g.fillStyle = 'rgba(255, 238, 210, 0.35)';
    g.beginPath();
    g.ellipse(35, 6, 6, 4, -0.4, 0, TAU);
    g.fill();

    // румянец
    g.fillStyle = 'rgba(182, 77, 58, 0.18)';
    g.beginPath();
    g.ellipse(0, 22, 10, 6, 0, 0, TAU);
    g.fill();
    g.beginPath();
    g.ellipse(56, 20, 9, 5, 0, 0, TAU);
    g.fill();

    // усы
    g.strokeStyle = INK;
    g.lineWidth = 9;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(8, 25);
    g.bezierCurveTo(22, 34, 40, 36, 50, 27);
    g.bezierCurveTo(58, 20, 66, 25, 64, 32);
    g.moveTo(12, 25);
    g.bezierCurveTo(2, 31, -10, 29, -16, 21);
    g.stroke();

    // рот
    g.strokeStyle = INK;
    g.lineWidth = 3.2;
    if (expr === 'angry' || expr === 'rage') {
      g.beginPath();
      g.ellipse(29, 40, 19, expr === 'rage' ? 15 : 11, 0.05, 0, TAU);
      fillStroke(g, '#4a1a20', INK, 3);
      g.fillStyle = CREAM;
      g.beginPath();
      g.moveTo(13, 32);
      g.quadraticCurveTo(29, 29, 45, 33);
      g.quadraticCurveTo(33, 36, 13, 32);
      g.fill();
      if (expr === 'rage') {
        g.fillStyle = '#c56a63';
        g.beginPath();
        g.ellipse(29, 47, 9, 6, 0, 0, TAU);
        g.fill();
      }
    } else if (expr === 'dead') {
      g.beginPath();
      g.arc(29, 34, 9, Math.PI + 0.3, 0.2);
      g.stroke();
    } else {
      g.beginPath();
      g.arc(27, 33, 10, 0.15, Math.PI - 0.2);
      g.stroke();
      g.fillStyle = 'rgba(255, 248, 235, 0.7)';
      g.beginPath();
      g.ellipse(29, 40, 6, 2.2, 0, 0, TAU);
      g.fill();
    }

    // шляпа
    if (hatOn) {
      g.save();
      g.translate(-2, -47);
      g.rotate(-0.05);
      g.fillStyle = TEAL;
      g.strokeStyle = INK;
      g.lineWidth = 4.5;
      g.beginPath();
      g.ellipse(0, 0, 61, 14, 0, 0, TAU);
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(-43, 0);
      g.bezierCurveTo(-45, -38, -15, -48, 16, -46);
      g.bezierCurveTo(40, -44, 44, -26, 43, 0);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = GOLD;
      g.beginPath();
      g.moveTo(-40, -8);
      g.bezierCurveTo(-18, -14, 20, -15, 41, -8);
      g.lineTo(41, -2);
      g.bezierCurveTo(17, -9, -18, -8, -41, -2);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(255, 230, 160, 0.25)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-20, -38);
      g.bezierCurveTo(0, -43, 18, -40, 28, -32);
      g.stroke();
      g.restore();
    }

    // звёзды при смерти
    if (expr === 'dead') {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.4 + (i / 3) * TAU;
        starPath(g, 4 + Math.cos(a) * 40, -50 + Math.sin(a) * 12, 4, 5, 1.8, a);
        g.fillStyle = GOLD_BRIGHT;
        g.fill();
      }
    }
    g.restore();
  }

  function inkEyeColor(expr) {
    return expr === 'rage' ? '#3a1114' : INK;
  }

  // ---------- Летунов: фото в кресле и вставший великан ----------
  function drawBossWheel(g, x, y, r, spin, alpha = 1) {
    g.save();
    g.translate(x, y);
    g.rotate(spin);
    g.globalAlpha *= alpha;
    circle(g, 0, 0, r, '#2a1712', INK, 4);
    circle(g, 0, 0, r * 0.72, '#9b6734', INK, 2.4);
    g.strokeStyle = '#3b2318';
    g.lineWidth = 3.4;
    g.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      g.beginPath();
      g.moveTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22);
      g.lineTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66);
      g.stroke();
    }
    circle(g, 0, 0, r * 0.24, GOLD, INK, 2.5);
    circle(g, 0, 0, r * 0.09, '#5b351d', null, 0);
    g.strokeStyle = 'rgba(255, 235, 190, 0.25)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, r * 0.86, -2.4, -0.55);
    g.stroke();
    g.restore();
  }

  function drawLeopardPanel(g, build, seed) {
    const grad = g.createLinearGradient(0, -340, 0, 25);
    grad.addColorStop(0, '#e0b06c');
    grad.addColorStop(0.5, '#d3a05e');
    grad.addColorStop(1, '#b57d43');
    g.save();
    build(g);
    g.fillStyle = grad;
    g.fill();
    g.save();
    build(g);
    g.clip();
    for (let i = 0; i < 54; i++) {
      const x = -172 + seeded(seed + i * 1.91) * 344;
      const y = -338 + seeded(seed + i * 3.17 + 7) * 360;
      const rx = 5.5 + seeded(seed + i * 5.3 + 2) * 7.5;
      const ry = 4 + seeded(seed + i * 7.7 + 4) * 6;
      const rot = seeded(seed + i * 2.3) * TAU;
      g.beginPath();
      g.ellipse(x, y, rx, ry, rot, 0, TAU);
      g.strokeStyle = 'rgba(66, 38, 20, 0.62)';
      g.lineWidth = 2.2;
      g.stroke();
      g.fillStyle = 'rgba(74, 42, 22, 0.16)';
      g.fill();
      g.strokeStyle = 'rgba(255, 241, 207, 0.2)';
      g.lineWidth = 1;
      g.beginPath();
      g.ellipse(x - rx * 0.14, y - ry * 0.18, rx * 0.72, ry * 0.7, rot, 0, TAU);
      g.stroke();
    }
    g.restore();
    build(g);
    g.strokeStyle = INK;
    g.lineWidth = 5;
    g.stroke();
    g.restore();
  }

  function drawChairVector(g, spin = 0) {
    // деревянные ножки
    g.strokeStyle = INK;
    g.lineWidth = 12;
    g.lineCap = 'round';
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 88, -53);
      g.quadraticCurveTo(side * 104, -25, side * 97, -10);
      g.stroke();
    }
    g.strokeStyle = '#5a3520';
    g.lineWidth = 7;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 88, -53);
      g.quadraticCurveTo(side * 104, -25, side * 97, -10);
      g.stroke();
    }
    // Колёса кресла — именно они разлетаются при прыжке.
    for (const side of [-1, 1]) {
      drawBossWheel(g, side * 97, -2, 16, spin + (side > 0 ? 0.7 : 0), 1);
    }

    // высокая спинка
    drawLeopardPanel(g, (gg) => roundRect(gg, -121, -321, 242, 218, 58), 4.3);
    // боковые «крылья»
    drawLeopardPanel(g, (gg) => roundRect(gg, -162, -249, 62, 174, 30), 19.4);
    drawLeopardPanel(g, (gg) => roundRect(gg, 100, -249, 62, 174, 30), 34.1);
    // сиденье
    drawLeopardPanel(g, (gg) => roundRect(gg, -131, -137, 262, 103, 28), 47.8);

    // подушка
    g.save();
    const cushion = g.createLinearGradient(0, -131, 0, -64);
    cushion.addColorStop(0, '#7d394d');
    cushion.addColorStop(1, '#542335');
    roundRect(g, -100, -130, 200, 63, 21);
    fillStroke(g, cushion, INK, 4);
    for (let i = -1; i <= 1; i++) {
      circle(g, i * 56, -99, 3, GOLD, INK, 1.2);
    }
    g.strokeStyle = 'rgba(255, 218, 186, 0.18)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-82, -121);
    g.quadraticCurveTo(0, -126, 84, -118);
    g.stroke();
    g.restore();

    // золотая окантовка
    g.strokeStyle = 'rgba(240, 200, 119, 0.75)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-118, -302);
    g.quadraticCurveTo(0, -323, 118, -302);
    g.stroke();

    // герб на спинке
    g.save();
    g.translate(0, -258);
    starPath(g, 0, 0, 8, 20, 12, -Math.PI / 2);
    fillStroke(g, 'rgba(91, 47, 26, 0.7)', GOLD, 2);
    circle(g, 0, 0, 4.5, GOLD_BRIGHT, INK, 1.5);
    g.restore();

    // бахрома под сиденьем
    g.fillStyle = '#b88546';
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    for (let i = -5; i <= 5; i++) {
      const x = i * 22;
      g.beginPath();
      g.moveTo(x - 8, -38);
      g.lineTo(x, -17 + Math.abs(i) * 1.6);
      g.lineTo(x + 8, -38);
      g.closePath();
      g.fill();
      g.stroke();
    }
  }

  function drawChairCannons(g, b) {
    const k = clamp(b.cannonK, 0, 1);
    if (k <= 0.015) return;
    const t = game.time;
    for (const side of [-1, 1]) {
      const rise = (1 - k) * 54;
      g.save();
      g.translate(side * 152, -112 + rise);
      // крепление к креслу
      circle(g, 0, 18, 17, '#7a4a2b', INK, 3.4);
      circle(g, 0, 18, 9, GOLD, INK, 2);
      // ствол вверх
      roundRect(g, -13, -86, 26, 100, 7);
      fillStroke(g, '#5d413a', INK, 3.6);
      g.fillStyle = GOLD;
      g.fillRect(-15, -68, 30, 8);
      g.fillRect(-15, -22, 30, 8);
      roundRect(g, -17, -96, 34, 14, 4);
      fillStroke(g, '#78524a', INK, 2.6);
      // дуло
      circle(g, 0, -94, 9, '#2b1a18', INK, 2.4);
      // блик
      g.strokeStyle = 'rgba(255, 238, 198, 0.28)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-8, -78);
      g.lineTo(-8, -34);
      g.stroke();
      // вспышка выстрела
      if (b.cannonFlash > 0) {
        const f = b.cannonFlash;
        g.save();
        g.globalCompositeOperation = 'lighter';
        const flame = g.createRadialGradient(0, -100, 2, 0, -118, 46 * f + 12);
        flame.addColorStop(0, 'rgba(255, 253, 226, 0.95)');
        flame.addColorStop(0.4, 'rgba(255, 209, 107, 0.75)');
        flame.addColorStop(1, 'rgba(255, 140, 48, 0)');
        g.fillStyle = flame;
        g.beginPath();
        g.arc(0, -116, 46 * f + 12, 0, TAU);
        g.fill();
        g.restore();
        g.fillStyle = GOLD_BRIGHT;
        for (let i = 0; i < 3; i++) {
          const a = -Math.PI / 2 + (i - 1) * 0.38 + Math.sin(t * 30 + i) * 0.05;
          const d = 18 + f * 28 + i * 12;
          g.beginPath();
          g.arc(Math.cos(a) * d, -98 + Math.sin(a) * d, 3.4 - i * 0.5, 0, TAU);
          g.fill();
        }
      }
      g.restore();
    }
  }

  function drawSeatedFallback(g, b, t) {
    g.save();
    g.translate(0, 2);
    drawChairVector(g, b.wheelT);
    // Та же модель, что встаёт во второй фазе, только сидит в кресле.
    g.save();
    g.translate(0, -96);
    const breathe = Math.sin(t * 1.7 + b.breathe) * 1.5;
    g.translate(0, breathe);
    // ноги
    roundRect(g, -78, -74, 60, 88, 22);
    fillStroke(g, DENIM, INK, 4);
    roundRect(g, 18, -74, 60, 88, 22);
    fillStroke(g, DENIM, INK, 4);
    // пиджак
    g.beginPath();
    g.moveTo(-100, -215);
    g.bezierCurveTo(-124, -170, -113, -90, -73, -73);
    g.lineTo(73, -73);
    g.bezierCurveTo(113, -90, 124, -170, 100, -215);
    g.quadraticCurveTo(0, -246, -100, -215);
    g.closePath();
    fillStroke(g, SUIT_BLUE, INK, 5);
    // рубашка и пузо
    ellipsePath(g, 0, -140, 82, 88);
    fillStroke(g, SHIRT_MINT, INK, 4.5);
    g.fillStyle = 'rgba(255, 255, 255, 0.16)';
    g.beginPath();
    g.ellipse(-24, -177, 29, 17, -0.4, 0, TAU);
    g.fill();
    for (let i = 0; i < 3; i++) circle(g, 0, -202 + i * 28, 2.4, SHIRT_MINT_DARK, INK, 1);
    // голова
    drawLetunovHead(g, 0, -264, t, b.state === 'rage' ? 'rage' : 'idle');
    // руки
    drawSuitArm(g, -88, -194, -119, -111, -15, 8, 12);
    drawSuitArm(g, 88, -194, 119, -111, 15, 8, 12);
    g.restore();
    g.restore();
  }

  function drawPhotoSeated(g, b, t) {
    const w = 334;
    const h = 458;
    const iw = letunovPhoto.naturalWidth || 791;
    const ih = letunovPhoto.naturalHeight || 1181;
    const flash = b.hitFlash > 0 ? clamp(b.hitFlash / 0.085, 0, 1) : 0;
    const frame = () => {
      g.beginPath();
      g.moveTo(-w / 2 + 9, -4);
      g.lineTo(-w / 2, -h + 42);
      g.quadraticCurveTo(-w / 2, -h, -w / 2 + 43, -h);
      g.lineTo(w / 2 - 43, -h);
      g.quadraticCurveTo(w / 2, -h, w / 2, -h + 42);
      g.lineTo(w / 2 - 9, -4);
      g.closePath();
    };

    // тёплое сияние арены
    g.save();
    const aura = g.createRadialGradient(0, -220, 44, 0, -220, 285);
    aura.addColorStop(0, `rgba(255, 185, 92, ${0.22 + flash * 0.28})`);
    aura.addColorStop(0.55, 'rgba(150, 62, 38, 0.1)');
    aura.addColorStop(1, 'rgba(70, 24, 21, 0)');
    g.fillStyle = aura;
    g.beginPath();
    g.ellipse(0, -220, 285, 285, 0, 0, TAU);
    g.fill();
    g.restore();

    // колёса цирковой тележки — вынесены за раму, чтобы их было видно
    drawBossWheel(g, -188, -21, 28, b.wheelT, 1);
    drawBossWheel(g, 188, -21, 28, b.wheelT + 0.8, 1);
    g.strokeStyle = INK;
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(-188, -18);
    g.lineTo(188, -18);
    g.stroke();
    g.strokeStyle = '#805128';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-188, -18);
    g.lineTo(188, -18);
    g.stroke();
    g.strokeStyle = 'rgba(240, 200, 119, 0.4)';
    g.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 162, -26);
      g.lineTo(side * 188, -21);
      g.lineTo(side * 162, -8);
      g.stroke();
    }

    // портрет в резной раме
    g.save();
    g.save();
    frame();
    g.clip();
    g.filter = 'sepia(0.42) saturate(0.78) contrast(1.06) brightness(0.83)';
    g.drawImage(letunovPhoto, 0, ih * 0.03, iw, ih * 0.94, -w / 2, -h, w, h);
    g.filter = 'none';

    g.fillStyle = 'rgba(99, 39, 27, 0.18)';
    g.fillRect(-w / 2, -h, w, h);
    const bottomShade = g.createLinearGradient(0, -h * 0.6, 0, 0);
    bottomShade.addColorStop(0, 'rgba(35, 12, 11, 0)');
    bottomShade.addColorStop(1, 'rgba(35, 12, 11, 0.68)');
    g.fillStyle = bottomShade;
    g.fillRect(-w / 2, -h, w, h);
    const vignette = g.createRadialGradient(0, -h * 0.52, h * 0.14, 0, -h * 0.5, h * 0.62);
    vignette.addColorStop(0, 'rgba(27, 9, 10, 0)');
    vignette.addColorStop(0.62, 'rgba(27, 9, 10, 0.06)');
    vignette.addColorStop(1, 'rgba(27, 9, 10, 0.7)');
    g.fillStyle = vignette;
    g.fillRect(-w / 2, -h, w, h);

    // фактура старой афиши
    g.strokeStyle = 'rgba(255, 241, 205, 0.05)';
    g.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const y = -h + seeded(i + 33) * h;
      g.beginPath();
      g.moveTo(-w / 2, y);
      g.lineTo(w / 2, y + seeded(i + 51) * 12);
      g.stroke();
    }
    if (flash > 0) {
      g.fillStyle = `rgba(255, 247, 221, ${flash * 0.27})`;
      g.fillRect(-w / 2, -h, w, h);
    }
    g.restore();

    frame();
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.stroke();
    frame();
    g.strokeStyle = GOLD;
    g.lineWidth = 3;
    g.stroke();
    frame();
    g.strokeStyle = 'rgba(255, 241, 197, 0.4)';
    g.lineWidth = 1;
    g.stroke();

    // золотые уголки-звёзды
    for (const side of [-1, 1]) {
      g.save();
      g.translate(side * (w / 2 - 3), -h + 39);
      starPath(g, 0, 0, 4, 8, 2.7, 0);
      fillStroke(g, GOLD_BRIGHT, INK, 1.8);
      g.restore();
    }
    g.restore();

    // передняя деревянная балка, скрывающая нижний край фото
    g.save();
    roundRect(g, -w / 2 - 19, -29, w + 38, 31, 9);
    fillStroke(g, '#4b241c', INK, 4);
    roundRect(g, -w / 2 - 13, -25, w + 26, 6, 3);
    g.fillStyle = 'rgba(240, 200, 119, 0.44)';
    g.fill();
    for (const side of [-1, 1]) {
      circle(g, side * (w / 2 + 8), -13, 4.2, GOLD, INK, 1.5);
    }
    g.restore();
  }

  function drawBossFist(g, x, y, angle, scale = 1, cuff = true) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(scale, scale);
    if (cuff) {
      roundRect(g, -25, -14, 16, 28, 6);
      fillStroke(g, CREAM, INK, 3.2);
      g.strokeStyle = 'rgba(91, 53, 31, 0.3)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(-18, -13);
      g.lineTo(-18, 13);
      g.stroke();
    }
    ellipsePath(g, 2, 0, 20, 17.5);
    fillStroke(g, SKIN, INK, 4);
    ellipsePath(g, 18, 7, 9, 7, -0.25);
    fillStroke(g, SKIN, INK, 2.8);
    g.fillStyle = 'rgba(255, 238, 212, 0.34)';
    g.beginPath();
    g.ellipse(0, -6, 11, 5, -0.2, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(88, 47, 28, 0.4)';
    g.lineWidth = 1.7;
    g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(7, -7 + i * 7.5, 6, -0.8, 0.45);
      g.stroke();
    }
    g.restore();
  }

  function drawSuitArm(g, sx, sy, ex, ey, bendX = 0, bendY = 0, width = 11) {
    const cx = (sx + ex) / 2 + bendX;
    const cy = (sy + ey) / 2 + bendY;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(cx, cy, ex, ey);
    g.strokeStyle = INK;
    g.lineWidth = width + 17;
    g.stroke();
    g.strokeStyle = SUIT_BLUE;
    g.lineWidth = width + 8;
    g.stroke();
    g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    g.lineWidth = 3.5;
    g.stroke();
    const angle = Math.atan2(ey - sy, ex - sx);
    drawBossFist(g, ex, ey, angle, 0.82, true);
  }

  function drawLetunovHead(g, cx, cy, t, expr = 'idle') {
    g.save();
    g.translate(cx, cy);
    const rage = expr === 'rage';
    const shaky = rage ? Math.sin(t * 24) * 0.022 : 0;
    g.rotate(shaky + Math.sin(t * 1.3) * 0.01);

    // шея и второй подбородок
    g.fillStyle = SKIN_SHADOW;
    roundRect(g, -33, 31, 66, 37, 18);
    fillStroke(g, SKIN_SHADOW, INK, 3.5);
    ellipsePath(g, 0, 30, 43, 15);
    fillStroke(g, SKIN, INK, 3);

    // уши
    circle(g, -48, -2, 13, SKIN, INK, 3.2);
    circle(g, 48, -2, 13, SKIN, INK, 3.2);
    g.strokeStyle = 'rgba(115, 62, 42, 0.5)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(-48, -2, 6, -1.2, 1.1);
    g.stroke();
    g.beginPath();
    g.arc(48, -2, 6, Math.PI - 1.1, Math.PI + 1.2);
    g.stroke();

    // волосы сзади
    ellipsePath(g, 0, -13, 52, 51);
    fillStroke(g, '#4c3326', INK, 3.5);

    // лицо
    const faceGrad = g.createLinearGradient(0, -42, 0, 48);
    faceGrad.addColorStop(0, '#f0c3a3');
    faceGrad.addColorStop(1, '#d49a79');
    ellipsePath(g, 0, 0, 45, 51);
    fillStroke(g, faceGrad, INK, 4.4);
    g.fillStyle = 'rgba(255, 234, 211, 0.22)';
    g.beginPath();
    g.ellipse(-17, -21, 14, 18, -0.25, 0, TAU);
    g.fill();

    // чёлка-горшок
    g.beginPath();
    g.moveTo(-45, -19);
    g.bezierCurveTo(-47, -48, -22, -57, 0, -57);
    g.bezierCurveTo(27, -57, 48, -46, 46, -17);
    g.bezierCurveTo(35, -28, 24, -30, 14, -25);
    g.bezierCurveTo(4, -20, -7, -31, -16, -25);
    g.bezierCurveTo(-26, -19, -36, -14, -45, -19);
    g.closePath();
    fillStroke(g, '#5b3d2d', INK, 4);
    g.strokeStyle = 'rgba(255, 220, 186, 0.12)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-31, -46);
    g.quadraticCurveTo(-9, -52, 20, -44);
    g.stroke();

    // чёрная полоса вместо глаз — как на фотографии
    g.save();
    g.rotate(-0.025);
    roundRect(g, -39, -25, 78, 18.5, 9.5);
    fillStroke(g, '#050506', '#020203', 2);
    g.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(g, -33, -22, 66, 4.5, 2.2);
    g.fill();
    g.restore();

    // брови над полосой
    g.strokeStyle = '#4c3326';
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath();
    if (rage) {
      g.moveTo(-30, -33);
      g.lineTo(-8, -28);
      g.moveTo(30, -33);
      g.lineTo(8, -28);
    } else {
      g.moveTo(-28, -32);
      g.lineTo(-8, -34);
      g.moveTo(28, -32);
      g.lineTo(8, -34);
    }
    g.stroke();

    // нос
    ellipsePath(g, 0, 6, 11, 8.5);
    fillStroke(g, '#ddaa88', INK, 2.8);
    g.strokeStyle = 'rgba(105, 55, 38, 0.46)';
    g.lineWidth = 1.8;
    g.beginPath();
    g.arc(-3, 9, 3.5, 0.2, Math.PI - 0.4);
    g.arc(4, 9, 3.2, 0.2, Math.PI - 0.4);
    g.stroke();

    // губы
    g.strokeStyle = '#7a4137';
    g.lineWidth = 2.4;
    g.beginPath();
    if (rage) {
      g.arc(0, 33, 12, Math.PI + 0.24, TAU - 0.24);
    } else {
      g.arc(0, 23, 13, 0.26, Math.PI - 0.26);
    }
    g.stroke();
    g.fillStyle = 'rgba(159, 81, 69, 0.42)';
    g.beginPath();
    g.ellipse(0, 25, 8, 3.2, 0, 0, TAU);
    g.fill();

    // щёки
    g.fillStyle = 'rgba(192, 95, 75, 0.15)';
    g.beginPath();
    g.ellipse(-27, 16, 10, 6, -0.2, 0, TAU);
    g.fill();
    g.beginPath();
    g.ellipse(27, 16, 10, 6, 0.2, 0, TAU);
    g.fill();

    // золотая серьга
    g.strokeStyle = GOLD;
    g.lineWidth = 2.3;
    g.beginPath();
    g.arc(51, 12, 7, -0.2, Math.PI + 0.3);
    g.stroke();

    if (rage) {
      g.strokeStyle = 'rgba(173, 54, 40, 0.45)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-35, -40);
      g.lineTo(-28, -46);
      g.moveTo(34, -41);
      g.lineTo(27, -47);
      g.stroke();
    }
    g.restore();
  }

  function drawStandingShoe(g, x, y, side) {
    g.save();
    g.translate(x, y);
    g.fillStyle = '#211820';
    g.beginPath();
    g.moveTo(-23, -5);
    g.quadraticCurveTo(-27, -15, -9, -17);
    g.quadraticCurveTo(16, -18, 28 * side + (side < 0 ? 26 : 0), -7);
    g.quadraticCurveTo(32, 1, 21, 3);
    g.lineTo(-20, 3);
    g.quadraticCurveTo(-26, 2, -23, -5);
    g.closePath();
    fillStroke(g, '#211820', INK, 3.5);
    g.fillStyle = 'rgba(255, 236, 205, 0.12)';
    g.beginPath();
    g.ellipse(side * 7, -9, 17, 4, 0.06, 0, TAU);
    g.fill();
    g.restore();
  }

  function drawStandingLetunov(g, b, t) {
    const st = b.state;
    const squat = st === 'slamWind' || st === 'hopWind' ? 1 : 0;
    const land = st === 'slamLand' || st === 'hopLand' ? 1 : 0;
    const jump = st === 'slamJump' || st === 'hopJump';
    const airPose = jump || b.airY > 4;
    const bob = airPose ? 0 : Math.sin(t * 1.9 + b.breathe) * 2;
    const shiftY = squat * 8 + land * 5 + bob;
    const bellyPulse = Math.sin(t * 2.1 + b.breathe) * 2;
    const windP = st === 'bellyWind' ? clamp(b.timer / 1.15, 0, 1) : 0;
    const bellyScale = 1 + windP * 0.11 + (st === 'bellyStretch' ? 0.03 : 0);

    // руки: [локоть-смещение X, локоть-смещение Y]
    let backArm = [-158, -148, -34, 14];
    let frontArm = [158, -148, 34, 14];
    if (airPose) {
      backArm = [-180, -330, -28, -12];
      frontArm = [182, -326, 28, -12];
    } else if (squat) {
      backArm = [-151, -122, -26, 13];
      frontArm = [151, -122, 26, 13];
    } else if (st === 'punchWind') {
      backArm = [-151, -191, -22, 10];
      frontArm = [68, -203, 31, 12];
    } else if (st === 'punchOut' || st === 'punchHold' || st === 'punchRetract') {
      backArm = [-154, -169, -22, 10];
      frontArm = null;
    } else if (st === 'bellyWind') {
      backArm = [-57, -190, -21, 15];
      frontArm = [57, -190, 21, 15];
    } else if (st === 'bellyStretch' || st === 'bellyHold' || st === 'bellyRetract') {
      backArm = [-190, -155, -22, 3];
      frontArm = [190, -155, 22, 3];
    } else if (st === 'rage') {
      backArm = [-171, -323, -26, -8];
      frontArm = [171, -320, 26, -8];
    } else if (st === 'death') {
      backArm = [-164, -53, -20, 12];
      frontArm = [164, -49, 20, 12];
    } else if (land) {
      backArm = [-184, -105, -18, 16];
      frontArm = [184, -100, 18, 16];
    }

    g.save();
    g.translate(0, shiftY);

    // ноги
    g.lineCap = 'round';
    for (const side of [-1, 1]) {
      const hipX = side * 35;
      const hipY = -117 + squat * 12;
      let kneeX = side * (56 + squat * 8);
      let kneeY = -63 + squat * 11;
      let ankleX = side * 49;
      let ankleY = -15;
      if (airPose) {
        kneeX = side * 78;
        kneeY = -116;
        ankleX = side * 35;
        ankleY = -75;
      }
      g.beginPath();
      g.moveTo(hipX, hipY);
      g.quadraticCurveTo(kneeX, kneeY, ankleX, ankleY);
      g.strokeStyle = INK;
      g.lineWidth = 44;
      g.stroke();
      g.strokeStyle = DENIM;
      g.lineWidth = 33;
      g.stroke();
      g.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      g.lineWidth = 5;
      g.stroke();
      g.strokeStyle = 'rgba(9, 12, 20, 0.24)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(hipX + side * 9, hipY + 4);
      g.quadraticCurveTo(kneeX + side * 7, kneeY, ankleX + side * 5, ankleY + 4);
      g.stroke();
      if (!airPose) drawStandingShoe(g, ankleX, 0, side);
      else drawStandingShoe(g, ankleX, ankleY + 13, side);
    }

    // задняя рука
    if (backArm) drawSuitArm(g, -91, -285, backArm[0], backArm[1] + bob, backArm[2], backArm[3], 13);

    // брюки
    g.beginPath();
    g.moveTo(-77, -134);
    g.quadraticCurveTo(0, -154, 77, -134);
    g.lineTo(69, -83);
    g.quadraticCurveTo(0, -59, -69, -83);
    g.closePath();
    fillStroke(g, DENIM_DARK, INK, 4);
    g.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-50, -128);
    g.quadraticCurveTo(-16, -137, 0, -131);
    g.stroke();

    // гигантское пузо-рубашка
    const bellyRx = 122 * bellyScale;
    const bellyRy = 123 * bellyScale;
    const bellyCy = -184 + squat * 9 + land * 3 + bellyPulse * 0.35;
    const shirtGrad = g.createLinearGradient(-90, bellyCy - 115, 90, bellyCy + 115);
    shirtGrad.addColorStop(0, '#d9eee8');
    shirtGrad.addColorStop(0.45, '#b9ded7');
    shirtGrad.addColorStop(1, '#87b5ad');
    ellipsePath(g, 0, bellyCy, bellyRx, bellyRy);
    fillStroke(g, shirtGrad, INK, 5.4);
    g.save();
    ellipsePath(g, 0, bellyCy, bellyRx, bellyRy);
    g.clip();
    g.fillStyle = 'rgba(255, 251, 233, 0.25)';
    g.beginPath();
    g.ellipse(-35, bellyCy - 61, 43, 27, -0.35, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(56, 104, 95, 0.14)';
    g.beginPath();
    g.ellipse(53, bellyCy + 44, 61, 56, -0.22, 0, TAU);
    g.fill();
    // складки рубашки
    g.strokeStyle = 'rgba(85, 128, 120, 0.3)';
    g.lineWidth = 2;
    g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(-48 + i * 32, bellyCy + 77, 18 + i * 3, Math.PI + 0.2, TAU - 0.35);
      g.stroke();
    }
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(-78 + i * 9, bellyCy - 20 + i * 9);
      g.quadraticCurveTo(-59 + i * 9, bellyCy + 7 + i * 8, -49 + i * 9, bellyCy + 34 + i * 9);
      g.stroke();
    }
    g.restore();

    // пуговицы рубашки
    g.strokeStyle = 'rgba(84, 128, 119, 0.5)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(0, bellyCy - 96);
    g.quadraticCurveTo(6, bellyCy - 30, 1, bellyCy + 64);
    g.stroke();
    for (let i = 0; i < 4; i++) {
      circle(g, 1 + (i % 2) * 2, bellyCy - 84 + i * 31, 2.2, '#eef8ef', SKIN_SHADOW, 0.8);
    }

    // пиджак по бокам
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 88, -300);
      g.bezierCurveTo(side * 132, -272, side * 139, -185, side * 118, -97);
      g.bezierCurveTo(side * 110, -68, side * 84, -55, side * 55, -59);
      g.lineTo(side * 73, -153);
      g.lineTo(side * 81, -300);
      g.closePath();
      const jacketGrad = g.createLinearGradient(side * 60, -290, side * 130, -70);
      jacketGrad.addColorStop(0, SUIT_BLUE_LIGHT);
      jacketGrad.addColorStop(1, SUIT_BLUE_DARK);
      fillStroke(g, jacketGrad, INK, 5);
      g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(side * 99, -277);
      g.quadraticCurveTo(side * 116, -206, side * 102, -129);
      g.stroke();
      // карман
      g.strokeStyle = 'rgba(12, 33, 57, 0.5)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(side * 91, -166);
      g.quadraticCurveTo(side * 103, -160, side * 113, -166);
      g.stroke();
      circle(g, side * 96, -137, 2.4, GOLD, INK, 1);
    }

    // короткие лацканы — пузо остаётся открытым
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 76, -299);
      g.lineTo(side * 48, -277);
      g.lineTo(side * 27, -205);
      g.lineTo(side * 41, -184);
      g.lineTo(side * 59, -272);
      g.closePath();
      fillStroke(g, '#376b9a', INK, 3.3);
      g.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(side * 58, -275);
      g.lineTo(side * 39, -202);
      g.stroke();
      g.strokeStyle = 'rgba(12, 33, 57, 0.72)';
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(side * 46, -198);
      g.quadraticCurveTo(side * 58, -140, side * 70, -83);
      g.stroke();
      circle(g, side * 51, -177, 2.4, GOLD, INK, 1);
    }
    // воротник
    g.beginPath();
    g.moveTo(-58, -296);
    g.quadraticCurveTo(0, -320, 58, -296);
    g.quadraticCurveTo(33, -279, 0, -274);
    g.quadraticCurveTo(-33, -279, -58, -296);
    g.closePath();
    fillStroke(g, '#d5e9df', INK, 3.5);

    drawLetunovHead(g, 0, -354 + bob, t, st === 'rage' || b.phase === 2 ? 'rage' : 'idle');

    // передняя рука
    if (frontArm) {
      drawSuitArm(g, 91, -285, frontArm[0], frontArm[1] + bob, frontArm[2], frontArm[3], 13);
    } else {
      drawSuitArm(g, 91, -285, 75, -202, 32, 22, 13);
    }

    // передняя рука поверх пуза в фазе растяжения
    if (b.bellyExtend > 0.02) drawBellySpan(g, b, t);

    g.restore();
  }

  function drawBellySpan(g, b, t) {
    const ext = clamp(b.bellyExtend, 0, 1);
    if (ext <= 0.02) return;
    const halfW = lerp(93, 880, easeOutCubic(ext));
    const top = -143;
    const height = 92;
    const cy = top + height / 2;
    const wobble = Math.sin(t * 13) * 2.4 * ext;

    g.save();
    g.translate(0, wobble);
    // тёмная тень под животом
    g.fillStyle = 'rgba(32, 14, 15, 0.2)';
    g.beginPath();
    g.ellipse(0, -44, Math.min(halfW, 760), 13, 0, 0, TAU);
    g.fill();

    const grad = g.createLinearGradient(0, top, 0, top + height);
    grad.addColorStop(0, '#d8eee8');
    grad.addColorStop(0.45, '#b9ded7');
    grad.addColorStop(1, '#83aaa3');

    const traceBelly = () => {
      g.beginPath();
      g.moveTo(-halfW, cy + 3);
      g.bezierCurveTo(-halfW * 0.74, top + 8, -halfW * 0.3, top - 10, 0, top - 7);
      g.bezierCurveTo(halfW * 0.3, top - 10, halfW * 0.74, top + 8, halfW, cy + 3);
      g.bezierCurveTo(halfW * 0.72, top + height - 7, halfW * 0.3, top + height, 0, top + height);
      g.bezierCurveTo(-halfW * 0.3, top + height, -halfW * 0.72, top + height - 7, -halfW, cy + 3);
      g.closePath();
    };

    traceBelly();
    fillStroke(g, grad, INK, 5.5);

    g.save();
    traceBelly();
    g.clip();
    g.fillStyle = 'rgba(255, 255, 255, 0.26)';
    g.beginPath();
    g.ellipse(-halfW * 0.42, top + 22, Math.min(70, halfW * 0.4), 11, 0, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(35, 80, 74, 0.14)';
    g.beginPath();
    g.ellipse(0, top + height + 18, Math.min(halfW, 800), 25, 0, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(75, 120, 111, 0.33)';
    g.lineWidth = 2;
    for (let i = -4; i <= 4; i++) {
      g.beginPath();
      g.moveTo(i * 74 - 16, top + 8);
      g.quadraticCurveTo(i * 74 + 6, cy, i * 74 + 20, top + height - 7);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-halfW * 0.82, cy - 14);
    g.quadraticCurveTo(-halfW * 0.42, cy - 40, -halfW * 0.08, cy - 14);
    g.stroke();
    g.restore();

    // пупок и складка
    g.strokeStyle = 'rgba(90, 132, 124, 0.5)';
    g.lineWidth = 2.2;
    g.beginPath();
    g.arc(0, cy + 17, 7.5, 0.3, Math.PI + 0.7);
    g.stroke();
    g.strokeStyle = 'rgba(84, 128, 119, 0.38)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-halfW * 0.58, top + 21);
    g.quadraticCurveTo(0, top - 7, halfW * 0.58, top + 21);
    g.stroke();

    // пуговицы рубашки, растянутые вместе с животом
    for (let i = -2; i <= 2; i++) {
      if (Math.abs(i) === 0) continue;
      circle(g, i * halfW * 0.32, top + 31, 2.2, '#edf7ee', SKIN_SHADOW, 0.8);
    }

    // пиджак у основания живота
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 52, top + 4);
      g.quadraticCurveTo(side * 82, top - 17, side * 104, top + 2);
      g.quadraticCurveTo(side * 84, top + 36, side * 55, top + 25);
      g.closePath();
      fillStroke(g, side > 0 ? SUIT_BLUE : SUIT_BLUE_DARK, INK, 3.2);
    }

    // скоростные штрихи на концах
    if (ext > 0.55) {
      g.strokeStyle = `rgba(255, 244, 214, ${0.25 + 0.2 * Math.sin(t * 24)})`;
      g.lineWidth = 3;
      g.lineCap = 'round';
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.moveTo(side * (halfW - 18), top + 18 + i * 24);
          g.lineTo(side * (halfW + 22 + i * 9), top + 18 + i * 24);
          g.stroke();
        }
      }
    }
    g.restore();
  }

  // ---------- Денис: школьный громила ----------
  function drawDenisBackpack(g, b, t) {
    const hot = b.phase === 2;
    const swing = Math.sin(t * 1.8 + 0.8) * 2;
    g.save();
    g.translate(swing, 0);
    // лямки за спиной
    g.strokeStyle = INK;
    g.lineWidth = 15;
    g.lineCap = 'round';
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 58, -313);
      g.quadraticCurveTo(side * 84, -262, side * 62, -208);
      g.stroke();
    }
    // рюкзак
    roundRect(g, -112, -318, 224, 196, 30);
    const pack = g.createLinearGradient(0, -318, 0, -122);
    pack.addColorStop(0, hot ? '#8e3436' : '#7d3a36');
    pack.addColorStop(1, '#4b1f23');
    fillStroke(g, pack, INK, 5);
    // клапан
    g.beginPath();
    g.moveTo(-108, -296);
    g.quadraticCurveTo(0, -256, 108, -296);
    g.lineTo(104, -231);
    g.quadraticCurveTo(0, -204, -104, -231);
    g.closePath();
    fillStroke(g, hot ? '#aa4742' : '#955148', INK, 4);
    g.strokeStyle = 'rgba(255, 235, 203, 0.18)';
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-83, -279);
    g.quadraticCurveTo(0, -246, 83, -279);
    g.stroke();
    // пряжки
    for (const side of [-1, 1]) {
      circle(g, side * 68, -235, 4.3, GOLD, INK, 1.5);
      g.fillStyle = 'rgba(31, 15, 16, 0.35)';
      g.fillRect(side * 68 - 10, -275, 20, 7);
    }
    // учебники торчат сверху
    g.save();
    g.translate(-42, -318);
    g.rotate(-0.18);
    roundRect(g, -1, -19, 79, 22, 3);
    fillStroke(g, '#e6d3aa', INK, 3);
    g.fillStyle = RUST;
    g.fillRect(3, -15, 71, 5);
    g.restore();
    g.save();
    g.translate(46, -320);
    g.rotate(0.12);
    roundRect(g, -66, -16, 68, 19, 3);
    fillStroke(g, '#c9e0d6', INK, 3);
    g.fillStyle = TEAL;
    g.fillRect(-62, -12, 60, 4);
    g.restore();
    // торчащая линейка
    g.save();
    g.translate(98, -286);
    g.rotate(0.55);
    g.fillStyle = '#e8d2a3';
    roundRect(g, -5, -50, 10, 70, 3);
    fillStroke(g, '#e8d2a3', INK, 2.5);
    g.strokeStyle = 'rgba(74, 42, 37, 0.65)';
    g.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(-4, -44 + i * 10);
      g.lineTo(3, -44 + i * 10);
      g.stroke();
    }
    g.restore();
    g.restore();
  }

  function drawDenisFist(g, x, y, angle, scale = 1) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(scale, scale);
    // манжета
    roundRect(g, -26, -15, 17, 30, 7);
    fillStroke(g, CREAM, INK, 3.2);
    g.strokeStyle = 'rgba(90, 52, 30, 0.28)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-18, -14);
    g.lineTo(-18, 14);
    g.stroke();
    // кулак
    ellipsePath(g, 5, 0, 25, 21);
    fillStroke(g, '#efc09a', INK, 4.2);
    ellipsePath(g, -3, 16, 11, 8, -0.3);
    fillStroke(g, '#efc09a', INK, 3);
    g.fillStyle = 'rgba(255, 243, 221, 0.36)';
    g.beginPath();
    g.ellipse(2, -8, 13, 6, -0.25, 0, TAU);
    g.fill();
    // костяшки
    g.strokeStyle = 'rgba(125, 66, 47, 0.42)';
    g.lineWidth = 2;
    g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(12, -7 + i * 7.2, 7, -0.9, 0.45);
      g.stroke();
    }
    // пластырь на одном кулаке
    g.save();
    g.rotate(-0.18);
    g.fillStyle = '#e9d4ac';
    g.fillRect(-8, 1, 18, 10);
    g.strokeStyle = 'rgba(120, 71, 51, 0.55)';
    g.lineWidth = 1;
    g.strokeRect(-8, 1, 18, 10);
    g.fillStyle = 'rgba(146, 87, 61, 0.3)';
    g.fillRect(-2, 3, 6, 6);
    g.restore();
    g.restore();
  }

  function drawDenisArm(
    g,
    sx,
    sy,
    ex,
    ey,
    bendX,
    bendY,
    width = 18,
    scale = 1,
    color = TEAL,
    withFist = true
  ) {
    const cx = (sx + ex) / 2 + bendX;
    const cy = (sy + ey) / 2 + bendY;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(cx, cy, ex, ey);
    g.strokeStyle = INK;
    g.lineWidth = width + 15;
    g.stroke();
    g.strokeStyle = color;
    g.lineWidth = width + 8;
    g.stroke();
    g.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    g.lineWidth = 3.5;
    g.stroke();
    // манжета рубашки
    g.save();
    g.translate(ex, ey);
    g.rotate(Math.atan2(ey - sy, ex - sx));
    roundRect(g, -18, -(width + 8) / 2, 13, width + 8, 4);
    fillStroke(g, color, INK, 2);
    g.restore();
    if (withFist) drawDenisFist(g, ex, ey, Math.atan2(ey - sy, ex - sx), scale);
  }

  // Лист бумаги в руке Дениса — деталь со снимка.
  function drawDenisPaper(g, x, y, rot = 0) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.fillStyle = 'rgba(26, 18, 12, 0.24)';
    roundRect(g, -31, -39, 66, 88, 4);
    g.fill();
    roundRect(g, -34, -44, 66, 88, 3);
    fillStroke(g, '#f7f0db', INK, 2.4);
    // загнутый угол
    g.beginPath();
    g.moveTo(20, -44);
    g.lineTo(32, -44);
    g.lineTo(32, -32);
    g.closePath();
    fillStroke(g, '#ddd0b4', INK, 1.6);
    // линии текста
    g.strokeStyle = 'rgba(72, 62, 48, 0.58)';
    g.lineWidth = 1.6;
    for (let i = 0; i < 8; i++) {
      const yy = -30 + i * 8;
      const len = i % 3 === 2 ? 26 : 44;
      g.beginPath();
      g.moveTo(-24, yy);
      g.lineTo(-24 + len, yy);
      g.stroke();
    }
    // красная отметка и печать
    g.strokeStyle = '#b3453e';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(8, 26);
    g.lineTo(21, 20);
    g.moveTo(13, 29);
    g.lineTo(24, 25);
    g.stroke();
    g.strokeStyle = 'rgba(55, 93, 148, 0.5)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(13, 22, 10, 0, TAU);
    g.stroke();
    g.restore();
  }

  function drawDenisHead(g, b, t) {
    const expr =
      b.state === 'rage' || b.phase >= 2 || b.state === 'denisGlassesBreak'
        ? 'rage'
        : b.state === 'death'
          ? 'dead'
          : 'idle';
    const angry = expr === 'rage';
    const broken = !!b.glassesBroken;
    const eyeLaser =
      b.state === 'denisLaserWind' ||
      b.state === 'denisLaserFire' ||
      b.state === 'denisCeilLaserWind';
    g.save();
    g.translate(0, -366);
    g.rotate(Math.sin(t * 1.4) * 0.012 + (angry ? Math.sin(t * 24) * 0.018 : 0));

    // шея
    g.fillStyle = SKIN_SHADOW;
    roundRect(g, -27, 28, 54, 36, 15);
    fillStroke(g, SKIN_SHADOW, INK, 3.2);

    // уши
    circle(g, -58, 2, 15, '#efc09a', INK, 3.4);
    circle(g, 58, 2, 15, '#efc09a', INK, 3.4);
    g.strokeStyle = 'rgba(130, 72, 52, 0.48)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(-58, 2, 7, -1.2, 1.1);
    g.stroke();
    g.beginPath();
    g.arc(58, 2, 7, Math.PI - 1.1, Math.PI + 1.2);
    g.stroke();

    // волосы сзади
    ellipsePath(g, 0, -7, 61, 62);
    fillStroke(g, '#4f3426', INK, 4);
    // лицо
    ellipsePath(g, 0, 0, 55, 57);
    fillStroke(g, '#efc09a', INK, 5);
    g.fillStyle = 'rgba(255, 246, 225, 0.22)';
    g.beginPath();
    g.ellipse(-19, -25, 23, 13, -0.5, 0, TAU);
    g.fill();

    // гладко зачёсанные каштановые волосы
    g.beginPath();
    g.moveTo(-58, -20);
    g.bezierCurveTo(-63, -52, -46, -71, -18, -73);
    g.bezierCurveTo(8, -78, 40, -67, 53, -42);
    g.bezierCurveTo(57, -32, 56, -25, 54, -18);
    g.bezierCurveTo(44, -34, 30, -41, 16, -46);
    g.bezierCurveTo(-2, -39, -26, -37, -44, -45);
    g.bezierCurveTo(-49, -37, -54, -28, -58, -20);
    g.closePath();
    fillStroke(g, '#5b3b25', INK, 4);
    // зачёсанный набок острый вихор
    g.beginPath();
    g.moveTo(-44, -48);
    g.bezierCurveTo(-36, -72, -10, -86, 16, -83);
    g.bezierCurveTo(32, -81, 44, -73, 50, -60);
    g.bezierCurveTo(34, -70, 16, -68, 6, -58);
    g.lineTo(-12, -49);
    g.bezierCurveTo(-24, -44, -35, -43, -44, -48);
    g.closePath();
    fillStroke(g, '#6b472c', INK, 3);
    // чёткий пробор
    g.strokeStyle = '#3a2416';
    g.lineWidth = 2.2;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-24, -72);
    g.quadraticCurveTo(-2, -61, 32, -64);
    g.stroke();
    g.strokeStyle = 'rgba(255, 226, 185, 0.18)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-34, -66);
    g.quadraticCurveTo(-14, -78, 12, -78);
    g.stroke();

    // глаза за очками
    const eyeY = 2;
    for (const side of [-1, 1]) {
      const ex = side * 21;
      if (expr === 'dead') {
        g.strokeStyle = INK;
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(ex - 7, eyeY - 7);
        g.lineTo(ex + 7, eyeY + 7);
        g.moveTo(ex + 7, eyeY - 7);
        g.lineTo(ex - 7, eyeY + 7);
        g.stroke();
      } else {
        ellipsePath(g, ex, eyeY, 9, 11);
        fillStroke(g, angry ? '#3a1114' : INK, null, 0);
        if (eyeLaser) {
          const glow = g.createRadialGradient(ex, eyeY, 2, ex, eyeY, 38);
          glow.addColorStop(0, 'rgba(255, 235, 220, 0.95)');
          glow.addColorStop(0.24, 'rgba(255, 104, 148, 0.88)');
          glow.addColorStop(0.65, 'rgba(238, 57, 106, 0.28)');
          glow.addColorStop(1, 'rgba(238, 57, 106, 0)');
          g.fillStyle = glow;
          g.beginPath();
          g.arc(ex, eyeY, 38, 0, TAU);
          g.fill();
        }
        g.fillStyle = eyeLaser ? '#fff2dd' : angry ? GOLD_BRIGHT : WHITE;
        g.beginPath();
        g.arc(ex - 2, eyeY - 3, angry ? 3 : 2, 0, TAU);
        g.fill();
        // зрачок смотрит на героя
        g.fillStyle = eyeLaser ? '#e83d76' : INK;
        g.beginPath();
        g.arc(ex + (hero.x < boss.x ? -2 : 2), eyeY + 1, angry ? 3.5 : 2.8, 0, TAU);
        g.fill();
      }
      // очки: после второй фазы стекло треснуло, правой линзы нет
      g.strokeStyle = INK;
      g.lineWidth = 4;
      if (!broken || side === -1) {
        circle(g, ex, eyeY, 17, 'rgba(244, 236, 209, 0.08)', INK, 4);
        g.strokeStyle = 'rgba(255, 249, 228, 0.42)';
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(ex - 4, eyeY - 4, 9, Math.PI * 1.05, Math.PI * 1.55);
        g.stroke();
      } else {
        // уцелевшая часть оправы
        g.strokeStyle = INK;
        g.lineWidth = 4;
        g.beginPath();
        g.arc(ex, eyeY, 17, Math.PI * 0.18, Math.PI * 1.4);
        g.stroke();
        g.strokeStyle = 'rgba(255, 249, 228, 0.5)';
        g.lineWidth = 1.4;
        g.beginPath();
        g.arc(ex - 4, eyeY - 4, 9, Math.PI * 1.2, Math.PI * 1.55);
        g.stroke();
        // осколки у виска
        for (let k = 0; k < 4; k++) {
          const a = -0.2 + k * 0.46;
          g.save();
          g.translate(ex + 17 + k * 2, eyeY + 9 - k * 2);
          g.rotate(a);
          g.beginPath();
          g.moveTo(0, 0);
          g.lineTo(9 + k * 2, -4);
          g.lineTo(13 + k * 2, 5);
          g.closePath();
          fillStroke(g, 'rgba(220, 244, 238, 0.72)', INK, 1.2);
          g.restore();
        }
      }
      const crack = broken || angry;
      if (crack) {
        g.strokeStyle = side === 1 && broken ? 'rgba(255, 249, 228, 0.86)' : 'rgba(255, 244, 218, 0.72)';
        g.lineWidth = 1.6;
        g.beginPath();
        if (side === 1 && broken) {
          g.moveTo(ex - 8, eyeY - 10);
          g.lineTo(ex + 1, eyeY - 2);
          g.lineTo(ex - 4, eyeY + 4);
          g.lineTo(ex + 7, eyeY + 10);
          g.moveTo(ex + 1, eyeY - 2);
          g.lineTo(ex + 12, eyeY - 7);
        } else {
          g.moveTo(ex + 3, eyeY - 9);
          g.lineTo(ex + 9, eyeY + 8);
        }
        g.stroke();
      }
    }
    g.strokeStyle = INK;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(-5, 2);
    g.lineTo(5, 2);
    g.stroke();
    // дужки
    g.beginPath();
    g.moveTo(-38, 1);
    g.lineTo(-51, -2);
    g.moveTo(38, 1);
    g.lineTo(51, -2);
    g.stroke();

    // брови
    g.strokeStyle = '#3b251c';
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath();
    if (angry) {
      g.moveTo(-35, -23);
      g.lineTo(-10, -15);
      g.moveTo(9, -15);
      g.lineTo(35, -23);
    } else {
      g.moveTo(-36, -22);
      g.lineTo(-8, -14);
      g.moveTo(8, -14);
      g.lineTo(36, -22);
    }
    g.stroke();
    // строгая складка между бровями
    g.strokeStyle = 'rgba(92, 55, 39, 0.55)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(0, -14);
    g.lineTo(0, -5);
    g.stroke();

    // нос
    g.beginPath();
    g.moveTo(0, 12);
    g.quadraticCurveTo(-5, 23, 3, 25);
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.stroke();
    // рот: сурово стиснутые зубы, уголки опущены
    if (expr === 'dead') {
      g.strokeStyle = INK;
      g.lineWidth = 3.4;
      g.beginPath();
      g.arc(0, 39, 9, Math.PI + 0.3, 0.2);
      g.stroke();
    } else {
      const wide = angry ? 24 : 21;
      const topY = 31;
      const botY = 44;
      g.beginPath();
      g.moveTo(-wide, botY - 2);
      g.quadraticCurveTo(0, topY, wide, botY - 2);
      g.quadraticCurveTo(0, botY + 2, -wide, botY - 2);
      g.closePath();
      fillStroke(g, '#4a1719', INK, 2.6);
      // стиснутые зубы
      g.save();
      g.beginPath();
      g.moveTo(-wide + 3, botY - 3);
      g.quadraticCurveTo(0, topY + 2.5, wide - 3, botY - 3);
      g.quadraticCurveTo(0, botY - 0.5, -wide + 3, botY - 3);
      g.closePath();
      g.fillStyle = '#f7edd4';
      g.fill();
      g.clip();
      g.strokeStyle = 'rgba(92, 58, 42, 0.55)';
      g.lineWidth = 1.3;
      const midY = (topY + botY) / 2 + 2;
      g.beginPath();
      g.moveTo(-wide, midY);
      g.quadraticCurveTo(0, midY - 4, wide, midY);
      g.stroke();
      for (let i = -2; i <= 2; i++) {
        const x = i * (wide / 2.6);
        g.beginPath();
        g.moveTo(x, midY - 4.5);
        g.lineTo(x, midY + 0.5);
        g.stroke();
      }
      g.restore();
      // опущенные уголки
      g.strokeStyle = INK;
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(-wide, botY - 2);
      g.quadraticCurveTo(-wide - 3, botY + 2, -wide - 4, botY + 5);
      g.moveTo(wide, botY - 2);
      g.quadraticCurveTo(wide + 3, botY + 2, wide + 4, botY + 5);
      g.stroke();
    }

    if (expr === 'dead') {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.8 + (i / 3) * TAU;
        starPath(g, Math.cos(a) * 44, -62 + Math.sin(a) * 13, 4, 6, 2.2, a);
        g.fillStyle = GOLD_BRIGHT;
        g.fill();
      }
    }
    g.restore();
  }

  function drawDenisStanding(g, b, t) {
    const st = b.state;
    const squat = st === 'slamWind' || st === 'hopWind' ? 1 : 0;
    const land = st === 'slamLand' || st === 'hopLand' ? 1 : 0;
    const airPose = st === 'slamJump' || st === 'hopJump' || b.airY > 4;
    const hot = b.phase === 2;
    const bob = airPose ? 0 : Math.sin(t * 1.9 + b.breathe) * 1.8;
    const shiftY = squat * 8 + land * 5 + bob;

    // аура второго года
    if (hot) {
      const aura = g.createRadialGradient(0, -220, 50, 0, -220, 230);
      aura.addColorStop(0, 'rgba(255, 174, 100, 0.12)');
      aura.addColorStop(0.65, 'rgba(161, 50, 53, 0.06)');
      aura.addColorStop(1, 'rgba(161, 50, 53, 0)');
      g.fillStyle = aura;
      g.beginPath();
      g.ellipse(0, -220, 230, 250, 0, 0, TAU);
      g.fill();
    }

    g.save();
    g.translate(0, shiftY);
    drawDenisBackpack(g, b, t);

    // ноги
    g.lineCap = 'round';
    for (const side of [-1, 1]) {
      const hipX = side * 37;
      const hipY = -139 + squat * 10;
      let kneeX = side * (56 + squat * 8);
      let kneeY = -67 + squat * 9;
      let ankleX = side * 51;
      let ankleY = -15;
      if (airPose) {
        kneeX = side * 75;
        kneeY = -112;
        ankleX = side * 42;
        ankleY = -70;
      }
      g.beginPath();
      g.moveTo(hipX, hipY);
      g.quadraticCurveTo(kneeX, kneeY, ankleX, ankleY);
      g.strokeStyle = INK;
      g.lineWidth = 41;
      g.stroke();
      g.strokeStyle = DENIM;
      g.lineWidth = 31;
      g.stroke();
      g.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      g.lineWidth = 4;
      g.stroke();

      // кроссовок
      g.save();
      g.translate(ankleX, ankleY + 6);
      g.rotate(side * -0.04);
      g.beginPath();
      g.moveTo(-25, 0);
      g.bezierCurveTo(-30, -14, -9, -22, 12, -18);
      g.bezierCurveTo(31, -15, 34, -4, 31, 5);
      g.lineTo(24, 8);
      g.lineTo(-23, 8);
      g.closePath();
      fillStroke(g, '#e6d7b6', INK, 4);
      g.fillStyle = '#a33b32';
      g.beginPath();
      g.moveTo(-21, 3);
      g.quadraticCurveTo(-2, -6, 21, 2);
      g.lineTo(21, 7);
      g.lineTo(-21, 7);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(60, 42, 31, 0.45)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(-15, -10);
      g.lineTo(-2, -4);
      g.moveTo(-8, -14);
      g.lineTo(4, -7);
      g.stroke();
      g.restore();
    }

    // задняя рука
    let rearArm = [-128, -137, -22, 14];
    let frontArm = [128, -137, 22, 14];
    if (airPose) {
      rearArm = [-151, -292, -24, -8];
      frontArm = [151, -292, 24, -8];
    } else if (squat) {
      rearArm = [-130, -108, -18, 15];
      frontArm = [130, -108, 18, 15];
    } else if (st === 'punchWind') {
      rearArm = [-134, -175, -17, 10];
      frontArm = [48, -212, 30, 9];
    } else if (st === 'punchOut' || st === 'punchHold' || st === 'punchRetract') {
      rearArm = [-139, -153, -18, 10];
      frontArm = null;
    } else if (st === 'chalkWind' || st === 'chalkThrow') {
      rearArm = [-131, -160, -20, 13];
      frontArm = [b.face * 97, -304, 26, -5];
    } else if (st === 'screamWind' || st === 'scream') {
      rearArm = [-102, -329, -28, -8];
      frontArm = [102, -329, 28, -8];
    } else if (st === 'rage') {
      rearArm = [-153, -278, -22, 4];
      frontArm = [153, -278, 22, 4];
    } else if (st === 'death') {
      rearArm = [-141, -48, -18, 13];
      frontArm = [141, -43, 18, 13];
    } else if (land) {
      rearArm = [-160, -95, -18, 17];
      frontArm = [160, -90, 18, 17];
    }

    if (rearArm) {
      drawDenisArm(g, -81, -291, rearArm[0], rearArm[1], rearArm[2], rearArm[3], 16, 0.92);
    }

    // брюки и ремень
    g.beginPath();
    g.moveTo(-74, -153);
    g.quadraticCurveTo(0, -166, 74, -153);
    g.lineTo(68, -107);
    g.quadraticCurveTo(0, -91, -68, -107);
    g.closePath();
    fillStroke(g, DENIM_DARK, INK, 4);
    g.fillStyle = '#33251e';
    roundRect(g, -76, -163, 152, 18, 5);
    fillStroke(g, '#33251e', INK, 3.2);
    g.fillStyle = GOLD;
    roundRect(g, -10, -162, 20, 15, 3);
    fillStroke(g, GOLD, INK, 1.8);
    g.fillStyle = INK;
    g.fillRect(-4, -158, 8, 7);

    // рубашка
    g.beginPath();
    g.moveTo(-63, -317);
    g.quadraticCurveTo(0, -338, 63, -317);
    g.lineTo(77, -157);
    g.quadraticCurveTo(0, -138, -77, -157);
    g.closePath();
    const shirt = g.createLinearGradient(0, -330, 0, -140);
    shirt.addColorStop(0, '#f0e2c2');
    shirt.addColorStop(1, '#d6c29b');
    fillStroke(g, shirt, INK, 4.5);
    g.strokeStyle = 'rgba(112, 86, 54, 0.28)';
    g.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(-20 + i * 20, -290);
      g.quadraticCurveTo(-13 + i * 20, -230, -24 + i * 24, -172);
      g.stroke();
    }

    // пиджак
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 61, -321);
      g.bezierCurveTo(side * 111, -307, side * 125, -249, side * 110, -186);
      g.bezierCurveTo(side * 102, -154, side * 81, -137, side * 62, -140);
      g.lineTo(side * 33, -229);
      g.lineTo(side * 31, -314);
      g.closePath();
      const jacket = g.createLinearGradient(side * 38, -330, side * 116, -145);
      jacket.addColorStop(0, hot ? '#376f66' : '#2e6a61');
      jacket.addColorStop(1, '#173c39');
      fillStroke(g, jacket, INK, 4.6);
      // лацкан
      g.beginPath();
      g.moveTo(side * 54, -314);
      g.lineTo(side * 34, -284);
      g.lineTo(side * 48, -205);
      g.lineTo(side * 59, -231);
      g.closePath();
      fillStroke(g, hot ? '#4b8577' : '#3d7b6e', INK, 2.8);
      // карман с ручкой
      g.strokeStyle = 'rgba(9, 35, 33, 0.55)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(side * 79, -202);
      g.quadraticCurveTo(side * 91, -193, side * 103, -203);
      g.stroke();
      g.fillStyle = '#e7d2a4';
      g.fillRect(side * 86 - 2, -213, 4, 13);
      g.fillStyle = '#a33b32';
      g.fillRect(side * 86 - 1, -215, 2, 5);
      // пуговица
      circle(g, side * 62, -256, 2.6, GOLD, INK, 1);
      if (hot) {
        // порванный рукав
        g.strokeStyle = '#183c38';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(side * 98, -288);
        g.lineTo(side * 87, -270);
        g.lineTo(side * 103, -254);
        g.stroke();
      }
    }

    // галстук
    g.beginPath();
    g.moveTo(-13, -312);
    g.lineTo(13, -312);
    g.lineTo(9, -286);
    g.lineTo(0, -278);
    g.lineTo(-9, -286);
    g.closePath();
    fillStroke(g, '#8d2b2e', INK, 3);
    g.beginPath();
    g.moveTo(-7, -284);
    g.lineTo(7, -284);
    g.lineTo(15, -218 + (hot ? 6 : 0));
    g.lineTo(2, -198);
    g.lineTo(-13, -221);
    g.closePath();
    fillStroke(g, '#a93832', INK, 3);
    g.strokeStyle = 'rgba(255, 209, 166, 0.22)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(2, -277);
    g.lineTo(2, -209);
    g.stroke();

    // воротник
    g.beginPath();
    g.moveTo(-47, -319);
    g.quadraticCurveTo(-16, -304, 0, -294);
    g.quadraticCurveTo(16, -304, 47, -319);
    g.quadraticCurveTo(27, -297, 12, -289);
    g.lineTo(0, -278);
    g.lineTo(-12, -289);
    g.quadraticCurveTo(-27, -297, -47, -319);
    g.closePath();
    fillStroke(g, '#f4e7c7', INK, 3.2);

    drawDenisHead(g, b, t);

    // передняя рука
    if (frontArm) {
      drawDenisArm(g, 81, -291, frontArm[0], frontArm[1], frontArm[2], frontArm[3], 16, 0.98);
      if (st === 'chalkWind' || st === 'chalkThrow') {
        g.save();
        g.translate(frontArm[0] + b.face * 8, frontArm[1] - 4);
        g.rotate(b.face * 0.32);
        roundRect(g, -7, -26, 14, 48, 6);
        fillStroke(g, '#f0e9d7', INK, 2.6);
        g.fillStyle = PINK;
        g.fillRect(-5, -22, 10, 10);
        g.fillStyle = 'rgba(74, 42, 37, 0.3)';
        g.fillRect(-5, -8, 10, 2);
        g.restore();
      }
    } else {
      drawDenisArm(g, 81, -291, 54, -205, 30, 20, 16, 0.9);
    }

    // летящие страницы во второй фазе
    if (hot) {
      for (let i = 0; i < 4; i++) {
        const phase = t * 0.7 + i * 1.6;
        const px = Math.sin(phase) * (130 + i * 12);
        const py = -255 + Math.cos(phase * 1.3) * 90;
        g.save();
        g.translate(px, py);
        g.rotate(Math.sin(phase) * 0.6);
        g.globalAlpha = 0.38 + Math.sin(phase * 2) * 0.12;
        roundRect(g, -13, -9, 26, 18, 1);
        fillStroke(g, '#efe3c6', 'rgba(74, 42, 37, 0.55)', 1);
        g.strokeStyle = 'rgba(74, 42, 37, 0.4)';
        for (let k = 0; k < 3; k++) {
          g.beginPath();
          g.moveTo(-8, -4 + k * 5);
          g.lineTo(8, -4 + k * 5);
          g.stroke();
        }
        g.restore();
      }
    }
    g.restore();
  }

  function drawDenisFingerGun(g, x, y, angle = 0, scale = 1) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(scale, scale);
    // ладонь
    ellipsePath(g, 0, 0, 17, 14);
    fillStroke(g, '#efc09a', INK, 3.4);
    // вытянутый указательный палец
    roundRect(g, -44, -7, 43, 12, 6);
    fillStroke(g, '#efc09a', INK, 3);
    roundRect(g, -43, -4.5, 34, 4, 2);
    g.fillStyle = 'rgba(255, 245, 222, 0.35)';
    g.fill();
    // большой палец вверх
    roundRect(g, -5, -25, 12, 23, 6);
    fillStroke(g, '#efc09a', INK, 3);
    // остальные пальцы прижаты
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(-2, 7, 10, 0.1, Math.PI - 0.2);
    g.stroke();
    g.strokeStyle = 'rgba(125, 66, 47, 0.45)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-3, -7);
    g.lineTo(-17, -7);
    g.moveTo(-3, -2);
    g.lineTo(-16, -2);
    g.stroke();
    g.restore();
  }

  function drawDenisSeated(g, b, t) {
    const st = b.state;
    const hot = b.phase >= 2;
    const breath = Math.sin(t * 1.55 + b.breathe) * 1.3;
    const finger =
      st === 'denisFingerWind' || st === 'denisFingerFire' || st === 'denisThirdFloorIntro';
    const eyeLaser =
      st === 'denisLaserWind' || st === 'denisLaserFire' || st === 'denisCeilLaserWind';
    const worried = st === 'denisCeilLaserWind' || st === 'denisCollapse' || st === 'denisParkour';

    g.save();
    g.translate(0, breath);

    // высокое учительское кресло позади Дениса
    g.save();
    g.translate(34, 0);
    g.fillStyle = 'rgba(30, 16, 13, 0.22)';
    g.beginPath();
    g.ellipse(0, 5, 132, 15, 0, 0, TAU);
    g.fill();
    roundRect(g, -78, -462, 172, 330, 26);
    fillStroke(g, '#5b3b2a', INK, 5);
    roundRect(g, -61, -443, 138, 206, 17);
    fillStroke(g, hot ? '#7c3436' : '#6b3437', INK, 4);
    g.strokeStyle = 'rgba(255, 232, 186, 0.15)';
    g.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(-50 + i * 23, -424);
      g.lineTo(-38 + i * 20, -250);
      g.stroke();
    }
    circle(g, -60, -430, 6, GOLD, INK, 2);
    circle(g, 60, -430, 6, GOLD, INK, 2);
    // деревянные стойки кресла
    roundRect(g, -73, -141, 22, 128, 6);
    fillStroke(g, '#4a2d20', INK, 3);
    roundRect(g, 57, -141, 22, 128, 6);
    fillStroke(g, '#4a2d20', INK, 3);
    g.restore();

    // спинка и сиденье стула за спиной
    if (hot && b.phase === 2) {
      const aura = g.createRadialGradient(-45, -260, 30, -45, -250, 270);
      aura.addColorStop(0, 'rgba(235, 94, 84, 0.1)');
      aura.addColorStop(0.7, 'rgba(157, 46, 46, 0.055)');
      aura.addColorStop(1, 'rgba(157, 46, 46, 0)');
      g.fillStyle = aura;
      g.beginPath();
      g.ellipse(-45, -250, 265, 255, 0, 0, TAU);
      g.fill();
    }

    // ноги под партой
    g.strokeStyle = INK;
    g.lineWidth = 34;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-58, -155);
    g.quadraticCurveTo(-118, -112, -104, -52);
    g.moveTo(-8, -158);
    g.quadraticCurveTo(-54, -105, -35, -56);
    g.stroke();
    g.strokeStyle = DENIM;
    g.lineWidth = 24;
    g.beginPath();
    g.moveTo(-58, -155);
    g.quadraticCurveTo(-118, -112, -104, -52);
    g.moveTo(-8, -158);
    g.quadraticCurveTo(-54, -105, -35, -56);
    g.stroke();
    g.fillStyle = '#2b201c';
    roundRect(g, -127, -58, 56, 22, 8);
    fillStroke(g, '#2b201c', INK, 3);
    roundRect(g, -58, -65, 54, 22, 8);
    fillStroke(g, '#2b201c', INK, 3);

    // синяя рубашка под чёрным жилетом
    g.beginPath();
    g.moveTo(-103, -304);
    g.quadraticCurveTo(-46, -326, 10, -303);
    g.quadraticCurveTo(37, -245, 27, -153);
    g.quadraticCurveTo(-43, -131, -111, -158);
    g.quadraticCurveTo(-130, -235, -103, -304);
    g.closePath();
    const shirt = g.createLinearGradient(-100, -320, 10, -140);
    shirt.addColorStop(0, '#8bb3e2');
    shirt.addColorStop(0.55, '#5f8bc9');
    shirt.addColorStop(1, '#3f6aa4');
    fillStroke(g, shirt, INK, 4.6);
    // складки рубашки
    g.strokeStyle = 'rgba(31, 56, 92, 0.36)';
    g.lineWidth = 1.8;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(-78 + i * 27, -278);
      g.quadraticCurveTo(-70 + i * 25, -224, -82 + i * 26, -168);
      g.stroke();
    }
    // воротник синей рубашки
    g.beginPath();
    g.moveTo(-72, -305);
    g.quadraticCurveTo(-54, -288, -43, -272);
    g.lineTo(-54, -255);
    g.quadraticCurveTo(-76, -282, -92, -300);
    g.closePath();
    fillStroke(g, '#a8c8ea', INK, 3);
    g.beginPath();
    g.moveTo(6, -303);
    g.quadraticCurveTo(-14, -288, -33, -272);
    g.lineTo(-24, -254);
    g.quadraticCurveTo(0, -282, 24, -299);
    g.closePath();
    fillStroke(g, '#a8c8ea', INK, 3);

    // чёрный жилет: две полы с V-вырезом
    const vest = g.createLinearGradient(-104, -302, 24, -152);
    vest.addColorStop(0, '#2c3038');
    vest.addColorStop(0.55, '#1d2026');
    vest.addColorStop(1, '#121419');
    g.beginPath();
    g.moveTo(-103, -304);
    g.quadraticCurveTo(-122, -246, -108, -156);
    g.lineTo(-43, -145);
    g.lineTo(-41, -238);
    g.lineTo(-60, -283);
    g.closePath();
    fillStroke(g, vest, INK, 4.2);
    g.beginPath();
    g.moveTo(13, -303);
    g.quadraticCurveTo(37, -245, 28, -153);
    g.lineTo(-42, -145);
    g.lineTo(-41, -238);
    g.lineTo(-20, -286);
    g.closePath();
    fillStroke(g, vest, INK, 4.2);
    // лацканы жилета
    g.strokeStyle = 'rgba(231, 237, 244, 0.22)';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-93, -300);
    g.lineTo(-60, -283);
    g.lineTo(-41, -238);
    g.moveTo(4, -300);
    g.lineTo(-20, -286);
    g.lineTo(-41, -238);
    g.stroke();
    // карман жилета
    g.strokeStyle = 'rgba(221, 230, 240, 0.16)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-96, -205);
    g.quadraticCurveTo(-82, -197, -68, -206);
    g.stroke();
    // пуговицы жилета, часть может быть в полёте
    const buttonPositions = [
      { x: -41, y: -236 },
      { x: -41, y: -211 },
      { x: -41, y: -186 },
      { x: -41, y: -161 },
    ];
    buttonPositions.forEach((p, i) => {
      if (i < b.buttonsOut) return;
      circle(g, p.x, p.y, 3.6, '#c9a462', INK, 1.4);
      g.fillStyle = 'rgba(255, 245, 214, 0.55)';
      g.beginPath();
      g.arc(p.x - 1.2, p.y - 1.2, 1.1, 0, TAU);
      g.fill();
    });

    // голова
    g.save();
    g.translate(-38, 40);
    drawDenisHead(g, b, t);
    g.restore();

    // учительский стол перед ним
    g.save();
    g.fillStyle = 'rgba(29, 16, 12, 0.26)';
    roundRect(g, -257, -138, 367, 152, 10);
    g.fill();
    roundRect(g, -272, -158, 365, 26, 5);
    fillStroke(g, '#9a6a41', INK, 4);
    g.fillStyle = 'rgba(255, 226, 173, 0.26)';
    g.fillRect(-258, -153, 339, 4);
    // боковины и ножки
    roundRect(g, -260, -138, 25, 140, 5);
    fillStroke(g, '#77502f', INK, 3);
    roundRect(g, 62, -138, 25, 140, 5);
    fillStroke(g, '#77502f', INK, 3);
    roundRect(g, -235, -116, 277, 72, 4);
    fillStroke(g, '#815632', INK, 3);
    g.strokeStyle = 'rgba(255, 229, 180, 0.12)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-225, -108);
    g.lineTo(30, -108);
    g.stroke();
    // вырезанный номер школы
    g.fillStyle = 'rgba(48, 28, 18, 0.6)';
    g.font = `900 18px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.fillText('№ 53', -95, -66);
    // пенал и мел
    roundRect(g, -102, -179, 64, 14, 5);
    fillStroke(g, '#3e746a', INK, 2);
    g.fillStyle = GOLD;
    g.fillRect(-92, -176, 44, 3);
    g.fillStyle = '#efe5c8';
    g.fillRect(-24, -172, 31, 5);
    g.fillStyle = '#d87858';
    g.fillRect(-14, -167, 21, 4);
    g.restore();

    // руки: в одной лист бумаги, другая — кулак на столе
    const shoulderY = -284;
    const shirtArm = '#5f8bc9';
    if (finger) {
      drawDenisArm(g, -91, shoulderY, -246, -205, -32, 20, 16, 0.95, shirtArm, false);
      drawDenisFingerGun(g, -266, -207, -0.08, 0.95);
      drawDenisArm(g, 22, shoulderY, 18, -176, 16, 18, 15, 0.88, shirtArm, true);
    } else {
      drawDenisPaper(g, -205, -192, -0.08);
      drawDenisArm(g, -91, shoulderY, -205, -231, -34, 22, 16, 0.95, shirtArm, false);
      drawDenisArm(g, 22, shoulderY, 18, -176, 16, 18, 15, 0.88, shirtArm, true);
      // пальцы придерживают лист
      g.save();
      g.translate(-205, -231);
      g.rotate(-0.08);
      ellipsePath(g, 0, 2, 15, 10);
      fillStroke(g, '#efc09a', INK, 3);
      g.strokeStyle = 'rgba(124, 68, 46, 0.5)';
      g.lineWidth = 1.4;
      for (let i = -1; i <= 1; i++) {
        g.beginPath();
        g.moveTo(i * 6, 7 - Math.abs(i));
        g.lineTo(i * 6, 11);
        g.stroke();
      }
      g.restore();
    }

    // эффект разбитых очков и лазера рисуется в голове; здесь — пар
    if (hot && Math.random() < 0.08) {
      addParticle({
        kind: 'dot',
        x: boss.x - 110 + rand(-62, 28),
        y: GROUND - rand(230, 320),
        vx: rand(-18, 18),
        vy: rand(-50, -12),
        life: rand(0.3, 0.7),
        maxLife: 0.7,
        size: rand(1, 2.6),
        color: pick([CREAM, '#e8d8bb']),
        rot: 0,
        vr: 0,
        grav: -45,
        drag: 0.7,
      });
    }

    // после падения потолка на рубашке появляется бетонная пыль
    if (b.phase === 3 || worried) {
      g.globalAlpha = 0.26;
      g.fillStyle = '#b7afa0';
      for (let i = 0; i < 17; i++) {
        g.fillRect(-118 + seeded(i * 3.2) * 148, -296 + seeded(i * 4.7) * 142, 3, 2);
      }
      g.globalAlpha = 1;
    }

    g.restore();
  }

  function drawBoss() {
    const b = boss;
    if (b.exploded) return;
    const t = game.time;
    if (game.bossId === 'nikita') {
      drawNikitaBoss();
      return;
    }
    if (game.bossId === 'stepa') {
      drawStepaBoss();
      return;
    }
    if (game.bossId === 'elena') {
      drawElena();
      return;
    }
    if (game.bossId === 'egor') {
      drawEgor();
      return;
    }
    // Пока герой лезет на третий этаж, Денис уже наверху — его не видно.
    if (game.bossId === 'denis' && b.denisClimb) return;

    if (!b.inChair && b.chairPropA > 0.01) {
      ctx.save();
      ctx.globalAlpha = b.chairPropA;
      ctx.translate(clamp(b.chairPropX, 940, 1180), GROUND);
      ctx.rotate(-0.07);
      ctx.scale(0.82, 0.82);
      ctx.fillStyle = 'rgba(38, 20, 16, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 155, 14, 0, 0, TAU);
      ctx.fill();
      drawChairVector(ctx, b.wheelT);
      ctx.restore();
    }

    let bob = Math.sin(t * 1.8 + b.breathe) * 2;
    let tilt = Math.sin(t * 1.2 + b.breathe) * 0.006;
    let squashX = 1;
    let squashY = 1;
    let shakeX = 0;
    switch (b.state) {
      case 'slamWind': {
        const p = clamp(b.timer / (b.slamShort ? 0.78 : b.phase === 2 ? 1.05 : 1.28), 0, 1);
        squashX = 1 + p * 0.055;
        squashY = 1 - p * 0.065;
        tilt = Math.sin(t * 6) * 0.009 * p;
        bob = 0;
        break;
      }
      case 'slamJump':
      case 'hopJump':
        squashX = 0.965;
        squashY = 1.045;
        tilt = (b.jumpToX > b.jumpFromX ? 1 : -1) * 0.07;
        bob = 0;
        break;
      case 'slamLand':
      case 'hopLand': {
        const p = clamp(b.timer / 0.5, 0, 1);
        squashX = 1 + (1 - p) * 0.12;
        squashY = 1 - (1 - p) * 0.13;
        bob = 0;
        break;
      }
      case 'punchWind':
        tilt = -0.035;
        squashX = 1.015;
        squashY = 0.985;
        bob = 0;
        break;
      case 'punchOut':
      case 'punchHold':
        tilt = 0.045;
        bob = 0;
        break;
      case 'punchRetract':
        tilt = 0.022;
        bob = 0;
        break;
      case 'bellyWind':
        squashX = 1.04;
        squashY = 0.97;
        bob = 0;
        break;
      case 'bellyStretch':
      case 'bellyHold':
        squashX = 1.01;
        squashY = 1.01;
        bob = 0;
        break;
      case 'bellyRetract':
        squashY = 0.99;
        bob = 0;
        break;
      case 'hopWind':
        squashX = 1.03;
        squashY = 0.95;
        bob = 0;
        break;
      case 'rage':
        shakeX = Math.sin(t * 55) * (b.inChair ? 3.2 : 2.1);
        squashX = 1 + Math.sin(t * 8) * 0.025;
        squashY = 1 + Math.cos(t * 8) * 0.018;
        bob = 0;
        break;
      case 'death': {
        const k = clamp(1 - b.deathT / 1.15, 0, 1);
        shakeX = Math.sin(t * 48) * 4 * k;
        tilt = Math.sin(t * 15) * 0.08 * k;
        bob = 0;
        break;
      }
      default:
        break;
    }
    if (b.hitFlash > 0 && b.state !== 'death') shakeX += Math.sin(t * 120) * 1.4;

    const standK = clamp(b.standK, 0, 1);
    ctx.save();
    ctx.translate(b.x + shakeX, GROUND - b.airY);
    ctx.translate(0, bob);
    ctx.rotate(tilt);
    ctx.scale(squashX, squashY);
    if (game.bossId === 'denis') {
      drawDenisSeated(ctx, b, t);
    } else if (b.inChair) {
      // В первой фазе используется та же векторная модель, что и во второй,
      // только сидящая в цирковом кресле. Фотография больше не нужна.
      drawSeatedFallback(ctx, b, t);
      if (b.cannonK > 0.01) drawChairCannons(ctx, b);
    } else {
      ctx.translate(0, (1 - standK) * 34);
      ctx.scale(1, 0.48 + standK * 0.52);
      drawStandingLetunov(ctx, b, t);
    }
    ctx.restore();
  }

  function drawBossPunchArm() {
    const b = boss;
    if (b.exploded || !b.fist.active) return;
    const punching =
      b.state === 'punchOut' || b.state === 'punchHold' || b.state === 'punchRetract';
    if (!punching) return;

    const t = game.time;
    const ex = 92 + b.fist.dist;
    const ey = PUNCH_Y - (GROUND - b.airY);
    const shakeX = b.hitFlash > 0 ? Math.sin(t * 120) * 1.4 : 0;
    const out = b.state === 'punchOut';
    const retract = b.state === 'punchRetract';
    const power = out ? 1 : retract ? 0.42 : 0.25;
    const shoulderY = b.inChair ? -246 : -236;

    ctx.save();
    ctx.translate(b.x + shakeX, GROUND - b.airY);
    ctx.scale(b.face, 1);

    if (game.bossId === 'denis') {
      // меловые штрихи скорости
      ctx.strokeStyle = `rgba(255, 244, 214, ${0.24 * power})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const off = i * 15;
        ctx.beginPath();
        ctx.moveTo(ex - 74 - off, ey - 28 + i * 16);
        ctx.lineTo(ex - 132 - off - i * 22, ey - 28 + i * 16);
        ctx.stroke();
      }
      drawDenisArm(ctx, 82, -291, ex, ey, 6, -24, 18, 1.7);
      ctx.restore();
      return;
    }

    // штрихи скорости
    ctx.strokeStyle = `rgba(255, 244, 214, ${0.2 * power})`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const off = i * 14;
      ctx.beginPath();
      ctx.moveTo(ex - 80 - off, ey - 27 + i * 15);
      ctx.lineTo(ex - 132 - off - i * 22, ey - 27 + i * 15);
      ctx.stroke();
    }

    // синий рукав
    ctx.beginPath();
    ctx.moveTo(82, shoulderY);
    ctx.quadraticCurveTo(92, shoulderY + 44, ex, ey);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 45;
    ctx.stroke();
    ctx.strokeStyle = SUIT_BLUE;
    ctx.lineWidth = 32;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 5;
    ctx.stroke();

    drawBossFist(ctx, ex, ey, 0, 1.55, true);

    // блик на рукаве
    ctx.strokeStyle = 'rgba(186, 221, 246, 0.13)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(89, shoulderY + 12);
    ctx.quadraticCurveTo(ex * 0.55 + 20, ey - 66, ex * 0.95, ey - 14);
    ctx.stroke();
    ctx.restore();
  }

  function drawHeart(x, y, s, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.78);
    ctx.bezierCurveTo(-s * 1.2, s * 0.16, -s * 0.82, -s * 0.72, 0, -s * 0.27);
    ctx.bezierCurveTo(s * 0.82, -s * 0.72, s * 1.2, s * 0.16, 0, s * 0.78);
    ctx.closePath();
    if (filled) {
      ctx.fillStyle = '#c94032';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 232, 190, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-s * 0.32, -s * 0.3, s * 0.22, s * 0.14, -0.5, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(20, 10, 13, 0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 227, 189, 0.38)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSuperCard(g, x, y, w, h, filled, progress = 0, index = 0) {
    g.save();
    g.translate(x, y);
    g.rotate((index - 2) * 0.022);
    g.shadowColor = filled ? 'rgba(255, 197, 92, 0.55)' : 'rgba(10, 4, 6, 0.4)';
    g.shadowBlur = filled ? 10 : 4;
    g.shadowOffsetY = 3;
    roundRect(g, -w / 2, 0, w, h, 4);
    fillStroke(g, filled ? '#b22f2d' : 'rgba(50, 27, 24, 0.9)', INK, 2.2);
    g.shadowColor = 'transparent';
    roundRect(g, -w / 2 + 2.5, 2.5, w - 5, h - 5, 2.5);
    g.strokeStyle = filled ? GOLD_BRIGHT : 'rgba(211, 160, 74, 0.35)';
    g.lineWidth = 1.2;
    g.stroke();

    if (!filled && progress > 0) {
      g.save();
      roundRect(g, -w / 2 + 2, 2, w - 4, h - 4, 2.5);
      g.clip();
      g.fillStyle = 'rgba(211, 160, 74, 0.3)';
      g.fillRect(-w / 2 + 2, h - 2 - (h - 4) * clamp(progress, 0, 1), w - 4, (h - 4) * clamp(progress, 0, 1));
      g.restore();
    }

    starPath(g, 0, h * 0.47, 5, filled ? 7.2 : 6, filled ? 3.1 : 2.5, -Math.PI / 2);
    fillStroke(g, filled ? GOLD_BRIGHT : 'rgba(240, 200, 119, 0.42)', filled ? INK : 'rgba(211, 160, 74, 0.22)', 1.2);
    circle(g, 0, h * 0.47, 1.5, filled ? RUST : 'rgba(244, 227, 189, 0.28)', null, 0);
    g.restore();
  }

  function drawHUD() {
    if (game.scene === 'menu') return;
    const b = boss;

    // жизни: базовые + купленные бонусные сердца
    ctx.save();
    const maxHearts = Math.max(BASE_HEARTS, Math.ceil(hero.maxHp / 5));
    const perRow = 15;
    const heartRows = Math.ceil(maxHearts / perRow);
    const heartPanelH = 9 + heartRows * 15 + 6;
    roundRect(ctx, 22, 16, 190, heartPanelH, 12);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.78)', 'rgba(211, 160, 74, 0.55)', 1.5);
    for (let i = 0; i < maxHearts; i++) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const full = i * 5 + 5 <= hero.hp;
      drawHeart(34 + col * 11.1, 31 + row * 15, 4.7, full);
    }

    // рывок
    const dashY = 23 + heartPanelH;
    roundRect(ctx, 22, dashY, 190, 38, 10);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.64)', 'rgba(211, 160, 74, 0.34)', 1.2);
    const ready = clamp(1 - hero.dashCd / 0.72, 0, 1);
    ctx.strokeStyle = 'rgba(244, 227, 189, 0.18)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(44, dashY + 19, 13, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = ready >= 1 ? GOLD_BRIGHT : '#71a79d';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(44, dashY + 19, 13, -Math.PI / 2, -Math.PI / 2 + TAU * ready);
    ctx.stroke();
    ctx.fillStyle = CREAM;
    ctx.font = `900 17px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('»', 44, dashY + 20);
    ctx.textAlign = 'left';
    ctx.font = `700 9px Verdana, sans-serif`;
    ctx.fillStyle = 'rgba(244, 227, 189, 0.92)';
    ctx.fillText(progress.smokeDash ? 'ДЫМОВОЙ РЫВОК' : 'РЫВОК', 66, dashY + 14);
    ctx.font = `500 7.5px Verdana, sans-serif`;
    ctx.fillStyle = progress.smokeDash ? 'rgba(160, 218, 203, 0.8)' : 'rgba(244, 227, 189, 0.5)';
    ctx.fillText(
      ready >= 1 ? (progress.smokeDash ? 'ГОТОВ · ИСЧЕЗНУТЬ' : 'ГОТОВ') : 'ПЕРЕЗАРЯДКА',
      66,
      dashY + 26
    );

    // супер-звёзды: доступны от 1/5, за 5/5 удар заметно мощнее
    const cardY = dashY + 45;
    const cardPanelGlow = hero.cards >= 5 ? 0.7 + Math.sin(game.time * 7) * 0.25 : hero.cards > 0 ? 0.35 + Math.sin(game.time * 4.2) * 0.16 : 0;
    ctx.save();
    if (cardPanelGlow > 0) {
      ctx.shadowColor = `rgba(255, 199, 91, ${cardPanelGlow})`;
      ctx.shadowBlur = 18;
    }
    roundRect(ctx, 22, cardY, 190, 60, 10);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.7)', 'rgba(211, 160, 74, 0.4)', 1.2);
    ctx.shadowColor = 'transparent';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `700 8px Verdana, sans-serif`;
    ctx.fillStyle = 'rgba(244, 227, 189, 0.9)';
    ctx.fillText(hero.cards >= 5 ? 'СУПЕР ГОТОВ!' : hero.cards > 0 ? 'СУПЕР ДОСТУПЕН' : 'ЗВЁЗДЫ АТАКИ', 31, cardY + 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = hero.cards > 0 ? GOLD_BRIGHT : 'rgba(244, 227, 189, 0.5)';
    ctx.fillText(`${hero.cards}/5`, 202, cardY + 12);
    ctx.font = `700 7px Verdana, sans-serif`;
    ctx.fillStyle = hero.cards >= 5 ? PINK_BRIGHT : hero.cards > 0 ? GOLD_BRIGHT : 'rgba(244, 227, 189, 0.48)';
    ctx.fillText(hero.cards >= 5 ? 'ЖМИ E / ★' : hero.cards > 0 ? 'E / ★ · СЛАБЫЙ' : 'КОПИТСЯ', 202, cardY + 25);
    for (let i = 0; i < 5; i++) {
      const filled = i < hero.cards;
      const progress = i === hero.cards ? hero.cardCharge / SUPER_CARD_DAMAGE : 0;
      drawSuperCard(ctx, 45 + i * 31, cardY + 23, 25, 31, filled, progress, i);
    }
    ctx.restore();

    // табличка босса
    const panelW = 644;
    const px = W / 2 - panelW / 2;
    roundRect(ctx, px, 10, panelW, 84, 10);
    ctx.fillStyle = 'rgba(24, 11, 15, 0.84)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(211, 160, 74, 0.62)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    roundRect(ctx, px + 5, 15, panelW - 10, 74, 7);
    ctx.strokeStyle = 'rgba(244, 227, 189, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ромбы по бокам имени
    for (const side of [-1, 1]) {
      const dx = W / 2 + side * 128;
      ctx.save();
      ctx.translate(dx, 35);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = GOLD;
      ctx.fillRect(-2.5, -2.5, 5, 5);
      ctx.restore();
      ctx.strokeStyle = 'rgba(211, 160, 74, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 + side * 140, 35);
      ctx.lineTo(W / 2 + side * 205, 35);
      ctx.stroke();
    }

    const cfg = BOSS_CONFIG[game.bossId] || BOSS_CONFIG.letunov;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = CREAM;
    ctx.font = `900 27px ${FONT_DISPLAY}`;
    ctx.fillText(cfg.name, W / 2, 42);
    ctx.fillStyle = 'rgba(211, 160, 74, 0.9)';
    ctx.font = `700 8px Verdana, sans-serif`;
    const phaseTitle = b.phase >= 3 ? cfg.phase3 : b.phase === 2 ? cfg.phase2 : cfg.phase1;
    ctx.fillText(`${phaseTitle} · ${difficultyConfig().short}`, W / 2, 55);

    // полоса здоровья
    const barX = W / 2 - 270;
    const barW = 540;
    const barY = 64;
    const barH = 14;
    roundRect(ctx, barX, barY, barW, barH, 7);
    ctx.fillStyle = '#2a1015';
    ctx.fill();
    ctx.strokeStyle = 'rgba(211, 160, 74, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const frac = clamp(b.hpShown / b.maxHp, 0, 1);
    if (frac > 0) {
      ctx.save();
      roundRect(ctx, barX + 2, barY + 2, (barW - 4) * frac, barH - 4, 5);
      ctx.clip();
      const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      if (b.phase >= 3) {
        hpGrad.addColorStop(0, '#f0d27c');
        hpGrad.addColorStop(0.45, '#c56b3c');
        hpGrad.addColorStop(1, '#6d1f2a');
      } else if (b.phase === 2) {
        hpGrad.addColorStop(0, '#e2a941');
        hpGrad.addColorStop(0.6, '#d36a2f');
        hpGrad.addColorStop(1, '#a82b28');
      } else {
        hpGrad.addColorStop(0, '#d95a3c');
        hpGrad.addColorStop(0.6, '#b6322f');
        hpGrad.addColorStop(1, '#8c1f28');
      }
      ctx.fillStyle = hpGrad;
      ctx.fillRect(barX + 2, barY + 2, barW - 4, barH - 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(barX + 2, barY + 3, barW - 4, 3);
      ctx.restore();

      // сегменты
      ctx.strokeStyle = 'rgba(24, 11, 15, 0.42)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 10; i++) {
        const x = barX + (barW * i) / 10;
        ctx.beginPath();
        ctx.moveTo(x, barY + 2);
        ctx.lineTo(x, barY + barH - 2);
        ctx.stroke();
      }
      // отметка 50%
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.save();
      ctx.translate(barX + barW / 2, barY + barH / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
      if (game.bossId === 'denis') {
        // порог третьей фазы
        ctx.fillStyle = 'rgba(255, 222, 154, 0.9)';
        ctx.fillRect(barX + barW * DENIS_PHASE3_AT - 1, barY + 1, 2, barH - 2);
      }
    }

    ctx.restore();
  }

  function drawIntro() {
    if (game.scene !== 'fight' || game.introT <= 0) return;
    const t = game.introT;
    const isReady = t > 0.85;
    if (isReady) {
      const alpha = clamp((1.9 - t) / 0.18, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(W / 2, 300);
      ctx.rotate(-0.025);
      starPath(ctx, 0, 0, 18, 248, 196, -Math.PI / 2 + t * 0.06);
      fillStroke(ctx, 'rgba(109, 28, 39, 0.88)', 'rgba(211, 160, 74, 0.9)', 4);
      starPath(ctx, 0, 0, 18, 225, 182, -Math.PI / 2 + 0.1);
      ctx.strokeStyle = 'rgba(244, 227, 189, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 72px ${FONT_DISPLAY}`;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 12;
      ctx.strokeText('ГОТОВ?', 4, 8);
      ctx.fillStyle = CREAM;
      ctx.fillText('ГОТОВ?', 0, 0);
      ctx.restore();
    } else {
      const appear = clamp((0.85 - t) / 0.12, 0, 1);
      const alpha = clamp(t / 0.26, 0, 1);
      const scale = 0.85 + easeOutQuad(appear) * 0.15 + Math.sin(t * 7) * 0.012;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(W / 2, 296);
      ctx.rotate(0.018);
      ctx.scale(scale, scale);
      starPath(ctx, 0, 0, 20, 285, 216, -Math.PI / 2 + 0.05);
      fillStroke(ctx, 'rgba(109, 28, 39, 0.92)', 'rgba(240, 200, 119, 0.95)', 4.5);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.font = `900 108px ${FONT_DISPLAY}`;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 16;
      ctx.strokeText('БЕЙ!', 5, 12);
      ctx.fillStyle = CREAM;
      ctx.fillText('БЕЙ!', 0, 0);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.font = `700 10px Verdana, sans-serif`;
      ctx.fillText(
        game.bossId === 'denis'
          ? 'СЛЕДИ ЗА ЗЕРКАЛОМ · ПАРИРУЙ ЦВЕТЫ'
          : 'НЕ ДАЙ ПРИЖАТЬ СЕБЯ К КАНАТАМ',
        0,
        82
      );
      ctx.restore();
    }
  }

  function drawFlash() {
    if (game.flash <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(game.flash, 0, 1) * 0.55;
    ctx.fillStyle = game.flashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ---------- главный апдейт ----------
  function update(dt) {
    if (game.paused) return;
    Sound.tick();
    updateCamera(dt);

    if (game.hitStop > 0) {
      game.hitStop = Math.max(0, game.hitStop - dt);
      updateParticles(dt * 0.22);
      return;
    }

    game.time += dt;
    updateMotes(dt);

    if (game.scene === 'menu') {
      updateMenu(dt);
      updateParticles(dt);
      return;
    }

    if (game.scene === 'map') {
      updateMap(dt);
      updateParticles(dt);
      return;
    }

    if (game.scene === 'school') {
      updateSchool(dt);
      updateParticles(dt);
      return;
    }

    if (game.scene === 'fight') {
      updateFight(dt);
      updateParticles(dt);
      updateGhosts(dt);
      return;
    }

    updateParticles(dt);
    updateGhosts(dt);
  }

  // ---------- отрисовка кадра ----------
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cw = canvas.width;
    const ch = canvas.height;
    const backdrop = ctx.createRadialGradient(
      cw / 2,
      ch / 2,
      0,
      cw / 2,
      ch / 2,
      Math.max(cw, ch) * 0.78
    );
    backdrop.addColorStop(0, '#1c0d12');
    backdrop.addColorStop(0.65, '#0d0609');
    backdrop.addColorStop(1, '#070304');
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, cw, ch);

    const shakeX = game.shake > 0 ? (Math.random() * 2 - 1) * game.shake * 0.75 : 0;
    const shakeY = game.shake > 0 ? (Math.random() * 2 - 1) * game.shake * 0.55 : 0;

    ctx.setTransform(
      viewScale,
      0,
      0,
      viewScale,
      viewOX + shakeX * viewScale,
      viewOY + shakeY * viewScale
    );
    if (game.scene === 'map') drawMap();
    else if (game.scene === 'school') drawSchoolCorridor();
    else drawStage();

    ctx.setTransform(viewScale, 0, 0, viewScale, viewOX, viewOY);
    drawFlash();
    if (game.scene !== 'menu' && game.scene !== 'map' && game.scene !== 'school') drawHUD();
    drawIntro();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = 'rgba(211, 160, 74, 0.3)';
    ctx.lineWidth = Math.max(1, viewScale * 1.5);
    ctx.strokeRect(viewOX - 1, viewOY - 1, W * viewScale + 2, H * viewScale + 2);
    ctx.strokeStyle = 'rgba(20, 8, 11, 0.9)';
    ctx.lineWidth = Math.max(2, viewScale * 4);
    ctx.strokeRect(
      viewOX - Math.max(2, viewScale * 4),
      viewOY - Math.max(2, viewScale * 4),
      W * viewScale + Math.max(4, viewScale * 8),
      H * viewScale + Math.max(4, viewScale * 8)
    );
  }

  // ---------- цикл ----------
  let lastTime = 0;

  function frame(now) {
    if (!lastTime) lastTime = now;
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    dt = clamp(dt, 0, 0.05);
    update(dt);
    clearPressed();
    render();
    requestAnimationFrame(frame);
  }

  function init() {
    resize();
    buildBackground();
    buildSchoolBackground();
    buildThirdFloorBackground();
    buildMapBackground();
    makeFilmGrain();
    resetWorld();
    game.scene = 'menu';
    document.body.dataset.scene = 'menu';
    document.body.classList.remove('is-paused');
    showPanel('menu');
    updateMetaUI();
    requestAnimationFrame(frame);
  }

  // отладочный доступ (удобно проверять атаки и фазы)
  window.__HISVELL__ = {
    game,
    hero,
    boss,
    platforms,
    parryOrbs,
    bullets,
    soundWaves,
    bossShots,
    held,
    pressed,
    sources,
    progress,
    startGame,
    goMap,
    goMenu,
    openShop,
    closeShop,
    renderShop,
    saveProgress,
    togglePause,
    attack(name) {
      if (name === 'slam') startSlam();
      else if (name === 'punch') startPunch();
      else if (name === 'belly') enterBellyWind();
      else if (name === 'hop') enterHopWind(false);
      else if (name === 'scream') enterScreamWind();
      else if (name === 'chalk') enterChalkWind();
    },
    enrage: startRage,
    defeatBoss: startBossDeath,
    damageBoss,
    denisLaserHits,
    heroRect,
    chooseAttack,
    letunovAttacks: {
      cannon: enterCannonAttack,
      scream: enterScreamWind,
      wind: spawnWindCharge,
      fallingBullet: spawnFallingBullet,
      petalTrap: spawnPetalTrap,
    },
    egorPhase: {
      two: startEgorPhase2,
      three: startEgorPhase3,
      four: startEgorPhase4,
      banana: spawnEgorBanana,
      coconut: spawnEgorCoconut,
      bull: spawnEgorBull,
      birds: spawnEgorBirdFlock,
      scream: spawnEgorScream,
      branch: spawnEgorBranchFromSky,
    },
    setBossHp(value) {
      boss.hp = clamp(value, 1, boss.maxHp);
      boss.hpShown = boss.hp;
    },
    spawnParry(x = hero.x, y = GROUND - 210) {
      parryOrbs.push({ x, y, life: 30, pulse: 0 });
    },
    spawnPlatform(x = hero.x, targetY = GROUND - 155) {
      platforms.push({
        x,
        y: targetY - 180,
        targetY,
        w: 152,
        h: 18,
        vy: 180,
        life: 30,
        solid: false,
        landed: false,
      });
    },
    superAttack() {
      if (hero.cards < 5) hero.cards = 5;
      trySuperAttack();
    },
    setProgress(patch = {}) {
      Object.assign(progress, patch);
      saveProgress();
      updateMetaUI();
      renderShop();
    },
    attackPunch: startPunch,
    attackBelly: enterBellyWind,
    attackSlam: startSlam,
    attackHop: enterHopWind,
    step(dt = 1 / 60) {
      const wasPaused = game.paused;
      game.paused = false;
      update(clamp(dt, 0, 0.05));
      game.paused = wasPaused;
      clearPressed();
      render();
    },
    render,
  };

  init();
})();












