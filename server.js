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

function listVoteCandidates(group, directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => VOTING_IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "ru"))
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
      `${ticket.seatLabel} ${ticket.seatDisplayLabel}`
    ];
    return values.some((value) => normalizeVoteLookup(value) === normalizedQuery);
  }) || null;
}

function getPublicTicket(ticket) {
  return {
    code: ticket.code,
    seatLabel: ticket.seatLabel,
    seatDisplayLabel: ticket.seatDisplayLabel || ticket.seatLabel,
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
  const isAdminWriteRoute = urlPath === "/api/layout" && request.method === "POST";

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
          seatDisplayLabel: ticket.seatDisplayLabel || ticket.seatLabel,
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
