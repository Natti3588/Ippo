import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    output: "standalone",

    // /api を Go へ取り次ぐのは開発のときだけ。本番では ALB が /api/* を Go へ送る。
    // 本番に残すと、ALB のルールを間違えたときに Next.js が localhost:8080 へ取り次ごうとして
    // 失敗し、どこが悪いのか分かりにくくなる。
    async rewrites() {
      if (phase !== PHASE_DEVELOPMENT_SERVER) {
        return [];
      }
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8080/api/:path*",
        },
        // 画像は S3 にあり、手元には無い。本番の CloudFront から取る。
        // 送り先も本番と同じバケットなので、手元で入れた画像もそこにある。
        {
          source: "/uploads/:path*",
          destination: "https://d18vvdkldxsijp.cloudfront.net/uploads/:path*",
        },
      ];
    },
  };
}
