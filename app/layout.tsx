import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "beembai | Premium Curated E-Commerce",
  description: "Earthy, premium, and thoughtfully curated design essentials. Crafted to elevate your lifestyle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body>{children}</body>
    </html>
  );
}
