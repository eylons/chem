/* Save loading, migration from the v1 app, persistence, export/import.
   Rule: nothing in here may throw to the caller. Malformed data degrades to defaults. */
"use strict";
window.MQ = window.MQ || {};

(function (MQ) {
  var U = MQ.util, C = MQ.content;
  var S = {};

  S.KEY = "chem233-mechanism-quest-save-v2";
  S.LEGACY_KEY = "chem233-mechanism-quest-save-v1";
  S.BACKUP_KEY = "chem233-mechanism-quest-unreadable-backup";
  S.THEME_KEY = "chem233-mechanism-quest-theme";
  S.SAFE_FLAG = "mq-safe-mode";
  S.VERSION = 2;
  S.MAX_HEARTS = 3;

  S.defaultState = function () {
    return {
      format: "mechanism-quest-state", version: S.VERSION,
      xp: 0, hearts: S.MAX_HEARTS, heartsDate: null, streak: 0, lastStudyDate: null, studyDays: [],
      attempts: 0, correct: 0,
      mastery: {}, previewMastery: {}, spacedRepetition: {}, mistakes: {}, enemies: {}, repairQueue: [],
      achievements: [], achievementDates: {}, legacyAchievements: [],
      importedQuestions: [], packs: {},
      bossResults: [], examResults: [], runHistory: [], freeResponseScores: [],
      sessionCount: 0, questionStats: { mechanismCorrect: 0, stereoCorrect: 0, perfectRuns: 0, comebackSkills: 0 },
      activeRun: null, migratedFrom: null, createdAt: U.today()
    };
  };

  /* ---------- storage access (may be blocked entirely) ---------- */

  var memory = {};
  S.available = (function () {
    try {
      var k = "__mq_probe__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();

  S.get = function (key) {
    try { return S.available ? window.localStorage.getItem(key) : (key in memory ? memory[key] : null); }
    catch (e) { return null; }
  };
  S.set = function (key, value) {
    try {
      if (S.available) window.localStorage.setItem(key, value); else memory[key] = value;
      return true;
    } catch (e) { return false; }
  };
  S.remove = function (key) {
    try { if (S.available) window.localStorage.removeItem(key); else delete memory[key]; } catch (e) { /* ignore */ }
  };

  S.safeMode = (function () {
    // One-shot: the flag applies to this load only, so a normal reload loads the save again.
    try {
      var on = window.sessionStorage.getItem(S.SAFE_FLAG) === "1";
      if (on) window.sessionStorage.removeItem(S.SAFE_FLAG);
      return on;
    } catch (e) { return false; }
  })();

  /* ---------- normalization / migration ---------- */

  function objMap(src, fn) {
    var out = {};
    if (!U.isObj(src)) return out;
    Object.keys(src).forEach(function (k) {
      try { var v = fn(src[k], k); if (v !== undefined) out[k] = v; } catch (e) { /* drop entry */ }
    });
    return out;
  }
  function nonneg(v, d) { var n = U.num(v, d); return n < 0 ? d : n; }

  var LEGACY_ACH = {
    "first bond": "first-bond", "arrow sniper": "arrow-sniper", "mechanism machine": "mechanism-machine",
    "stereo survivor": "stereo-survivor", "three-day streak": "streak-3", "one-week practice": "streak-7",
    "boss challenger": "boss-challenger", "boss slayer": "boss-slayer", "no hint needed": "no-hint-needed",
    "perfect run": "perfect-run", "comeback chemist": "comeback-chemist"
  };

  // Accepts a v1 state, a v2 state, or an export wrapper. Returns {state, report}. Never throws.
  S.normalize = function (input, builtinIds) {
    var report = { source: "fresh", droppedQuestions: [], legacyAchievements: [], notes: [] };
    var st = S.defaultState();
    var raw = input;
    if (U.isObj(raw) && raw.format === "mechanism-quest-save" && U.isObj(raw.data)) raw = raw.data;
    if (!U.isObj(raw)) { report.notes.push("save was not an object"); return { state: st, report: report, failed: true }; }
    report.source = raw.version === 2 ? "v2" : "v1";
    var steps = [
      function () { st.xp = Math.round(nonneg(raw.xp, 0)); },
      function () { st.streak = Math.round(nonneg(raw.streak, 0)); },
      function () { if (U.isDateKey(raw.lastStudyDate)) st.lastStudyDate = raw.lastStudyDate; },
      function () { st.studyDays = Array.isArray(raw.studyDays) ? raw.studyDays.filter(U.isDateKey).slice(-120) : []; if (st.lastStudyDate && st.studyDays.indexOf(st.lastStudyDate) < 0) st.studyDays.push(st.lastStudyDate); },
      function () { st.hearts = U.clamp(Math.round(U.num(raw.hearts, S.MAX_HEARTS)), 0, S.MAX_HEARTS); st.heartsDate = U.isDateKey(raw.heartsDate) ? raw.heartsDate : st.lastStudyDate; },
      function () { st.attempts = Math.round(nonneg(raw.attempts, 0)); st.correct = Math.min(st.attempts, Math.round(nonneg(raw.correct, 0))); },
      function () { st.sessionCount = Math.round(nonneg(raw.sessionCount, 0)); },
      function () {
        var m = function (v) {
          if (!U.isObj(v)) return undefined;
          return { score: U.clamp(U.num(v.score, 0), 0, 100), attempts: Math.round(nonneg(v.attempts, 0)), correct: Math.round(nonneg(v.correct, 0)),
            lastSeen: U.isDateKey(v.lastSeen) ? v.lastSeen : null, wasWeak: v.wasWeak === true, weakSince: U.isDateKey(v.weakSince) ? v.weakSince : (v.wasWeak === true ? "2000-01-01" : null) };
        };
        st.mastery = objMap(raw.mastery, m);
        st.previewMastery = objMap(raw.previewMastery, m);
        // v1 kept a duplicate preview track; carry it over without letting it touch official mastery.
        if (U.isObj(raw.courseMastery) && U.isObj(raw.courseMastery.preview) && !Object.keys(st.previewMastery).length) st.previewMastery = objMap(raw.courseMastery.preview, m);
      },
      function () {
        st.spacedRepetition = objMap(raw.spacedRepetition, function (v) {
          if (!U.isObj(v)) return undefined;
          var lastResult = typeof v.lastResult === "string" ? v.lastResult : null;
          var reps = Math.round(nonneg(v.repetitions, 0));
          var score = U.num(v.score, NaN);
          if (!isFinite(score)) score = lastResult === "correct" ? Math.min(85, 45 + 12 * reps) : lastResult === "minor" ? 25 : lastResult ? 10 : 0;
          return { dueDate: U.isDateKey(v.dueDate) ? v.dueDate : null, interval: nonneg(v.interval, 1), repetitions: reps,
            lastResult: lastResult, lastConfidence: U.num(v.lastConfidence, 2), lastHints: U.num(v.lastHints, 0),
            lastSeen: U.isDateKey(v.lastSeen) ? v.lastSeen : null, score: U.clamp(score, 0, 100),
            attempts: Math.round(nonneg(v.attempts, lastResult ? 1 : 0)), correct: Math.round(nonneg(v.correct, lastResult === "correct" ? 1 : 0)) };
        });
      },
      function () {
        st.mistakes = objMap(raw.mistakes, function (v) {
          if (!U.isObj(v)) return undefined;
          return { count: Math.round(nonneg(v.count, 0)), lastQuestion: typeof v.lastQuestion === "string" ? v.lastQuestion : null, lastDate: U.isDateKey(v.lastDate) ? v.lastDate : null };
        });
      },
      function () {
        st.enemies = objMap(raw.enemies, function (v) {
          if (!U.isObj(v)) return undefined;
          return { misses: Math.round(nonneg(v.misses, 0)), winDays: Array.isArray(v.winDays) ? v.winDays.filter(U.isDateKey).slice(-10) : [],
            winsSinceMiss: Math.round(nonneg(v.winsSinceMiss, 0)), lastMiss: U.isDateKey(v.lastMiss) ? v.lastMiss : null,
            defeated: v.defeated === true, resurfaced: v.resurfaced === true };
        });
        // v1 had no enemies: rebuild them from the per-skill mistake log.
        if (!U.isObj(raw.enemies)) {
          Object.keys(st.mistakes).forEach(function (skill) {
            var e = C.enemyForSkill(skill);
            if (!e) return;
            var rec = st.enemies[e.id] || { misses: 0, winDays: [], winsSinceMiss: 0, lastMiss: null, defeated: false, resurfaced: false };
            rec.misses = Math.max(rec.misses, st.mistakes[skill].count);
            if (st.mistakes[skill].lastDate && (!rec.lastMiss || st.mistakes[skill].lastDate > rec.lastMiss)) rec.lastMiss = st.mistakes[skill].lastDate;
            st.enemies[e.id] = rec;
          });
        }
      },
      function () {
        st.repairQueue = Array.isArray(raw.repairQueue) ? raw.repairQueue.filter(function (r) { return U.isObj(r) && typeof r.id === "string" && U.isDateKey(r.due); }).slice(-60) : [];
      },
      function () {
        st.bossResults = Array.isArray(raw.bossResults) ? raw.bossResults.filter(U.isObj).map(function (r) {
          return { mode: "boss", label: String(r.label || "Boss"), bossId: typeof r.bossId === "string" ? r.bossId : null, date: U.isDateKey(r.date) ? r.date : null,
            correct: nonneg(r.correct, 0), total: nonneg(r.total, 0), percent: U.clamp(U.num(r.percent, 0), 0, 100),
            hintsUsed: Math.round(nonneg(r.hintsUsed, 0)), bestCombo: Math.round(nonneg(r.bestCombo, 0)) };
        }).slice(-50) : [];
      },
      function () { st.examResults = Array.isArray(raw.examResults) ? raw.examResults.filter(U.isObj).slice(-30) : []; },
      function () { st.runHistory = Array.isArray(raw.runHistory) ? raw.runHistory.filter(U.isObj).slice(-40) : []; },
      function () { st.freeResponseScores = Array.isArray(raw.freeResponseScores) ? raw.freeResponseScores.filter(U.isObj).slice(-300) : []; },
      function () {
        var qs = U.isObj(raw.questionStats) ? raw.questionStats : {};
        st.questionStats = { mechanismCorrect: Math.round(nonneg(qs.mechanismCorrect, 0)), stereoCorrect: Math.round(nonneg(qs.stereoCorrect, 0)), perfectRuns: Math.round(nonneg(qs.perfectRuns, 0)), comebackSkills: Math.round(nonneg(qs.comebackSkills, 0)) };
      },
      function () {
        var seen = {};
        (builtinIds || []).forEach(function (id) { seen[id] = true; });
        var list = Array.isArray(raw.importedQuestions) ? raw.importedQuestions : [];
        list.forEach(function (q) {
          var r = C.validateQuestion(q, null);
          if (!r.question) { report.droppedQuestions.push(r.error); return; }
          if (seen[r.question.id]) { report.droppedQuestions.push(r.question.id + ": duplicate id"); return; }
          seen[r.question.id] = true;
          st.importedQuestions.push(r.question);
        });
        st.packs = objMap(raw.packs, function (v) { return U.isObj(v) ? { title: String(v.title || ""), scope: String(v.scope || ""), count: nonneg(v.count, 0), importedAt: String(v.importedAt || "") } : undefined; });
      },
      function () {
        var dates = U.isObj(raw.achievementDates) ? raw.achievementDates : {};
        var list = Array.isArray(raw.achievements) ? raw.achievements.filter(function (a) { return typeof a === "string"; }) : [];
        var legacy = Array.isArray(raw.legacyAchievements) ? raw.legacyAchievements.filter(function (a) { return typeof a === "string"; }) : [];
        list.forEach(function (name) {
          var id = MQ.engine && MQ.engine.ACH_BY_ID[name] ? name : LEGACY_ACH[String(name).toLowerCase()];
          if (id && MQ.engine && MQ.engine.verifyAchievement(id, st)) {
            if (st.achievements.indexOf(id) < 0) st.achievements.push(id);
            st.achievementDates[id] = typeof dates[id] === "string" ? dates[id] : (st.achievementDates[id] || "migrated");
          } else if (legacy.indexOf(name) < 0) legacy.push(name);
        });
        st.legacyAchievements = legacy;
        report.legacyAchievements = legacy.slice();
      },
      function () { st.activeRun = U.isObj(raw.activeRun) && Array.isArray(raw.activeRun.queue) ? raw.activeRun : null; },
      function () { st.migratedFrom = raw.version === 2 ? (raw.migratedFrom || null) : "v1:" + U.today(); st.createdAt = U.isDateKey(raw.createdAt) ? raw.createdAt : st.createdAt; }
    ];
    steps.forEach(function (fn, i) {
      try { fn(); } catch (e) { report.notes.push("field group " + i + " reset: " + (e && e.message)); }
    });
    return { state: st, report: report, failed: false };
  };

  /* ---------- load / save ---------- */

  // Returns {state, warning, report}. Never throws.
  S.load = function (builtinIds) {
    if (S.safeMode) return { state: S.defaultState(), warning: "Safe mode: started without loading your save. Nothing will be saved until you import a backup or reload normally.", report: null };
    if (!S.available) return { state: S.defaultState(), warning: "Browser storage is unavailable (private mode or blocked). Progress will last only for this tab. Use Export Save to keep it.", report: null };
    var raw = S.get(S.KEY), parsed = null;
    if (raw) {
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
      if (U.isObj(parsed)) {
        var r = S.normalize(parsed, builtinIds);
        return { state: r.state, warning: r.report.notes.length ? "Some saved fields were unreadable and were reset: " + r.report.notes.join("; ") : null, report: r.report };
      }
      S.set(S.BACKUP_KEY, raw);
      var legacyFallback = S.loadLegacy(builtinIds);
      legacyFallback.warning = "Your current save could not be read. A raw copy was kept (Data → Download unreadable backup). " + (legacyFallback.state.migratedFrom ? "Restored from the older v1 save instead." : "Starting fresh.");
      return legacyFallback;
    }
    return S.loadLegacy(builtinIds);
  };

  S.loadLegacy = function (builtinIds) {
    var raw = S.get(S.LEGACY_KEY);
    if (!raw) return { state: S.defaultState(), warning: null, report: null };
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    if (!U.isObj(parsed)) {
      return { state: S.defaultState(), warning: "Your save from the previous version could not be migrated (it is not valid JSON). It was left untouched. You can import a JSON backup from Data.", report: null };
    }
    var r = S.normalize(parsed, builtinIds);
    if (r.failed) return { state: S.defaultState(), warning: "Your previous save could not be migrated. It was left untouched. You can import a JSON backup from Data.", report: r.report };
    var msg = "Migrated your previous save: " + r.state.xp + " XP, " + r.state.importedQuestions.length + " imported questions, " + Object.keys(r.state.spacedRepetition).length + " review records.";
    if (r.report.droppedQuestions.length) msg += " " + r.report.droppedQuestions.length + " invalid imported question(s) skipped.";
    if (r.report.legacyAchievements.length) msg += " " + r.report.legacyAchievements.length + " old achievement(s) could not be verified and were archived.";
    return { state: r.state, warning: null, info: msg, report: r.report, migrated: true };
  };

  function replacer(key, value) { return key.charAt(0) === "_" ? undefined : value; }
  S.serialize = function (state) { return JSON.stringify(state, replacer); };

  // Returns true if persisted.
  S.save = function (state) {
    if (S.safeMode) return false;
    var text;
    try { text = S.serialize(state); } catch (e) { return false; }
    return S.set(S.KEY, text);
  };

  S.exportPayload = function (state) {
    return JSON.stringify({ format: "mechanism-quest-save", version: S.VERSION, exportedAt: new Date().toISOString(), data: JSON.parse(S.serialize(state)) }, null, 2);
  };

  S.download = function (filename, text) {
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  };

  // Parse a save file the user picked. Returns {ok, state, report} or {ok:false, error}.
  S.parseSaveFile = function (parsed, builtinIds) {
    if (!U.isObj(parsed)) return { ok: false, error: "File is not a JSON object." };
    if (parsed.format === "mechanism-quest-content-pack") return { ok: false, error: "This is a content pack. Use Import Content Pack instead." };
    var looksLikeSave = parsed.format === "mechanism-quest-save" || parsed.format === "mechanism-quest-state" || ("xp" in parsed && ("mastery" in parsed || "spacedRepetition" in parsed));
    if (!looksLikeSave) return { ok: false, error: "This file is not a Mechanism Quest save." };
    var r = S.normalize(parsed, builtinIds);
    if (r.failed) return { ok: false, error: "Save could not be read." };
    return { ok: true, state: r.state, report: r.report };
  };

  MQ.storage = S;
})(window.MQ);
