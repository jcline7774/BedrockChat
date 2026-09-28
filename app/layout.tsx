import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bedrock Streaming Chat",
  description: "Next.js + TypeScript demo streaming Claude responses from Amazon Bedrock.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
