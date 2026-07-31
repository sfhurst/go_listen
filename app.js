(() => {
  "use strict";

  const STORAGE_KEY = "goListen.phase1.v2";
  const LOG_STORAGE_KEY = "goListen.recordingLog.v1";
  const BACKUP_FORMAT = "go-listen-backup";
  const BACKUP_VERSION = 1;
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
    signatureSuccessTop: document.getElementById("signatureSuccessTop"),
    signatureSuccessBottom: document.getElementById("signatureSuccessBottom"),
    logScreen: document.getElementById("logScreen"),
    signatureLogTop: document.getElementById("signatureLogTop"),
    signatureLogBottom: document.getElementById("signatureLogBottom")
  };

  let state = loadState();
  let resizeTimer = null;
  let rerolling = false;
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
      makeTopSignatureFor(els.signatureSuccessTop);
      makeBottomSignature(els.signatureSuccessBottom);
      els.successScreen.hidden = false;
      activeMainScreen = "success";
      els.successScreen.classList.add("is-fading");
      requestAnimationFrame(() => requestAnimationFrame(() => els.successScreen.classList.remove("is-fading")));
      scheduleWakeup();
    }, 220);
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
        els.successScreen.hidden = true;
        makeTopSignature();
        makeBottomSignature(els.signatureBottom);
        activeMainScreen = "prompt";
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
      activeMainScreen = "prompt";
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
    state.queues.subjects = shuffle(state.queues.subjects);
    state.queues.scavenger = shuffle(state.queues.scavenger);
    state.queues.perspectives = shuffle(state.queues.perspectives);
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
    status: document.getElementById("backupStatus")
  };

  let pendingFileMode = null;
  let currentLogSearch = "";

  const SOUND_TERMS = Array.isArray(window.GO_LISTEN_SOUND_TERMS)
    ? window.GO_LISTEN_SOUND_TERMS
    : [];

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
    [logEls.listView, logEls.entryView, logEls.backupView].forEach(item => item.hidden = item !== view);
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
      entry.recordingNumber, entry.date, formatDate(entry.date), entry.time, formatTime(entry.time),
      entry.location, entry.subject, entry.device, entry.deviceOther, ...(entry.mics || []),
      entry.accessories, entry.volumeSetting, entry.highlights, entry.captured, entry.feeling,
      entry.quality, entry.keep
    ];
    return normalizeSearchText(values.filter(Boolean).join(" "));
  }

  function searchExpansions(term) {
    const normalized = normalizeSearchText(term);
    if (!normalized) return [];
    const matches = new Set([normalized]);

    SOUND_TERMS.forEach(group => {
      const normalizedGroup = group.map(normalizeSearchText).filter(Boolean);
      const belongs = normalizedGroup.some(item =>
        item === normalized || item.split(" ").includes(normalized) || normalized.split(" ").includes(item)
      );
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
    logEls.searchStatus.textContent = query
      ? `${entries.length} ${entries.length === 1 ? "recording" : "recordings"} found`
      : "";

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
      keepField: values.keep
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
      keep: document.getElementById("keepField").value
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
      entries: loadLog()
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
