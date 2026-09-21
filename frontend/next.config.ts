import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // output: "export" は書かない。書くと投稿詳細が壊れる。
  //
  // 静的エクスポートはビルドの時点で HTML を吐き切るので、/posts/[id] の id を
  // あらかじめ並べておく必要がある。投稿は利用者が増やしていくものだから
  // 並べようがなく、ビルドより後に書かれた投稿はすべて 404 になってしまう。
  // だから Next.js はサーバーとして動かしている。ただし SSR は使っていない。

  // 開発中だけ、フロントとバックエンドを同じオリジンに見せる。
  //
  // セッションは HttpOnly Cookie で運んでいる。localhost:3000 と localhost:8080 は
  // 別のオリジンなので、そのまま叩くと Cookie が乗らず、ログインできない。
  //
  // 本番はロードバランサが先に振り分けるので、ここまで届かない。
  // 同じ振り分けが2か所にある。どちらが効いているか取り違えないように。
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
