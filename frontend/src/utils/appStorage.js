const scope = process.env.REACT_APP_DEMO_MODE === 'true' ? 'demo:' : 'production:';
const scopedKey = (key) => `repappburo:${scope}${key}`;

export const appStorage = {
  getItem: (key) => window.localStorage.getItem(scopedKey(key)),
  setItem: (key, value) => window.localStorage.setItem(scopedKey(key), value),
  removeItem: (key) => window.localStorage.removeItem(scopedKey(key))
};
