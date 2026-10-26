import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

test('renders the RepAppBuro sign-in screen', async () => {
  window.location.hash = '#/login';
  const host = document.createElement('div');
  const root = createRoot(host);
  await act(async () => { root.render(<App />); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  expect(host.textContent).toContain('RepAppBuro');
  await act(async () => { root.unmount(); });
});
