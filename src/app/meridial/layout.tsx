import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meridial",
  description: "Document verification powered by Meridial",
};

export default function MeridialLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
