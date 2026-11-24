import { defineTheme } from "@astryxdesign/core/theme";
import { stoneTheme } from "@astryxdesign/theme-stone/built";

// stone の書体は欧文だけなので、日本語には Noto Sans JP を当てる
export const ippoTheme = defineTheme({
  name: "stone",
  extends: stoneTheme,
  tokens: {
    "--font-family-body": "Figtree, var(--font-noto-jp), sans-serif",
    "--font-family-heading": "Montserrat, Figtree, var(--font-noto-jp), sans-serif",
  },
});
