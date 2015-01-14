// adopted from:
// https://github.com/spadin/simple-express-static-server/blob/master/server.js

var express = require('express');
var debug = require('debug')('sara_uw_website');
var app = express();
var bodyParser = require('body-parser');

app.get('/', function (req, res) {
  res.redirect('/maintenance.html');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));

module.exports = app;
