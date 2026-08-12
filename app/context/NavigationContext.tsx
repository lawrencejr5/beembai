"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavigationContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigationLoader = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigationLoader must be used within a NavigationProvider");
  }
  return context;
};

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loading status once page pathname or search parameters change
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Handle global internal link navigation clicks
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const targetAttr = anchor.getAttribute("target");
      const download = anchor.getAttribute("download");

      // Verify that it is a standard internal navigation link
      if (
        href &&
        href.startsWith("/") &&
        targetAttr !== "_blank" &&
        download === null &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        // Skip loader only for home page hash anchors when already on the home page
        if (href.startsWith("/#") && window.location.pathname === "/") {
          return;
        }

        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          setIsLoading(true);
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        isLoading,
        startLoading: () => setIsLoading(true),
        stopLoading: () => setIsLoading(false),
      }}
    >
      {children}
      {isLoading && (
        <div className="globalPageLoader">
          <div className="globalPageLoaderDots">
            <span className="globalPageLoaderDot" />
            <span className="globalPageLoaderDot" />
            <span className="globalPageLoaderDot" />
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
};
