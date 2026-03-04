import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JDLO — Systems Operator & Digital Growth",
  description:
    "I build systems that turn attention into action. UI/UX design, creative coding, and digital growth by Jordan Lopez.",
  icons: {
    icon: "/jordan.jpg",
  },
  openGraph: {
    title: "JDLO — Systems Operator",
    description: "I build systems that turn attention into action.",
    url: "https://jdlo.site",
    siteName: "JDLO",
    images: [{ url: "/jordan.jpg", width: 1200, height: 1500, alt: "Jordan Lopez — JDLO" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JDLO — Systems Operator",
    description: "I build systems that turn attention into action.",
    images: ["/jordan.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
