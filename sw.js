/* Mechanism Quest service worker.
   Network-first for every same-origin GET so a new deploy is picked up on the next
   online load; the cache is only an offline fallback. Old caches (v1/v2/v3) are deleted. */
"use strict";

var CACHE_NAME = "mechanism-quest-clean-v1";
var APP_SHELL = [
  "./", "./index.html", "./style.css",
  "./js/util.js", "./js/content.js", "./js/questions.js", "./js/storage.js", "./js/engine.js", "./js/app.js",
  "./manifest.webmanifest", "./icon.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(APP_SHELL.map(function (u) { return new Request(u, { cache: "reload" }); })); })
      .catch(function () { /* offline install is best effort; never block activation */ })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // A navigate-mode Request cannot be re-fetched with an init object, so rebuild it from its URL.
  var fresh = req.mode === "navigate"
    ? fetch(new Request(req.url, { cache: "no-cache", credentials: "same-origin" }))
    : fetch(req, { cache: "no-cache" });
  event.respondWith(
    fresh
      .then(function (res) {
        if (res && res.ok && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { return c.put(req, copy); }).catch(function () { /* ignore */ });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;
          if (req.mode === "navigate") return caches.match("./index.html");
          return new Response("Offline and not cached.", { status: 503, headers: { "Content-Type": "text/plain" } });
        });
      })
  );
});
