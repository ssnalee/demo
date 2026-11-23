/** 사진을 축소·압축해서 dataURL로 반환 (localStorage 용량 절약) */
export function compressImage(
  file: File,
  { max = 1000, quality = 0.62, limit = 450_000 }: { max?: number; quality?: number; limit?: number } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("이미지 파일만 첨부할 수 있습니다."));
    if (file.size > 20 * 1024 * 1024) return reject(new Error("사진 한 장은 20MB 이하 파일을 선택해 주세요."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("사진 파일을 읽지 못했습니다."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지 형식을 처리할 수 없습니다."));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        let data = canvas.toDataURL("image/jpeg", quality);
        if (data.length > limit) data = canvas.toDataURL("image/jpeg", Math.max(0.4, quality - 0.2));
        resolve(data);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
