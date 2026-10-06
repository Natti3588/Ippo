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
      ];
    },
  };
}
