// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var router = express.Router();
var passport = require('passport');


// =====================================================================
// Functions
// =====================================================================

// Route middleware to ensure (1) the server is connected to ROS and
// (2) user is logged in.
function isServerReady(req, res, next) {
  if (!req.ros.connection) {
    return next(new Error('Cannot connect to ROS.'));
  } else if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/');
}


// =====================================================================
// Routes
// =====================================================================

// Login.
router.get('/', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/home');
  } else {
    res.render('login.jade', {
      prod: req.PROD
    });
  }
});

// Home.
router.get('/home', isServerReady, function(req, res) {
  res.render('main.jade', {
    user: req.user,
    isHome: true,
    prod: req.PROD
  });
});

// Home.
router.get('/wall', isServerReady, function(req, res) {
  res.render('wall.jade', {
    user: req.user,
    isHome: false,
    prod: req.PROD
  });
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
  successRedirect: '/home',
  failureRedirect: '/',
  failureFlash: true
}));

// Process the signup form.
router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/home',
  failureRedirect: '/',
  failureFlash: true
}));

// Google

// Send to google to do the authentication.
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// The callback after google has authenticated the user.
router.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/home',
    failureRedirect: '/'
  }));


// =====================================================================
// Authorize (Already Logged In / Connecting Other Social Account)
// =====================================================================

// Local

router.post('/connect/local', passport.authenticate('local-signup', {
  successRedirect: '/home',
  failureRedirect: '/',
  failureFlash: true
}));

// Google

// Send to google to do the authentication.
router.get('/connect/google', passport.authorize('google', {
  scope: ['profile', 'email']
}));

// The callback after google has authorized the user.
router.get('/connect/google/callback',
  passport.authorize('google', {
    successRedirect: '/home',
    failureRedirect: '/'
  }));


module.exports = router;
