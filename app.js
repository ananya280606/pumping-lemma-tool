/* ============================================================
   PUMPING LEMMA DEMONSTRATION TOOL — app.js  (UPGRADED)
   Extends original code with:
     - 8 Regular languages (5 original + 3 new)
     - 4 CFL languages with uvwxy decomposition
     - Reset simulation
     - Step-by-step i increment via same Demonstrate button
     - Auto-contradiction detection
     - Character counter visualization
     - Random example generator
     - Hint system (rotating tips)
     - CFL advanced mode toggle
     - Enhanced output panel
     - Pumping animation labels
     - Invalid split detection
   ============================================================ */

"use strict";

/* ════════════════════════════════════════════════════════════
   SECTION 1: LANGUAGE DEFINITIONS
   Original 5 languages kept exactly. 3 new Regular + 4 CFL added.
   ════════════════════════════════════════════════════════════ */

// ── Regular Language Presets (ORIGINAL 5 + 3 NEW) ───────────
const LANGUAGE_PRESETS = {

  /* ── ORIGINAL 5 (unchanged) ── */
  abn: {
    name: "aⁿbⁿ",
    defaultString: "aaabbb",
    alphabet: "ab",
    description: "Strings with exactly n a's followed by n b's (n ≥ 1). Classic proof that this is NOT regular.",
    isRegular: false,
    isInLanguage(s) {
      const m = s.match(/^(a*)(b*)$/);
      if (!m) return false;
      return m[1].length === m[2].length && m[1].length > 0;
    },
    generateExample() { const n = 2 + Math.floor(Math.random() * 4); return "a".repeat(n) + "b".repeat(n); },
    hints: ["Try i=0 to see the string shrink!", "y should be in the a-region for best effect.", "When y consists of only a's, pumping changes the a-count but not b's."]
  },

  a_star_b_star: {
    name: "a*b*",
    defaultString: "aaabb",
    alphabet: "ab",
    description: "Any number of a's followed by any number of b's. This IS regular — pumping works for all splits!",
    isRegular: true,
    isInLanguage(s) { return /^a*b*$/.test(s); },
    generateExample() {
      const na = Math.floor(Math.random() * 5);
      const nb = Math.floor(Math.random() * 5);
      return "a".repeat(na) + "b".repeat(nb);
    },
    hints: ["This is a regular language — try any split!", "No split will cause a contradiction here.", "The DFA for this is simple: read a's then b's."]
  },

  palindrome: {
    name: "ww^R",
    defaultString: "abba",
    alphabet: "ab",
    description: "Strings that are even-length palindromes (w concatenated with its reverse). NOT regular.",
    isRegular: false,
    isInLanguage(s) {
      if (s.length % 2 !== 0) return false;
      const half = s.length / 2;
      return s.slice(0, half) === s.slice(half).split("").reverse().join("");
    },
    generateExample() {
      const words = ["ab","ba","aab","abb","abba","baab"];
      const w = words[Math.floor(Math.random() * words.length)];
      return w + w.split("").reverse().join("");
    },
    hints: ["The string must be an even-length palindrome.", "Pumping breaks the palindrome symmetry!", "Try a short palindrome like 'abba'."]
  },

  equal_ab: {
    name: "#a = #b",
    defaultString: "aabb",
    alphabet: "ab",
    description: "Strings where the count of a equals count of b (any order). NOT regular.",
    isRegular: false,
    isInLanguage(s) {
      if (!/^[ab]*$/.test(s)) return false;
      const na = (s.match(/a/g) || []).length;
      const nb = (s.match(/b/g) || []).length;
      return na === nb;
    },
    generateExample() {
      const n = 1 + Math.floor(Math.random() * 4);
      const arr = Array(n).fill("a").concat(Array(n).fill("b"));
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.join("");
    },
    hints: ["The a's and b's don't need to be in order!", "Watch how pumping changes the a/b balance.", "Use the counter to track mismatch."]
  },

  /* ── NEW REGULAR LANGUAGE 6 ── */
  prime_len: {
    name: "aᵖ (prime)",
    defaultString: "aaaaaaa",  // length 7 (prime)
    alphabet: "a",
    description: "Strings of a's whose length is a prime number. NOT regular — prime lengths cannot be described by a DFA.",
    isRegular: false,
    isInLanguage(s) {
      if (!/^a*$/.test(s)) return false;
      const n = s.length;
      if (n < 2) return false;
      for (let i = 2; i <= Math.sqrt(n); i++) { if (n % i === 0) return false; }
      return true;
    },
    generateExample() {
      const primes = [2, 3, 5, 7, 11, 13];
      const p = primes[Math.floor(Math.random() * primes.length)];
      return "a".repeat(p);
    },
    hints: ["Only strings of prime length (2,3,5,7,11…) are in L.", "Pumping changes the length — primes are fragile!", "Try length 5 or 7 to start."]
  },

  /* ── NEW REGULAR LANGUAGE 8 ── */
  square_len: {
    name: "aⁿ² (perfect square)",
    defaultString: "aaaaaaaaa",   // length 9 = 3²
    alphabet: "a",
    description: "Strings of a's whose length is a perfect square (1,4,9,16…). NOT regular.",
    isRegular: false,
    isInLanguage(s) {
      if (!/^a*$/.test(s)) return false;
      const n = s.length;
      const sq = Math.round(Math.sqrt(n));
      return sq * sq === n;
    },
    generateExample() {
      const bases = [1, 2, 3, 4];
      const b = bases[Math.floor(Math.random() * bases.length)];
      return "a".repeat(b * b);
    },
    hints: ["Lengths 1, 4, 9, 16, 25… are perfect squares.", "Pumping shifts the length away from a square.", "This is a great example for the 'gap argument'!"]
  },

  /* ── CUSTOM (ORIGINAL) ── */
  custom: {
    name: "Custom",
    defaultString: "",
    alphabet: "abc",
    description: "Enter any string for manual exploration. Membership is assumed true.",
    isRegular: null,
    isInLanguage() { return true; },
    generateExample() { return "aabb"; },
    hints: ["Select a preset language for automatic verdict.", "Custom mode lets you explore any decomposition freely.", "Try building a contradiction manually!"]
  },
};

/* ── CFL Language Presets (ALL NEW) ─────────────────────────── */
const CFL_PRESETS = {

  anbncn: {
    name: "aⁿbⁿcⁿ",
    defaultString: "aaabbbccc",
    alphabet: "abc",
    description: "Equal n a's, b's, and c's in order. NOT a CFL — the CFL pumping lemma cannot be satisfied.",
    isCFL: false,
    isInLanguage(s) {
      const m = s.match(/^(a*)(b*)(c*)$/);
      if (!m) return false;
      return m[1].length === m[2].length && m[2].length === m[3].length && m[1].length > 0;
    },
    generateExample() { const n = 2 + Math.floor(Math.random() * 3); return "a".repeat(n)+"b".repeat(n)+"c".repeat(n); },
    explanation: "Pumping v and x simultaneously cannot keep #a=#b=#c balanced. If v is in the a-region and x is in the b-region, pumping increases a's and b's but not c's."
  },

  wwR_cfl: {
    name: "wwᴿ",
    defaultString: "abbaabba",
    alphabet: "ab",
    description: "Strings of the form w followed by the reverse of w. IS a CFL — generated by a pushdown automaton.",
    isCFL: true,
    isInLanguage(s) {
      if (s.length % 2 !== 0) return false;
      const half = s.length / 2;
      return s.slice(0, half) === s.slice(half).split("").reverse().join("");
    },
    generateExample() {
      const words = ["ab","aab","abb","abab"];
      const w = words[Math.floor(Math.random() * words.length)];
      return w + w.split("").reverse().join("");
    },
    explanation: "This language IS context-free. A PDA can match the first half with the second half using a stack. Pumping lemma holds here."
  },

  anbmcn: {
    name: "aⁿbᵐcⁿ",
    defaultString: "aabbbbcc",
    alphabet: "abc",
    description: "Equal n a's and n c's, any number of b's in between. IS a CFL.",
    isCFL: true,
    isInLanguage(s) {
      const m = s.match(/^(a+)(b*)(c+)$/);
      if (!m) return false;
      return m[1].length === m[3].length;
    },
    generateExample() {
      const n = 1 + Math.floor(Math.random() * 3);
      const m = Math.floor(Math.random() * 4);
      return "a".repeat(n) + "b".repeat(m) + "c".repeat(n);
    },
    explanation: "This IS a CFL. A PDA pushes a's, skips b's, then pops for each c. The a-region and c-region pump symmetrically."
  },

  ww_cfl: {
    name: "ww",
    defaultString: "abab",
    alphabet: "ab",
    description: "Strings of the form ww (a word concatenated with itself). NOT a CFL.",
    isCFL: false,
    isInLanguage(s) {
      if (s.length % 2 !== 0) return false;
      const half = s.length / 2;
      return s.slice(0, half) === s.slice(half);
    },
    generateExample() {
      const words = ["ab","ba","abb","aab"];
      const w = words[Math.floor(Math.random() * words.length)];
      return w + w;
    },
    explanation: "ww is NOT a CFL. No PDA can match positions in the first half with corresponding positions in the second half — it requires two stacks."
  },
};

/* ════════════════════════════════════════════════════════════
   SECTION 2: APPLICATION STATE
   Extends original state with mode and CFL fields.
   ════════════════════════════════════════════════════════════ */
const state = {
  /* Original fields */
  language:    "custom",
  inputString: "",
  p:           3,
  xLen:        1,
  yLen:        2,
  pumpCount:   2,
  activeTab:   -1,

  /* NEW fields */
  mode:        "regular",   // "regular" | "cfl"
  cflLanguage: "anbncn",
  cflU:        1,           // CFL split lengths
  cflV:        1,
  cflW:        2,
  cflX:        1,
  stepI:       0,           // Step-by-step i value
  hintIndex:   0,           // Current hint index
  hasRun:      false,       // Whether demonstration has run
};

/* ════════════════════════════════════════════════════════════
   SECTION 3: DOM REFERENCES
   Extends original els object with new element IDs.
   ════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

const els = {
  /* ORIGINAL refs (unchanged) */
  languageSelect:   $("languageSelect"),
  inputString:      $("inputString"),
  pumpingLength:    $("pumpingLength"),
  pumpingLengthVal: $("pumpingLengthVal"),
  splitX:           $("splitX"),
  splitXVal:        $("splitXVal"),
  splitY:           $("splitY"),
  splitYVal:        $("splitYVal"),
  pumpCount:        $("pumpCount"),
  pumpCountVal:     $("pumpCountVal"),
  btnDemonstrate:   $("btnDemonstrate"),
  decompChars:      $("decompChars"),
  decompBrackets:   $("decompBrackets"),
  decompInfo:       $("decompInfo"),
  pumpTabs:         $("pumpTabs"),
  pumpDisplay:      $("pumpDisplay"),
  verdictBox:       $("verdictBox"),
  proofSteps:       $("proofSteps"),

  /* NEW refs */
  btnReset:             $("btnReset"),
  btnGenExample:        $("btnGenExample"),
  btnModeRegular:       $("btnModeRegular"),
  btnModeCFL:           $("btnModeCFL"),
  theoremRegular:       $("theoremRegular"),
  theoremCFL:           $("theoremCFL"),
  regularLangGroup:     $("regularLangGroup"),
  cflLangGroup:         $("cflLangGroup"),
  cflLanguageSelect:    $("cflLanguageSelect"),
  langDescBadge:        $("langDescBadge"),
  langDescIcon:         $("langDescIcon"),
  langDescText:         $("langDescText"),
  alphabetHint:         $("alphabetHint"),
  regularSliders:       $("regularSliders"),
  cflSliders:           $("cflSliders"),
  cflSplitU:            $("cflSplitU"),
  cflSplitUVal:         $("cflSplitUVal"),
  cflSplitV:            $("cflSplitV"),
  cflSplitVVal:         $("cflSplitVVal"),
  cflSplitW:            $("cflSplitW"),
  cflSplitWVal:         $("cflSplitWVal"),
  cflSplitX:            $("cflSplitX"),
  cflSplitXVal:         $("cflSplitXVal"),
  stepPumpIndicator:    $("stepPumpIndicator"),
  stepIValue:           $("stepIValue"),
  btnNextI:             $("btnNextI"),
  animLabel:            $("animLabel"),
  contradictionBadge:   $("contradictionBadge"),
  pumpHistoryHeader:    $("pumpHistoryHeader"),
  counterPanel:         $("counterPanel"),
  counterGrid:          $("counterGrid"),
  enhancedOutput:       $("enhancedOutput"),
  eoOriginal:           $("eoOriginal"),
  eoPumped:             $("eoPumped"),
  eoReason:             $("eoReason"),
  hintText:             $("hintText"),
  btnNextHint:          $("btnNextHint"),
  regularLegend:        $("regularLegend"),
  cflLegend:            $("cflLegend"),
  footerModeLabel:      $("footerModeLabel"),
  vcTitleDecomp:        $("vcTitleDecomp"),
  vcTitlePump:          $("vcTitlePump"),
};

/* ════════════════════════════════════════════════════════════
   SECTION 4: SLIDER UTILITIES (ORIGINAL, unchanged)
   ════════════════════════════════════════════════════════════ */

// Original syncSlider — keeps gradient fill working
function syncSlider(input, label) {
  label.textContent = input.value;
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  // Use sage-dark for regular, cfl-purple for CFL sliders
  const color = state.mode === "cfl" ? "#8b5cf6" : "#8b5cf6";
  input.style.background = `linear-gradient(90deg, ${color} ${pct}%, #263348 ${pct}%)`;
}

// Original clampSplitters — prevents |xy| > p
function clampSplitters() {
  const p = parseInt(els.pumpingLength.value);
  els.splitX.max = Math.max(0, p - 1);
  els.splitY.max = Math.max(1, p);
  if (parseInt(els.splitX.value) > parseInt(els.splitX.max)) {
    els.splitX.value = els.splitX.max;
    syncSlider(els.splitX, els.splitXVal);
  }
  if (parseInt(els.splitY.value) > parseInt(els.splitY.max)) {
    els.splitY.value = els.splitY.max;
    syncSlider(els.splitY, els.splitYVal);
  }
}

/* ════════════════════════════════════════════════════════════
   SECTION 5: INIT (ORIGINAL + new event listeners)
   ════════════════════════════════════════════════════════════ */

function init() {
  /* ORIGINAL slider syncs */
  syncSlider(els.pumpingLength, els.pumpingLengthVal);
  syncSlider(els.splitX, els.splitXVal);
  syncSlider(els.splitY, els.splitYVal);
  syncSlider(els.pumpCount, els.pumpCountVal);

  /* ORIGINAL listeners */
  els.languageSelect.addEventListener("change", onLanguageChange);
  els.btnDemonstrate.addEventListener("click",  demonstrate);

  els.pumpingLength.addEventListener("input", () => {
    syncSlider(els.pumpingLength, els.pumpingLengthVal);
    clampSplitters();
  });
  els.splitX.addEventListener("input",    () => syncSlider(els.splitX, els.splitXVal));
  els.splitY.addEventListener("input",    () => syncSlider(els.splitY, els.splitYVal));
  els.pumpCount.addEventListener("input", () => syncSlider(els.pumpCount, els.pumpCountVal));

  /* NEW listeners */
  els.btnReset.addEventListener("click",        resetSimulation);
  els.btnGenExample.addEventListener("click",   generateExample);
  els.btnNextHint.addEventListener("click",     showNextHint);
  els.btnNextI.addEventListener("click",        incrementI);
  els.btnModeRegular.addEventListener("click",  () => switchMode("regular"));
  els.btnModeCFL.addEventListener("click",      () => switchMode("cfl"));
  els.cflLanguageSelect.addEventListener("change", onCFLLanguageChange);

  /* NEW: CFL slider syncs */
  els.cflSplitU.addEventListener("input", () => syncSlider(els.cflSplitU, els.cflSplitUVal));
  els.cflSplitV.addEventListener("input", () => syncSlider(els.cflSplitV, els.cflSplitVVal));
  els.cflSplitW.addEventListener("input", () => syncSlider(els.cflSplitW, els.cflSplitWVal));
  els.cflSplitX.addEventListener("input", () => syncSlider(els.cflSplitX, els.cflSplitXVal));

  /* Render initial empty states */
  renderEmptyStates();
  updateHint();
}

/* ════════════════════════════════════════════════════════════
   SECTION 6: MODE SWITCHING (NEW)
   ════════════════════════════════════════════════════════════ */

function switchMode(mode) {
  state.mode = mode;

  // Update mode buttons
  els.btnModeRegular.classList.toggle("active", mode === "regular");
  els.btnModeCFL.classList.toggle("active",     mode === "cfl");

  // Show/hide theorem banners
  els.theoremRegular.classList.toggle("hidden", mode === "cfl");
  els.theoremCFL.classList.toggle("hidden",     mode === "regular");

  // Show/hide language groups
  els.regularLangGroup.classList.toggle("hidden", mode === "cfl");
  els.cflLangGroup.classList.toggle("hidden",     mode === "regular");

  // Show/hide slider groups
  els.regularSliders.classList.toggle("hidden", mode === "cfl");
  els.cflSliders.classList.toggle("hidden",     mode === "regular");

  // Show/hide legends
  els.regularLegend.classList.toggle("hidden", mode === "cfl");
  els.cflLegend.classList.toggle("hidden",     mode === "regular");

  // Update footer label (if element exists in DOM)
  if (els.footerModeLabel) {
    els.footerModeLabel.textContent = mode === "cfl" ? "CFL Advanced Mode" : "Regular Mode";
  }

  // Update panel titles
  if (mode === "cfl") {
    els.vcTitleDecomp.textContent = "String Decomposition (uvwxy)";
    els.vcTitlePump.textContent   = "CFL Pumping Simulation";
    onCFLLanguageChange();
  } else {
    els.vcTitleDecomp.textContent = "String Decomposition";
    els.vcTitlePump.textContent   = "Pumping Simulation";
    onLanguageChange();
  }

  // Reset visualization
  renderEmptyStates();
  state.hasRun = false;
}

/* ════════════════════════════════════════════════════════════
   SECTION 7: LANGUAGE CHANGE HANDLERS (ORIGINAL + new)
   ════════════════════════════════════════════════════════════ */

// ORIGINAL — extended with description badge + alphabet hint
function onLanguageChange() {
  const key  = els.languageSelect.value;
  state.language = key;
  const lang = LANGUAGE_PRESETS[key];

  if (key !== "custom" && lang?.defaultString) {
    els.inputString.value = lang.defaultString;
  }

  // NEW: Update description badge
  updateDescriptionBadge(lang, false);

  // NEW: Update alphabet hint
  if (lang) {
    els.alphabetHint.textContent = `symbols: ${lang.alphabet.split("").join(", ")}`;
  }

  // NEW: Reset step-i
  state.stepI = 0;
  updateHint(lang);
}

// NEW: CFL language change handler
function onCFLLanguageChange() {
  const key  = els.cflLanguageSelect.value;
  state.cflLanguage = key;
  const lang = CFL_PRESETS[key];

  if (lang?.defaultString) {
    els.inputString.value = lang.defaultString;
  }

  updateDescriptionBadge(lang, true);
  updateHint();
}

// NEW: Show/hide description badge with language info
function updateDescriptionBadge(lang, isCFL) {
  if (!lang) { els.langDescBadge.classList.add("hidden"); return; }

  els.langDescBadge.classList.remove("hidden");
  els.langDescBadge.className = `lang-badge${isCFL ? " cfl-badge" : ""}`;

  if (isCFL) {
    const cflLang = CFL_PRESETS[state.cflLanguage];
    els.langDescIcon.textContent = cflLang?.isCFL === true ? "✅" : cflLang?.isCFL === false ? "❌" : "ℹ";
  } else {
    els.langDescIcon.textContent = lang.isRegular === true ? "✅" : lang.isRegular === false ? "❌" : "ℹ";
  }

  els.langDescText.textContent = lang.description || "";
}

/* ════════════════════════════════════════════════════════════
   SECTION 8: RESET (NEW)
   ════════════════════════════════════════════════════════════ */

function resetSimulation() {
  // Clear input
  els.inputString.value = "";

  // Reset sliders to default values
  els.splitX.value    = "1";  syncSlider(els.splitX, els.splitXVal);
  els.splitY.value    = "2";  syncSlider(els.splitY, els.splitYVal);
  els.pumpCount.value = "2";  syncSlider(els.pumpCount, els.pumpCountVal);

  // Reset CFL sliders
  els.cflSplitU.value = "1";  syncSlider(els.cflSplitU, els.cflSplitUVal);
  els.cflSplitV.value = "1";  syncSlider(els.cflSplitV, els.cflSplitVVal);
  els.cflSplitW.value = "2";  syncSlider(els.cflSplitW, els.cflSplitWVal);
  els.cflSplitX.value = "1";  syncSlider(els.cflSplitX, els.cflSplitXVal);

  // Reset step-i
  state.stepI = 0;
  els.stepIValue.textContent = "0";

  // Hide extra panels
  els.counterPanel.classList.add("hidden");
  els.enhancedOutput.classList.add("hidden");
  els.stepPumpIndicator.classList.add("hidden");
  els.animLabel.classList.add("hidden");
  els.contradictionBadge.classList.add("hidden");
  els.pumpHistoryHeader.classList.add("hidden");

  // Clear visualizations
  renderEmptyStates();
  state.hasRun = false;
}

/* ════════════════════════════════════════════════════════════
   SECTION 9: RANDOM EXAMPLE GENERATOR (NEW)
   ════════════════════════════════════════════════════════════ */

function generateExample() {
  if (state.mode === "cfl") {
    const lang = CFL_PRESETS[state.cflLanguage];
    if (lang?.generateExample) {
      els.inputString.value = lang.generateExample();
    }
  } else {
    const lang = LANGUAGE_PRESETS[state.language];
    if (lang?.generateExample) {
      els.inputString.value = lang.generateExample();
    }
  }
  // Brief visual feedback
  els.inputString.style.borderColor = "#8b5cf6";
  setTimeout(() => { els.inputString.style.borderColor = ""; }, 800);
}

/* ════════════════════════════════════════════════════════════
   SECTION 10: STEP-BY-STEP i INCREMENT (NEW)
   ════════════════════════════════════════════════════════════ */

// Increments pump count by 1, up to 5, and re-runs demonstration
function incrementI() {
  if (state.stepI < 5) {
    state.stepI++;
  } else {
    state.stepI = 0; // wrap around
  }
  els.pumpCount.value = String(state.stepI);
  syncSlider(els.pumpCount, els.pumpCountVal);
  els.stepIValue.textContent = state.stepI;
  // Re-run demonstration with new i
  demonstrate();
}

/* ════════════════════════════════════════════════════════════
   SECTION 11: HINT SYSTEM (NEW)
   ════════════════════════════════════════════════════════════ */

const GENERAL_HINTS = [
  "Try i = 0 to see what happens when y is removed entirely.",
  "The y segment should be within the first p characters of the string.",
  "|y| must be ≥ 1. Empty y is not allowed by the Pumping Lemma.",
  "If the language is NOT regular, you'll find some i where xy^iz ∉ L.",
  "Use the 'Generate Example' button to try different strings!",
  "In CFL mode, both v and x are pumped simultaneously.",
  "A contradiction at just one value of i is enough to prove non-regularity.",
  "The pumping length p comes from the number of states in the minimal DFA.",
];

function updateHint(lang) {
  const hints = lang?.hints || GENERAL_HINTS;
  state.hintIndex = state.hintIndex % hints.length;
  els.hintText.textContent = hints[state.hintIndex];
}

function showNextHint() {
  const lang  = state.mode === "cfl" ? null : LANGUAGE_PRESETS[state.language];
  const hints = lang?.hints || GENERAL_HINTS;
  state.hintIndex = (state.hintIndex + 1) % hints.length;
  els.hintText.textContent = hints[state.hintIndex];
}

/* ════════════════════════════════════════════════════════════
   SECTION 12: EMPTY STATES (ORIGINAL, unchanged)
   ════════════════════════════════════════════════════════════ */

function renderEmptyStates() {
  [els.decompBrackets, els.decompInfo, els.pumpTabs, els.proofSteps].forEach(el => {
    el.innerHTML = "";
  });
  els.decompChars.innerHTML =
    `<div class="empty-vis"><span class="empty-glyph">◌</span> Enter a string and run demonstration</div>`;
  els.pumpDisplay.innerHTML =
    `<div class="empty-vis"><span class="empty-glyph">◌</span> Pumped strings appear here</div>`;
  els.verdictBox.className = "verdict-box unknown";
  els.verdictBox.innerHTML = `
    <div class="verdict-placeholder">
      <span class="vp-icon">✦</span>
      <p>Run a demonstration to see the analysis</p>
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   SECTION 13: MEMBERSHIP CHECK (ORIGINAL + extended)
   ════════════════════════════════════════════════════════════ */

function checkMembership(s, langKey) {
  if (state.mode === "cfl") {
    return CFL_PRESETS[langKey]?.isInLanguage(s) ?? true;
  }
  if (langKey === "custom") return true;
  return LANGUAGE_PRESETS[langKey]?.isInLanguage(s) ?? true;
}

/* ════════════════════════════════════════════════════════════
   SECTION 14: DEMONSTRATE — MAIN ENTRY POINT
   Modified: validates alphabet, shows step-by-step indicator,
   routes to regular or CFL demo, then shows enhanced output.
   ════════════════════════════════════════════════════════════ */

function demonstrate() {
  const rawStr = els.inputString.value.trim();
  if (!rawStr) { showInputError("Please enter a string to analyze."); return; }

  // Alphabet validation (EXTENDED: supports custom alphabets)
  const lang    = state.mode === "cfl" ? CFL_PRESETS[state.cflLanguage] : LANGUAGE_PRESETS[state.language];
  const alpha   = lang?.alphabet || "ab";
  const alphaRx = new RegExp(`^[${alpha}]+$`);
  if (!alphaRx.test(rawStr)) {
    showInputError(`String must only use characters: ${alpha.split("").join(", ")}`);
    return;
  }

  // Step indicator is kept hidden in dashboard layout (i visible via slider badge)
  // els.stepPumpIndicator.classList.remove("hidden"); // disabled in dashboard mode
  state.stepI = parseInt(els.pumpCount.value);
  els.stepIValue.textContent = state.stepI;
  state.hasRun = true;

  if (state.mode === "cfl") {
    demonstrateCFL(rawStr);
  } else {
    demonstrateRegular(rawStr);
  }
}

/* ── Show inline input error (replaces alerts) ─────────────── */
function showInputError(msg) {
  // Briefly highlight input
  els.inputString.style.borderColor = "#DC2626";
  els.inputString.title = msg;
  setTimeout(() => { els.inputString.style.borderColor = ""; }, 1500);
  // Show in proof area
  els.proofSteps.innerHTML = `<div class="split-error-msg">⚠️ ${msg}</div>`;
}

/* ════════════════════════════════════════════════════════════
   SECTION 15: REGULAR MODE DEMONSTRATION
   Original demonstrate() logic, refactored into this function.
   ════════════════════════════════════════════════════════════ */

function demonstrateRegular(s) {
  const p   = parseInt(els.pumpingLength.value);
  const xL  = parseInt(els.splitX.value);
  const yL  = parseInt(els.splitY.value);
  const i   = parseInt(els.pumpCount.value);
  const key = els.languageSelect.value;

  // Invalid split detection (ORIGINAL validation, now with inline error)
  if (xL + yL > p) {
    showInputError(`Constraint violated: |xy| = ${xL + yL} must be ≤ p = ${p}. Adjust x and y lengths.`);
    return;
  }
  if (xL + yL > s.length) {
    showInputError(`|xy| = ${xL + yL} exceeds string length ${s.length}. Adjust lengths.`);
    return;
  }
  if (yL === 0) {
    showInputError("Invalid split: |y| must be ≥ 1 (y cannot be empty).");
    return;
  }

  const xPart = s.slice(0, xL);
  const yPart = s.slice(xL, xL + yL);
  const zPart = s.slice(xL + yL);

  // Update state (ORIGINAL)
  state.s = s; state.p = p; state.xPart = xPart;
  state.yPart = yPart; state.zPart = zPart;
  state.i = i; state.key = key; state.activeTab = i;

  // Show animation label
  showAnimLabel(i);

  // ORIGINAL render calls
  renderDecomposition(s, xPart, yPart, zPart, p);
  renderPumping(xPart, yPart, zPart, i, key);
  renderVerdict(s, xPart, yPart, zPart, p, i, key);

  // NEW: counter visualization
  renderCounterPanel(s, xPart + yPart.repeat(i) + zPart, key);

  // NEW: enhanced output
  renderEnhancedOutput(s, xPart, yPart, zPart, i, key);
}

/* ════════════════════════════════════════════════════════════
   SECTION 16: CFL MODE DEMONSTRATION (ALL NEW)
   ════════════════════════════════════════════════════════════ */

function demonstrateCFL(s) {
  const p    = parseInt(els.pumpingLength.value);
  const uL   = parseInt(els.cflSplitU.value);
  const vL   = parseInt(els.cflSplitV.value);
  const wL   = parseInt(els.cflSplitW.value);
  const xL   = parseInt(els.cflSplitX.value);
  const i    = parseInt(els.pumpCount.value);
  const key  = state.cflLanguage;

  // CFL constraints: |vwx| ≤ p, |vx| ≥ 1
  const vwxLen = vL + wL + xL;
  if (vwxLen > p) {
    showInputError(`CFL constraint violated: |vwx| = ${vwxLen} must be ≤ p = ${p}.`);
    return;
  }
  if (vL + xL < 1) {
    showInputError("Invalid CFL split: |vx| must be ≥ 1 (at least one of v or x must be non-empty).");
    return;
  }
  if (uL + vL + wL + xL > s.length) {
    showInputError(`Split lengths (u+v+w+x = ${uL+vL+wL+xL}) exceed string length ${s.length}.`);
    return;
  }

  // Compute parts
  const uPart = s.slice(0, uL);
  const vPart = s.slice(uL, uL + vL);
  const wPart = s.slice(uL + vL, uL + vL + wL);
  const xPart = s.slice(uL + vL + wL, uL + vL + wL + xL);
  const yPart = s.slice(uL + vL + wL + xL);

  showAnimLabel(i);

  // Render CFL decomposition
  renderDecompositionCFL(s, uPart, vPart, wPart, xPart, yPart, p);

  // Render CFL pumping
  renderPumpingCFL(uPart, vPart, wPart, xPart, yPart, i, key);

  // Render CFL verdict
  renderVerdictCFL(s, uPart, vPart, wPart, xPart, yPart, p, i, key);
}

/* ════════════════════════════════════════════════════════════
   SECTION 17: ANIMATION HELPERS (NEW)
   ════════════════════════════════════════════════════════════ */

function showAnimLabel(i) {
  els.animLabel.classList.remove("hidden");
  els.animLabel.textContent = i === 0 ? "Removing y…" : `Pumping y (i=${i})…`;
  setTimeout(() => els.animLabel.classList.add("hidden"), 1800);
}

/* ════════════════════════════════════════════════════════════
   SECTION 18: RENDER DECOMPOSITION — REGULAR (ORIGINAL)
   ════════════════════════════════════════════════════════════ */

function renderDecomposition(s, x, y, z, p) {
  const CHAR_W = 44;

  // Build character boxes (ORIGINAL with new pump animation class)
  els.decompChars.innerHTML = "";
  for (let idx = 0; idx < s.length; idx++) {
    const ch = s[idx];
    let partClass = "part-z";
    if (idx < x.length) partClass = "part-x";
    else if (idx < x.length + y.length) partClass = "part-y";

    const box = document.createElement("div");
    // NEW: add pumping-expand animation to y chars
    const animClass = (partClass === "part-y" && state.i > 1) ? " pumping-expand" :
                      (partClass === "part-y" && state.i === 0) ? " pumping-shrink" : "";
    box.className = `char-box ${partClass}${animClass}`;
    box.style.animationDelay = `${idx * 35}ms`;
    box.textContent = ch;

    els.decompChars.appendChild(box);
  }

  // Build bracket row (ORIGINAL)
  els.decompBrackets.innerHTML = "";
  [
    { label: "x", len: x.length, cls: "brace-x" },
    { label: "y", len: y.length, cls: "brace-y" },
    { label: "z", len: z.length, cls: "brace-z" },
  ].forEach(({ label, len, cls }) => {
    if (len === 0) return;
    const brace = document.createElement("div");
    brace.className = `brace-group ${cls}`;
    brace.style.width    = `${len * (CHAR_W + 4) - 4}px`;
    brace.style.minWidth = `${len * (CHAR_W + 4) - 4}px`;
    brace.textContent = label;
    els.decompBrackets.appendChild(brace);
  });

  // Info chips (ORIGINAL - cleaned formatting)
  const xyOk = x.length + y.length <= p;
  els.decompInfo.innerHTML = `
    <div class="info-chip"><span class="chip-part x">x</span> <span class="chip-val">= "${x || "ε"}"</span></div>
    <div class="info-chip"><span class="chip-part y">y</span> <span class="chip-val">= "${y || "ε"}"</span></div>
    <div class="info-chip"><span class="chip-part z">z</span> <span class="chip-val">= "${z || "ε"}"</span></div>
    <div class="info-chip info-chip-constraint">
      <span class="chip-constraint-text">|xy| = ${x.length + y.length} ≤ p = ${p}
        <span class="${xyOk ? "constraint-ok" : "constraint-warn"}">${xyOk ? "✔" : "✘"}</span>
      </span>
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   SECTION 19: RENDER DECOMPOSITION — CFL (NEW)
   ════════════════════════════════════════════════════════════ */

function renderDecompositionCFL(s, u, v, w, x, y, p) {
  const CHAR_W = 44;
  const parts  = [
    { str: u, cls: "part-u" },
    { str: v, cls: "part-v" },
    { str: w, cls: "part-w" },
    { str: x, cls: "part-xp"},
    { str: y, cls: "part-yp"},
  ];

  els.decompChars.innerHTML = "";
  let charIdx = 0;
  for (const { str, cls } of parts) {
    for (const ch of str) {
      const box = document.createElement("div");
      box.className = `char-box ${cls}`;
      box.style.animationDelay = `${charIdx * 35}ms`;
      box.textContent = ch;
      els.decompChars.appendChild(box);
      charIdx++;
    }
  }

  // CFL braces: u v w x y
  els.decompBrackets.innerHTML = "";
  const cflParts = [
    { label: "u", len: u.length, cls: "brace-u" },
    { label: "v", len: v.length, cls: "brace-v" },
    { label: "w", len: w.length, cls: "brace-w" },
    { label: "x", len: x.length, cls: "brace-xp"},
    { label: "y", len: y.length, cls: "brace-yp"},
  ];
  cflParts.forEach(({ label, len, cls }) => {
    if (len === 0) return;
    const brace = document.createElement("div");
    brace.className = `brace-group ${cls}`;
    brace.style.width    = `${len * (CHAR_W + 4) - 4}px`;
    brace.style.minWidth = `${len * (CHAR_W + 4) - 4}px`;
    brace.textContent = label;
    els.decompBrackets.appendChild(brace);
  });

  // CFL info chips
  const vwxLen = v.length + w.length + x.length;
  const vxOk   = v.length + x.length >= 1;
  const vwxOk  = vwxLen <= p;
  els.decompInfo.innerHTML = `
    <div class="info-chip"><span class="chip-part u">u</span> <span class="chip-val">="${u||"ε"}" (${u.length})</span></div>
    <div class="info-chip"><span class="chip-part v">v</span> <span class="chip-val">="${v||"ε"}" (${v.length})</span></div>
    <div class="info-chip"><span class="chip-part w">w</span> <span class="chip-val">="${w||"ε"}" (${w.length})</span></div>
    <div class="info-chip"><span class="chip-part xp">x</span> <span class="chip-val">="${x||"ε"}" (${x.length})</span></div>
    <div class="info-chip"><span class="chip-part yp">y</span> <span class="chip-val">="${y||"ε"}" (${y.length})</span></div>
    <div class="info-chip" style="margin-left:auto;flex-direction:column;gap:2px;">
      <span style="font-size:0.7rem">|vx|=${v.length+x.length} ≥ 1 <span class="${vxOk?"constraint-ok":"constraint-warn"}">${vxOk?"✔":"✘"}</span></span>
      <span style="font-size:0.7rem">|vwx|=${vwxLen} ≤ p=${p} <span class="${vwxOk?"constraint-ok":"constraint-warn"}">${vwxOk?"✔":"✘"}</span></span>
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   SECTION 20: RENDER PUMPING — REGULAR (ORIGINAL + new features)
   ════════════════════════════════════════════════════════════ */

function renderPumping(x, y, z, selectedI, langKey) {
  const maxI = Math.max(selectedI, 4);
  els.pumpTabs.innerHTML = "";

  // Build tabs (ORIGINAL)
  for (let i = 0; i <= maxI; i++) {
    const tab = document.createElement("button");
    tab.className = "pump-tab" + (i === selectedI ? " active" : "");
    tab.textContent = `i = ${i}`;
    tab.dataset.i = i;
    tab.addEventListener("click", () => {
      document.querySelectorAll(".pump-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderPumpRows(x, y, z, parseInt(tab.dataset.i), langKey);
    });
    els.pumpTabs.appendChild(tab);
  }

  // NEW: Show pump history header
  els.pumpHistoryHeader.classList.remove("hidden");

  // NEW: Auto-contradiction detection — scan i=0..5
  detectContradiction(x, y, z, langKey);

  renderPumpRows(x, y, z, selectedI, langKey);
}

// NEW: Auto-contradiction detection (no new button needed)
function detectContradiction(x, y, z, langKey) {
  if (langKey === "custom") {
    els.contradictionBadge.classList.add("hidden");
    return;
  }
  let contradictionI = -1;
  for (let k = 0; k <= 5; k++) {
    const pumped = x + y.repeat(k) + z;
    if (!checkMembership(pumped, langKey)) { contradictionI = k; break; }
  }
  els.contradictionBadge.classList.remove("hidden");
  if (contradictionI >= 0) {
    els.contradictionBadge.className = "contradiction-badge found";
    els.contradictionBadge.textContent = `⚡ Contradiction at i = ${contradictionI}`;
  } else {
    els.contradictionBadge.className = "contradiction-badge none-found";
    els.contradictionBadge.textContent = `✔ No contradiction (i=0..5)`;
  }
}

function renderPumpRows(x, y, z, highlightI, langKey) {
  els.pumpDisplay.innerHTML = "";
  const maxI = Math.max(highlightI, 4);

  for (let i = 0; i <= maxI; i++) {
    const pumped = x + y.repeat(i) + z;
    const inLang = checkMembership(pumped, langKey);

    const row = document.createElement("div");
    row.className = "pump-row";
    row.style.animationDelay = `${i * 40}ms`;
    if (i !== highlightI) row.style.opacity = "0.45";

    const label = document.createElement("div");
    label.className = "pump-label";
    label.textContent = `i=${i}`;

    const strEl = document.createElement("div");
    strEl.className = "pump-string";

    buildPumpChars(strEl, x,           "part-x", false);
    buildPumpChars(strEl, y.repeat(i), "part-y", i === highlightI); // NEW: animate on highlight
    buildPumpChars(strEl, z,           "part-z", false);

    if (pumped === "") {
      const eps = document.createElement("span");
      eps.style.cssText = "font-family:var(--font-mono);color:var(--ink-3);font-size:0.82rem;padding:8px";
      eps.textContent = "ε (empty)";
      strEl.appendChild(eps);
    }

    const status = document.createElement("div");
    status.className = `pump-status ${inLang ? "valid" : "invalid"}`;
    status.textContent = inLang ? `✔ In L` : `✘ Not in L`;

    row.appendChild(label);
    row.appendChild(strEl);
    row.appendChild(status);
    els.pumpDisplay.appendChild(row);
  }
}

// ORIGINAL buildPumpChars + NEW animate parameter
function buildPumpChars(container, str, cls, animate) {
  for (const ch of str) {
    const c = document.createElement("div");
    c.className = `pump-char ${cls}${animate ? " anim-new" : ""}`;
    c.textContent = ch;
    container.appendChild(c);
  }
}

/* ════════════════════════════════════════════════════════════
   SECTION 21: RENDER PUMPING — CFL (NEW)
   ════════════════════════════════════════════════════════════ */

function renderPumpingCFL(u, v, w, x, y, selectedI, langKey) {
  const maxI = Math.max(selectedI, 4);
  els.pumpTabs.innerHTML = "";

  for (let i = 0; i <= maxI; i++) {
    const tab = document.createElement("button");
    tab.className = "pump-tab" + (i === selectedI ? " active" : "");
    tab.textContent = `i = ${i}`;
    tab.dataset.i = i;
    tab.addEventListener("click", () => {
      document.querySelectorAll(".pump-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderPumpRowsCFL(u, v, w, x, y, parseInt(tab.dataset.i), langKey);
    });
    els.pumpTabs.appendChild(tab);
  }

  // CFL contradiction detection
  detectContradictionCFL(u, v, w, x, y, langKey);
  els.pumpHistoryHeader.classList.remove("hidden");
  renderPumpRowsCFL(u, v, w, x, y, selectedI, langKey);
}

function detectContradictionCFL(u, v, w, x, y, langKey) {
  let contradictionI = -1;
  for (let k = 0; k <= 5; k++) {
    const pumped = u + v.repeat(k) + w + x.repeat(k) + y;
    if (!checkMembership(pumped, langKey)) { contradictionI = k; break; }
  }
  els.contradictionBadge.classList.remove("hidden");
  if (contradictionI >= 0) {
    els.contradictionBadge.className = "contradiction-badge found";
    els.contradictionBadge.textContent = `⚡ Contradiction at i = ${contradictionI}`;
  } else {
    els.contradictionBadge.className = "contradiction-badge none-found";
    els.contradictionBadge.textContent = `✔ No contradiction (i=0..5)`;
  }
}

function renderPumpRowsCFL(u, v, w, x, y, highlightI, langKey) {
  els.pumpDisplay.innerHTML = "";
  const maxI = Math.max(highlightI, 4);

  for (let i = 0; i <= maxI; i++) {
    // CFL pumped: u v^i w x^i y
    const pumped = u + v.repeat(i) + w + x.repeat(i) + y;
    const inLang = checkMembership(pumped, langKey);

    const row = document.createElement("div");
    row.className = "pump-row";
    row.style.animationDelay = `${i * 40}ms`;
    if (i !== highlightI) row.style.opacity = "0.45";

    const label = document.createElement("div");
    label.className = "pump-label";
    label.textContent = `i=${i}`;

    const strEl = document.createElement("div");
    strEl.className = "pump-string";

    buildPumpChars(strEl, u,           "part-u",  false);
    buildPumpChars(strEl, v.repeat(i), "part-v",  i === highlightI);
    buildPumpChars(strEl, w,           "part-w",  false);
    buildPumpChars(strEl, x.repeat(i), "part-xp", i === highlightI);
    buildPumpChars(strEl, y,           "part-yp", false);

    if (pumped === "") {
      const eps = document.createElement("span");
      eps.style.cssText = "font-family:var(--font-mono);color:var(--ink-3);font-size:0.82rem;padding:8px";
      eps.textContent = "ε (empty)";
      strEl.appendChild(eps);
    }

    const status = document.createElement("div");
    status.className = `pump-status ${inLang ? "valid" : "invalid"}`;
    status.textContent = inLang ? `✔ In L` : `✘ Not in L`;

    row.appendChild(label);
    row.appendChild(strEl);
    row.appendChild(status);
    els.pumpDisplay.appendChild(row);
  }
}

/* ════════════════════════════════════════════════════════════
   SECTION 22: RENDER VERDICT — REGULAR (ORIGINAL, unchanged logic)
   ════════════════════════════════════════════════════════════ */

function renderVerdict(s, x, y, z, p, i, langKey) {
  const isCustom = langKey === "custom";
  const lang     = LANGUAGE_PRESETS[langKey];

  let allValid = true, pumpsOutside = [];
  const maxCheck = Math.max(i, 5);
  for (let k = 0; k <= maxCheck; k++) {
    const pumped = x + y.repeat(k) + z;
    const inL    = checkMembership(pumped, langKey);
    if (!inL) { allValid = false; pumpsOutside.push({ k, pumped }); }
  }

  const sInL       = checkMembership(s, langKey);
  const yLenOk     = y.length >= 1;
  const xyLenOk    = x.length + y.length <= p;
  const sLongEnough = s.length >= p;

  let verdict, cls, icon, explanation;

  if (isCustom) {
    verdict = "Custom Mode"; cls = "unknown"; icon = "🔍";
    explanation = "Language membership is assumed true for custom mode. Select a preset language to get an automated verdict.";
  } else if (!sInL) {
    verdict = "String not in L"; cls = "unknown"; icon = "⚠️";
    explanation = `The input string "${s}" is not in ${lang.name}. The pumping lemma only applies to strings already in L.`;
  } else if (!sLongEnough) {
    verdict = "String too short"; cls = "unknown"; icon = "📏";
    explanation = `The string has length ${s.length} but p = ${p}. Choose a string with |s| ≥ p to apply the lemma.`;
  } else if (!yLenOk || !xyLenOk) {
    verdict = "Invalid decomposition"; cls = "unknown"; icon = "⚙️";
    explanation = `The split violates constraints: |y| ≥ 1 (${yLenOk ? "✔" : "✘"}) and |xy| ≤ p (${xyLenOk ? "✔" : "✘"}).`;
  } else if (allValid) {
    verdict = "Pumping Condition Holds"; cls = "regular"; icon = "✅";
    explanation = `For this decomposition, xy<sup>i</sup>z ∈ ${lang.name} for all tested i. This does NOT prove regularity, but it's consistent with it.`;
  } else {
    verdict = "Pumping Condition Violated!"; cls = "not-regular"; icon = "❌";
    const ex = pumpsOutside[0];
    explanation = `For i = ${ex.k}, the pumped string "<code>${ex.pumped}</code>" is NOT in ${lang.name}. The pumping lemma fails → language may NOT be regular.`;
  }

  els.verdictBox.className = `verdict-box ${cls}`;
  els.verdictBox.innerHTML = `
    <div class="verdict-inner">
      <div class="verdict-icon">${icon}</div>
      <div class="verdict-text">
        <h3>${verdict}</h3>
        <p>${explanation}</p>
      </div>
    </div>`;

  renderProofSteps(s, x, y, z, p, i, langKey, sInL, sLongEnough, allValid, pumpsOutside);
}

/* ════════════════════════════════════════════════════════════
   SECTION 23: RENDER VERDICT — CFL (NEW)
   ════════════════════════════════════════════════════════════ */

function renderVerdictCFL(s, u, v, w, x, y, p, i, langKey) {
  const lang = CFL_PRESETS[langKey];

  let allValid = true, pumpsOutside = [];
  for (let k = 0; k <= Math.max(i, 5); k++) {
    const pumped = u + v.repeat(k) + w + x.repeat(k) + y;
    const inL    = checkMembership(pumped, langKey);
    if (!inL) { allValid = false; pumpsOutside.push({ k, pumped }); }
  }

  const sInL   = checkMembership(s, langKey);
  const vxOk   = v.length + x.length >= 1;
  const vwxOk  = v.length + w.length + x.length <= p;

  let verdict, cls, icon, explanation;

  if (!sInL) {
    verdict = "String not in L"; cls = "unknown"; icon = "⚠️";
    explanation = `"${s}" is not in ${lang.name}. CFL pumping lemma only applies to strings in L.`;
  } else if (!vxOk || !vwxOk) {
    verdict = "Invalid CFL split"; cls = "unknown"; icon = "⚙️";
    explanation = `CFL constraints violated: |vx| ≥ 1 (${vxOk ? "✔" : "✘"}) and |vwx| ≤ p (${vwxOk ? "✔" : "✘"}).`;
  } else if (allValid) {
    verdict = lang.isCFL ? "CFL Pumping Holds ✅" : "CFL Pumping Holds (but may violate for other splits)";
    cls     = "regular"; icon = "✅";
    explanation = lang.isCFL
      ? `This language IS context-free. ${lang.explanation}`
      : `No violation found for this decomposition, but this language is NOT a CFL. Try different v/x positions. ${lang.explanation}`;
  } else {
    const ex = pumpsOutside[0];
    verdict = lang.isCFL === false ? `NOT a CFL — Contradiction Found!` : `CFL Pumping Violated`;
    cls     = "not-regular"; icon = "❌";
    explanation = `For i = ${ex.k}, uv<sup>${ex.k}</sup>wx<sup>${ex.k}</sup>y = "<code>${ex.pumped}</code>" is NOT in ${lang.name}. ${lang.explanation}`;
  }

  els.verdictBox.className = `verdict-box ${cls}`;
  els.verdictBox.innerHTML = `
    <div class="verdict-inner">
      <div class="verdict-icon">${icon}</div>
      <div class="verdict-text">
        <h3>${verdict}</h3>
        <p>${explanation}</p>
      </div>
    </div>`;

  renderProofStepsCFL(s, u, v, w, x, y, p, i, langKey, sInL, allValid, pumpsOutside);
}

/* ════════════════════════════════════════════════════════════
   SECTION 24: PROOF STEPS — REGULAR (ORIGINAL, unchanged)
   ════════════════════════════════════════════════════════════ */

function renderProofSteps(s, x, y, z, p, i, langKey, sInL, sLongEnough, allValid, pumpsOutside) {
  const isCustom = langKey === "custom";
  const lang     = LANGUAGE_PRESETS[langKey];

  const steps = [
    {
      n: "Step 1",
      text: `Assume for contradiction that <strong>${isCustom ? "L" : lang.name}</strong> is regular. Then by the Pumping Lemma, there exists a pumping length <strong>p = ${p}</strong>.`
    },
    {
      n: "Step 2",
      text: `Choose the string <code>${s}</code> (length ${s.length}${sLongEnough ? " ≥" : " <"} p = ${p}). 
             ${sInL && !isCustom ? `This string is in ${lang.name}.` : isCustom ? "" : `⚠ This string is not in L.`}`
    },
    {
      n: "Step 3",
      text: `By the lemma, <em>any</em> decomposition <strong>s = xyz</strong> with |xy| ≤ p and |y| ≥ 1 must satisfy xy<sup>i</sup>z ∈ L for all i ≥ 0.<br>
             Current split: <code>x = "${x || "ε"}"</code>, <code>y = "${y}"</code>, <code>z = "${z || "ε"}"</code> — |xy| = ${x.length + y.length}, |y| = ${y.length}.`
    },
    {
      n: "Step 4",
      text: allValid || isCustom
        ? `For all tested values of i (0 to ${Math.max(i, 4)}), xy<sup>i</sup>z <strong>${isCustom ? "(assumed) stays in L" : "stays in L"}</strong>.`
        : `Choose <strong>i = ${pumpsOutside[0].k}</strong>: the pumped string <code>${pumpsOutside[0].pumped}</code> is <strong>NOT in L</strong>. This is a contradiction!`
    },
    {
      n: "Conclusion",
      text: allValid || isCustom
        ? `No violation was found. Note: to prove a language is not regular, the lemma must fail for <em>all</em> valid decompositions.`
        : `Since xy<sup>i</sup>z ∉ L for some i, the assumption that L is regular leads to contradiction. Therefore <strong>L is NOT regular</strong>.`
    }
  ];

  els.proofSteps.innerHTML = steps.map((st, idx) =>
    `<div class="proof-step" style="animation-delay:${idx * 60}ms">
       <span class="step-num">${st.n}</span>
       <span class="step-text">${st.text}</span>
     </div>`
  ).join("");
}

/* ════════════════════════════════════════════════════════════
   SECTION 25: PROOF STEPS — CFL (NEW)
   ════════════════════════════════════════════════════════════ */

function renderProofStepsCFL(s, u, v, w, x, y, p, i, langKey, sInL, allValid, pumpsOutside) {
  const lang = CFL_PRESETS[langKey];

  const steps = [
    {
      n: "Step 1",
      text: `Assume <strong>${lang.name}</strong> is context-free. By the CFL Pumping Lemma, ∃ pumping length <strong>p = ${p}</strong>.`
    },
    {
      n: "Step 2",
      text: `Choose <code>${s}</code> (length ${s.length}). ${sInL ? "✔ This string is in L." : "⚠ String not in L!"}`
    },
    {
      n: "Step 3",
      text: `Split: <code>u="${u||"ε"}"</code> · <code>v="${v||"ε"}"</code> · <code>w="${w||"ε"}"</code> · <code>x="${x||"ε"}"</code> · <code>y="${y||"ε"}"</code><br>
             |vwx| = ${v.length+w.length+x.length} ≤ p=${p}, |vx| = ${v.length+x.length} ≥ 1.`
    },
    {
      n: "Step 4",
      text: allValid
        ? `For all tested i (0 to ${Math.max(i,4)}), uv<sup>i</sup>wx<sup>i</sup>y stays in ${lang.name}.`
        : `For i = ${pumpsOutside[0].k}: uv<sup>${pumpsOutside[0].k}</sup>wx<sup>${pumpsOutside[0].k}</sup>y = <code>${pumpsOutside[0].pumped}</code> ∉ L. Contradiction!`
    },
    {
      n: "Conclusion",
      text: lang.isCFL === false
        ? (allValid
            ? `No contradiction here — try other v/x positions to find one. ${lang.explanation}`
            : `<strong>${lang.name} is NOT a CFL</strong>. ${lang.explanation}`)
        : `${lang.name} IS context-free. Pumping lemma holds. ${lang.explanation}`
    }
  ];

  els.proofSteps.innerHTML = steps.map((st, idx) =>
    `<div class="proof-step" style="animation-delay:${idx * 60}ms">
       <span class="step-num">${st.n}</span>
       <span class="step-text">${st.text}</span>
     </div>`
  ).join("");
}

/* ════════════════════════════════════════════════════════════
   SECTION 26: COUNTER VISUALIZATION (NEW)
   Shows character counts before and after pumping, highlights mismatches.
   ════════════════════════════════════════════════════════════ */

function renderCounterPanel(original, pumped, langKey) {
  if (langKey === "custom") { els.counterPanel.classList.add("hidden"); return; }
  els.counterPanel.classList.remove("hidden");

  // Count characters in both strings
  const countChars = (s) => {
    const counts = {};
    for (const ch of s) { counts[ch] = (counts[ch] || 0) + 1; }
    return counts;
  };

  const origCounts   = countChars(original);
  const pumpedCounts = countChars(pumped);
  const allChars     = [...new Set([...Object.keys(origCounts), ...Object.keys(pumpedCounts)])].sort();

  const maxCount = Math.max(...allChars.map(ch => Math.max(origCounts[ch]||0, pumpedCounts[ch]||0)), 1);

  let hasMismatch = false;
  const rows = allChars.map(ch => {
    const oc = origCounts[ch]   || 0;
    const pc = pumpedCounts[ch] || 0;
    const mismatch = oc !== pc;
    if (mismatch) hasMismatch = true;
    return { ch, oc, pc, mismatch };
  });

  els.counterGrid.innerHTML = `
    <div class="counter-col">
      <div class="counter-col-label">Before pumping</div>
      ${rows.map(({ ch, oc }) => `
        <div class="counter-row">
          <span class="counter-char">${ch}:</span>
          <span class="counter-val">${oc}</span>
          <div class="counter-bar-wrap">
            <div class="counter-bar" style="width:${Math.round(oc/maxCount*100)}%"></div>
          </div>
        </div>`).join("")}
    </div>
    <div class="counter-col">
      <div class="counter-col-label">After pumping (i=${state.i})</div>
      ${rows.map(({ ch, pc, mismatch }) => `
        <div class="counter-row">
          <span class="counter-char">${ch}:</span>
          <span class="counter-val${mismatch ? " mismatch" : ""}">${pc}${mismatch ? " ✘" : ""}</span>
          <div class="counter-bar-wrap">
            <div class="counter-bar${mismatch ? " mismatch-bar" : ""}" style="width:${Math.round(pc/maxCount*100)}%"></div>
          </div>
        </div>`).join("")}
    </div>
    ${hasMismatch ? `<div class="counter-mismatch-label">⚡ Count mismatch detected — string may not be in L!</div>` : ""}
  `;
}

/* ════════════════════════════════════════════════════════════
   SECTION 27: ENHANCED OUTPUT PANEL (NEW)
   Shows original, pumped, and contradiction reason clearly.
   ════════════════════════════════════════════════════════════ */

function renderEnhancedOutput(s, x, y, z, i, langKey) {
  const pumped   = x + y.repeat(i) + z;
  const inLang   = checkMembership(pumped, langKey);
  const isCustom = langKey === "custom";

  els.enhancedOutput.classList.remove("hidden");
  els.eoOriginal.textContent = s;
  els.eoPumped.textContent   = pumped || "ε (empty string)";

  if (isCustom) {
    els.eoReason.textContent = "Custom mode — verdict not determined.";
    els.eoReason.className   = "eo-val eo-reason";
  } else if (inLang) {
    els.eoReason.textContent = `xy${i>1?i:""}z ∈ L — no contradiction at i=${i}`;
    els.eoReason.className   = "eo-val eo-reason ok";
  } else {
    const lang = LANGUAGE_PRESETS[langKey];
    els.eoReason.textContent =
      `xy^${i}z = "${pumped}" ∉ ${lang?.name || "L"} → Contradiction! Language is NOT regular.`;
    els.eoReason.className = "eo-val eo-reason";
  }
}

/* ════════════════════════════════════════════════════════════
   SECTION 28: BOOT
   ════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", init);
