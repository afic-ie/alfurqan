// Registers the service worker (offline support) on every page.
export function registerPwa(root: string) {
  if (!('serviceWorker' in navigator)) return;
  const register = () => navigator.serviceWorker.register(`${root}sw.js`, { scope: root }).catch(() => undefined);
  // Page scripts run after the load event (they await data first), so
  // register straight away when the document is already complete.
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', () => void register());
}
