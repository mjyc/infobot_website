// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongoskin');
var passport = require('passport');
var flash = require('connect-flash');
var session = require('express-session');
var ROSLIB = require('roslib');

// Locals.
var routes = require('./routes/index');
var queryjobs = require('./routes/queryjobs');
var comments = require('./routes/comments');
var configDB = require('./config/database.js');
var sessionDB = require('./config/session.js');
// TODO: create config file for ROS
var urlROS = (process.env.NODE_ENV === 'production' ?
  'ws://dub-e.org:9090' : 'ws://localhost:9090'
);


// =====================================================================
// Setups
// =====================================================================

// ROS setup.
var ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090'
});
ros.connection = false;
ros.on('connection', function() {
  ros.connection = true;
  console.log('Connected to websocket server.');
});
ros.on('error', function(error) {
  ros.connection = false;
  console.log('Error connecting to websocket server: ', error);
});
ros.on('close', function() {
  ros.connection = false;
  console.log('Connection to websocket server closed.');
});

// DB setup.
var dbUrl = (JSON.parse(process.env.TEST || false) ?
  configDB.urlTest : configDB.url);
var db = mongo.db(dbUrl, {
  native_parser: true
}); // connect to db

// Passport setup.
require('./config/passport')(passport, db, process.env.NODE_ENV);


// =====================================================================
// Express
// =====================================================================

var app = express();

// View engine setup.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname,'public','img','favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

app.use(session({
  secret: sessionDB.secret
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in
//   session

// Make our ros, db and MODE accessible to our router.
app.use(function(req, res, next) {
  req.ros = ros;
  req.db = db;
  req.PROD = (process.env.NODE_ENV === 'production');
  next();
});

app.use('/', routes);
app.use('/queryjobs', queryjobs);
app.use('/comments', comments);

// Catch 404 and forward to error handler.
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers

// Development error handler.
// Will print stacktrace.
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// Production error handler.
// No stacktraces leaked to user.
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



module.exports = app;