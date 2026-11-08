// Express.js Intro - write your server here.
// Run it with: node index.js   (stop it with Ctrl + C)

// Part 1: create an express app, a GET /greet endpoint and app.listen(3000)

// Part 2: GET /greet/:name  and  GET /test (calls /greet/:name with fetch)

// Part 3: POST /action  ("joke" / "cat fact", otherwise 400 "body is malformed")

import express from "express";

const app = express();
app.use(express.json())
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Part 1: GET /greet
app.get("/greet", (req, res) => {
  res.json({ "msg": `hi from get endpoint ${new Date().toISOString()}` });
});

// Part 2: GET /greet/:name

app.get("/greet/:name", (req, res) => {
    const { name } = req.params;
    console.log(`i got name: ${name}`);
    res.json({ "msg": `got name: ${name}`});
});

// Part 2: GET /test (calls /greet/:name with fetch)

app.get("/test", async (req, res) => {
    const name = "Alice";
    const response = await fetch (`http://localhost:${PORT}/greet/${name}`);
    const data = await response.json();
    if (data.msg && data.msg.split("got name: ")?.[1] === name)
        res.json({ "result": "ok" });
    else
        res.json({ "result": "fail" });
});

// Part 3: POST /action  ("joke" / "cat fact", otherwise 400 "body is malformed")

app.post("/action", async (req, res) => {    
    const action = req?.body?.action;
    if (action === "joke"){
        const response = await fetch("https://v2.jokeapi.dev/joke/Any?type=single&safe-mode");
        const data = await response.json();
        res.json({ "joke": data.joke.toUpperCase() });
    }
    else if (action === "cat fact"){
        const response = await fetch("https://api.thecatapi.com/v1/images/search?limit=11", { headers: { "x-api-key": process.env.CAT_API_KEY } });
        const data = await response.json();
        res.json({ "length":  data.length });
    }
    else
        res.status(400).json({ "msg": "body is malformed" });
});