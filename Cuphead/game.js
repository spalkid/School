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
  const BASE_HEARTS = 3;
  const HERO_MAX_HP = BASE_HEARTS * 5; // 3 сердца, как в Cuphead
  const PUNCH_Y = GROUND - 112;
  const PUNCH_R = 32;
  const BELLY_TOP = GROUND - 140;
  const BELLY_BOTTOM = GROUND - 54;
  const BOSS_MAX_HP = 12600; // 7× от прежних 1800 — бой длится больше минуты
  const DENIS_MAX_HP = 12600;
  const SUPER_CARD_DAMAGE = 420;
  const SUPER_DAMAGE = 300; // урон одной супер-звезды уменьшен
  const TAU = Math.PI * 2;
  const DENIS_PHASE2_AT = 0.5;
  const DENIS_PHASE3_AT = 0.22;

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
  };
  const ACTION_LABELS = {
    left: 'Влево',
    right: 'Вправо',
    jump: 'Прыжок / парирование',
    dash: 'Рывок',
    crouch: 'Присесть',
    shoot: 'Огонь (вручную)',
    super: 'Супер-удар',
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
  const MAX_BONUS_HEARTS = 25;
  const progress = {
    coins: 0,
    bonusHearts: 0,
    smokeDash: false,
    wins: { letunov: 0, denis: 0 },
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
      if (Number.isFinite(data.bonusHearts)) {
        progress.bonusHearts = clamp(Math.floor(data.bonusHearts), 0, MAX_BONUS_HEARTS);
      }
      progress.smokeDash = !!data.smokeDash;
      if (data.wins && typeof data.wins === 'object') {
        progress.wins.letunov = Math.max(0, Math.floor(data.wins.letunov || 0));
        progress.wins.denis = Math.max(0, Math.floor(data.wins.denis || 0));
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

  function updateMetaUI() {
    const menuProgress = document.getElementById('menuProgress');
    if (menuProgress) {
      const hearts = BASE_HEARTS + progress.bonusHearts;
      menuProgress.textContent =
        `Монеты: ${progress.coins} · Сердец: ${hearts}` +
        (progress.smokeDash ? ' · Дымовая завеса: есть' : '');
    }
    const shopCoins = document.getElementById('shopCoins');
    if (shopCoins) shopCoins.textContent = String(progress.coins);
    const shopStatus = document.getElementById('shopStatus');
    if (shopStatus) {
      shopStatus.textContent =
        `Сердец: ${BASE_HEARTS + progress.bonusHearts} · Дымовая завеса: ` +
        (progress.smokeDash ? 'куплена' : 'нет') +
        ` · Побед: ${progress.wins.letunov + progress.wins.denis}`;
    }
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
  };
  const pressed = { jump: false, dash: false, shoot: false, super: false };
  const sources = {
    left: new Set(),
    right: new Set(),
    jump: new Set(),
    dash: new Set(),
    crouch: new Set(),
    shoot: new Set(),
    super: new Set(),
  };
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
  }

  function releaseAll() {
    Object.keys(sources).forEach((action) => {
      sources[action].clear();
      held[action] = false;
    });
    pointerActions.forEach((rec) => rec.btn.classList.remove('is-down'));
    pointerActions.clear();
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
      const rec = pointerActions.get(e.pointerId);
      if (!rec) return;
      setAction(rec.action, 'p' + e.pointerId, false);
      rec.btn.classList.remove('is-down');
      pointerActions.delete(e.pointerId);
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
  const bossShots = [];
  const particles = [];
  const ghosts = [];
  const craters = [];
  const motes = [];
  const platforms = [];
  const parryOrbs = [];
  const denisBirds = [];

  const MAP_BUILDINGS = [
    {
      id: 'letunov',
      kind: 'circus',
      x: 300,
      doorX: 300,
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
      x: 1000,
      doorX: 1000,
      name: 'МАГАЗИН',
      sub: 'БАФФЫ',
      color: '#b67a32',
    },
  ];

  const mapState = {
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
    const maxHp = Math.round(cfg.maxHp * difficultyConfig().hp);
    Object.assign(boss, {
      x: isLetunov ? 950 : 1034,
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
      springCount: 0,
      birdCount: 0,
      parkourSpawned: false,
      thirdFloor: false,
      pendingPhase3: false,
      laser: {
        active: false,
        mirrorX: ARENA_L + 18,
        mirrorY: GROUND - 120,
        startY: GROUND - 120,
        targetY: GROUND - 120,
        pattern: 0,
        pulse: 0,
      },
    });
  }

  function resetWorld() {
    resetHero();
    resetBoss();
    bullets.length = 0;
    waves.length = 0;
    soundWaves.length = 0;
    bossShots.length = 0;
    particles.length = 0;
    ghosts.length = 0;
    craters.length = 0;
    platforms.length = 0;
    parryOrbs.length = 0;
    denisBirds.length = 0;
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
  function buildMapBackground() {
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
    g.fillText('ШКОЛА №13', 0, -3);
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
    roundRect(g, 844, 346, 312, 224, 7);
    fillStroke(g, '#8f5a3b', '#3f2a1d', 5);
    g.fillStyle = '#5e3b2a';
    g.beginPath();
    g.moveTo(836, 346);
    g.lineTo(874, 306);
    g.lineTo(1126, 306);
    g.lineTo(1164, 346);
    g.closePath();
    fillStroke(g, '#5e3b2a', '#34221d', 4);
    // вывеска
    g.save();
    g.translate(1000, 276);
    roundRect(g, -136, -28, 272, 54, 8);
    fillStroke(g, '#e8d0a4', '#3f2a1d', 4);
    g.fillStyle = '#7a3a2a';
    g.font = `900 28px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('БАФФЫ', 0, -3);
    g.font = `700 8px Verdana, sans-serif`;
    g.fillText('СЕРДЦА · ДЫМ · МОНЕТЫ', 0, 16);
    g.restore();
    // навес
    for (let i = 0; i < 8; i++) {
      const x = 850 + i * 39;
      g.fillStyle = i % 2 ? '#f0dfb5' : '#a33b32';
      g.beginPath();
      g.moveTo(x, 356);
      g.lineTo(x + 39, 356);
      g.lineTo(x + 39, 390);
      g.quadraticCurveTo(x + 19, 408, x, 390);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(72, 38, 25, 0.5)';
      g.lineWidth = 1.4;
      g.stroke();
    }
    // витрина
    g.fillStyle = 'rgba(226, 206, 164, 0.9)';
    roundRect(g, 864, 408, 128, 88, 4);
    fillStroke(g, 'rgba(226, 206, 164, 0.9)', '#3f2a1d', 4);
    g.fillStyle = '#ad3628';
    g.font = `900 38px ${FONT_DISPLAY}`;
    g.textAlign = 'center';
    g.fillText('♥', 900, 464);
    g.fillStyle = '#2b625c';
    g.font = `900 30px ${FONT_BODY}`;
    g.fillText('☁', 954, 462);
    g.fillStyle = 'rgba(243, 227, 189, 0.84)';
    g.font = `700 7px Verdana, sans-serif`;
    g.fillText('1 МОНЕТА', 900, 484);
    g.fillText('2 МОНЕТЫ', 954, 484);
    // дверь
    g.fillStyle = '#3b2a26';
    roundRect(g, 1040, 432, 80, 138, 5);
    fillStroke(g, '#3b2a26', '#d3a04a', 3);
    g.fillStyle = '#d3a04a';
    g.beginPath();
    g.arc(1057, 500, 3, 0, TAU);
    g.fill();
    // горшки
    g.fillStyle = '#4b382b';
    g.fillRect(834, 538, 34, 30);
    g.fillStyle = '#3b5e4c';
    g.beginPath();
    g.ellipse(851, 526, 28, 26, 0, 0, TAU);
    g.fill();
    g.fillRect(1160, 532, 34, 36);
    g.fillStyle = '#d3a04a';
    g.beginPath();
    g.ellipse(1177, 520, 21, 24, 0, 0, TAU);
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
  const dashTouchBtn = document.querySelector('[data-action="dash"]');
  const superTouchBtn = document.querySelector('[data-action="super"]');
  let dashRingDeg = -1;
  let superTouchReady = null;
  const resultTitle = $('resultTitle');
  const resultKicker = $('resultKicker');
  const resultSub = $('resultSub');
  const resultTime = $('resultTime');
  const resultHits = $('resultHits');
  const panelMap = { menu: menuPanel, pause: pausePanel, result: resultPanel, shop: shopPanel };

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
    if (mapBackButton) mapBackButton.hidden = !(game.scene === 'map' && !name);
  }

  function setShopNotice(text) {
    const el = $('shopNotice');
    if (el) el.textContent = text;
  }

  function renderShop() {
    updateMetaUI();
    const buyHeart = $('buyHeartButton');
    const buySmoke = $('buySmokeButton');
    if (!buyHeart || !buySmoke) return;
    buyHeart.disabled = progress.coins < 1 || progress.bonusHearts >= MAX_BONUS_HEARTS;
    buyHeart.textContent =
      progress.bonusHearts >= MAX_BONUS_HEARTS ? 'МАКСИМУМ' : '1 МОНЕТА';
    buySmoke.disabled = progress.coins < 2 || progress.smokeDash;
    buySmoke.textContent = progress.smokeDash ? 'КУПЛЕНО' : '2 МОНЕТЫ';
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

  function buyHeart() {
    if (progress.bonusHearts >= MAX_BONUS_HEARTS) {
      setShopNotice('Больше сердец не помещается в чемодан.');
      return;
    }
    if (progress.coins < 1) {
      setShopNotice('Не хватает монеты. Победи босса и возвращайся!');
      Sound.sfx('hurt');
      return;
    }
    progress.coins -= 1;
    progress.bonusHearts += 1;
    saveProgress();
    hero.maxHp = heroMaxHp();
    hero.hp = hero.maxHp;
    updateMetaUI();
    renderShop();
    setShopNotice('Сердце Летунова добавлено: +1 сердце (5 HP).');
    Sound.sfx('win');
  }

  function buySmoke() {
    if (progress.smokeDash) {
      setShopNotice('Дымовая завеса уже куплена.');
      return;
    }
    if (progress.coins < 2) {
      setShopNotice('Нужно 2 монеты. Победи боссов ещё раз!');
      Sound.sfx('hurt');
      return;
    }
    progress.coins -= 2;
    progress.smokeDash = true;
    saveProgress();
    updateMetaUI();
    renderShop();
    setShopNotice('Дымовая завеса куплена: рывок теперь скрывает героя.');
    Sound.sfx('win');
  }

  if ($('buyHeartButton')) $('buyHeartButton').addEventListener('click', buyHeart);
  if ($('buySmokeButton')) $('buySmokeButton').addEventListener('click', buySmoke);
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
    clearPressed();
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
    clearPressed();
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
    clearPressed();
  }

  function togglePause(force) {
    if (game.scene !== 'fight' || game.ended) return;
    const want = force === undefined ? !game.paused : !!force;
    if (want === game.paused) return;
    game.paused = want;
    document.body.classList.toggle('is-paused', want);
    clearPressed();
    if (want) {
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
    Sound.stopMusic();
    Sound.sfx(win ? 'win' : 'lose');
    const cfg = BOSS_CONFIG[game.bossId] || BOSS_CONFIG.letunov;
    let rewardText = '';
    if (win && !game.coinEarned) {
      game.coinEarned = true;
      progress.coins += 1;
      progress.wins[cfg.id] = (progress.wins[cfg.id] || 0) + 1;
      saveProgress();
      rewardText = ' Получена 1 монета!';
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
  $('retryButton').addEventListener('click', () => startGame(game.bossId));
  $('resumeButton').addEventListener('click', () => togglePause(false));
  $('restartButton').addEventListener('click', () => startGame(game.bossId));
  $('quitButton').addEventListener('click', goMenu);
  $('menuButton').addEventListener('click', goMap);
  if (mapBackButton) mapBackButton.addEventListener('click', goMenu);
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
      const readyNow = h.cards >= 5 && h.superCd <= 0 && !h.dead;
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
    h.parryCd = Math.max(0, h.parryCd - dt);
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

    // парирование: нажать прыжок в воздухе рядом с розовым сердцем
    if (pressed.jump && !h.onGround && h.parryCd <= 0 && tryParry()) {
      pressed.jump = false;
      h.jumpBuf = 0;
    }

    if (pressed.jump) h.jumpBuf = 0.13;
    if (pressed.super) trySuperAttack();
    if (
      h.cards >= 5 &&
      h.superCd <= 0 &&
      h.superT <= 0 &&
      game.introT <= 0.9 &&
      !boss.dying &&
      !game.ended
    ) {
      trySuperAttack();
    }

    const move = h.hurtT > 0 ? 0 : (held.right ? 1 : 0) - (held.left ? 1 : 0);
    if (move !== 0) {
      h.face = move;
      h.lastMove = move;
    }

    // присед спасает от растянутого живота и от кулака
    const wantCrouch = held.crouch && h.onGround && h.dashT <= 0 && h.hurtT <= 0 && !h.dead;
    h.crouchK = approach(h.crouchK, wantCrouch ? 1 : 0, dt * 9);
    const crouched = h.crouchK > 0.6;

    const canShoot =
      game.scene === 'fight' && game.introT <= 0.9 && !boss.dying && h.hurtT <= 0;
    const shooting =
      canShoot && (settings.autoFire || held.shoot) && h.dashT <= 0 && h.superT <= 0;

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
      h.invuln = Math.max(h.invuln, progress.smokeDash ? 0.58 : 0.32);
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

    // прыжок
    if (
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

    // огонь
    if (shooting && h.shootCd <= 0) {
      h.shootCd = 0.09;
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

    // одна-единственная платформа под ногами — трамплин-доска
    let floorY = GROUND;
    if (h.vy >= 0) {
      for (const p of platforms) {
        if (!p.solid) continue;
        if (Math.abs(h.x - p.x) > p.w / 2 - 6) continue;
        if (prevY <= p.y + 3 && h.y >= p.y) floorY = Math.min(floorY, p.y);
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
    h.parryCd = 0.35;
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

  function tryParry() {
    const h = hero;
    const cx = h.x;
    const cy = h.y - HERO_H * 0.5;
    const near = (x, y, r = 78) => {
      const dx = x - cx;
      const dy = y - cy;
      return dx * dx + dy * dy <= r * r;
    };

    // Парируются только розовые атаки боссов, а не случайные орбы.
    for (let i = soundWaves.length - 1; i >= 0; i--) {
      const w = soundWaves[i];
      if (!w.parryable || !near(w.x, GROUND - 148, 134)) continue;
      soundWaves.splice(i, 1);
      parrySuccess(w.x, GROUND - 148);
      return true;
    }
    for (let i = bossShots.length - 1; i >= 0; i--) {
      const s = bossShots[i];
      if (!s.parryable || !near(s.x, s.y, 98)) continue;
      bossShots.splice(i, 1);
      if (s.kind === 'flower') spawnPetalBurst(s.x, s.y, s.color, 14);
      parrySuccess(s.x, s.y);
      return true;
    }
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i];
      if (!w.parryable || !near(w.x, GROUND - 156, 128)) continue;
      waves.splice(i, 1);
      parrySuccess(w.x, GROUND - 156);
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
    if (game.scene !== 'fight' || h.dead || h.superCd > 0 || h.cards < 5) return;
    h.cards = 0;
    h.cardCharge = 0;
    h.superCd = 1.2;
    h.superT = 1;
    h.invuln = Math.max(h.invuln, 1.35);
    h.shootAnim = 0;
    game.hitStop = 0.11;
    game.flash = 0.5;
    game.flashColor = GOLD_BRIGHT;
    game.shake = Math.max(game.shake, 18);
    waves.length = 0;
    const dir = h.face || h.lastMove || 1;
    bullets.push({
      x: h.x + dir * 48,
      y: h.y - 62,
      vx: dir * 980,
      vy: 0,
      life: 1.15,
      t: 0,
      dir,
      dead: false,
      big: true,
      dmg: SUPER_DAMAGE,
      r: 64,
    });
    spawnComic('СУПЕР-ЗВЕЗДА!', h.x, h.y - 150, 42, GOLD_BRIGHT);
    spawnRing(h.x, h.y - 60, GOLD_BRIGHT, 70);
    spawnRing(h.x, h.y - 60, CREAM, 44);
    for (let i = 0; i < 30; i++) {
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
    // Герой стреляет строго туда, куда смотрит, и не разворачивается к боссу.
    const dir = h.face || h.lastMove || 1;
    const crouchK = clamp(h.crouchK, 0, 1);
    const bx = h.x + dir * 31;
    const by = h.y - lerp(52, 30, crouchK);
    bullets.push({
      x: bx,
      y: by,
      vx: dir * 1180,
      vy: 0,
      life: 1.4,
      t: 0,
      dir,
      dead: false,
    });
    for (let i = 0; i < 4; i++) {
      addParticle({
        kind: 'spark',
        x: bx,
        y: by,
        vx: dir * rand(40, 240) + rand(-60, 60),
        vy: rand(-110, 90),
        life: rand(0.08, 0.2),
        maxLife: 0.2,
        size: rand(2, 5),
        color: pick([GOLD_BRIGHT, CREAM, RUST]),
        rot: rand(0, TAU),
        vr: rand(-10, 10),
        grav: 300,
        drag: 2,
      });
    }
    Sound.sfx('shoot');
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

  function spawnSoundWave(parryable) {
    const b = boss;
    const dir = b.face;
    soundWaves.push({
      x: clamp(b.x + dir * 96, ARENA_L + 36, ARENA_R - 36),
      dir,
      speed: b.phase === 2 ? 345 : 305,
      t: 0,
      bounces: 0,
      maxBounces: 3,
      parryable: !!parryable,
      hot: b.phase === 2,
    });
    if (parryable && !b.parryTipShown) {
      b.parryTipShown = true;
      spawnComic('РОЗОВАЯ ВОЛНА — ПРЫГНИ И ЖМИ ПРЫЖОК!', W / 2, GROUND - 340, 15, PINK_BRIGHT);
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
      // В первой фазе Летунов не бьёт рукой: только прыжки и удары креслом.
      if (b.attackCount === 0) attack = 'slam';
      else if (b.attackCount === 1) attack = 'hop';
      else attack = b.lastAttack === 'slam' ? 'hop' : 'slam';
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
    b.x = 1034;
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
    specs.forEach((spec) => {
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
      color: index % 2 ? PINK : '#8fd0a0',
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
    b.x = 1034;
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
          spawnComic('ЛЕЗЬ НА КРЫШУ!', W / 2, GROUND - 360, 31, GOLD_BRIGHT);
          spawnComic('ПРЫГАЙ ПО ПАРТАМ И ПОЛКАМ', W / 2, GROUND - 320, 12, CREAM);
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
    if (game.bossId === 'denis') {
      updateDenisBoss(dt);
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
        b.screamWaveT -= dt;
        if (b.screamCount < 5 && b.screamWaveT <= 0) {
          spawnSoundWave(b.screamCount % 2 === 1);
          b.screamCount++;
          b.screamWaveT = 0.36;
          Sound.sfx('slam');
          game.shake = Math.max(game.shake, 4);
        }
        if (b.timer > 2.25) toIdle();
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
    const thickness = game.difficulty === 'hard' ? 11 : 8;
    return denisLaserSegments().some((s) =>
      segmentHitsRect(s.x1, s.y1, s.x2, s.y2, rect, thickness)
    );
  }

  function damageBoss(amount, x, y, charge = true) {
    const b = boss;
    if (b.dying || game.ended) return;
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

    if (overlap(rect, bossBodyRect())) {
      hurtHero(boss.x);
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
      const wr = { x: w.x - 28, y: GROUND - 118, w: 56, h: 118 };
      if (overlap(rect, wr)) {
        hurtHero(w.x);
        return;
      }
    }

    if (game.bossId === 'denis' && denisLaserHits(rect)) {
      hurtHero(boss.x - 58);
      return;
    }

    for (const s of bossShots) {
      if (s.harmless) continue;
      if (circleRect(s.x, s.y, s.r + 3, rect)) {
        hurtHero(s.x);
        bossShots.splice(bossShots.indexOf(s), 1);
        if (s.kind === 'button') boss.buttonsOut = Math.max(0, boss.buttonsOut - 1);
        return;
      }
    }
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.t += dt;
      b.life -= dt;
      b.x += b.vx * dt;
      if (b.life <= 0 || b.x < 40 || b.x > W - 40) {
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
          color: pick([GOLD_BRIGHT, CREAM]),
          rot: 0,
          vr: 0,
          grav: 0,
          drag: 1,
        });
      }
      if (!boss.dying && !boss.exploded) {
        const r = bossBodyRect();
        const radius = b.big ? b.r || 54 : 5;
        if (circleRect(b.x, b.y, radius, r)) {
          bullets.splice(i, 1);
          if (b.big) {
            damageBoss(b.dmg || SUPER_DAMAGE, b.x, b.y, false);
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
            damageBoss(9, b.x, b.y);
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
      w.x += w.dir * w.speed * dt;
      if (
        (w.dir < 0 && w.x < ARENA_L + 28) ||
        (w.dir > 0 && w.x > ARENA_R - 28)
      ) {
        w.x = clamp(w.x, ARENA_L + 28, ARENA_R - 28);
        w.dir *= -1;
        w.bounces++;
        w.speed *= 1.06;
        spawnRing(w.x, GROUND - 64, w.parryable ? PINK_BRIGHT : CREAM, 30);
        spawnDust(w.x, GROUND, 6, 0.8);
        game.shake = Math.max(game.shake, 4);
        Sound.sfx('slam');
        if (w.bounces > w.maxBounces) {
          soundWaves.splice(i, 1);
          continue;
        }
      }
      if (w.t > 8.5) {
        soundWaves.splice(i, 1);
        continue;
      }
      if (Math.random() < dt * 18) {
        addParticle({
          kind: 'dot',
          x: w.x - w.dir * rand(10, 40),
          y: GROUND - rand(10, 90),
          vx: -w.dir * rand(40, 130),
          vy: rand(-130, 30),
          life: rand(0.2, 0.5),
          maxLife: 0.5,
          size: rand(2, 5),
          color: w.parryable ? pick([PINK, PINK_BRIGHT]) : pick([CREAM, GOLD, '#9ac7b4']),
          rot: 0,
          vr: 0,
          grav: 420,
          drag: 0.7,
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
        // Цветы постоянно теряют лепестки во время полёта.
        if (Math.random() < dt * 13) {
          addParticle({
            kind: 'petal',
            x: s.x + rand(-18, 18),
            y: s.y + rand(-16, 16),
            vx: -s.dir * rand(18, 80) + rand(-28, 28),
            vy: rand(-55, 26),
            life: rand(0.7, 1.35),
            maxLife: 1.35,
            size: rand(5, 9.5),
            color: s.color,
            rot: rand(0, TAU),
            vr: rand(-6, 6),
            grav: 130,
            drag: 0.75,
          });
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
    if (game.bossId !== 'denis' && boss.phase === 2 && !boss.dying) {
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

  function drawArenaHazards() {
    for (const p of platforms) {
      if (p.route) {
        drawSchoolRoutePlatform(p);
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
    updateWaves(dt);
    updateSoundWaves(dt);
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
    h.x = clamp(h.x + h.vx * dt, 105, 1180);

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
      mapState.toast = 'Подойди к цирку, школе или магазину';
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
          : 'Кресло, кулаки, живот и крик. Классика цирка.');
    }
    game.shopOpen = false;
    showPanel('difficulty');
    Sound.sfx('click');
    releaseAll();
  }

  function closeDifficulty() {
    pendingBossId = null;
    if (game.scene === 'map') showPanel(null);
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
    if (id === 'letunov' || id === 'denis') {
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
      ctx.save();
      ctx.translate(w.x, GROUND);
      const glow = ctx.createRadialGradient(0, -72, 8, 0, -72, 118);
      glow.addColorStop(0, pink ? 'rgba(255, 133, 186, 0.4)' : 'rgba(154, 210, 195, 0.3)');
      glow.addColorStop(1, pink ? 'rgba(255, 110, 170, 0)' : 'rgba(135, 201, 186, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -72, 118, 0, TAU);
      ctx.fill();

      // линии скорости
      ctx.strokeStyle = pink ? 'rgba(255, 212, 232, 0.46)' : 'rgba(224, 240, 223, 0.4)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-w.dir * (32 + i * 12), -34 - i * 24);
        ctx.lineTo(-w.dir * (56 + i * 14), -42 - i * 27);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.bezierCurveTo(-58, -34, -54, -104, -6, -126);
      ctx.bezierCurveTo(44, -108, 58, -40, 22, 0);
      ctx.closePath();
      fillStroke(ctx, pink ? '#f58dbb' : '#9ac7b4', INK, 5);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, -16);
      ctx.bezierCurveTo(-30, -48, -28, -92, 2, -108);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, -22);
      ctx.bezierCurveTo(29, -52, 27, -84, 8, -98);
      ctx.stroke();

      // двойные дуги звука
      ctx.strokeStyle = pink ? 'rgba(255, 228, 240, 0.78)' : 'rgba(226, 247, 235, 0.72)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(w.dir * -4, -74, 34 + i * 20, -1.3, 1.3);
        ctx.stroke();
      }

      if (pink) {
        const pulse = 1 + Math.sin(w.t * 9) * 0.1;
        ctx.save();
        ctx.translate(0, -158);
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
        ctx.strokeText('ПАРИ', 0, -21);
        ctx.fillText('ПАРИ', 0, -21);
        ctx.restore();
      }
      // отражения от стен
      if (w.bounces > 0) {
        ctx.fillStyle = 'rgba(240, 228, 190, 0.6)';
        ctx.font = `700 8px Verdana, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('×' + (w.maxBounces - w.bounces + 1), 0, 18);
      }
      ctx.restore();
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
        fillStroke(ctx, s.color, INK, 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-3, -27, 4, 6, -0.2, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      circle(ctx, 0, 0, 17, '#f5d069', INK, 3);
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
    circle(ctx, 0, 2, s.r, s.color, INK, 3.5);
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

  function drawBossShots() {
    for (const s of bossShots) {
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
      const rot = game.time * 14 * b.dir;
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
    const cx = hero.x;
    const cy = hero.y - HERO_H * 0.5;
    let near = null;
    let best = 108 * 108;
    const consider = (x, y, r) => {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= Math.max(r, 92) * Math.max(r, 92) && d2 < best) {
        best = d2;
        near = { x, y };
      }
    };
    for (const s of bossShots) {
      if (s.parryable) consider(s.x, s.y, s.r + 64);
    }
    for (const w of waves) {
      if (w.parryable) consider(w.x, GROUND - 156, 92);
    }
    for (const w of soundWaves) {
      if (w.parryable) consider(w.x, GROUND - 148, 96);
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

    drawHero();
    drawMapPrompt();
    drawForeground();
    drawMapHUD();
  }

  function drawMapPrompt() {
    const b = mapState.near;
    if (!b) return;
    const x = clamp(hero.x, 230, W - 230);
    const y = 420;
    const label = b.kind === 'school' ? 'ВОЙТИ В ШКОЛУ' : b.kind === 'circus' ? 'ВОЙТИ В ЦИРК' : 'ОТКРЫТЬ МАГАЗИН';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(game.time * 1.7) * 0.008);
    roundRect(ctx, -176, -48, 352, 96, 13);
    fillStroke(ctx, 'rgba(24, 12, 16, 0.88)', 'rgba(240, 200, 119, 0.82)', 2.4);
    ctx.fillStyle = CREAM;
    ctx.font = `900 21px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, -15);
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.font = `700 10px Verdana, sans-serif`;
    ctx.fillText(IS_TOUCH ? 'НАЖМИ НА ЗДАНИЕ' : 'ПРОБЕЛ / ENTER', 0, 10);
    ctx.fillStyle = 'rgba(244, 227, 189, 0.62)';
    ctx.font = `500 8px Verdana, sans-serif`;
    ctx.fillText(b.kind === 'shop' ? 'Сердце Летунова · Дымовая завеса' : b.sub, 0, 28);
    // указатель вниз
    ctx.fillStyle = 'rgba(24, 12, 16, 0.88)';
    ctx.beginPath();
    ctx.moveTo(-9, 46);
    ctx.lineTo(9, 46);
    ctx.lineTo(0, 59);
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
    ctx.fillText('ГОРОДОК ЛЕТУНОВА', W / 2, 43);
    ctx.fillStyle = 'rgba(240, 200, 119, 0.82)';
    ctx.font = `700 8px Verdana, sans-serif`;
    ctx.fillText('ВЫБЕРИ, КУДА ПОЙТИ: ЦИРК · ШКОЛА · МАГАЗИН', W / 2, 64);

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

  function drawStage() {
    const school = game.bossId === 'denis';
    const floor3 = school && game.schoolFloor === 3;
    if (floor3 && schoolFloor3BgCanvas) ctx.drawImage(schoolFloor3BgCanvas, 0, 0);
    else if (school && schoolBgCanvas) ctx.drawImage(schoolBgCanvas, 0, 0);
    else if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0);

    if (boss.phase >= 2 && game.scene !== 'menu') {
      ctx.fillStyle = school ? 'rgba(37, 87, 76, 0.045)' : 'rgba(120, 30, 25, 0.045)';
      ctx.fillRect(0, 0, W, GROUND + 20);
    }

    if (!school) drawSpotlights();
    else {
      if (floor3) drawThirdFloorAtmosphere();
      drawSchoolDesks();
      drawSchoolLight();
      drawSchoolCeilingBreak();
    }
    drawMotes();
    drawCraters();
    if (!school) {
      drawSlamWarning();
      drawPunchWarning();
      drawBellyWarning();
      drawScreamWarning();
      drawChalkWarning();
    } else {
      drawDenisWarnings();
    }

    if (!boss.exploded) {
      const shadowR = school ? 172 : boss.inChair ? 148 : 108;
      drawShadow(boss.x, GROUND, shadowR, boss.airY, 0.32);
    }
    drawShadow(hero.x, GROUND, 27, Math.max(0, GROUND - hero.y), 0.26);

    drawBoss();
    drawArenaHazards();
    drawWaves();
    drawSoundWaves();
    drawBossShots();
    drawDenisBirds();
    drawGhosts();
    drawHero();
    drawParryPrompt();
    drawDenisLaser();
    drawBossPunchArm();
    drawBullets();
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
      heroLimb(ctx, 11, -47, 22, -51, 32 - recoil, -52, CREAM, 6.5);
      heroGlove(ctx, 34 - recoil, -52, 7.2);
      if (h.shootAnim > 0.35) {
        ctx.save();
        ctx.translate(43 - recoil, -52);
        ctx.rotate(t * 12);
        starPath(ctx, 0, 0, 5, 9 + h.shootAnim * 5, 3.5, -Math.PI / 2);
        fillStroke(ctx, GOLD_BRIGHT, INK, 2);
        ctx.restore();
      }
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

    // волосы сверху
    g.beginPath();
    g.moveTo(-57, -22);
    g.bezierCurveTo(-61, -57, -36, -72, -5, -67);
    g.bezierCurveTo(19, -73, 47, -57, 53, -31);
    g.bezierCurveTo(31, -45, 17, -47, 5, -52);
    g.bezierCurveTo(-10, -43, -33, -41, -48, -48);
    g.bezierCurveTo(-51, -41, -54, -32, -57, -22);
    g.closePath();
    fillStroke(g, '#4f3426', INK, 4);
    // вихор
    g.beginPath();
    g.moveTo(1, -68);
    g.bezierCurveTo(12, -91, 35, -92, 40, -76);
    g.bezierCurveTo(28, -82, 17, -76, 12, -64);
    fillStroke(g, '#4f3426', INK, 3);

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
      g.moveTo(-34, -19);
      g.lineTo(-10, -21);
      g.moveTo(10, -21);
      g.lineTo(34, -19);
    }
    g.stroke();

    // нос
    g.beginPath();
    g.moveTo(0, 12);
    g.quadraticCurveTo(-5, 23, 3, 25);
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.stroke();
    // веснушки
    g.fillStyle = 'rgba(139, 74, 48, 0.5)';
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1;
      g.beginPath();
      g.arc(side * (17 + (i % 3) * 7), 22 + (i % 2) * 4, 1.2, 0, TAU);
      g.fill();
    }

    // рот
    g.strokeStyle = INK;
    g.lineWidth = 3.4;
    if (expr === 'dead') {
      g.beginPath();
      g.arc(0, 39, 9, Math.PI + 0.3, 0.2);
      g.stroke();
    } else if (angry) {
      g.beginPath();
      g.ellipse(0, 41, 18, 13, 0, 0, TAU);
      fillStroke(g, '#4f1b22', INK, 3);
      g.fillStyle = CREAM;
      g.beginPath();
      g.moveTo(-14, 33);
      g.quadraticCurveTo(0, 30, 14, 33);
      g.quadraticCurveTo(0, 37, -14, 33);
      g.fill();
      g.fillStyle = '#c36664';
      g.beginPath();
      g.ellipse(1, 48, 8, 5, 0, 0, TAU);
      g.fill();
    } else {
      g.beginPath();
      g.moveTo(-15, 34);
      g.quadraticCurveTo(1, 45, 19, 32);
      g.stroke();
      g.fillStyle = 'rgba(255, 249, 232, 0.72)';
      g.beginPath();
      g.ellipse(4, 39, 7, 2.2, 0, 0, TAU);
      g.fill();
    }

    // пластырь на щеке
    g.save();
    g.translate(-31, 29);
    g.rotate(-0.32);
    g.fillStyle = '#ead6ad';
    g.fillRect(-11, -5, 22, 10);
    g.strokeStyle = 'rgba(123, 76, 51, 0.55)';
    g.lineWidth = 1.1;
    g.strokeRect(-11, -5, 22, 10);
    g.fillStyle = 'rgba(146, 87, 61, 0.28)';
    g.fillRect(-2, -5, 4, 10);
    g.restore();

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

    // рубашка: белая, с воротником и галстуком
    g.beginPath();
    g.moveTo(-103, -304);
    g.quadraticCurveTo(-46, -326, 10, -303);
    g.quadraticCurveTo(34, -247, 25, -153);
    g.quadraticCurveTo(-43, -131, -111, -158);
    g.quadraticCurveTo(-128, -235, -103, -304);
    g.closePath();
    const shirt = g.createLinearGradient(-100, -320, 10, -140);
    shirt.addColorStop(0, b.phase === 3 ? '#e3d7bd' : '#f5f0df');
    shirt.addColorStop(0.55, b.phase === 3 ? '#d6c9b1' : '#eadfc5');
    shirt.addColorStop(1, b.phase === 3 ? '#b8aa93' : '#cfc0a2');
    fillStroke(g, shirt, INK, 4.6);
    // складки рубашки
    g.strokeStyle = 'rgba(118, 97, 68, 0.28)';
    g.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(-72 + i * 30, -274);
      g.quadraticCurveTo(-64 + i * 27, -220, -74 + i * 28, -164);
      g.stroke();
    }
    // воротник
    g.beginPath();
    g.moveTo(-70, -303);
    g.quadraticCurveTo(-44, -282, -27, -268);
    g.lineTo(-40, -250);
    g.quadraticCurveTo(-63, -278, -88, -298);
    g.closePath();
    fillStroke(g, '#fbf6e5', INK, 3);
    g.beginPath();
    g.moveTo(3, -303);
    g.quadraticCurveTo(-16, -281, -26, -268);
    g.lineTo(-12, -250);
    g.quadraticCurveTo(17, -279, 42, -299);
    g.closePath();
    fillStroke(g, '#fbf6e5', INK, 3);
    // галстук
    g.beginPath();
    g.moveTo(-28, -289);
    g.lineTo(-14, -289);
    g.lineTo(-8, -270);
    g.lineTo(-21, -257);
    g.lineTo(-31, -271);
    g.closePath();
    fillStroke(g, '#8d2b2e', INK, 2.6);
    g.beginPath();
    g.moveTo(-19, -267);
    g.lineTo(-4, -266);
    g.lineTo(2, -196);
    g.lineTo(-16, -181);
    g.lineTo(-28, -202);
    g.closePath();
    fillStroke(g, '#9f3530', INK, 2.8);
    // пуговицы рубашки, часть может быть в полёте
    const buttonPositions = [
      { x: -9, y: -251 },
      { x: -14, y: -224 },
      { x: -19, y: -197 },
      { x: -24, y: -171 },
    ];
    buttonPositions.forEach((p, i) => {
      if (i < b.buttonsOut) return;
      circle(g, p.x, p.y, 3.2, '#f5f7e8', SKIN_SHADOW, 1.2);
      g.fillStyle = SKIN_SHADOW;
      g.font = `700 5px Verdana, sans-serif`;
      g.textAlign = 'center';
    });
    // карман с ручкой
    g.strokeStyle = 'rgba(105, 80, 53, 0.5)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-98, -217);
    g.quadraticCurveTo(-83, -208, -69, -218);
    g.stroke();
    g.fillStyle = '#a8382c';
    g.fillRect(-85, -230, 4, 18);
    g.fillStyle = '#e8d2a3';
    g.fillRect(-86, -232, 6, 3);

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
    // тетрадь, пенал, мел
    g.save();
    g.translate(-214, -172);
    g.rotate(-0.08);
    roundRect(g, -42, -22, 92, 45, 2);
    fillStroke(g, '#e7d7b1', INK, 2.2);
    g.strokeStyle = 'rgba(80, 58, 38, 0.4)';
    g.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(-32, -12 + i * 7);
      g.lineTo(38, -12 + i * 7);
      g.stroke();
    }
    g.restore();
    roundRect(g, -102, -179, 64, 14, 5);
    fillStroke(g, '#3e746a', INK, 2);
    g.fillStyle = GOLD;
    g.fillRect(-92, -176, 44, 3);
    g.fillStyle = '#efe5c8';
    g.fillRect(-24, -172, 31, 5);
    g.fillStyle = '#d87858';
    g.fillRect(-14, -167, 21, 4);
    g.restore();

    // руки: одна лежит на столе, вторая показывает пальцами пистолет
    const shoulderY = -284;
    const shirtArm = b.phase === 3 ? '#e3d7bd' : '#f5f0df';
    if (finger) {
      drawDenisArm(g, -91, shoulderY, -246, -205, -32, 20, 16, 0.95, shirtArm, false);
      drawDenisFingerGun(g, -266, -207, -0.08, 0.95);
      drawDenisArm(g, 22, shoulderY, 12, -192, 22, 18, 15, 0.88, shirtArm, true);
    } else {
      drawDenisArm(g, -91, shoulderY, -203, -185, -27, 9, 16, 0.9, shirtArm, true);
      drawDenisArm(g, 24, shoulderY, 20, -185, 22, 10, 15, 0.88, shirtArm, true);
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

    // супер-звёзды: при 5/5 супер вылетает автоматически
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
    ctx.fillText(hero.cards >= 5 ? 'СУПЕР ГОТОВ!' : 'ЗВЁЗДЫ АТАКИ', 31, cardY + 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = hero.cards > 0 ? GOLD_BRIGHT : 'rgba(244, 227, 189, 0.5)';
    ctx.fillText(`${hero.cards}/5`, 202, cardY + 12);
    ctx.font = `700 7px Verdana, sans-serif`;
    ctx.fillStyle = hero.cards >= 5 ? PINK_BRIGHT : 'rgba(244, 227, 189, 0.48)';
    ctx.fillText(hero.cards >= 5 ? 'АВТО' : 'АВТО', 202, cardY + 25);
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
    else drawStage();

    ctx.setTransform(viewScale, 0, 0, viewScale, viewOX, viewOY);
    drawFlash();
    if (game.scene !== 'menu' && game.scene !== 'map') drawHUD();
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







