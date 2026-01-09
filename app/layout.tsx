import type { Metadata, Viewport } from "next";
import { Poppins, Quicksand } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { ProgressBarProvider } from "@/components/providers/progress-bar";
import SessionProvider from "@/components/providers/session-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Patroli Satpam",
  description: "Sistem Monitoring Patroli Satpam",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Patroli Satpam",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${poppins.variable} ${quicksand.variable} antialiased`}>
        <ProgressBarProvider>
          <SessionProvider>{children}</SessionProvider>
        </ProgressBarProvider>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#333",
              color: "#fff",
              borderRadius: "10px",
              padding: "12px 16px",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}

