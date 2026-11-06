// Apply once, before authentication callbacks or Hub navigation start. Existing
// installed apps may still launch the old root URL until their manifest updates.
export function applyPwaStartRoute(window) {
  try {
    const { location, history } = window;
    if (location.hash && location.hash !== '#') return false;
    const standalone = window.navigator?.standalone === true ||
      window.matchMedia?.('(display-mode: standalone)')?.matches === true;
    if (!standalone) return false;

    const url = new URL(location.href);
    url.hash = 'classroom';
    history.replaceState(history.state, '', url.href);
    return true;
  } catch {
    // Startup must still work when display-mode detection or history is blocked.
    return false;
  }
}
