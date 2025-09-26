import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Sanctuari - AI-Powered Insurance Procurement Platform",
  description: "Simplifying business insurance procurement in India with AI-powered RFQs, transparent bidding, and intelligent quote comparison.",
  keywords: "insurance, procurement, business insurance, India, RFQ, quotes, brokers",
  authors: [{ name: "Sanctuari" }],
  openGraph: {
    title: "Sanctuari - Smart Insurance Procurement",
    description: "Transform how you buy business insurance",
    url: "https://platform.sanctuari.io",
    siteName: "Sanctuari",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#000',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
