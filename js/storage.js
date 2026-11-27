import { SIGNUP_STORAGE_KEY } from './config.js';
export function saveDetails(details, storage) {
  try {
    const target = storage ?? globalThis.sessionStorage;
    target?.setItem(
      SIGNUP_STORAGE_KEY,
      JSON.stringify({ name: details.name, email: details.email })
    );
    return Boolean(target);
  } catch {
    return false;
  }
}

export function loadDetails(storage) {
  try {
    const target = storage ?? globalThis.sessionStorage;
    const data = JSON.parse(target?.getItem(SIGNUP_STORAGE_KEY) ?? 'null');
    return data && typeof data.name === 'string' && typeof data.email === 'string'
      ? data
      : null;
  } catch {
    return null;
  }
}
