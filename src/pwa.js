import { registerSW } from 'virtual:pwa-register';

export function setupPWA(onInstallAvailable) {
  // Service Worker kaydı
  const updateSW = registerSW({
    onNeedRefresh() {
      console.log('Yeni güncelleme mevcut.');
    },
    onOfflineReady() {
      console.log('Uygulama çevrimdışı kullanıma hazır.');
    },
  });

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (onInstallAvailable) {
      onInstallAvailable(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Kullanıcı yanıtı: ${outcome}`);
        deferredPrompt = null;
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('BRITA Tracker başarıyla yüklendi!');
    deferredPrompt = null;
  });
}
