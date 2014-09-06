// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var router = express.Router();
var passport = require('passport');


// =====================================================================
// Functions
// =====================================================================

// Route middleware to ensure user is logged in.
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
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
      isAuthenticated: req.isAuthenticated()
    });
  }
});

// Home.
router.get('/home', isLoggedIn, function(req, res) {
  res.render('home.jade', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user
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
  successRedirect : '/home',
  failureRedirect : '/',
  failureFlash : true
}));

// Process the signup form.
router.post('/signup', passport.authenticate('local-signup', {
  successRedirect : '/home',
  failureRedirect : '/',
  failureFlash : true
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
  successRedirect : '/home',
  failureRedirect : '/',
  failureFlash : true
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
