import React from 'react';
import BrandMark from './BrandMark';

const BrandLockup = ({ className }) => (
  <div className={className}>
    <BrandMark />
    <span className="brand-copy">
      <span className="brand-name">RepApp<span>Buro</span></span>
      <span className="brand-tagline">Réparations, clients et équipe au même endroit.</span>
    </span>
  </div>
);

export default BrandLockup;
