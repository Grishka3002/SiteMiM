import {
  CUSTOM_LAYOUT_SIZE,
  applyCustomLayout,
  deleteBooking,
  flattenTickets,
  getState,
  getStats,
  hydrateCustomLayout,
  resetState,
  saveState,
  updateTicketFullName,
  updateTicketStatus
} from "./data.js";
import { buildTicketsPdfBlob } from "./ticket-pdf.js";

const statsGrid = document.getElementById("stats-grid");
const tableBody = document.getElementById("admin-table-body");
const searchInput = document.getElementById("admin-search");
const exportButton = document.getElementById("export-data");
const resetButton = document.getElementById("reset-demo");
const tabButtons = [...document.querySelectorAll("[data-admin-tab]")];
const tabPanels = [...document.querySelectorAll("[data-admin-panel]")];
const designerRoot = document.getElementById("seat-designer");
const designerSummary = document.getElementById("designer-summary");
const designerSaveButton = document.getElementById("designer-save");
const designerClearButton = document.getElementById("designer-clear");
const designerModeButtons = [...document.querySelectorAll("[data-designer-mode]")];
const designerLabelText = document.getElementById("designer-label-text");
const designerLabelKind = document.getElementById("designer-label-kind");
const designerLabelsList = document.getElementById("designer-labels");
const adminTicketGenerator = document.getElementById("admin-ticket-generator");
const adminTicketCode = document.getElementById("admin-ticket-code");
const adminTicketGeneratorStatus = document.getElementById("admin-ticket-generator-status");
const adminTicketDownloadResult = document.getElementById("admin-ticket-download-result");

let state = getState();
let selectedCells = new Set((state.customLayout?.cells || []).map((cell) => `${cell.x}:${cell.y}`));
let labels = (state.customLayout?.labels || []).map((label) => ({ ...label }));
let selectedLabelId = null;
let designerMode = "seats";
let paintMode = null;
let isPointerDown = false;
let remoteSyncTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

async function fetchRemoteLayout() {
  const response = await fetch("/api/layout", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load remote layout");
  }

  return response.json();
}

async function saveRemoteLayout(layout) {
  const response = await fetch("/api/layout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(layout)
  });

  if (!response.ok) {
    throw new Error("Failed to save remote layout");
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

function applyState(nextState) {
  state = saveState(nextState);
  selectedCells = new Set((state.customLayout?.cells || []).map((cell) => `${cell.x}:${cell.y}`));
  labels = (state.customLayout?.labels || []).map((label) => ({ ...label }));
}

function formatDate(dateIso) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(dateIso));
}

function createLabelId() {
  return `label-${crypto.randomUUID()}`;
}

function setActiveTab(tabId) {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminTab === tabId);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.adminPanel !== tabId);
  });
}

function setDesignerMode(mode) {
  designerMode = mode;
  designerModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.designerMode === mode);
  });
  designerRoot.classList.toggle("is-label-mode", mode === "labels");
}

function renderStats() {
  const stats = getStats(state);
  const items = [
    ["Всего мест", stats.seatsTotal],
    ["Свободно", stats.free],
    ["В процессе", stats.activeHolds],
    ["Забронировано", stats.booked],
    ["Прошли вход", stats.checked],
    ["Заполненность", `${stats.reservedPercent}%`]
  ];

  statsGrid.innerHTML = items
    .map(([label, value]) => `
      <article class="stat-card">
        <p class="panel__kicker">${label}</p>
        <p class="stat-card__value">${value}</p>
      </article>
    `)
    .join("");
}

function renderTable() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const tickets = flattenTickets(state).filter((ticket) => {
    if (!searchTerm) return true;

    return [ticket.fullName, ticket.group, ticket.code, ticket.seatDisplayLabel || ticket.seatLabel, ticket.contactPhone, ticket.contactNote]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm);
  });

  tableBody.innerHTML = tickets.length
    ? tickets
        .map((ticket) => {
          const statusText = ticket.status === "checked" ? "Прошёл вход" : "Забронирован";
          const statusClass = ticket.status === "checked" ? "status-pill status-pill--checked" : "status-pill status-pill--booked";
          const actionLabel = ticket.status === "checked" ? "Вернуть в бронь" : "Отметить вход";
          const nextStatus = ticket.status === "checked" ? "booked" : "checked";

          return `
            <tr>
              <td>${escapeHtml(ticket.seatDisplayLabel || ticket.seatLabel || "")}</td>
              <td>
                <div class="admin-inline-edit">
                  <input class="input admin-name-input" type="text" value="${escapeAttribute(ticket.fullName || "")}" data-ticket-name="${escapeAttribute(ticket.code)}" aria-label="ФИО билета ${escapeAttribute(ticket.code)}" />
                  <button class="button button--ghost button--small" type="button" data-ticket-name-save="${escapeAttribute(ticket.code)}">Сохранить ФИО</button>
                </div>
              </td>
              <td>${escapeHtml(ticket.group)}</td>
              <td><code>${escapeHtml(ticket.code)}</code></td>
              <td>${escapeHtml(ticket.contactPhone)}<br /><span class="muted">${escapeHtml(ticket.contactNote)}</span></td>
              <td><span class="${statusClass}">${statusText}</span></td>
              <td>
                <button class="button button--ghost" data-ticket-code="${ticket.code}" data-next-status="${nextStatus}">${actionLabel}</button>
                <button class="button button--danger" data-booking-delete="${ticket.bookingId}" data-booking-label="${ticket.code}">Удалить бронь</button>
                <div class="muted">${ticket.checkedInAt ? formatDate(ticket.checkedInAt) : "ещё не отмечен"}</div>
              </td>
            </tr>
          `;
        })
        .join("")
    : '<tr><td colspan="7" class="muted">Ничего не найдено.</td></tr>';
}

function formatAdminSeatDisplay(seat) {
  const sectionNames = {
    parter: "Партер",
    balcony: "Балкон",
    "lodge-left": "Ложа 1",
    "lodge-right": "Ложа 2"
  };
  const sectionName = sectionNames[seat.sectionId] || "Зал";
  return `${sectionName}, ряд ${seat.row}, место ${seat.number}`;
}

function renderAdminTicketGenerator() {
  if (!adminTicketCode) return;

  const tickets = flattenTickets(state);

  adminTicketCode.innerHTML = tickets.length
    ? tickets
        .map((ticket) => `<option value="${escapeAttribute(ticket.code)}">${escapeHtml(ticket.code)} - ${escapeHtml(ticket.fullName)} - ${escapeHtml(ticket.seatDisplayLabel || ticket.seatLabel)}</option>`)
        .join("")
    : '<option value="">Броней пока нет</option>';

  adminTicketCode.disabled = !tickets.length;
}

function renderDesignerSummary() {
  designerSummary.innerHTML = `
    <span class="status-pill">Отмечено мест: ${selectedCells.size}</span>
    <span class="status-pill">Подписей: ${labels.length}</span>
    <span class="muted">После сохранения схема и подписи сразу появятся на главной странице.</span>
  `;
}

function renderLabelsList() {
  if (!designerLabelsList) return;

  designerLabelsList.innerHTML = labels.length
    ? labels
        .map(
          (label) => `
            <article class="designer-label-card ${selectedLabelId === label.id ? "is-selected" : ""}">
              <div>
                <strong>${label.text}</strong>
                <div class="muted">Тип: ${label.kind} • x:${label.x + 1} y:${label.y + 1}</div>
              </div>
              <div class="toolbar">
                <button type="button" class="button button--ghost" data-label-edit="${label.id}">Выбрать</button>
                <button type="button" class="button button--danger" data-label-delete="${label.id}">Удалить</button>
              </div>
            </article>
          `
        )
        .join("")
    : '<p class="muted">Подписей пока нет. Переключитесь в режим "Подписи", введите текст и нажмите по нужной клетке.</p>';
}

function renderDesigner() {
  const cells = [];
  for (let y = 0; y < CUSTOM_LAYOUT_SIZE; y += 1) {
    for (let x = 0; x < CUSTOM_LAYOUT_SIZE; x += 1) {
      const key = `${x}:${y}`;
      const active = selectedCells.has(key);
      cells.push(`<button type="button" class="designer-cell ${active ? "is-active" : ""}" data-cell-key="${key}" aria-label="Клетка ${x + 1}, ${y + 1}"></button>`);
    }
  }

  const labelMarkup = labels
    .map(
      (label) => `
        <button
          type="button"
          class="designer-text designer-text--${label.kind} ${selectedLabelId === label.id ? "is-selected" : ""}"
          data-label-id="${label.id}"
          style="--x:${label.x}; --y:${label.y};"
        >${label.text}</button>
      `
    )
    .join("");

  designerRoot.innerHTML = cells.join("") + labelMarkup;
  renderDesignerSummary();
  renderLabelsList();
}

function saveDesignerLayout() {
  const cells = [...selectedCells].map((key) => {
    const [x, y] = key.split(":").map(Number);
    return { x, y };
  });

  applyState(applyCustomLayout(state, {
    rows: CUSTOM_LAYOUT_SIZE,
    cols: CUSTOM_LAYOUT_SIZE,
    cells,
    labels
  }));
  renderStats();
  renderTable();
  renderAdminTicketGenerator();
  renderDesigner();
}

async function syncLayoutFromServer() {
  try {
    const remoteLayout = await fetchRemoteLayout();
    if (!remoteLayout?.cells?.length) {
      return;
    }

    const localLayout = JSON.stringify(state.customLayout || null);
    const nextLayout = JSON.stringify(remoteLayout);
    if (localLayout === nextLayout) {
      return;
    }

    applyState(hydrateCustomLayout(state, remoteLayout));
    selectedLabelId = null;
    renderStats();
    renderTable();
    renderAdminTicketGenerator();
    renderDesigner();
  } catch (error) {
    console.warn("Не удалось загрузить схему с сервера.", error);
  }
}

async function syncSharedState(options = {}) {
  const { forceRender = false } = options;
  const remoteState = await fetchRemoteState();
  if (!remoteState || typeof remoteState !== "object") {
    return false;
  }

  const previousStamp = state?.lastUpdatedAt || "";
  applyState(remoteState);
  const nextStamp = state?.lastUpdatedAt || "";
  const changed = previousStamp !== nextStamp;

  if (changed || forceRender) {
    const isEditingTicketName = document.activeElement?.matches?.("[data-ticket-name]");
    if (isEditingTicketName && !forceRender) {
      return changed;
    }

    selectedLabelId = null;
    renderStats();
    renderTable();
    renderAdminTicketGenerator();
    renderDesigner();
  }

  return changed;
}

async function persistSharedState(nextState) {
  applyState(nextState);

  try {
    await saveRemoteState(state);
    await syncSharedState({ forceRender: true });
  } catch (error) {
    console.warn("Не удалось синхронизировать общее состояние зала.", error);
    renderStats();
    renderTable();
    renderAdminTicketGenerator();
    renderDesigner();
  }
}

function handleSeatPaint(cellKey, nextActive) {
  if (nextActive) {
    selectedCells.add(cellKey);
  } else {
    selectedCells.delete(cellKey);
  }

  const cell = designerRoot.querySelector(`[data-cell-key="${cellKey}"]`);
  if (cell) {
    cell.classList.toggle("is-active", nextActive);
  }
}

function upsertLabelAt(x, y) {
  const text = designerLabelText.value.trim();
  if (!text) {
    return;
  }

  const kind = designerLabelKind.value || "custom";
  if (selectedLabelId) {
    labels = labels.map((label) =>
      label.id === selectedLabelId
        ? { ...label, text, kind, x, y }
        : label
    );
  } else {
    labels.push({
      id: createLabelId(),
      text,
      kind,
      x,
      y
    });
  }

  selectedLabelId = null;
  designerLabelText.value = "";
  renderDesigner();
}

searchInput.addEventListener("input", renderTable);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.adminTab));
});

designerModeButtons.forEach((button) => {
  button.addEventListener("click", () => setDesignerMode(button.dataset.designerMode));
});

adminTicketGenerator?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const ticket = flattenTickets(state).find((item) => item.code === adminTicketCode.value);
  if (!ticket) {
    adminTicketGeneratorStatus.textContent = "Выберите билет из списка броней.";
    return;
  }

  adminTicketGeneratorStatus.textContent = "Готовим PDF...";
  adminTicketDownloadResult.innerHTML = "";

  try {
    const blob = await buildTicketsPdfBlob([ticket]);
    const url = URL.createObjectURL(blob);
    adminTicketDownloadResult.innerHTML = `
      <a class="button button--primary button--full" href="${url}" download="${ticket.code}.pdf" target="_blank" rel="noopener">Открыть / скачать PDF</a>
    `;
    adminTicketGeneratorStatus.textContent = `PDF готов: ${ticket.code}`;
  } catch (error) {
    console.error(error);
    adminTicketGeneratorStatus.textContent = "Не удалось сгенерировать PDF. Попробуйте ещё раз.";
  }
});

tableBody.addEventListener("click", async (event) => {
  const nameSaveButton = event.target.closest("[data-ticket-name-save]");
  if (nameSaveButton) {
    const row = nameSaveButton.closest("tr");
    const input = row?.querySelector("[data-ticket-name]");
    const fullName = input?.value.trim() || "";

    if (!fullName) {
      alert("Введите ФИО для билета.");
      input?.focus();
      return;
    }

    const result = updateTicketFullName(state, nameSaveButton.dataset.ticketNameSave, fullName);
    if (!result.ticket) {
      alert("Билет не найден. Обновите страницу и попробуйте ещё раз.");
      return;
    }

    nameSaveButton.disabled = true;
    nameSaveButton.textContent = "Сохранено";
    await persistSharedState(result.state);
    return;
  }

  const deleteButton = event.target.closest("[data-booking-delete]");
  if (deleteButton) {
    const approved = window.confirm(`Удалить бронь ${deleteButton.dataset.bookingLabel}? Места снова станут свободными.`);
    if (!approved) return;

    const result = deleteBooking(state, deleteButton.dataset.bookingDelete);
    if (!result.booking) {
      alert("Бронь не найдена. Обновите страницу и попробуйте ещё раз.");
      return;
    }

    await persistSharedState(result.state);
    return;
  }

  const button = event.target.closest("[data-ticket-code]");
  if (!button) return;

  const { ticketCode, nextStatus } = button.dataset;
  const result = updateTicketStatus(state, ticketCode, nextStatus);
  await persistSharedState(result.state);
});

exportButton.addEventListener("click", () => {
  const tickets = flattenTickets(state);
  const rows = [
    ["seat", "full_name", "group", "ticket_code", "contact_phone", "contact_note", "status", "created_at", "checked_in_at"],
    ...tickets.map((ticket) => [
      ticket.seatDisplayLabel || ticket.seatLabel,
      ticket.fullName,
      ticket.group,
      ticket.code,
      ticket.contactPhone,
      ticket.contactNote,
      ticket.status,
      ticket.createdAt,
      ticket.checkedInAt || ""
    ])
  ];
  const csv = "\uFEFF" + rows
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vvgu-ticketing-export.csv";
  link.click();
  URL.revokeObjectURL(url);
});

resetButton.addEventListener("click", async () => {
  const approved = window.confirm("Удалить все брони и вернуть зал в исходное состояние?");
  if (!approved) return;

  resetState();
  applyState(getState());
  selectedLabelId = null;
  await saveRemoteState(state);
  renderStats();
  renderTable();
  renderAdminTicketGenerator();
  renderDesigner();
});

designerSaveButton?.addEventListener("click", async () => {
  const approved = window.confirm("Сохранить новую схему? Текущие брони и удержания будут очищены.");
  if (!approved) return;

  saveDesignerLayout();

  try {
    await saveRemoteState(state);
    await saveRemoteLayout(state.customLayout);
  } catch (error) {
    console.warn("Не удалось сохранить схему на сервере.", error);
  }
});

designerClearButton?.addEventListener("click", () => {
  selectedCells.clear();
  labels = [];
  selectedLabelId = null;
  designerLabelText.value = "";
  renderDesigner();
});

designerRoot?.addEventListener("pointerdown", (event) => {
  const label = event.target.closest("[data-label-id]");
  if (label) {
    selectedLabelId = label.dataset.labelId;
    const current = labels.find((item) => item.id === selectedLabelId);
    if (current) {
      designerLabelText.value = current.text;
      designerLabelKind.value = current.kind;
    }
    renderDesigner();
    return;
  }

  const cell = event.target.closest("[data-cell-key]");
  if (!cell) return;

  const [x, y] = cell.dataset.cellKey.split(":").map(Number);
  if (designerMode === "labels") {
    upsertLabelAt(x, y);
    return;
  }

  isPointerDown = true;
  const key = cell.dataset.cellKey;
  const nextActive = !selectedCells.has(key);
  paintMode = nextActive;
  handleSeatPaint(key, nextActive);
  renderDesignerSummary();
});

designerRoot?.addEventListener("pointerover", (event) => {
  if (!isPointerDown || paintMode === null || designerMode !== "seats") return;
  const cell = event.target.closest("[data-cell-key]");
  if (!cell) return;

  handleSeatPaint(cell.dataset.cellKey, paintMode);
  renderDesignerSummary();
});

designerLabelsList?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-label-edit]");
  if (editButton) {
    selectedLabelId = editButton.dataset.labelEdit;
    const current = labels.find((label) => label.id === selectedLabelId);
    if (current) {
      setDesignerMode("labels");
      designerLabelText.value = current.text;
      designerLabelKind.value = current.kind;
      renderDesigner();
    }
    return;
  }

  const deleteButton = event.target.closest("[data-label-delete]");
  if (deleteButton) {
    labels = labels.filter((label) => label.id !== deleteButton.dataset.labelDelete);
    if (selectedLabelId === deleteButton.dataset.labelDelete) {
      selectedLabelId = null;
      designerLabelText.value = "";
    }
    renderDesigner();
  }
});

window.addEventListener("pointerup", () => {
  isPointerDown = false;
  paintMode = null;
});

window.addEventListener("storage", () => {
  applyState(getState());
  selectedLabelId = null;
  renderStats();
  renderTable();
  renderAdminTicketGenerator();
  renderDesigner();
});

renderStats();
renderTable();
renderAdminTicketGenerator();
renderDesigner();
setActiveTab("bookings");
setDesignerMode("seats");
syncLayoutFromServer();
syncSharedState({ forceRender: true });
window.clearInterval(remoteSyncTimer);
remoteSyncTimer = window.setInterval(() => {
  syncSharedState();
}, 5000);
