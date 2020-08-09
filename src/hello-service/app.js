const express = require("express");

let port = 80;
let message = "";

if (process.argv[2]) {
  port = process.argv[2];
  message = `Hello world on port ${port}`;
}
else {
  message = `Port not set. Defaulting to port ${port}.`
}

const app = express();

app.get("/", (req, res) => {
  res.send(message);
});

console.log(message);

app.listen(port);