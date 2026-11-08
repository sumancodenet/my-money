// Global loader store — bridges axios interceptors → React UI.
// No React dependency here to avoid circular imports with api.js.

let active = 0;
let listeners = new Set();
let startedAt = 0;
const SHOW_DELAY = 180; // ms — fast requests don't flash the loader
const MIN_DISPLAY = 350; // ms — avoids flicker when request finishes quickly

let showTimer = null;
let hideTimer = null;
let visible = false;
let visibleAt = 0;

function emit() {
  listeners.forEach((fn) => fn({ active, visible }));
}

function scheduleShow() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  showTimer = setTimeout(() => {
    if (active > 0 && !visible) {
      visible = true;
      visibleAt = Date.now();
      emit();
    }
  }, SHOW_DELAY);
}

function scheduleHide() {
  clearTimeout(showTimer);
  const elapsed = Date.now() - visibleAt;
  const wait = Math.max(0, MIN_DISPLAY - elapsed);
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (active === 0 && visible) {
      visible = false;
      emit();
    }
  }, wait);
}

export const loaderStore = {
  start() {
    active += 1;
    if (!visible) scheduleShow();
    emit();
  },
  stop() {
    active = Math.max(0, active - 1);
    if (active === 0) scheduleHide();
    emit();
  },
  getState() {
    return { active, visible };
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset() {
    active = 0;
    visible = false;
  },
};
