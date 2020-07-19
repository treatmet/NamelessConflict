'use strict';

const express = require('express');
var cookieParser = require('cookie-parser');

// Constants
const PORT = 80;
const HOST = '0.0.0.0';
const instance = Math.floor(Math.random() * 1000);
// App
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.static('client'))

app.get('/instance', (req, res) => {
  res.send({instance});
});

app.get('/clear', (req, res) => {
  res.clearCookie('AWSALB');
  res.clearCookie('AWSALBCORS');

  res.send({instance});
});

app.get('/set/:cookie', (req, res) => {
  res.cookie('AWSALB', req.params.cookie);
  res.cookie('AWSALBCORS', req.params.cookie);

  res.send({
    instance,
    previous: req.cookies.AWSALB,
    current: req.params.cookie
  });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT} as instance ${instance}`);