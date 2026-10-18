import React from "react";

export default function RootLoading() {
  return (
    <>
      <div className="globalPageProgressBar" />
      <div
        className="globalPageLoader"
        role="status"
        aria-live="polite"
        aria-label="Loading page"
      >
        <div className="globalPageLoaderDots">
          <span className="globalPageLoaderDot" />
          <span className="globalPageLoaderDot" />
          <span className="globalPageLoaderDot" />
        </div>
      </div>
    </>
  );
}
