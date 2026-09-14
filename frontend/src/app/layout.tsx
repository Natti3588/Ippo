import type { Metadata } from "next";
import { BIZ_UDPGothic, Literata } from "next/font/google";
import "./globals.css";

// 日本語UI用。教育・行政で使われるユニバーサルデザイン書体。
// 読み手が40〜60代なので、字形の見分けやすさを優先している。
const ui = BIZ_UDPGothic({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

// 英語本文用。画面で長文を読むために作られた書体。
// 投稿本文は英語が多いので、本文にだけ当てる。
const read = Literata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-read",
});

export const metadata: Metadata = {
  title: "Ippo — 英語学習掲示板",
  description:
    "英語を始めた人が、読んだ本や聞いた番組のことを書いていく掲示板です。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${ui.variable} ${read.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
