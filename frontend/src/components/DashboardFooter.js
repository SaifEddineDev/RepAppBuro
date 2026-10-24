import React from 'react';
import BrandLockup from './BrandLockup';
import './DashboardFooter.css';

const DashboardFooter = () => (
  <footer className="workspace-footer">
    <div className="workspace-footer-inner">
      <BrandLockup className="workspace-footer-brand" />
      <span className="workspace-footer-copy">© {new Date().getFullYear()} RepAppBuro</span>
    </div>
  </footer>
);

export default DashboardFooter;
