const { test } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, describe } = require("./server-helpers");

// The fake answers the tests give instead of the real APIs (see test/preload.cjs)
const SINGLE_JOKE = "I told my computer a joke about UDP, but I am not sure it got it.";
const SETUP = "Why do programmers prefer dark mode?";
const PUNCHLINE = "Because light attracts bugs!";

const MALFORMED = [
  ["no body at all", {}],
  ["an empty object {}", { json: {} }],
  ['a wrong key { "type": "joke" }', { json: { type: "joke" } }],
  ['an invalid action { "action": "dance" }', { json: { action: "dance" } }],
  ['an action that is not a string { "action": 5 }', { json: { action: 5 } }],
];

for (const [what, options] of MALFORMED) {
  test(`Part 3: POST /action with ${what} -> 400 { msg: 'body is malformed' }`, async (t) => {
    const server = startServer();
    t.after(server.stop);
    const res = await server.request("POST", "/action", options);
    assert.notEqual(res.status, 404, `POST /action was not found - create the route with app.post("/action", ...) ${describe(res)}`);
    assert.notEqual(res.status, 500, `the server crashed on a malformed body - check req.body before you read from it (req.body may be undefined) ${describe(res)}`);
    assert.equal(res.status, 400, `a POST /action with ${what} should answer with status 400 - res.status(400) ${describe(res)}`);
    assert.deepEqual(res.json, { msg: "body is malformed" }, `the answer should be exactly { "msg": "body is malformed" } ${describe(res)}`);
    assert.equal(server.fetches.length, 0, "with a malformed body the server should not call any API");
  });
}

test("Part 3: POST /action { action: 'joke' } -> a joke from the joke API, in UPPERCASE", async (t) => {
  const server = startServer();
  t.after(server.stop);
  const res = await server.request("POST", "/action", { json: { action: "joke" } });
  assert.equal(res.status, 200, `{ "action": "joke" } is valid and should answer with status 200 ${describe(res)}`);

  const call = server.fetches.find((f) => /joke/i.test(new URL(f.url).hostname));
  assert.ok(call, `the server should get the joke with fetch from the joke API (https://v2.jokeapi.dev/joke/Any?type=single)` +
    (server.fetches.length ? ` (fetch was called with: ${server.fetches.map((f) => f.url).join(", ")})` : " (fetch was not called)"));

  assert.ok(res.json && typeof res.json.joke === "string", `the answer should be JSON with a "joke" key: { "joke": "..." } ${describe(res)}`);
  const joke = res.json.joke;
  assert.equal(joke, joke.toUpperCase(), `the joke should be in UPPERCASE - use .toUpperCase() (got "${joke}")`);
  const fromApi = joke.includes(SINGLE_JOKE.toUpperCase()) || (joke.includes(SETUP.toUpperCase()) && joke.includes(PUNCHLINE.toUpperCase()));
  assert.ok(fromApi, `the joke should be the text the joke API returned, in uppercase (for a "twopart" joke - both setup and delivery). Got "${joke}"`);
});

test("Part 3: POST /action { action: 'cat fact' } -> 11 images from the cat API, sent with x-api-key", async (t) => {
  const server = startServer();
  t.after(server.stop);
  const res = await server.request("POST", "/action", { json: { action: "cat fact" } });
  assert.equal(res.status, 200, `{ "action": "cat fact" } is valid and should answer with status 200 ${describe(res)}`);

  const call = server.fetches.find((f) => /thecatapi\.com$/.test(new URL(f.url).hostname));
  assert.ok(call, `the server should call the cat API with fetch: https://api.thecatapi.com/v1/images/search?limit=11` +
    (server.fetches.length ? ` (fetch was called with: ${server.fetches.map((f) => f.url).join(", ")})` : " (fetch was not called)"));
  assert.equal(new URL(call.url).searchParams.get("limit"), "11", `ask the cat API for 11 images with ?limit=11 (you called ${call.url})`);
  assert.ok(call.headers["x-api-key"], `send the API key in a header: fetch(url, { headers: { "x-api-key": "<your_api_key>" } })`);

  assert.ok(res.json && "length" in res.json, `the answer should be JSON with a "length" key: { "length": "11" } ${describe(res)}`);
  assert.equal(String(res.json.length), "11", `"length" should be the number of images the API returned - 11 ${describe(res)}`);
});
