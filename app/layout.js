import './components/globals.css'

export const metadata = {
  title: 'Tandem - School Run Coordination',
  description: 'Coordinate school runs for Maple Walk Prep School',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;" />
      </head>
      <body>{children}</body>
    </html>
  )
}

