# Part 1 - answers

Read the Express documentation (https://expressjs.com/en/5x/api.html) and answer in your own words.

## 1. What is inside the request object (`req`)?

<!-- write your answer here -->

Properties for the request query string, parameters, body, HTTP headers, and so on.

## 2. What is inside the response object (`res`)?

<!-- write your answer here -->

In Express.js, the res object (short for Response) represents the HTTP response that the server sends back to the client (for example, a browser or Postman).
It contains properties and methods that allow us to control the response.

## 3. What does `app.use()` do?

<!-- write your answer here -->

Mounts the specified middleware function or functions at the specified path: the middleware function is executed when the base of the requested path matches path.