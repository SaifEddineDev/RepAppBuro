// Keep the test setup dependency-free; Jest already provides a jsdom document.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));
