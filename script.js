// ================= GET ELEMENTS =================
const imageInput = document.getElementById("imageInput");
const targetInput = document.getElementById("targetSize");
const unitSelect = document.getElementById("sizeUnit");
const compressBtn = document.getElementById("compressBtn");
const preview = document.getElementById("preview");
const status = document.getElementById("status");
const downloadBtn = document.getElementById("downloadBtn");

let finalDownloadBlob = null;

// ================= UPLOAD → ORIGINAL PREVIEW =================
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);

  // auto size detect KB / MB
  let sizeText;
  if (file.size >= 1024 * 1024) {
    sizeText = (file.size / (1024 * 1024)).toFixed(2) + " MB";
  } else {
    sizeText = (file.size / 1024).toFixed(2) + " KB";
  }

  // reset old result
  status.innerText = "";
  preview.innerHTML = `
    <p style="text-align:center;font-weight:bold;">
      Original Image
    </p>
    <img src="${url}" style="max-width:100%;border-radius:8px;">
    <p style="text-align:center;margin-top:8px;">
      <strong>Original Size:</strong> ${sizeText}
    </p>
  `;
  downloadBtn.style.display = "none";
  finalDownloadBlob = null;
});

// ================= COMPRESS BUTTON =================
compressBtn.addEventListener("click", async () => {
  const file = imageInput.files[0];
  if (!file) {
    alert("Please select an image");
    return;
  }

  const value = parseFloat(targetInput.value);
  if (!value || value <= 0) {
    alert("Enter valid size");
    return;
  }

  const unit = unitSelect.value;
  const targetBytes =
    unit === "MB" ? value * 1024 * 1024 : value * 1024;

  status.innerText = "Compressing...";
  preview.innerHTML = "";
  downloadBtn.style.display = "none";

  // compress image
  let compressedBlob = await compressImage(file, targetBytes);

  // preview (clean image)
  const previewUrl = URL.createObjectURL(compressedBlob);

  // exact size download (padding if needed)
  let downloadBlob = compressedBlob;
  if (compressedBlob.size < targetBytes) {
    downloadBlob = padBlobToSize(compressedBlob, targetBytes);
  }

  finalDownloadBlob = downloadBlob;
  const finalSizeKB = (downloadBlob.size / 1024).toFixed(2);

  preview.innerHTML = `
    <p style="text-align:center;font-weight:bold;">
      Compressed Image
    </p>
    <img src="${previewUrl}" style="max-width:100%;border-radius:8px;">
    <p style="text-align:center;margin-top:8px;">
      <strong>Compressed Size:</strong> ${finalSizeKB} KB
    </p>
  `;

  status.innerText = "Done ✔";
  downloadBtn.style.display = "block";
});

// ================= DOWNLOAD =================
downloadBtn.addEventListener("click", () => {
  if (!finalDownloadBlob) return;

  const url = URL.createObjectURL(finalDownloadBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "converted-image.jpg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ================= IMAGE COMPRESSION FUNCTION =================
function compressImage(file, targetBytes) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let quality = 0.9;

      function tryCompress() {
        canvas.toBlob(
          (blob) => {
            if (blob.size <= targetBytes || quality <= 0.05) {
              resolve(blob);
            } else {
              quality -= 0.05;
              tryCompress();
            }
          },
          "image/jpeg",
          quality
        );
      }

      tryCompress();
    };

    reader.readAsDataURL(file);
  });
}

// ================= PADDING (SIZE INCREASE) =================
function padBlobToSize(blob, targetBytes) {
  if (blob.size >= targetBytes) return blob;
  const padding = new Uint8Array(targetBytes - blob.size);
  return new Blob([blob, padding], { type: blob.type });
}
