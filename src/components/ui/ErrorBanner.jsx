import React from 'react';

const ErrorBanner = ({ message, children }) => {
  if (!message && !children) return null;

  return (
    <div className="error-banner" role="alert" aria-live="polite">
      {message && <div className="error-banner-message">{message}</div>}
      {children}
    </div>
  );
};

export default ErrorBanner;
