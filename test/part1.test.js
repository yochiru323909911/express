const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, describe, ROOT } = require("./server-helpers");

test("Part 1: answers.md - every question has an answer", () => {
  const file = path.join(ROOT, "answers.md");
  assert.ok(fs.existsSync(file), "answers.md is missing - don't delete it, write your answers in it");
  const text = fs.readFileSync(file, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  const sections = text.split(/^##\s+/m).slice(1);
  assert.equal(sections.length, 3, "answers.md should keep its 3 questions (the lines that start with ##)");
  sections.forEach((section, i) => {
    const answer = section.split(/\r?\n/).slice(1).join(" ").replace(/\s+/g, " ").trim();
    assert.ok(answer.length >= 20, `write an answer (at least one full sentence) under question ${i + 1} in answers.md`);
  });
});

test("Part 1: GET /greet answers with JSON { msg: 'hi from get endpoint <TIMESTAMP>' }", async (t) => {
  const server = startServer();
  t.after(server.stop);
  const before = Date.now();
  const res = await server.request("GET", "/greet");
  assert.equal(res.status, 200, `GET /greet should answer with status 200 ${describe(res)}`);
  assert.match(String(res.headers["content-type"]), /json/, `GET /greet should answer with JSON - use res.json(...) ${describe(res)}`);
  assert.ok(res.json && typeof res.json.msg === "string", `the JSON should have a "msg" key ${describe(res)}`);

  const match = res.json.msg.match(/^hi from get endpoint (.+)$/);
  assert.ok(match, `msg should look like: "hi from get endpoint 2025-07-07T12:00:00.000Z" (got "${res.json.msg}")`);

  const stamp = match[1].trim();
  const time = /^\d+$/.test(stamp) ? Number(stamp) : Date.parse(stamp);
  assert.ok(!Number.isNaN(time), `"${stamp}" is not a timestamp - use new Date().toISOString()`);
  assert.ok(Math.abs(time - before) < 60_000, `the timestamp should be the current time (got "${stamp}") - create it inside the handler`);
});

test("Part 1: GET /greet shows a new timestamp on every request", async (t) => {
  const server = startServer();
  t.after(server.stop);
  const first = await server.request("GET", "/greet");
  assert.ok(first.json && /^hi from get endpoint /.test(first.json.msg || ""), `GET /greet should answer { msg: "hi from get endpoint <TIMESTAMP>" } ${describe(first)}`);
  await new Promise((r) => setTimeout(r, 15));
  const second = await server.request("GET", "/greet");
  assert.notEqual(second.json.msg, first.json.msg, "two requests should get two different timestamps - create the date inside the route handler, not once at the top of the file");
});
