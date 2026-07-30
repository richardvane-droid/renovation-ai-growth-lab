import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "AI 营销增长工作台｜V4 交互原型";
const description =
  "装修行业 AI 营销增长工作台新版交互原型，覆盖视频增长、企微销售与断联召回的 25 个主页面及 15 个详情页。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  return {
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "zh_CN",
      images: [
        {
          url: `${baseUrl}/og.png`,
          width: 1728,
          height: 914,
          alt: "AI 营销增长工作台 V4 交互原型",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
