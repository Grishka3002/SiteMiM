import { findTicketByCode, getState, normalizeTicketDisplay, saveState, updateTicketStatus } from "./data.js";

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
let pendingTicketCode = "";
let lastProcessedCode = "";
let lastProcessedAt = 0;

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

async function fetchRemoteState() {
  const response = await fetch("/api/state", { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return null;
  return response.json().catch(() => null);
}

async function saveRemoteState(nextState) {
  const response = await fetch("/api/state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(nextState)
  });

  if (!response.ok) {
    throw new Error("Failed to save shared state");
  }
}

async function syncStateFromServer() {
  const remoteState = await fetchRemoteState();
  state = remoteState && typeof remoteState === "object" ? saveState(remoteState) : getState();
  return state;
}

function normalizeTicketCode(rawCode) {
  const value = String(rawCode || "").trim();
  if (!value) return "";

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed.ticketCode === "string") {
      return parsed.ticketCode.trim();
    }
  } catch {
    return value;
  }

  return value;
}

function renderTicketDetails(booking, ticket) {
  const displayTicket = normalizeTicketDisplay(state, ticket);
  return `
    <p><strong>${displayTicket.fullName}</strong></p>
    <p>Место: ${displayTicket.seatDisplayLabel || displayTicket.seatLabel}</p>
    ${displayTicket.group ? `<p>Группа: ${displayTicket.group}</p>` : ""}
    <p>Код билета: <code>${displayTicket.code}</code></p>
    <p>Контакт: ${booking.contactPhone} / ${booking.contactNote}</p>
  `;
}

async function processCode(rawCode) {
  const code = normalizeTicketCode(rawCode);
  if (!code) return;

  const now = Date.now();
  if (code === lastProcessedCode && now - lastProcessedAt < 2500) {
    return;
  }
  lastProcessedCode = code;
  lastProcessedAt = now;

  await syncStateFromServer();
  const match = findTicketByCode(state, code);

  if (!match) {
    pendingTicketCode = "";
    renderResult("danger", `<h3>Билет не найден</h3><p>Код <code>${code}</code> отсутствует в базе.</p>`);
    return;
  }

  const { booking, ticket } = match;

  if (ticket.status === "checked") {
    pendingTicketCode = "";
    renderResult(
      "warning",
      `<h3>Повторный проход</h3>
       ${renderTicketDetails(booking, ticket)}
       <p>Этот билет уже был отмечен ${ticket.checkedInAt ? formatDate(ticket.checkedInAt) : "ранее"}.</p>`
    );
    return;
  }

  pendingTicketCode = code;
  renderResult(
    "success",
    `<h3>Билет найден</h3>
     ${renderTicketDetails(booking, ticket)}
     <button class="button button--primary button--full" type="button" data-confirm-entry="${ticket.code}">Отметить вход</button>`
  );
}

async function confirmEntry(ticketCode) {
  await syncStateFromServer();
  const match = findTicketByCode(state, ticketCode);

  if (!match) {
    pendingTicketCode = "";
    renderResult("danger", `<h3>Билет не найден</h3><p>Код <code>${ticketCode}</code> отсутствует в базе.</p>`);
    return;
  }

  const { booking, ticket } = match;

  if (ticket.status === "checked") {
    pendingTicketCode = "";
    renderResult(
      "warning",
      `<h3>Повторный проход</h3>
       ${renderTicketDetails(booking, ticket)}
       <p>Этот билет уже был отмечен ${ticket.checkedInAt ? formatDate(ticket.checkedInAt) : "ранее"}.</p>`
    );
    return;
  }

  const result = updateTicketStatus(state, ticketCode, "checked");
  state = result.state;
  await saveRemoteState(state);
  await syncStateFromServer();

  const updated = findTicketByCode(state, ticketCode);
  pendingTicketCode = "";

  renderResult(
    "success",
    `<h3>Вход отмечен</h3>
     ${renderTicketDetails(updated?.booking || booking, updated?.ticket || result.ticket)}
     <p>Статус сохранён в общей базе и будет виден в админке.</p>`
  );
}

scanForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await processCode(ticketCodeInput.value);
  scanForm.reset();
});

resultNode.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-confirm-entry]");
  if (!button) return;

  button.disabled = true;
  button.textContent = "Сохраняем вход...";

  try {
    await confirmEntry(button.dataset.confirmEntry || pendingTicketCode);
  } catch (error) {
    console.error(error);
    renderResult("danger", "<h3>Не удалось отметить вход</h3><p>Проверьте интернет и попробуйте ещё раз.</p>");
  }
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
        await processCode(barcode.rawValue);
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
        await processCode(result.data);
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
      ? "Наведите камеру на QR-код. После распознавания подтвердите вход кнопкой."
      : "Камера включена. После распознавания QR подтвердите вход кнопкой.";

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
