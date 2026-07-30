(() => {
  "use strict";

  const STORAGE_KEY = "goListen.phase1.v2";
  const TEST_MODE = new URLSearchParams(location.search).get("test") === "1";
  const COOLDOWN_MS = TEST_MODE ? 10_000 : 60 * 60 * 1000;

  // Master prompts stay lowercase. The page composer may add "record" to a few
  // short prompts, but the visible list remains lowercase by design.
  const library = {
    subjects: [
      "neighborhood ambience at dusk", "water through a metal culvert", "a country road from a hillside",
      "a vehicle on a gravel road", "a rest area lobby", "an empty room", "wind through leaves",
      "a playground after school", "rain under a porch roof", "a creek beside a road", "a parking garage",
      "a quiet alley", "a bridge expansion joint", "a grocery store entrance", "a screen door",
      "birds before sunrise", "a distant lawn mower", "a laundromat", "a stairwell", "a bus stop",
      "a small town intersection", "a boat ramp", "a wooded trail", "a drainage ditch after rain",
      "a vending machine hum", "a farm field at dusk", "an underpass", "a hotel hallway",
      "a public park in the morning", "a creek crossing", "a metal fence in the wind",
      "a restaurant kitchen from outside", "a warehouse loading area", "a fountain in a public space",
      "a train crossing", "a basketball court", "a marina", "a tunnel or covered passage",
      "a school parking lot after hours", "a gas station at night", "a construction site from a distance",
      "a riverbank", "a waiting room", "a public elevator", "a wooded ravine", "a farm gate",
      "a quiet downtown block", "a roadside pull-off", "a pedestrian bridge", "an old barn"
    ],
    scavenger: [
      "church bells", "far away fireworks", "a passing freight train", "a helicopter overhead",
      "a combine harvesting", "a distant siren", "a dog barking across a neighborhood",
      "a train horn from far away", "thunder before the rain", "a plane taking off or landing",
      "an announcement over an intercom", "a motorcycle passing", "a flock of geese overhead",
      "a delivery truck backing up", "a school bell", "a towboat or barge", "a street sweeper",
      "a marching band in the distance", "a snowplow", "a sudden burst of wind",
      "a train crossing gate", "a public-address echo", "a passing horse trailer", "a distant crowd",
      "a low-flying small plane", "a vehicle crossing a bridge", "a church service heard from outside",
      "a freight yard", "a storm drain gurgling", "a flock of birds taking off", "a door slamming in an empty building",
      "a whistle carried by the wind", "an ice cream truck", "a chainsaw in the distance",
      "a tractor on the road", "a boat engine approaching", "a backup alarm echoing",
      "a passing emergency vehicle", "a public clock striking", "a distant sports game",
      "a garbage truck", "a cicada surge", "a sudden downpour", "a metal sign rattling",
      "a train coupling", "a low electrical buzz", "a truck using engine brakes", "a flock of crows",
      "a bridge deck humming under traffic", "a distant horn with a long echo"
    ],
    perspectives: [
      "something metallic", "beneath a bridge", "through a doorway", "from underneath something",
      "the first sound after arriving", "at sunrise", "at sunset", "during blue hour", "one steady hum",
      "something rhythmic", "from inside a parked vehicle", "with a wall behind you", "from ground level",
      "from the top of a hill", "a sound reflected by concrete", "through a fence",
      "before you can see the source", "after the source passes", "a sound from two rooms away",
      "a place that feels empty", "a place that feels busy", "the quietest sound you notice",
      "a sound partly hidden by traffic", "from the edge of a crowd", "beside moving water",
      "with your back to the source", "something repeating imperfectly", "a sound that comes and goes",
      "a place changing from day to night", "from a stair landing", "a sound through glass",
      "a mechanical rhythm", "something wind-powered", "a sound with a long decay",
      "where two soundscapes meet", "a sound from across water", "under a roof during rain",
      "a familiar place with eyes closed", "the space between passing vehicles",
      "a sound that seems farther than it is", "near an open window", "a sound from behind a barrier",
      "the moment a machine stops", "the moment a machine starts", "one minute without moving",
      "a sound framed by an opening", "where the echo is stronger than the source",
      "a place just after people leave", "a sound that changes as you stand still",
      "the atmosphere before weather arrives"
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
    { indent: 1, size: 1.00, line: 1.08, tone: "#585255" },
    { indent: 8, size: 1.14, line: 1.04, tone: "#675d61" },
    { indent: 17, size: 0.91, line: 1.10, tone: "#74696d" },
    { indent: 4, size: 1.34, line: 0.98, tone: "#62575c" },
    { indent: 12, size: 1.04, line: 1.07, tone: "#8b717a" },
    { indent: 22, size: 0.88, line: 1.11, tone: "#6e6468" },
    { indent: 6, size: 0.96, line: 1.09, tone: "#7f6870" },
    { indent: 14, size: 1.22, line: 1.01, tone: "#5c5658" },
    { indent: 2, size: 0.90, line: 1.11, tone: "#856f77" },
    { indent: 19, size: 1.08, line: 1.05, tone: "#645b5f" },
    { indent: 9, size: 0.94, line: 1.10, tone: "#796d71" },
    { indent: 25, size: 1.29, line: 1.00, tone: "#685d62" }
  ];

  const els = {
    promptScreen: document.getElementById("promptScreen"),
    successScreen: document.getElementById("successScreen"),
    promptList: document.getElementById("promptList"),
    successLead: document.getElementById("successLead"),
    signatureTop: document.getElementById("signatureTop"),
    signatureBottom: document.getElementById("signatureBottom"),
    signatureSuccess: document.getElementById("signatureSuccess")
  };

  let state = loadState();
  let resizeTimer = null;
  let rerolling = false;

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
      successMessage: "Well done."
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

  function appendBlocks(target, count, onIndexes) {
    target.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const block = document.createElement("span");
      block.className = `signature-block${onIndexes.has(i) ? " on" : ""}`;
      target.appendChild(block);
    }
  }

  // Top pattern: variable length, no fixed opening, 3–5 filled blocks,
  // and never three filled blocks in a row.
  function makeTopSignature() {
    const count = 7 + Math.floor(Math.random() * 5);
    const desired = Math.min(count - 2, 3 + Math.floor(Math.random() * 3));
    let on = new Set();
    let attempts = 0;

    while (on.size < desired && attempts < 100) {
      attempts += 1;
      const candidate = Math.floor(Math.random() * count);
      const test = new Set(on).add(candidate);
      let hasTriple = false;
      for (let i = 0; i <= count - 3; i++) {
        if (test.has(i) && test.has(i + 1) && test.has(i + 2)) hasTriple = true;
      }
      if (!hasTriple) on = test;
    }
    appendBlocks(els.signatureTop, count, on);
  }

  // Bottom pattern keeps its recognizable rule: first two filled, third blank,
  // with one to four additional filled blocks later in the row.
  function makeBottomSignature(target) {
    const on = new Set([0, 1]);
    const later = [3, 4, 5, 6, 7, 8, 9];
    const extraCount = 1 + Math.floor(Math.random() * 4);
    shuffle(later).slice(0, extraCount).forEach(i => on.add(i));
    appendBlocks(target, 10, on);
  }

  function itemsForPlan(plan) {
    const items = [];
    Object.entries(plan).forEach(([category, count]) => {
      state.queues[category].slice(0, count).forEach(id => {
        items.push({ category, id, baseText: library[category][id] });
      });
    });
    return shuffle(items);
  }

  function composePage(items) {
    const composed = items.map(item => ({ ...item, text: item.baseText }));
    const eligible = shuffle(composed
      .map((item, index) => ({ index, length: item.baseText.length }))
      .filter(item => item.length <= 36));

    const minimum = Math.min(3, eligible.length);
    const desired = Math.min(eligible.length, minimum + Math.floor(Math.random() * 3));
    eligible.slice(0, desired).forEach(({ index }) => {
      composed[index].text = `record ${composed[index].baseText}`;
    });

    const styles = shuffle(styleSets);

    // Compose actual clusters rather than evenly spaced rows. Close gaps remain
    // close; cluster breaks remain visibly larger and are capped independently.
    let remainingInCluster = 1 + Math.floor(Math.random() * 3);
    return composed.map((item, index) => {
      let gapKind = "none";
      let gapSeed = 0;
      if (index > 0) {
        remainingInCluster -= 1;
        if (remainingInCluster <= 0) {
          gapKind = "break";
          gapSeed = Math.random();
          remainingInCluster = 2 + Math.floor(Math.random() * 3);
        } else {
          gapKind = "close";
          gapSeed = Math.random();
        }
      }
      return {
        ...item,
        style: styles[index % styles.length],
        gapKind,
        gapSeed
      };
    });
  }

  function baseFontSize() {
    return Math.max(15, Math.min(window.innerWidth * 0.0415, 23));
  }

  function gapForItem(item) {
    if (!item || item.gapKind === "none") return 0;
    const vh = window.innerHeight / 100;
    if (item.gapKind === "break") {
      const minimum = Math.max(7, Math.min(1.0 * vh, 10));
      const maximum = Math.max(11, Math.min(1.65 * vh, 16));
      return minimum + (maximum - minimum) * item.gapSeed;
    }
    const minimum = 1;
    const maximum = Math.max(3, Math.min(0.48 * vh, 5));
    return minimum + (maximum - minimum) * item.gapSeed;
  }

  function setTypeScale(items, scale) {
    const base = baseFontSize();
    const buttons = [...els.promptList.querySelectorAll(".prompt")];
    buttons.forEach((button, index) => {
      const style = items[index].style;
      button.style.setProperty("--size", `${(base * style.size * scale).toFixed(2)}px`);
    });
  }

  function setBaseCollageGaps(items) {
    const buttons = [...els.promptList.querySelectorAll(".prompt")];
    buttons.forEach((button, index) => {
      button.style.setProperty("--collage-gap", `${gapForItem(items[index]).toFixed(2)}px`);
    });
  }

  function measuredCompositionHeight() {
    const buttons = [...els.promptList.querySelectorAll(".prompt")];
    return buttons.reduce((total, button) => {
      const gap = parseFloat(getComputedStyle(button).marginTop) || 0;
      return total + button.getBoundingClientRect().height + gap;
    }, 0);
  }

  function availableCompositionHeight() {
    const styles = getComputedStyle(els.promptList);
    return els.promptList.clientHeight -
      (parseFloat(styles.paddingTop) || 0) -
      (parseFloat(styles.paddingBottom) || 0);
  }

  function enlargeTypographyToFit(items) {
    setBaseCollageGaps(items);

    const available = availableCompositionHeight();
    let low = 0.82;
    let high = 1.62;

    // Find the largest global type scale that fits the real screen after the
    // bars and intentional edge breathing room have already been reserved.
    for (let pass = 0; pass < 14; pass += 1) {
      const scale = (low + high) / 2;
      setTypeScale(items, scale);
      const used = measuredCompositionHeight();
      if (used <= available) low = scale;
      else high = scale;
    }

    setTypeScale(items, low);

    // A line-wrap jump can leave a little spare room. Spend only a restrained
    // amount of it on selected cluster breaks, never by evening every gap out.
    let spare = Math.max(0, available - measuredCompositionHeight());
    if (spare < 1) return low;

    const buttons = [...els.promptList.querySelectorAll(".prompt")];
    const breakIndexes = items
      .map((item, index) => item.gapKind === "break" ? index : -1)
      .filter(index => index > 0)
      .sort((a, b) => items[b].gapSeed - items[a].gapSeed);

    const perBreakCap = Math.max(2, Math.min(window.innerHeight * 0.0045, 4));
    for (const index of breakIndexes) {
      if (spare <= 0.5) break;
      const button = buttons[index];
      const current = parseFloat(getComputedStyle(button).marginTop) || 0;
      const addition = Math.min(spare, perBreakCap * (0.55 + items[index].gapSeed * 0.45));
      button.style.setProperty("--collage-gap", `${(current + addition).toFixed(2)}px`);
      spare -= addition;
    }

    return low;
  }

  function renderPromptItems(items) {
    els.promptList.innerHTML = "";
    items.forEach(item => {
      const style = item.style;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "prompt";
      button.dataset.category = item.category;
      button.dataset.id = String(item.id);
      button.style.setProperty("--indent", `${style.indent}%`);
      button.style.setProperty("--tone", style.tone);
      button.style.setProperty("--line", String(style.line || 1.08));
      button.setAttribute("aria-label", `Complete: ${item.text}`);
      button.innerHTML = `<span class="checkbox" aria-hidden="true"></span><span class="prompt-text"></span>`;
      button.querySelector(".prompt-text").textContent = item.text;
      button.addEventListener("click", () => completePrompt(button, item));
      els.promptList.appendChild(button);
    });

    // Start from a known size before measuring, then let the screen-specific
    // composer use the available height for typography and irregular spacing.
    setTypeScale(items, 1);
    enlargeTypographyToFit(items);
  }

  function fitsViewport() {
    return measuredCompositionHeight() <= availableCompositionHeight() + 1 &&
      document.documentElement.scrollHeight <= window.innerHeight + 1;
  }

  function renderAdaptiveList() {
    els.promptScreen.hidden = false;
    els.successScreen.hidden = true;

    let chosen = null;
    for (const plan of plans) {
      const composition = composePage(itemsForPlan(plan));
      renderPromptItems(composition);
      void els.promptList.offsetHeight;
      if (fitsViewport()) {
        chosen = composition;
        break;
      }
    }

    if (!chosen) chosen = composePage(itemsForPlan(plans[plans.length - 1]));
    renderPromptItems(chosen);
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
      makeBottomSignature(els.signatureSuccess);
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
    makeBottomSignature(els.signatureSuccess);
    scheduleWakeup();
  }

  function scheduleWakeup() {
    const delay = Math.max(0, state.cooldownUntil - Date.now());
    window.setTimeout(() => {
      if (!currentCooldown()) {
        state.cooldownUntil = 0;
        saveState();
        els.successScreen.hidden = true;
        makeTopSignature();
        makeBottomSignature(els.signatureBottom);
        renderAdaptiveList();
      }
    }, delay + 40);
  }

  function rerollAllLists() {
    if (rerolling || currentCooldown()) return;
    rerolling = true;
    els.promptScreen.classList.add("is-fading");

    setTimeout(() => {
      state.queues.subjects = shuffle(state.queues.subjects);
      state.queues.scavenger = shuffle(state.queues.scavenger);
      state.queues.perspectives = shuffle(state.queues.perspectives);
      saveState();

      makeTopSignature();
      makeBottomSignature(els.signatureBottom);
      renderAdaptiveList();
      els.promptScreen.classList.remove("is-fading");
      rerolling = false;
    }, 170);
  }

  function render() {
    if (currentCooldown()) {
      renderSuccess();
    } else {
      makeTopSignature();
      makeBottomSignature(els.signatureBottom);
      renderAdaptiveList();
    }
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!currentCooldown()) renderAdaptiveList();
    }, 120);
  });

  // Double-tap/click the top signature to reshuffle all three queues.
  let topTapTime = 0;
  els.signatureTop.addEventListener("click", event => {
    const now = Date.now();
    if (now - topTapTime <= 360) {
      event.preventDefault();
      topTapTime = 0;
      rerollAllLists();
    } else {
      topTapTime = now;
    }
  });
  els.signatureTop.addEventListener("dblclick", event => event.preventDefault());
  els.signatureTop.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      rerollAllLists();
    }
  });

  // Hidden testing shortcut: triple-tap either bottom signature to clear cooldown.
  let taps = 0;
  let tapTimer;
  [els.signatureBottom, els.signatureSuccess].forEach(signature => {
    signature.addEventListener("click", () => {
      taps += 1;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { taps = 0; }, 700);
      if (taps >= 3) {
        taps = 0;
        state.cooldownUntil = 0;
        saveState();
        render();
      }
    });
  });

  render();
})();
