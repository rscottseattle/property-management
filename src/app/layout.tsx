import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Property Manager — Software for Small Landlords",
    template: "%s | Property Manager",
  },
  description:
    "Free property management software for small landlords. Track tenants, leases, rent payments, maintenance, and finances — all in one place.",
  keywords: [
    "property management software",
    "landlord software",
    "rent collection",
    "tenant management",
    "small landlord",
    "property manager app",
  ],
  openGraph: {
    title: "Property Manager — Software for Small Landlords",
    description:
      "Free property management software for small landlords. Track tenants, leases, rent payments, maintenance, and finances — all in one place.",
    type: "website",
    siteName: "Property Manager",
  },
  twitter: {
    card: "summary_large_image",
    title: "Property Manager — Software for Small Landlords",
    description:
      "Free property management software for small landlords. Track tenants, leases, rent payments, maintenance, and finances — all in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
