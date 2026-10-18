"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

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

/**
 * Custom router hook that automatically triggers the loading screen on programmatic navigation
 */
export const useAppRouter = () => {
  const router = useRouter();
  const { startLoading } = useNavigationLoader();

  return {
    ...router,
    push: (href: string, options?: any) => {
      startLoading();
      return router.push(href, options);
    },
    replace: (href: string, options?: any) => {
      startLoading();
      return router.replace(href, options);
    },
  };
};

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loading status once page pathname or search parameters change
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Safety fallback: auto-clear loader after 8 seconds if navigation fails or is aborted
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setIsLoading(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handle global link clicks with CAPTURE phase so it intercepts BEFORE Next.js <Link> prevents default
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Ignore non-primary clicks (middle click, right click) or modified clicks (cmd, ctrl, shift, alt)
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;

      if (anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("javascript:") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:")
      ) {
        return;
      }

      try {
        const nextUrl = new URL(anchor.href, window.location.href);

        // Verify same origin
        if (nextUrl.origin !== window.location.origin) return;

        // Skip loader if navigating to the exact same page & search (e.g. hash-only anchor like #reviews)
        const isSamePage =
          nextUrl.pathname === window.location.pathname &&
          nextUrl.search === window.location.search;

        if (isSamePage) {
          return;
        }

        // Show loading screen immediately!
        setIsLoading(true);
      } catch {
        // Fallback for malformed URLs
      }
    };

    // CRITICAL: use { capture: true } so this fires before any child preventDefault or stopPropagation
    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, []);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return (
    <NavigationContext.Provider
      value={{
        isLoading,
        startLoading,
        stopLoading,
      }}
    >
      {children}
      {isLoading && (
        <>
          <div className="globalPageProgressBar" />
          <div className="globalPageLoader" role="status" aria-live="polite" aria-label="Loading page">
            <div className="globalPageLoaderDots">
              <span className="globalPageLoaderDot" />
              <span className="globalPageLoaderDot" />
              <span className="globalPageLoaderDot" />
            </div>
          </div>
        </>
      )}
    </NavigationContext.Provider>
  );
};
