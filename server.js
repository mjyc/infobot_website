'use strict';

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
var expressSession = require('express-session');

// Locals.
var config = require('config');
var routesBasic = require('./routes/basic');
var routesUsers = require('./routes/users');
var routesQueryjobs = require('./routes/queryjobs');
var routesComments = require('./routes/comments');


// =====================================================================
// Configuration
// =====================================================================

// Config file.
if (process.env.NODE_ENV === 'production') {
  config = config.get('production');
} else if (JSON.parse(process.env.TEST || false)) {
  config = config.get('test');
} else {
  config = config.get('development');
}

// DB.
var dbUrl = config.dbConfig.url;
var db = mongo.db(dbUrl, {
  native_parser: true
}); // connect to db

// Passport.
require('./config/passport')(passport, db);


// =====================================================================
// Express Configuration
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

app.use(expressSession({
  secret: config.sessionSecret
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in
//   session

// Make our db and MODE accessible to our router.
app.use(function(req, res, next) {
  req.db = db;
  req.PROD = (process.env.NODE_ENV === 'production');
  next();
});

// For Protecting APIs.
function IsAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
}
app.all('/users/*', IsAuthenticated);
app.all('/queryjobs/*', IsAuthenticated);
app.all('/comments/*', IsAuthenticated);

app.use('/', routesBasic);
app.use('/users', routesUsers);
app.use('/queryjobs', routesQueryjobs);
app.use('/comments', routesComments);

// For angular.
app.get('*', function(req, res) {
  res.redirect('/');
});

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


// =====================================================================
// Module
// =====================================================================

module.exports = app;
