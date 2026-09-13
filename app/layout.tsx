import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Antonio, Outfit } from "next/font/google";
import { keelLocalization } from "@/lib/clerkAppearance";
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
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Keel",
  description: "Understand your investing options, one clear step at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <html
      lang="en"
      className={`${antonio.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-aeonik-pro">
        {clerkPublishableKey ? (
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            localization={keelLocalization}
            appearance={{
              variables: {
                colorPrimary: "#205daa",
                colorBackground: "#ffffff",
                borderRadius: "12px",
                fontFamily: "var(--font-aeonik-pro)",
              },
            }}
          >
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ClerkProvider>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-sky-wash px-6">
            <div className="max-w-lg rounded-[20px] border border-carbon bg-paper-white p-8 text-carbon">
              <p className="font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
                Clerk not connected
              </p>
              <h1 className="mt-3 font-aeonik-pro text-[30px] font-bold leading-[1.1]">
                Missing Clerk keys
              </h1>
              <p className="mt-3 font-aeonik-pro text-[15px] font-medium leading-[1.39] tracking-[-0.01em]">
                Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
                <code>CLERK_SECRET_KEY</code> to <code>.env.local</code>, then
                restart Next.js.
              </p>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
