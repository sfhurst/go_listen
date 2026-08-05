(() => {
  "use strict";

  const STORAGE_KEY = "goListen.phase1.v3";
  const LOG_STORAGE_KEY = "goListen.recordingLog.v1";
  const BACKUP_FORMAT = "go-listen-backup";
  const BACKUP_VERSION = 1;
  const TEST_MODE = new URLSearchParams(location.search).get("test") === "1";
  const COOLDOWN_MS = TEST_MODE ? 10_000 : 60 * 60 * 1000;

  // One master deck. Prompts stay lowercase. The page composer may add
  // "record" to a few short prompts, but the visible list remains lowercase.
  const prompts = [
    "morning birds",
    "evening birds",
    "summer bugs",
    "wind through leaves",
    "quiet pine trees",
    "rain on leaves",
    "rain on pavement",
    "rain on a roof",
    "distant traffic at night",
    "a quiet daytime neighborhood",
    "neighborhood ambience at dusk",
    "playground ambience",
    "kids playing at a park",
    "dogs barking in the distance",
    "a passing freight train",
    "a distant train horn",
    "church bells",
    "an old metal gate",
    "footsteps on gravel",
    "footsteps on concrete",
    "footsteps on wooden boards",
    "water dripping",
    "running water",
    "a small stream",
    "a car driving on a gravel road",
    "wind chimes before a storm",
    "flags flapping",
    "an empty room",
    "your backyard at 3 am",
    "your front porch after it rains",
    "a city sidewalk",
    "a country road",
    "birds before sunrise",
    "frogs after dark",
    "night insects",
    "a lawn mower in the distance",
    "corn rustling in the wind",
    "leaves blowing across pavement",
    "beneath a bridge",
    "water under a bridge",
    "a park bench perspective",
    "an underpass",
    "a quiet parking lot in the middle of nowhere",
    "an open field at midday",
    "highway traffic from an overpass",
    "a youth football practice",
    "a flower bush full of bees",
    "kids playing in the sprinkler",
    "a wasp nest (carefully)",
    "inside a covered bridge",
    "a field of cows away from traffic",
    "in a state park",
    "a campfire",
    "a yard sprinkler",
    "far away fireworks",
    "snow falling",
    "heavy rain",
    "a thunderstorm",
    "a foggy morning near a creek",
    "melting icicles",
    "fall leaves blowing across a quiet parking lot",
    "a parade passing by",
    "a church picnic",
    "a college football tailgate",
    "a cemetery at night",
    "a high school football game",
    "a baseball game from the parking lot",
    "construction equipment",
    "a farmers market",
    "ice breaking in a shallow stream",
    "a school dismissal",
    "a carnival midway",
    "holiday fireworks on the river or town square",
    "footsteps in deep snow",
    "a tornado siren",
    "water moving through a metal culvert",
    "a country road from a hillside vantage point",
    "a vehicle on a gravel road",
    "a rest area lobby",
    "an announcement over an intercom",
    "an urban area from the top of a parking garage",
    "an alley outside a bar at night",
    "a barge going down the river",
    "an airport observation area",
    "planes coming in to land",
    "a railroad crossing as a train approaches",
    "a marina in the late afternoon",
    "an active boat ramp",
    "a dam spillway",
    "a waterfall",
    "from inside a pedestrian tunnel",
    "a factory from a public sidewalk",
    "cars driving on wet roads",
    "a neighborhood immediately after rain",
    "before sunrise",
    "at sunrise",
    "after sunset",
    "at sunset",
    "inside a parking garage",
    "beneath a railroad bridge as a train passes over",
    "through a chain link fence",
    "in the tree tops",
    "from a creek bank",
    "inside a concrete tunnel",
    "from a boat ramp",
    "buzzing power lines",
    "inside a picnic shelter",
    "across a frozen field",
    "along a tree line",
    "inside an empty pavilion",
    "next to an abandoned building",
    "at the edge of a cornfield",
    "beneath a highway overpass",
    "inside a stairwell",
    "in the woods after a rain",
    "in a train yard",
    "water coming out of a downspout",
  ];

  const successMessages = [
    "Well done.",
    "Great work.",
    "Congratulations.",
    "Your ears will appreciate it.",
    "Nice find.",
    "Good catch.",
    "Another sound saved.",
    "You noticed something today.",
    "That one was worth hearing.",
    "The world sounds different now.",
    "Keep your recorder close.",
    "You found the moment.",
    "A good sound found you.",
    "That was worth stopping for.",
  ];

  // Try the largest calm collage first; step down only when the viewport
  // cannot hold it without scrolling.
  const promptCounts = [12, 11, 10, 9, 8, 7];

  // Geometry stays random and independent from typography.
  const layoutSets = [
    { indent: 1 },
    { indent: 8 },
    { indent: 17 },
    { indent: 4 },
    { indent: 12 },
    { indent: 22 },
    { indent: 6 },
    { indent: 14 },
    { indent: 2 },
    { indent: 19 },
    { indent: 9 },
    { indent: 25 },
  ];

  // Curated styles use weighted probability. Exact neighboring colors are
  // prevented, and one non-pink anchor is assigned per page.
  const textStyles = [
    { id: "stone", size: 1.12, line: 1.03, tone: "#4f4a4d", color: "charcoal", weight: 600, tracking: "-0.018em", probability: 28 },
    { id: "journal", size: 1.0, line: 1.07, tone: "#655f62", color: "warm-gray", weight: 500, tracking: "-0.012em", probability: 25 },
    { id: "blush", size: 1.04, line: 1.05, tone: "#b8758e", color: "dusty-pink", weight: 500, tracking: "-0.012em", probability: 18 },
    { id: "whisper", size: 0.9, line: 1.1, tone: "#817a7e", color: "light-gray", weight: 400, tracking: "-0.006em", probability: 15 },
    { id: "rose", size: 0.95, line: 1.08, tone: "#9f7c88", color: "pink-gray", weight: 500, tracking: "-0.008em", probability: 14 },
  ];

  const anchorStyle = {
    id: "anchor",
    size: 1.29,
    line: 0.99,
    tone: "#423e40",
    color: "anchor-charcoal",
    weight: 600,
    tracking: "-0.022em",
  };

  const els = {
    promptScreen: document.getElementById("promptScreen"),
    successScreen: document.getElementById("successScreen"),
    promptList: document.getElementById("promptList"),
    successLead: document.getElementById("successLead"),
    signatureTop: document.getElementById("signatureTop"),
    signatureBottom: document.getElementById("signatureBottom"),
    signatureSuccessTop: document.getElementById("signatureSuccessTop"),
    signatureSuccessBottom: document.getElementById("signatureSuccessBottom"),
    logScreen: document.getElementById("logScreen"),
    signatureLogTop: document.getElementById("signatureLogTop"),
    signatureLogBottom: document.getElementById("signatureLogBottom"),
  };

  let state = loadState();
  let resizeTimer = null;
  let rerolling = false;
  let transitioning = false;
  let activeMainScreen = "prompt";

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
      deck: shuffle(prompts.map((_, i) => i)),
      discard: [],
      cooldownUntil: 0,
      successMessage: "Well done.",
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));

      if (Array.isArray(parsed?.deck) && Array.isArray(parsed?.discard)) {
        const validIds = new Set(prompts.map((_, index) => index));

        const deck = parsed.deck.filter(id => validIds.has(id));
        const discard = parsed.discard.filter(id => validIds.has(id) && !deck.includes(id));

        const knownIds = new Set([...deck, ...discard]);
        const newIds = prompts.map((_, index) => index).filter(id => !knownIds.has(id));

        return {
          ...parsed,
          deck: [...deck, ...shuffle(newIds)],
          discard,
        };
      }
    } catch (_) {}

    const fresh = createInitialState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }

  function settlePromptPage() {
    const buttons = [...els.promptList.querySelectorAll(".prompt")];
    buttons.forEach((button, index) => {
      const direction = Math.random() < 0.5 ? -1 : 1;
      button.style.setProperty("--enter-x", `${direction * (3 + Math.random() * 4).toFixed(2)}px`);
      button.style.setProperty("--enter-y", `${(-4 + Math.random() * 8).toFixed(2)}px`);
      button.style.setProperty("--enter-scale", (0.975 + Math.random() * 0.012).toFixed(3));
      // Every prompt wakes at nearly the same time. The tiny random offset keeps
      // the page organic without making it build from top to bottom.
      button.style.setProperty("--enter-delay", `${Math.round(Math.random() * 110)}ms`);
      button.classList.remove("is-settling");
    });

    if (prefersReducedMotion()) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        buttons.forEach(button => button.classList.add("is-settling"));
        els.signatureTop.classList.add("is-waking");
        els.signatureBottom.classList.add("is-waking");
        window.setTimeout(() => {
          els.signatureTop.classList.remove("is-waking");
          els.signatureBottom.classList.remove("is-waking");
        }, 1750);
      }),
    );
  }

  function scramblePromptPage(kind, onDone) {
    if (prefersReducedMotion()) {
      onDone();
      return;
    }

    const buttons = [...els.promptList.querySelectorAll(".prompt")];
    buttons.forEach((button, index) => {
      const angle = (-3.2 + Math.random() * 6.4).toFixed(2);
      const x = (-42 + Math.random() * 84).toFixed(2);
      const y = (-24 + Math.random() * 48).toFixed(2);
      button.style.setProperty("--exit-x", `${x}px`);
      button.style.setProperty("--exit-y", `${y}px`);
      button.style.setProperty("--exit-rotate", `${angle}deg`);
      button.style.setProperty("--exit-scale", (0.91 + Math.random() * 0.08).toFixed(3));
      button.style.setProperty("--exit-delay", `${Math.round(Math.random() * 110)}ms`);
      button.classList.add("is-scrambling");
    });
    els.promptScreen.classList.add(kind === "complete" ? "is-completing-page" : "is-rerolling-page");
    window.setTimeout(onDone, 1480);
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
  function makeTopSignatureFor(target) {
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
    appendBlocks(target, count, on);
  }

  function makeTopSignature() {
    makeTopSignatureFor(els.signatureTop);
  }

  // Bottom pattern keeps its recognizable rule: first two filled, third blank,
  // with one to four additional filled blocks later in the row.
  function makeBottomSignature(target) {
    const on = new Set([0, 1]);
    const later = [3, 4, 5, 6, 7, 8, 9];
    const extraCount = 1 + Math.floor(Math.random() * 4);
    shuffle(later)
      .slice(0, extraCount)
      .forEach(i => on.add(i));
    appendBlocks(target, 10, on);
  }

  function replenishDeck(minimumCount) {
    if (state.deck.length >= minimumCount || state.discard.length === 0) return;

    // Keep the most recently completed prompts away from the front of the
    // recycled deck so they cannot immediately reappear.
    const recentCount = Math.min(18, state.discard.length);
    const split = Math.max(0, state.discard.length - recentCount);
    const older = shuffle(state.discard.slice(0, split));
    const recent = shuffle(state.discard.slice(split));
    state.deck.push(...older, ...recent);
    state.discard = [];
    saveState();
  }

  function itemsForCount(count) {
    replenishDeck(count);
    return state.deck.slice(0, count).map(id => ({ id, baseText: prompts[id] }));
  }

  function weightedTextStyle(previousColor) {
    const choices = textStyles.filter(style => style.color !== previousColor);
    const total = choices.reduce((sum, style) => sum + style.probability, 0);
    let roll = Math.random() * total;
    for (const style of choices) {
      roll -= style.probability;
      if (roll <= 0) return style;
    }
    return choices[choices.length - 1];
  }

  function composePage(items) {
    const composed = shuffle(items).map(item => ({ ...item, text: item.baseText }));
    const eligible = shuffle(composed.map((item, index) => ({ index, length: item.baseText.length })).filter(item => item.length <= 36));

    const minimum = Math.min(3, eligible.length);
    const desired = Math.min(eligible.length, minimum + Math.floor(Math.random() * 3));
    eligible.slice(0, desired).forEach(({ index }) => {
      composed[index].text = `record ${composed[index].baseText}`;
    });

    const anchorCandidates = composed.map((item, index) => ({ index, length: item.text.length })).filter(item => item.length <= 42);
    const anchorIndex = anchorCandidates.length ? anchorCandidates[Math.floor(Math.random() * anchorCandidates.length)].index : Math.floor(Math.random() * composed.length);

    const layouts = shuffle(layoutSets);
    let previousColor = null;
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

      const type = index === anchorIndex ? anchorStyle : weightedTextStyle(previousColor);
      previousColor = type.color;

      return {
        ...item,
        style: { ...layouts[index % layouts.length], ...type },
        gapKind,
        gapSeed,
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
    return els.promptList.clientHeight - (parseFloat(styles.paddingTop) || 0) - (parseFloat(styles.paddingBottom) || 0);
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
      .map((item, index) => (item.gapKind === "break" ? index : -1))
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
      button.dataset.id = String(item.id);
      button.style.setProperty("--indent", `${style.indent}%`);
      button.style.setProperty("--tone", style.tone);
      button.style.setProperty("--line", String(style.line || 1.08));
      button.style.setProperty("--weight", String(style.weight || 400));
      button.style.setProperty("--tracking", style.tracking || "-0.012em");
      button.dataset.textStyle = style.id;
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
    settlePromptPage();
  }

  function fitsViewport() {
    return measuredCompositionHeight() <= availableCompositionHeight() + 1 && document.documentElement.scrollHeight <= window.innerHeight + 1;
  }

  function renderAdaptiveList() {
    els.promptScreen.hidden = false;
    els.successScreen.hidden = true;

    let chosen = null;
    for (const count of promptCounts) {
      const composition = composePage(itemsForCount(count));
      renderPromptItems(composition);
      void els.promptList.offsetHeight;
      if (fitsViewport()) {
        chosen = composition;
        break;
      }
    }

    if (!chosen) chosen = composePage(itemsForCount(promptCounts[promptCounts.length - 1]));
    renderPromptItems(chosen);
  }

  function completePrompt(button, item) {
    if (transitioning || button.classList.contains("is-checked")) return;
    transitioning = true;
    button.classList.add("is-checked");

    window.setTimeout(() => {
      const index = state.deck.indexOf(item.id);
      if (index >= 0) state.deck.splice(index, 1);
      state.discard.push(item.id);
      replenishDeck(promptCounts[0]);
      state.cooldownUntil = Date.now() + COOLDOWN_MS;
      state.successMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
      saveState();

      scramblePromptPage("complete", () => {
        showSuccessAfterTransition();
        transitioning = false;
      });
    }, 360);
  }

  function showSuccessAfterTransition() {
    els.promptScreen.hidden = true;
    els.promptScreen.classList.remove("is-completing-page", "is-rerolling-page", "is-fading");
    els.successLead.textContent = state.successMessage || "Well done.";
    makeTopSignatureFor(els.signatureSuccessTop);
    makeBottomSignature(els.signatureSuccessBottom);
    els.successScreen.hidden = false;
    activeMainScreen = "success";
    els.successScreen.classList.add("is-success-entering");
    requestAnimationFrame(() => requestAnimationFrame(() => els.successScreen.classList.add("is-visible")));
    window.setTimeout(() => {
      els.successScreen.classList.remove("is-success-entering", "is-visible");
    }, 1300);
    scheduleWakeup();
  }

  function renderSuccess() {
    els.successLead.textContent = state.successMessage || "Well done.";
    els.promptScreen.hidden = true;
    els.successScreen.hidden = false;
    makeTopSignatureFor(els.signatureSuccessTop);
    makeBottomSignature(els.signatureSuccessBottom);
    activeMainScreen = "success";
    scheduleWakeup();
  }

  function scheduleWakeup() {
    const delay = Math.max(0, state.cooldownUntil - Date.now());
    window.setTimeout(() => {
      if (!currentCooldown()) {
        state.cooldownUntil = 0;
        saveState();
        const revealList = () => {
          els.successScreen.hidden = true;
          els.successScreen.classList.remove("is-waking-out");
          makeTopSignature();
          makeBottomSignature(els.signatureBottom);
          activeMainScreen = "prompt";
          renderAdaptiveList();
        };
        if (prefersReducedMotion()) revealList();
        else {
          els.successScreen.classList.add("is-waking-out");
          window.setTimeout(revealList, 760);
        }
      }
    }, delay + 40);
  }

  function rerollAllLists() {
    if (rerolling || transitioning || currentCooldown()) return;
    rerolling = true;
    transitioning = true;

    scramblePromptPage("reroll", () => {
      state.deck = shuffle(state.deck);
      saveState();
      makeTopSignature();
      makeBottomSignature(els.signatureBottom);
      activeMainScreen = "prompt";
      els.promptScreen.classList.remove("is-rerolling-page", "is-completing-page");
      renderAdaptiveList();
      rerolling = false;
      transitioning = false;
    });
  }

  function render() {
    if (currentCooldown()) {
      renderSuccess();
    } else {
      makeTopSignature();
      makeBottomSignature(els.signatureBottom);
      activeMainScreen = "prompt";
      renderAdaptiveList();
    }
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!currentCooldown()) renderAdaptiveList();
    }, 120);
  });

  // Double-tap/click the top signature to reshuffle the full deck.
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

  function bindDoubleTap(element, callback) {
    let lastTap = 0;
    element.addEventListener("click", event => {
      const now = Date.now();
      if (now - lastTap <= 360) {
        event.preventDefault();
        lastTap = 0;
        callback();
      } else {
        lastTap = now;
      }
    });
    element.addEventListener("dblclick", event => event.preventDefault());
    element.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        callback();
      }
    });
  }

  function resetFromSuccess() {
    state.cooldownUntil = 0;
    state.deck = shuffle(state.deck);
    saveState();
    activeMainScreen = "prompt";
    render();
  }

  function openLog() {
    els.promptScreen.hidden = true;
    els.successScreen.hidden = true;
    els.logScreen.hidden = false;
    makeTopSignatureFor(els.signatureLogTop);
    makeBottomSignature(els.signatureLogBottom);
    showLogList();
  }

  function closeLog() {
    els.logScreen.hidden = true;
    if (activeMainScreen === "success" && currentCooldown()) {
      renderSuccess();
    } else {
      activeMainScreen = "prompt";
      state.cooldownUntil = 0;
      saveState();
      makeTopSignature();
      makeBottomSignature(els.signatureBottom);
      renderAdaptiveList();
    }
  }

  bindDoubleTap(els.signatureBottom, openLog);
  bindDoubleTap(els.signatureSuccessBottom, openLog);
  bindDoubleTap(els.signatureLogBottom, closeLog);
  bindDoubleTap(els.signatureSuccessTop, resetFromSuccess);

  // ----- Recording log -----
  const logEls = {
    listView: document.getElementById("logListView"),
    entryView: document.getElementById("logEntryView"),
    backupView: document.getElementById("backupView"),
    entries: document.getElementById("logEntries"),
    empty: document.getElementById("emptyLog"),
    noResults: document.getElementById("noSearchResults"),
    search: document.getElementById("logSearch"),
    clearSearch: document.getElementById("clearLogSearch"),
    searchStatus: document.getElementById("searchStatus"),
    add: document.getElementById("addEntryButton"),
    emptyAdd: document.getElementById("emptyAddButton"),
    openBackup: document.getElementById("openBackupButton"),
    closeBackup: document.getElementById("closeBackupButton"),
    cancelEntry: document.getElementById("cancelEntryButton"),
    saveEntry: document.getElementById("saveEntryButton"),
    deleteEntry: document.getElementById("deleteEntryButton"),
    deleteWrap: document.getElementById("deleteEntryWrap"),
    heading: document.getElementById("entryHeading"),
    form: document.getElementById("entryForm"),
    entryId: document.getElementById("entryId"),
    backup: document.getElementById("backupButton"),
    restore: document.getElementById("restoreButton"),
    merge: document.getElementById("mergeButton"),
    fileInput: document.getElementById("backupFileInput"),
    status: document.getElementById("backupStatus"),
  };

  let pendingFileMode = null;
  let currentLogSearch = "";

  const SOUND_TERMS = Array.isArray(window.GO_LISTEN_SOUND_TERMS) ? window.GO_LISTEN_SOUND_TERMS : [];

  function loadLog() {
    try {
      const value = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY));
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function saveLog(entries) {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries));
  }

  function makeId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showOnly(view) {
    [logEls.listView, logEls.entryView, logEls.backupView].forEach(item => (item.hidden = item !== view));
    document.querySelector(".log-shell").scrollTop = 0;
  }

  function formatDate(value) {
    if (!value) return "date not entered";
    const [year, month, day] = value.split("-");
    return `${Number(month)}/${Number(day)}/${String(year).slice(-2)}`;
  }

  function formatTime(value) {
    if (!value) return "time not entered";
    const [h, m] = value.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  function summaryFor(entry) {
    const text = entry.highlights || entry.captured || entry.feeling || entry.quality || "No notes yet.";
    return text.split("\n").find(Boolean) || "No notes yet.";
  }

  function normalizeSearchText(value) {
    return String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function entrySearchText(entry) {
    const values = [
      entry.recordingNumber,
      entry.date,
      formatDate(entry.date),
      entry.time,
      formatTime(entry.time),
      entry.location,
      entry.subject,
      entry.device,
      entry.deviceOther,
      ...(entry.mics || []),
      entry.accessories,
      entry.volumeSetting,
      entry.highlights,
      entry.captured,
      entry.feeling,
      entry.quality,
      entry.keep,
    ];
    return normalizeSearchText(values.filter(Boolean).join(" "));
  }

  function searchExpansions(term) {
    const normalized = normalizeSearchText(term);
    if (!normalized) return [];
    const matches = new Set([normalized]);

    SOUND_TERMS.forEach(group => {
      const normalizedGroup = group.map(normalizeSearchText).filter(Boolean);
      const belongs = normalizedGroup.some(item => item === normalized || item.split(" ").includes(normalized) || normalized.split(" ").includes(item));
      if (belongs) normalizedGroup.forEach(item => matches.add(item));
    });

    return [...matches];
  }

  function entryMatchesSearch(entry, query) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;
    const haystack = entrySearchText(entry);
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    // Every remembered idea must be present, but each idea may match any of
    // its sound-family words. "footsteps crow train" therefore narrows.
    return terms.every(term => searchExpansions(term).some(candidate => haystack.includes(candidate)));
  }

  function sortedLog(entries) {
    return [...entries].sort((a, b) => {
      const ad = `${a.date || "0000-00-00"}T${a.time || "00:00"}`;
      const bd = `${b.date || "0000-00-00"}T${b.time || "00:00"}`;
      return bd.localeCompare(ad) || String(b.recordingNumber || "").localeCompare(String(a.recordingNumber || ""), undefined, { numeric: true });
    });
  }

  function renderLogList() {
    const allEntries = sortedLog(loadLog());
    const query = currentLogSearch.trim();
    const entries = allEntries.filter(entry => entryMatchesSearch(entry, query));
    logEls.entries.innerHTML = "";
    logEls.empty.hidden = allEntries.length !== 0;
    logEls.noResults.hidden = !query || entries.length !== 0 || allEntries.length === 0;
    logEls.clearSearch.hidden = !query;
    logEls.searchStatus.textContent = query ? `${entries.length} ${entries.length === 1 ? "recording" : "recordings"} found` : "";

    entries.forEach(entry => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "log-entry-card";
      button.innerHTML = `
        <span class="entry-card-topline">
          <strong>${escapeHtml(entry.recordingNumber || "—")}</strong>
          <span>${escapeHtml(formatDate(entry.date))} · ${escapeHtml(formatTime(entry.time))}</span>
        </span>
        <span class="entry-card-location">${escapeHtml(entry.location || "location not entered")}</span>
        <span class="entry-card-subject">${escapeHtml(entry.subject || summaryFor(entry))}</span>
        <span class="entry-card-meta">${escapeHtml([entry.device === "other" ? entry.deviceOther : entry.device, ...(entry.mics || []), entry.keep].filter(Boolean).join(" · "))}</span>`;
      button.addEventListener("click", () => openEntry(entry.id));
      logEls.entries.appendChild(button);
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function showLogList() {
    renderLogList();
    showOnly(logEls.listView);
  }

  function clearLogSearch() {
    currentLogSearch = "";
    logEls.search.value = "";
    renderLogList();
    logEls.search.focus();
  }

  function defaultDate() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function openEntry(id = "") {
    logEls.form.reset();
    const entries = loadLog();
    const entry = entries.find(item => item.id === id);
    logEls.entryId.value = entry?.id || "";
    logEls.heading.textContent = entry ? "edit entry" : "new entry";
    logEls.deleteWrap.hidden = !entry;

    const values = entry || { date: defaultDate(), mics: [] };
    const fields = {
      recordingNumber: values.recordingNumber,
      recordingDate: values.date,
      recordingTime: values.time,
      volumeSetting: values.volumeSetting,
      locationField: values.location,
      subjectField: values.subject,
      deviceField: values.device,
      deviceOther: values.deviceOther,
      accessoriesField: values.accessories,
      highlightsField: values.highlights,
      capturedField: values.captured,
      feelingField: values.feeling,
      qualityField: values.quality,
      keepField: values.keep,
    };
    Object.entries(fields).forEach(([idName, value]) => {
      document.getElementById(idName).value = value || "";
    });
    document.querySelectorAll('input[name="mics"]').forEach(input => {
      input.checked = (values.mics || []).includes(input.value);
    });
    showOnly(logEls.entryView);
  }

  function formEntry() {
    const existingId = logEls.entryId.value;
    const entries = loadLog();
    const previous = entries.find(item => item.id === existingId);
    const value = id => document.getElementById(id).value.trim();
    return {
      id: existingId || makeId(),
      createdAt: previous?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recordingNumber: value("recordingNumber"),
      date: document.getElementById("recordingDate").value,
      time: document.getElementById("recordingTime").value,
      location: value("locationField"),
      subject: value("subjectField"),
      device: document.getElementById("deviceField").value,
      deviceOther: value("deviceOther"),
      mics: [...document.querySelectorAll('input[name="mics"]:checked')].map(input => input.value),
      accessories: value("accessoriesField"),
      volumeSetting: value("volumeSetting"),
      highlights: value("highlightsField"),
      captured: value("capturedField"),
      feeling: value("feelingField"),
      quality: value("qualityField"),
      keep: document.getElementById("keepField").value,
    };
  }

  function saveCurrentEntry() {
    const entry = formEntry();
    const entries = loadLog();
    const index = entries.findIndex(item => item.id === entry.id);
    if (index >= 0) entries[index] = entry;
    else entries.push(entry);
    saveLog(entries);
    showLogList();
  }

  function deleteCurrentEntry() {
    const id = logEls.entryId.value;
    if (!id || !confirm("Delete this recording entry?")) return;
    saveLog(loadLog().filter(item => item.id !== id));
    showLogList();
  }

  function showBackup() {
    logEls.status.textContent = "";
    showOnly(logEls.backupView);
  }

  function backupPayload() {
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      entries: loadLog(),
    };
  }

  function downloadBackup() {
    const payload = JSON.stringify(backupPayload(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `go-listen-log-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    logEls.status.textContent = `${loadLog().length} entries backed up.`;
  }

  function chooseBackup(mode) {
    pendingFileMode = mode;
    logEls.fileInput.value = "";
    logEls.fileInput.click();
  }

  function validateBackup(data) {
    if (!data || data.format !== BACKUP_FORMAT || data.version !== BACKUP_VERSION || !Array.isArray(data.entries)) {
      throw new Error("This is not a compatible Go Listen backup file.");
    }
    const valid = data.entries.every(entry => entry && typeof entry.id === "string");
    if (!valid) throw new Error("The backup contains invalid recording entries.");
    return data.entries;
  }

  async function handleBackupFile(file) {
    try {
      const data = JSON.parse(await file.text());
      const incoming = validateBackup(data);
      if (pendingFileMode === "restore") {
        if (!confirm(`Restore ${incoming.length} entries? This will replace the current log.`)) return;
        saveLog(incoming);
        logEls.status.textContent = `${incoming.length} entries restored.`;
      } else {
        const current = loadLog();
        const ids = new Set(current.map(entry => entry.id));
        const additions = incoming.filter(entry => !ids.has(entry.id));
        saveLog([...current, ...additions]);
        logEls.status.textContent = `${additions.length} entries added; ${incoming.length - additions.length} already existed.`;
      }
    } catch (error) {
      logEls.status.textContent = error.message || "The backup could not be read.";
    }
  }

  logEls.search.addEventListener("input", event => {
    currentLogSearch = event.target.value;
    renderLogList();
  });
  logEls.clearSearch.addEventListener("click", clearLogSearch);
  logEls.search.addEventListener("keydown", event => {
    if (event.key === "Escape" && currentLogSearch) clearLogSearch();
  });

  logEls.add.addEventListener("click", () => openEntry());
  logEls.emptyAdd.addEventListener("click", () => openEntry());
  logEls.cancelEntry.addEventListener("click", showLogList);
  logEls.saveEntry.addEventListener("click", saveCurrentEntry);
  logEls.deleteEntry.addEventListener("click", deleteCurrentEntry);
  logEls.openBackup.addEventListener("click", showBackup);
  logEls.closeBackup.addEventListener("click", showLogList);
  logEls.backup.addEventListener("click", downloadBackup);
  logEls.restore.addEventListener("click", () => chooseBackup("restore"));
  logEls.merge.addEventListener("click", () => chooseBackup("merge"));
  logEls.fileInput.addEventListener("change", () => {
    const file = logEls.fileInput.files?.[0];
    if (file) handleBackupFile(file);
  });

  render();
})();
