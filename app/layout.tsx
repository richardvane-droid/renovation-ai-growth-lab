import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "AKKE｜门店营销助手｜V4.1 交互原型";
const description =
  "AKKE 全屋定制门店营销助手的操作演示，包含短视频获客、企微自动接待、沉默客户跟进和企业大脑。页面均为演示数据，不会向真实客户发送消息。";

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
          width: 1672,
          height: 941,
          alt: "AKKE 门店营销助手 V4.1 交互原型",
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
