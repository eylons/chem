/* UI: views, run flow, exam flow, data tools. Builds DOM with MQ.util.h (no HTML strings). */
"use strict";
window.MQ = window.MQ || {};

(function (MQ) {
  var U = MQ.util, C = MQ.content, S = MQ.storage, E = MQ.engine;
  var h = U.h;
  var A = { view: "home", params: {}, notices: [], timer: null, lastSaveOk: true };
  var root = null;

  /* ---------- persistence ---------- */

  function save() {
    A.lastSaveOk = S.save(E.state);
    var el = document.getElementById("save-status");
    if (el) {
      el.textContent = S.safeMode ? "Safe mode · not saving" : (!S.available ? "Storage blocked · export to keep progress" : (A.lastSaveOk ? "Saved in this browser" : "Save failed · export your progress"));
      el.className = "save-status" + (A.lastSaveOk && S.available && !S.safeMode ? "" : " warn");
    }
  }

  function notice(kind, text) { A.notices.push({ kind: kind, text: text }); }

  /* ---------- rendering shell ---------- */

  function go(view, params) {
    A.view = view;
    A.params = params || {};
    render();
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  }

  function render() {
    stopTimer();
    renderHeader();
    root.textContent = "";
    var builder = VIEWS[A.view] || VIEWS.home;
    try {
      builder(root);
    } catch (err) {
      console.error("Mechanism Quest view error", err);
      root.textContent = "";
      root.appendChild(h("section", { class: "card error-card" },
        h("div", { class: "eyebrow" }, "Display error"),
        h("h2", null, "This screen could not be drawn."),
        h("p", { class: "mono small" }, String(err && err.message || err)),
        h("div", { class: "row" },
          A.view === "run" ? h("button", { class: "btn", type: "button", onclick: skipBrokenQuestion }, "Skip this question") : null,
          h("button", { class: "btn ghost", type: "button", onclick: function () { go("home"); } }, "Back to base"))));
    }
  }

  function renderHeader() {
    var hdr = document.getElementById("hud");
    if (!hdr) return;
    var st = E.state, lvl = E.level(st.xp);
    hdr.textContent = "";
    var hearts = h("span", { class: "hearts", id: "hearts", "aria-label": st.hearts + " of " + S.MAX_HEARTS + " hearts" });
    for (var i = 0; i < S.MAX_HEARTS; i++) hearts.appendChild(h("span", { class: "heart" + (i < st.hearts ? " full" : "") }, i < st.hearts ? "♥" : "♡"));
    hdr.appendChild(h("div", { class: "hud-level", title: st.xp + " XP total" },
      h("span", { class: "lvl" }, "LV " + lvl),
      h("span", { class: "lvl-title" }, E.title(lvl)),
      h("span", { class: "xpbar" }, h("span", { style: "width:" + E.levelProgress(st.xp) + "%" })),
      h("span", { class: "xp-num" }, st.xp + " XP")));
    hdr.appendChild(hearts);
    hdr.appendChild(h("span", { class: "streak" + (st.lastStudyDate === U.today() ? " lit" : ""), title: "Study streak" },
      h("span", { class: "flame", "aria-hidden": "true" }, "▲"), st.streak + "-day streak"));
    var nav = document.getElementById("nav");
    if (nav) {
      nav.textContent = "";
      [["home", "Base"], ["enemies", "Enemies"], ["progress", "Progress"], ["data", "Data"]].forEach(function (n) {
        nav.appendChild(h("button", { class: "nav-btn" + (A.view === n[0] ? " active" : ""), type: "button", onclick: function () {
          if (A.view === "run" && E.state.activeRun && E.state.activeRun.mode === "exam") return confirmModal("Leave the exam?", "The exam stays paused here; the timer keeps running.", "Leave", function () { go(n[0]); });
          go(n[0]);
        } }, n[1]));
      });
    }
  }

  function noticesBlock() {
    if (!A.notices.length) return null;
    var wrap = h("div", { class: "notices" });
    A.notices.forEach(function (n, idx) {
      wrap.appendChild(h("div", { class: "notice " + n.kind, role: "status" },
        h("span", null, n.text),
        h("button", { class: "x", type: "button", "aria-label": "Dismiss", onclick: function () { A.notices.splice(idx, 1); render(); } }, "×")));
    });
    return wrap;
  }

  function pctRing(value, label, sub, kind) {
    var v = value === null ? 0 : value;
    var r = 34, c = 2 * Math.PI * r;
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 84 84");
    svg.setAttribute("class", "ring-svg");
    svg.setAttribute("aria-hidden", "true");
    var bg = document.createElementNS(NS, "circle");
    bg.setAttribute("cx", "42"); bg.setAttribute("cy", "42"); bg.setAttribute("r", String(r)); bg.setAttribute("class", "ring-bg");
    var fg = document.createElementNS(NS, "circle");
    fg.setAttribute("cx", "42"); fg.setAttribute("cy", "42"); fg.setAttribute("r", String(r)); fg.setAttribute("class", "ring-fg " + (kind || ""));
    fg.setAttribute("stroke-dasharray", String(c));
    fg.setAttribute("stroke-dashoffset", String(c * (1 - v / 100)));
    svg.appendChild(bg); svg.appendChild(fg);
    return h("div", { class: "ring" },
      h("div", { class: "ring-wrap" }, svg, h("div", { class: "ring-val" }, value === null ? "—" : value + "%")),
      h("div", { class: "ring-label" }, label),
      h("div", { class: "ring-sub" }, sub));
  }

  function masteryChip(score) {
    var label = U.masteryLabel(score);
    return h("span", { class: "chip m-" + label.toLowerCase() }, Math.round(score) + "% · " + label);
  }

  function statusChip(status) {
    return h("span", { class: "chip st-" + status.toLowerCase() }, status);
  }

  /* ---------- modal ---------- */

  function confirmModal(title, body, confirmLabel, onConfirm, requireText) {
    var layer = h("div", { class: "modal-layer", role: "dialog", "aria-modal": "true", "aria-label": title });
    var input = requireText ? h("input", { class: "input", type: "text", placeholder: "Type " + requireText, autocomplete: "off", autocapitalize: "characters" }) : null;
    var okBtn = h("button", { class: "btn danger", type: "button" }, confirmLabel);
    function close() { layer.remove(); }
    okBtn.addEventListener("click", function () {
      if (requireText && input.value.trim().toUpperCase() !== requireText) { input.classList.add("shake"); return; }
      close(); onConfirm();
    });
    layer.appendChild(h("div", { class: "modal card" },
      h("h3", null, title), h("p", null, body), input,
      h("div", { class: "row end" }, h("button", { class: "btn ghost", type: "button", onclick: close }, "Cancel"), okBtn)));
    document.body.appendChild(layer);
    (input || okBtn).focus();
  }

  function toast(text, kind) {
    var t = h("div", { class: "toast " + (kind || "") }, text);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 1400);
    setTimeout(function () { t.remove(); }, 2000);
  }

  /* ---------- HOME ---------- */

  function homeView(el) {
    var st = E.state;
    U.append(el, noticesBlock());
    var hasCur = E.hasCurrent();
    var current = E.currentPool(), official = E.official(), preview = E.previewPool();
    var mt2 = E.mt2Readiness(), fin = E.finalReadiness();
    var due = E.dueCount(official);
    var regions = E.regions();
    var curRegions = regions.filter(function (r) { return r.status === "confirmed" && r.def.id !== "foundation"; });
    var focus = curRegions.slice().sort(function (a, b) { return a.mastery - b.mastery; })[0] || regions[0];
    var weakTopic = E.topics(hasCur ? current : official).filter(function (t) { return t.attempts > 0; }).sort(function (a, b) { return a.score - b.score; })[0];

    // Hero
    var run = st.activeRun;
    var heroBtns = h("div", { class: "row" });
    if (run && run.mode !== "recovery" && run.index < run.queue.length) {
      heroBtns.appendChild(h("button", { class: "btn primary big", type: "button", onclick: function () { go("run"); } }, "RESUME " + run.label.toUpperCase() + " (" + (run.index + 1) + "/" + run.queue.length + ")"));
      heroBtns.appendChild(h("button", { class: "btn ghost", type: "button", onclick: function () {
        confirmModal("Abandon this run?", "Answers already given stay recorded. The run itself ends without a reward screen.", "Abandon", function () { st.activeRun = null; save(); render(); });
      } }, "Abandon run"));
    } else if (run && run.mode === "recovery") {
      heroBtns.appendChild(h("button", { class: "btn primary big", type: "button", onclick: function () { go("run"); } }, "RESUME RECOVERY ROOM"));
    } else {
      heroBtns.appendChild(h("button", { class: "btn primary big", type: "button", onclick: function () { startRun("daily"); } }, "START TODAY'S RUN"));
    }
    var mixLine = hasCur ? "8 encounters · ~6 confirmed Midterm 2 · ~2 Midterm 1 maintenance" : "8 encounters · Midterm 1 cumulative (import confirmed MT2 to unlock the campaign)";
    el.appendChild(h("section", { class: "hero card" },
      h("div", { class: "hero-main" },
        h("div", { class: "eyebrow" }, "What to study today"),
        h("h1", null, focus ? focus.def.name : "Foundation Archives"),
        h("p", { class: "lead" }, mixLine),
        h("ul", { class: "facts" },
          h("li", null, h("b", null, String(due)), " review" + (due === 1 ? "" : "s") + " due"),
          h("li", null, "Focus: ", h("b", null, weakTopic ? weakTopic.topic : (focus ? focus.def.sub : "fundamentals"))),
          h("li", null, "≥60% active production: drawing, written, ranking")),
        heroBtns),
      h("div", { class: "hero-rings" },
        pctRing(mt2, "Midterm 2 readiness", hasCur ? current.length + " confirmed questions" : "Awaiting confirmed pack", "mt2"),
        pctRing(fin, "Final readiness", official.length + " confirmed questions", "final"))));

    // Threat
    var te = E.topEnemy();
    var threat = h("section", { class: "card threat" }, h("div", { class: "eyebrow" }, "Weakness you are fighting"));
    if (te) {
      threat.appendChild(h("div", { class: "enemy-head" },
        h("div", { class: "enemy-sigil", "aria-hidden": "true" }, te.def.name.charAt(0)),
        h("div", null,
          h("h2", null, te.def.name.toUpperCase()),
          h("div", { class: "subtle" }, "Real skill: ", h("b", null, te.def.skill)),
          h("div", { class: "subtle" }, "Misses: " + te.rec.misses + " · ", statusChip(te.status)))));
      threat.appendChild(h("p", { class: "rule" }, te.def.rule));
      threat.appendChild(h("button", { class: "btn", type: "button", onclick: function () { startRun("weakness"); } }, "Hunt it · Weakness Hunt"));
    } else if (weakTopic) {
      threat.appendChild(h("h2", null, weakTopic.topic));
      threat.appendChild(h("p", { class: "subtle" }, "No recurring enemy yet. Weakest skill so far: ", masteryChip(weakTopic.score)));
    } else {
      threat.appendChild(h("h2", null, "Unscouted"));
      threat.appendChild(h("p", { class: "subtle" }, "Your first run will reveal which mistakes keep coming back. Recurring errors become named enemies here."));
    }
    // Campaign status
    var camp = h("section", { class: "card campaign-status" }, h("div", { class: "eyebrow" }, "Midterm 2 campaign"));
    if (hasCur) {
      var topics = E.topics(current).map(function (t) { return t.topic; });
      camp.appendChild(h("h2", { class: "ok" }, "MIDTERM 2 CAMPAIGN ACTIVE"));
      camp.appendChild(h("p", { class: "subtle" }, current.length + " confirmed questions · " + preview.length + " preview · " + topics.length + " confirmed topics"));
      camp.appendChild(h("p", { class: "small" }, "Regions active: " + curRegions.map(function (r) { return r.def.name; }).join(", ")));
    } else {
      camp.appendChild(h("h2", null, "Awaiting confirmed material"));
      camp.appendChild(h("p", { class: "subtle" }, "Import the confirmed CHEM 233 content pack (Data → Import Content Pack) to open Substitution District and Elimination Ridge."));
      camp.appendChild(h("button", { class: "btn", type: "button", onclick: function () { go("data"); } }, "Import a content pack"));
    }
    el.appendChild(h("div", { class: "grid2" }, threat, camp));

    // Map
    el.appendChild(campaignMap(regions));

    // Training grounds
    var modes = [
      ["quick", "Quick Run", "5 encounters, ~10 min. 4 current + 1 maintenance."],
      ["mechanism", "Mechanism Grind", "Curved arrows, intermediates, proton transfers."],
      ["product", "Product Grind", "Predict products and classify reactions."],
      ["stereo", "Stereo Grind", "CIP, R/S, E/Z, inversion, anti-periplanar."],
      ["visual", "Visual Grind", "Structures, projections, labelled atoms."],
      ["weakness", "Weakness Hunt", "Due reviews and recurring enemies, MT1 + MT2."],
      ["boss", "Boss Battle", "Three phases. Recognition → transfer → production."],
      ["exam", "Exam Simulation", "Timed. No hints, no feedback until the end."],
      ["ahead", "Ahead of Class", "PREVIEW material. Does not affect readiness."]
    ];
    var grid = h("div", { class: "modes" });
    modes.forEach(function (m) {
      var isPrev = m[0] === "ahead";
      grid.appendChild(h("button", { class: "mode-tile" + (isPrev ? " preview" : "") + (m[0] === "boss" || m[0] === "exam" ? " major" : ""), type: "button", onclick: function () {
        if (m[0] === "boss") go("boss"); else if (m[0] === "exam") go("examSetup"); else startRun(m[0]);
      } }, h("span", { class: "mode-name" }, m[1]), h("span", { class: "mode-desc" }, m[2])));
    });
    el.appendChild(h("section", { class: "card" }, h("div", { class: "eyebrow" }, "Training grounds"), grid));
  }

  function campaignMap(regions) {
    var sec = h("section", { class: "card map-card" }, h("div", { class: "eyebrow" }, "Campaign map"));
    var path = h("ol", { class: "map" });
    regions.forEach(function (r, i) {
      var cls = "region " + r.status + (r.mastery >= 80 && r.status === "confirmed" ? " mastered" : "") + (r.bossBeaten ? " boss-down" : "");
      var tag = r.status === "confirmed" ? (r.def.id === "foundation" ? "MIDTERM 1 · CONFIRMED" : "CONFIRMED") : r.status === "preview" ? "PREVIEW" : "LOCKED";
      var node = h("li", { class: cls },
        h("button", { class: "region-btn", type: "button", disabled: r.status === "locked", onclick: function () { go("region", { id: r.def.id }); } },
          h("span", { class: "node", "aria-hidden": "true" }, h("span", { class: "node-inner" }, String(i + 1))),
          h("span", { class: "region-body" },
            h("span", { class: "region-tag" }, tag),
            h("span", { class: "region-name" }, r.def.name.toUpperCase()),
            h("span", { class: "region-sub" }, r.def.sub + (r.status !== "locked" ? " · " + r.attempted + "/" + r.questions.length + " attempted" : "")),
            r.status !== "locked" ? h("span", { class: "region-bar" }, h("span", { style: "width:" + r.mastery + "%" })) : null),
          h("span", { class: "region-right" },
            r.status !== "locked" ? masteryChip(r.mastery) : null,
            r.bossBeaten ? h("span", { class: "seal", title: "Boss defeated" }, "BOSS ✓") : null)));
      path.appendChild(node);
    });
    sec.appendChild(path);
    sec.appendChild(h("p", { class: "legend small" }, h("span", { class: "lg confirmed" }), "confirmed (counts toward readiness)  ", h("span", { class: "lg preview" }), "preview (practice only)  ", h("span", { class: "lg locked" }), "no material yet"));
    return sec;
  }

  /* ---------- region detail ---------- */

  function regionView(el) {
    var r = E.regions().filter(function (x) { return x.def.id === A.params.id; })[0];
    if (!r) return go("home");
    var preview = r.status === "preview";
    var card = h("section", { class: "card region-detail " + r.status },
      h("div", { class: "eyebrow" }, preview ? "PREVIEW REGION · does not affect confirmed readiness" : "Confirmed region"),
      h("h1", null, r.def.name),
      h("p", { class: "lead" }, r.def.sub),
      h("div", { class: "stats-row" },
        h("div", null, h("b", null, r.mastery + "%"), h("span", null, U.masteryLabel(r.mastery))),
        h("div", null, h("b", null, r.attempted + "/" + r.questions.length), h("span", null, "attempted")),
        h("div", null, h("b", null, preview ? "—" : (r.bossBeaten ? "DEFEATED" : r.bossTried ? "CHALLENGED" : "WAITING")), h("span", null, "boss: " + r.def.boss))));
    if (r.weakTopics.length) card.appendChild(h("p", null, "Weak subskills: ", r.weakTopics.map(function (t) { return t.topic + " (" + t.score + "%)"; }).join(", ")));
    var topics = E.topics(r.questions, preview).sort(function (a, b) { return a.score - b.score; });
    var list = h("ul", { class: "topic-list" });
    topics.forEach(function (t) { list.appendChild(h("li", null, h("span", null, t.topic), masteryChip(t.score))); });
    card.appendChild(list);
    var row = h("div", { class: "row" },
      h("button", { class: "btn primary", type: "button", onclick: function () { startRun("region", { region: r.def.id }); } }, preview ? "Explore (preview)" : "Train here"));
    if (!preview && r.questions.length >= 4) row.appendChild(h("button", { class: "btn", type: "button", onclick: function () { startRun("boss", { region: r.def.id }); } }, "Challenge " + r.def.boss));
    row.appendChild(h("button", { class: "btn ghost", type: "button", onclick: function () { go("home"); } }, "Back"));
    card.appendChild(row);
    el.appendChild(card);
  }

  /* ---------- starting runs ---------- */

  function startRun(mode, opts) {
    E.dayRollover();
    var existing = E.state.activeRun;
    var begin = function () {
      var run = E.buildRun(mode, opts || {});
      if (!run || !run.queue.length) {
        notice("warn", mode === "ahead" ? "No preview questions yet. Import the Ahead-of-Class preview pack from Data." : "No questions available for this mode yet.");
        return go("home");
      }
      E.state.activeRun = run;
      save();
      go(run.mode === "boss" ? "bossIntro" : "run");
    };
    if (existing && existing.index < existing.queue.length && existing.answers.length) {
      return confirmModal("Replace the run in progress?", "“" + existing.label + "” is at question " + (existing.index + 1) + ". Starting a new run abandons it (answers already given stay recorded).", "Start new run", begin);
    }
    begin();
  }

  function curRun() { return E.state.activeRun; }

  function bossIntroView(el) {
    var run = curRun();
    if (!run) return go("home");
    el.appendChild(h("section", { class: "card boss-intro" },
      h("div", { class: "eyebrow" }, "Boss battle"),
      h("h1", { class: "boss-name" }, run.bossName.toUpperCase()),
      h("p", { class: "lead" }, "Guardian of " + run.bossSkill + ". " + run.queue.length + " strikes across three phases."),
      h("ol", { class: "phases" },
        h("li", null, h("b", null, "Phase I — Recognition."), " Rules and classification."),
        h("li", null, h("b", null, "Phase II — Unfamiliar structures."), " Stereo, structure and product reading."),
        h("li", null, h("b", null, "Phase III — Production."), " Mechanisms and written answers.")),
      h("p", { class: "subtle" }, "Correct answers damage the boss; minor errors do half damage; misses do none. Hints are allowed but cost XP and the No Hint Needed trophy."),
      h("div", { class: "row" },
        h("button", { class: "btn primary big", type: "button", onclick: function () { go("run"); } }, "ENGAGE"),
        h("button", { class: "btn ghost", type: "button", onclick: function () { E.state.activeRun = null; save(); go("home"); } }, "Retreat"))));
  }

  /* ---------- RUN (question) ---------- */

  function freshCur(run, q) {
    var cur = { qid: q.id, hints: 0, confidence: 0, choice: null, text: "", atom: null, revealed: false, pending: null, feedback: null, graded: false };
    if (q.type === "choice") {
      var keep = q.choices.some(function (c) { return /^(true|false)$/i.test(c) || /all of the above|none of the above/i.test(c); });
      cur.order = keep ? q.choices.slice() : U.shuffle(q.choices);
    }
    if (q.type === "rank") {
      var order = U.shuffle(q.items);
      var guard = 0;
      while (order.join("|") === q.answer.join("|") && guard++ < 5) order = U.shuffle(q.items);
      cur.rank = order;
    }
    if (run.mode === "recovery" && C.hints(q).length) cur.hints = 1;
    return cur;
  }

  function skipBrokenQuestion() {
    var run = curRun();
    if (!run) return go("home");
    run.index += 1; run.cur = null; run.phase = "question";
    save();
    if (run.index >= run.queue.length) return finishCurrentRun();
    go("run");
  }

  function runView(el) {
    var run = curRun();
    if (!run) return go("home");
    if (run.mode === "exam" && run.exam && run.exam.finished) return go("examGrade");
    if (run.index >= run.queue.length) return finishCurrentRun();
    var item = run.queue[run.index];
    var q = E.q(item.id);
    if (!q) {
      el.appendChild(h("section", { class: "card" }, h("h2", null, "Question unavailable"), h("p", null, "Question “" + item.id + "” is no longer in the bank."), h("button", { class: "btn", type: "button", onclick: skipBrokenQuestion }, "Skip")));
      return;
    }
    if (!run.cur || run.cur.qid !== q.id) run.cur = freshCur(run, q);
    var isExam = run.mode === "exam";

    el.appendChild(runHud(run));
    if (run.mode === "ahead" || C.isPreview(q)) el.appendChild(h("div", { class: "preview-banner" }, "PREVIEW MATERIAL · Does not affect confirmed Midterm 2 readiness."));

    var enc = E.ENC[item.enc] || E.ENC.drill;
    var region = C.regionIdsFor(q)[0];
    var regionDef = C.REGIONS.filter(function (r) { return r.id === region; })[0];
    var card = h("section", { class: "card encounter enc-" + item.enc + (run.mode === "boss" ? " boss" : "") });
    card.appendChild(h("div", { class: "enc-head" },
      h("span", { class: "eyebrow" }, isExam ? "Question " + (run.index + 1) + " of " + run.queue.length : "Encounter " + (run.index + 1) + " · " + enc.name + (item.inserted ? " (near-transfer)" : "")),
      h("span", { class: "enc-tags" },
        h("span", { class: "chip " + (C.isPreview(q) ? "st-preview" : C.isCurrentMT2(q) ? "st-current" : "st-mt1") }, C.isPreview(q) ? "PREVIEW" : C.isCurrentMT2(q) ? "MT2" : "MT1"),
        h("span", { class: "diff", title: "Difficulty " + q.difficulty }, "◆◆◆◆◆".slice(0, q.difficulty)))));
    if (!isExam && enc.line) card.appendChild(h("p", { class: "enc-line" }, enc.line + (regionDef && run.index === 0 ? " " + regionLine(regionDef.id) : "")));
    card.appendChild(h("div", { class: "topic-line" }, q.topic));
    card.appendChild(h("p", { class: "qtext" }, q.question));
    if (q.context) card.appendChild(h("p", { class: "qcontext" }, String(q.context)));
    if (q.structure && q.type !== "select-atom") card.appendChild(structureSvg(q, null, false));

    var phase = run.phase || "question";
    if (isExam) buildExamInputs(card, run, q);
    else if (phase === "question") buildInputs(card, run, q);
    else buildFeedback(card, run, q);
    el.appendChild(card);
    if (isExam) startExamTimer();
  }

  function regionLine(id) {
    return ({ foundation: "The Foundation Archives stir: old rules, new structures.", substitution: "Your nucleophile enters Substitution District.",
      elimination: "An anti-periplanar gate blocks the path.", carbonyl: "The carbonyl carbon glints in the dark: electrophilic.",
      carbohydrate: "The Labyrinth folds back on itself.", acyl: "The Citadel guards its leaving groups." })[id] || "";
  }

  function runHud(run) {
    var hud = h("div", { class: "run-hud" + (run.mode === "boss" ? " boss" : "") });
    hud.appendChild(h("div", { class: "run-title" }, run.label));
    var pips = h("ol", { class: "pips", "aria-label": "Run progress" });
    run.queue.forEach(function (it, i) {
      var a = run.answers[i];
      var cls = "pip";
      if (run.mode !== "exam" && a) cls += a.result === "correct" ? " ok" : a.result === "minor" ? " part" : " bad";
      else if (run.mode === "exam" && i < run.index) cls += " done";
      if (i === run.index) cls += " now";
      if (it.enc === "miniboss" || it.enc === "phase3") cls += " big";
      pips.appendChild(h("li", { class: cls, title: (E.ENC[it.enc] || E.ENC.drill).name }));
    });
    hud.appendChild(pips);
    if (run.mode === "boss") {
      var item = run.queue[Math.min(run.index, run.queue.length - 1)];
      hud.appendChild(h("div", { class: "bossbar" },
        h("div", { class: "boss-label" }, run.bossName + " · Phase " + ["I", "II", "III"][(item.phase || 1) - 1]),
        h("div", { class: "hp" }, h("span", { style: "width:" + run.bossHp + "%" })),
        h("div", { class: "hp-num" }, Math.round(run.bossHp) + "%")));
    }
    if (run.mode === "exam") {
      hud.appendChild(h("div", { class: "exam-meta" },
        h("span", { id: "exam-timer", class: "timer" }, run.exam.deadline ? U.formatTime(run.exam.deadline - Date.now()) : "Untimed · " + U.formatTime(Date.now() - run.startedAt)),
        h("button", { class: "btn ghost small", type: "button", onclick: function () {
          confirmModal("Submit the exam now?", "Unanswered questions score zero. You will then grade your written answers.", "Submit exam", endExam);
        } }, "Submit exam")));
    } else {
      hud.appendChild(h("div", { class: "run-stats" },
        h("span", { class: "combo" + (run.combo >= 2 ? " hot" : "") }, run.combo >= 2 ? "COMBO x" + run.combo : "COMBO —"),
        h("span", null, "+" + run.xpEarned + " XP"),
        run.mode === "recovery" ? h("span", { class: "chip st-recovery" }, "RECOVERY") : null));
    }
    return hud;
  }

  function confidencePicker(run) {
    var wrap = h("div", { class: "confidence", role: "group", "aria-label": "Confidence" }, h("span", { class: "small subtle" }, "Confidence:"));
    [[1, "Guess"], [2, "Unsure"], [3, "Sure"]].forEach(function (c) {
      wrap.appendChild(h("button", { class: "conf" + (run.cur.confidence === c[0] ? " on" : ""), type: "button", "aria-pressed": run.cur.confidence === c[0] ? "true" : "false", onclick: function () { run.cur.confidence = c[0]; rerenderKeepScroll(); } }, c[1]));
    });
    return wrap;
  }

  function rerenderKeepScroll() {
    var y = window.pageYOffset || 0;
    var active = document.activeElement && document.activeElement.id;
    render();
    try { window.scrollTo(0, y); } catch (e) { /* ignore */ }
    if (active) { var el = document.getElementById(active); if (el) el.focus(); }
  }

  function buildAnswerArea(card, run, q, examMode) {
    var cur = run.cur;
    if (q.type === "choice") {
      var list = h("div", { class: "choices", role: "radiogroup" });
      cur.order.forEach(function (c, i) {
        list.appendChild(h("button", { class: "choice" + (cur.choice === c ? " on" : ""), type: "button", role: "radio", "aria-checked": cur.choice === c ? "true" : "false",
          onclick: function () { cur.choice = c; rerenderKeepScroll(); } }, h("span", { class: "key" }, String.fromCharCode(65 + i)), h("span", null, c)));
      });
      card.appendChild(list);
    } else if (q.type === "text") {
      var input = h("input", { id: "answer-input", class: "input", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "Type your answer", value: cur.text || "" });
      input.addEventListener("input", function () { cur.text = input.value; });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); var b = document.getElementById("commit-btn"); if (b) b.click(); } });
      card.appendChild(h("label", { class: "small subtle", for: "answer-input" }, "Written answer (no choices given)"));
      card.appendChild(input);
    } else if (q.type === "rank") {
      card.appendChild(h("p", { class: "small subtle" }, "Order the list using the arrows (top = first)."));
      var ol = h("ol", { class: "rank" });
      cur.rank.forEach(function (item, i) {
        ol.appendChild(h("li", null,
          h("span", { class: "rank-n" }, String(i + 1)),
          h("span", { class: "rank-t" }, item),
          h("span", { class: "rank-ctl" },
            h("button", { class: "icon", type: "button", "aria-label": "Move up", disabled: i === 0, onclick: function () { swap(cur.rank, i, i - 1); rerenderKeepScroll(); } }, "↑"),
            h("button", { class: "icon", type: "button", "aria-label": "Move down", disabled: i === cur.rank.length - 1, onclick: function () { swap(cur.rank, i, i + 1); rerenderKeepScroll(); } }, "↓"))));
      });
      card.appendChild(ol);
    } else if (q.type === "select-atom") {
      card.appendChild(h("p", { class: "small subtle" }, "Tap an atom to select it." + (cur.atom ? " Selected: " + cur.atom : "")));
      card.appendChild(structureSvg(q, cur.atom, true, function (id) { cur.atom = id; rerenderKeepScroll(); }));
    } else if (q.type === "draw") {
      card.appendChild(h("div", { class: "paper-note" }, h("b", null, "Work on paper or iPad."), examMode ? " Write your full answer, then continue. The rubric appears only after the exam ends." : " Commit to a full answer before revealing the rubric. Then grade yourself honestly."));
      if (examMode) {
        var notes = h("textarea", { id: "draw-notes", class: "input", rows: "2", placeholder: "Optional: a short note of what you drew (for your review)" });
        notes.value = cur.text || "";
        notes.addEventListener("input", function () { cur.text = notes.value; });
        card.appendChild(notes);
      }
    }
  }

  function swap(arr, i, j) { var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }

  function buildInputs(card, run, q) {
    var cur = run.cur;
    buildAnswerArea(card, run, q, false);

    // Hints
    var hints = C.hints(q);
    if (cur.hints > 0) {
      var hl = h("ol", { class: "hints" });
      for (var i = 0; i < cur.hints && i < hints.length; i++) hl.appendChild(h("li", null, h("b", null, "Hint " + (i + 1) + (run.mode === "recovery" && i === 0 ? " (free scaffold)" : "") + ": "), hints[i]));
      card.appendChild(hl);
    }
    card.appendChild(confidencePicker(run));
    var potential = E.potentialXP(q, run.mode === "recovery" ? 0 : cur.hints, run.mode);
    var actions = h("div", { class: "row actions" });
    if (cur.hints < hints.length) {
      var n = cur.hints;
      var cost = run.mode === "recovery" ? "free" : "−" + C.HINT_COST[n] + " XP";
      actions.appendChild(h("button", { class: "btn ghost", type: "button", id: "hint-btn", onclick: function () { cur.hints = n + 1; save(); rerenderKeepScroll(); } }, "Hint " + (n + 1) + " (" + cost + ")"));
    }
    var label = q.type === "draw" ? "Reveal answer & rubric" : "Commit answer";
    actions.appendChild(h("button", { class: "btn primary", type: "button", id: "commit-btn", onclick: function () { commit(run, q); } }, label));
    actions.appendChild(h("span", { class: "potential" }, "Potential: " + potential + " XP"));
    card.appendChild(actions);
    if (cur.error) card.appendChild(h("p", { class: "error-text", role: "alert" }, cur.error));
  }

  function commit(run, q) {
    var cur = run.cur;
    cur.error = null;
    if (!cur.confidence && q.type !== "draw") cur.confidence = 2;
    var supplied = "", correct = false;
    if (q.type === "choice") {
      if (cur.choice === null) { cur.error = "Choose an answer first."; return rerenderKeepScroll(); }
      supplied = cur.choice; correct = U.normalizeAnswer(cur.choice) === U.normalizeAnswer(q.answer);
    } else if (q.type === "text") {
      if (!String(cur.text || "").trim()) { cur.error = "Type an answer first."; return rerenderKeepScroll(); }
      supplied = cur.text;
      correct = q.acceptedAnswers.some(function (a) { return U.normalizeAnswer(a) === U.normalizeAnswer(cur.text); });
      if (!correct) { cur.pending = { supplied: supplied }; run.phase = "feedback"; save(); return rerenderKeepScroll(); }
    } else if (q.type === "rank") {
      supplied = cur.rank.join(" → "); correct = cur.rank.join("|") === q.answer.join("|");
    } else if (q.type === "select-atom") {
      if (!cur.atom) { cur.error = "Select an atom first."; return rerenderKeepScroll(); }
      supplied = "Atom " + cur.atom; correct = cur.atom === q.answer;
    } else if (q.type === "draw") {
      if (!cur.confidence) cur.confidence = 2;
      cur.revealed = true; run.phase = "feedback"; save();
      return rerenderKeepScroll();
    }
    applyOutcome(run, q, { result: correct ? "correct" : "wrong", supplied: supplied });
  }

  function applyOutcome(run, q, o) {
    var cur = run.cur;
    var hints = run.mode === "recovery" ? 0 : cur.hints;
    var fb = E.recordAnswer(run, q, { result: o.result, confidence: cur.confidence || 2, hints: hints, supplied: o.supplied, override: o.override });
    fb.supplied = o.supplied;
    cur.feedback = fb; cur.pending = null; cur.graded = true;
    run.phase = "feedback";
    save();
    rerenderKeepScroll();
    if (fb.xp) toast("+" + fb.xp + " XP" + (fb.combo >= 2 ? "  ·  COMBO x" + fb.combo : ""), "xp");
    if (fb.heartLost) { var hearts = document.getElementById("hearts"); if (hearts) hearts.classList.add("lose"); }
    (fb.achievements || []).forEach(function (a) { toast("ACHIEVEMENT · " + a.name, "ach"); });
  }

  function rubricBlock(q) {
    var r = C.rubric(q);
    var box = h("div", { class: "rubric" });
    if (r.answer) box.appendChild(h("div", { class: "rubric-answer" }, h("div", { class: "eyebrow" }, "Model answer"), h("p", null, r.answer)));
    [["FULL CREDIT", r.full, "full"], ["MINOR ERROR", r.minor, "minor"], ["MAJOR ERROR", r.major, "major"]].forEach(function (sec) {
      var ul = h("ul", null);
      sec[1].forEach(function (x) { ul.appendChild(h("li", null, x)); });
      box.appendChild(h("div", { class: "rubric-sec " + sec[2] }, h("div", { class: "rubric-h" }, sec[0]), ul));
    });
    return box;
  }

  function buildFeedback(card, run, q) {
    var cur = run.cur;
    // Draw: rubric then self-grade
    if (q.type === "draw" && !cur.graded) {
      card.appendChild(rubricBlock(q));
      card.appendChild(h("p", { class: "small subtle" }, "Compare your paper answer with the rubric. How did it go?"));
      var g = h("div", { class: "grade-row" });
      [["correct", "I got it correct", "primary"], ["minor", "Minor mistake", ""], ["major", "Major mistake", ""], ["stuck", "I was completely stuck", "danger"]].forEach(function (b) {
        g.appendChild(h("button", { class: "btn " + b[2], type: "button", onclick: function () { applyOutcome(run, q, { result: b[0], supplied: "self-graded: " + b[0] }); } }, b[1]));
      });
      card.appendChild(g);
      return;
    }
    // Text mismatch: let the learner judge equivalence before recording.
    if (q.type === "text" && cur.pending && !cur.graded) {
      card.appendChild(h("div", { class: "verdict warn" }, h("b", null, "Not an exact match.")));
      card.appendChild(h("p", null, "Your answer: ", h("span", { class: "mono" }, cur.pending.supplied)));
      card.appendChild(h("p", null, "Accepted: ", h("span", { class: "mono" }, q.acceptedAnswers.join("  |  "))));
      card.appendChild(h("div", { class: "row" },
        h("button", { class: "btn", type: "button", onclick: function () { applyOutcome(run, q, { result: "wrong", supplied: cur.pending.supplied }); } }, "Mark it wrong"),
        h("button", { class: "btn ghost", type: "button", onclick: function () { applyOutcome(run, q, { result: "correct", supplied: cur.pending.supplied, override: true }); } }, "My answer means the same (reduced XP)")));
      return;
    }
    var fb = cur.feedback;
    if (!fb) { run.phase = "question"; return buildInputs(card, run, q); }
    if (q.type === "draw") card.appendChild(rubricBlock(q));
    var verdicts = { correct: ["CORRECT", "good"], minor: ["MINOR ERROR", "warn"], major: ["MAJOR ERROR", "bad"], stuck: ["STUCK — QUEUED FOR EARLY REVIEW", "bad"], wrong: ["INCORRECT", "bad"] };
    var v = verdicts[fb.result] || verdicts.wrong;
    var head = h("div", { class: "verdict " + v[1] }, h("b", null, v[0]),
      h("span", { class: "fb-xp" }, "+" + fb.xp + " XP"),
      fb.combo >= 2 ? h("span", { class: "fb-combo" }, "COMBO x" + fb.combo) : null,
      fb.comboBroken ? h("span", { class: "fb-break" }, "COMBO x" + fb.comboBroken + " BROKEN") : null,
      fb.heartLost ? h("span", { class: "fb-heart" }, "−♥") : null);
    card.appendChild(head);
    if (fb.bonus && fb.bonus.length) card.appendChild(h("div", { class: "bonus" }, fb.bonus.join("  ·  ")));
    var body = h("div", { class: "fb-body" });
    if (fb.result !== "correct" && q.type !== "draw") body.appendChild(h("p", null, h("b", null, "Answer: "), C.answerText(q)));
    if (q.explanation) body.appendChild(h("p", null, h("b", null, "Why: "), q.explanation));
    body.appendChild(h("p", { class: "keyrule" }, h("b", null, "Key rule: "), q.keyRule || (fb.enemy ? fb.enemy.rule : "")));
    var deltas = (fb.masteryDeltas || []).filter(function (d) { return d.after !== d.before; }).slice(0, 2);
    if (deltas.length) body.appendChild(h("p", { class: "small" }, deltas.map(function (d) { return d.key + " " + (d.after >= d.before ? "+" : "") + (d.after - d.before) + " mastery"; }).join("  ·  ")));
    if (fb.enemyEvent && fb.enemy) body.appendChild(h("p", { class: "small enemy-event" }, h("b", null, fb.enemy.name.toUpperCase()), " (" + fb.enemy.skill + ") — " + fb.enemyEvent));
    if (fb.repair) body.appendChild(h("p", { class: "small subtle" }, "Near-transfer repair scheduled: " + fb.repair.topic + " (" + fb.repair.when + ")" + (fb.repair.inRun ? "; a related rematch was added later in this run." : ".")));
    if (run.mode === "boss" && typeof fb.bossHp === "number") body.appendChild(h("p", { class: "small" }, fb.result === "correct" ? "Strike lands. Boss at " + Math.round(fb.bossHp) + "%." : fb.result === "minor" ? "Glancing blow. Boss at " + Math.round(fb.bossHp) + "%." : "The boss shrugs it off."));
    card.appendChild(body);
    var last = run.index + 1 >= run.queue.length;
    var needRecovery = E.state.hearts === 0 && run.mode !== "recovery" && run.mode !== "exam";
    card.appendChild(h("div", { class: "row actions" }, h("button", { class: "btn primary", id: "next-btn", type: "button", onclick: function () { nextQuestion(); } },
      needRecovery ? "Next → Recovery Room" : last ? "Finish run" : "Next")));
  }

  function nextQuestion() {
    var run = curRun();
    if (!run) return go("home");
    run.index += 1; run.cur = null; run.phase = "question";
    if (E.state.hearts === 0 && run.mode !== "recovery" && run.mode !== "exam") {
      save();
      return go("recoveryIntro");
    }
    save();
    if (run.index >= run.queue.length) return finishCurrentRun();
    go("run");
  }

  /* ---------- recovery ---------- */

  function recoveryIntroView(el) {
    var parent = curRun();
    if (!parent) return go("home");
    el.appendChild(h("section", { class: "card recovery" },
      h("div", { class: "eyebrow" }, "Hearts depleted"),
      h("h1", null, "RECOVERY ROOM"),
      h("p", { class: "lead" }, "Three scaffolded problems on what you just missed. Hint 1 is shown free; further hints cost nothing here."),
      h("p", { class: "subtle" }, "Finish to restore at least one heart and return to “" + parent.label + "”."),
      h("button", { class: "btn primary big", type: "button", onclick: function () {
        var rec = E.buildRun("recovery", { parent: parent });
        if (!rec) {
          E.state.hearts = Math.max(1, E.state.hearts);
          save();
          notice("info", "No related recovery questions were available; one heart restored.");
          return parent.index >= parent.queue.length ? finishCurrentRun() : go("run");
        }
        rec.parent = parent;
        E.state.activeRun = rec;
        save();
        go("run");
      } }, "ENTER RECOVERY ROOM")));
  }

  function finishRecovery(rec) {
    var correct = rec.answers.filter(function (a) { return a.result === "correct"; }).length;
    var restore = correct >= 2 ? 2 : 1;
    E.state.hearts = Math.min(S.MAX_HEARTS, Math.max(E.state.hearts, restore));
    var parent = rec.parent;
    E.state.activeRun = parent || null;
    save();
    A.recoveryResult = { correct: correct, total: rec.answers.length, hearts: E.state.hearts, parentLabel: parent ? parent.label : null };
    go("recoveryDone");
  }

  function recoveryDoneView(el) {
    var r = A.recoveryResult || { correct: 0, total: 0, hearts: E.state.hearts };
    var parent = curRun();
    el.appendChild(h("section", { class: "card recovery" },
      h("div", { class: "eyebrow" }, "Recovery complete"),
      h("h1", null, "STABILIZED"),
      h("p", { class: "lead" }, r.correct + " of " + r.total + " repaired · hearts restored to " + r.hearts),
      h("p", { class: "subtle" }, "Missed skills stay on tomorrow's review list."),
      h("button", { class: "btn primary big", type: "button", onclick: function () {
        if (!parent) return go("home");
        if (parent.index >= parent.queue.length) return finishCurrentRun();
        go("run");
      } }, parent ? "RETURN TO " + parent.label.toUpperCase() : "BACK TO BASE")));
  }

  /* ---------- run complete ---------- */

  function finishCurrentRun() {
    var run = curRun();
    if (!run) return go("home");
    if (run.mode === "recovery") return finishRecovery(run);
    if (run.mode === "exam") return endExam();
    var summary = E.finishRun(run);
    summary.label = run.label; summary.mode = run.mode; summary.bossName = run.bossName;
    E.state.activeRun = null;
    save();
    A.summary = summary;
    go("complete");
  }

  function completeView(el) {
    var s = A.summary;
    if (!s) return go("home");
    var isBoss = s.mode === "boss";
    var card = h("section", { class: "card complete" + (isBoss ? " boss" : "") },
      h("div", { class: "eyebrow" }, isBoss ? (s.bossDefeated ? "Boss defeated" : "Boss survives") : s.label + " \u00b7 daily chest"),
      h("h1", null, isBoss ? s.bossName.toUpperCase() : "RUN COMPLETE"),
      h("div", { class: "big-score" }, s.score + "%"),
      h("div", { class: "stats-row" },
        h("div", null, h("b", null, "+" + s.xp), h("span", null, "XP earned")),
        h("div", null, h("b", null, "x" + s.peakCombo), h("span", null, "peak combo")),
        h("div", null, h("b", null, s.hearts + "♥"), h("span", null, "hearts left")),
        h("div", null, h("b", null, s.streak + "d"), h("span", null, "streak")),
        isBoss ? h("div", null, h("b", null, s.bossHp + "%"), h("span", null, "boss HP left")) : null));
    if (s.bonus.length) card.appendChild(h("div", { class: "bonus center" }, s.bonus.join("  ·  ")));
    if (s.masteryChanges.length) {
      var ul = h("ul", { class: "changes" });
      s.masteryChanges.forEach(function (c) { ul.appendChild(h("li", null, h("span", null, c.key), h("span", { class: c.after >= c.before ? "up" : "down" }, c.before + "% → " + c.after + "% · " + U.masteryLabel(c.after)))); });
      card.appendChild(h("div", null, h("div", { class: "eyebrow" }, "Mastery changes"), ul));
    }
    if (s.enemyEvents.length) {
      var eu = h("ul", { class: "changes" });
      s.enemyEvents.forEach(function (e) { eu.appendChild(h("li", null, h("span", null, e.def.name + " (" + e.def.skill + ")"), statusChip(e.status))); });
      card.appendChild(h("div", null, h("div", { class: "eyebrow" }, "Enemy progress"), eu));
    }
    if (s.achievements.length) card.appendChild(h("div", { class: "ach-unlock" }, "ACHIEVEMENT UNLOCKED: " + s.achievements.join(", ")));
    var rd = s.readiness;
    if (s.mode !== "ahead" && rd && (rd.mt2After !== rd.mt2Before || rd.finalAfter !== rd.finalBefore)) {
      card.appendChild(h("p", { class: "small" }, "Readiness: Midterm 2 " + fmtPct(rd.mt2Before) + " → " + fmtPct(rd.mt2After) + " · Final " + fmtPct(rd.finalBefore) + " → " + fmtPct(rd.finalAfter)));
    }
    if (s.mode === "ahead") card.appendChild(h("p", { class: "small subtle" }, "Preview practice does not change confirmed readiness."));
    if (s.nextThreat) card.appendChild(h("p", { class: "next-threat" }, h("b", null, "Scheduled for review: "), s.nextThreat.topic + (s.nextThreat.due ? " (" + (s.nextThreat.due === U.addDays(U.today(), 1) ? "tomorrow" : s.nextThreat.due) + ")" : "") + " — " + s.nextThreat.enemy.name));
    card.appendChild(h("div", { class: "row center" },
      h("button", { class: "btn primary", type: "button", onclick: function () { go("home"); } }, "Back to base"),
      h("button", { class: "btn", type: "button", onclick: function () { startRun("quick"); } }, "Quick run")));
    el.appendChild(card);
  }

  function fmtPct(v) { return v === null || v === undefined ? "—" : v + "%"; }

  /* ---------- boss select ---------- */

  function bossView(el) {
    var opts = E.bossOptions();
    var card = h("section", { class: "card" }, h("div", { class: "eyebrow" }, "Boss battle"), h("h1", null, "Choose your opponent"),
      h("p", { class: "subtle" }, "Bosses use confirmed material only: ~75% from the region, the rest cumulative prerequisites."));
    if (!opts.length) card.appendChild(h("p", null, "No confirmed region has enough questions yet."));
    var list = h("div", { class: "boss-list" });
    opts.forEach(function (r) {
      var best = E.state.bossResults.filter(function (b) { return b.bossId === r.def.id; }).reduce(function (m, b) { return Math.max(m, b.percent); }, -1);
      list.appendChild(h("button", { class: "boss-tile", type: "button", onclick: function () { startRun("boss", { region: r.def.id }); } },
        h("span", { class: "boss-tile-name" }, r.def.boss.toUpperCase()),
        h("span", { class: "small" }, r.def.name + " · " + r.def.bossSkill),
        h("span", { class: "small subtle" }, best >= 0 ? "Best: " + best + "%" + (best >= 80 ? " · DEFEATED" : "") : "Not yet challenged"),
        masteryChip(r.mastery)));
    });
    card.appendChild(list);
    card.appendChild(h("button", { class: "btn ghost", type: "button", onclick: function () { go("home"); } }, "Back"));
    el.appendChild(card);
  }

  /* ---------- exam ---------- */

  function examSetupView(el) {
    var hasCur = E.hasCurrent();
    var cfg = A.examCfg || (A.examCfg = { scope: hasCur ? "mt2" : "final", count: 15, timer: 30 });
    function opt(group, value, label) {
      return h("button", { class: "seg" + (cfg[group] === value ? " on" : ""), type: "button", onclick: function () { cfg[group] = value; rerenderKeepScroll(); } }, label);
    }
    el.appendChild(h("section", { class: "card exam-setup" },
      h("div", { class: "eyebrow" }, "Exam simulation"),
      h("h1", null, "Closed book. No hints. No feedback."),
      h("p", { class: "subtle" }, "Everything is scored at the end. Written and mechanism answers are self-graded against the rubric only after you submit. Confirmed material only."),
      h("div", { class: "field" }, h("span", null, "Scope"), h("div", { class: "segs" },
        hasCur ? opt("scope", "mt2", "Midterm 2 (~85% current + MT1)") : null, opt("scope", "final", "Final (all confirmed)"))),
      h("div", { class: "field" }, h("span", null, "Questions"), h("div", { class: "segs" }, opt("count", 10, "10"), opt("count", 15, "15"), opt("count", 20, "20"), opt("count", 25, "25"))),
      h("div", { class: "field" }, h("span", null, "Timer"), h("div", { class: "segs" }, opt("timer", 0, "Off"), opt("timer", 15, "15 min"), opt("timer", 30, "30 min"), opt("timer", 45, "45 min"), opt("timer", 60, "60 min"), opt("timer", 90, "90 min"))),
      h("div", { class: "row" },
        h("button", { class: "btn primary big", type: "button", onclick: function () { startRun("exam", { scope: cfg.scope, count: cfg.count, timerMinutes: cfg.timer }); } }, "BEGIN EXAM"),
        h("button", { class: "btn ghost", type: "button", onclick: function () { go("home"); } }, "Back"))));
  }

  function buildExamInputs(card, run, q) {
    run.examAnswers = run.examAnswers || {};
    buildAnswerArea(card, run, q, true);
    card.appendChild(confidencePicker(run));
    var cur = run.cur;
    var last = run.index + 1 >= run.queue.length;
    card.appendChild(h("div", { class: "row actions" },
      h("button", { class: "btn primary", id: "commit-btn", type: "button", onclick: function () { examSave(run, q, false); } }, q.type === "draw" ? (last ? "Done — finish exam" : "Done — next") : (last ? "Save & finish exam" : "Save & next")),
      h("button", { class: "btn ghost", type: "button", onclick: function () { examSave(run, q, true); } }, "Skip")));
    if (cur.error) card.appendChild(h("p", { class: "error-text", role: "alert" }, cur.error));
  }

  function examSave(run, q, skip) {
    var cur = run.cur;
    cur.error = null;
    var rec = { type: q.type, confidence: cur.confidence || 2 };
    if (skip) rec.skipped = true;
    else if (q.type === "choice") { if (cur.choice === null) { cur.error = "Choose an answer or press Skip."; return rerenderKeepScroll(); } rec.supplied = cur.choice; rec.auto = U.normalizeAnswer(cur.choice) === U.normalizeAnswer(q.answer); }
    else if (q.type === "text") { if (!String(cur.text || "").trim()) { cur.error = "Type an answer or press Skip."; return rerenderKeepScroll(); } rec.supplied = cur.text; rec.auto = q.acceptedAnswers.some(function (a) { return U.normalizeAnswer(a) === U.normalizeAnswer(cur.text); }); }
    else if (q.type === "rank") { rec.supplied = cur.rank.join(" → "); rec.auto = cur.rank.join("|") === q.answer.join("|"); }
    else if (q.type === "select-atom") { if (!cur.atom) { cur.error = "Select an atom or press Skip."; return rerenderKeepScroll(); } rec.supplied = "Atom " + cur.atom; rec.auto = cur.atom === q.answer; }
    else if (q.type === "draw") { rec.supplied = cur.text || "(on paper)"; rec.needsGrade = true; }
    run.examAnswers[q.id] = rec;
    run.index += 1; run.cur = null;
    save();
    if (run.index >= run.queue.length) return endExam();
    go("run");
  }

  function startExamTimer() {
    var run = curRun();
    stopTimer();
    if (!run || run.mode !== "exam") return;
    A.timer = setInterval(function () {
      var r = curRun();
      var el = document.getElementById("exam-timer");
      if (!r || r.mode !== "exam") return stopTimer();
      if (r.exam.deadline) {
        var left = r.exam.deadline - Date.now();
        if (el) { el.textContent = U.formatTime(left); el.className = "timer" + (left < 120000 ? " low" : ""); }
        if (left <= 0) { stopTimer(); notice("warn", "Time is up. The exam was submitted automatically."); endExam(); }
      } else if (el) el.textContent = "Untimed · " + U.formatTime(Date.now() - r.startedAt);
    }, 1000);
  }
  function stopTimer() { if (A.timer) { clearInterval(A.timer); A.timer = null; } }

  function endExam() {
    var run = curRun();
    if (!run || run.mode !== "exam") return go("home");
    stopTimer();
    if (!run.exam.finished) { run.exam.finished = true; run.exam.endedAt = Date.now(); }
    run.examAnswers = run.examAnswers || {};
    run.examGrades = run.examGrades || {};
    save();
    go("examGrade");
  }

  function examGradeView(el) {
    var run = curRun();
    if (!run || run.mode !== "exam") return go("home");
    var ans = run.examAnswers, grades = run.examGrades;
    var drawQs = [], textQs = [];
    run.queue.forEach(function (it) {
      var q = E.q(it.id), a = ans[it.id];
      if (!q || !a || a.skipped) return;
      if (q.type === "draw") drawQs.push(q);
      else if (q.type === "text" && !a.auto) textQs.push(q);
    });
    var card = h("section", { class: "card" }, h("div", { class: "eyebrow" }, "Exam ended · " + U.formatTime(run.exam.endedAt - run.startedAt) + " used"),
      h("h1", null, "Grade your written answers"),
      h("p", { class: "subtle" }, drawQs.length ? "Rubrics are now visible. Grade each mechanism/drawing answer honestly." : "No drawing answers to grade."));
    drawQs.forEach(function (q, i) {
      var box = h("div", { class: "grade-item" }, h("div", { class: "eyebrow" }, "Written " + (i + 1) + " · " + q.topic), h("p", { class: "qtext" }, q.question));
      if (ans[q.id].supplied && ans[q.id].supplied !== "(on paper)") box.appendChild(h("p", { class: "small" }, "Your note: ", h("span", { class: "mono" }, ans[q.id].supplied)));
      box.appendChild(rubricBlock(q));
      var row = h("div", { class: "grade-row" });
      [["correct", "Correct"], ["minor", "Minor mistake"], ["major", "Major mistake"], ["stuck", "Stuck / blank"]].forEach(function (b) {
        row.appendChild(h("button", { class: "btn" + (grades[q.id] === b[0] ? " primary" : ""), type: "button", "aria-pressed": grades[q.id] === b[0] ? "true" : "false", onclick: function () { grades[q.id] = b[0]; save(); rerenderKeepScroll(); } }, b[1]));
      });
      box.appendChild(row);
      card.appendChild(box);
    });
    if (textQs.length) {
      card.appendChild(h("h3", null, "Written answers that did not match the key"));
      textQs.forEach(function (q) {
        var a = ans[q.id];
        var cb = h("input", { type: "checkbox", id: "ov-" + q.id });
        cb.checked = !!a.override;
        cb.addEventListener("change", function () { a.override = cb.checked; save(); });
        card.appendChild(h("div", { class: "grade-item" }, h("p", { class: "qtext" }, q.question),
          h("p", { class: "small" }, "You wrote: ", h("span", { class: "mono" }, a.supplied)),
          h("p", { class: "small" }, "Accepted: ", h("span", { class: "mono" }, q.acceptedAnswers.join("  |  "))),
          h("label", { class: "check", for: "ov-" + q.id }, cb, " My answer means the same thing")));
      });
    }
    var missing = drawQs.filter(function (q) { return !grades[q.id]; }).length;
    card.appendChild(h("div", { class: "row" }, h("button", { class: "btn primary big", type: "button", disabled: missing > 0, onclick: function () {
      var final = {};
      run.queue.forEach(function (it) {
        var q = E.q(it.id), a = ans[it.id];
        if (!q) return;
        if (!a || a.skipped) final[it.id] = "unanswered";
        else if (q.type === "draw") final[it.id] = grades[it.id];
        else final[it.id] = a.auto || a.override ? "correct" : "wrong";
      });
      var report = E.finalizeExam(run, final);
      report.queue = run.queue.map(function (it) { return it.id; });
      report.answers = ans; report.grades = final;
      A.examReport = report;
      E.state.activeRun = null;
      save();
      go("examReport");
    } }, missing ? "Grade " + missing + " more to see your score" : "SEE MY SCORE")));
    el.appendChild(card);
  }

  function examReportView(el) {
    var r = A.examReport;
    if (!r) return go("home");
    function stat(label, v) { return h("div", null, h("b", null, fmtPct(v)), h("span", null, label)); }
    var card = h("section", { class: "card exam-report" },
      h("div", { class: "eyebrow" }, r.label + " · report"),
      h("div", { class: "big-score" }, r.score + "%"),
      h("p", { class: "center subtle" }, (Math.round(r.points * 10) / 10) + " / " + r.total + " points · time " + U.formatTime(r.timeMs) + (r.timerMinutes ? " of " + r.timerMinutes + ":00" : " (untimed)")),
      h("div", { class: "stats-row" }, stat("multiple choice", r.mc), stat("free response", r.fr), stat("mechanism / drawing", r.draw), stat("current topic", r.current), stat("cumulative", r.cumulative)));
    function topicList(title, list) {
      var ul = h("ul", { class: "changes" });
      list.forEach(function (t) { ul.appendChild(h("li", null, h("span", null, t.topic), h("span", null, t.pct + "% (" + t.n + ")"))); });
      return h("div", null, h("div", { class: "eyebrow" }, title), list.length ? ul : h("p", { class: "small subtle" }, "—"));
    }
    card.appendChild(h("div", { class: "grid2" }, topicList("Strongest skills", r.strongest), topicList("Weakest skills", r.weakest)));
    var rv = h("div", null, h("div", { class: "eyebrow" }, "Questions to review (" + r.review.length + ")"));
    r.review.forEach(function (it) {
      var q = E.q(it.id);
      if (!q) return;
      var a = r.answers[it.id] || {};
      var det = h("details", { class: "review-item" },
        h("summary", null, h("span", { class: "chip " + (it.grade === "minor" ? "m-developing" : "st-active") }, it.grade.toUpperCase()), " ", q.topic),
        h("p", { class: "qtext" }, q.question),
        a.supplied ? h("p", { class: "small" }, "Your answer: ", h("span", { class: "mono" }, a.supplied)) : null,
        q.type === "draw" ? rubricBlock(q) : h("p", null, h("b", null, "Answer: "), C.answerText(q)),
        q.explanation ? h("p", { class: "small" }, q.explanation) : null);
      rv.appendChild(det);
    });
    card.appendChild(rv);
    card.appendChild(h("p", { class: "small subtle" }, "Every missed question is scheduled for review tomorrow with a near-transfer variant."));
    card.appendChild(h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", onclick: function () { go("home"); } }, "Back to base")));
    el.appendChild(card);
  }

  /* ---------- enemies ---------- */

  function enemiesView(el) {
    var list = E.enemyList();
    var card = h("section", { class: "card" }, h("div", { class: "eyebrow" }, "Enemy database"), h("h1", null, "Recurring mistakes"),
      h("p", { class: "subtle" }, "Each miss strengthens the enemy behind it. An enemy is defeated only after 3 correct near-transfer answers (at most one hint) on at least 2 different days since its last hit. Misses from preview material are not logged here."));
    if (!list.length) card.appendChild(h("p", null, "No enemies recorded yet."));
    var grid = h("div", { class: "bestiary" });
    list.forEach(function (e) {
      grid.appendChild(h("div", { class: "enemy-card st-" + e.status.toLowerCase() },
        h("div", { class: "enemy-head" }, h("div", { class: "enemy-sigil", "aria-hidden": "true" }, e.def.name.charAt(0)),
          h("div", null, h("h3", null, e.def.name.toUpperCase()), h("div", { class: "small" }, "Real skill: ", h("b", null, e.def.skill)))),
        h("div", { class: "small" }, "Misses: " + e.rec.misses + " · Wins since last miss: " + e.rec.winsSinceMiss + "/3 · Days: " + e.rec.winDays.length + "/2"),
        statusChip(e.status),
        h("p", { class: "rule small" }, e.def.rule)));
    });
    card.appendChild(grid);
    if (list.length) card.appendChild(h("button", { class: "btn primary", type: "button", onclick: function () { startRun("weakness"); } }, "Start Weakness Hunt"));
    el.appendChild(card);
  }

  /* ---------- progress ---------- */

  function progressView(el) {
    var st = E.state;
    var regions = E.regions().filter(function (r) { return r.status !== "locked"; });
    el.appendChild(h("section", { class: "card" }, h("div", { class: "eyebrow" }, "Readiness"),
      h("div", { class: "hero-rings" }, pctRing(E.mt2Readiness(), "Midterm 2", "confirmed MT2 only", "mt2"), pctRing(E.finalReadiness(), "Final", "all confirmed units", "final")),
      h("p", { class: "small subtle" }, "Readiness = retained strength across every confirmed question (written/drawing questions weigh 1.5×, overdue reviews decay). Unseen questions count as 0. Preview questions never count.")));
    regions.forEach(function (r) {
      var topics = E.topics(r.questions, r.status === "preview").sort(function (a, b) { return a.score - b.score; });
      var ul = h("ul", { class: "topic-list" });
      topics.forEach(function (t) { ul.appendChild(h("li", null, h("span", null, t.topic), masteryChip(t.score))); });
      el.appendChild(h("section", { class: "card region-detail " + r.status }, h("div", { class: "eyebrow" }, r.status === "preview" ? "PREVIEW" : "CONFIRMED"),
        h("h2", null, r.def.name, " ", masteryChip(r.mastery)), ul));
    });
    var ach = h("div", { class: "achievements" });
    E.ACHIEVEMENTS.forEach(function (a) {
      var got = st.achievements.indexOf(a.id) >= 0;
      ach.appendChild(h("div", { class: "ach" + (got ? " got" : "") }, h("b", null, a.name), h("span", { class: "small" }, a.desc), got ? h("span", { class: "small subtle" }, "Earned " + (st.achievementDates[a.id] || "")) : null));
    });
    var achCard = h("section", { class: "card" }, h("div", { class: "eyebrow" }, "Achievements"), ach);
    if (st.legacyAchievements.length) achCard.appendChild(h("p", { class: "small subtle" }, "Archived from the old version (not re-verifiable): " + st.legacyAchievements.join(", ")));
    el.appendChild(achCard);
    var hist = h("ul", { class: "changes" });
    st.runHistory.slice(-10).reverse().forEach(function (r) { hist.appendChild(h("li", null, h("span", null, r.date + " · " + r.label), h("span", null, r.score + "% · +" + r.xp + " XP"))); });
    st.bossResults.slice(-5).reverse().forEach(function (r) { hist.appendChild(h("li", null, h("span", null, (r.date || "") + " · BOSS " + r.label), h("span", null, r.percent + "%"))); });
    st.examResults.slice(-5).reverse().forEach(function (r) { hist.appendChild(h("li", null, h("span", null, r.date + " · EXAM " + (r.scope === "final" ? "Final" : "MT2")), h("span", null, r.score + "% · " + U.formatTime(r.timeMs || 0)))); });
    el.appendChild(h("section", { class: "card" }, h("div", { class: "eyebrow" }, "History"), hist.childNodes.length ? hist : h("p", { class: "subtle" }, "No completed runs yet."),
      h("p", { class: "small subtle" }, st.attempts + " answers · " + st.correct + " correct · " + st.sessionCount + " sessions")));
  }

  /* ---------- data ---------- */

  function pickFile(onText) {
    var input = h("input", { type: "file", accept: "application/json,.json", style: "display:none" });
    input.addEventListener("change", function () {
      var f = input.files && input.files[0];
      input.remove();
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { onText(String(reader.result || "")); };
      reader.onerror = function () { notice("bad", "Could not read that file."); render(); };
      reader.readAsText(f);
    });
    document.body.appendChild(input);
    input.click();
  }

  A.importPackText = function (text) {
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { notice("bad", "Import failed: the file is not valid JSON."); return render(); }
    if (parsed && (parsed.format === "mechanism-quest-save" || parsed.format === "mechanism-quest-state")) { notice("bad", "That file is a save, not a content pack. Use Import Save."); return render(); }
    var pack = C.parsePack(parsed);
    if (!pack.ok) { notice("bad", "Import failed: " + pack.error); return render(); }
    var r = E.importPack(pack);
    save();
    var msg = "“" + pack.packMeta.title + "”: " + r.added + " question" + (r.added === 1 ? "" : "s") + " added. Existing progress preserved.";
    if (r.duplicates.length) msg += " " + r.duplicates.length + " duplicate ID" + (r.duplicates.length === 1 ? "" : "s") + " skipped (existing questions were not changed).";
    if (r.invalid.length) msg += " " + r.invalid.length + " invalid question(s) skipped: " + r.invalid.slice(0, 3).join("; ") + (r.invalid.length > 3 ? "…" : "");
    notice(r.added ? "ok" : "warn", msg);
    render();
    return r;
  };

  A.importSaveText = function (text, skipConfirm) {
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { notice("bad", "Import failed: the file is not valid JSON."); return render(); }
    var r = S.parseSaveFile(parsed, E.builtinIds());
    if (!r.ok) { notice("bad", "Import failed: " + r.error); return render(); }
    var apply = function () {
      if (S.safeMode) { try { window.sessionStorage.removeItem(S.SAFE_FLAG); } catch (e) { /* ignore */ } S.safeMode = false; }
      E.init(r.state);
      save();
      notice("ok", "Save imported: " + r.state.xp + " XP, " + r.state.importedQuestions.length + " imported questions, " + Object.keys(r.state.spacedRepetition).length + " review records.");
      go("home");
    };
    if (skipConfirm) return apply();
    confirmModal("Replace current progress?", "This replaces the progress stored in this browser with the file's contents. Export your current save first if you may need it.", "Replace progress", apply);
  };

  function dataView(el) {
    U.append(el, noticesBlock());
    var st = E.state;
    var card = h("section", { class: "card" }, h("div", { class: "eyebrow" }, "Save & content"), h("h1", null, "Data"),
      h("p", { class: "subtle" }, "Everything lives in this browser. No account, server or analytics. Export regularly; a save file is private study data."));
    var rows = h("div", { class: "data-actions" },
      h("button", { class: "btn primary", type: "button", onclick: function () { S.download("mechanism-quest-save-" + U.today() + ".json", S.exportPayload(E.state)); notice("ok", "Save exported. Keep the file somewhere safe."); render(); } }, "Export Save"),
      h("button", { class: "btn", type: "button", onclick: function () { pickFile(function (t) { A.importSaveText(t); }); } }, "Import Save"),
      h("button", { class: "btn", type: "button", onclick: function () { pickFile(A.importPackText); } }, "Import Content Pack"));
    card.appendChild(rows);
    var packs = Object.keys(st.packs);
    var pl = h("ul", { class: "changes" });
    pl.appendChild(h("li", null, h("span", null, "Built-in Midterm 1 bank"), h("span", null, MQ.BUILTIN_QUESTIONS.length + " questions")));
    packs.forEach(function (id) {
      var p = st.packs[id];
      pl.appendChild(h("li", null, h("span", null, p.title || id), h("span", null, p.count + " q · " + (/confirmed/.test(p.scope) ? "CONFIRMED" : /preview/.test(p.scope) ? "PREVIEW" : (p.scope || "unscoped")))));
    });
    var untracked = st.importedQuestions.filter(function (q) { return !q.packId; }).length;
    if (untracked) pl.appendChild(h("li", null, h("span", null, "Imported before this version"), h("span", null, untracked + " questions")));
    card.appendChild(h("div", null, h("div", { class: "eyebrow" }, "Content"), pl,
      h("p", { class: "small subtle" }, E.currentPool().length + " confirmed MT2 · " + E.mt1Pool().length + " MT1 · " + E.previewPool().length + " preview")));
    el.appendChild(card);

    var tools = h("section", { class: "card" }, h("div", { class: "eyebrow" }, "Maintenance"));
    if (S.get(S.BACKUP_KEY)) tools.appendChild(h("button", { class: "btn", type: "button", onclick: function () { S.download("mechanism-quest-unreadable-backup.json", S.get(S.BACKUP_KEY)); } }, "Download unreadable backup"));
    if (S.get(S.LEGACY_KEY)) tools.appendChild(h("p", { class: "small subtle" }, "Your save from the previous app version is still stored untouched under its old key."));
    tools.appendChild(h("button", { class: "btn ghost", type: "button", onclick: function () { clearAppCache(); } }, "Refresh app files (clear offline cache)"));
    tools.appendChild(h("button", { class: "btn ghost", type: "button", onclick: function () { toggleTheme(); } }, "Toggle light/dark theme"));
    tools.appendChild(h("button", { class: "btn danger", type: "button", onclick: function () {
      confirmModal("Reset all progress?", "This deletes XP, mastery, streak, enemies, reviews, history and imported questions in this browser. It cannot be undone. Export first if unsure.", "Reset everything", function () {
        var fresh = S.defaultState();
        E.init(fresh);
        save();
        notice("ok", "Progress reset.");
        go("home");
      }, "RESET");
    } }, "Reset Progress"));
    el.appendChild(tools);
  }

  function clearAppCache() {
    var tasks = [];
    try {
      if (window.caches && caches.keys) tasks.push(caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); }));
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) tasks.push(navigator.serviceWorker.getRegistrations().then(function (regs) { return Promise.all(regs.map(function (r) { return r.unregister(); })); }));
    } catch (e) { /* ignore */ }
    Promise.all(tasks).then(function () { location.reload(); }, function () { location.reload(); });
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", cur);
    S.set(S.THEME_KEY, cur);
  }

  /* ---------- structure SVG ---------- */

  function structureSvg(q, selected, interactive, onPick) {
    var s = q.structure, NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", s.viewBox || "0 0 340 160");
    svg.setAttribute("class", "structure" + (interactive ? " interactive" : ""));
    svg.setAttribute("role", interactive ? "group" : "img");
    svg.setAttribute("aria-label", "Structure diagram");
    var pos = {};
    s.atoms.forEach(function (a) { pos[a.id] = a; });
    s.bonds.forEach(function (b) {
      var a1 = pos[b.from], a2 = pos[b.to];
      var dx = a2.x - a1.x, dy = a2.y - a1.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var trim = 18, ux = dx / len, uy = dy / len;
      var x1 = a1.x + ux * trim, y1 = a1.y + uy * trim, x2 = a2.x - ux * trim, y2 = a2.y - uy * trim;
      var order = b.order === 2 ? 2 : b.order === 3 ? 3 : 1;
      var offs = order === 1 ? [0] : order === 2 ? [-3.5, 3.5] : [-5, 0, 5];
      offs.forEach(function (o) {
        var line = document.createElementNS(NS, "line");
        line.setAttribute("x1", String(x1 - uy * o)); line.setAttribute("y1", String(y1 + ux * o));
        line.setAttribute("x2", String(x2 - uy * o)); line.setAttribute("y2", String(y2 + ux * o));
        line.setAttribute("class", "bond" + (b.style === "wedge" ? " wedge" : b.style === "dash" ? " dash" : ""));
        svg.appendChild(line);
      });
    });
    s.atoms.forEach(function (a) {
      var g = document.createElementNS(NS, "g");
      g.setAttribute("class", "atom" + (selected === a.id ? " selected" : ""));
      if (interactive) {
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", "Atom " + a.id + " " + a.label);
        g.addEventListener("click", function () { onPick(a.id); });
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(a.id); } });
      }
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", String(a.x)); c.setAttribute("cy", String(a.y)); c.setAttribute("r", "17");
      c.setAttribute("class", "atom-bg");
      var t = document.createElementNS(NS, "text");
      t.setAttribute("x", String(a.x)); t.setAttribute("y", String(a.y + 5));
      t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "atom-label");
      t.textContent = a.label;
      var tag = document.createElementNS(NS, "text");
      tag.setAttribute("x", String(a.x + 15)); tag.setAttribute("y", String(a.y - 13));
      tag.setAttribute("class", "atom-tag");
      tag.textContent = a.id;
      g.appendChild(c); g.appendChild(t); g.appendChild(tag);
      svg.appendChild(g);
    });
    return h("div", { class: "structure-wrap" }, svg);
  }

  /* ---------- view table & boot ---------- */

  var VIEWS = {
    home: homeView, region: regionView, run: runView, bossIntro: bossIntroView, recoveryIntro: recoveryIntroView,
    recoveryDone: recoveryDoneView, complete: completeView, boss: bossView, examSetup: examSetupView,
    examGrade: examGradeView, examReport: examReportView, enemies: enemiesView, progress: progressView, data: dataView
  };

  A.go = go;
  A.render = render;
  A.startRun = startRun;
  A.commit = function () { var r = curRun(); if (r) commit(r, E.q(r.queue[r.index].id)); };
  A.next = nextQuestion;
  A.save = save;

  A.boot = function () {
    root = document.getElementById("app");
    var theme = S.get(S.THEME_KEY);
    if (theme === "light" || theme === "dark") document.documentElement.setAttribute("data-theme", theme);
    var loaded = S.load(E.builtinIds());
    E.init(loaded.state);
    if (loaded.warning) notice("warn", loaded.warning);
    if (loaded.info) notice("ok", loaded.info);
    var brand = document.getElementById("brand");
    if (brand) brand.addEventListener("click", function (e) { e.preventDefault(); go("home"); });
    go("home");
    save();
    registerServiceWorker();
    window.MQ_BOOTED = true;
  };

  function registerServiceWorker() {
    try {
      if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(function (e) { console.warn("Service worker registration failed", e); });
    } catch (e) { /* never block startup */ }
  }

  MQ.app = A;
})(window.MQ);
