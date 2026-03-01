const CACHE_NAME = 'jaw-v2'

const APP_SHELL = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL)
    })
  )
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Take control of all open clients immediately
  self.clients.claim()
})

// Fetch: strategy depends on request type
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip auth-related requests (never cache these)
  if (url.pathname.startsWith('/api/auth')) return

  // API calls: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets (_next/static): cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Images and other static files in /public: cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // HTML pages and everything else: network-first
  event.respondWith(networkFirst(request))
})

/**
 * Cache-first strategy: serve from cache if available,
 * otherwise fetch from network and cache the response.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // If both cache and network fail, return a basic offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}

/**
 * Network-first strategy: try the network first,
 * fall back to cache if offline.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    // Cache successful responses for offline fallback
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    // For navigation requests, try to serve the cached homepage as a fallback
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/')
      if (fallback) return fallback
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}
