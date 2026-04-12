import type { Metadata } from "next";
import "./globals.css";
import ClinicalWrapper from '../components/ClinicalWrapper';
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: "PCMS | Physiotherapy Clinic Management System",
  description: "Unified Clinical Management Platform for Physiotherapy Centers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }} suppressHydrationWarning>
        <NextTopLoader color="var(--primary)" height={3} showSpinner={false} />
        <ClinicalWrapper>
            {children}
        </ClinicalWrapper>
      </body>
    </html>
  );
}
