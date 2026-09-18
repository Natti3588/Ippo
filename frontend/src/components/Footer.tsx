import type { ReactNode } from "react";

/**
 * 全画面共通のフッター。
 *
 * "use client" を付けない。状態もイベントも持たないので、
 * サーバー側で HTML になったあと、ブラウザへ JavaScript を送る必要がない。
 * このアプリで layout 以外にサーバーコンポーネントなのは、ここだけ。
 */
export function Footer() {
  return (
    // mt-auto で下へ寄せる。body が flex flex-col なので、
    // 内容が短い画面（ログインなど）でも余白を吸って画面の底に着く。
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto w-full max-w-[680px] px-4 py-10 md:px-5">
        <p className="text-subtitle font-bold text-ink">Ippo</p>
        <p className="mt-2 max-w-[30em] text-ui text-ink-soft">
          英語を始めた人が、読んだ本や聞いた番組のことを書いていく掲示板です。
        </p>

        {/*
          ここから下は利用者向けではない。採用選考で見る人が
          リポジトリへ行けるようにするためのもの。
          だから小さく、薄い色で、罫線の下に置く。
        */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-5">
          <p className="text-ui text-ink-faint">© 2026 Ippo</p>

          <div className="flex items-center gap-1">
            <External href="https://github.com/Natti3588" label="GitHub">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
              </svg>
            </External>

            {/*
              X のロゴは文字そのものなので、隣に X と書くと二重になる。
              GitHub のマークは猫で読めないため、あちらには文字を残す。
              読み上げには aria-label が残るので、どちらも名前は伝わる。
            */}
            <External href="https://x.com/Sameta_umi" label="X" showLabel={false}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
              </svg>
            </External>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * 外部サイトへのリンク。
 *
 * aria-label に「新しいタブで開きます」を入れている。
 * 別のタブが開くことを、押す前に知らせないと、戻れなくなったと感じる人がいる。
 */
function External({
  href,
  label,
  showLabel = true,
  children,
}: {
  href: string;
  label: string;
  showLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      // noopener が無いと、開いた先から window.opener 経由でこのページを操作できる。
      rel="noopener noreferrer"
      aria-label={`${label}（新しいタブで開きます）`}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-ippo px-2.5 text-ui text-ink-soft hover:text-ink transition-colors"
    >
      {children}
      {showLabel && label}
    </a>
  );
}
