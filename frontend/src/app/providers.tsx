"use client";

import Link from "next/link";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Theme } from "@astryxdesign/core/theme";
import jaJP from "@astryxdesign/core/locales/ja-JP.generated.js";
import { ippoTheme } from "@/lib/theme";

// Astryx の部品に入っている文言（ページ送りの「次へ」など）を日本語にする
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <InternationalizationProvider locale="ja-JP" messages={{ "ja-JP": jaJP }}>
      <Theme theme={ippoTheme} mode="system">
        <LinkProvider component={Link}>{children}</LinkProvider>
      </Theme>
    </InternationalizationProvider>
  );
}
