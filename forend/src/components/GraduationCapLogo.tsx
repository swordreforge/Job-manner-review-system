import React from 'react';

interface Props {
  className?: string;
}

const GraduationCapLogo: React.FC<Props> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10L12 5L21 10L12 15L3 10Z" />
    <path d="M5 12V18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18V12" />
    <path d="M5 18C5 19.1046 8.13401 20 12 20C15.866 20 19 19.1046 19 18" />
  </svg>
);

export default GraduationCapLogo;
