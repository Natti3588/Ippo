import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発時だけ、フロントエンドとバックエンドを同一オリジンに見せる。
  //
  // セッションは HttpOnly Cookie で運ぶ。localhost:3000 と localhost:8080 は
  // 別オリジンなので、素直に叩くと Cookie が送られずログインできない。
  //
  // 本番は静的エクスポート（ADR-0005）なので rewrites は動かない。
  // CloudFront が「/ は S3、/api/* は ALB」と振り分ける。
  // そのため next dev にだけ効けばよい。
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/:path*",
      },
    ];
  },
};

export default nextConfig;
