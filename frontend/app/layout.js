import './globals.css'

export const metadata = {
  title: 'Spice Garden — AI Dining',
  description: 'AI-powered smart dining assistant',
  manifest: '/manifest.json',
  themeColor: '#ff6b35',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Spice Garden'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#ff6b35" />
      </head>
      <body style={{ position: 'relative', zIndex: 1 }}>{children}</body>
    </html>
  )
}