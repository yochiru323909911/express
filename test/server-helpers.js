const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { fork } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const PRELOAD = path.join(__dirname, "preload.cjs");

/**
 * Runs index.js in its own process, exactly like `node index.js`, and waits until it calls app.listen(...).
 * Everything the server prints and every fetch() it makes is captured, so the tests can check it.
 */
function startServer(file = "index.js", { timeout = 8000 } = {}) {
  if (!fs.existsSync(path.join(ROOT, "node_modules", "express"))) {
    throw new Error("express is not installed - run `npm install` first");
  }

  const child = fork(path.join(ROOT, file), [], {
    cwd: ROOT,
    execArgv: ["--require", PRELOAD],
    env: { ...process.env, CAT_API_KEY: process.env.CAT_API_KEY || "test-api-key" },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  let printed = "";
  const fetches = [];
  child.stdout.setEncoding("utf8").on("data", (chunk) => (printed += chunk));
  child.stderr.setEncoding("utf8").on("data", (chunk) => (printed += chunk));
  child.on("message", (msg) => {
    if (msg && msg.type === "fetch") fetches.push(msg);
  });

  const outputLines = () => printed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const stop = () => {
    if (child.exitCode === null && !child.killed) child.kill();
  };
  const printedNote = () =>
    printed.trim()
      ? `\n--- the server printed ---\n${printed.trim().split(/\r?\n/).filter((l) => !/^\s+at /.test(l)).slice(-15).join("\n")}`
      : "";

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      stop();
      reject(new Error(`${file} did not start a server within ${timeout / 1000}s - did you call app.listen(3000)?`));
    }, timeout);
    child.on("message", (msg) => {
      if (msg && msg.type === "listening") {
        clearTimeout(timer);
        resolve(msg.port);
      }
    });
    child.on("exit", () => {
      clearTimeout(timer);
      if (/Error/.test(printed)) {
        const lines = printed.split(/\r?\n/);
        const error = (lines.find((l) => /^\w*Error\b/.test(l.trim())) || "").trim();
        const where = lines.find((l) => /[\\/][^\\/]+\.js:\d+/.test(l) && !/node_modules|node:/.test(l));
        const place = where ? ` (at ${where.trim().replace(/^at\s+/, "").replace(/^.*[\\/]/, "").replace(/\)$/, "")})` : "";
        reject(new Error(`${file} crashed while starting: ${error || "see the output below"}${place}${printedNote()}`));
      }
      else reject(new Error(`${file} finished without starting a server - create an express app and call app.listen(3000)${printedNote()}`));
    });
  });
  ready.catch(() => {}); // reported by request()

  /** Sends one HTTP request and returns { status, headers, text, json } (json is undefined if the body is not JSON). */
  async function request(method, urlPath = "/", { json, body, headers = {} } = {}) {
    const port = await ready;
    if (json !== undefined) {
      body = JSON.stringify(json);
      headers = { "content-type": "application/json", ...headers };
    }
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: "127.0.0.1", port, method, path: urlPath, headers }, (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (text += c));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(text);
          } catch {}
          resolve({ status: res.statusCode, headers: res.headers, text, json: parsed });
        });
      });
      req.setTimeout(4000, () =>
        req.destroy(new Error(`the server did not answer ${method} ${urlPath} within 4s - did you send a response (res.json(...))?${printedNote()}`))
      );
      req.on("error", (err) =>
        reject(err.message.includes("did not answer") ? err : new Error(`request ${method} ${urlPath} failed: ${err.message}${printedNote()}`))
      );
      if (body !== undefined) req.write(body);
      req.end();
    });
  }

  async function waitForOutput(check, waitMs = 1500) {
    const start = Date.now();
    while (Date.now() - start < waitMs) {
      if (check(outputLines())) return true;
      await new Promise((r) => setTimeout(r, 25));
    }
    return check(outputLines());
  }

  return { ready, request, outputLines, waitForOutput, fetches, printedNote, stop };
}

/** Short description of a response, for assertion messages. */
function describe(res) {
  const body = res.text.length > 300 ? res.text.slice(0, 300) + "..." : res.text;
  return `(got status ${res.status}, body: ${body || "<empty>"})`;
}

module.exports = { startServer, describe, ROOT };
