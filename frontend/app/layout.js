import './globals.css'

export const metadata = {
  title: 'Spice Garden — Smart Dining',
  description: 'AI-powered dining experience',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}