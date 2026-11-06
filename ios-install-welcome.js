(() => {
  'use strict';
  const KEY = 'onlyflix_ios_install_welcome_dismissed_v1';
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (!isIOS || isStandalone) return;

  const modal = document.getElementById('ios-install-welcome');
  if (!modal) return;

  let dismissed = false;
  try { dismissed = localStorage.getItem(KEY) === '1'; } catch (_) {}
  if (dismissed) return;

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove('ios-install-open');
    try { localStorage.setItem(KEY, '1'); } catch (_) {}
  };

  // Delay slightly so the site has time to paint before the welcome guide appears.
  window.setTimeout(() => {
    modal.hidden = false;
    document.body.classList.add('ios-install-open');
    const first = modal.querySelector('.ios-install-primary');
    if (first) first.focus();
  }, 450);

  modal.querySelectorAll('[data-ios-install-dismiss]').forEach(el => el.addEventListener('click', close));
  const never = document.getElementById('ios-install-never');
  if (never) never.addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });
})();
