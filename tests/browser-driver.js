/* Browser test driver: plays the current run by clicking the real UI buttons.
   Load in the page (local dev only), then: await MQ_TEST.drive(policy, maxSteps)
   policy(run, question) returns "correct" | "wrong" | "minor" | "major" | "stuck". */
"use strict";
window.MQ_TEST = (function () {
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function btn(t) {
    return Array.prototype.slice.call(document.querySelectorAll("#app button")).filter(function (b) {
      return b.textContent.trim().indexOf(t) === 0 && !b.disabled;
    })[0];
  }
  async function drive(policy, maxSteps) {
    var log = [];
    var grade = { correct: "I got it correct", major: "Major mistake", wrong: "Major mistake", minor: "Minor mistake", stuck: "I was completely stuck" };
    for (var i = 0; i < maxSteps; i++) {
      await wait(60);
      var app = document.getElementById("app");
      var run = MQ.engine.state.activeRun;
      if (app.querySelector(".error-card")) { log.push("ERROR CARD: " + app.textContent.slice(0, 200)); break; }
      if (btn("ENGAGE")) { btn("ENGAGE").click(); continue; }
      if (btn("ENTER RECOVERY ROOM")) { log.push("RECOVERY INTRO hearts=" + MQ.engine.state.hearts); btn("ENTER RECOVERY ROOM").click(); continue; }
      if (btn("RETURN TO")) { log.push("RECOVERY DONE: " + app.querySelector(".lead").textContent); btn("RETURN TO").click(); continue; }
      if (app.querySelector(".complete")) { log.push("COMPLETE: " + app.querySelector(".complete").innerText.replace(/\n+/g, " | ")); break; }
      if (!run) { log.push("NO RUN: " + app.textContent.slice(0, 120)); break; }
      var next = app.querySelector("#next-btn");
      if (next) {
        var nextLike = Array.prototype.slice.call(app.querySelectorAll("button")).filter(function (b) { return /^(Next|Finish run)/.test(b.textContent.trim()); });
        log.push("  feedback: " + app.querySelector(".verdict").textContent + " | nextButtons=" + nextLike.length + " rubric=" + !!app.querySelector(".rubric") + " hearts=" + MQ.engine.state.hearts);
        next.click();
        continue;
      }
      var q = MQ.engine.q(run.queue[run.index].id);
      var want = policy(run, q);
      log.push((run.mode === "recovery" ? "R" : "") + (run.index + 1) + "/" + run.queue.length + " " + run.queue[run.index].enc + " " + q.type + " [" + q.topic + "] -> " + want + " hints=" + app.querySelectorAll(".hints li").length);
      if (q.type === "draw") {
        if (btn("Reveal answer")) { btn("Reveal answer").click(); await wait(60); }
        log.push("  rubric after reveal=" + !!app.querySelector(".rubric") + " sections=" + app.querySelectorAll(".rubric-sec").length + " nextBeforeGrade=" + app.querySelectorAll("#next-btn").length);
        btn(grade[want]).click();
        continue;
      }
      var good = want === "correct";
      if (q.type === "choice") {
        var choices = Array.prototype.slice.call(app.querySelectorAll(".choice"));
        choices.filter(function (c) { return (c.textContent.slice(1) === q.answer) === good; })[0].click();
      } else if (q.type === "text") {
        var inp = document.getElementById("answer-input");
        inp.value = good ? q.acceptedAnswers[0] : "zzz wrong";
        inp.dispatchEvent(new Event("input"));
      } else if (q.type === "select-atom") {
        Array.prototype.slice.call(app.querySelectorAll(".structure .atom")).filter(function (a) {
          return (a.getAttribute("aria-label").split(" ")[1] === q.answer) === good;
        })[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      } else if (q.type === "rank" && good) {
        run.cur.rank = q.answer.slice();
        MQ.app.render();
      }
      await wait(30);
      btn("Commit answer").click();
      await wait(60);
      if (btn("Mark it wrong")) { log.push("  text mismatch screen"); btn("Mark it wrong").click(); }
    }
    return log.join("\n");
  }
  return { drive: drive, wait: wait, btn: btn };
})();
