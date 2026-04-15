const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const LAYOUT_FILE = path.join(DATA_DIR, "layout.json");
const STATE_FILE = path.join(DATA_DIR, "state.json");
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
  ".ico": "image/x-icon"
};

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(LAYOUT_FILE)) {
    fs.writeFileSync(LAYOUT_FILE, "null", "utf8");
  }

  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, "null", "utf8");
  }
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
