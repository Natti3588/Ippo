import { api } from "@/lib/api";

// 本文の幅（680px）の2倍あれば、高解像度の画面でもぼやけない。
// スマートフォンの写真（長い辺が4000px前後）は、これで数百KBになる。
const MAX_SIDE = 1600;
const QUALITY = 0.85;

// 電波の弱い所で送信が止まると、ボタンも「投稿する」も押せないまま戻らない。
// 描き直した画像は数百KBなので、遅い回線でも数秒で終わる。60秒待って届かなければ失敗に倒す。
const SEND_TIMEOUT_MS = 60_000;

/** 選ばれたファイルを、画像として読めなかった。 */
export class ImageDecodeError extends Error {}

/** S3 が受け取らなかった。期限切れ、大きすぎる、通信の失敗など。 */
export class StorageError extends Error {}

/**
 * 画像を、長い辺が MAX_SIDE 以下の JPEG に描き直す。
 *
 * 描き直すと、元のファイルの EXIF（撮った場所など）は付いてこない。
 * createImageBitmap は EXIF の向きを反映してから読むので、縦の写真は縦のまま描かれる。
 */
async function toJpeg(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageDecodeError();
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new ImageDecodeError();
  }
  // JPEG は透明を持てない。塗らずに描くと、透明な PNG の背景が黒くなる。
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) throw new ImageDecodeError();
  return blob;
}

/**
 * 画像を1枚 S3 へ送り、本文に書くパス（/uploads/<id>.jpg）を返す。
 *
 * 描き直してから許可証をもらう。許可証の期限は5分なので、
 * 大きな写真の描き直しで期限を使わないようにする。
 */
export async function uploadImage(file: File): Promise<string> {
  const jpeg = await toJpeg(file);
  const ticket = await api.createUpload();

  const form = new FormData();
  for (const [name, value] of Object.entries(ticket.fields)) {
    form.append(name, value);
  }
  // S3 は file より後ろの項目を読まない。必ず最後に入れる。
  form.append("file", jpeg);

  // Cookie は S3 に要らないので、credentials は付けない。
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(ticket.url, { method: "POST", body: form, signal: controller.signal });
  } catch {
    throw new StorageError();
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new StorageError();

  return ticket.path;
}
