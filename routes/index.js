// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var router = express.Router();
var passport = require('passport');
var ObjectID = require('mongodb').ObjectID;


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
  res.render('home.jade', {
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

// ============================================================================
// Unlink Accounts
// ============================================================================

// Local

router.get('/unlink/local', isServerReady, function(req, res) {
  var user = req.user;
  user.local.email = undefined;
  user.local.password = undefined;
  user.save(function(err) {
    res.redirect('/');
  });
});

// Google

router.get('/unlink/google', isServerReady, function(req, res) {
  var db = req.db;
  var user = req.user;

  db.collection('queryjobs').findAndModify({
    _id: user._id
  }, {}, {
    $unset: {
      'google': ''
    }
  }, { new:true }, function(err, result) {
    console.log('err');
    console.log(err);
    console.log('result');
    console.log(result);
    res.redirect('/');
  });
});


module.exports = router;
