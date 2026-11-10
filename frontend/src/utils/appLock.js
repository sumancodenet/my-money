const LOCK_KEY = 'appLockEnabled';
const UNLOCK_KEY = 'myMoneyUnlocked';

export const isAppLockEnabled = () => localStorage.getItem(LOCK_KEY) === 'true';
export const setAppLockEnabled = (v) => localStorage.setItem(LOCK_KEY, v ? 'true' : 'false');
export const isUnlocked = () => sessionStorage.getItem(UNLOCK_KEY) === 'true';
export const setUnlocked = () => sessionStorage.setItem(UNLOCK_KEY, 'true');
export const clearUnlock = () => sessionStorage.removeItem(UNLOCK_KEY);