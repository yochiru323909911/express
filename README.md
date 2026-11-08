# תרגיל 10 - מבוא ל-Express.js 🚂

תרגיל כיתה ראשון עם Express: בונות שרת עם endpoint ראשון, משתמשות ב-Route Params, שולחות בקשה פנימית לשרת של עצמכן עם `fetch`, ובונות endpoint מסוג `POST` שמחליט מה לעשות לפי ה-body - מביא בדיחה מ-API חיצוני או תמונות חתולים מ-API שדורש מפתח.

**מה בונים:** שרת Express בקובץ `index.js` עם 4 נתיבים: `GET /greet`, `GET /greet/:name`, `GET /test`, `POST /action`.

## איך מתחילים

1. לוחצות למעלה על **Use this template** ← **Create a new repository**, ויוצרות ריפו משלכן.
2. עושות `git clone` לריפו החדש ופותחות אותו ב-VS Code.
3. בטרמינל מריצות פעם אחת: `npm install` (צריך Node בגרסה 20 ומעלה. בודקות עם `node -v`).
4. כותבות את השרת ב-`index.js`, ואת התשובות לשאלות של חלק 1 ב-`answers.md`.
5. מריצות את השרת: `node index.js` (או `npm start`). השרת מאזין בפורט `3000`. עוצרות אותו עם `Ctrl + C`.

> בתבנית כבר עשינו בשבילכן את שלבי ההכנה של חלק 1: יש `package.json` (כמו אחרי `npm init`), יש `.gitignore` שמתעלם מ-`node_modules` ומ-`.env`, ו-`express` כבר מופיע ב-`dependencies` - ה-`npm install` מתקין אותו. בריפו חדש משלכן עושים את זה עם `npm init -y` ו-`npm install express`.

## איך בודקים

```bash
npm test
```

- בהתחלה כל הטסטים אדומים (✘). כל טסט מתחיל במספר החלק שהוא בודק (`Part 1`, `Part 2`, `Part 3`).
- הטסטים מריצים את `index.js` בדיוק כמו `node index.js`, שולחים בקשות אמיתיות לשרת ובודקים את התשובה, את ה-status ואת מה שהשרת הדפיס בטרמינל.
- לא צריך להפעיל את השרת לפני `npm test` - הטסטים מפעילים אותו לבד (על פורט פנוי, גם אם פורט 3000 תפוס).
- **בטסטים אין אינטרנט:** כשהשרת שלכן עושה `fetch` ל-API של הבדיחות או של החתולים, הטסטים מחזירים לו תשובה מזויפת באותו מבנה כמו ה-API האמיתי, ובודקים לאיזו כתובת פניתן ואילו headers שלחתן. ככה הטסטים עובדים גם בלי מפתח API אמיתי.
- מתחת לכל טסט שנכשל כתוב מה לא עבד.
- כשכל הטסטים ירוקים (✔) מופיעה ההודעה **✅ המשימה אושרה** ואפשר לעבור למשימה הבאה.
- טסט של חלק אחד בלבד: `node --test test/part2.test.js`
- אחרי `git push` הטסטים רצים גם ב-GitHub (לשונית Actions). וי ירוק ליד ה-commit = המשימה אושרה.

> אל תשנו את הקבצים בתיקייה `test/`.

---

## חלק 1: Basic Setup & First Endpoint

### שלבים
1. יוצרות ריפו חדש (Use this template).
2. הקובץ הראשי הוא `index.js`.
3. `package.json` - נוצר עם `npm init` (כבר קיים בתבנית).
4. `.gitignore` ל-Node.js - מתעלם מ-`node_modules` (כבר קיים בתבנית).
5. מתקינות Express עם `npm install express` (כבר מופיע ב-`package.json`, רק מריצות `npm install`).
6. קוראות את [התיעוד של Express](https://expressjs.com/en/5x/api.html) ועונות בקובץ `answers.md`:
   - מה יש בתוך אובייקט ה-request (`req`)?
   - מה יש בתוך אובייקט ה-response (`res`)?
   - מה עושה `app.use()`?
7. יוצרות endpoint מסוג GET:
   - **Route:** `GET /greet`
   - **Response:** JSON עם `{ "msg": "hi from get endpoint <TIMESTAMP>" }`
8. בודקות את ה-endpoint עם `curl`.

**Example Output:**
```json
{ "msg": "hi from get endpoint 2025-07-07T12:00:00.000Z" }
```

רמז: את ה-TIMESTAMP יוצרות עם `new Date().toISOString()` - **בתוך** ה-handler, כדי שבכל בקשה יהיה זמן חדש. שולחות JSON עם `res.json(...)`.

```bash
curl localhost:3000/greet
```

---

## חלק 2: Route Params & Internal Requests

קוראות על [Route Parameters](https://expressjs.com/en/guide/routing.html#route-parameters) בתיעוד של Express.

### `GET /greet/:name`
- **Server Log** (בטרמינל של השרת, עם `console.log`): `i got name: <NAME>`
- **Response:** `{ "msg": "got name: <NAME>" }`

**Example Output for** `curl localhost:3000/greet/Alice`
```json
{ "msg": "got name: Alice" }
```

**Example Server Log:**
```
i got name: Alice
```

### `GET /test`
- שולח בקשה **פנימית** ל-`GET /greet/:name` (בוחרות שם כלשהו, למשל `"Bob"`).
- משתמש ב-`fetch` כדי לבצע את הבקשה: `fetch("http://localhost:3000/greet/Bob")`.
- בודק שב-JSON שחזר יש מפתח `"msg"` ושהשם שבתוכו הוא השם ששלחתן.
- אם הכול תקין - עונה `{ "result": "ok" }`, אחרת `{ "result": "fail" }`.

**Example Output for** `curl localhost:3000/test`
```json
{ "result": "ok" }
```

רמז: ה-handler צריך להיות `async` כדי שאפשר יהיה לעשות `await fetch(...)` ואז `await response.json()`.

---

## חלק 3: Action-Based POST Endpoint

### `POST /action`
- **Body:** JSON עם `{ "action": <actionType> }`
- ערכים תקינים ל-`actionType`:
  - `"joke"`
  - `"cat fact"`

כדי לקרוא JSON מה-body צריך להוסיף למעלה `app.use(express.json())` - ואז ה-body נמצא ב-`req.body`.

### Body לא תקין
אם אין body, יש בו מפתחות לא נכונים, או שסוג ה-action לא תקין:
- עונות עם status `400 Bad Request` - `res.status(400)`
- **Response:** `{ "msg": "body is malformed" }`

> שימו לב: כשנשלחת בקשה בלי body בכלל, ב-Express 5 הערך של `req.body` הוא `undefined`. אם תכתבו ישר `req.body.action` - השרת יקרוס. בודקות קודם שה-body קיים.

### `action = "joke"` 🃏
- שולחות בקשת GET עם `fetch` ל-**JokeAPI**: <https://v2.jokeapi.dev/>
- מחזירות את הבדיחה למשתמשת, **באותיות גדולות** (`.toUpperCase()`).

**איך עובדים עם JokeAPI:**
- כתובת בסיס: `https://v2.jokeapi.dev/joke/<Category>` - הקטגוריה יכולה להיות `Any`, `Programming`, `Misc`, `Pun`, `Spooky`, `Christmas` (או כמה ביחד, למשל `Programming,Pun`).
- הכי פשוט לבקש בדיחה בשורה אחת עם `?type=single`, ולהוסיף `safe-mode` כדי לקבל רק בדיחות נקיות:
  ```
  https://v2.jokeapi.dev/joke/Any?type=single&safe-mode
  ```
- לא צריך מפתח API (יש מגבלה של 120 בקשות בדקה).
- התשובה נראית כך - הבדיחה נמצאת במפתח `joke`:
  ```json
  {
    "error": false,
    "category": "Programming",
    "type": "single",
    "joke": "I've got a really good UDP joke to tell you but I don't know if you'll get it.",
    "flags": { "nsfw": false, "religious": false, "political": false, "racist": false, "sexist": false, "explicit": false },
    "safe": true,
    "id": 0,
    "lang": "en"
  }
  ```
- בלי `?type=single` ה-API יכול להחזיר גם בדיחה בשני חלקים: `"type": "twopart"` עם המפתחות `setup` ו-`delivery` (בלי `joke`). אם בחרתן לא להגביל ל-`single` - מחזירות את שני החלקים יחד.
- כדאי לפתוח את <https://v2.jokeapi.dev/> - יש שם טופס שבונה את הכתובת בשבילכן ומראה תשובה לדוגמה.

**Example Output:**
```json
{ "joke": "WHY DID THE CHICKEN CROSS THE ROAD? TO GET TO THE OTHER SIDE!" }
```

### `action = "cat fact"` 🐱
- שולחות בקשת GET ל-**The Cat API** כדי לקבל **11 תמונות**:
  ```
  https://api.thecatapi.com/v1/images/search?limit=11
  ```
- בשביל יותר מ-10 תמונות צריך מפתח API: נרשמות בחינם ב-<https://thecatapi.com/> ומקבלות מפתח במייל. התיעוד: <https://developers.thecatapi.com/>.
- את המפתח שולחות ב-header: `"x-api-key": "<your_api_key>"`
  ```js
  fetch(url, { headers: { "x-api-key": CAT_API_KEY } })
  ```
- מחזירות למשתמשת את האורך (`length`) של התשובה של ה-API (מערך התמונות).

**Example Output:**
```json
{ "length": "11" }
```

**איפה שומרים את המפתח?** לא מעלות מפתחות ל-GitHub. יוצרות קובץ `.env` בתיקייה הראשית (הוא כבר ב-`.gitignore`):
```
CAT_API_KEY=live_xxxxxxxxxxxxxxxx
```
קוראות אותו בקוד עם `process.env.CAT_API_KEY`, ומריצות את השרת כך:
```bash
node --env-file=.env index.js
```
(בטסטים לא צריך מפתח אמיתי - הם מכניסים ל-`process.env.CAT_API_KEY` ערך מזויף.)

### בודקות את כל התרחישים עם curl

```bash
curl -X POST localhost:3000/action -H "Content-Type: application/json" -d '{"action":"joke"}'
curl -X POST localhost:3000/action -H "Content-Type: application/json" -d '{"action":"cat fact"}'
curl -X POST localhost:3000/action -H "Content-Type: application/json" -d '{"action":"dance"}'
curl -X POST localhost:3000/action -H "Content-Type: application/json" -d '{"type":"joke"}'
curl -X POST localhost:3000/action
```

> ב-Windows PowerShell הגרשיים של `-d` מתנהגים אחרת. משתמשות ב-`curl.exe` ועוטפות ככה: `-d '{\"action\":\"joke\"}'`, או בודקות עם Postman / Thunder Client.

---

## בדיקה עצמית
- [ ] `curl localhost:3000/greet` ← `{ "msg": "hi from get endpoint ..." }` עם הזמן הנוכחי, ובכל בקשה זמן חדש.
- [ ] `curl localhost:3000/greet/Alice` ← `{ "msg": "got name: Alice" }`, ובטרמינל של השרת מודפס `i got name: Alice`.
- [ ] `curl localhost:3000/test` ← `{ "result": "ok" }`.
- [ ] `POST /action` עם `{"action":"joke"}` ← בדיחה באותיות גדולות.
- [ ] `POST /action` עם `{"action":"cat fact"}` ← `{ "length": "11" }` (עם מפתח API).
- [ ] body חסר / מפתח לא נכון / action לא קיים ← status `400` ו-`{ "msg": "body is malformed" }`, והשרת לא קורס.
- [ ] ב-`answers.md` יש תשובה לכל אחת משלוש השאלות.
- [ ] `npm test` ← **✅ המשימה אושרה**
