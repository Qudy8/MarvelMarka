import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "Marvel Timeline Board — карта киновселенной",
    description: "Интерактивная карта фильмов Marvel: исследуйте фазы, добавляйте фото, заметки и связи.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Marvel Timeline Board",
      description: "Вся киновселенная на одной интерактивной карте.",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "Marvel Timeline Board" }],
    },
    twitter: { card: "summary_large_image", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
