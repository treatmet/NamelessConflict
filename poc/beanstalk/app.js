const express = require('express');
var cookieParser = require('cookie-parser');
var cookieName = "SessionCookie";

// Constants
var port = process.env.PORT || 3000;
const instance = Math.floor(Math.random() * 1000);

// App
const app = express();
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.send({instance});
});

app.get('/:id', (req, res) => {
  res.send({instance});
});

app.listen(port);
console.log(`Running on port ${port} as instance ${instance}`);
