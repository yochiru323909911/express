// Loaded by the tests before index.js (node --require). You don't need to read or change this file.
//
// 1. Port: whatever port you pass to app.listen() (3000), the server gets a free random port instead,
//    so the tests never clash with a server you already run in another terminal.
// 2. fetch: requests to localhost:3000 are sent to that random port, so GET /test still works.
// 3. fetch: requests to the joke API and the cat API get fake answers (no internet, no real API key needed),
//    and every fetch call is reported to the tests, so they can check the URL and the headers you sent.
const net = require("node:net");

const realFetch = globalThis.fetch;
let actualPort = null;
let requestedPort = 3000;

const send = (msg) => {
  if (process.send) process.send(msg);
};

const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  if (args[0] !== null && typeof args[0] === "object") {
    if (args[0].port) requestedPort = Number(args[0].port);
    args[0] = { ...args[0], port: 0, host: undefined };
  } else if (args.length === 0 || typeof args[0] === "function") {
    args.unshift(0);
  } else {
    if (Number(args[0])) requestedPort = Number(args[0]);
    args[0] = 0;
    if (typeof args[1] === "string") args.splice(1, 1); // drop a host like "localhost"
  }
  this.once("listening", () => {
    actualPort = this.address().port;
    send({ type: "listening", port: actualPort });
  });
  return originalListen.apply(this, args);
};

const FAKE_JOKE = {
  single: "I told my computer a joke about UDP, but I am not sure it got it.",
  setup: "Why do programmers prefer dark mode?",
  delivery: "Because light attracts bugs!",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function fakeCats(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `cat${i + 1}`,
    url: `https://cdn2.thecatapi.com/images/cat${i + 1}.jpg`,
    width: 500,
    height: 400,
  }));
}

function fakeExternal(url, headers) {
  const host = url.hostname;
  if (host.includes("jokeapi.dev")) {
    // https://v2.jokeapi.dev/joke/Any?type=single  ->  { type: "single", joke }
    // without ?type=single the API may also return { type: "twopart", setup, delivery }
    if (url.searchParams.get("type") === "twopart") {
      return json({ error: false, category: "Programming", type: "twopart", setup: FAKE_JOKE.setup, delivery: FAKE_JOKE.delivery, id: 2, safe: true, lang: "en" });
    }
    return json({ error: false, category: "Programming", type: "single", joke: FAKE_JOKE.single, id: 1, safe: true, lang: "en" });
  }
  if (host.includes("official-joke-api")) {
    return json({ type: "general", setup: FAKE_JOKE.setup, punchline: FAKE_JOKE.delivery, id: 3 });
  }
  if (host.includes("thecatapi.com")) {
    // like the real API: without an api key you get at most 10 images
    const limit = Math.max(1, Number(url.searchParams.get("limit")) || 1);
    const hasKey = Boolean(headers.get("x-api-key"));
    return json(fakeCats(hasKey ? Math.min(limit, 100) : Math.min(limit, 10)));
  }
  return null;
}

globalThis.fetch = async function fetch(input, init = {}) {
  const request = new Request(input, init);
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  send({ type: "fetch", url: url.href, method: request.method, headers: Object.fromEntries(headers) });

  const isLocal = ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(url.hostname);
  if (isLocal) {
    if (actualPort && Number(url.port || 80) === requestedPort) url.port = String(actualPort);
    url.hostname = "127.0.0.1";
    return realFetch(new Request(url, request));
  }

  const fake = fakeExternal(url, headers);
  if (fake) return fake;
  throw new TypeError(`fetch failed - in the tests only the joke API, the cat API and localhost are allowed (you called ${url.href})`);
};
