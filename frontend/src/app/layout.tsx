import type { Metadata } from "next";
import { BIZ_UDPGothic, Literata } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// 日本語のUI用。教育や行政で使われているユニバーサルデザイン書体。
// 読み手が40〜60代なので、字形の見分けやすさを優先した。
const ui = BIZ_UDPGothic({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

// 英語の本文用。画面で長い文章を読むために作られた書体。
// 投稿は英語が多いので、本文にだけ当てる。
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
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
