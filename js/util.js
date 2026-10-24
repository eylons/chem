/* Small helpers shared by every module. No DOM access at load time. */
"use strict";
window.MQ = window.MQ || {};

(function (MQ) {
  var util = {};

  // Build DOM nodes without innerHTML: h("div", {class: "x"}, "text", childNode)
  util.h = function (tag, attrs) {
    var el = document.createElement(tag);
    var key;
    if (attrs) {
      for (key in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
        var value = attrs[key];
        if (value === null || value === undefined || value === false) continue;
        if (key === "class") el.className = value;
        else if (key === "text") el.textContent = value;
        else if (key === "style") el.setAttribute("style", value);
        else if (key.indexOf("on") === 0 && typeof value === "function") el.addEventListener(key.slice(2), value);
        else if (value === true) el.setAttribute(key, "");
        else el.setAttribute(key, String(value));
      }
    }
    for (var i = 2; i < arguments.length; i++) util.append(el, arguments[i]);
    return el;
  };

  util.append = function (el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(function (c) { util.append(el, c); });
      return;
    }
    if (typeof child === "string" || typeof child === "number") el.appendChild(document.createTextNode(String(child)));
    else el.appendChild(child);
  };

  util.pad2 = function (n) { return (n < 10 ? "0" : "") + n; };

  util.dateKey = function (date) {
    return date.getFullYear() + "-" + util.pad2(date.getMonth() + 1) + "-" + util.pad2(date.getDate());
  };

  // Tests may override util.now to simulate other days.
  util.now = function () { return new Date(); };

  util.today = function () { return util.dateKey(util.now()); };

  util.addDays = function (key, days) {
    var parts = String(key).split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + days);
    return util.dateKey(d);
  };

  util.daysBetween = function (fromKey, toKey) {
    var a = String(fromKey).split("-"), b = String(toKey).split("-");
    var da = Date.UTC(Number(a[0]), Number(a[1]) - 1, Number(a[2]));
    var db = Date.UTC(Number(b[0]), Number(b[1]) - 1, Number(b[2]));
    return Math.round((db - da) / 86400000);
  };

  util.isDateKey = function (v) { return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v); };

  util.shuffle = function (items) {
    var result = items.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = result[i]; result[i] = result[j]; result[j] = t;
    }
    return result;
  };

  util.clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

  util.num = function (v, fallback) {
    return (typeof v === "number" && isFinite(v)) ? v : fallback;
  };

  util.isObj = function (v) { return !!v && typeof v === "object" && !Array.isArray(v); };

  util.uniq = function (arr) {
    var seen = {}, out = [];
    arr.forEach(function (x) { if (!seen[x]) { seen[x] = true; out.push(x); } });
    return out;
  };

  // Lenient answer normalization: case, spacing, unicode sub/superscripts, dashes.
  util.normalizeAnswer = function (value) {
    var s = String(value === null || value === undefined ? "" : value);
    if (s.normalize) s = s.normalize("NFKC");
    s = s.toLowerCase()
      .replace(/[−‒–—]/g, "-")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\s+/g, "")
      .replace(/[.,!?;:]+$/g, "");
    // "2-methyl-2-butene" and "2 methyl 2 butene" compare equal; a trailing "-" (charge) is kept.
    s = s.replace(/([a-z0-9\])])-(?=[a-z0-9(\[])/g, "$1");
    return s;
  };

  util.masteryLabel = function (score) {
    if (score < 20) return "NEW";
    if (score < 40) return "LEARNING";
    if (score < 60) return "DEVELOPING";
    if (score < 80) return "RELIABLE";
    return "MASTERED";
  };

  util.formatTime = function (ms) {
    var total = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(total / 60), s = total % 60;
    return m + ":" + util.pad2(s);
  };

  MQ.util = util;
})(window.MQ);
