import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@/styles/globals.css';

export const metadata = {
  title: 'Sanctuari | AI-Powered Insurance Procurement',
  description: 'Simplify your B2B insurance procurement with AI-powered RFQ management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
