// app/layout.js

import "./globals.css";

export const metadata = {
  title: "Tandem School Run",
  description: "School run coordination for Maple Walk Prep",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
