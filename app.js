(() => {
  "use strict";

  const STORAGE_KEY = "goListen.phase1.v1";
  const TEST_MODE = new URLSearchParams(location.search).get("test") === "1";
  const COOLDOWN_MS = TEST_MODE ? 10_000 : 60 * 60 * 1000;

  const library = {
    subjects: [
      "Neighborhood ambience at dusk", "Water through a metal culvert", "A country road from a hillside",
      "A vehicle on a gravel road", "A rest area lobby", "An empty room", "Wind through leaves",
      "A playground after school", "Rain under a porch roof", "A creek beside a road", "A parking garage",
      "A quiet alley", "A bridge expansion joint", "A grocery store entrance", "A screen door",
      "Birds before sunrise", "A distant lawn mower", "A laundromat", "A stairwell", "A bus stop",
      "A small town intersection", "A boat ramp", "A wooded trail", "A drainage ditch after rain",
      "A vending machine hum", "A farm field at dusk", "An underpass", "A hotel hallway",
      "A public park in the morning", "A creek crossing", "A metal fence in the wind",
      "A restaurant kitchen from outside", "A warehouse loading area", "A fountain in a public space",
      "A train crossing", "A basketball court", "A marina", "A tunnel or covered passage",
      "A school parking lot after hours", "A gas station at night", "A construction site from a distance",
      "A riverbank", "A waiting room", "A public elevator", "A wooded ravine", "A farm gate",
      "A quiet downtown block", "A roadside pull-off", "A pedestrian bridge", "An old barn"
    ],
    scavenger: [
      "Church bells", "Far away fireworks", "A passing freight train", "A helicopter overhead",
      "A combine harvesting", "A distant siren", "A dog barking across a neighborhood",
      "A train horn from far away", "Thunder before the rain", "A plane taking off or landing",
      "An announcement over an intercom", "A motorcycle passing", "A flock of geese overhead",
      "A delivery truck backing up", "A school bell", "A towboat or barge", "A street sweeper",
      "A marching band in the distance", "A snowplow", "A sudden burst of wind",
      "A train crossing gate", "A public-address echo", "A passing horse trailer", "A distant crowd",
      "A low-flying small plane", "A vehicle crossing a bridge", "A church service heard from outside",
      "A freight yard", "A storm drain gurgling", "A flock of birds taking off", "A door slamming in an empty building",
      "A whistle carried by the wind", "An ice cream truck", "A chainsaw in the distance",
      "A tractor on the road", "A boat engine approaching", "A backup alarm echoing",
      "A passing emergency vehicle", "A public clock striking", "A distant sports game",
      "A garbage truck", "A cicada surge", "A sudden downpour", "A metal sign rattling",
      "A train coupling", "A low electrical buzz", "A truck using engine brakes", "A flock of crows",
      "A bridge deck humming under traffic", "A distant horn with a long echo"
    ],
    perspectives: [
      "Record something metallic", "Listen beneath a bridge", "Record through a doorway",
      "Record from underneath something", "Record the first sound after arriving", "Record at sunrise",
      "Record at sunset", "Record during blue hour", "Record one steady hum", "Record something rhythmic",
      "Record from inside a parked vehicle", "Record with a wall behind you", "Record from ground level",
      "Record from the top of a hill", "Record a sound reflected by concrete", "Record through a fence",
      "Record before you can see the source", "Record after the source passes", "Record a sound from two rooms away",
      "Record a place that feels empty", "Record a place that feels busy", "Record the quietest sound you notice",
      "Record a sound partly hidden by traffic", "Record from the edge of a crowd", "Record beside moving water",
      "Record with your back to the source", "Record something repeating imperfectly", "Record a sound that comes and goes",
      "Record a place changing from day to night", "Record from a stair landing", "Record a sound through glass",
      "Record a mechanical rhythm", "Record something wind-powered", "Record a sound with a long decay",
      "Record where two soundscapes meet", "Record a sound from across water", "Record under a roof during rain",
      "Record a familiar place with eyes closed", "Record the space between passing vehicles",
      "Record a sound that seems farther than it is", "Record near an open window", "Record a sound from behind a barrier",
      "Record the moment a machine stops", "Record the moment a machine starts", "Record one minute without moving",
      "Record a sound framed by an opening", "Record where the echo is stronger than the source",
      "Record a place just after people leave", "Record a sound that changes as you stand still",
      "Record the atmosphere before weather arrives"
    ]
  };

  const successMessages = [
    "Well done.", "Great work.", "Congratulations.", "Your ears will appreciate it.",
    "Nice find.", "Good catch.", "Another sound saved.", "You noticed something today.",
    "That one was worth hearing.", "The world sounds different now.", "Keep your recorder close.",
    "You found the moment.", "A good sound found you.", "That was worth stopping for."
  ];

  const plans = [
    { subjects: 6, scavenger: 3, perspectives: 3 },
    { subjects: 5, scavenger: 3, perspectives: 3 },
    { subjects: 5, scavenger: 2, perspectives: 3 },
    { subjects: 4, scavenger: 2, perspectives: 3 },
    { subjects: 4, scavenger: 2, perspectives: 2 },
    { subjects: 3, scavenger: 2, perspectives: 2 }
  ];

  const styleSets = [
    { indent: 1, size: 1.00, tone: "#5c5759" },
    { indent: 8, size: 1.10, tone: "#6c6266" },
    { indent: 17, size: 0.94, tone: "#766d70" },
    { indent: 4, size: 1.16, tone: "#665b60" },
    { indent: 12, size: 1.03, tone: "#8a777e" },
    { indent: 22, size: 0.90, tone: "#71696c" },
    { indent: 6, size: 0.97, tone: "#7e6d73" },
    { indent: 14, size: 1.12, tone: "#5f5a5c" },
    { indent: 2, size: 0.92, tone: "#86777c" },
    { indent: 19, size: 1.05, tone: "#675f62" },
    { indent: 9, size: 0.96, tone: "#7b7174" },
    { indent: 25, size: 1.08, tone: "#6c6266" }
  ];

  const els = {
    promptScreen: document.getElementById("promptScreen"),
    successScreen: document.getElementById("successScreen"),
    promptList: document.getElementById("promptList"),
    successLead: document.getElementById("successLead"),
    signature: document.getElementById("signature"),
    signatureSuccess: document.getElementById("signatureSuccess")
  };

  let state = loadState();
  let resizeTimer = null;

  function shuffle(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function createInitialState() {
    return {
      queues: {
        subjects: shuffle(library.subjects.map((_, i) => i)),
        scavenger: shuffle(library.scavenger.map((_, i) => i)),
        perspectives: shuffle(library.perspectives.map((_, i) => i))
      },
      cooldownUntil: 0,
      successMessage: "Well done.",
      visualSeed: Math.random().toString(36).slice(2)
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed?.queues?.subjects && parsed?.queues?.scavenger && parsed?.queues?.perspectives) return parsed;
    } catch (_) {}
    const fresh = createInitialState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function currentCooldown() {
    return Number(state.cooldownUntil || 0) > Date.now();
  }

  function makeSignature(target) {
    target.innerHTML = "";
    const on = new Set([0, 1]);
    const later = [3,4,5,6,7,8,9];
    const extraCount = 1 + Math.floor(Math.random() * 4);
    shuffle(later).slice(0, extraCount).forEach(i => on.add(i));
    for (let i = 0; i < 10; i++) {
      const block = document.createElement("span");
      block.className = `signature-block${on.has(i) ? " on" : ""}`;
      target.appendChild(block);
    }
  }

  function itemsForPlan(plan) {
    const items = [];
    Object.entries(plan).forEach(([category, count]) => {
      state.queues[category].slice(0, count).forEach(id => items.push({ category, id, text: library[category][id] }));
    });
    return shuffle(items);
  }

  function renderPromptItems(items) {
    els.promptList.innerHTML = "";
    const styles = shuffle(styleSets).slice(0, items.length);
    items.forEach((item, index) => {
      const style = styles[index % styles.length];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "prompt";
      button.dataset.category = item.category;
      button.dataset.id = String(item.id);
      button.style.setProperty("--indent", `${style.indent}%`);
      button.style.setProperty("--size", `calc(clamp(15px, 4.15vw, 23px) * ${style.size})`);
      button.style.setProperty("--tone", style.tone);
      button.setAttribute("aria-label", `Complete: ${item.text}`);
      button.innerHTML = `<span class="checkbox" aria-hidden="true"></span><span class="prompt-text"></span>`;
      button.querySelector(".prompt-text").textContent = item.text;
      button.addEventListener("click", () => completePrompt(button, item));
      els.promptList.appendChild(button);
    });
  }

  function fitsViewport() {
    const list = els.promptList;
    return list.scrollHeight <= list.clientHeight + 1 && document.documentElement.scrollHeight <= window.innerHeight + 1;
  }

  function renderAdaptiveList() {
    els.promptScreen.hidden = false;
    els.successScreen.hidden = true;

    let selected = plans[plans.length - 1];
    for (const plan of plans) {
      renderPromptItems(itemsForPlan(plan));
      void els.promptList.offsetHeight;
      if (fitsViewport()) { selected = plan; break; }
    }
    renderPromptItems(itemsForPlan(selected));
  }

  function completePrompt(button, item) {
    if (button.classList.contains("is-checked")) return;
    button.classList.add("is-checked", "is-completing");

    setTimeout(() => {
      const queue = state.queues[item.category];
      const index = queue.indexOf(item.id);
      if (index >= 0) queue.splice(index, 1);
      queue.push(item.id);
      state.cooldownUntil = Date.now() + COOLDOWN_MS;
      state.successMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
      saveState();
      transitionToSuccess();
    }, 210);
  }

  function transitionToSuccess() {
    els.promptScreen.classList.add("is-fading");
    setTimeout(() => {
      els.promptScreen.hidden = true;
      els.promptScreen.classList.remove("is-fading");
      els.successLead.textContent = state.successMessage || "Well done.";
      makeSignature(els.signatureSuccess);
      els.successScreen.hidden = false;
      els.successScreen.classList.add("is-fading");
      requestAnimationFrame(() => requestAnimationFrame(() => els.successScreen.classList.remove("is-fading")));
      scheduleWakeup();
    }, 220);
  }

  function renderSuccess() {
    els.successLead.textContent = state.successMessage || "Well done.";
    els.promptScreen.hidden = true;
    els.successScreen.hidden = false;
    makeSignature(els.signatureSuccess);
    scheduleWakeup();
  }

  function scheduleWakeup() {
    const delay = Math.max(0, state.cooldownUntil - Date.now());
    window.setTimeout(() => {
      if (!currentCooldown()) {
        state.cooldownUntil = 0;
        state.visualSeed = Math.random().toString(36).slice(2);
        saveState();
        els.successScreen.hidden = true;
        makeSignature(els.signature);
        renderAdaptiveList();
      }
    }, delay + 40);
  }

  function render() {
    makeSignature(els.signature);
    if (currentCooldown()) renderSuccess();
    else renderAdaptiveList();
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!currentCooldown()) renderAdaptiveList();
    }, 120);
  });

  // Hidden testing shortcut: triple-tap the bottom signature to clear cooldown.
  let taps = 0;
  let tapTimer;
  [els.signature, els.signatureSuccess].forEach(sig => sig.addEventListener("click", () => {
    taps += 1;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 700);
    if (taps >= 3) {
      taps = 0;
      state.cooldownUntil = 0;
      saveState();
      render();
    }
  }));

  render();
})();
