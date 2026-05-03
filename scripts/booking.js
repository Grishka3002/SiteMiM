import {
  createBooking,
  EMBEDDED_CUSTOM_LAYOUT,
  getDeviceId,
  getSeatStatusMap,
  getSessionId,
  getState,
  getTicketsByDevice,
  hallSections,
  hydrateCustomLayout,
  holdSeat,
  isSeatAvailable,
  refreshSeatHolds,
  releaseSeatHold,
  saveState
} from "./data.js";

const hallMap = document.getElementById("hall-map");
const selectionSummary = document.getElementById("selection-summary");
const selectionCount = document.getElementById("selection-count");
const attendeesFields = document.getElementById("attendees-fields");
const bookingForm = document.getElementById("booking-form");
const ticketsPanel = document.getElementById("tickets-panel");
const ticketsOutput = document.getElementById("tickets-output");
const ticketsBookingMeta = document.getElementById("tickets-booking-meta");
const downloadAllTicketsButton = document.getElementById("download-all-tickets");

let state = getState();
let selectedSeatIds = [];
const sessionId = getSessionId();
const deviceId = getDeviceId();
let holdRefreshTimer = null;
let remoteSyncTimer = null;
let lastRemoteSyncAt = 0;
let didAutoCenterHallOnMobile = false;
let renderedAttendeeFieldsKey = "";
const ALL_TICKETS_DOWNLOAD_KEY = "__all_tickets__";
const ticketDownloadStates = new Map();

async function fetchRemoteLayout() {
  const fileResponse = await fetch("./data/layout.json", { cache: "no-store" }).catch(() => null);
  if (fileResponse?.ok) {
    return fileResponse.json();
  }

  const apiResponse = await fetch("/api/layout", { cache: "no-store" });
  if (!apiResponse.ok) {
    throw new Error("Failed to load remote layout");
  }

  return apiResponse.json();
}

async function syncLayoutFromServer() {
  try {
    const remoteLayout = await fetchRemoteLayout();
    if (!remoteLayout?.cells?.length) {
      return;
    }

    state = hydrateCustomLayout(state, remoteLayout);
  } catch (error) {
    console.warn("Не удалось загрузить схему зала.", error);
  }
}

async function fetchRemoteState() {
  const response = await fetch("/api/state", { cache: "no-store" }).catch(() => null);
  if (!response?.ok) {
    return null;
  }

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

async function syncStateFromServer(options = {}) {
  const { forceRender = false } = options;
  const remoteState = await fetchRemoteState();
  if (!remoteState || typeof remoteState !== "object") {
    return false;
  }

  const previousStamp = state?.lastUpdatedAt || "";
  state = saveState(remoteState);
  lastRemoteSyncAt = Date.now();
  const nextStamp = state?.lastUpdatedAt || "";
  const changed = previousStamp !== nextStamp;

  if (changed || forceRender) {
    syncSelection();
    renderDeviceTickets();
  }

  return changed;
}

async function persistSharedState(nextState) {
  state = saveState(nextState);

  try {
    await saveRemoteState(state);
    lastRemoteSyncAt = Date.now();
  } catch (error) {
    console.warn("Не удалось синхронизировать общее состояние зала.", error);
  }

  return state;
}

function shouldSyncBeforeAction(maxAgeMs = 2500) {
  return !lastRemoteSyncAt || Date.now() - lastRemoteSyncAt > maxAgeMs;
}

function buildCustomSeatsFallback() {
  const cells = (state.customLayout?.cells?.length ? state.customLayout.cells : EMBEDDED_CUSTOM_LAYOUT?.cells) || [];
  const rowValues = [...new Set(cells.map((cell) => cell.y))].sort((a, b) => b - a);
  const rowNumberByY = new Map(rowValues.map((y, index) => [y, String(index + 1)]));

  return rowValues.flatMap((y) => {
    const cellsInRow = cells
      .filter((cell) => cell.y === y)
      .sort((a, b) => a.x - b.x);

    const rowLabel = rowNumberByY.get(y);
    return cellsInRow.map((cell, index) => ({
      id: `custom-${y}-${cell.x}`,
      row: rowLabel,
      number: index + 1,
      sectionId: "custom",
      sectionTitle: " ",
      block: 1,
      gridX: cell.x,
      gridY: cell.y,
      ticketLabel: `${rowLabel}-${index + 1}`,
      label: ` ${rowLabel},  ${index + 1}`
    }));
  });
}

function getCustomSectionMeta(cell) {
  if (cell.y <= 32) {
    return { id: "balcony", title: "", code: "B" };
  }

  if (cell.y <= 43 && cell.x <= 23) {
    return { id: "lodge-left", title: " 1", code: "L1" };
  }

  if (cell.y <= 43 && cell.x >= 47) {
    return { id: "lodge-right", title: " 2", code: "L2" };
  }

  return { id: "parter", title: "", code: "P" };
}

function buildSectionedCustomSeatsFallback() {
  const cells = (state.customLayout?.cells?.length ? state.customLayout.cells : EMBEDDED_CUSTOM_LAYOUT?.cells) || [];
  const cellsBySection = new Map();

  cells.forEach((cell) => {
    const section = getCustomSectionMeta(cell);
    if (!cellsBySection.has(section.id)) {
      cellsBySection.set(section.id, { section, cells: [] });
    }
    cellsBySection.get(section.id).cells.push(cell);
  });

  return [...cellsBySection.values()].flatMap(({ section, cells: sectionCells }) => {
    const rowValues = [...new Set(sectionCells.map((cell) => cell.y))].sort((a, b) => b - a);
    const rowNumberByY = new Map(rowValues.map((y, index) => [y, String(index + 1)]));

    return rowValues.flatMap((y) => {
      const cellsInRow = sectionCells
        .filter((cell) => cell.y === y)
        .sort((a, b) => a.x - b.x);

      const rowLabel = rowNumberByY.get(y);
      return cellsInRow.map((cell, index) => ({
        id: `custom-${y}-${cell.x}`,
        row: rowLabel,
        number: index + 1,
        sectionId: section.id,
        sectionTitle: section.title,
        block: 1,
        gridX: cell.x,
        gridY: cell.y,
        ticketLabel: `${section.code}${rowLabel}-${index + 1}`,
        label: `${section.title},  ${rowLabel},  ${index + 1}`
      }));
    });
  });
}

function mapCustomAbsoluteSeat(absoluteRow, absoluteSeatNumber) {
  if (absoluteRow >= 1 && absoluteRow <= 21) {
    return {
      sectionId: "parter",
      sectionTitle: "",
      sectionCode: "P",
      row: String(absoluteRow),
      number: absoluteSeatNumber
    };
  }

  const balconyRanges = {
    24: [9, 35],
    25: [7, 35],
    26: [5, 35],
    27: [1, 30],
    28: [1, 30],
    29: [1, 30],
    30: [1, 30],
    31: [1, 38],
    32: [1, 38],
    33: [1, 39]
  };

  const lodgeLeftRanges = {
    22: [1, 9],
    23: [1, 9],
    24: [1, 8],
    25: [1, 6],
    26: [1, 4]
  };

  const lodgeRightRanges = {
    22: [10, 18],
    23: [10, 18],
    24: [36, 43],
    25: [36, 41],
    26: [36, 39]
  };

  if (lodgeLeftRanges[absoluteRow]) {
    const [start, end] = lodgeLeftRanges[absoluteRow];
    if (absoluteSeatNumber >= start && absoluteSeatNumber <= end) {
      return {
        sectionId: "lodge-left",
        sectionTitle: " 1",
        sectionCode: "L1",
        row: String(absoluteRow - 21),
        number: absoluteSeatNumber - start + 1
      };
    }
  }

  if (lodgeRightRanges[absoluteRow]) {
    const [start, end] = lodgeRightRanges[absoluteRow];
    if (absoluteSeatNumber >= start && absoluteSeatNumber <= end) {
      return {
        sectionId: "lodge-right",
        sectionTitle: " 2",
        sectionCode: "L2",
        row: String(absoluteRow - 21),
        number: absoluteSeatNumber - start + 1
      };
    }
  }

  if (balconyRanges[absoluteRow]) {
    const [start, end] = balconyRanges[absoluteRow];
    if (absoluteSeatNumber >= start && absoluteSeatNumber <= end) {
      return {
        sectionId: "balcony",
        sectionTitle: "",
        sectionCode: "B",
        row: String(absoluteRow - 23),
        number: absoluteSeatNumber - start + 1
      };
    }
  }

  return {
    sectionId: "custom",
    sectionTitle: " ",
    sectionCode: "C",
    row: String(absoluteRow),
    number: absoluteSeatNumber
  };
}

function buildMappedCustomSeatsFallback() {
  const cells = (state.customLayout?.cells?.length ? state.customLayout.cells : EMBEDDED_CUSTOM_LAYOUT?.cells) || [];
  const rowValues = [...new Set(cells.map((cell) => cell.y))].sort((a, b) => b - a);
  const absoluteRowByY = new Map(rowValues.map((y, index) => [y, index + 1]));

  return rowValues.flatMap((y) => {
    const cellsInRow = cells
      .filter((cell) => cell.y === y)
      .sort((a, b) => a.x - b.x);

    const absoluteRow = absoluteRowByY.get(y);
    return cellsInRow.map((cell, index) => {
      const absoluteSeatNumber = index + 1;
      const mapped = mapCustomAbsoluteSeat(absoluteRow, absoluteSeatNumber);

      return {
        id: `custom-${y}-${cell.x}`,
        row: mapped.row,
        number: mapped.number,
        sectionId: mapped.sectionId,
        sectionTitle: mapped.sectionTitle,
        block: 1,
        gridX: cell.x,
        gridY: cell.y,
        ticketLabel: `${mapped.sectionCode}${mapped.row}-${mapped.number}`,
        label: `${mapped.sectionTitle},  ${mapped.row},  ${mapped.number}`
      };
    });
  });
}

function getNormalizedCustomLayout() {
  const layoutSource =
    (state.customLayout?.cells?.length || state.customLayout?.labels?.length
      ? state.customLayout
      : EMBEDDED_CUSTOM_LAYOUT) || { cells: [], labels: [] };
  const cells = Array.isArray(layoutSource.cells) ? layoutSource.cells : [];
  const labels = Array.isArray(layoutSource.labels) ? layoutSource.labels : [];
  const points = [
    ...cells.map((cell) => ({ x: cell.x, y: cell.y })),
    ...labels.map((label) => ({ x: label.x, y: label.y }))
  ];

  if (!points.length) {
    return {
      cells,
      labels,
      cols: 0,
      rows: 0,
      minX: 0,
      minY: 0
    };
  }

  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    cells,
    labels,
    cols: maxX - minX + 1,
    rows: maxY - minY + 1,
    minX,
    minY
  };
}

function getDisplayLabelText(label, absoluteRow) {
  if (label.kind !== "row") {
    return label.text;
  }

  if (absoluteRow >= 1 && absoluteRow <= 21) {
    return `ряд ${absoluteRow}`;
  }

  if (label.x <= 5 && absoluteRow >= 22 && absoluteRow <= 26) {
    return `ряд ${absoluteRow - 21}`;
  }

  if (label.x >= 50 && absoluteRow >= 22 && absoluteRow <= 26) {
    return `ряд ${absoluteRow - 21}`;
  }

  if (label.x >= 10 && label.x <= 20 && absoluteRow >= 24 && absoluteRow <= 33) {
    return `ряд ${absoluteRow - 23}`;
  }

  return label.text;
}

function getRenderableSeats() {
  if (state.customLayout?.cells?.length || EMBEDDED_CUSTOM_LAYOUT?.cells?.length) {
    const customSeats = state.seats?.length ? state.seats : buildMappedCustomSeatsFallback();
    return customSeats.length ? customSeats : (state.seats || []);
  }

  return state.seats || [];
}

function pluralizeSeats(count) {
  if (count % 10 === 1 && count % 100 !== 11) return "место";
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return "места";
  return "мест";
}

function getSeatById(seatId) {
  return getRenderableSeats().find((seat) => seat.id === seatId);
}

function getSeatSectionName(seat) {
  if (!seat) return "";

  const sectionNames = {
    "lodge-left": "Ложа 1",
    "lodge-right": "Ложа 2",
    balcony: "Балкон",
    parter: "Партер",
    custom: "Место"
  };

  return sectionNames[seat.sectionId] || String(seat.sectionTitle || "").trim() || "Место";
}

function formatSeatDisplay(seat) {
  if (!seat) return "";

  const sectionName = getSeatSectionName(seat);
  if (sectionName === "Место") {
    return `Ряд ${seat.row}, место ${seat.number}`;
  }

  return `${sectionName}, ряд ${seat.row}, место ${seat.number}`;
}

function buildTicketQrValue(ticket) {
  return JSON.stringify({
    ticketCode: ticket.code,
    seatLabel: ticket.seatLabel,
    deviceId: ticket.issuedDeviceId
  });
}

function splitSeatLabel(seatLabel) {
  const match = String(seatLabel).trim().match(/^([\p{L}0-9]+)\s*-?\s*(\d+)$/u);
  if (!match) {
    return {
      rowLabel: String(seatLabel).trim(),
      seatNumber: ""
    };
  }

  return {
    rowLabel: match[1].toUpperCase(),
    seatNumber: match[2]
  };
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

  if (line) {
    lines.push(line);
  }

  return lines;
}

async function fetchBytes(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.arrayBuffer();
}

async function tryFetchBytes(url) {
  try {
    return await fetchBytes(url);
  } catch (error) {
    return null;
  }
}

async function loadTemplatePdfBytes() {
  return tryFetchBytes("./images/ticket.pdf");
}

function triggerFileDownload(blob, filename, targetWindow = null) {
  const url = URL.createObjectURL(blob);

  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = url;
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

function getPdfDownloadMarkup(downloadState) {
  if (!downloadState) {
    return "";
  }

  if (downloadState.status === "preparing") {
    return '<p class="ticket-download-status">Готовим PDF...</p>';
  }

  if (downloadState.status === "error") {
    return '<p class="ticket-download-status ticket-download-status--error">Не удалось подготовить PDF. Нажмите скачать ещё раз.</p>';
  }

  if (downloadState.status === "ready") {
    return `
    <a class="button button--primary button--full" href="${downloadState.url}" download="${downloadState.filename}" target="_blank" rel="noopener">Открыть / скачать PDF</a>
    <p class="muted">Если файл не скачался автоматически, нажмите эту кнопку. На iPhone PDF обычно откроется в новой вкладке, откуда его можно сохранить или отправить.</p>
  `;
  }

  return "";
}

function renderDownloadState(key) {
  const selector =
    key === ALL_TICKETS_DOWNLOAD_KEY
      ? "#all-tickets-download-result"
      : `[data-ticket-download-result="${key}"]`;
  const container = document.querySelector(selector);
  if (container) {
    container.innerHTML = getPdfDownloadMarkup(ticketDownloadStates.get(key));
  }
}

function setDownloadState(key, nextState) {
  const previousState = ticketDownloadStates.get(key);
  if (previousState?.url && previousState.url !== nextState?.url) {
    URL.revokeObjectURL(previousState.url);
  }

  if (nextState) {
    ticketDownloadStates.set(key, nextState);
  } else {
    ticketDownloadStates.delete(key);
  }

  renderDownloadState(key);
}

function showPdfDownloadLink(key, blob, filename) {
  const url = URL.createObjectURL(blob);
  setDownloadState(key, {
    status: "ready",
    url,
    filename
  });
}

function buildQrImageUrls(value, options = {}) {
  const { size = 500, dark = "000000", light = "00000000" } = options;
  const encodedValue = encodeURIComponent(value);
  return [
    `https://quickchart.io/qr?size=${size}&margin=0&dark=${dark}&light=${light}&text=${encodedValue}`,
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&color=${dark}&bgcolor=${light}&data=${encodedValue}`
  ];
}

function getAllTicketsDownloadResult() {
  let container = document.getElementById("all-tickets-download-result");
  if (!container) {
    container = document.createElement("div");
    container.id = "all-tickets-download-result";
    container.className = "ticket-download-result";
    ticketsBookingMeta.insertAdjacentElement("afterend", container);
  }
  return container;
}

async function runTicketDownload(key, button, task) {
  const originalText = button?.textContent || "";
  setDownloadState(key, { status: "preparing" });

  if (button) {
    button.disabled = true;
    button.textContent = "Готовим PDF...";
  }

  try {
    const { blob, filename } = await task();
    showPdfDownloadLink(key, blob, filename);
  } catch (error) {
    console.error(error);
    setDownloadState(key, { status: "error" });
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function drawFallbackCanvasBackground(context, width, height) {
  context.fillStyle = "#101119";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#f4f0e8";
  context.fillRect(54, 54, width - 108, height - 108);

  context.fillStyle = "#121420";
  context.fillRect(54, 54, width - 108, 280);

  context.fillStyle = "#ffffff";
  context.font = "700 44px Manrope, Arial, sans-serif";
  context.fillText("МИСС И МИСТЕР ВВГУ 2026", 92, 146);
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
  const nameLines = wrapLinesForCanvas(context, ticket.fullName, contentWidth - 40 * scaleX);
  nameLines.slice(0, 2).forEach((line, index) => {
    context.fillText(line, contentCenter, (332 + index * 70) * scaleY);
  });

  context.font = `700 ${28 * scaleY}px Manrope, Arial, sans-serif`;
  if (ticket.group) {
    context.fillText(`Группа: ${ticket.group}`, contentCenter, 446 * scaleY);
  }

  context.font = `600 ${22 * scaleY}px Manrope, Arial, sans-serif`;
  context.fillStyle = "#3d3f49";
  context.fillText(`Билет № ${ticket.code}`, contentCenter, 487 * scaleY);

  context.fillStyle = "#222222";
  context.font = `800 ${34 * scaleY}px Manrope, Arial, sans-serif`;
  context.fillText(rowLabel || "-", rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height * 0.68);
  context.fillText(seatNumber || ticket.seatLabel, seatBox.x + seatBox.width / 2, seatBox.y + seatBox.height * 0.68);

  const qrBoxX = 2068 * scaleX;
  const qrBoxY = 248 * scaleY;
  const qrBoxSize = 302 * scaleX;
  const qrPad = 16 * scaleX;

  if (qrImage) {
    context.drawImage(qrImage, qrBoxX + qrPad, qrBoxY + qrPad, qrBoxSize - qrPad * 2, qrBoxSize - qrPad * 2);
  } else {
    context.fillStyle = "#111111";
    context.font = `700 ${30 * scaleY}px Manrope, Arial, sans-serif`;
    context.fillText("QR", qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize / 2);
  }
}

function drawFallbackTicket(context, ticket, qrImage, width, height) {
  drawFallbackCanvasBackground(context, width, height);

  const textColor = "#111111";
  const secondaryColor = "#4c505c";
  const contentLeft = 94;
  const titleY = 430;
  const nameY = 540;
  const detailY = 700;
  const qrX = width - 380;
  const qrY = 420;

  context.fillStyle = textColor;
  context.font = "800 58px Oswald, Arial, sans-serif";
  context.fillText(`БИЛЕТ ${ticket.seatLabel}`, contentLeft, titleY);

  context.font = "700 36px Manrope, Arial, sans-serif";
  const lines = wrapLinesForCanvas(context, ticket.fullName, width - 520);
  lines.forEach((line, index) => {
    context.fillText(line, contentLeft, nameY + index * 46);
  });

  context.fillStyle = secondaryColor;
  context.font = "600 28px Manrope, Arial, sans-serif";
  const details = [
    `ФИО: ${ticket.fullName}`,
    `Место: ${ticket.seatDisplayLabel || ticket.seatLabel}`,
    `Номер билета: ${ticket.code}`
  ];

  if (ticket.group) {
    details.splice(1, 0, `Группа: ${ticket.group}`);
  }

  details.forEach((line, index) => {
    context.fillText(line, contentLeft, detailY + index * 42);
  });

  if (qrImage) {
    context.drawImage(qrImage, qrX + 15, qrY + 15, 220, 220);
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
    if (image) {
      return image;
    }
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
  if (!context) {
    return image;
  }

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

async function buildTicketOverlayDataUrl(ticket, options = {}) {
  const { width = 1240, height = 1754, hasTemplate = false } = options;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is unavailable");
  }

  const qrImage = await loadFirstAvailableImage(
    buildQrImageUrls(buildTicketQrValue(ticket), { size: 500, dark: "000000", light: "00000000" })
  )
    .then((image) => (image ? makeWhitePixelsTransparent(image) : null))
    .catch(() => null);

  if (hasTemplate) {
    drawTemplateOverlay(context, ticket, qrImage, canvas.width, canvas.height);
  } else {
    drawFallbackTicket(context, ticket, qrImage, canvas.width, canvas.height);
  }

  return canvas.toDataURL("image/png");
}

async function addTicketPageToPdf(pdfDoc, ticket, templateBytes = null) {
  if (templateBytes) {
    const templateDoc = await PDFLib.PDFDocument.load(templateBytes);
    const [page] = await pdfDoc.copyPages(templateDoc, [0]);
    pdfDoc.addPage(page);

    const { width, height } = page.getSize();
    const overlayDataUrl = await buildTicketOverlayDataUrl(ticket, {
      width: width * 2,
      height: height * 2,
      hasTemplate: true
    });
    const overlayBytes = await fetch(overlayDataUrl).then((response) => response.arrayBuffer());
    const overlayImage = await pdfDoc.embedPng(overlayBytes);

    page.drawImage(overlayImage, {
      x: 0,
      y: 0,
      width,
      height
    });
    return;
  }

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const overlayDataUrl = await buildTicketOverlayDataUrl(ticket, {
    width: 1240,
    height: 1754,
    hasTemplate: false
  });
  const overlayBytes = await fetch(overlayDataUrl).then((response) => response.arrayBuffer());
  const overlayImage = await pdfDoc.embedPng(overlayBytes);

  page.drawImage(overlayImage, {
    x: 0,
    y: 0,
    width,
    height
  });
}

async function buildTicketsPdfBlob(tickets) {
  const PDFLib = window.PDFLib;
  if (!PDFLib) {
    throw new Error("PDF library is unavailable");
  }

  const { PDFDocument } = PDFLib;
  const templateBytes = await loadTemplatePdfBytes();
  const pdfDoc = await PDFDocument.create();

  for (const ticket of tickets) {
    await addTicketPageToPdf(pdfDoc, ticket, templateBytes);
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

async function prepareTicketsDownload(tickets, filename) {
  const PDFLib = window.PDFLib;
  if (!PDFLib) {
    alert("PDF-библиотека ещё не загрузилась. Обновите страницу и попробуйте снова.");
    throw new Error("PDF library is unavailable");
  }

  try {
    const blob = await buildTicketsPdfBlob(tickets);
    return { blob, filename };
  } catch (error) {
    console.error(error);
    alert("Не удалось скачать PDF-билет. Попробуйте ещё раз.");
    throw error;
  }
}

async function prepareTicketDownload(ticket) {
  return prepareTicketsDownload([ticket], `${ticket.code}.pdf`);
}

function renderSeatButton(seat, seatStatusMap) {
  const status = seatStatusMap[seat.id];
  const isSelected = selectedSeatIds.includes(seat.id);
  const classNames = ["seat", "seat--plan"];
  if (status === "booked") classNames.push("seat--booked");
  if (status === "checked") classNames.push("seat--checked");
  if (status === "held") classNames.push("seat--held");
  if (isSelected) classNames.push("seat--selected");

  return `<button type="button" class="${classNames.join(" ")}" data-seat-id="${seat.id}" data-seat-status="${status || "free"}" aria-disabled="${status && status !== "selected" ? "true" : "false"}" title="${formatSeatDisplay(seat)}">${seat.number}</button>`;
}

function renderPresetSection(section, seatIndex, seatStatusMap) {
  return `
    <section class="hall-section hall-section--${section.id}">
      <h3 class="hall-section__title hall-section__title--${section.titleAlign}">${section.title}</h3>
      <div class="hall-section__rows">
        ${section.rows
          .map((rowConfig) => {
            const rowBlockSeatIds = rowConfig.blocks.map((seatCount, blockIndex) =>
              Array.from({ length: seatCount }, (_, seatNumberIndex) => {
                const key = `${section.id}-${rowConfig.rowLabel}-${blockIndex + 1}-${seatNumberIndex + 1}`;
                return seatIndex.get(key);
              }).filter(Boolean)
            );

            const labelLeft =
              section.labelMode === "left" || section.labelMode === "both"
                ? `<span class="hall-layout-row__label hall-layout-row__label--left">Ряд ${rowConfig.rowLabel}</span>`
                : `<span class="hall-layout-row__label hall-layout-row__label--empty"></span>`;

            const labelRight =
              section.labelMode === "right" || section.labelMode === "both"
                ? `<span class="hall-layout-row__label hall-layout-row__label--right">Ряд ${rowConfig.rowLabel}</span>`
                : `<span class="hall-layout-row__label hall-layout-row__label--empty"></span>`;

            return `
              <div class="hall-layout-row hall-layout-row--labels-${section.labelMode} ${rowConfig.spacerBefore ? "hall-layout-row--spacer" : ""}" style="--row-offset:${rowConfig.offset || 0};">
                ${labelLeft}
                <div class="hall-layout-row__blocks hall-layout-row__blocks--${section.align}">
                  ${rowBlockSeatIds
                    .map(
                      (seatIds) => `
                        <div class="hall-layout-block">
                          ${seatIds.map((seatId) => renderSeatButton(getSeatById(seatId), seatStatusMap)).join("")}
                        </div>
                      `
                    )
                    .join("")}
                </div>
                ${labelRight}
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderCustomHall(seatStatusMap) {
  const { labels, cols, rows, minX, minY } = getNormalizedCustomLayout();
  const seatsMarkup = getRenderableSeats()
      .map(
        (seat) => `
          <div class="custom-hall__slot" style="grid-column:${seat.gridX - minX + 1}; grid-row:${seat.gridY - minY + 1};">
            ${renderSeatButton(seat, seatStatusMap)}
          </div>
        `
    )
    .join("");

  const labelsMarkup = labels
    .map(
        (label) => `
            <div
              class="custom-hall-label custom-hall-label--${label.kind || "custom"}"
              style="--x:${label.x - minX}; --y:${label.y - minY};"
            >
              ${label.text}
            </div>
        `
      )
    .join("");

  return `
    <div class="hall-plan hall-plan--custom">
      <section class="hall-section hall-section--custom">
        <h3 class="hall-section__title hall-section__title--center">Схема зала</h3>
          <div class="custom-hall custom-hall--freeform">
            <div class="custom-hall__canvas" style="--cols:${cols}; --rows:${rows};">
            ${seatsMarkup}
            ${labelsMarkup}
          </div>
        </div>
      </section>
      <div class="stage">Сцена</div>
    </div>
  `;
}

function renderPresetHall(seatStatusMap) {
  const seatIndex = new Map(getRenderableSeats().map((seat) => [seat.id, seat.id]));
  const lodgeLeft = hallSections.find((section) => section.id === "lodge-left");
  const balcony = hallSections.find((section) => section.id === "balcony");
  const lodgeRight = hallSections.find((section) => section.id === "lodge-right");
  const parter = hallSections.find((section) => section.id === "parter");

  return `
    <div class="hall-plan">
      <div class="hall-plan__top">
        ${lodgeLeft ? renderPresetSection(lodgeLeft, seatIndex, seatStatusMap) : ""}
        ${balcony ? renderPresetSection(balcony, seatIndex, seatStatusMap) : ""}
        ${lodgeRight ? renderPresetSection(lodgeRight, seatIndex, seatStatusMap) : ""}
      </div>
      ${parter ? renderPresetSection(parter, seatIndex, seatStatusMap) : ""}
      <div class="stage">Сцена</div>
    </div>
  `;
}

function isMobileViewport() {
  return window.matchMedia?.("(max-width: 720px)").matches;
}

function replayHallScrollHint() {
  if (!hallMap || !isMobileViewport()) {
    return;
  }

  hallMap.classList.remove("hall-map--hint-visible");
  // Force the CSS animation to restart when the user reaches the hall block again.
  void hallMap.offsetWidth;
  hallMap.classList.add("hall-map--hint-visible");
}

function centerHallMapOnMobile() {
  if (didAutoCenterHallOnMobile || !isMobileViewport()) {
    return;
  }

  window.requestAnimationFrame(() => {
    const horizontalOverflow = hallMap.scrollWidth - hallMap.clientWidth;
    if (horizontalOverflow > 0) {
      hallMap.scrollLeft = Math.round(horizontalOverflow / 2);
    }
    didAutoCenterHallOnMobile = true;
    replayHallScrollHint();
  });
}

function renderHall() {
  const seatStatusMap = getSeatStatusMap(state.bookings, state.holds, sessionId);
  const renderableSeats = getRenderableSeats();
  const hasCustomLayout = Boolean(state.customLayout?.cells?.length || EMBEDDED_CUSTOM_LAYOUT?.cells?.length);

  if (hasCustomLayout && renderableSeats.length) {
    hallMap.innerHTML = renderCustomHall(seatStatusMap);
  } else {
    hallMap.innerHTML = renderPresetHall(seatStatusMap);
  }

  if (!hallMap.querySelector("[data-seat-id]") && hasCustomLayout) {
    const rebuiltSeats = buildCustomSeatsFallback();
    if (rebuiltSeats.length) {
      state = {
        ...state,
        seats: rebuiltSeats
      };
      hallMap.innerHTML = renderCustomHall(seatStatusMap);
    }
  }

  centerHallMapOnMobile();
}

function getCurrentAttendeeValues() {
  const values = {};
  const formData = new FormData(bookingForm);

  selectedSeatIds.forEach((seatId) => {
    values[`fullName-${seatId}`] = String(formData.get(`fullName-${seatId}`) || "");
  });

  return values;
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderSelection() {
  const seats = selectedSeatIds.map(getSeatById).filter(Boolean);
  const selectionKey = seats.map((seat) => seat.id).join("|");
  const attendeeValues = getCurrentAttendeeValues();
  selectionCount.textContent = `${seats.length} ${pluralizeSeats(seats.length)}`;

  if (!seats.length) {
    selectionSummary.textContent = "Выберите хотя бы одно место на схеме зала.";
    attendeesFields.innerHTML = "";
    renderedAttendeeFieldsKey = "";
    return;
  }

  selectionSummary.innerHTML = `Вы выбрали: <strong>${seats.map((seat) => formatSeatDisplay(seat)).join("; ")}</strong>`;

  if (selectionKey === renderedAttendeeFieldsKey) {
    return;
  }

  renderedAttendeeFieldsKey = selectionKey;
  attendeesFields.innerHTML = seats
    .map(
      (seat, index) => `
        <section class="attendee-card">
          <div class="attendee-card__heading">
            <span>Билет ${index + 1}</span>
            <span>${formatSeatDisplay(seat)}</span>
          </div>
          <label class="field">
            <span>ФИО</span>
            <input type="text" name="fullName-${seat.id}" value="${escapeAttribute(attendeeValues[`fullName-${seat.id}`] || "")}" placeholder="Иванов Иван Иванович" required />
          </label>
        </section>
      `
    )
    .join("");
}

function syncSelection() {
  selectedSeatIds = selectedSeatIds.filter((seatId) => isSeatAvailable(state, seatId, sessionId));
  renderHall();
  renderSelection();
  syncHoldRefresh();
}

function syncHoldRefresh() {
  window.clearInterval(holdRefreshTimer);
  if (!selectedSeatIds.length) {
    return;
  }

  holdRefreshTimer = window.setInterval(async () => {
    await syncStateFromServer();
    const refreshedState = refreshSeatHolds(getState(), selectedSeatIds, sessionId);
    await persistSharedState(refreshedState);
    renderHall();
  }, 30000);
}

async function handleSeatInteraction(seatId) {
  if (!seatId) return;

  if (selectedSeatIds.includes(seatId)) {
    selectedSeatIds = selectedSeatIds.filter((id) => id !== seatId);
    renderHall();
    renderSelection();
    state = await persistSharedState(releaseSeatHold(getState(), seatId, sessionId));
    syncSelection();
    return;
  } else {
    if (!isSeatAvailable(state, seatId, sessionId)) {
      syncSelection();
      return;
    }

    selectedSeatIds.push(seatId);
    renderHall();
    renderSelection();

    if (shouldSyncBeforeAction()) {
      await syncStateFromServer();
      if (!isSeatAvailable(state, seatId, sessionId)) {
        selectedSeatIds = selectedSeatIds.filter((id) => id !== seatId);
        syncSelection();
        return;
      }
    }

    const holdResult = holdSeat(getState(), seatId, sessionId);
    if (!holdResult.success) {
      selectedSeatIds = selectedSeatIds.filter((id) => id !== seatId);
      syncSelection();
      return;
    }
    state = await persistSharedState(holdResult.state);
  }

  syncSelection();
}

window.__vvguSeatClick = handleSeatInteraction;

hallMap.addEventListener("click", (event) => {
  const target = event.target.closest("[data-seat-id]");
  if (!target) return;

  event.preventDefault();
  event.stopPropagation();
  handleSeatInteraction(target.dataset.seatId);
});

if ("IntersectionObserver" in window) {
  const hallHintObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          replayHallScrollHint();
        }
      });
    },
    { threshold: 0.35 }
  );
  hallHintObserver.observe(hallMap);
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedSeatIds.length) {
    alert("Сначала выберите места на схеме зала.");
    return;
  }

  const formData = new FormData(bookingForm);
  const attendees = selectedSeatIds.map((seatId) => {
    const seat = getSeatById(seatId);
    return {
      seatId,
      seatLabel: seat.ticketLabel,
      seatDisplayLabel: formatSeatDisplay(seat),
      fullName: String(formData.get(`fullName-${seatId}`) || ""),
      group: ""
    };
  });

  if (attendees.some((attendee) => !attendee.fullName.trim())) {
    alert("Заполните ФИО для каждого выбранного места.");
    return;
  }

  if (shouldSyncBeforeAction()) {
    await syncStateFromServer();
  }
  const conflict = attendees.some((attendee) => !isSeatAvailable(state, attendee.seatId, sessionId));
  if (conflict) {
    alert("Часть выбранных мест уже забронирована. Обновите выбор и попробуйте снова.");
    syncSelection();
    return;
  }

  const result = createBooking(state, {
    contactPhone: String(formData.get("contactPhone") || ""),
    contactNote: String(formData.get("contactNote") || ""),
    deviceId,
    ownerId: sessionId,
    attendees
  });

  state = await persistSharedState(result.state);
  selectedSeatIds = [];
  bookingForm.reset();
  syncSelection();
  renderDeviceTickets(true);
});

function renderDeviceTickets(focusLatest = false) {
  const tickets = getTicketsByDevice(state, deviceId);

  if (!tickets.length) {
    ticketsPanel.classList.add("hidden");
    ticketsBookingMeta.textContent = "";
    ticketsOutput.innerHTML = "";
    return;
  }

  ticketsPanel.classList.remove("hidden");
  ticketsBookingMeta.textContent = `На этом устройстве сохранено ${tickets.length} билетов. Они останутся доступны после перезагрузки страницы.`;
  ticketsOutput.innerHTML = tickets
    .map((ticket) => {
      const qrValue = buildTicketQrValue(ticket);
      const qrUrls = buildQrImageUrls(qrValue, { size: 220, dark: "ffffff", light: "00000000" });
      const seatText = ticket.seatDisplayLabel || ticket.seatLabel;
      const downloadState = ticketDownloadStates.get(ticket.code);
      const isPreparingPdf = downloadState?.status === "preparing";

      return `
        <article class="ticket-card">
          <p class="panel__kicker">${state.event.title}</p>
          <p class="ticket-card__seat">${seatText}</p>
          <p class="ticket-card__name">${ticket.fullName}</p>
          ${ticket.group ? `<p class="ticket-card__meta">Группа: ${ticket.group}</p>` : ""}
          <p class="ticket-card__meta">Статус: Забронирован</p>
          <img class="ticket-card__qr" src="${qrUrls[0]}" data-qr-fallback="${qrUrls[1]}" alt="QR код билета ${ticket.code}" />
          <p class="ticket-card__code">Код билета: ${ticket.code}</p>
          <button type="button" class="button button--ghost ticket-card__download" data-ticket-code="${ticket.code}" ${isPreparingPdf ? "disabled" : ""}>${isPreparingPdf ? "Готовим PDF..." : "Скачать билет"}</button>
          <div class="ticket-download-result" data-ticket-download-result="${ticket.code}">${getPdfDownloadMarkup(downloadState)}</div>
        </article>
      `;
    })
    .join("");

  if (focusLatest) {
    ticketsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  renderDownloadState(ALL_TICKETS_DOWNLOAD_KEY);
}

downloadAllTicketsButton?.addEventListener("click", async () => {
  const tickets = getTicketsByDevice(state, deviceId);
  if (!tickets.length) {
    return;
  }

  getAllTicketsDownloadResult();
  await runTicketDownload(ALL_TICKETS_DOWNLOAD_KEY, downloadAllTicketsButton, () =>
    prepareTicketsDownload(tickets, "tickets.pdf")
  );
});

ticketsOutput.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-ticket-code]");
  if (!button) return;

  const tickets = getTicketsByDevice(state, deviceId);
  const ticket = tickets.find((item) => item.code === button.dataset.ticketCode);
  if (ticket) {
    await runTicketDownload(ticket.code, button, () => prepareTicketDownload(ticket));
  }
});

ticketsOutput.addEventListener(
  "error",
  (event) => {
    const image = event.target.closest?.(".ticket-card__qr");
    if (!image?.dataset.qrFallback) return;

    image.src = image.dataset.qrFallback;
    delete image.dataset.qrFallback;
  },
  true
);

window.addEventListener("storage", () => {
  state = getState();
  syncSelection();
  renderDeviceTickets();
});

window.addEventListener("beforeunload", () => {
  window.clearInterval(holdRefreshTimer);
  let nextState = getState();
  selectedSeatIds.forEach((seatId) => {
    nextState = releaseSeatHold(nextState, seatId, sessionId);
  });
});

async function initializePage() {
  window.__vvguBookingInitialized = true;
  await syncLayoutFromServer();
  await syncStateFromServer({ forceRender: true });
  syncSelection();
  renderDeviceTickets();
  window.clearInterval(remoteSyncTimer);
  remoteSyncTimer = window.setInterval(() => {
    syncStateFromServer();
  }, 5000);
}

initializePage();
