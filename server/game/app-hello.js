'use strict';

const express = require('express');

// Constants
const PORT = 80;

// App
const app = express();

app.get('/', (req, res) => {
  res.send("Hello from Beanstalk!");
});

app.listen(PORT);