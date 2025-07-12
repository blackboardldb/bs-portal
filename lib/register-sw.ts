// ========================================================================================
// REGISTRO DE SERVICE WORKER Y PWA
// ========================================================================================

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.log("[SW] Service Worker no soportado");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[SW] Service Worker registrado:", registration);

    // Manejar actualizaciones del service worker
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // Nueva versión disponible
            showUpdateNotification();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error("[SW] Error al registrar Service Worker:", error);
  }
}

// ========================================================================================
// NOTIFICACIÓN DE ACTUALIZACIÓN
// ========================================================================================

function showUpdateNotification() {
  if (typeof window === "undefined") return;

  // Crear notificación de actualización
  const updateNotification = document.createElement("div");
  updateNotification.className =
    "fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50";
  updateNotification.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="flex-1">
        <p class="font-medium">Nueva versión disponible</p>
        <p class="text-sm opacity-90">Recarga para actualizar la aplicación</p>
      </div>
      <button id="update-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100">
        Actualizar
      </button>
      <button id="close-update" class="text-white opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(updateNotification);

  // Manejar botón de actualización
  const updateBtn = updateNotification.querySelector("#update-btn");
  const closeBtn = updateNotification.querySelector("#close-update");

  updateBtn?.addEventListener("click", () => {
    window.location.reload();
  });

  closeBtn?.addEventListener("click", () => {
    updateNotification.remove();
  });

  // Auto-ocultar después de 10 segundos
  setTimeout(() => {
    if (updateNotification.parentNode) {
      updateNotification.remove();
    }
  }, 10000);
}

// ========================================================================================
// INSTALACIÓN DE PWA
// ========================================================================================

export function setupPWAInstall() {
  if (typeof window === "undefined") return;

  let deferredPrompt: unknown;

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevenir que Chrome muestre automáticamente el prompt
    e.preventDefault();
    deferredPrompt = e;

    // Mostrar botón de instalación personalizado
    showInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    console.log("[PWA] Aplicación instalada");
    hideInstallButton();
    deferredPrompt = null;
  });
}

function showInstallButton() {
  if (typeof window === "undefined") return;

  // Verificar si ya existe el botón
  if (document.getElementById("pwa-install-btn")) return;

  const installButton = document.createElement("button");
  installButton.id = "pwa-install-btn";
  installButton.className =
    "fixed bottom-4 left-4 bg-green-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-green-700 transition-colors";
  installButton.innerHTML = `
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
    </svg>
  `;
  installButton.title = "Instalar aplicación";

  installButton.addEventListener("click", async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      console.log("[PWA] Resultado de instalación:", outcome);
      window.deferredPrompt = null;
      hideInstallButton();
    }
  });

  document.body.appendChild(installButton);
}

function hideInstallButton() {
  const installButton = document.getElementById("pwa-install-btn");
  if (installButton) {
    installButton.remove();
  }
}

// ========================================================================================
// DETECCIÓN DE CONECTIVIDAD
// ========================================================================================

export function setupConnectivityDetection() {
  if (typeof window === "undefined") return;

  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    document.documentElement.classList.toggle("offline", !isOnline);

    if (!isOnline) {
      showOfflineNotification();
    } else {
      hideOfflineNotification();
    }
  }

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  // Verificar estado inicial
  updateOnlineStatus();
}

function showOfflineNotification() {
  if (typeof window === "undefined") return;

  // Verificar si ya existe la notificación
  if (document.getElementById("offline-notification")) return;

  const notification = document.createElement("div");
  notification.id = "offline-notification";
  notification.className =
    "fixed top-4 left-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg z-50 text-center";
  notification.innerHTML = `
    <div class="flex items-center justify-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"></path>
      </svg>
      <span>Sin conexión a internet. Algunas funciones pueden no estar disponibles.</span>
    </div>
  `;

  document.body.appendChild(notification);
}

function hideOfflineNotification() {
  const notification = document.getElementById("offline-notification");
  if (notification) {
    notification.remove();
  }
}

// ========================================================================================
// INICIALIZACIÓN COMPLETA
// ========================================================================================

export async function initializePWA() {
  try {
    // Registrar service worker
    await registerServiceWorker();

    // Configurar instalación de PWA
    setupPWAInstall();

    // Configurar detección de conectividad
    setupConnectivityDetection();

    console.log("[PWA] Inicialización completada");
  } catch (error) {
    console.error("[PWA] Error durante la inicialización:", error);
  }
}

// ========================================================================================
// TIPOS PARA TYPESCRIPT
// ========================================================================================

declare global {
  interface Window {
    deferredPrompt?: unknown;
  }
}
