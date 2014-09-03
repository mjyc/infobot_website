// =====================================================================
// Requires.
// =====================================================================

var express = require('express');
var router = express.Router();
var passport = require('passport');


// =====================================================================
// Helper Function
// =====================================================================

// Route middleware to ensure user is logged in.
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}


// =====================================================================
// Routes
// =====================================================================

// Login.
router.get('/', function(req, res) {
  if (req.isAuthenticated())
  res.redirect('/home')
  else
  res.render('login.jade', {
    isAuthenticated: req.isAuthenticated()
  });
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


// =====================================================================
// Unlink Accounts
// =====================================================================

// Google

router.get('/unlink/google', isLoggedIn, function(req, res) {
  var user = req.user;
  user.google.token = undefined;
  user.save(function(err) {
    res.redirect('/home');
  });
});


module.exports = router;
