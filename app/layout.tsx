import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/app/context/CartContext";
import AiShopper from "@/app/components/AiShopper";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { NavigationProvider } from "@/app/context/NavigationContext";
import { ThemeProvider } from "@/app/context/ThemeContext";

const figtree = localFont({
  src: [
    {
      path: "../public/fonts/figtree/Figtree-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/figtree/Figtree-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/figtree/Figtree-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/figtree/Figtree-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/figtree/Figtree-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/figtree/Figtree-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/figtree/Figtree-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/figtree/Figtree-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beembai | Premium Curated E-Commerce",
  description:
    "Earthy, premium, and thoughtfully curated design essentials. Crafted to elevate your lifestyle.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className={figtree.variable} suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('beembai_theme');
                    if (theme === 'dark') {
                      document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                      document.documentElement.setAttribute('data-theme', 'light');
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body>
          <ConvexClientProvider>
            <NavigationProvider>
              <CartProvider>
                <ThemeProvider>
                  {children}
                  {/* <AiShopper /> */}
                </ThemeProvider>
              </CartProvider>
            </NavigationProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
