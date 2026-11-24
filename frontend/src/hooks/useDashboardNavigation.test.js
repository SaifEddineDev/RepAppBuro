import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import useDashboardNavigation from './useDashboardNavigation';

const NavigationProbe = () => {
  const [section, setSection] = useDashboardNavigation('users', ['users', 'billing']);
  const location = useLocation();
  return (
    <div>
      <span data-testid="section">{section}</span>
      <span data-testid="query">{location.search}</span>
      <button type="button" onClick={() => setSection('users')}>Users</button>
    </div>
  );
};

test('dashboard section is restored from and written to the URL', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  await act(async () => {
    root.render(<MemoryRouter initialEntries={['/dashboard?section=billing']}><NavigationProbe /></MemoryRouter>);
  });

  expect(host.querySelector('[data-testid="section"]').textContent).toBe('billing');
  await act(async () => { host.querySelector('button').click(); });
  expect(host.querySelector('[data-testid="section"]').textContent).toBe('users');
  expect(host.querySelector('[data-testid="query"]').textContent).toBe('?section=users');
  await act(async () => { root.unmount(); });
});
