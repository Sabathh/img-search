const express = require('express');
const app = express();

var port = process.env.PORT || 8080;

app.listen(port, function () {
  console.log('Node app is running on port ' + port);
});