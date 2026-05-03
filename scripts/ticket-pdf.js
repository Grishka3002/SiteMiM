export function buildTicketQrValue(ticket) {
  return JSON.stringify({
    ticketCode: ticket.code,
    seatLabel: ticket.seatLabel,
    deviceId: ticket.issuedDeviceId
  });
}

export function buildQrImageUrls(value, options = {}) {
  const { size = 500, dark = "000000", light = "00000000" } = options;
  const encodedValue = encodeURIComponent(value);
  return [
    `https://quickchart.io/qr?size=${size}&margin=0&dark=${dark}&light=${light}&text=${encodedValue}`,
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&color=${dark}&bgcolor=${light}&data=${encodedValue}`
  ];
}

function splitSeatLabel(seatLabel) {
  const match = String(seatLabel).trim().match(/^([\p{L}0-9]+)\s*-?\s*(\d+)$/u);
  if (!match) {
    return { rowLabel: String(seatLabel).trim(), seatNumber: "" };
  }
  return { rowLabel: match[1].toUpperCase(), seatNumber: match[2] };
}

function wrapLinesForCanvas(context, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

async function tryFetchBytes(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok ? response.arrayBuffer() : null;
  } catch {
    return null;
  }
}

function loadBrowserImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function loadFirstAvailableImage(urls) {
  for (const url of urls) {
    const image = await loadBrowserImage(url).catch(() => null);
    if (image) return image;
  }
  return null;
}

function makeWhitePixelsTransparent(image) {
  const canvas = document.createElement("canvas");
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return image;

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    if (data[index] > 245 && data[index + 1] > 245 && data[index + 2] > 245) {
      data[index + 3] = 0;
    }
  }

  context.putImageData(imageData, 0, 0);
  return loadBrowserImage(canvas.toDataURL("image/png"));
}

function drawTemplateOverlay(context, ticket, qrImage, width, height) {
  const scaleX = width / 2520;
  const scaleY = height / 945;
  const { rowLabel, seatNumber } = splitSeatLabel(ticket.seatLabel);
  const contentLeft = 930 * scaleX;
  const contentRight = 1810 * scaleX;
  const contentCenter = (contentLeft + contentRight) / 2;
  const contentWidth = contentRight - contentLeft;
  const rowBox = { x: 1212 * scaleX, y: 505 * scaleY, width: 172 * scaleX, height: 80 * scaleY };
  const seatBox = { x: 1478 * scaleX, y: 611 * scaleY, width: 176 * scaleX, height: 88 * scaleY };

  context.textBaseline = "alphabetic";
  context.textAlign = "center";
  context.fillStyle = "#111111";
  context.font = `800 ${58 * scaleY}px Manrope, Arial, sans-serif`;
  wrapLinesForCanvas(context, ticket.fullName, contentWidth - 40 * scaleX)
    .slice(0, 2)
    .forEach((line, index) => context.fillText(line, contentCenter, (332 + index * 70) * scaleY));

  context.font = `600 ${22 * scaleY}px Manrope, Arial, sans-serif`;
  context.fillStyle = "#3d3f49";
  context.fillText(`Билет № ${ticket.code}`, contentCenter, 487 * scaleY);

  context.fillStyle = "#222222";
  context.font = `800 ${34 * scaleY}px Manrope, Arial, sans-serif`;
  context.fillText(rowLabel || "-", rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height * 0.68);
  context.fillText(seatNumber || ticket.seatLabel, seatBox.x + seatBox.width / 2, seatBox.y + seatBox.height * 0.68);

  if (qrImage) {
    const qrBoxX = 2068 * scaleX;
    const qrBoxY = 248 * scaleY;
    const qrBoxSize = 302 * scaleX;
    const qrPad = 16 * scaleX;
    context.drawImage(qrImage, qrBoxX + qrPad, qrBoxY + qrPad, qrBoxSize - qrPad * 2, qrBoxSize - qrPad * 2);
  }
}

async function buildTicketOverlayDataUrl(ticket, options = {}) {
  const { width, height } = options;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context is unavailable");

  const qrImage = await loadFirstAvailableImage(
    buildQrImageUrls(buildTicketQrValue(ticket), { size: 500, dark: "000000", light: "00000000" })
  )
    .then((image) => (image ? makeWhitePixelsTransparent(image) : null))
    .catch(() => null);

  drawTemplateOverlay(context, ticket, qrImage, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export async function buildTicketsPdfBlob(tickets) {
  if (!window.PDFLib) throw new Error("PDF library is unavailable");

  const { PDFDocument } = window.PDFLib;
  const templateBytes = await tryFetchBytes("/images/ticket.pdf");
  const pdfDoc = await PDFDocument.create();

  for (const ticket of tickets) {
    if (!templateBytes) throw new Error("Ticket template is unavailable");

    const templateDoc = await PDFDocument.load(templateBytes);
    const [page] = await pdfDoc.copyPages(templateDoc, [0]);
    pdfDoc.addPage(page);
    const { width, height } = page.getSize();
    const overlayDataUrl = await buildTicketOverlayDataUrl(ticket, { width: width * 2, height: height * 2 });
    const overlayBytes = await fetch(overlayDataUrl).then((response) => response.arrayBuffer());
    const overlayImage = await pdfDoc.embedPng(overlayBytes);
    page.drawImage(overlayImage, { x: 0, y: 0, width, height });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
