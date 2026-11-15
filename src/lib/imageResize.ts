// 上傳前先在手機上把照片縮小：手機照片動輒 5~10MB，縮到長邊 1280px 的 JPEG 後通常只剩 200~400KB，
// 上傳快、省流量，也不會吃掉免費儲存空間。

export async function resizeImage(file: Blob, maxSide = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("這個瀏覽器無法處理圖片");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("圖片轉換失敗"))),
      "image/jpeg",
      quality,
    );
  });
}
