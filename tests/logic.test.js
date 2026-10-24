/* Headless logic tests for storage + engine, run with JavaScriptCore (Safari's engine).
   Usage: sh tests/run.sh   (loads the real modules and the content packs given as arguments) */
"use strict";
var ROOT = arguments[0];
var CONFIRMED_PACK = arguments[1];
var PREVIEW_PACK = arguments[2];
var MODE = arguments[3] || "main";

var window = globalThis;
var mem = {};
function makeStore(throwing) {
  return {
    getItem: function (k) { if (throwing) throw new Error("SecurityError"); return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { if (throwing) throw new Error("SecurityError"); mem[k] = String(v); },
    removeItem: function (k) { if (throwing) throw new Error("SecurityError"); delete mem[k]; }
  };
}
window.localStorage = makeStore(MODE === "nostorage");
window.sessionStorage = makeStore(false);
window.console = { log: print, warn: print, error: print };

["util", "content", "questions", "storage", "engine"].forEach(function (m) { load(ROOT + "/js/" + m + ".js"); });
var MQ = window.MQ, U = MQ.util, C = MQ.content, S = MQ.storage, E = MQ.engine;

var passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; print("PASS " + name); }
  else { failed++; print("FAIL " + name + (detail !== undefined ? "  -> " + detail : "")); }
}
function section(t) { print("\n## " + t); }
function freshBoot() { var r = S.load(E.builtinIds()); E.init(r.state); return r; }
function readPack(p) { return C.parsePack(JSON.parse(readFile(p))); }
function answerAll(run, resultFor) {
  var guard = 0;
  while (run.index < run.queue.length && guard++ < 200) {
    var q = E.q(run.queue[run.index].id);
    E.recordAnswer(run, q, resultFor(q, run));
    run.index += 1;
  }
}
var dayOffset = 0;
var realNow = U.now;
U.now = function () { var d = realNow(); d.setDate(d.getDate() + dayOffset); return d; };

if (MODE === "nostorage") {
  section("STARTUP: no localStorage permission");
  check("storage reported unavailable", S.available === false);
  var r0 = freshBoot();
  check("load does not throw and warns", !!r0.warning, r0.warning);
  var saved;
  try { saved = S.save(E.state); } catch (e) { saved = "threw"; }
  check("save does not throw (falls back to tab memory)", saved !== "threw");
  check("nothing written to the blocked localStorage", Object.keys(mem).length === 0);
  var run0 = E.buildRun("daily");
  check("daily run still builds", run0 && run0.queue.length === 8);
  print("\nRESULT " + passed + " passed, " + failed + " failed");
  if (failed) throw new Error("tests failed");
} else {

section("STARTUP: fresh browser");
var r = freshBoot();
check("fresh load has no warning", !r.warning, r.warning);
check("default xp 0, hearts 3", E.state.xp === 0 && E.state.hearts === 3);
check("built-in bank loaded (108)", E.bank.length === 108, E.bank.length);
check("no confirmed MT2 yet", !E.hasCurrent());
check("MT2 readiness null without confirmed pack", E.mt2Readiness() === null);
var dailyMt1 = E.buildRun("daily");
check("daily works with MT1 only", dailyMt1 && dailyMt1.queue.length === 8, dailyMt1 && dailyMt1.queue.length);

section("STARTUP: malformed saves");
mem = {}; mem[S.KEY] = "{not json";
r = freshBoot();
check("malformed v2: no throw, warning shown", !!r.warning, r.warning);
check("malformed v2: raw kept in backup key", mem[S.BACKUP_KEY] === "{not json");
mem = {}; mem[S.LEGACY_KEY] = "[[[";
r = freshBoot();
check("malformed v1: warning says could not be migrated", /could not be migrated/.test(r.warning || ""), r.warning);
check("malformed v1: left untouched", mem[S.LEGACY_KEY] === "[[[");
mem = {}; mem[S.LEGACY_KEY] = JSON.stringify({ version: 1, xp: "lots", mastery: [1, 2], spacedRepetition: { a: 5, b: { dueDate: "nope", repetitions: -3 } }, importedQuestions: [{ id: 3 }, null, { id: "ok-1", type: "choice", question: "Q?", choices: ["a", "b"], answer: "a", explanation: "e", topic: "T", skills: ["s"] }], achievements: "x" });
r = freshBoot();
check("weird-typed v1 migrates without throwing", !!E.state && E.state.xp === 0);
check("weird v1: valid imported question kept, invalid dropped", E.state.importedQuestions.length === 1 && r.report.droppedQuestions.length === 2, JSON.stringify(r.report && r.report.droppedQuestions));
check("weird v1: bad SR entry sanitized", E.state.spacedRepetition.b && E.state.spacedRepetition.b.dueDate === null && E.state.spacedRepetition.b.repetitions === 0);
mem = {}; mem[S.KEY] = JSON.stringify({ version: 2, xp: 50, activeRun: { queue: "broken" }, enemies: { cip: "bad" } });
r = freshBoot();
check("v2 with broken activeRun/enemies loads", E.state.xp === 50 && E.state.activeRun === null);

section("STARTUP: existing old (v1) save migration");
var confirmed = readPack(CONFIRMED_PACK), preview = readPack(PREVIEW_PACK);
var oldImported = confirmed.questions.concat(preview.questions).map(function (q) {
  var o = JSON.parse(JSON.stringify(q)); delete o.packId; delete o.packScope; delete o.tags; return o; // v1 stored questions without pack metadata
});
var yesterday = U.addDays(U.today(), -1);
var v1 = {
  version: 1, xp: 437, level: 5, hearts: 1, streak: 4, lastStudyDate: yesterday, attempts: 60, correct: 41,
  freeResponseScores: [{ questionId: "resonance-draw", score: 1, confidence: 3, date: yesterday }],
  mastery: { "CIP priority": { score: 35, attempts: 4, correct: 1, lastSeen: yesterday }, "SN2 mechanism": { score: 72, attempts: 5, correct: 4, lastSeen: yesterday } },
  mistakes: { "CIP priority": { count: 3, lastQuestion: "cip-br", lastDate: yesterday }, "anti-periplanar": { count: 4, lastQuestion: "x", lastDate: yesterday } },
  spacedRepetition: { "cip-br": { dueDate: U.today(), interval: 1, repetitions: 0, lastResult: "major" }, "oct22-sn2-001": { dueDate: U.addDays(U.today(), 3), interval: 4, repetitions: 2, lastResult: "correct" } },
  bossResults: [{ mode: "boss", label: "Boss", date: yesterday, correct: 9, total: 10, percent: 90, hintsUsed: 2, bestCombo: 4 }],
  achievements: ["First bond", "Boss Slayer", "Ten clean mechanisms", "Perfect Run"],
  unlockedContent: ["mt1", "mt2"], importedQuestions: oldImported, sessionCount: 12,
  questionStats: { mechanismCorrect: 3, stereoCorrect: 2 }, enemyProgress: {}, courseMastery: { mt1: {}, mt2: {}, preview: { "Hemiacetals": { score: 40, attempts: 2, correct: 1 } } }
};
mem = {}; mem[S.LEGACY_KEY] = JSON.stringify(v1);
r = freshBoot();
var st = E.state;
check("XP preserved (437)", st.xp === 437, st.xp);
check("streak preserved (4, studied yesterday)", st.streak === 4, st.streak);
check("mastery preserved", st.mastery["SN2 mechanism"] && st.mastery["SN2 mechanism"].score === 72);
check("mistakes preserved", st.mistakes["CIP priority"].count === 3);
check("spaced repetition preserved", st.spacedRepetition["cip-br"].dueDate === U.today() && st.spacedRepetition["oct22-sn2-001"].repetitions === 2);
check("imported questions preserved (130)", st.importedQuestions.length === 130, st.importedQuestions.length);
check("boss history preserved", st.bossResults.length === 1 && st.bossResults[0].percent === 90);
check("enemies rebuilt from mistakes", st.enemies.cip && st.enemies.cip.misses === 3 && st.enemies["anti-periplanar"] && st.enemies["anti-periplanar"].misses === 4, JSON.stringify(st.enemies));
check("verifiable achievements kept", st.achievements.indexOf("first-bond") >= 0 && st.achievements.indexOf("boss-slayer") >= 0);
check("unverifiable achievements archived, not faked", st.legacyAchievements.indexOf("Ten clean mechanisms") >= 0 && st.legacyAchievements.indexOf("Perfect Run") >= 0 && st.achievements.indexOf("perfect-run") < 0);
check("preview mastery kept separate", st.previewMastery["Hemiacetals"] && !st.mastery["Hemiacetals"]);
check("migration info message", /Migrated your previous save/.test(r.info || ""), r.info);
check("v1 confirmed pack recognised as current MT2 (60)", E.currentPool().length === 60, E.currentPool().length);
check("v1 preview questions recognised as preview (60)", E.previewPool().length === 60, E.previewPool().length);
check("confirmed pack MT1 maintenance counts as official MT1", E.mt1Pool().length === 108 + 10, E.mt1Pool().length);
S.save(st);
check("migrated save written to v2 key, v1 left untouched", !!mem[S.KEY] && mem[S.LEGACY_KEY] === JSON.stringify(v1));
r = freshBoot();
check("reload from v2 keeps everything", E.state.xp === 437 && E.state.importedQuestions.length === 130 && !r.warning);
check("serialized save has no cache fields", mem[S.KEY].indexOf("\"_text\"") < 0 && mem[S.KEY].indexOf("\"_enemy\"") < 0);

section("CONTENT: built-in + attached packs + multiple packs");
mem = {};
freshBoot();
check("confirmed pack parses: 70 valid, 0 invalid", confirmed.ok && confirmed.questions.length === 70 && confirmed.invalid.length === 0);
check("preview pack parses: 60 valid, 0 invalid", preview.ok && preview.questions.length === 60 && preview.invalid.length === 0);
var imp = E.importPack(confirmed);
check("confirmed import adds 70", imp.added === 70, imp.added);
check("MT2 campaign active after confirmed import", E.hasCurrent() && E.currentPool().length === 60);
check("MT2 readiness 0% (unseen) not null", E.mt2Readiness() === 0);
var regions = E.regions();
function reg(id) { return regions.filter(function (x) { return x.def.id === id; })[0]; }
check("Substitution District confirmed", reg("substitution").status === "confirmed", reg("substitution").status);
check("Elimination Ridge confirmed", reg("elimination").status === "confirmed");
check("Carbonyl Caverns locked before preview import", reg("carbonyl").status === "locked", reg("carbonyl").status);
imp = E.importPack(preview);
regions = E.regions();
check("preview import adds 60", imp.added === 60);
check("Carbonyl Caverns shows PREVIEW", reg("carbonyl").status === "preview");
check("Carbohydrate Labyrinth shows PREVIEW", reg("carbohydrate").status === "preview");
check("Acyl Citadel shows PREVIEW", reg("acyl").status === "preview");
var mt2Before = E.mt2Readiness(), finBefore = E.finalReadiness();
check("preview import did not change readiness", mt2Before === 0 && E.finalReadiness() === finBefore);
imp = E.importPack(confirmed);
check("re-import: 0 added, 70 duplicates rejected", imp.added === 0 && imp.duplicates.length === 70);
check("bank size stable after duplicate import", E.bank.length === 108 + 130);
var third = C.parsePack({ format: "mechanism-quest-content-pack", version: 1, pack: { id: "future-redox", title: "Redox", scope: "confirmed-course-material" }, questions: [
  { id: "redox-1", course: "mt2", courseSpecific: true, module: "Redox Foundry", topic: "Oxidation states", type: "text", question: "Oxidation level of C in CH3OH vs CH2O?", acceptedAnswers: ["CH2O is more oxidized"], explanation: "e", skills: ["redox"] },
  { id: "redox-2", course: "mt2", courseSpecific: true, module: "Redox Foundry", topic: "Oxidation states", type: "choice", question: "Q", choices: ["a", "b"], answer: "a", explanation: "e", skills: ["redox"], hints: ["h1", "h2", "h3"] },
  { id: "bad-1", course: "mt2", type: "weird", question: "x" },
  { id: "oct22-sn2-001", course: "mt2", courseSpecific: true, type: "choice", question: "dup", choices: ["a", "b"], answer: "a", explanation: "", skills: ["x"] }
] });
imp = E.importPack(third);
check("third pack: 2 added, 1 duplicate, 1 invalid", imp.added === 2 && imp.duplicates.length === 1 && imp.invalid.length === 1, JSON.stringify(imp));
check("duplicate did not overwrite original", E.q("oct22-sn2-001").question !== "dup");
check("future unit appears as dynamic region", E.regions().some(function (x) { return x.def.id === "dyn:Redox Foundry" && x.status === "confirmed"; }));
var sneaky = C.parsePack({ format: "mechanism-quest-content-pack", version: 1, pack: { id: "gen", scope: "generic-practice" }, questions: [{ id: "sneak-1", course: "mt2", courseSpecific: true, type: "choice", question: "q", choices: ["a", "b"], answer: "a", explanation: "", skills: ["x"] }] });
check("courseSpecific:true outside confirmed scope is downgraded to preview", sneaky.questions[0].courseSpecific === false && C.isPreview(sneaky.questions[0]));
check("wrong format rejected cleanly", C.parsePack({ format: "nope" }).ok === false && C.parsePack(null).ok === false);
check("version 2 pack rejected cleanly", C.parsePack({ format: "mechanism-quest-content-pack", version: 2, pack: { id: "x" }, questions: [] }).ok === false);

section("QUESTION TYPES present");
var types = {};
E.bank.forEach(function (q) { types[q.type] = (types[q.type] || 0) + 1; });
check("choice/text/draw/rank/select-atom all in bank", types.choice && types.text && types.draw && types.rank && types["select-atom"], JSON.stringify(types));

section("HINTS");
var legacy = E.q("oct22-sn2-001"), three = E.q("mq-select-stereocenter-2-butanol");
check("legacy single-hint question exposes exactly 1 hint", C.hints(legacy).length === 1);
check("three-hint question exposes 3 hints", C.hints(three).length === 3);
check("question with no hints exposes 0 (no phantom hint 2/3)", C.hints({ question: "x" }).length === 0);
check("hints array with blanks is filtered", C.hints({ hints: ["a", "", null] }).length === 1);
var base = E.baseXP(three);
check("XP reduction: hint1 -2, hint2 -3, hint3 -5", E.potentialXP(three, 1) === base - 2 && E.potentialXP(three, 2) === base - 5 && E.potentialXP(three, 3) === base - 10, [base, E.potentialXP(three, 1), E.potentialXP(three, 2), E.potentialXP(three, 3)].join(","));
check("potential XP never negative", E.potentialXP({ difficulty: 1, type: "choice" }, 3) >= 0);
var xp0 = E.state.xp;
var hintRun = E.buildRun("quick");
var fbNoHint = E.recordAnswer(hintRun, three, { result: "correct", confidence: 3, hints: 0 });
var srNoHint = E.state.spacedRepetition[three.id].interval;
var three2 = E.q("mq-select-acidic-h");
var fbHint = E.recordAnswer(hintRun, three2, { result: "correct", confidence: 3, hints: 3 });
check("hinted correct earns less XP", fbHint.xp < fbNoHint.xp, fbHint.xp + " vs " + fbNoHint.xp);
check("hint 3 shortens review interval to 1 day", E.state.spacedRepetition[three2.id].interval === 1 && srNoHint >= 1);
var mHint = fbHint.masteryDeltas.filter(function (d) { return d.key === "ARIO: resonance"; })[0];
var mNoHint = fbNoHint.masteryDeltas.filter(function (d) { return d.key === "stereocenter detection"; })[0];
check("hinted answer gives weaker mastery evidence", (mHint.after - mHint.before) < (mNoHint.after - mNoHint.before), (mHint.after - mHint.before) + " vs " + (mNoHint.after - mNoHint.before));
check("XP stays non-negative after a wrong answer", E.recordAnswer(hintRun, legacy, { result: "wrong", confidence: 2, hints: 3 }).xp === 0 && E.state.xp >= xp0);

section("QUESTS: every mode builds with correct composition");
mem = {}; freshBoot(); E.importPack(confirmed); E.importPack(preview);
var modes = ["daily", "quick", "mechanism", "product", "stereo", "visual", "weakness", "ahead"];
modes.forEach(function (m) {
  var run = E.buildRun(m);
  check(m + " builds (" + (run && run.queue.length) + " questions)", run && run.queue.length >= 5);
  if (!run) return;
  var qs = run.queue.map(function (it) { return E.q(it.id); });
  if (m === "ahead") check("ahead uses only preview material", qs.every(C.isPreview));
  else check(m + " uses no preview material", qs.every(C.isOfficial));
});
var tally = { n: 0, mt1: 0, prod: 0, cur: 0 };
for (var i = 0; i < 30; i++) {
  var d = E.buildRun("daily");
  d.queue.forEach(function (it) { var q = E.q(it.id); tally.n++; if (C.isMT1(q)) tally.mt1++; if (C.isProduction(q)) tally.prod++; if (C.isCurrentMT2(q)) tally.cur++; });
}
check("daily: ~80% current MT2 (70-90%)", tally.cur / tally.n >= 0.7 && tally.cur / tally.n <= 0.9, Math.round(tally.cur / tally.n * 100) + "%");
check("daily: ~20% MT1 maintenance (10-30%)", tally.mt1 / tally.n >= 0.1 && tally.mt1 / tally.n <= 0.3, Math.round(tally.mt1 / tally.n * 100) + "%");
check("daily: >=60% active production", tally.prod / tally.n >= 0.6, Math.round(tally.prod / tally.n * 100) + "%");
var daily = E.buildRun("daily");
check("daily has the 8 encounter types in order", daily.queue.map(function (it) { return it.enc; }).join(",") === "recall,scan,duel,forge,stereo,rematch,elite,miniboss", daily.queue.map(function (it) { return it.enc; }).join(","));
check("daily has no duplicate questions", U.uniq(daily.queue.map(function (it) { return it.id; })).length === daily.queue.length);
var wk = E.buildRun("weakness");
check("weakness hunt: >=60% production", wk.queue.filter(function (it) { return C.isProduction(E.q(it.id)); }).length >= 5, wk.queue.map(function (it) { return E.q(it.id).type; }).join(","));
var quick = E.buildRun("quick");
check("quick: 5 questions, 4 current + 1 maintenance", quick.queue.length === 5 && quick.queue.filter(function (it) { return C.isCurrentMT2(E.q(it.id)); }).length === 4, quick.queue.map(function (it) { return E.q(it.id).course; }).join(","));
var mech = E.buildRun("mechanism");
check("mechanism grind includes imported SN2/E2 (not an MT1 whitelist)", mech.queue.filter(function (it) { return C.isCurrentMT2(E.q(it.id)); }).length >= 4);
var boss = E.buildRun("boss", { region: "elimination" });
check("boss: Anti-Periplanar Warden for E2", boss.bossName === "Anti-Periplanar Warden");
check("boss: 12 strikes in 3 phases", boss.queue.length === 12 && [1, 2, 3].every(function (p) { return boss.queue.some(function (it) { return it.phase === p; }); }));
var bq = boss.queue.map(function (it) { return E.q(it.id); });
check("boss includes draw, text and stereo/structure/product", bq.some(function (q) { return q.type === "draw"; }) && bq.some(function (q) { return q.type === "text"; }) && bq.some(function (q) { return C.isStereo(q) || C.isVisual(q) || C.isProduct(q); }));
check("boss uses confirmed material only", bq.every(C.isOfficial));
check("boss HP starts at 100", boss.bossHp === 100);
check("boss options exclude preview regions", E.bossOptions().every(function (x) { return x.status === "confirmed"; }));
var subBoss = E.buildRun("boss", { region: "substitution" });
check("Backside Sentinel for SN2", subBoss.bossName === "The Backside Sentinel");
var exam = E.buildRun("exam", { count: 15, scope: "mt2", timerMinutes: 30 });
check("exam: 15 questions", exam.queue.length === 15);
check("exam: timer deadline ~30 min", exam.exam.deadline && Math.abs(exam.exam.deadline - Date.now() - 1800000) < 5000);
var eq = exam.queue.map(function (it) { return E.q(it.id); });
check("exam: ~85% current confirmed", eq.filter(C.isCurrentMT2).length >= 12, eq.filter(C.isCurrentMT2).length);
check("exam: no preview", eq.every(C.isOfficial));
check("exam: drawings capped at 40%", eq.filter(function (q) { return q.type === "draw"; }).length <= 6);
check("exam: MC first, drawing last", eq[0].type === "choice" && eq[eq.length - 1].type === "draw");
var fexam = E.buildRun("exam", { count: 20, scope: "final", timerMinutes: 0 });
check("final exam: 20 questions, untimed, all confirmed", fexam.queue.length === 20 && !fexam.exam.deadline && fexam.queue.every(function (it) { return C.isOfficial(E.q(it.id)); }));
check("ahead of class has preview label flag", E.buildRun("ahead").preview === true);
check("region training (Substitution)", E.buildRun("region", { region: "substitution" }).queue.length === 8);

section("DAILY QUEST: full play-through");
var run = E.buildRun("daily");
var startXp = E.state.xp;
var k = 0;
answerAll(run, function () { k++; return { result: k % 4 === 0 ? "major" : "correct", confidence: 3, hints: k === 2 ? 1 : 0 }; });
check("all encounters answered (incl. inserted near-transfer)", run.answers.length === run.queue.length && run.queue.length >= 8, run.answers.length + "/" + run.queue.length);
check("near-transfer rematch inserted after a miss", run.queue.some(function (it) { return it.inserted; }));
check("combo tracked (peak >= 2)", run.peakCombo >= 2, run.peakCombo);
check("hearts decreased on major errors", E.state.hearts < 3, E.state.hearts);
var sum = E.finishRun(run);
check("summary: score/xp/combo/hearts/streak", typeof sum.score === "number" && sum.xp > 0 && sum.peakCombo >= 2 && sum.streak === 1);
check("summary: mastery changes listed", sum.masteryChanges.length > 0);
check("summary: enemy progress listed", sum.enemyEvents.length > 0);
check("summary: weak skill scheduled", !!sum.nextThreat, JSON.stringify(sum.nextThreat && sum.nextThreat.topic));
check("summary: achievement First Bond unlocked", sum.achievements.indexOf("First Bond") >= 0, sum.achievements.join(","));
check("XP increased", E.state.xp > startXp);
check("MT2 readiness rose above 0", E.mt2Readiness() > 0, E.mt2Readiness());
check("repair queue holds near-transfer for tomorrow", E.state.repairQueue.length > 0 && E.state.repairQueue[0].due === U.addDays(U.today(), 1));

section("PERFECT RUN & preview isolation");
var p = E.buildRun("quick");
answerAll(p, function () { return { result: "correct", confidence: 3, hints: 0 }; });
var ps = E.finishRun(p);
check("perfect quick run gets PERFECT RUN bonus + achievement", ps.bonus.join(" ").indexOf("PERFECT RUN") >= 0 && E.state.achievements.indexOf("perfect-run") >= 0);
var mt2r = E.mt2Readiness(), finr = E.finalReadiness(), offMastery = JSON.stringify(E.state.mastery), enemiesBefore = JSON.stringify(E.state.enemies);
var ah = E.buildRun("ahead");
answerAll(ah, function (q, rr) { return { result: rr.index % 2 ? "correct" : "major", confidence: 3, hints: 0 }; });
E.finishRun(ah);
check("preview answers do not change MT2 readiness", E.mt2Readiness() === mt2r);
check("preview answers do not change Final readiness", E.finalReadiness() === finr);
check("preview answers do not touch official mastery", JSON.stringify(E.state.mastery) === offMastery);
check("preview misses do not create enemies", JSON.stringify(E.state.enemies) === enemiesBefore);

section("RECOVERY");
var rr2 = E.buildRun("daily");
E.state.hearts = 3;
var n = 0;
while (E.state.hearts > 0 && rr2.index < rr2.queue.length) { E.recordAnswer(rr2, E.q(rr2.queue[rr2.index].id), { result: "major", confidence: 2, hints: 0 }); rr2.index++; n++; }
check("hearts reach zero after 3 major errors", E.state.hearts === 0 && n === 3);
var rec = E.buildRun("recovery", { parent: rr2 });
check("recovery battle has 3 questions", rec && rec.queue.length === 3, rec && rec.queue.length);
var missedEnemies = rr2.answers.map(function (a) { return C.enemyFor(E.q(a.id)).id; });
var missedKeys = {}; rr2.answers.forEach(function (a) { C.masteryKeys(E.q(a.id)).forEach(function (k2) { missedKeys[k2] = true; }); });
check("recovery targets the missed concepts", rec.queue.every(function (it) { var q = E.q(it.id); return missedEnemies.indexOf(C.enemyFor(q).id) >= 0 || C.masteryKeys(q).some(function (k2) { return missedKeys[k2]; }); }));
check("recovery questions not repeated from the run", rec.queue.every(function (it) { return !rr2.queue.some(function (x) { return x.id === it.id; }); }));
answerAll(rec, function () { return { result: "major", confidence: 2, hints: 0 }; });
check("no heart loss inside recovery", E.state.hearts === 0);

section("ENEMY DEFEAT needs spaced wins");
mem = {}; freshBoot(); E.importPack(confirmed);
var eqs = E.official().filter(function (q) { return C.enemyFor(q).id === "anti-periplanar"; });
check("anti-periplanar questions exist", eqs.length >= 4, eqs.length);
var er = E.buildRun("quick");
E.recordAnswer(er, eqs[0], { result: "wrong", confidence: 2, hints: 0 });
E.recordAnswer(er, eqs[1], { result: "correct", confidence: 3, hints: 0 });
E.recordAnswer(er, eqs[2], { result: "correct", confidence: 3, hints: 0 });
E.recordAnswer(er, eqs[3], { result: "correct", confidence: 3, hints: 0 });
check("3 wins on one day: still WEAKENED, not defeated", E.enemyStatus(E.state.enemies["anti-periplanar"]) === "WEAKENED");
var heartsBeforeDay = E.state.hearts;
dayOffset = 1; E.dayRollover();
check("hearts refilled on a new day", heartsBeforeDay < 3 && E.state.hearts === 3, heartsBeforeDay + " -> " + E.state.hearts);
E.recordAnswer(er, eqs[1], { result: "correct", confidence: 3, hints: 0 });
check("wins across 2 days: DEFEATED", E.enemyStatus(E.state.enemies["anti-periplanar"]) === "DEFEATED");
E.recordAnswer(er, eqs[2], { result: "wrong", confidence: 2, hints: 0 });
check("miss after defeat: RESURFACED", E.enemyStatus(E.state.enemies["anti-periplanar"]) === "RESURFACED");
dayOffset = 0;

section("STREAK is real days");
mem = {}; freshBoot(); E.importPack(confirmed);
var sr3 = E.buildRun("quick");
[0, 1, 2].forEach(function (dd) { dayOffset = dd; E.dayRollover(); E.recordAnswer(sr3, E.currentPool()[dd], { result: "correct", confidence: 3, hints: 0 }); });
check("3 consecutive days -> streak 3 + achievement", E.state.streak === 3 && E.state.achievements.indexOf("streak-3") >= 0);
dayOffset = 5; E.dayRollover();
check("gap resets streak", E.state.streak === 0);
dayOffset = 0;

section("COMEBACK CHEMIST needs an earlier-day weakness");
mem = {}; freshBoot(); E.importPack(confirmed);
var cbq = E.currentPool().filter(function (q) { return q.topic === "E2 stereochemistry"; });
var cbr = E.buildRun("quick");
E.recordAnswer(cbr, cbq[0], { result: "wrong", confidence: 2, hints: 0 });
E.recordAnswer(cbr, cbq[1], { result: "wrong", confidence: 2, hints: 0 });
for (var c1 = 0; c1 < 8; c1++) E.recordAnswer(cbr, cbq[c1 % 2], { result: "correct", confidence: 3, hints: 0 });
check("same-day recovery does NOT award Comeback Chemist", E.state.achievements.indexOf("comeback-chemist") < 0, E.state.mastery["E2 stereochemistry"].score);
check("same-day cramming stays below MASTERED", E.state.mastery["E2 stereochemistry"].score < 80, E.state.mastery["E2 stereochemistry"].score);
mem = {}; freshBoot(); E.importPack(confirmed);
cbr = E.buildRun("quick");
E.recordAnswer(cbr, cbq[0], { result: "wrong", confidence: 2, hints: 0 });
E.recordAnswer(cbr, cbq[1], { result: "wrong", confidence: 2, hints: 0 });
var cday = 0;
while (E.state.achievements.indexOf("comeback-chemist") < 0 && cday < 10) { cday++; dayOffset = cday; E.dayRollover(); E.recordAnswer(cbr, cbq[cday % 2], { result: "correct", confidence: 3, hints: 0 }); }
check("weak skill raised to RELIABLE on later days awards Comeback Chemist", E.state.achievements.indexOf("comeback-chemist") >= 0, "days=" + cday);
dayOffset = 0;

section("EXAM: deferred grading + report");
mem = {}; freshBoot(); E.importPack(confirmed);
var ex = E.buildRun("exam", { count: 15, scope: "mt2", timerMinutes: 0 });
var xpBefore = E.state.xp, attemptsBefore = E.state.attempts;
check("starting an exam records nothing", E.state.attempts === attemptsBefore);
var grades = {};
ex.examAnswers = {};
ex.queue.forEach(function (it, idx) {
  var q = E.q(it.id);
  grades[it.id] = idx % 3 === 0 ? "wrong" : (q.type === "draw" ? "minor" : "correct");
  ex.examAnswers[it.id] = { supplied: "x", confidence: 2 };
});
grades[ex.queue[1].id] = "unanswered";
ex.exam.endedAt = Date.now();
var rep = E.finalizeExam(ex, grades);
check("report: score, mc, fr, drawing, current, cumulative", typeof rep.score === "number" && rep.mc !== undefined && rep.draw !== null && rep.current !== null && rep.cumulative !== null, JSON.stringify([rep.score, rep.mc, rep.fr, rep.draw, rep.current, rep.cumulative]));
check("report: strongest/weakest/review", rep.strongest.length > 0 && rep.weakest.length > 0 && rep.review.length >= 5);
check("exam answers recorded only at the end", E.state.attempts === attemptsBefore + 14, E.state.attempts - attemptsBefore);
check("exam does not cost hearts", E.state.hearts === 3);
check("exam saved to history", E.state.examResults.length === 1);

section("SAVE: export / import round trip");
var payload = S.exportPayload(E.state);
var parsed = S.parseSaveFile(JSON.parse(payload), E.builtinIds());
check("export parses back", parsed.ok);
check("round trip keeps XP, imported questions, SR, enemies", parsed.state.xp === E.state.xp && parsed.state.importedQuestions.length === E.state.importedQuestions.length && Object.keys(parsed.state.spacedRepetition).length === Object.keys(E.state.spacedRepetition).length && JSON.stringify(parsed.state.enemies) === JSON.stringify(E.state.enemies));
var v1Export = { format: "mechanism-quest-save", version: 1, exportedAt: "2026-10-20", data: v1 };
var parsedV1 = S.parseSaveFile(v1Export, E.builtinIds());
check("old v1 export file imports", parsedV1.ok && parsedV1.state.xp === 437 && parsedV1.state.importedQuestions.length === 130);
check("content pack offered as save is rejected with guidance", /content pack/.test(S.parseSaveFile(JSON.parse(readFile(CONFIRMED_PACK)), []).error || ""));
check("random JSON rejected as save", S.parseSaveFile({ hello: 1 }, []).ok === false);

section("ANSWER NORMALIZATION");
check("unicode subscripts", U.normalizeAnswer("CH₃S⁻") === U.normalizeAnswer("CH3S-"));
check("spacing in rate law", U.normalizeAnswer("rate = k[substrate][nucleophile]") === U.normalizeAnswer("rate=k[substrate][nucleophile]"));
check("hyphen-insensitive names", U.normalizeAnswer("2 methyl 2 butene") === U.normalizeAnswer("2-methyl-2-butene"));
check("charge sign kept", U.normalizeAnswer("CH3S-") !== U.normalizeAnswer("CH3S"));

print("\nRESULT " + passed + " passed, " + failed + " failed");
if (failed) throw new Error(failed + " tests failed");
}
