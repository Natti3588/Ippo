import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// 本文に書かれた HTML は文字として出す。rehype-raw は入れない。
// 表示してよい要素をここで絞り、それ以外は外して中の文字だけを残す。
// 斜体（em）が外れるのも、ここに入れていないため。
const ALLOWED = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "a",
  "blockquote",
  "img",
  "code",
  "pre",
];

// pre の中身(hast)から文字だけを取り出す。
type HastNode = { value?: string; children?: HastNode[] };
function textOf(node: HastNode): string {
  return node.value ?? node.children?.map(textOf).join("") ?? "";
}

// 詳細画面ではタイトルが h1 なので、本文の見出しは1段下げる。
const components: Components = {
  h1: ({ children }) => (
    <h2 className="mt-6 mb-2 text-subtitle font-bold first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mt-6 mb-2 text-body font-bold first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-6 mb-2 text-body font-bold first:mt-0">{children}</h4>
  ),
  h4: ({ children }) => (
    <h4 className="mt-6 mb-2 text-body font-bold first:mt-0">{children}</h4>
  ),
  h5: ({ children }) => (
    <h4 className="mt-6 mb-2 text-body font-bold first:mt-0">{children}</h4>
  ),
  h6: ({ children }) => (
    <h4 className="mt-6 mb-2 text-body font-bold first:mt-0">{children}</h4>
  ),
  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc pl-6 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal pl-6 last:mb-0">{children}</ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-4 border-border pl-4 text-ink-soft last:mb-0">
      {children}
    </blockquote>
  ),
  // 英語学習の掲示板でプログラムを載せる場面はない。
  // 文中の表現を浮かせる用途だけに絞り、``` のブロックはコードらしく飾らない。
  // 中の code を描くとインラインの飾りが付くので、children は使わず文字だけを出す。
  // react-markdown は inline かどうかを渡さないため、pre の側で見分ける。
  pre: ({ node }) => (
    <p className="mb-4 whitespace-pre-wrap last:mb-0">
      {node ? textOf(node as HastNode).replace(/\n$/, "") : null}
    </p>
  ),
  code: ({ children }) => (
    <code className="rounded border border-border bg-surface px-1.5 font-mono">{children}</code>
  ),
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  // 外のサイトへ出るので、元のタブを残す。
  // 利用者が書いたリンクなので、サイトが推薦したものとは扱わせない（nofollow ugc）。
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      className="text-accent underline underline-offset-4 hover:text-ink transition-colors"
    >
      {children}
    </a>
  ),
  // 画像は外の任意のサイトのもの。next/image は許可するドメインを先に決める作りなので使えない。
  // 閲覧者の訪問元を相手に渡さないよう、referrerPolicy を切る。
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      referrerPolicy="no-referrer"
      loading="lazy"
      className="max-w-full h-auto rounded-ippo"
    />
  ),
};

// 文字だけの出し方。ブロックになる要素だけを残し、後ろに空白を1つ足す。
// 区切りがないと、隣の段落の文字とつながって出てしまう。
// 太字・リンク・画像などの要素は許可に入れないので、外れて中の文字だけが残る。
// br も残す。remark-breaks が改行を br にするため、外すと行がつながる。
const PLAIN_ALLOWED = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "blockquote",
  "pre",
];

function withSpace({ children }: { children?: ReactNode }) {
  return <>{children} </>;
}

const plainComponents: Components = {
  p: withSpace,
  br: () => " ",
  h1: withSpace,
  h2: withSpace,
  h3: withSpace,
  h4: withSpace,
  h5: withSpace,
  h6: withSpace,
  li: withSpace,
  blockquote: withSpace,
  pre: withSpace,
};

export function Markdown({ children, plain = false }: { children: string; plain?: boolean }) {
  if (plain) {
    return (
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkBreaks]}
        allowedElements={PLAIN_ALLOWED}
        unwrapDisallowed
        components={plainComponents}
      >
        {children}
      </ReactMarkdown>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkBreaks]}
      allowedElements={ALLOWED}
      unwrapDisallowed
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}
