// Register the service worker only on real production domains. In dev/preview it
// can cache stale files and interfere with media range requests during testing.
(function registerSW(){
  if (!('serviceWorker' in navigator)) return;

  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const isLovablePreview = host.includes('lovable.app') || host.includes('lovableproject.com');

  if (isLocal || isLovablePreview) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });
})();
