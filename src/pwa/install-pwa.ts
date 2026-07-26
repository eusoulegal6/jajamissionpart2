// PWA install/deferred prompt helper
let deferredPrompt: any = null;

export const pwa = {
  isStandalone(): boolean {
    // Android/desktop
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    // iOS Safari legacy flag
    const iosStandalone = (window.navigator as any).standalone === true;
    return standaloneMedia || iosStandalone;
  },

  isIosSafari(): boolean {
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    return isIOS && isSafari;
  },

  onBeforeInstallPrompt(cb: (ev: any) => void) {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      cb(e);
    });
  },

  async triggerInstall(): Promise<'accepted'|'dismissed'|'unavailable'> {
    if (!deferredPrompt) return 'unavailable';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome;
  }
};
