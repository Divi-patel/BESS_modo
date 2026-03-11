import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DashboardProvider } from "@/components/DashboardProvider";
import { ConfigSidebar } from "@/components/ConfigSidebar";
import { Navigation } from "@/components/Navigation";
import { AssumptionBanner } from "@/components/AssumptionBanner";
import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ERCOT BESS Revenue — Hub & Node Analysis",
  description: "Interactive analysis of battery energy storage revenue across ERCOT hubs and resource nodes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <DashboardProvider>
            <div className="flex h-screen overflow-hidden">
              <ConfigSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <Navigation />
                <main className="flex-1 overflow-y-auto p-4">
                  {children}
                </main>
                <AssumptionBanner />
                <Footer />
              </div>
            </div>
          </DashboardProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
