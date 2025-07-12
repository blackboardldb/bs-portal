// ========================================================================================
// SERVICE WORKER PARA BLACKSHEEP CROSSFIT
// ========================================================================================

const CACHE_NAME = "blacksheep-v1.0.0";
const STATIC_CACHE = "blacksheep-static-v1.0.0";
const DYNAMIC_CACHE = "blacksheep-dynamic-v1.0.0";

// Archivos estáticos para cache inmediato
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/app/globals.css",
];

// Rutas que deben funcionar offline
const OFFLINE_ROUTES = ["/", "/app", "/admin", "/auth"];

// ========================================================================================
// INSTALACIÓN DEL SERVICE WORKER
// ========================================================================================

self.addEventListener("install", (event) => {
  console.log("[SW] Instalando service worker...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Cacheando archivos estáticos");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Service worker instalado correctamente");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Error durante la instalación:", error);
      })
  );
});

// ========================================================================================
// ACTIVACIÓN DEL SERVICE WORKER
// ========================================================================================

self.addEventListener("activate", (event) => {
  console.log("[SW] Activando service worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches antiguos
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("[SW] Eliminando cache antiguo:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] Service worker activado");
        return self.clients.claim();
      })
  );
});

// ========================================================================================
// INTERCEPTACIÓN DE REQUESTS
// ========================================================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo procesar requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }

  // Estrategia de cache según el tipo de request
  if (request.method === "GET") {
    event.respondWith(handleGetRequest(request));
  } else {
    // Para requests POST, PUT, DELETE, usar network first
    event.respondWith(handleNonGetRequest(request));
  }
});

// ========================================================================================
// ESTRATEGIAS DE CACHE
// ========================================================================================

async function handleGetRequest(request) {
  const url = new URL(request.url);

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    return networkFirst(request, DYNAMIC_CACHE);
  }

  // Páginas principales - Cache first, fallback to network
  if (
    OFFLINE_ROUTES.some(
      (route) => url.pathname === route || url.pathname.startsWith(route)
    )
  ) {
    return cacheFirst(request, STATIC_CACHE);
  }

  // Assets estáticos - Cache first
  if (isStaticAsset(url.pathname)) {
    return cacheFirst(request, STATIC_CACHE);
  }

  // Por defecto - Network first
  return networkFirst(request, DYNAMIC_CACHE);
}

async function handleNonGetRequest(request) {
  try {
    // Intentar network primero
    const response = await fetch(request);

    // Si es exitoso, actualizar cache si es necesario
    if (response.ok && request.method === "POST") {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error("[SW] Error en request no-GET:", error);

    // Para requests POST de login, mostrar página offline
    if (request.url.includes("/auth")) {
      return caches.match("/");
    }

    throw error;
  }
}

// ========================================================================================
// ESTRATEGIAS DE CACHE ESPECÍFICAS
// ========================================================================================

async function cacheFirst(request, cacheName) {
  try {
    // Intentar cache primero
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log("[SW] Sirviendo desde cache:", request.url);
      return cachedResponse;
    }

    // Si no está en cache, ir a network
    const networkResponse = await fetch(request);

    // Cachear la respuesta para futuras requests
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Error en cache first:", error);

    // Fallback para páginas principales
    if (OFFLINE_ROUTES.some((route) => request.url.includes(route))) {
      return caches.match("/");
    }

    throw error;
  }
}

async function networkFirst(request, cacheName) {
  try {
    // Intentar network primero
    const networkResponse = await fetch(request);

    // Cachear respuesta exitosa
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network falló, intentando cache:", request.url);

    // Fallback a cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Si no hay cache y es una página principal, mostrar offline
    if (OFFLINE_ROUTES.some((route) => request.url.includes(route))) {
      return caches.match("/");
    }

    throw error;
  }
}

// ========================================================================================
// UTILIDADES
// ========================================================================================

function isStaticAsset(pathname) {
  const staticExtensions = [
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// ========================================================================================
// SINCRONIZACIÓN EN BACKGROUND
// ========================================================================================

self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Aquí se pueden sincronizar datos pendientes
    console.log("[SW] Ejecutando sincronización en background");

    // Ejemplo: sincronizar reservas pendientes
    const pendingBookings = await getPendingBookings();
    for (const booking of pendingBookings) {
      await syncBooking(booking);
    }
  } catch (error) {
    console.error("[SW] Error en background sync:", error);
  }
}

// Placeholder functions para sincronización
async function getPendingBookings() {
  // En una implementación real, esto leería del IndexedDB
  return [];
}

async function syncBooking(booking) {
  // En una implementación real, esto enviaría al servidor
  console.log("[SW] Sincronizando booking:", booking);
}

// ========================================================================================
// NOTIFICACIONES PUSH
// ========================================================================================

self.addEventListener("push", (event) => {
  console.log("[SW] Push notification recibida");

  const options = {
    body: event.data ? event.data.text() : "Nueva notificación de BlackSheep",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ver más",
        icon: "/icons/icon-192x192.png",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/icons/icon-192x192.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("BlackSheep CrossFit", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event.action);

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/app"));
  }
});

// ========================================================================================
// MANEJO DE ERRORES
// ========================================================================================

self.addEventListener("error", (event) => {
  console.error("[SW] Error en service worker:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Promise rejection no manejada:", event.reason);
});

console.log("[SW] Service worker cargado correctamente");
