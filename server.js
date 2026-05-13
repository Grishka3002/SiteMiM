const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const VOTING_DIR = path.join(ROOT, "images", "voting");
const VOTING_BOYS_DIR = path.join(VOTING_DIR, "boys");
const VOTING_GIRLS_DIR = path.join(VOTING_DIR, "girls");
const LAYOUT_FILE = path.join(DATA_DIR, "layout.json");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const VOTES_FILE = path.join(DATA_DIR, "votes.json");
const ADMIN_PASSWORD = "14MiMVVSU05";
const ADMIN_REALM = 'Admin Panel';

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon"
};

const VOTING_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.mkdirSync(VOTING_BOYS_DIR, { recursive: true });
  fs.mkdirSync(VOTING_GIRLS_DIR, { recursive: true });

  if (!fs.existsSync(LAYOUT_FILE)) {
    fs.writeFileSync(LAYOUT_FILE, "null", "utf8");
  }

  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, "null", "utf8");
  }

  if (!fs.existsSync(VOTES_FILE)) {
    fs.writeFileSync(VOTES_FILE, JSON.stringify({ votes: [] }, null, 2), "utf8");
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function getCandidateName(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCandidateNumber(fileName) {
  const match = String(fileName).match(/(?:№|#|N)\s*(\d+)/i);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function compareVoteCandidateFiles(a, b) {
  const numberDiff = getCandidateNumber(a) - getCandidateNumber(b);
  if (numberDiff !== 0) {
    return numberDiff;
  }

  return a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" });
}

function listVoteCandidates(group, directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => VOTING_IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .sort(compareVoteCandidateFiles)
    .slice(0, 5)
    .map((fileName) => {
      const name = getCandidateName(fileName);
      return {
        id: `${group}:${fileName}`,
        name,
        image: `/images/voting/${group}/${encodeURIComponent(fileName)}`
      };
    });
}

function readVotes() {
  try {
    const parsed = JSON.parse(fs.readFileSync(VOTES_FILE, "utf8") || "{}");
    return Array.isArray(parsed.votes) ? parsed : { votes: [] };
  } catch {
    return { votes: [] };
  }
}

function writeVotes(votesState) {
  fs.writeFileSync(VOTES_FILE, JSON.stringify(votesState, null, 2), "utf8");
}

function createStateBackup(reason = "manual") {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(DATA_DIR, `state-backup-${reason}-${stamp}.json`);
  if (fs.existsSync(STATE_FILE)) {
    fs.copyFileSync(STATE_FILE, backupFile);
  }
  return backupFile;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ";") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((item) => item.some((value) => value !== ""));
}

function parseCsvExport(content) {
  const rows = parseCsv(String(content || "").replace(/^\uFEFF/, ""));
  const header = rows.shift() || [];
  return rows.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] || ""])));
}

function parseSeatFromDisplay(label) {
  const match = String(label || "").match(/^(.*?),\s*ряд\s*(\d+),\s*место\s*(\d+)/i);
  if (!match) return null;

  const section = match[1].trim().toLowerCase();
  const sectionId = section.includes("партер")
    ? "parter"
    : section.includes("балкон")
      ? "balcony"
      : section.includes("ложа 1")
        ? "lodge-left"
        : section.includes("ложа 2")
          ? "lodge-right"
          : "";

  return {
    sectionId,
    row: match[2],
    number: Number(match[3])
  };
}

function makeRestoredId(prefix, value) {
  return `${prefix}-${Buffer.from(String(value)).toString("base64url").slice(0, 22)}`;
}

function buildStateFromCsvExport(csvContent) {
  const currentState = readSharedState();
  const entries = parseCsvExport(csvContent);
  const groups = new Map();
  const seenCodes = new Set();
  const unmatchedSeats = [];

  entries.forEach((entry) => {
    const ticketCode = String(entry.ticket_code || "").trim();
    if (!ticketCode || seenCodes.has(ticketCode)) return;

    const parsedSeat = parseSeatFromDisplay(entry.seat);
    const seat = parsedSeat && (currentState.seats || []).find(
      (item) =>
        item.sectionId === parsedSeat.sectionId &&
        String(item.row) === parsedSeat.row &&
        Number(item.number) === parsedSeat.number
    );

    if (!seat) {
      unmatchedSeats.push(entry.seat);
      return;
    }

    seenCodes.add(ticketCode);
    const createdAt = entry.created_at || new Date().toISOString();
    const contactPhone = String(entry.contact_phone || "").trim();
    const contactNote = String(entry.contact_note || "").trim();
    const bookingKey = `${createdAt}|${contactPhone}|${contactNote}`;

    if (!groups.has(bookingKey)) {
      groups.set(bookingKey, {
        id: makeRestoredId("booking-restored", bookingKey),
        createdAt,
        contactPhone,
        contactNote,
        tickets: []
      });
    }

    const status = entry.status === "checked" ? "checked" : "booked";
    const booking = groups.get(bookingKey);
    booking.tickets.push({
      id: makeRestoredId("ticket-restored", ticketCode),
      code: ticketCode,
      seatId: seat.id,
      seatLabel: seat.ticketLabel || String(entry.seat || "").trim(),
      seatDisplayLabel: getSeatDisplayLabel(seat),
      fullName: String(entry.full_name || "").trim(),
      group: String(entry.group || "").trim(),
      issuedDeviceId: "VVGU-RESTORED-UPLOAD",
      status,
      checkedInAt: status === "checked" ? (entry.checked_in_at || new Date().toISOString()) : null,
      bookingId: booking.id
    });
  });

  if (unmatchedSeats.length) {
    const error = new Error("unmatched_seats");
    error.unmatchedSeats = unmatchedSeats.slice(0, 20);
    error.unmatchedCount = unmatchedSeats.length;
    throw error;
  }

  const bookings = [...groups.values()]
    .filter((booking) => booking.tickets.length)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const restoredTickets = bookings.reduce((sum, booking) => sum + booking.tickets.length, 0);

  if (entries.length && restoredTickets === 0) {
    throw new Error("no_tickets_to_restore");
  }

  return {
    state: {
      ...currentState,
      holds: [],
      bookings,
      lastUpdatedAt: new Date().toISOString()
    },
    restoredBookings: bookings.length,
    restoredTickets
  };
}

function buildStateFromUploadedJson(content) {
  const uploadedState = JSON.parse(content || "null");
  if (!uploadedState || typeof uploadedState !== "object" || !Array.isArray(uploadedState.bookings)) {
    throw new Error("invalid_state_json");
  }

  const currentState = readSharedState();
  const bookings = uploadedState.bookings;
  return {
    state: {
      ...currentState,
      ...uploadedState,
      holds: [],
      bookings,
      lastUpdatedAt: new Date().toISOString()
    },
    restoredBookings: bookings.length,
    restoredTickets: bookings.reduce((sum, booking) => sum + ((booking.tickets || []).length), 0)
  };
}

/*
function normalizeVoteLookup(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/giu, "");
}

*/

function readSharedState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8") || "null") || { bookings: [] };
  } catch {
    return { bookings: [] };
  }
}

function getAllTickets() {
  const state = readSharedState();
  return (state.bookings || []).flatMap((booking) =>
    (booking.tickets || []).map((ticket) => ({
      ...ticket,
      bookingId: ticket.bookingId || booking.id
    }))
  );
}

function getTicketVoteKey(ticket) {
  return String(ticket.code || ticket.id || "").trim();
}

function getSeatDisplayLabel(seat) {
  if (!seat) return "";

  const sectionNames = {
    parter: "Партер",
    balcony: "Балкон",
    "lodge-left": "Ложа 1",
    "lodge-right": "Ложа 2"
  };
  const sectionName = sectionNames[seat.sectionId] || String(seat.sectionTitle || "").trim();
  const placeText = `ряд ${seat.row}, место ${seat.number}`;
  return sectionName ? `${sectionName}, ${placeText}` : `Ряд ${seat.row}, место ${seat.number}`;
}

function getTicketSeatDisplayLabel(ticket) {
  const state = readSharedState();
  const liveSeat = (state.seats || []).find((seat) => seat.id === ticket.seatId);
  if (liveSeat) {
    return getSeatDisplayLabel(liveSeat);
  }

  const storedLabel = String(ticket.seatDisplayLabel || ticket.seatLabel || "").trim();
  if (/[\uFFFD?]{2,}/.test(storedLabel)) {
    return String(ticket.seatLabel || "").trim() || storedLabel.replace(/[\uFFFD?]+/g, "").replace(/\s+/g, " ").trim();
  }

  return storedLabel;
}

function findTicketForVote(query) {
  const normalizedQuery = normalizeVoteLookup(query);
  if (!normalizedQuery) {
    return null;
  }

  return getAllTickets().find((ticket) => {
    const values = [
      ticket.code,
      ticket.seatLabel,
      ticket.seatDisplayLabel,
      getTicketSeatDisplayLabel(ticket),
      `${ticket.seatLabel} ${ticket.seatDisplayLabel}`
    ];
    return values.some((value) => normalizeVoteLookup(value) === normalizedQuery);
  }) || null;
}

function getPublicTicket(ticket) {
  return {
    code: ticket.code,
    seatLabel: ticket.seatLabel,
    seatDisplayLabel: getTicketSeatDisplayLabel(ticket),
    checkedIn: isTicketCheckedIn(ticket)
  };
}

function isTicketCheckedIn(ticket) {
  return ticket?.status === "checked" || Boolean(ticket?.checkedInAt);
}

function normalizeVoteLookup(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\u0451/giu, "\u0435")
    .replace(/[^\p{L}0-9]+/gu, "");
}

function sendFile(filePath, response) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Файл не найден");
      return;
    }

    response.writeHead(200, { "Content-Type": mimeType });
    response.end(content);
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => resolve(raw));
    request.on("error", reject);
  });
}

function getBasicAuthPassword(request) {
  const header = request.headers.authorization || "";
  if (!header.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) {
      return null;
    }

    return decoded.slice(separatorIndex + 1);
  } catch {
    return null;
  }
}

function requireAdminAuth(request, response) {
  const password = getBasicAuthPassword(request);
  if (password === ADMIN_PASSWORD) {
    return true;
  }

  response.writeHead(401, {
    "Content-Type": "text/plain; charset=utf-8",
    "WWW-Authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`
  });
  response.end("Требуется пароль администратора");
  return false;
}

const server = http.createServer((request, response) => {
  ensureDataFiles();
  const urlPath = decodeURIComponent((request.url || "/").split("?")[0]);

  const isAdminRoute = urlPath === "/admin" || urlPath.startsWith("/admin/");
  const isAdminWriteRoute =
    (urlPath === "/api/layout" && request.method === "POST") ||
    (urlPath === "/api/state/import" && request.method === "POST");

  if ((isAdminRoute || isAdminWriteRoute) && !requireAdminAuth(request, response)) {
    return;
  }

  if (urlPath === "/api/layout" && request.method === "GET") {
    fs.readFile(LAYOUT_FILE, "utf8", (error, content) => {
      if (error) {
        response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "layout_read_failed" }));
        return;
      }

      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(content || "null");
    });
    return;
  }

  if (urlPath === "/api/layout" && request.method === "POST") {
    readRequestBody(request)
      .then((raw) => {
        JSON.parse(raw || "null");
        fs.writeFile(LAYOUT_FILE, raw || "null", "utf8", (error) => {
          if (error) {
            response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "layout_write_failed" }));
            return;
          }

          response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ ok: true }));
        });
      })
      .catch(() => {
        response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "invalid_json" }));
      });
    return;
  }

  if (urlPath === "/api/state" && request.method === "GET") {
    fs.readFile(STATE_FILE, "utf8", (error, content) => {
      if (error) {
        response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "state_read_failed" }));
        return;
      }

      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(content || "null");
    });
    return;
  }

  if (urlPath === "/api/state" && request.method === "POST") {
    readRequestBody(request)
      .then((raw) => {
        JSON.parse(raw || "null");
        fs.writeFile(STATE_FILE, raw || "null", "utf8", (error) => {
          if (error) {
            response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "state_write_failed" }));
            return;
          }

          response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ ok: true }));
        });
      })
      .catch(() => {
        response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "invalid_json" }));
      });
    return;
  }

  if (urlPath === "/api/state/import" && request.method === "POST") {
    readRequestBody(request)
      .then((raw) => {
        const payload = JSON.parse(raw || "{}");
        const fileName = String(payload.fileName || "").toLowerCase();
        const content = String(payload.content || "");
        const isJson = fileName.endsWith(".json") || content.trim().startsWith("{");
        const result = isJson ? buildStateFromUploadedJson(content) : buildStateFromCsvExport(content);
        const backupFile = createStateBackup("import");

        fs.writeFile(STATE_FILE, JSON.stringify(result.state, null, 2), "utf8", (error) => {
          if (error) {
            sendJson(response, 500, { error: "state_write_failed" });
            return;
          }

          sendJson(response, 200, {
            ok: true,
            backupFile: path.basename(backupFile),
            restoredBookings: result.restoredBookings,
            restoredTickets: result.restoredTickets
          });
        });
      })
      .catch((error) => {
        if (error?.message === "unmatched_seats") {
          sendJson(response, 400, {
            error: "unmatched_seats",
            unmatchedCount: error.unmatchedCount,
            unmatchedSeats: error.unmatchedSeats
          });
          return;
        }

        sendJson(response, 400, { error: error?.message || "invalid_import_file" });
      });
    return;
  }

  if (urlPath === "/api/vote-candidates" && request.method === "GET") {
    sendJson(response, 200, {
      girls: listVoteCandidates("girls", VOTING_GIRLS_DIR),
      boys: listVoteCandidates("boys", VOTING_BOYS_DIR)
    });
    return;
  }

  if (urlPath === "/api/votes" && request.method === "GET") {
    sendJson(response, 200, readVotes());
    return;
  }

  if (urlPath === "/api/vote-ticket" && request.method === "POST") {
    readRequestBody(request)
      .then((raw) => {
        const payload = JSON.parse(raw || "{}");
        const ticket = findTicketForVote(payload.ticketQuery);

        if (!ticket) {
          sendJson(response, 404, { error: "ticket_not_found" });
          return;
        }

        if (!isTicketCheckedIn(ticket)) {
          sendJson(response, 403, {
            error: "ticket_not_checked_in",
            ticket: getPublicTicket(ticket)
          });
          return;
        }

        const ticketKey = getTicketVoteKey(ticket);
        const votesState = readVotes();
        const vote = votesState.votes.find((item) => item.ticketCode === ticketKey || item.ticketId === ticket.id);

        sendJson(response, 200, {
          ticket: getPublicTicket(ticket),
          vote: vote || null
        });
      })
      .catch(() => {
        sendJson(response, 400, { error: "invalid_json" });
      });
    return;
  }

  if (urlPath === "/api/votes" && request.method === "POST") {
    readRequestBody(request)
      .then((raw) => {
        const payload = JSON.parse(raw || "{}");
        const ticket = findTicketForVote(payload.ticketQuery || payload.ticketCode);
        const boyId = String(payload.boyId || "").trim();
        const girlId = String(payload.girlId || "").trim();
        const candidates = {
          boys: listVoteCandidates("boys", VOTING_BOYS_DIR),
          girls: listVoteCandidates("girls", VOTING_GIRLS_DIR)
        };
        const hasBoy = candidates.boys.some((candidate) => candidate.id === boyId);
        const hasGirl = candidates.girls.some((candidate) => candidate.id === girlId);

        if (!ticket || !hasBoy || !hasGirl) {
          sendJson(response, 400, { error: "invalid_vote" });
          return;
        }

        if (!isTicketCheckedIn(ticket)) {
          sendJson(response, 403, {
            error: "ticket_not_checked_in",
            ticket: getPublicTicket(ticket)
          });
          return;
        }

        const ticketKey = getTicketVoteKey(ticket);
        const votesState = readVotes();
        const nextVote = {
          ticketCode: ticketKey,
          ticketId: ticket.id,
          seatLabel: ticket.seatLabel,
          seatDisplayLabel: getTicketSeatDisplayLabel(ticket),
          boyId,
          girlId,
          updatedAt: new Date().toISOString()
        };
        const existingIndex = votesState.votes.findIndex((vote) => vote.ticketCode === ticketKey || vote.ticketId === ticket.id);

        if (existingIndex === -1) {
          votesState.votes.push(nextVote);
        } else {
          votesState.votes[existingIndex] = nextVote;
        }

        writeVotes(votesState);
        sendJson(response, 200, {
          ...votesState,
          ticket: getPublicTicket(ticket)
        });
      })
      .catch(() => {
        sendJson(response, 400, { error: "invalid_json" });
      });
    return;
  }

  let targetPath = path.join(ROOT, urlPath);

  if (urlPath === "/") {
    targetPath = path.join(ROOT, "index.html");
  } else if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(targetPath, "index.html");
  }

  if (!targetPath.startsWith(ROOT)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Доступ запрещён");
    return;
  }

  sendFile(targetPath, response);
});

server.listen(PORT, () => {
  ensureDataFiles();
  console.log(`VVGU Ticketing запущен на http://localhost:${PORT}`);
});
