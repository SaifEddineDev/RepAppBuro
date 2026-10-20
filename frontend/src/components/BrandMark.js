import React from 'react';

const BrandMark = () => (
  <span className="brand-mark" aria-hidden="true">
    <img src={`${process.env.PUBLIC_URL}/repappburo-symbol.svg`} alt="" />
  </span>
);

export default BrandMark;
