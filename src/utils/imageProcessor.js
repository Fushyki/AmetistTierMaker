/**
 * Utilitário de redimensionamento e processamento de imagens via Canvas HTML5.
 */

export function processImage(file, targetWidth, targetHeight, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const w = targetWidth || img.width;
        const h = targetHeight || img.height;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;
        
        const scale = Math.max(w / img.width, h / img.height);
        const newW = img.width * scale;
        const newH = img.height * scale;
        const x = (w - newW) / 2;
        const y = (h - newH) / 2;
        
        ctx.drawImage(img, x, y, newW, newH);
        resolve({
          dataUrl: canvas.toDataURL('image/webp', quality),
          width: w,
          height: h
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
