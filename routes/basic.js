'use strict';

// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var router = express.Router();
var passport = require('passport');
var ObjectID = require('mongodb').ObjectID;


// =====================================================================
// Routes
// =====================================================================

router.get('/', function(req, res) {
  if (req.isAuthenticated()) {
    res.render('index');
  } else {
    res.render('signup');
  }
});

router.get('/partials/:name', function(req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
});

// Logout.
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


// =====================================================================
// Authenticate (First Login)
// =====================================================================

// Local

// Process the login form.
router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/',
  failureFlash: true
}));

// Process the signup form.
router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/',
  failureFlash: true
}));

// Google

// Send to google to do the authentication.
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  hd: 'cs.washington.edu'
}));

// The callback after google has authenticated the user.
router.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/'
  }));


// =====================================================================
// Authorize (Already Logged In / Connecting Other Social Account)
// =====================================================================

// Local

router.post('/connect/local', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/',
  failureFlash: true
}));

// Google

// Send to google to do the authentication.
router.get('/connect/google', passport.authorize('google', {
  scope: ['profile', 'email'],
  hd: 'cs.washington.edu'
}));

// The callback after google has authorized the user.
router.get('/connect/google/callback',
  passport.authorize('google', {
    successRedirect: '/',
    failureRedirect: '/'
  }));


// =====================================================================
// Module
// =====================================================================

module.exports = router;
