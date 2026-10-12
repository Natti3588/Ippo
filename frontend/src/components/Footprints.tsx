import type { CSSProperties } from "react";

/**
 * PC の広い画面で、本文の左右の余白に描く飾り。
 * 点線の小道に沿って、足あとが下から上へ歩いていく。Ippo（一歩）にちなむ。
 *
 * 画面に固定せず、ページと一緒に流す。固定すると、足あとの上を本文が
 * 滑っていくように見えて落ち着かない。ページの長さは画面ごとに違うので、
 * 1区間ぶんの絵を作り、縦にくり返して下まで続ける。
 *
 * 余白が本文の列（680px）の両側に十分あるときだけ出す（xl = 1280px 以上）。
 * それより狭いと、足あとが本文にかかる。
 *
 * 位置は乱数を使わず、式で決める。サーバーで描いた絵とブラウザの絵が食い違わず、
 * 開くたびに形が変わることもない。
 */

const TILE_WIDTH = 200;

/**
 * 1区間ぶんの小道と足あとを SVG の文字列で返す。
 * 道は sin で揺らし、1区間でちょうど1周させる。こうすると区間の上端と
 * 次の区間の下端が同じ位置になり、くり返しても継ぎ目が出ない。
 */
function tile(height: number, steps: number, amp: number, phase: number) {
  const x0 = TILE_WIDTH / 2;
  const at = (i: number) => ({
    x: x0 + amp * Math.sin(phase + (2 * Math.PI * i) / steps),
    y: height - (height * i) / steps,
  });

  const line = Array.from({ length: steps + 1 }, (_, i) => at(i));
  const d = "M" + line.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L");

  const feet = Array.from({ length: steps }, (_, i) => {
    // 区間の端に足が重ならないよう、半歩ずらした位置に置く
    const p = at(i + 0.5);
    const next = at(i + 1);
    const prev = at(i);
    // 進む向き。上がまっすぐ 0 度
    const angle = (Math.atan2(next.x - prev.x, -(next.y - prev.y)) * 180) / Math.PI;
    const left = i % 2 === 0;
    // 中心線から左右へ少しずらして、左足と右足にする
    const off = left ? -8 : 8;
    const r = (angle * Math.PI) / 180;
    const x = p.x + off * Math.cos(r);
    const y = p.y + off * Math.sin(r);
    return (
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${left ? -1.5 : 1.5} 1.5)">` +
      `<path d="M0 -4 C5 -4 6.5 2 6 7 C5.5 12 4.5 16 0.5 16 C-3 16 -4 12 -3.5 7 C-3 2 -4.5 -4 0 -4Z"/>` +
      `<circle cx="-3.6" cy="-7.5" r="1.7"/><circle cx="-0.6" cy="-9" r="1.5"/>` +
      `<circle cx="2.2" cy="-8.6" r="1.3"/><circle cx="4.4" cy="-7.2" r="1.1"/>` +
      `<circle cx="6" cy="-5.4" r="0.9"/></g>`
    );
  }).join("");

  // 区間の上下の端にかかる足は、端で切れてしまう。1区間ぶん上と下にずらした
  // 写しも描いておくと、はみ出した部分が隣の区間の側に描かれて、つながって見える。
  const wrapped = [-height, 0, height]
    .map((dy) => `<g transform="translate(0 ${dy})">${feet}</g>`)
    .join("");

  // 色は持たせない。mask として使い、濃さ（不透明度）だけを決める。
  // 色は要素の背景色（サイトの緑）から取るので、暗い画面でも切り替わる。
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_WIDTH}" height="${height}" viewBox="0 0 ${TILE_WIDTH} ${height}">` +
    `<path d="${d}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="1.2" stroke-dasharray="1 5" stroke-linecap="round"/>` +
    `<g fill="#000" fill-opacity="0.16">${wrapped}</g>` +
    `</svg>`;

  return { uri: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, height };
}

// 左右で区間の長さ、歩数、揺れ幅を変え、同じ模様が並んで見えないようにする
const LEFT = tile(720, 18, 34, 0);
const RIGHT = tile(640, 16, 30, Math.PI / 2);

function maskStyle({ uri, height }: { uri: string; height: number }): CSSProperties {
  const size = `${TILE_WIDTH}px ${height}px`;
  return {
    maskImage: uri,
    maskRepeat: "repeat-y",
    maskSize: size,
    maskPosition: "center top",
    WebkitMaskImage: uri,
    WebkitMaskRepeat: "repeat-y",
    WebkitMaskSize: size,
    WebkitMaskPosition: "center top",
  };
}

export function Footprints() {
  return (
    /*
      body を基準に、ヘッダーの下からページの一番下まで広げる。
      -z-10 で本文より後ろに置く。フッターは背景の色を持つので、その上には出ない。
    */
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-14 bottom-0 -z-10 hidden xl:block"
    >
      <div
        className="absolute inset-y-0 left-0 w-[calc((100%-680px)/2)] bg-accent"
        style={maskStyle(LEFT)}
      />
      <div
        className="absolute inset-y-0 right-0 w-[calc((100%-680px)/2)] bg-accent"
        style={maskStyle(RIGHT)}
      />
    </div>
  );
}
