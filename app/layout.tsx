import type { Metadata } from "next";
import { Antonio, Outfit } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

const antonio = Antonio({
  variable: "--font-lateral-src",
  subsets: ["latin"],
  weight: ["700"],
});

const outfit = Outfit({
  variable: "--font-aeonik-src",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Keel",
  description: "Understand your investing options, one clear step at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${antonio.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-aeonik-pro">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
