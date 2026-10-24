/* Game rules: question bank, mastery, spaced repetition, enemies, XP, runs, readiness.
   No DOM access. Operates on E.state (set by E.init). */
"use strict";
window.MQ = window.MQ || {};

(function (MQ) {
  var U = MQ.util, C = MQ.content;
  var E = {};
  E.state = null;
  E.bank = [];
  E.byId = {};

  /* ---------- bank ---------- */

  E.init = function (state) {
    E.state = state;
    E.rebuildBank();
    E.dayRollover();
  };

  E.builtinIds = function () {
    return (MQ.BUILTIN_QUESTIONS || []).map(function (q) { return q.id; });
  };

  E.rebuildBank = function () {
    var list = [], byId = {};
    (MQ.BUILTIN_QUESTIONS || []).concat(E.state.importedQuestions || []).forEach(function (raw) {
      if (!raw || byId[raw.id]) return;
      var r = raw._valid ? { question: raw } : C.validateQuestion(raw, null);
      if (!r.question) return;
      r.question._valid = true;
      list.push(r.question);
      byId[r.question.id] = r.question;
    });
    E.bank = list;
    E.byId = byId;
  };

  E.q = function (id) { return E.byId[id] || null; };
  E.official = function () { return E.bank.filter(C.isOfficial); };
  E.currentPool = function () { return E.bank.filter(C.isCurrentMT2); };
  E.mt1Pool = function () { return E.bank.filter(C.isMT1); };
  E.previewPool = function () { return E.bank.filter(C.isPreview); };
  E.hasCurrent = function () { return E.bank.some(C.isCurrentMT2); };

  // Imports validated pack questions. Duplicates are skipped, never overwritten.
  E.importPack = function (parsedPack) {
    var added = [], dupes = [];
    var batch = {};
    parsedPack.questions.forEach(function (q) {
      if (E.byId[q.id] || batch[q.id]) { dupes.push(q.id); return; }
      batch[q.id] = true;
      added.push(q);
    });
    added.forEach(function (q) { E.state.importedQuestions.push(q); });
    var meta = parsedPack.packMeta;
    var prev = E.state.packs[meta.id];
    E.state.packs[meta.id] = { title: meta.title, scope: meta.scope, count: (prev ? prev.count : 0) + added.length, importedAt: U.today() };
    E.rebuildBank();
    return { added: added.length, duplicates: dupes, invalid: parsedPack.invalid };
  };

  /* ---------- days, hearts, streak ---------- */

  E.dayRollover = function () {
    var st = E.state, today = U.today();
    if (st.heartsDate !== today) { st.hearts = MQ.storage.MAX_HEARTS; st.heartsDate = today; }
    if (st.lastStudyDate && st.lastStudyDate !== today && st.lastStudyDate !== U.addDays(today, -1)) st.streak = 0;
  };

  E.markStudied = function () {
    var st = E.state, today = U.today();
    if (st.lastStudyDate === today) return;
    st.streak = st.lastStudyDate === U.addDays(today, -1) ? st.streak + 1 : 1;
    st.lastStudyDate = today;
    if (st.studyDays.indexOf(today) < 0) st.studyDays.push(today);
    st.studyDays = st.studyDays.slice(-120);
  };

  E.level = function (xp) { return Math.floor((xp || 0) / 100) + 1; };
  E.levelProgress = function (xp) { return (xp || 0) % 100; };
  E.TITLES = ["Apprentice", "Bench Chemist", "Arrow Pusher", "Mechanist", "Stereo Analyst", "Synthesis Strategist", "Reaction Architect", "Principal Investigator"];
  E.title = function (level) { return E.TITLES[Math.min(E.TITLES.length - 1, Math.floor((level - 1) / 2))]; };

  /* ---------- mastery & readiness ---------- */

  E.sr = function (id) { return E.state.spacedRepetition[id] || null; };

  E.strength = function (q) {
    var sr = E.sr(q.id);
    if (!sr || !sr.attempts) return 0;
    var s = sr.score || 0, today = U.today();
    if (sr.dueDate && sr.dueDate < today) s *= Math.max(0.6, 1 - 0.02 * U.daysBetween(sr.dueDate, today));
    return s;
  };

  E.readiness = function (list) {
    if (!list.length) return null;
    var num = 0, den = 0;
    list.forEach(function (q) {
      var w = q.drill ? 0.15 : (C.isProduction(q) ? 1.5 : 1);
      num += w * E.strength(q); den += w;
    });
    return den ? Math.round(num / den) : 0;
  };
  E.mt2Readiness = function () { return E.readiness(E.currentPool()); };
  E.finalReadiness = function () { return E.readiness(E.official()); };

  E.topicScore = function (key, preview) {
    var rec = (preview ? E.state.previewMastery : E.state.mastery)[key];
    return rec ? Math.round(rec.score) : 0;
  };

  E.topics = function (list, preview) {
    var seen = {}, out = [];
    list.forEach(function (q) {
      if (seen[q.topic]) return;
      seen[q.topic] = true;
      var rec = (preview ? E.state.previewMastery : E.state.mastery)[q.topic];
      out.push({ topic: q.topic, score: rec ? Math.round(rec.score) : 0, attempts: rec ? rec.attempts : 0 });
    });
    return out;
  };

  E.dueCount = function (list) {
    var today = U.today();
    return list.filter(function (q) { var sr = E.sr(q.id); return sr && sr.dueDate && sr.dueDate <= today; }).length;
  };

  /* ---------- regions ---------- */

  E.regions = function () {
    var dyn = {};
    E.bank.forEach(function (q) {
      C.regionIdsFor(q).forEach(function (id) { if (id.indexOf("dyn:") === 0) dyn[id] = true; });
    });
    var defs = C.REGIONS.concat(Object.keys(dyn).map(function (id) {
      var name = id.slice(4);
      return { id: id, name: name, sub: "Imported unit", boss: name + " Guardian", bossSkill: name, dynamic: true };
    }));
    return defs.map(function (def) {
      var qs = E.bank.filter(function (q) { return C.regionIdsFor(q).indexOf(def.id) >= 0; });
      var official = qs.filter(C.isOfficial), preview = qs.filter(C.isPreview);
      var status = official.length ? "confirmed" : (preview.length ? "preview" : "locked");
      var use = status === "confirmed" ? official : preview;
      var topics = E.topics(use, status === "preview").filter(function (t) { return t.attempts > 0; }).sort(function (a, b) { return a.score - b.score; });
      return {
        def: def, status: status, questions: use, officialCount: official.length, previewCount: preview.length,
        mastery: use.length ? E.readiness(use) : 0,
        attempted: use.filter(function (q) { var sr = E.sr(q.id); return sr && sr.attempts > 0; }).length,
        weakTopics: topics.slice(0, 2),
        bossBeaten: E.state.bossResults.some(function (r) { return r.bossId === def.id && r.percent >= 80; }),
        bossTried: E.state.bossResults.some(function (r) { return r.bossId === def.id; })
      };
    });
  };

  /* ---------- enemies ---------- */

  E.enemyStatus = function (rec) {
    if (!rec || !rec.misses) return "UNSEEN";
    if (rec.defeated) return "DEFEATED";
    if (rec.resurfaced) return "RESURFACED";
    if (rec.winsSinceMiss > 0) return "WEAKENED";
    return "ACTIVE";
  };

  E.enemyList = function () {
    var order = { RESURFACED: 0, ACTIVE: 1, WEAKENED: 2, DEFEATED: 3 };
    return Object.keys(E.state.enemies).map(function (id) {
      var def = C.enemyById(id);
      var rec = E.state.enemies[id];
      return def && rec.misses ? { def: def, rec: rec, status: E.enemyStatus(rec) } : null;
    }).filter(Boolean).sort(function (a, b) {
      return (order[a.status] - order[b.status]) || (b.rec.misses - a.rec.misses);
    });
  };

  E.topEnemy = function () {
    return E.enemyList().filter(function (e) { return e.status !== "DEFEATED"; })[0] || null;
  };

  /* ---------- selection ---------- */

  E.priority = function (q, opts) {
    opts = opts || {};
    var st = E.state, today = U.today(), sr = E.sr(q.id), p = 0;
    if (sr && sr.dueDate && sr.dueDate <= today) p += 400 + Math.min(30, U.daysBetween(sr.dueDate, today)) * 5;
    if (st.repairQueue.some(function (r) { return r.id === q.id && r.due <= today; })) p += 350;
    if (!sr || !sr.attempts) p += C.isCurrentMT2(q) ? 120 : 60;
    if (sr && sr.lastSeen === today) p -= 600;
    var enemy = st.enemies[C.enemyFor(q).id];
    if (enemy && enemy.misses && !enemy.defeated) p += Math.min(5, enemy.misses) * (opts.weakness ? 60 : 25);
    if (sr && sr.lastResult === "correct" && sr.lastConfidence === 1) p += 150;
    if (sr && sr.lastHints >= 2) p += 100;
    p += (100 - E.topicScore(q.topic, C.isPreview(q))) * (opts.weakness ? 1.6 : 0.8);
    if (q.drill) p -= 150;
    if (C.isCurrentMT2(q)) p += 30;
    return p + Math.random() * 40;
  };

  function ranked(list, opts) {
    return list.map(function (q) { return { q: q, p: E.priority(q, opts) }; })
      .sort(function (a, b) { return b.p - a.p; })
      .map(function (x) { return x.q; });
  }

  function Picker(opts) {
    this.opts = opts || {};
    this.chosen = [];
    this.ids = {};
    this.topicCount = {};
  }
  Picker.prototype.ok = function (q) {
    return !this.ids[q.id] && (this.topicCount[q.topic] || 0) < (this.opts.perTopic || 2);
  };
  Picker.prototype.add = function (q, enc, extra) {
    this.ids[q.id] = true;
    this.topicCount[q.topic] = (this.topicCount[q.topic] || 0) + 1;
    var item = { id: q.id, enc: enc };
    if (extra) Object.keys(extra).forEach(function (k) { item[k] = extra[k]; });
    this.chosen.push(item);
    return item;
  };
  // Try each [pool, filter] stage in order; take the highest-priority acceptable question.
  Picker.prototype.pick = function (stages, enc, extra) {
    for (var i = 0; i < stages.length; i++) {
      var pool = stages[i][0], filter = stages[i][1] || function () { return true; };
      var self = this;
      var cands = ranked(pool.filter(function (q) { return self.ok(q) && filter(q); }), this.opts);
      if (cands.length) return this.add(cands[0], enc, extra);
    }
    return null;
  };

  var prod = C.isProduction;
  function hard(q) { return (q.difficulty || 1) >= 2; }
  function drawOrMech(q) { return q.type === "draw" && C.isMechanism(q); }

  E.ENC = {
    recall: { name: "Recall Cache", line: "A sealed cache of notes. Retrieve the rule from memory." },
    scan: { name: "Structure Scan", line: "Read the structure locally before you answer." },
    duel: { name: "Reaction Duel", line: "A reagent arrives. Classify it, then predict what it does." },
    forge: { name: "Mechanism Forge", line: "Paper out. Every arrow, every charge, every intermediate." },
    stereo: { name: "Stereo Trap", line: "Count the real stereocenters before you commit." },
    rematch: { name: "Enemy Rematch", line: "A familiar mistake returns in a new form." },
    elite: { name: "Elite Problem", line: "Elite encounter: no answer choices." },
    miniboss: { name: "Mini-Boss", line: "The hardest problem on today's path." },
    phase1: { name: "Boss · Phase I", line: "Recognition. Name the rule it is using against you." },
    phase2: { name: "Boss · Phase II", line: "Unfamiliar structures. Read before you react." },
    phase3: { name: "Boss · Phase III", line: "Production. Draw it, write it, defend it." },
    recovery: { name: "Recovery Room", line: "Scaffolded repair. Hints are free here." },
    exam: { name: "Exam", line: "" },
    drill: { name: "Training", line: "Focused practice." },
    preview: { name: "Preview Encounter", line: "Ahead of class. This does not affect confirmed readiness." }
  };

  function enforceProduction(picker, stagesFor, target) {
    // Swap choice questions for production ones until the production share reaches target.
    var guard = 0;
    while (guard++ < 20) {
      var items = picker.chosen;
      var prodCount = items.filter(function (it) { return prod(E.q(it.id)); }).length;
      if (prodCount >= Math.ceil(target * items.length)) return;
      var idx = -1;
      for (var i = items.length - 1; i >= 0; i--) {
        if (items[i].enc !== "recall" && !items[i].locked && !prod(E.q(items[i].id))) { idx = i; break; }
      }
      if (idx < 0) return;
      var old = items[idx];
      var oldQ = E.q(old.id);
      var stages = (stagesFor(old) || []).map(function (s) { return [s[0], function (q) { return prod(q) && (s[1] ? s[1](q) : true); }]; });
      picker.ids[old.id] = false;
      picker.topicCount[oldQ.topic] -= 1;
      var removed = items.splice(idx, 1)[0];
      var repl = picker.pick(stages, removed.enc);
      if (!repl) {
        picker.add(oldQ, removed.enc).locked = true; // nothing better; keep it
        items.splice(idx, 0, items.pop());
      } else {
        items.splice(idx, 0, items.pop());
      }
    }
  }

  function makeRun(mode, label, items, extra) {
    var run = {
      id: "run-" + Date.now(), mode: mode, label: label, queue: items, index: 0,
      startedAt: Date.now(), date: U.today(), answers: [], combo: 0, peakCombo: 0, hintsUsed: 0,
      wrong: 0, minor: 0, xpEarned: 0, insertedRepairs: 0, heartsLost: 0, comebacks: 0,
      masteryStart: {}, readinessStart: { mt2: E.mt2Readiness(), final: E.finalReadiness() },
      enemyEvents: [], achievementsUnlocked: [], phase: "question", cur: null
    };
    if (extra) Object.keys(extra).forEach(function (k) { run[k] = extra[k]; });
    items.forEach(function (it) {
      var q = E.q(it.id);
      if (q) C.masteryKeys(q).forEach(function (k) { run.masteryStart[k] = E.topicScore(k, C.isPreview(q)); });
    });
    return run;
  }

  // Build any run. Returns a run object or null when no questions are available.
  E.buildRun = function (mode, opts) {
    opts = opts || {};
    var current = E.currentPool(), mt1 = E.mt1Pool(), official = E.official();
    var hasCur = current.length > 0;
    var cur = hasCur ? current : mt1;
    var p, items;

    if (mode === "daily") {
      p = new Picker();
      var activeEnemies = E.enemyList().filter(function (e) { return e.status !== "DEFEATED"; }).map(function (e) { return e.def.id; });
      var repairIds = E.state.repairQueue.filter(function (r) { return r.due <= U.today(); }).map(function (r) { return r.id; });
      var isRematch = function (q) { return repairIds.indexOf(q.id) >= 0 || activeEnemies.indexOf(C.enemyFor(q).id) >= 0; };
      p.pick([[cur, function (q) { return (q.difficulty || 1) <= 2; }], [cur]], "recall");
      p.pick([[official, function (q) { return C.isVisual(q) && q.type !== "draw"; }], [official, C.isVisual], [cur]], "scan");
      p.pick([[cur, function (q) { return C.isProduct(q) && q.type === "text"; }], [cur, function (q) { return C.isProduct(q) && q.type !== "draw"; }], [cur, C.isProduct], [cur]], "duel");
      p.pick([[cur, drawOrMech], [cur, function (q) { return C.isMechanism(q) && prod(q); }], [official, drawOrMech], [cur]], "forge");
      p.pick([[cur, function (q) { return C.isStereo(q) && prod(q) && q.type !== "draw"; }], [cur, C.isStereo], [official, C.isStereo], [cur]], "stereo");
      p.pick([[official, function (q) { return repairIds.indexOf(q.id) >= 0; }], [official, isRematch], [mt1], [official]], "rematch");
      p.pick([[cur, function (q) { return prod(q) && hard(q) && q.type !== "draw"; }], [cur, function (q) { return prod(q) && hard(q); }], [cur, prod], [official, prod]], "elite");
      p.pick([[cur, function (q) { return prod(q) && (q.difficulty || 1) >= 3; }], [cur, function (q) { return prod(q) && hard(q); }], [official, prod], [official]], "miniboss");
      if (hasCur) balanceMT1(p, Math.max(1, Math.round(p.chosen.length * 0.2)), cur, mt1);
      enforceProduction(p, function (it) { return [[it.enc === "rematch" || it.enc === "scan" ? official : cur]]; }, 0.6);
      return p.chosen.length ? makeRun("daily", "Today's Run", p.chosen) : null;
    }

    if (mode === "quick") {
      p = new Picker();
      p.pick([[cur]], "recall");
      p.pick([[cur, function (q) { return C.isProduct(q) && q.type === "text"; }], [cur, function (q) { return C.isProduct(q) && prod(q); }], [cur]], "duel");
      p.pick([[cur, drawOrMech], [cur, prod], [cur]], "forge");
      p.pick([[cur, function (q) { return prod(q) && hard(q) && q.type !== "draw"; }], [cur, function (q) { return prod(q) && hard(q); }], [cur]], "elite");
      p.pick([[hasCur ? mt1 : cur, prod], [hasCur ? mt1 : cur], [official]], "rematch");
      enforceProduction(p, function (it) { return [[it.enc === "rematch" ? official : cur]]; }, 0.6);
      return p.chosen.length ? makeRun("quick", "Quick Run", p.chosen) : null;
    }

    var GRINDS = {
      mechanism: { label: "Mechanism Grind", enc: "forge", f: C.isMechanism },
      product: { label: "Product Grind", enc: "duel", f: C.isProduct },
      stereo: { label: "Stereo Grind", enc: "stereo", f: C.isStereo },
      visual: { label: "Visual Grind", enc: "scan", f: C.isVisual }
    };
    if (GRINDS[mode]) {
      var g = GRINDS[mode];
      p = new Picker();
      var nCur = hasCur ? 6 : 8;
      var i;
      for (i = 0; i < nCur; i++) p.pick([[cur, function (q) { return g.f(q) && prod(q); }], [cur, g.f]], i === nCur - 1 ? "elite" : g.enc);
      while (p.chosen.length < 8 && p.pick([[mt1, function (q) { return g.f(q) && prod(q); }], [mt1, g.f], [official, g.f]], g.enc)) { /* fill */ }
      enforceProduction(p, function () { return [[official, g.f]]; }, 0.6);
      return p.chosen.length ? makeRun(mode, g.label, p.chosen) : null;
    }

    if (mode === "weakness") {
      p = new Picker({ weakness: true });
      for (var w = 0; w < 8; w++) {
        if (!p.pick([[official, function (q) { var sr = E.sr(q.id); return !!(sr && sr.attempts); }], [official]], "rematch")) break;
      }
      enforceProduction(p, function (it) {
        var weakQ = E.q(it.id);
        var enemyId = C.enemyFor(weakQ).id;
        return [[official, function (q) { return C.enemyFor(q).id === enemyId || q.topic === weakQ.topic; }], [official]];
      }, 0.6);
      return p.chosen.length ? makeRun("weakness", "Weakness Hunt", p.chosen) : null;
    }

    if (mode === "ahead") {
      var pv = E.previewPool();
      if (opts.region) pv = pv.filter(function (q) { return C.regionIdsFor(q).indexOf(opts.region) >= 0; });
      p = new Picker();
      for (var a = 0; a < 8; a++) if (!p.pick([[pv, function (q) { return a % 3 !== 0 || prod(q); }], [pv]], "preview")) break;
      return p.chosen.length ? makeRun("ahead", "Ahead of Class", p.chosen, { preview: true, region: opts.region || null }) : null;
    }

    if (mode === "region") {
      var reg = E.regions().filter(function (r) { return r.def.id === opts.region; })[0];
      if (!reg || !reg.questions.length) return null;
      if (reg.status === "preview") return E.buildRun("ahead", { region: opts.region });
      p = new Picker();
      for (var r = 0; r < 8; r++) if (!p.pick([[reg.questions, function (q) { return r % 2 === 1 ? prod(q) : true; }], [reg.questions]], r === 7 ? "miniboss" : "drill")) break;
      enforceProduction(p, function () { return [[reg.questions]]; }, 0.6);
      return makeRun("region", reg.def.name, p.chosen, { region: opts.region });
    }

    if (mode === "boss") return buildBoss(opts.region);
    if (mode === "exam") return buildExam(opts);
    if (mode === "recovery") return buildRecovery(opts.parent);
    return null;
  };

  function balanceMT1(p, target, cur, mt1) {
    var isM = function (it) { return C.isMT1(E.q(it.id)); };
    var count = p.chosen.filter(isM).length;
    var guard = 0;
    while (count < target && guard++ < 6) {
      var idx = -1;
      ["recall", "scan", "stereo", "duel"].some(function (enc) {
        for (var i = 0; i < p.chosen.length; i++) if (p.chosen[i].enc === enc && !isM(p.chosen[i])) { idx = i; return true; }
        return false;
      });
      if (idx < 0) break;
      var old = p.chosen[idx], oldQ = E.q(old.id);
      var repl = ranked(mt1.filter(function (q) { return p.ok(q); }))[0];
      if (!repl) break;
      p.ids[old.id] = false; p.topicCount[oldQ.topic] -= 1;
      p.chosen.splice(idx, 1);
      p.add(repl, old.enc);
      p.chosen.splice(idx, 0, p.chosen.pop());
      count++;
    }
    guard = 0;
    while (count > target + 1 && guard++ < 6) {
      var j = -1;
      for (var k = 0; k < p.chosen.length; k++) if (isM(p.chosen[k]) && p.chosen[k].enc !== "rematch") { j = k; break; }
      if (j < 0) break;
      var o = p.chosen[j], oq = E.q(o.id);
      var rc = ranked(cur.filter(function (q) { return p.ok(q); }))[0];
      if (!rc) break;
      p.ids[o.id] = false; p.topicCount[oq.topic] -= 1;
      p.chosen.splice(j, 1);
      p.add(rc, o.enc);
      p.chosen.splice(j, 0, p.chosen.pop());
      count--;
    }
  }

  E.bossOptions = function () {
    return E.regions().filter(function (r) { return r.status === "confirmed" && r.questions.length >= 4; });
  };

  function buildBoss(regionId) {
    var options = E.bossOptions();
    var reg = options.filter(function (r) { return r.def.id === regionId; })[0];
    if (!reg) reg = options.sort(function (a, b) { return a.mastery - b.mastery; }).filter(function (r) { return r.def.id !== "foundation"; })[0] || options[0];
    if (!reg) return null;
    var R = reg.questions;
    var others = E.official().filter(function (q) { return R.indexOf(q) < 0; });
    var prereq = reg.def.id === "foundation" ? others : others.filter(C.isMT1);
    var p = new Picker({ perTopic: 3 });
    var today = U.today();
    var unfamiliar = function (q) { var sr = E.sr(q.id); return !sr || !sr.lastSeen || U.daysBetween(sr.lastSeen, today) >= 3; };
    var phases = [
      { enc: "phase1", stages: [[R, function (q) { return q.type === "choice" || (q.difficulty || 1) <= 1; }], [R]] },
      { enc: "phase2", stages: [[R, function (q) { return (C.isVisual(q) || C.isStereo(q) || C.isProduct(q)) && hard(q) && unfamiliar(q); }], [R, function (q) { return C.isVisual(q) || C.isStereo(q) || C.isProduct(q); }], [R]] },
      { enc: "phase3", stages: [[R, function (q) { return q.type === "draw"; }], [R, function (q) { return q.type === "text"; }], [R, prod], [R]] }
    ];
    phases.forEach(function (ph, pi) {
      for (var i = 0; i < 3; i++) p.pick(pi === 2 && i === 1 ? [[R, function (q) { return q.type === "text"; }]].concat(ph.stages) : ph.stages, ph.enc, { phase: pi + 1 });
      // one cumulative prerequisite per phase
      var fit = [function (q) { return q.type === "choice"; }, function (q) { return C.isVisual(q) || C.isStereo(q); }, prod][pi];
      p.pick([[prereq, fit], [prereq], [others, fit], [others], [R]], ph.enc, { phase: pi + 1, cumulative: true });
    });
    var items = p.chosen;
    // Guarantee at least one draw, one text and one structure/stereo/product question if supply allows.
    [function (q) { return q.type === "draw"; }, function (q) { return q.type === "text"; }, function (q) { return C.isStereo(q) || C.isVisual(q) || C.isProduct(q); }].forEach(function (need) {
      if (items.some(function (it) { return need(E.q(it.id)); })) return;
      var cand = ranked(R.concat(others).filter(function (q) { return p.ok(q) && need(q); }))[0];
      if (!cand) return;
      for (var i = items.length - 1; i >= 0; i--) {
        if (items[i].phase === 3 || i === items.length - 1) {
          var old = items[i];
          p.ids[old.id] = false;
          items.splice(i, 1);
          p.add(cand, old.enc, { phase: old.phase });
          items.splice(i, 0, items.pop());
          return;
        }
      }
    });
    if (!items.length) return null;
    return makeRun("boss", reg.def.boss, items, { bossId: reg.def.id, bossName: reg.def.boss, bossSkill: reg.def.bossSkill, bossHp: 100 });
  }

  function buildExam(opts) {
    var n = U.clamp(Math.round(U.num(Number(opts.count), 15)), 5, 40);
    var scope = opts.scope === "final" ? "final" : "mt2";
    var current = E.currentPool(), mt1 = E.mt1Pool(), official = E.official();
    var p = new Picker({ perTopic: 2 });
    var nCur, i;
    // Keep written mechanisms to <= 40% so the paper resembles the real exam mix.
    var baseOk = p.ok;
    p.ok = function (q) {
      if (q.type === "draw" && p.chosen.filter(function (it) { return E.q(it.id).type === "draw"; }).length >= Math.floor(n * 0.4)) return false;
      return baseOk.call(p, q);
    };
    if (scope === "mt2" && current.length) {
      nCur = Math.round(n * 0.85);
      for (i = 0; i < nCur; i++) p.pick([[current, i % 2 === 0 ? prod : null], [current]], "exam");
    }
    while (p.chosen.length < n && p.pick([[scope === "mt2" && current.length ? mt1 : official, p.chosen.length % 2 === 0 ? prod : null], [official]], "exam")) { /* fill */ }
    if (p.chosen.length < n) { p.opts.perTopic = 99; while (p.chosen.length < n && p.pick([[official]], "exam")) { /* fill */ } }
    if (!p.chosen.length) return null;
    var order = { choice: 0, "select-atom": 1, rank: 1, text: 2, draw: 3 };
    var items = U.shuffle(p.chosen).sort(function (a, b) { return order[E.q(a.id).type] - order[E.q(b.id).type]; });
    var timer = U.clamp(Math.round(U.num(Number(opts.timerMinutes), 0)), 0, 240);
    return makeRun("exam", scope === "final" ? "Final Exam Simulation" : "Midterm 2 Simulation", items, {
      exam: { scope: scope, timerMinutes: timer, deadline: timer ? Date.now() + timer * 60000 : null, finished: false }
    });
  }

  function buildRecovery(parent) {
    var missed = (parent && parent.answers || []).filter(function (a) { return a.result !== "correct"; }).map(function (a) { return E.q(a.id); }).filter(Boolean);
    var preview = !!(parent && parent.preview);
    var pool = preview ? E.previewPool() : E.official();
    var used = {};
    (parent ? parent.queue : []).forEach(function (it) { used[it.id] = true; });
    var enemyIds = missed.map(function (q) { return C.enemyFor(q).id; });
    var skills = {};
    missed.forEach(function (q) { C.masteryKeys(q).forEach(function (k) { skills[k] = true; }); });
    var related = function (q) {
      if (used[q.id]) return false;
      return enemyIds.indexOf(C.enemyFor(q).id) >= 0 || C.masteryKeys(q).some(function (k) { return skills[k]; });
    };
    var p = new Picker({ perTopic: 2 });
    var easy = function (q) { return (q.difficulty || 1) <= 2 && related(q); };
    for (var i = 0; i < 3; i++) p.pick([[pool, function (q) { return easy(q) && q.type !== "draw"; }], [pool, easy], [pool, related], [pool, function (q) { return !used[q.id] && (q.difficulty || 1) <= 1; }]], "recovery");
    if (!p.chosen.length) return null;
    return makeRun("recovery", "Recovery Room", p.chosen, { preview: preview });
  }

  /* ---------- recording answers ---------- */

  E.baseXP = function (q) {
    return 10 + 2 * ((q.difficulty || 1) - 1) + (prod(q) ? 4 : 0) + (q.type === "draw" ? 2 : 0);
  };
  E.hintCost = function (n) {
    var c = 0;
    for (var i = 0; i < n && i < C.HINT_COST.length; i++) c += C.HINT_COST[i];
    return c;
  };
  E.potentialXP = function (q, hints, mode) {
    var base = E.baseXP(q);
    if (mode === "recovery") return Math.round(base / 2);
    return Math.max(0, base - E.hintCost(hints));
  };

  var CONF_W = { 1: 0.4, 2: 0.75, 3: 1 };
  var HINT_W = [1, 0.75, 0.55, 0.35];

  function bumpMastery(table, key, result, w) {
    var rec = table[key] || { score: 0, attempts: 0, correct: 0, lastSeen: null, wasWeak: false };
    var before = rec.score;
    var s = rec.score;
    var today = U.today();
    // Same-day repetition is weaker evidence than spaced retrieval.
    if (rec.lastSeen === today) w *= 0.5;
    if (result === "correct") s = s + (100 - s) * 0.3 * w;
    else if (result === "minor") s = s + (55 - s) * 0.2;
    else if (result === "stuck") s = s * 0.6;
    else s = s * 0.7;
    rec.score = U.clamp(Math.round(s * 10) / 10, 0, 100);
    rec.attempts += 1;
    if (result === "correct") rec.correct += 1;
    rec.lastSeen = today;
    var comeback = false;
    if (rec.attempts >= 2 && rec.score < 40 && result !== "correct" && !rec.wasWeak) { rec.wasWeak = true; rec.weakSince = today; }
    // Comeback only counts when the weakness was recorded on an earlier day.
    if (rec.wasWeak && rec.weakSince && rec.weakSince < today && before < 60 && rec.score >= 60) { rec.wasWeak = false; rec.weakSince = null; comeback = true; }
    table[key] = rec;
    return { key: key, before: Math.round(before), after: Math.round(rec.score), comeback: comeback };
  }

  var INTERVALS = [1, 3, 7, 14, 30];
  function updateSR(q, result, confidence, hints) {
    var st = E.state, today = U.today();
    var sr = st.spacedRepetition[q.id] || { dueDate: null, interval: 0, repetitions: 0, lastResult: null, lastConfidence: 2, lastHints: 0, lastSeen: null, score: 0, attempts: 0, correct: 0 };
    var w = (CONF_W[confidence] || 0.75) * HINT_W[Math.min(3, hints)];
    var interval;
    if (result === "correct") {
      sr.repetitions += 1;
      interval = INTERVALS[Math.min(sr.repetitions - 1, INTERVALS.length - 1)];
      if (confidence === 1) interval = Math.max(1, Math.round(interval * 0.5));
      if (hints === 1) interval = Math.max(1, Math.round(interval * 0.75));
      if (hints === 2) interval = Math.max(1, Math.round(interval * 0.5));
      if (hints >= 3) interval = 1;
      sr.score = sr.score + (100 - sr.score) * 0.5 * w;
      sr.correct += 1;
    } else if (result === "minor") {
      sr.repetitions = Math.max(0, sr.repetitions - 1);
      interval = 2;
      sr.score = Math.max(sr.score * 0.8, 20);
    } else {
      sr.repetitions = 0;
      interval = 1;
      sr.score = sr.score * (result === "stuck" ? 0.3 : 0.4);
    }
    sr.score = Math.round(U.clamp(sr.score, 0, 100) * 10) / 10;
    sr.interval = interval;
    sr.dueDate = U.addDays(today, interval);
    sr.lastResult = result === "wrong" ? "major" : result;
    sr.lastConfidence = confidence;
    sr.lastHints = hints;
    sr.lastSeen = today;
    sr.attempts += 1;
    st.spacedRepetition[q.id] = sr;
    return sr;
  }

  E.relatedQuestion = function (q, excludeIds) {
    var pool = C.isPreview(q) ? E.previewPool() : E.official();
    var enemyId = C.enemyFor(q).id;
    var keys = C.masteryKeys(q);
    var today = U.today();
    var cands = pool.filter(function (x) {
      if (x.id === q.id || (excludeIds && excludeIds[x.id])) return false;
      var sr = E.sr(x.id);
      if (sr && sr.lastSeen === today) return false;
      return x.topic === q.topic || C.enemyFor(x).id === enemyId || C.masteryKeys(x).filter(function (k) { return keys.indexOf(k) >= 0; }).length >= 1;
    });
    return ranked(cands)[0] || null;
  };

  // outcome: {result: correct|minor|major|stuck|wrong, confidence 1-3, hints n, supplied, override}
  // Returns a feedback object. Exam answers are recorded only at the end (E.finalizeExam).
  E.recordAnswer = function (run, q, outcome) {
    var st = E.state, today = U.today();
    var result = outcome.result;
    var correct = result === "correct";
    var bad = result === "major" || result === "stuck" || result === "wrong";
    var hints = outcome.hints || 0;
    var confidence = outcome.confidence || 2;
    var preview = C.isPreview(q);
    var isExam = run.mode === "exam";
    var isRecovery = run.mode === "recovery";
    var fb = { result: result, xp: 0, bonus: [], masteryDeltas: [], enemy: null, enemyEvent: null, repair: null, heartLost: false, combo: run.combo };

    E.markStudied();
    st.attempts += 1;
    if (correct) st.correct += 1;
    if (q.type === "text" || q.type === "draw") {
      st.freeResponseScores.push({ questionId: q.id, score: correct ? 1 : result === "minor" ? 0.5 : 0, confidence: confidence, date: today });
      st.freeResponseScores = st.freeResponseScores.slice(-300);
    }

    // XP
    var xp = 0;
    if (correct) xp = isRecovery ? Math.round(E.baseXP(q) / 2) : E.potentialXP(q, hints, run.mode);
    else if (result === "minor") xp = Math.max(0, Math.round(E.baseXP(q) * 0.4) - (isRecovery ? 0 : E.hintCost(hints)));
    if (outcome.override) xp = Math.round(xp * 0.7);

    // Combo
    if (!isExam) {
      if (correct && hints === 0) {
        run.combo += 1;
        run.peakCombo = Math.max(run.peakCombo, run.combo);
        if (run.combo >= 2) { var cb = Math.min(run.combo - 1, 5) * 2; xp += cb; fb.bonus.push("COMBO x" + run.combo + " +" + cb); }
      } else if (!correct) {
        if (run.combo >= 2) fb.comboBroken = run.combo;
        run.combo = 0;
      }
      fb.combo = run.combo;
    }

    // Mastery (preview never touches official mastery)
    var w = (CONF_W[confidence] || 0.75) * HINT_W[Math.min(3, hints)] * (isExam ? 1.2 : 1) * (outcome.override ? 0.7 : 1);
    w = Math.min(1, w);
    var table = preview ? st.previewMastery : st.mastery;
    C.masteryKeys(q).forEach(function (k) {
      var d = bumpMastery(table, k, result, w);
      fb.masteryDeltas.push(d);
      if (d.comeback && !preview) { st.questionStats.comebackSkills += 1; fb.bonus.push("COMEBACK CHEMIST: " + k + " is now RELIABLE"); }
    });

    updateSR(q, result, confidence, hints);

    // Stats for achievements
    if (correct) {
      if (C.isMechanism(q) && prod(q)) st.questionStats.mechanismCorrect += 1;
      if (C.isStereo(q)) st.questionStats.stereoCorrect += 1;
    }

    // Enemies (official material only)
    var enemyDef = C.enemyFor(q);
    fb.enemy = { id: enemyDef.id, name: enemyDef.name, skill: enemyDef.skill, rule: enemyDef.rule };
    if (!preview) {
      var rec = st.enemies[enemyDef.id];
      if (bad) {
        rec = rec || { misses: 0, winDays: [], winsSinceMiss: 0, lastMiss: null, defeated: false, resurfaced: false };
        var wasDefeated = rec.defeated;
        rec.misses += 1; rec.lastMiss = today; rec.winsSinceMiss = 0; rec.winDays = [];
        if (wasDefeated) { rec.defeated = false; rec.resurfaced = true; }
        st.enemies[enemyDef.id] = rec;
        fb.enemyEvent = wasDefeated ? "RESURFACED" : (rec.misses === 1 ? "NEW ENEMY" : "STRENGTHENED");
        q.skills.forEach(function (skill) {
          var m = st.mistakes[skill] || { count: 0, lastQuestion: null, lastDate: null };
          m.count += 1; m.lastQuestion = q.id; m.lastDate = today;
          st.mistakes[skill] = m;
        });
      } else if (correct && rec && rec.misses && !rec.defeated && hints <= 1) {
        var first = rec.winsSinceMiss === 0;
        rec.winsSinceMiss += 1;
        if (rec.winDays.indexOf(today) < 0) rec.winDays.push(today);
        if (rec.winsSinceMiss >= 3 && rec.winDays.length >= 2) { rec.defeated = true; rec.resurfaced = false; fb.enemyEvent = "DEFEATED"; }
        else fb.enemyEvent = "WEAKENED";
        if (first && !isExam) { xp += 5; run.comebacks += 1; fb.bonus.push("COMEBACK +5"); }
      }
      if (fb.enemyEvent) run.enemyEvents.push({ id: enemyDef.id, event: fb.enemyEvent });
    }

    // Near-transfer repair for later + optional in-run rematch
    if (bad || result === "minor") {
      var exclude = {};
      run.queue.forEach(function (it) { exclude[it.id] = true; });
      var rel = E.relatedQuestion(q, exclude);
      if (rel) {
        st.repairQueue = st.repairQueue.filter(function (r) { return r.id !== rel.id; });
        st.repairQueue.push({ id: rel.id, due: U.addDays(today, 1), fromId: q.id });
        st.repairQueue = st.repairQueue.slice(-60);
        fb.repair = { id: rel.id, topic: rel.topic, when: "tomorrow" };
        if (!isExam && !isRecovery && run.mode !== "boss" && run.insertedRepairs < 2 && bad) {
          var rel2 = E.relatedQuestion(q, (function () { var x = {}; Object.keys(exclude).forEach(function (k) { x[k] = true; }); x[rel.id] = true; return x; })());
          if (rel2) {
            run.queue.splice(Math.min(run.queue.length, run.index + 3), 0, { id: rel2.id, enc: "rematch", inserted: true });
            run.insertedRepairs += 1;
            fb.repair.inRun = rel2.topic;
          }
        }
      }
    }
    if (correct) st.repairQueue = st.repairQueue.filter(function (r) { return r.id !== q.id; });

    // Hearts
    if (!isExam && bad && !isRecovery) {
      if (st.hearts > 0) { st.hearts -= 1; fb.heartLost = true; run.heartsLost += 1; }
    }

    xp = Math.max(0, Math.round(xp));
    st.xp += xp;
    fb.xp = xp;
    run.xpEarned += xp;
    run.hintsUsed += hints;
    if (bad) run.wrong += 1;
    if (result === "minor") run.minor += 1;
    run.answers.push({ id: q.id, result: result, hints: hints, confidence: confidence, xp: xp, supplied: outcome.supplied || "" });

    if (run.mode === "boss") {
      var dmg = 100 / run.queue.length;
      if (correct) run.bossHp = Math.max(0, run.bossHp - dmg);
      else if (result === "minor") run.bossHp = Math.max(0, run.bossHp - dmg / 2);
      run.bossHp = Math.round(run.bossHp * 10) / 10;
      fb.bossHp = run.bossHp;
    }

    fb.achievements = E.checkAchievements(run);
    return fb;
  };

  /* ---------- run completion ---------- */

  E.runScore = function (run) {
    var n = run.answers.length;
    if (!n) return 0;
    var pts = run.answers.reduce(function (s, a) { return s + (a.result === "correct" ? 1 : a.result === "minor" ? 0.5 : 0); }, 0);
    return Math.round(pts / n * 100);
  };

  E.NORMAL_MODES = ["daily", "quick", "mechanism", "product", "stereo", "visual", "weakness", "region", "ahead"];

  E.finishRun = function (run) {
    var st = E.state;
    var summary = { score: E.runScore(run), answered: run.answers.length, xp: run.xpEarned, bonus: [] };
    var perfect = run.answers.length >= 5 && run.wrong === 0 && run.minor === 0 && run.hintsUsed === 0;
    if (E.NORMAL_MODES.indexOf(run.mode) >= 0 && perfect) {
      st.questionStats.perfectRuns += 1;
      st.xp += 25; summary.xp += 25; summary.bonus.push("PERFECT RUN +25");
    } else if (E.NORMAL_MODES.indexOf(run.mode) >= 0 && run.answers.length >= 5 && run.wrong === 0 && run.minor === 0) {
      st.xp += 10; summary.xp += 10; summary.bonus.push("CLEAN RUN +10 (hints used)");
    }
    if (run.mode === "boss") {
      var hp = Math.round(run.bossHp);
      summary.bossHp = hp;
      summary.bossDefeated = summary.score >= 80;
      st.bossResults.push({ mode: "boss", label: run.label, bossId: run.bossId, date: U.today(), correct: run.answers.filter(function (a) { return a.result === "correct"; }).length,
        total: run.answers.length, percent: summary.score, hintsUsed: run.hintsUsed, bestCombo: run.peakCombo });
      st.bossResults = st.bossResults.slice(-50);
    }
    st.sessionCount += 1;
    st.runHistory.push({ mode: run.mode, label: run.label, date: U.today(), score: summary.score, answered: run.answers.length, xp: summary.xp, peakCombo: run.peakCombo, hints: run.hintsUsed });
    st.runHistory = st.runHistory.slice(-40);

    var changes = [];
    Object.keys(run.masteryStart).forEach(function (k) {
      var q0 = null;
      for (var i = 0; i < run.queue.length; i++) { var qq = E.q(run.queue[i].id); if (qq && C.masteryKeys(qq).indexOf(k) >= 0) { q0 = qq; break; } }
      var now = E.topicScore(k, !!(q0 && C.isPreview(q0)));
      if (now !== run.masteryStart[k]) changes.push({ key: k, before: run.masteryStart[k], after: now });
    });
    var runTopics = {};
    run.queue.forEach(function (it) { var qq = E.q(it.id); if (qq) runTopics[qq.topic] = true; });
    var topicChanges = changes.filter(function (c) { return runTopics[c.key]; });
    if (topicChanges.length) changes = topicChanges;
    summary.masteryChanges = changes.sort(function (a, b) { return Math.abs(b.after - b.before) - Math.abs(a.after - a.before); }).slice(0, 4);
    var seenEnemy = {};
    summary.enemyEvents = run.enemyEvents.slice().reverse().filter(function (e) { if (seenEnemy[e.id]) return false; seenEnemy[e.id] = true; return true; }).map(function (e) {
      var rec = st.enemies[e.id];
      return { def: C.enemyById(e.id), event: e.event, status: E.enemyStatus(rec), rec: rec };
    }).filter(function (e) { return e.def; });
    summary.readiness = { mt2Before: run.readinessStart.mt2, mt2After: E.mt2Readiness(), finalBefore: run.readinessStart.final, finalAfter: E.finalReadiness() };
    var next = st.repairQueue.slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; })[0];
    var nq = next && E.q(next.id);
    var te = E.topEnemy();
    summary.nextThreat = nq ? { topic: nq.topic, due: next.due, enemy: C.enemyFor(nq) } : (te ? { topic: te.def.skill, due: null, enemy: te.def } : null);
    E.checkAchievements(run);
    summary.achievements = run.achievementsUnlocked.slice();
    summary.peakCombo = run.peakCombo;
    summary.hearts = st.hearts;
    summary.streak = st.streak;
    return summary;
  };

  /* ---------- exam ---------- */

  // grades: {qid: "correct"|"minor"|"major"|"stuck"|"wrong"|"unanswered"}
  E.finalizeExam = function (run, grades) {
    var cats = { mc: [0, 0], fr: [0, 0], draw: [0, 0], cur: [0, 0], cum: [0, 0] };
    var topicAcc = {};
    var review = [];
    var total = 0, pts = 0;
    run.queue.forEach(function (it) {
      var q = E.q(it.id);
      if (!q) return;
      var g = grades[q.id] || "unanswered";
      var v = g === "correct" ? 1 : g === "minor" ? 0.5 : 0;
      total += 1; pts += v;
      var cat = q.type === "choice" ? "mc" : q.type === "draw" ? "draw" : "fr";
      cats[cat][0] += v; cats[cat][1] += 1;
      var cc = C.isCurrentMT2(q) ? "cur" : "cum";
      cats[cc][0] += v; cats[cc][1] += 1;
      var t = topicAcc[q.topic] || [0, 0];
      t[0] += v; t[1] += 1; topicAcc[q.topic] = t;
      if (v < 1) review.push({ id: q.id, grade: g });
      var ans = (run.examAnswers || {})[q.id] || {};
      if (g !== "unanswered") {
        E.recordAnswer(run, q, { result: g === "wrong" ? "wrong" : g, confidence: ans.confidence || 2, hints: 0, supplied: ans.supplied || "", override: ans.override });
      } else {
        updateSR(q, "stuck", 1, 0);
      }
    });
    function pct(a) { return a[1] ? Math.round(a[0] / a[1] * 100) : null; }
    var topics = Object.keys(topicAcc).map(function (k) { return { topic: k, pct: Math.round(topicAcc[k][0] / topicAcc[k][1] * 100), n: topicAcc[k][1] }; });
    topics.sort(function (a, b) { return b.pct - a.pct || b.n - a.n; });
    var report = {
      date: U.today(), scope: run.exam.scope, label: run.label,
      score: total ? Math.round(pts / total * 100) : 0, points: pts, total: total,
      timeMs: (run.exam.endedAt || Date.now()) - run.startedAt, timerMinutes: run.exam.timerMinutes,
      mc: pct(cats.mc), fr: pct(cats.fr), draw: pct(cats.draw), current: pct(cats.cur), cumulative: pct(cats.cum),
      strongest: topics.filter(function (t) { return t.pct >= 50; }).slice(0, 3),
      weakest: topics.slice().reverse().filter(function (t) { return t.pct < 100; }).slice(0, 3),
      review: review
    };
    E.state.examResults.push({ date: report.date, scope: report.scope, score: report.score, total: total, timeMs: report.timeMs, mc: report.mc, fr: report.fr, draw: report.draw, current: report.current, cumulative: report.cumulative });
    E.state.examResults = E.state.examResults.slice(-30);
    E.state.sessionCount += 1;
    E.checkAchievements(run);
    return report;
  };

  /* ---------- achievements ---------- */

  E.ACHIEVEMENTS = [
    { id: "first-bond", name: "First Bond", desc: "Complete your first question.", check: function (s) { return s.attempts >= 1; } },
    { id: "arrow-sniper", name: "Arrow Sniper", desc: "5 mechanism questions correct.", check: function (s) { return s.questionStats.mechanismCorrect >= 5; } },
    { id: "mechanism-machine", name: "Mechanism Machine", desc: "10 mechanism questions correct.", check: function (s) { return s.questionStats.mechanismCorrect >= 10; } },
    { id: "stereo-survivor", name: "Stereo Survivor", desc: "10 stereochemistry questions correct.", check: function (s) { return s.questionStats.stereoCorrect >= 10; } },
    { id: "boss-challenger", name: "Boss Challenger", desc: "Complete a boss battle.", check: function (s) { return s.bossResults.length >= 1; } },
    { id: "boss-slayer", name: "Boss Slayer", desc: "Score 80% or more on a boss.", check: function (s) { return s.bossResults.some(function (r) { return r.percent >= 80; }); } },
    { id: "no-hint-needed", name: "No Hint Needed", desc: "Complete a boss without hints.", check: function (s) { return s.bossResults.some(function (r) { return r.total > 0 && r.hintsUsed === 0; }); } },
    { id: "perfect-run", name: "Perfect Run", desc: "Finish a normal run (5+ questions) with no mistakes and no hints.", check: function (s) { return s.questionStats.perfectRuns >= 1; } },
    { id: "comeback-chemist", name: "Comeback Chemist", desc: "Raise a previously weak skill to RELIABLE.", check: function (s) { return s.questionStats.comebackSkills >= 1; } },
    { id: "streak-3", name: "3-Day Streak", desc: "Study on 3 consecutive days.", check: function (s) { return s.streak >= 3; } },
    { id: "streak-7", name: "7-Day Streak", desc: "Study on 7 consecutive days.", check: function (s) { return s.streak >= 7; } }
  ];
  E.ACH_BY_ID = {};
  E.ACHIEVEMENTS.forEach(function (a) { E.ACH_BY_ID[a.id] = a; });

  E.verifyAchievement = function (id, st) {
    var a = E.ACH_BY_ID[id];
    try { return !!(a && a.check(st)); } catch (e) { return false; }
  };

  E.checkAchievements = function (run) {
    var st = E.state, out = [];
    E.ACHIEVEMENTS.forEach(function (a) {
      if (st.achievements.indexOf(a.id) >= 0) return;
      if (E.verifyAchievement(a.id, st)) {
        st.achievements.push(a.id);
        st.achievementDates[a.id] = U.today();
        out.push(a);
        if (run && run.achievementsUnlocked.indexOf(a.name) < 0) run.achievementsUnlocked.push(a.name);
      }
    });
    return out;
  };

  MQ.engine = E;
})(window.MQ);
