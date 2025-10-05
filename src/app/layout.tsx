import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/provider/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import FeedbackTrigger from "@/components/feedback/feedback-trigger";


export const metadata: Metadata = {
  title: "Skroub",
  description: "AI agents that run continuously to find relevant threads/posts",
  icons: "/favicon.png",
};
const outfit = Outfit({ subsets: ["latin"] });
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn("bg-transparent", outfit.className)}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FeedbackTrigger/>
          <Toaster />
          {children}
          
        </ThemeProvider>
      </body>
    </html>
    </SessionProvider>
  );
}
