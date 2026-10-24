/* Question validation, classification, campaign regions and enemy catalogue. */
"use strict";
window.MQ = window.MQ || {};

(function (MQ) {
  var U = MQ.util;
  var C = {};

  C.TYPES = ["choice", "text", "draw", "rank", "select-atom"];
  // Skill strings that describe a pack, not a chemistry skill.
  C.META_SKILLS = ["midterm2", "midterm1-maintenance", "written", "exam-transfer", "midterm1", "final"];

  /* ---------- validation ---------- */

  function str(v) { return typeof v === "string" && v.trim().length > 0; }

  // Returns {question} or {error}. Never throws. Optional fields are defaulted.
  C.validateQuestion = function (raw, packMeta) {
    try {
      if (!U.isObj(raw)) return { error: "not an object" };
      if (!str(raw.id)) return { error: "missing id" };
      var id = raw.id.trim();
      if (!str(raw.question)) return { error: id + ": missing question text" };
      if (C.TYPES.indexOf(raw.type) < 0) return { error: id + ": unsupported type " + String(raw.type) };
      var q = {};
      Object.keys(raw).forEach(function (k) { q[k] = raw[k]; });
      q.id = id;
      q.topic = str(raw.topic) ? raw.topic : "General";
      q.skills = Array.isArray(raw.skills) ? raw.skills.filter(str) : [];
      if (!q.skills.length) q.skills = [q.topic];
      q.explanation = typeof raw.explanation === "string" ? raw.explanation : "";
      q.course = str(raw.course) ? raw.course.trim().toLowerCase() : "mt1";
      q.difficulty = U.clamp(Math.round(U.num(Number(raw.difficulty), 1)) || 1, 1, 5);
      q.tags = Array.isArray(raw.tags) ? raw.tags.filter(str) : [];
      var scope = packMeta && str(packMeta.scope) ? packMeta.scope : (str(raw.packScope) ? raw.packScope : "");
      q.packScope = scope;
      if (packMeta && str(packMeta.id)) q.packId = packMeta.id;
      // courseSpecific:true is only honoured inside a confirmed pack (old contract).
      q.courseSpecific = raw.courseSpecific === true;
      if (q.course !== "mt1" && q.courseSpecific && scope && scope !== "confirmed-course-material") q.courseSpecific = false;

      if (q.type === "choice") {
        if (!Array.isArray(raw.choices) || raw.choices.length < 2) return { error: id + ": choice question needs choices" };
        q.choices = raw.choices.map(String);
        if (q.choices.indexOf(String(raw.answer)) < 0) return { error: id + ": answer not among choices" };
        q.answer = String(raw.answer);
      } else if (q.type === "text") {
        var acc = Array.isArray(raw.acceptedAnswers) ? raw.acceptedAnswers.filter(str) : [];
        if (!acc.length && str(raw.answer)) acc = [raw.answer];
        if (!acc.length) return { error: id + ": text question needs acceptedAnswers" };
        q.acceptedAnswers = acc;
      } else if (q.type === "draw") {
        if (!str(raw.rubric) && !U.isObj(raw.rubric) && !str(raw.answer)) return { error: id + ": draw question needs a rubric" };
      } else if (q.type === "rank") {
        if (!Array.isArray(raw.items) || !Array.isArray(raw.answer) || raw.items.length < 2 ||
            raw.items.length !== raw.answer.length ||
            raw.answer.some(function (x) { return raw.items.indexOf(x) < 0; })) {
          return { error: id + ": rank question needs matching items and answer" };
        }
      } else if (q.type === "select-atom") {
        var err = C.checkStructure(raw.structure);
        if (err) return { error: id + ": " + err };
        var ids = raw.structure.atoms.map(function (a) { return a.id; });
        if (ids.indexOf(raw.answer) < 0) return { error: id + ": answer atom not in structure" };
      }
      if (raw.structure && q.type !== "select-atom" && C.checkStructure(raw.structure)) delete q.structure;
      return { question: q };
    } catch (e) {
      return { error: "validation crashed: " + (e && e.message) };
    }
  };

  C.checkStructure = function (s) {
    if (!U.isObj(s) || !Array.isArray(s.atoms) || !s.atoms.length || !Array.isArray(s.bonds)) return "structure needs atoms and bonds";
    var ids = {};
    for (var i = 0; i < s.atoms.length; i++) {
      var a = s.atoms[i];
      if (!U.isObj(a) || !str(a.id) || typeof a.label !== "string" || !isFinite(a.x) || !isFinite(a.y) || ids[a.id]) return "invalid atom";
      ids[a.id] = true;
    }
    for (var j = 0; j < s.bonds.length; j++) {
      var b = s.bonds[j];
      if (!U.isObj(b) || !ids[b.from] || !ids[b.to]) return "invalid bond";
    }
    if (s.viewBox && !/^-?\d+(\.\d+)? -?\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/.test(s.viewBox)) return "invalid viewBox";
    return null;
  };

  // Validate a content pack. Never throws. Returns {ok, packMeta, questions, invalid:[msg]} or {ok:false, error}.
  C.parsePack = function (parsed) {
    var pack = parsed && parsed.contentPack ? parsed.contentPack : parsed;
    if (!U.isObj(pack) || pack.format !== "mechanism-quest-content-pack") return { ok: false, error: "Not a Mechanism Quest content pack (format field missing)." };
    if (pack.version !== 1) return { ok: false, error: "Unsupported content-pack version " + String(pack.version) + " (this app reads version 1)." };
    if (!U.isObj(pack.pack) || !str(pack.pack.id)) return { ok: false, error: "Content pack is missing pack.id." };
    if (!Array.isArray(pack.questions)) return { ok: false, error: "Content pack has no questions array." };
    var meta = { id: pack.pack.id, title: str(pack.pack.title) ? pack.pack.title : pack.pack.id, scope: str(pack.pack.scope) ? pack.pack.scope : "" };
    var questions = [], invalid = [];
    pack.questions.forEach(function (raw) {
      var r = C.validateQuestion(raw, meta);
      if (r.question) questions.push(r.question); else invalid.push(r.error);
    });
    return { ok: true, packMeta: meta, questions: questions, invalid: invalid };
  };

  /* ---------- classification ---------- */

  C.isPreview = function (q) {
    if (q.course === "mt1") return /preview/i.test(q.packScope || "");
    return q.courseSpecific !== true;
  };
  C.isOfficial = function (q) { return !C.isPreview(q); };
  C.isCurrentMT2 = function (q) { return q.course === "mt2" && q.courseSpecific === true; };
  C.isMT1 = function (q) { return q.course === "mt1" && C.isOfficial(q); };
  C.isProduction = function (q) { return q.type !== "choice"; };

  C.text = function (q) {
    if (!q._text) {
      q._text = [q.topic, q.question, (q.skills || []).join(" "), (q.tags || []).join(" ")].join(" ").toLowerCase();
    }
    return q._text;
  };
  C.meta = function (q) {
    if (!q._meta) q._meta = [q.topic, (q.skills || []).join(" "), (q.tags || []).join(" ")].join(" | ").toLowerCase();
    return q._meta;
  };

  var RX = {
    mechanism: /mechanism|curved.?arrow|arrow|proton transfer|\bsn1\b|\bsn2\b|\be1\b|\be2\b|resonance|carbonyl addition|tetrahedral|acyl substitution|intermediate|cycliz|oxonium|carbocation|nucleophilic/,
    product: /product|predict|pbr3|socl2|tosyl|zaitsev|markovnikov|hydration|solvation|regiochem|synthes|alkoxide|alcohol activation|major alkene|acetal formation|hemiacetal formation|ester substitution/,
    stereo: /stereo|\bcip\b|\br\/s\b|\be\/z\b|fischer|newman|wedge|inversion|retention|anti-periplanar|antiperiplanar|trans-diaxial|cyclohexane|anomer|enantiomer|diastereomer|\bmeso\b|chiral/,
    visual: /newman|fischer|chair|cyclohexane|wedge|dash|skeletal|structure|labell?ed|projection|drawn below|visual|scheme|isomer relationship/,
    classification: /classif|mechanism choice|competition|sn2 vs e2|e2 vs sn2|sn1\/e1|which reaction|reaction class/
  };

  C.isMechanism = function (q) { return (q.type === "draw" && RX.mechanism.test(C.text(q))) || RX.mechanism.test(C.meta(q)); };
  C.isProduct = function (q) { return RX.product.test(C.text(q)) || RX.classification.test(C.meta(q)); };
  C.isStereo = function (q) { return RX.stereo.test(C.meta(q)) || RX.stereo.test(C.text(q)); };
  C.isVisual = function (q) { return q.type === "select-atom" || !!q.structure || !!q.image || RX.visual.test(C.text(q)); };
  C.isClassification = function (q) { return RX.classification.test(C.meta(q)); };

  /* ---------- hints & rubric ---------- */

  C.hints = function (q) {
    if (Array.isArray(q.hints)) {
      var list = q.hints.filter(str).slice(0, 3);
      if (list.length) return list;
    }
    return str(q.hint) ? [q.hint] : [];
  };
  C.HINT_COST = [2, 3, 5];

  var DEFAULT_RUBRIC = {
    full: ["Correct curved arrows (start at lone pair, π bond or breaking bond)", "Correct product / final answer", "Correct formal charges", "Correct stereochemistry (wedge/dash, all stereoisomers when required)"],
    minor: ["Small notation error", "One missing formal charge", "Arrow slightly misplaced but electron source clear"],
    major: ["Wrong mechanism or wrong reaction classification", "Missing a major intermediate or proton-transfer step", "Wrong product, regiochemistry or stereochemistry"]
  };

  C.rubric = function (q) {
    var r = q.rubric, out = { answer: "", full: DEFAULT_RUBRIC.full, minor: DEFAULT_RUBRIC.minor, major: DEFAULT_RUBRIC.major, custom: false };
    function list(v) { return Array.isArray(v) ? v.filter(str) : (str(v) ? [v] : null); }
    if (str(r)) out.answer = r;
    else if (U.isObj(r)) {
      out.answer = str(r.answer) ? r.answer : (str(r.model) ? r.model : "");
      var f = list(r.full || r.fullCredit), mi = list(r.minor || r.minorError), ma = list(r.major || r.majorError);
      if (f && f.length) { out.full = f; out.custom = true; }
      if (mi && mi.length) out.minor = mi;
      if (ma && ma.length) out.major = ma;
    }
    var f2 = list(q.rubricFull), mi2 = list(q.rubricMinor), ma2 = list(q.rubricMajor);
    if (f2 && f2.length) out.full = f2;
    if (mi2 && mi2.length) out.minor = mi2;
    if (ma2 && ma2.length) out.major = ma2;
    if (!out.answer && str(q.answer)) out.answer = q.answer;
    return out;
  };

  C.answerText = function (q) {
    if (q.type === "choice") return q.answer;
    if (q.type === "text") return q.acceptedAnswers[0];
    if (q.type === "rank") return q.answer.join("  →  ");
    if (q.type === "select-atom") {
      var atom = (q.structure.atoms || []).filter(function (a) { return a.id === q.answer; })[0];
      return "Atom " + q.answer + (atom ? " (" + atom.label + ")" : "");
    }
    return C.rubric(q).answer;
  };

  /* ---------- campaign regions ---------- */

  C.REGIONS = [
    { id: "foundation", name: "Foundation Archives", sub: "Midterm 1 cumulative", boss: "Carbocation Chimera", bossSkill: "SN1/E1 and cumulative MT1",
      match: function (q) { return q.course === "mt1"; } },
    { id: "substitution", name: "Substitution District", sub: "SN2", boss: "The Backside Sentinel", bossSkill: "SN2",
      match: function (q) { return q.course !== "mt1" && /\bsn2\b|substitution|pbr3|socl2|tosyl|nucleophil|leaving.?group|alkoxide|alcohol activation|walden|inversion/.test(C.meta(q)) && !/acyl|carbonyl|carbohydrate|acetal|ester|amide|addition/.test(C.meta(q)); } },
    { id: "elimination", name: "Elimination Ridge", sub: "E2", boss: "Anti-Periplanar Warden", bossSkill: "E2",
      match: function (q) { return q.course !== "mt1" && /\be2\b|elimination|zaitsev|anti-periplanar|newman|cyclohexane/.test(C.meta(q)); } },
    { id: "crossroads", name: "Mechanism Crossroads", sub: "SN1 / SN2 / E1 / E2 competition & course rules", boss: "The Crossroads Arbiter", bossSkill: "Choosing the mechanism",
      match: function (q) { return q.course !== "mt1" && /cumulative|course-rules|course rules|competition|classification|\bsn1\b|\be1\b|reaction coordinate|exam-transfer|written exam|sn2 vs e2|e2 vs sn2/.test(C.meta(q)) && !/carbonyl|acyl|carbohydrate|acetal/.test(C.meta(q)); } },
    { id: "carbonyl", name: "Carbonyl Caverns", sub: "Carbonyl addition", boss: "The Tetrahedral Oracle", bossSkill: "Carbonyl addition",
      match: function (q) { return q.course !== "mt1" && /carbonyl|hemiacetal|acetal|hydrate|geminal|aldehyde|ketone/.test(C.meta(q)) && !/carbohydrate|acyl|ester|amide/.test(C.meta(q)); } },
    { id: "carbohydrate", name: "Carbohydrate Labyrinth", sub: "Carbohydrates", boss: "The Anomeric Sphinx", bossSkill: "Carbohydrates",
      match: function (q) { return q.course !== "mt1" && /carbohydrate|sugar|anomer|aldose|ketose|glycos|monosaccharide|mutarotation|pyranose|furanose/.test(C.meta(q)); } },
    { id: "acyl", name: "Acyl Citadel", sub: "Nucleophilic acyl substitution", boss: "The Acyl Castellan", bossSkill: "Acyl substitution",
      match: function (q) { return q.course !== "mt1" && /acyl|ester|amide|acid chloride|anhydride|carboxylic acid derivative/.test(C.meta(q)); } }
  ];

  C.regionIdsFor = function (q) {
    if (q._regions) return q._regions;
    var ids = C.REGIONS.filter(function (r) { return r.match(q); }).map(function (r) { return r.id; });
    if (!ids.length) {
      // Future units: a module field (or the course id) creates a region dynamically.
      var mod = str(q.module) ? q.module.trim() : (q.course !== "mt1" && q.course !== "mt2" ? q.course.toUpperCase() : "Uncharted Frontier");
      ids = ["dyn:" + mod];
    }
    q._regions = ids;
    return ids;
  };

  /* ---------- enemies (recurring mistakes) ---------- */

  C.ENEMIES = [
    { id: "anti-periplanar", name: "Anti-Periplanar Blind Spot", skill: "E2 geometry", rx: /anti-periplanar|e2 stereo|cyclohexane e2|e2 geometry|trans-diaxial|newman|e2 visual|e2 feasibility/,
      rule: "E2 needs the β-H and leaving group anti-periplanar (180°); on a cyclohexane both must be axial." },
    { id: "backside", name: "Backside Blind Spot", skill: "SN2 stereochemistry", rx: /sn2 stereo|inversion|sequential stereo|tosyl|pbr3|socl2|alcohol activation|double inversion/,
      rule: "SN2 inverts the attacked stereocenter. PBr₃/SOCl₂ invert; TsCl retains (reacts at O)." },
    { id: "false-stereocenter", name: "False Stereocenter", skill: "Stereocenter detection & product count", rx: /stereocenter|stereochemical product count|stereochemical bookkeeping|stereochemical count/,
      rule: "A stereocenter needs four different groups. Count real stereocenters before drawing two products." },
    { id: "cip", name: "CIP Tiebreaker", skill: "CIP priority, R/S, E/Z", rx: /\bcip\b|r\/s|\be\/z\b|fischer/,
      rule: "Compare attached atoms; if tied, move outward one layer to the first point of difference. Duplicate atoms for multiple bonds." },
    { id: "reaction-class", name: "Wrong Reaction Class", skill: "Reaction classification", rx: /classif|mechanism choice|competition|sn2 vs e2|e2 vs sn2|sn1\/e1|nucleophile vs base|alcohol strategy/,
      rule: "Identify the starting functional group and the bond that changes before naming a mechanism." },
    { id: "course-rules", name: "Rulebook Lapse", skill: "CHEM 233 course conventions", rx: /course-rules|course rules|written exam|exam-transfer/,
      rule: "No carbocation rearrangements; heat cues E1; give the major stereoisomer; Zaitsev/Markovnikov apply; no squiggly bonds." },
    { id: "carbocation", name: "Unstable Cation", skill: "Carbocation stability & cyclization", rx: /carbocation|intramolecular|cycliz/,
      rule: "Carbocation stability: 3\u00b0 > 2\u00b0 > 1\u00b0 > methyl, plus resonance. Tethered nucleophiles close 5- or 6-membered rings." },
    { id: "regio", name: "Zaitsev Mirage", skill: "Regiochemistry (Zaitsev / Markovnikov)", rx: /zaitsev|markovnikov|regio|e1 selectivity/,
      rule: "Markovnikov: most stable carbocation. Zaitsev: most substituted alkene, only from an accessible β-H." },
    { id: "oxonium", name: "Missing Oxonium", skill: "Proton-transfer & intermediate steps", rx: /oxonium|hydration|solvation|mechanism steps|mechanism completeness|proton|sn1 mechanism|e1 mechanism/,
      rule: "A neutral O nucleophile gives O⁺ first; deprotonate in its own step. Never skip intermediates." },
    { id: "formal-charge", name: "Formal Charge Phantom", skill: "Formal charge", rx: /formal charge/,
      rule: "Formal charge = valence electrons − (lone-pair electrons + bonds). Show every charge." },
    { id: "resonance", name: "Resonance Impostor", skill: "Resonance vs equilibrium", rx: /resonance/,
      rule: "If atoms or H move it is a reaction; if only electrons move it is resonance (↔)." },
    { id: "acid-base", name: "Equilibrium Reversal", skill: "Acid/base equilibrium & ARIO", rx: /acid-base|acid\/base|pka|ario|ph and protonation|ph\/protonation/,
      rule: "Equilibrium favors the weaker acid (higher pKa). Rank conjugate bases with ARIO." },
    { id: "kinetics", name: "Rate-Law Wraith", skill: "Kinetics & substrate effects", rx: /kinetics|substrate effects|rate|reaction coordinate|sterics/,
      rule: "SN2/E2: rate = k[substrate][nucleophile/base]. SN2: methyl >> 1° >> 2° >>> 3°." },
    { id: "nucleophile", name: "Nucleophile Mimic", skill: "Nucleophiles & leaving groups", rx: /nucleophilicity|leaving group|leaving-group|polarizab|alkoxide/,
      rule: "Good leaving group = conjugate base of a strong acid (F⁻ is poor). Nucleophilicity rises down a column for anions." },
    { id: "mechanism", name: "Arrow Drifter", skill: "Curved-arrow mechanisms", rx: /mechanism|curved|arrow|\bsn1\b|\bsn2\b|\be1\b|\be2\b/,
      rule: "Arrows start at an electron source (lone pair, π bond, breaking bond) and end at the atom receiving the pair." },
    { id: "structure", name: "Structure Misreader", skill: "Structure interpretation", rx: /structure|functional group|hybridi|lone-pair|aromatic/,
      rule: "Read the structure locally: atom, bonds, lone pairs, charge. Then apply the rule." },
    { id: "product", name: "Product Prediction Trap", skill: "Product prediction", rx: /product|predict|synthes|terpene|carbonyl|acyl|carbohydrate|anomer/,
      rule: "Pre-check: reaction class? Which bonds change? Does the product contain a stereocenter or E/Z element?" }
  ];
  C.FALLBACK_ENEMY = { id: "uncatalogued", name: "Uncatalogued Threat", skill: "Mixed skills", rx: /.*/, rule: "Review the explanation and retry a fresh variant." };

  C.enemyFor = function (q) {
    if (q._enemy) return q._enemy;
    var m = C.meta(q);
    var found = C.ENEMIES.filter(function (e) { return e.rx.test(m); })[0] || C.FALLBACK_ENEMY;
    q._enemy = found;
    return found;
  };
  C.enemyForSkill = function (skill) {
    var s = String(skill).toLowerCase();
    if (C.META_SKILLS.indexOf(s) >= 0) return null;
    return C.ENEMIES.filter(function (e) { return e.rx.test(s); })[0] || null;
  };
  C.enemyById = function (id) {
    return C.ENEMIES.filter(function (e) { return e.id === id; })[0] || (id === C.FALLBACK_ENEMY.id ? C.FALLBACK_ENEMY : null);
  };

  C.masteryKeys = function (q) {
    return U.uniq([q.topic].concat(q.skills || []).filter(function (k) {
      return C.META_SKILLS.indexOf(String(k).toLowerCase()) < 0;
    }));
  };

  MQ.content = C;
})(window.MQ);
