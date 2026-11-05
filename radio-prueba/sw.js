// Solo guarda la "carcasa" para abrir rápido; el audio NO se cachea (los rangos de audio dan problemas en iOS).
var C="stb-radio-v2",F=["index.html","manifest.webmanifest","icon-180.png","icon-512.png","playlist.json"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F)}));self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}))});
self.addEventListener("fetch",function(e){var u=new URL(e.request.url);if(e.request.method!=="GET"||/\.mp3$/.test(u.pathname))return;
  e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request)}))});
