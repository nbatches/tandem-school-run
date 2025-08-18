import './app/globals.css'

export const metadata = {
  title: 'Tandem - School Run Coordination',
  description: 'Coordinate school runs for Maple Walk Prep School',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
