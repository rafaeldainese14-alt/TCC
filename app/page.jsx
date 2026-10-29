"use client";

import { useEffect, useRef, useState } from "react";

const INITIAL_DATA = {
  stars: 0,
  totalStars: 0,
  xp: 0,
  level: 1,
  happiness: 80,
  hunger: 80,
  energy: 80,
  hygiene: 80,
  totalClicks: 0,
  actions: {
    talk: 0,
    feed: 0,
    poke: 0,
    laugh: 0,
    dance: 0,
    sleep: 0,
  },
  skin: "😀",
  ownedSkins: ["😀"],
  face: "😀",
  hat: "",
  glasses: "",
  accessory: "",
  effect: "",
  room: "sala",
  terrorActive: false,
  lastSeen: 0,
  settings: { sound: true, voice: true },
};

const SKINS = [
  { emoji: "😀", name: "Padrão", price: 0 },
  { emoji: "😺", name: "Gatinho", price: 30 },
  { emoji: "🤖", name: "Robozinho", price: 50 },
  { emoji: "👽", name: "Alien", price: 75 },
  { emoji: "💀", name: "Caveira", price: 100 },
  { emoji: "👻", name: "Fantasma", price: 150 },
  { emoji: "🥳", name: "Festa", price: 200 },
  { emoji: "🤠", name: "Cowboy", price: 250 },
];

const ACTIONS = [
  { id: "talk", icon: "💬", label: "Falar", unlock: 0 },
  { id: "feed", icon: "🍕", label: "Comida", unlock: 0 },
  { id: "poke", icon: "👉", label: "Cutucar", unlock: 10 },
  { id: "laugh", icon: "🤣", label: "Rir", unlock: 25 },
  { id: "dance", icon: "🕺", label: "Dançar", unlock: 50 },
  { id: "sleep", icon: "😴", label: "Dormir", unlock: 75 },
];

const FACES = ["😀", "😎", "😈", "🤖", "😺", "🥳", "🤠"];
const HATS = ["", "🎩", "👑", "🧢", "🎓", "🤠"];
const GLASSES = ["", "🕶️", "🤓", "🥽", "❤️"];
const ACCESSORIES = ["", "🎸", "⚔️", "🎮", "🛹", "🎁"];
const EFFECTS = ["", "🔥", "⚡", "✨", "🌌", "💫"];

const FOODS = [
  { id: "pizza", emoji: "🍕", name: "Pizza", reaction: "Hmm... pizza! 😋", hunger: 18 },
  { id: "burger", emoji: "🍔", name: "Hambúrguer", reaction: "Delícia! 🤤", hunger: 22 },
  { id: "cake", emoji: "🍰", name: "Bolo", reaction: "Eu amo bolo! 🎂", hunger: 16 },
  { id: "apple", emoji: "🍎", name: "Maçã", reaction: "Croc croc! 🍎", hunger: 12 },
  { id: "donut", emoji: "🍩", name: "Rosquinha", reaction: "Isso é muito bom! 😋", hunger: 14 },
];

const NORMAL_PHRASES = [
  "Olá! 👋",
  "Hehehe! 😄",
  "Vamos brincar!",
  "Estou muito feliz!",
  "Você voltou! ⭐",
  "Que legal!",
  "O que vamos fazer agora?",
];

const HORROR_PHRASES = [
  "Não me toque.",
  "Eu não quero fazer isso.",
  "Por favor...",
  "Tem alguém aqui?",
  "Você também está vendo isso?",
  "Não olhe para trás.",
];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function xpNeeded(level) {
  return 100 + (level - 1) * 35;
}

export default function Home() {
  const [data, setData] = useState(INITIAL_DATA);
  const [hydrated, setHydrated] = useState(false);
  const [speech, setSpeech] = useState("Olá! 👋");
  const [animation, setAnimation] = useState("");
  const [food, setFood] = useState(null);
  const [screen, setScreen] = useState("game");
  const [shopOpen, setShopOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [floatingStars, setFloatingStars] = useState([]);
  const [terrorTransition, setTerrorTransition] = useState(false);
  const [terrorEvent, setTerrorEvent] = useState("");
  const [kitchenFood, setKitchenFood] = useState(null);
  const [miniGame, setMiniGame] = useState(null);
  const [miniScore, setMiniScore] = useState(0);
  const [miniTime, setMiniTime] = useState(15);
  const [miniTarget, setMiniTarget] = useState(0);

  const audioContext = useRef(null);
  const speechTimer = useRef(null);
  const animationTimer = useRef(null);
  const toastTimer = useRef(null);
  const miniTimer = useRef(null);
  const terrorRef = useRef(false);
  const prevLevel = useRef(null);
  const comboRef = useRef({ count: 0, last: 0 });
  const comboTimer = useRef(null);
  const [combo, setCombo] = useState(0);
  const [particles, setParticles] = useState([]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  terrorRef.current = data.terrorActive;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("talkingEmojiFusionSave");
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = {
          ...INITIAL_DATA,
          ...parsed,
          totalStars: parsed.totalStars ?? parsed.stars ?? 0,
          actions: {
            ...INITIAL_DATA.actions,
            ...(parsed.actions || {}),
          },
          settings: { ...INITIAL_DATA.settings, ...(parsed.settings || {}) },
          ownedSkins: parsed.ownedSkins || ["😀"],
        };

        // Progresso offline: 1 ponto a cada 5 min (máx. 40), sem derrubar abaixo de 15.
        if (parsed.lastSeen && !merged.terrorActive) {
          const ticks = Math.min(40, Math.floor((Date.now() - parsed.lastSeen) / 300000));
          for (const key of ["hunger", "energy", "hygiene", "happiness"]) {
            merged[key] = clamp(Math.max(Math.min(merged[key], 15), merged[key] - ticks));
          }
        }

        setData(merged);
      }
    } catch {
      // Mantém o estado inicial se o save estiver inválido.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("talkingEmojiFusionSave", JSON.stringify({ ...data, lastSeen: Date.now() }));
  }, [data, hydrated]);

  // Aviso de nível: fora do setData para não duplicar em Strict Mode.
  useEffect(() => {
    if (!hydrated) return;
    if (prevLevel.current !== null && data.level > prevLevel.current) {
      showToast(`🆙 Nível ${data.level}!`);
      playSound("level");
      spawnParticles("🎉", 14);
      navigator.vibrate?.([30, 40, 30]);
    }
    prevLevel.current = data.level;
  }, [data.level, hydrated]);

  useEffect(() => {
    return () => {
      clearTimeout(speechTimer.current);
      clearTimeout(animationTimer.current);
      clearTimeout(toastTimer.current);
      clearInterval(miniTimer.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Pequena degradação de necessidades: o emoji realmente precisa de cuidados.
  useEffect(() => {
    if (!hydrated || data.terrorActive) return;

    const interval = setInterval(() => {
      setData((current) => ({
        ...current,
        hunger: clamp(current.hunger - 1),
        energy: clamp(current.energy - 1),
        hygiene: clamp(current.hygiene - 1),
        happiness: clamp(current.happiness - (current.hunger < 25 || current.hygiene < 25 ? 1 : 0)),
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, [hydrated, data.terrorActive]);

  function getAudioContext() {
    if (!audioContext.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext.current = new AudioCtx();
    }
    return audioContext.current;
  }

  function playSound(type = "click") {
    if (!data.settings.sound) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const frequencies = {
        click: 440,
        star: 660,
        eat: 300,
        happy: 520,
        horror: 110,
        unlock: 780,
        level: 920,
      };

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.frequency.value = frequencies[type] || 440;
      oscillator.type = type === "horror" ? "sawtooth" : "sine";

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        type === "horror" ? 0.04 : 0.07,
        ctx.currentTime + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.17);
    } catch {
      // Som é complementar.
    }
  }

  function speak(text, horror = data.terrorActive) {
    if (!data.settings.voice || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = "pt-BR";
    voice.rate = horror ? 0.72 : 1;
    voice.pitch = horror ? 0.55 : 1.05;
    voice.volume = horror ? 0.65 : 1;
    window.speechSynthesis.speak(voice);
  }

  function showSpeech(text, options = {}) {
    clearTimeout(speechTimer.current);
    setSpeech(text);

    if (options.voice !== false) {
      speak(text, options.horror ?? data.terrorActive);
    }

    if (options.duration !== 0) {
      speechTimer.current = setTimeout(() => {
        setSpeech(terrorRef.current ? "..." : "Olá! 👋");
      }, options.duration || 3500);
    }
  }

  function runAnimation(name, duration = 1000) {
    clearTimeout(animationTimer.current);
    setAnimation(name);
    animationTimer.current = setTimeout(() => setAnimation(""), duration);
  }

  function showToast(message) {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }

  function addFloatingStar(amount) {
    const id = Date.now() + Math.random();

    setFloatingStars((current) => [
      ...current,
      {
        id,
        amount,
        x: 38 + Math.random() * 24,
        y: 38 + Math.random() * 18,
      },
    ]);

    setTimeout(() => {
      setFloatingStars((current) => current.filter((item) => item.id !== id));
    }, 1000);
  }

  function addStars(amount = 1, countInteraction = true) {
    addFloatingStar(amount);

    setData((current) => ({
      ...current,
      stars: current.stars + amount,
      totalStars: (current.totalStars || 0) + amount,
      totalClicks: current.totalClicks + (countInteraction ? 1 : 0),
    }));

    playSound("star");
  }

  function addXP(amount) {
    setData((current) => {
      let xp = current.xp + amount;
      let level = current.level;

      while (level < 30 && xp >= xpNeeded(level)) {
        xp -= xpNeeded(level);
        level += 1;
      }

      return { ...current, xp, level };
    });
  }

  function updateNeeds(changes) {
    setData((current) => {
      const next = { ...current };
      for (const [key, value] of Object.entries(changes)) {
        next[key] = clamp((next[key] ?? 0) + value);
      }
      return next;
    });
  }

  function increaseAction(action) {
    setData((current) => ({
      ...current,
      actions: {
        ...current.actions,
        [action]: (current.actions[action] || 0) + 1,
      },
    }));
  }

  function checkUnlock(action) {
    const requirement = ACTIONS.find((item) => item.id === action);
    if (!requirement || data.totalStars >= requirement.unlock) return true;

    showToast(`🔒 Ganhe ${requirement.unlock} ⭐ no total para liberar`);
    playSound("click");
    return false;
  }

  function spawnParticles(emoji, count = 6) {
    const batch = Array.from({ length: count }, () => ({
      id: Date.now() + Math.random(),
      emoji,
      dx: (Math.random() - 0.5) * 220,
      dy: -60 - Math.random() * 140,
    }));
    setParticles((current) => [...current, ...batch]);
    setTimeout(() => {
      setParticles((current) => current.filter((item) => !batch.includes(item)));
    }, 1100);
  }

  function handleEmojiClick(event) {
    // Combo: cliques com menos de 1,2s de intervalo somam; a cada 5 vale +1 estrela (máx. +4).
    const now = Date.now();
    const c = comboRef.current;
    c.count = now - c.last < 1200 ? c.count + 1 : 1;
    c.last = now;
    setCombo(c.count);
    clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => {
      comboRef.current.count = 0;
      setCombo(0);
    }, 1300);
    const bonus = 1 + Math.min(4, Math.floor(c.count / 5));

    // Inclina o emoji para o lado oposto ao toque.
    if (event?.currentTarget && event.clientX !== undefined) {
      const r = event.currentTarget.getBoundingClientRect();
      setTilt({
        x: ((event.clientX - (r.left + r.width / 2)) / r.width) * -16,
        y: ((event.clientY - (r.top + r.height / 2)) / r.height) * -16,
      });
      setTimeout(() => setTilt({ x: 0, y: 0 }), 160);
    }

    navigator.vibrate?.(10);
    spawnParticles(data.terrorActive ? "🩸" : c.count >= 5 ? "💖" : "✨", 3);
    addStars(bonus);
    addXP(3);

    if (data.terrorActive) {
      showSpeech(randomItem(HORROR_PHRASES), { horror: true });
      runAnimation("terrorShake", 700);
      playSound("horror");
      return;
    }

    showSpeech(randomItem([
      "Hehehe! 😄",
      "Ei! 😆",
      "Isso faz cócegas!",
      "Mais uma vez!",
      "⭐ +1!",
    ]), { voice: false });
    runAnimation("bounce", 500);
  }

  function handleAction(action) {
    if (!checkUnlock(action)) return;

    increaseAction(action);

    if (data.terrorActive) {
      handleHorrorAction(action);
      return;
    }

    switch (action) {
      case "talk":
        addStars(1, false);
        addXP(8);
        showSpeech(randomItem(NORMAL_PHRASES));
        spawnParticles("💬", 3);
        runAnimation("talk", 700);
        playSound("happy");
        break;

      case "feed": {
        const selectedFood = randomItem(FOODS);
        setFood(selectedFood.emoji);
        spawnParticles(selectedFood.emoji, 5);
        updateNeeds({
          hunger: selectedFood.hunger,
          happiness: 5,
        });
        addStars(2, false);
        addXP(12);
        showSpeech(selectedFood.reaction);
        runAnimation("eat", 900);
        playSound("eat");
        setTimeout(() => setFood(null), 1100);
        break;
      }

      case "poke":
        addStars(1, false);
        addXP(7);
        updateNeeds({ happiness: -4 });
        showSpeech("Ei! 😡");
        runAnimation("poke", 700);
        playSound("click");
        break;

      case "laugh":
        addStars(2, false);
        addXP(10);
        updateNeeds({ happiness: 12, energy: -3 });
        showSpeech("HAHAHAHA! 🤣");
        spawnParticles("😂", 5);
        runAnimation("laugh", 1000);
        playSound("happy");
        break;

      case "dance":
        addStars(3, false);
        addXP(15);
        updateNeeds({ happiness: 30, hunger: -4, energy: -4});
        showSpeech("Dança comigo! 🕺");
        spawnParticles("🎵", 6);
        runAnimation("dance", 1800);
        playSound("happy");
        break;

      case "sleep":
        addStars(2, false);
        addXP(12);
        updateNeeds({ energy: 25, happiness: 4, hygiene: -5 });
        showSpeech("Zzzzz... 😴");
        spawnParticles("💤", 4);
        runAnimation("sleep", 2400);
        setTimeout(() => {
          if (!terrorRef.current) showSpeech("Bom dia! 😲");
        }, 2300);
        break;

      default:
        break;
    }
  }

  function handleHorrorAction(action) {
    const horrorActions = {
      talk: ["Não quero conversar.", "Não me faça falar.", "Tem alguma coisa atrás de você."],
      poke: ["NÃO ME TOQUE.", "Eu pedi para parar.", "Por favor... não."],
      feed: ["Eu não quero isso.", "Isso não é comida.", "Tire isso daqui."],
      laugh: ["Eu não estou achando graça.", "Por que você está rindo?", "Pare."],
      dance: ["Eu não quero fazer isso.", "Meu corpo está se mexendo sozinho.", "Não consigo parar..."],
      sleep: ["Eu não consigo dormir.", "Tem alguma coisa no quarto.", "Eu ouvi alguém."],
    };

    showSpeech(randomItem(horrorActions[action] || HORROR_PHRASES), { horror: true });
    playSound("horror");

    const animations = {
      talk: ["terrorTalk", 1000],
      poke: ["terrorShake", 850],
      feed: ["terrorEat", 900],
      laugh: ["terrorLaugh", 1100],
      dance: ["terrorDance", 1700],
      sleep: ["terrorSleep", 1900],
    };

    const [name, duration] = animations[action] || ["terrorShake", 800];
    runAnimation(name, duration);
  }

  function eatKitchenFood(item) {
    setKitchenFood(item.id);

    if (!data.terrorActive) {
      updateNeeds({ hunger: item.hunger, happiness: 4 });
      addStars(1, false);
      addXP(5);
      showSpeech(item.reaction);
      runAnimation("eat", 800);
      playSound("eat");
    } else {
      showSpeech(randomItem([
        "Isso está frio...",
        "Eu não quero comer isso.",
        "Por que isso está se mexendo?",
        "Não me faça comer.",
      ]), { horror: true });
      runAnimation("terrorEat", 900);
      playSound("horror");
    }

    setTimeout(() => setKitchenFood(null), 1000);
  }

  function changeRoom(room) {
    setData((current) => ({ ...current, room }));

    const phrases = {
      sala: "A sala! 🛋️",
      cozinha: "Hora de cozinhar! 🍳",
      quarto: "Meu quarto! 🛏️",
      banheiro: "Banheiro! 🚿",
      jogos: "Hora de jogar! 🎮",
    };

    showSpeech(phrases[room], { voice: false });
    addXP(2);
  }

  function interactRoom(object) {
    switch (object) {
      case "tv":
        updateNeeds({ happiness: 10, energy: -3 });
        addXP(8);
        showSpeech("Estou assistindo TV! 📺");
        spawnParticles("✨", 4);
        break;
      case "bed":
        updateNeeds({ energy: 25, happiness: 4 });
        addXP(10);
        showSpeech("Vou descansar... 💤");
        spawnParticles("💤", 4);
        runAnimation("sleep", 1800);
        break;
      case "fridge":
        updateNeeds({ hunger: 10, happiness: 3 });
        addXP(7);
        showSpeech("Será que tem comida? 🍕");
        spawnParticles("🍕", 4);
        break;
      case "shower":
        updateNeeds({ hygiene: 30, happiness: 5 });
        addXP(10);
        showSpeech("Hora do banho! 🚿");
        spawnParticles("💦", 6);
        break;
      default:
        break;
    }
  }

  function buyOrSelectSkin(skin) {
    if (data.ownedSkins.includes(skin.emoji)) {
      setData((current) => ({ ...current, skin: skin.emoji, face: skin.emoji }));
      showToast(`${skin.name} equipado!`);
      playSound("click");
      return;
    }

    if (data.stars < skin.price) {
      showToast(`Você precisa de ${skin.price} ⭐`);
      playSound("click");
      return;
    }

    setData((current) => ({
      ...current,
      stars: current.stars - skin.price,
      ownedSkins: [...current.ownedSkins, skin.emoji],
      skin: skin.emoji,
      face: skin.emoji,
    }));

    showToast(`${skin.name} desbloqueado!`);
    playSound("unlock");
  }

  function changeCustomization(type, value) {
    setData((current) => ({ ...current, [type]: value }));
    playSound("click");
  }

  function toggleTerrorMode() {
    if (terrorTransition) return;

    if (!data.terrorActive && data.level < 5) {
      showToast("🔒 O segredo aparece no nível 5.");
      return;
    }

    setTerrorTransition(true);
    setTerrorEvent("transition");
    playSound("horror");

    setTimeout(() => {
      setData((current) => ({
        ...current,
        terrorActive: !current.terrorActive,
      }));

      setSpeech(!data.terrorActive ? "..." : "Tudo voltou ao normal... 😄");

      setTimeout(() => {
        setTerrorTransition(false);
        setTerrorEvent("");
      }, 700);
    }, 400);
  }

  function startMiniGame(type) {
    clearInterval(miniTimer.current);
    setMiniGame(type);
    setMiniScore(0);
    setMiniTime(15);
    setMiniTarget(Math.floor(Math.random() * 12));

    miniTimer.current = setInterval(() => {
      setMiniTime((current) => {
        if (current <= 1) {
          clearInterval(miniTimer.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  function miniGameClick() {
    if (!miniGame || miniTime <= 0) return;

    if (miniGame === "target") {
      const next = Math.floor(Math.random() * 12);
      setMiniTarget(next);
    }

    setMiniScore((current) => current + 1);
    playSound("click");
  }

  function finishMiniGame() {
    clearInterval(miniTimer.current);

    const reward = miniScore * 2;
    if (reward <= 0) {
      setMiniGame(null);
      showSpeech("Vamos tentar de novo? 🙂");
      return;
    }
    addStars(reward, false);
    addXP(reward * 2);
    updateNeeds({ happiness: 5, energy: -3 });
    showSpeech(`Você ganhou ${reward} ⭐!`);
    setMiniGame(null);
  }

  const requiredXP = xpNeeded(data.level);
  const xpPercent = Math.min(100, (data.xp / requiredXP) * 100);
  const isTerror = data.terrorActive;

  function getDisplayedEmoji() {
    if (isTerror) return "😨";
    if (animation === "poke") return "😡";
    if (animation === "laugh") return "🤣";
    if (animation === "dance") return "🕺";
    if (animation === "sleep") return "😴";
    if (animation === "eat") return "😋";
    if (data.hunger < 20) return "😢";
    if (data.hygiene < 20) return "🤢";
    if (data.energy < 20) return "🥱";
    return data.face || data.skin || "😀";
  }

  if (!hydrated) {
    return (
      <main className="loading-screen">
        <div className="loading-emoji">😀</div>
        <strong>Talking Emoji</strong>
        <p>Carregando seu amigo...</p>
      </main>
    );
  }

  return (
    <main
      className={`app ${isTerror ? "terror-mode" : ""} ${
        terrorTransition ? "terror-transition" : ""
      }`}
    >
      <div className="game-panel">
        <header className="top-bar">
          <div className="brand">
            <span className="brand-icon">{isTerror ? "☠️" : "😀"}</span>
            <div>
              <strong>Talking Emoji</strong>
              <small>Seu amigo virtual • LV {data.level}</small>
            </div>
          </div>

          <div className="top-right">
            <div className="star-counter">
              <span>⭐</span>
              <strong>{data.stars}</strong>
            </div>
            <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Configurações">
              ⚙️
            </button>
          </div>
        </header>

        <div className="progress-strip">
          <div className="needs">
            {[
              ["❤️", "Felicidade", data.happiness],
              ["🍔", "Fome", data.hunger],
              ["⚡", "Energia", data.energy],
              ["🧼", "Higiene", data.hygiene],
            ].map(([icon, label, value]) => (
              <div
                key={label}
                className={`need ${value < 25 ? "need-low" : ""}`}
                title={`${label}: ${value}`}
              >
                <span>{icon}</span>
                <div className="need-bar">
                  <div className="need-fill" style={{ width: `${value}%`, "--hue": value * 1.2 }} />
                </div>
              </div>
            ))}
          </div>

          <div className="xp-box">
            <div>
              <strong>LV {data.level}</strong>
              <span>{data.xp}/{requiredXP} XP</span>
            </div>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {screen === "game" && (
          <section className="game-scene">
            <div className="sky">
              {!isTerror ? (
                <>
                  <div className="cloud cloud-one" />
                  <div className="cloud cloud-two" />
                  <div className="cloud cloud-three" />
                </>
              ) : (
                <>
                  <div className="moon" />
                  <div className="terror-cloud terror-cloud-one" />
                  <div className="terror-cloud terror-cloud-two" />
                </>
              )}

              <div className={`house ${isTerror ? "house-terror" : ""}`}>
                <div className="house-roof" />
                <div className="house-body">
                  <div className="window window-left"><span /></div>
                  <div className="window window-right"><span /></div>
                  <div className="door"><div className="door-knob" /></div>

                  <div className="kitchen-window">
                    <span /><span />
                  </div>

                  <div className="kitchen-counter">
                    {FOODS.map((item) => (
                      <button
                        key={item.id}
                        className={`kitchen-food ${
                          kitchenFood === item.id ? "kitchen-food-eating" : ""
                        }`}
                        onClick={() => eatKitchenFood(item)}
                        aria-label={`Comer ${item.name}`}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grass">
                <span className="grass-line grass-line-one" />
                <span className="grass-line grass-line-two" />
                <span className="grass-line grass-line-three" />
              </div>

              <div className="speech-bubble" aria-live="polite">{speech}</div>

              <div className="emoji-stage">
                {food && <div className="flying-food">{food}</div>}

                <button
                  className={`emoji-button animation-${animation}`}
                  onPointerDown={handleEmojiClick}
                  onClick={(event) => event.detail === 0 && handleEmojiClick()}
                  aria-label="Interagir com o emoji"
                >
                  {data.effect && <span className="effect">{data.effect}</span>}
                  {data.hat && <span className="hat">{data.hat}</span>}
                  <span
                    className="emoji-character"
                    style={{ transform: `rotate(${tilt.x}deg) scale(${tilt.x || tilt.y ? 0.94 : 1})` }}
                  >
                    {getDisplayedEmoji()}
                  </span>
                  {data.glasses && <span className="glasses">{data.glasses}</span>}
                  {data.accessory && <span className="accessory">{data.accessory}</span>}
                </button>

                {combo >= 3 && <div className="combo-badge">x{combo}</div>}

                {particles.map((item) => (
                  <span
                    key={item.id}
                    className="particle"
                    style={{ "--dx": `${item.dx}px`, "--dy": `${item.dy}px` }}
                  >
                    {item.emoji}
                  </span>
                ))}

                {floatingStars.map((item) => (
                  <span
                    key={item.id}
                    className="floating-star"
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  >
                    +{item.amount} ⭐
                  </span>
                ))}
              </div>

              {isTerror && <div className="terror-vignette" />}
            </div>

            <div className="controls">
              <div className="action-grid">
                {ACTIONS.map((action) => {
                  const locked = data.totalStars < action.unlock;

                  return (
                    <button
                      key={action.id}
                      className={`action-button ${locked ? "locked" : ""}`}
                      onClick={() => handleAction(action.id)}
                    >
                      <span className="action-icon">{action.icon}</span>
                      <span className="action-label">{action.label}</span>
                      {locked && <span className="lock-label">🔒 {action.unlock}</span>}
                    </button>
                  );
                })}
              </div>

              <div className="bottom-actions">
                <button className="secondary-button" onClick={() => setScreen("house")}>
                  🏠 Casa
                </button>
                <button className="secondary-button" onClick={() => setScreen("games")}>
                  🎮 Jogos
                </button>
                <button className="secondary-button" onClick={() => setCustomOpen(true)}>
                  🧥 Personalizar
                </button>
                <button className="secondary-button" onClick={() => setShopOpen(true)}>
                  🛍️ Loja
                </button>
              </div>

              <button
                className="secret-terror-button"
                onClick={toggleTerrorMode}
                title={isTerror ? "Voltar ao normal" : "Segredo"}
              >
                {isTerror ? "☀️" : "·"}
              </button>
            </div>
          </section>
        )}

        {screen === "house" && (
          <section className="sub-screen">
            <ScreenHeader title="🏠 Minha Casa" onBack={() => setScreen("game")} />

            <div className="room-title">
              {data.room === "sala" && "🛋️ Sala"}
              {data.room === "cozinha" && "🍳 Cozinha"}
              {data.room === "quarto" && "🛏️ Quarto"}
              {data.room === "banheiro" && "🚿 Banheiro"}
              {data.room === "jogos" && "🎮 Sala de Jogos"}
            </div>

            <div className={`house-scene ${isTerror ? "house-scene-terror" : ""}`}>
              {data.room === "sala" && (
                <>
                  <button className="house-object tv" onClick={() => interactRoom("tv")}>📺</button>
                  <button className="house-object sofa" onClick={() => interactRoom("tv")}>🛋️</button>
                </>
              )}

              {data.room === "cozinha" && (
                <>
                  <button className="house-object fridge" onClick={() => interactRoom("fridge")}>🧊</button>
                  <div className="large-kitchen">
                    {FOODS.map((item) => (
                      <button key={item.id} onClick={() => eatKitchenFood(item)}>
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {data.room === "quarto" && (
                <button className="house-object bed" onClick={() => interactRoom("bed")}>🛏️</button>
              )}

              {data.room === "banheiro" && (
                <button className="house-object shower" onClick={() => interactRoom("shower")}>🚿</button>
              )}

              {data.room === "jogos" && (
                <button className="house-object console" onClick={() => setScreen("games")}>🎮</button>
              )}

              <div className="speech-bubble house-speech" aria-live="polite">{speech}</div>

              {particles.map((item) => (
                <span
                  key={item.id}
                  className="particle"
                  style={{ "--dx": `${item.dx}px`, "--dy": `${item.dy}px` }}
                >
                  {item.emoji}
                </span>
              ))}

              <div
                className={`house-emoji animation-${animation} ${
                  data.room === "cozinha" ? "house-emoji-kitchen" : ""
                }`}
              >
                {getDisplayedEmoji()}
              </div>
            </div>

            <div className="room-selector">
              {[
                ["sala", "🛋️"],
                ["cozinha", "🍳"],
                ["quarto", "🛏️"],
                ["banheiro", "🚿"],
                ["jogos", "🎮"],
              ].map(([room, icon]) => (
                <button
                  key={room}
                  className={data.room === room ? "selected" : ""}
                  onClick={() => changeRoom(room)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </section>
        )}

        {screen === "games" && (
          <section className="sub-screen games-screen">
            <ScreenHeader title="🎮 Jogos" onBack={() => setScreen("game")} />

            {!miniGame ? (
              <div className="games-grid">
                <GameCard icon="⭐" title="Pegue as estrelas" text="Clique o máximo que conseguir" onClick={() => startMiniGame("stars")} />
                <GameCard icon="🍕" title="Pegue a comida" text="Clique rápido" onClick={() => startMiniGame("food")} />
                <GameCard icon="🎯" title="Acerte o alvo" text="Mude o alvo e marque pontos" onClick={() => startMiniGame("target")} />
                <GameCard icon="🧠" title="Desafio de cliques" text="Sua pontuação vale estrelas" onClick={() => startMiniGame("memory")} />
                {isTerror && (
                  <GameCard className="terror-game" icon="👁️" title="ESCAPE" text="O segredo continua..." onClick={() => startMiniGame("escape")} />
                )}
              </div>
            ) : (
              <div className="mini-game">
                <h2>
                  {miniGame === "stars" && "⭐ Pegue as estrelas"}
                  {miniGame === "food" && "🍕 Pegue a comida"}
                  {miniGame === "target" && "🎯 Acerte o alvo"}
                  {miniGame === "memory" && "🧠 Desafio"}
                  {miniGame === "escape" && "👁️ ESCAPE"}
                </h2>

                <div className="mini-stats">
                  <span>Pontos: {miniScore}</span>
                  <span>Tempo: {miniTime}s</span>
                </div>

                <button className="game-click-area" onClick={miniGameClick}>
                  {miniGame === "stars" && "⭐"}
                  {miniGame === "food" && "🍕"}
                  {miniGame === "target" && (miniTarget % 2 === 0 ? "🎯" : "⭐")}
                  {miniGame === "memory" && "🃏"}
                  {miniGame === "escape" && (isTerror ? "👁️" : "👻")}
                </button>

                <button className="finish-game" onClick={finishMiniGame}>
                  {miniTime <= 0 ? "Receber prêmio" : "Terminar"}
                </button>
              </div>
            )}
          </section>
        )}

        <footer className="status-bar">
          <span>
            {isTerror ? "⚠️ Algo está errado..." : "✨ Clique no emoji para ganhar estrelas"}
          </span>
          <span>{data.totalClicks} interações</span>
        </footer>
      </div>

      {shopOpen && (
        <div className="modal-overlay" onClick={() => setShopOpen(false)}>
          <div className="modal shop-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-icon">🛍️</span>
                <h2>Loja</h2>
              </div>
              <button className="close-button" onClick={() => setShopOpen(false)}>×</button>
            </div>

            <div className="shop-stars">⭐ {data.stars}</div>

            <div className="skin-grid">
              {SKINS.map((skin) => {
                const owned = data.ownedSkins.includes(skin.emoji);
                const selected = data.skin === skin.emoji;

                return (
                  <button
                    key={skin.emoji}
                    className={`skin-card ${selected ? "selected" : ""} ${!owned ? "skin-locked" : ""}`}
                    onClick={() => buyOrSelectSkin(skin)}
                  >
                    <span className="skin-emoji">{skin.emoji}</span>
                    <strong>{skin.name}</strong>
                    <small>
                      {selected ? "Selecionado" : owned ? "Usar" : `⭐ ${skin.price}`}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {customOpen && (
        <div className="modal-overlay" onClick={() => setCustomOpen(false)}>
          <div className="modal customization-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-icon">🧥</span>
                <h2>Personalizar</h2>
              </div>
              <button className="close-button" onClick={() => setCustomOpen(false)}>×</button>
            </div>

            <div className="preview-character">
              {data.effect}
              {data.hat}
              {data.face}
              {data.glasses}
              {data.accessory}
            </div>

            <CustomizationSection title="😀 Rosto" items={FACES} current={data.face} onSelect={(v) => changeCustomization("face", v)} />
            <CustomizationSection title="🎩 Chapéu" items={HATS} current={data.hat} onSelect={(v) => changeCustomization("hat", v)} />
            <CustomizationSection title="🕶️ Óculos" items={GLASSES} current={data.glasses} onSelect={(v) => changeCustomization("glasses", v)} />
            <CustomizationSection title="🎸 Acessório" items={ACCESSORIES} current={data.accessory} onSelect={(v) => changeCustomization("accessory", v)} />
            <CustomizationSection title="✨ Efeito" items={EFFECTS} current={data.effect} onSelect={(v) => changeCustomization("effect", v)} />
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal settings-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-icon">⚙️</span>
                <h2>Configurações</h2>
              </div>
              <button className="close-button" onClick={() => setSettingsOpen(false)}>×</button>
            </div>

            {[
              ["sound", "🔊 Efeitos sonoros"],
              ["voice", "🗣️ Voz do emoji"],
            ].map(([key, label]) => (
              <button
                key={key}
                className="toggle-row"
                onClick={() =>
                  setData((current) => ({
                    ...current,
                    settings: { ...current.settings, [key]: !current.settings[key] },
                  }))
                }
              >
                <span>{label}</span>
                <b>{data.settings[key] ? "Ligado" : "Desligado"}</b>
              </button>
            ))}

            <button
              className="toggle-row danger-button"
              onClick={() => {
                if (confirm("Apagar todo o progresso? Isso não pode ser desfeito.")) {
                  localStorage.removeItem("talkingEmojiFusionSave");
                  location.reload();
                }
              }}
            >
              <span>🗑️ Apagar progresso</span>
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {terrorEvent === "transition" && <div className="transition-message">...</div>}
    </main>
  );
}

function ScreenHeader({ title, onBack }) {
  return (
    <div className="screen-header">
      <button onClick={onBack}>←</button>
      <h2>{title}</h2>
    </div>
  );
}

function GameCard({ icon, title, text, onClick, className = "" }) {
  return (
    <button className={`game-card ${className}`} onClick={onClick}>
      <span>{icon}</span>
      <strong>{title}</strong>
      <small>{text}</small>
    </button>
  );
}

function CustomizationSection({ title, items, current, onSelect }) {
  return (
    <div className="custom-section">
      <h3>{title}</h3>
      <div className="custom-options">
        {items.map((item, index) => (
          <button
            key={`${item}-${index}`}
            className={current === item ? "custom-selected" : ""}
            onClick={() => onSelect(item)}
          >
            {item || "❌"}
          </button>
        ))}
      </div>
    </div>
  );
}