import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const useDashboardNavigation = (defaultSection, sections) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionKey = Array.from(sections).join('|');
  const allowed = useMemo(() => new Set(sections), [sectionKey]);
  const [activeSection, setActiveSection] = useState(() => {
    const requested = searchParams.get('section');
    return allowed.has(requested) ? requested : defaultSection;
  });

  useEffect(() => {
    const requested = searchParams.get('section');
    if (allowed.has(requested)) setActiveSection(requested);
    else setActiveSection(defaultSection);
  }, [searchParams, defaultSection, allowed]);

  const navigateSection = (section) => {
    if (!allowed.has(section)) return;
    setActiveSection(section);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('section', section);
      return next;
    });
  };

  return [activeSection, navigateSection];
};

export default useDashboardNavigation;
