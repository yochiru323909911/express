const { test } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, describe } = require("./server-helpers");

test("Part 2: GET /greet/:name answers { msg: 'got name: <NAME>' }", async (t) => {
  const server = startServer();
  t.after(server.stop);
  for (const name of ["Alice", "Dana"]) {
    const res = await server.request("GET", `/greet/${name}`);
    assert.equal(res.status, 200, `GET /greet/${name} should answer with status 200 ${describe(res)}`);
    assert.deepEqual(res.json, { msg: `got name: ${name}` }, `GET /greet/${name} should answer { "msg": "got name: ${name}" } ${describe(res)}`);
  }
});

test("Part 2: GET /greet/:name prints 'i got name: <NAME>' in the server terminal", async (t) => {
  const server = startServer();
  t.after(server.stop);
  await server.request("GET", "/greet/Alice");
  await server.request("GET", "/greet/Noa");
  const printed = await server.waitForOutput((lines) => lines.includes("i got name: Alice") && lines.includes("i got name: Noa"));
  assert.ok(printed, `after GET /greet/Alice the server should print exactly: i got name: Alice (use console.log)${server.printedNote()}`);
});

test("Part 2: GET /greet still works next to GET /greet/:name", async (t) => {
  const server = startServer();
  t.after(server.stop);
  const res = await server.request("GET", "/greet");
  assert.ok(res.json && /^hi from get endpoint /.test(res.json.msg || ""), `GET /greet should still answer { msg: "hi from get endpoint <TIMESTAMP>" } ${describe(res)}`);
  const named = await server.request("GET", "/greet/Bob");
  assert.deepEqual(named.json, { msg: "got name: Bob" }, `GET /greet/Bob should answer { "msg": "got name: Bob" } ${describe(named)}`);
});

test("Part 2: GET /test calls /greet/:name with fetch and answers { result: 'ok' }", async (t) => {
  const server = startServer();
  t.after(server.stop);
  const res = await server.request("GET", "/test");
  assert.equal(res.status, 200, `GET /test should answer with status 200 ${describe(res)}`);

  const call = server.fetches.find((f) => /\/greet\/[^/?#]+/.test(new URL(f.url).pathname));
  assert.ok(
    call,
    `GET /test should send a request with fetch to your own server: fetch("http://localhost:3000/greet/Bob")` +
      (server.fetches.length ? ` (fetch was called with: ${server.fetches.map((f) => f.url).join(", ")})` : " (fetch was not called)")
  );
  const host = new URL(call.url).hostname;
  assert.ok(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(host), `the fetch from /test should go to your own server - http://localhost:3000/greet/... (you called ${call.url})`);
  assert.deepEqual(res.json, { result: "ok" }, `when /greet/:name answers correctly, GET /test should answer { "result": "ok" } ${describe(res)}`);
});
