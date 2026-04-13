import { findTicketByCode, getState, updateTicketStatus } from "./data.js";

const startScanButton = document.getElementById("start-scan");
const video = document.getElementById("scanner-video");
const scannerHint = document.getElementById("scanner-hint");
const scanForm = document.getElementById("scan-form");
const ticketCodeInput = document.getElementById("ticket-code-input");
const resultNode = document.getElementById("scan-result");

let state = getState();
let stream = null;
let detector = null;
let scanTimer = null;
let fallbackCanvas = null;
let fallbackContext = null;

function formatDate(dateIso) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateIso));
}

function renderResult(type, html) {
  resultNode.className = `scan-result scan-result--${type}`;
  resultNode.innerHTML = html;
}

function normalizeTicketCode(rawCode) {
  const value = rawCode.trim();
  if (!value) {
    return "";
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed.ticketCode === "string") {
      return parsed.ticketCode.trim();
    }
  } catch (error) {
    return value;
  }

  return value;
}

function processCode(rawCode) {
  const code = normalizeTicketCode(rawCode);
  if (!code) return;

  state = getState();
  const match = findTicketByCode(state, code);

  if (!match) {
    renderResult("danger", `<h3>Билет не найден</h3><p>Код <code>${code}</code> отсутствует в базе.</p>`);
    return;
  }

  const { booking, ticket } = match;

  if (ticket.status === "checked") {
    renderResult(
      "warning",
      `<h3>Повторный проход</h3>
       <p><strong>${ticket.fullName}</strong>, место ${ticket.seatLabel}, группа ${ticket.group}</p>
       <p>Этот билет уже был отмечен ${ticket.checkedInAt ? formatDate(ticket.checkedInAt) : "ранее"}.</p>
       <p>Контакт: ${booking.contactPhone} / ${booking.contactNote}</p>`
    );
    return;
  }

  updateTicketStatus(state, code, "checked");
  state = getState();

  renderResult(
    "success",
    `<h3>Проход разрешён</h3>
     <p><strong>${ticket.fullName}</strong>, место ${ticket.seatLabel}, группа ${ticket.group}</p>
     <p>Билет ${ticket.code} отмечен на входе.</p>
     <p>Контакт: ${booking.contactPhone} / ${booking.contactNote}</p>`
  );
}

scanForm.addEventListener("submit", (event) => {
  event.preventDefault();
  processCode(ticketCodeInput.value);
  scanForm.reset();
});

async function scanFrame() {
  if (video.readyState < 2) {
    return;
  }

  try {
    if (detector) {
      const barcodes = await detector.detect(video);
      if (barcodes.length) {
        const [barcode] = barcodes;
        processCode(barcode.rawValue);
        ticketCodeInput.value = barcode.rawValue;
        return;
      }
    }

    if (window.jsQR) {
      fallbackCanvas ??= document.createElement("canvas");
      fallbackContext ??= fallbackCanvas.getContext("2d", { willReadFrequently: true });

      fallbackCanvas.width = video.videoWidth;
      fallbackCanvas.height = video.videoHeight;

      if (!fallbackCanvas.width || !fallbackCanvas.height || !fallbackContext) {
        return;
      }

      fallbackContext.drawImage(video, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
      const imageData = fallbackContext.getImageData(0, 0, fallbackCanvas.width, fallbackCanvas.height);
      const result = window.jsQR(imageData.data, imageData.width, imageData.height);

      if (result?.data) {
        processCode(result.data);
        ticketCodeInput.value = result.data;
      }
    }
  } catch (error) {
    console.warn("Ошибка сканирования", error);
  }
}

async function startScanner() {
  try {
    detector = "BarcodeDetector" in window ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    video.srcObject = stream;
    await video.play();
    video.classList.remove("hidden");

    scannerHint.textContent = detector
      ? "Наведите камеру на QR-код. После распознавания билет отметится автоматически."
      : "Камера включена. В этом браузере используется fallback-сканирование QR через видео.";

    window.clearInterval(scanTimer);
    scanTimer = window.setInterval(scanFrame, 700);
  } catch (error) {
    scannerHint.textContent = "Не удалось получить доступ к камере. Проверьте разрешения браузера или используйте ручной ввод.";
    console.warn(error);
  }
}

startScanButton.addEventListener("click", startScanner);

window.addEventListener("beforeunload", () => {
  if (scanTimer) {
    window.clearInterval(scanTimer);
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
});

window.addEventListener("storage", () => {
  state = getState();
});
