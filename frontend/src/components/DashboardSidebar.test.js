import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import DashboardSidebar from './DashboardSidebar';

test('sidebar exposes only the selected role sections and dispatches navigation', async () => {
  const onNavigate = jest.fn();
  const host = document.createElement('div');
  const root = createRoot(host);

  await act(async () => {
    root.render(<DashboardSidebar role="ADMIN" user={{ username: 'admin' }} activeItem="utilisateurs" onNavigate={onNavigate} onLogout={() => {}} />);
  });

  expect(host.textContent).toContain('Utilisateurs');
  expect(host.textContent).toContain('Droits d’accès');
  expect(host.textContent).not.toContain('Facturation');
  const financesButton = Array.from(host.querySelectorAll('button')).find((button) => button.textContent.includes('Finances'));
  await act(async () => { financesButton.click(); });
  expect(onNavigate).toHaveBeenCalledWith('finances');
  await act(async () => { root.unmount(); });
});
