// LMCT PRO service worker — minimal v1.
// Purpose: make the app installable on Android Chrome (which requires an
// active SW) and provide a basic offline fallback for the dashboard shell.
//
// No precaching, no Workbox. Network-first for navigation requests, with a
// trivial offline message if the network is fully down. Add Serwist /
// Workbox later if real offline caching is needed.

const OFFLINE_VERSION = 1
const OFFLINE_HTML =
  '<!doctype html><html><head><meta charset="utf-8"><title>Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}h1{font-size:20px;margin:0 0 8px}p{color:#a3a3a3;margin:0}</style></head><body><div><h1>You are offline</h1><p>LMCT PRO needs a connection to reach the dealer database.</p></div></body></html>'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  if (req.mode !== 'navigate') return

  event.respondWith(
    fetch(req).catch(
      () =>
        new Response(OFFLINE_HTML, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    )
  )
})
