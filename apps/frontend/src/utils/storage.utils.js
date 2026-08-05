// Thin wrapper so components don't call localStorage directly —
// swap the underlying mechanism (e.g. httpOnly cookie) in one place later.
export const storage = {
  get: (key) => localStorage.getItem(key),
  set: (key, value) => localStorage.setItem(key, value),
  remove: (key) => localStorage.removeItem(key),
};
