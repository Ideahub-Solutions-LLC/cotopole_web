import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cotople — Contact intelligence",
  description: "A focused workspace for event contact capture and follow-up readiness."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
