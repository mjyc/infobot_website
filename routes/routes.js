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
    res.redirect('/wall');
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

// email client
router.post('/emails', function(req, res) {
  var db = req.db;
  var id = req.body.queryjob_id;
  db.collection('queryjobs').findOne({_id: new ObjectID(id)}, function(err, document) {
    if (document.timecompleted !== null && document.notification_email) {
      var nodemailer = require('nodemailer');

      // create reusable transporter object using SMTP transport
      var transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
              user: 'dub-e@dub-e.org',
              pass: 'Mzk0%Fn^@s1GvflQy%8*'
          }
      });

      // setup e-mail data with unicode symbols
      var mailOptions = {
          from: 'dub-e <dub-e@dub-e.org>', // sender address
          to: 'davidt93@cs.washington.edu', // list of receivers
          subject: 'DUB-e Response', // Subject line
          text: 'Hello world ✔', // plaintext body
          html: '<b>' + document.response_text +'</b>' // html body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, function(error, info){
          if(error){
              console.log(error);
          }else{
              console.log('Message sent: ' + info.response);
          }
      });
    }
  });
});

// =====================================================================
// Authenticate (First Login)
// =====================================================================

// Local

// Process the login form.
router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/wall',
  failureRedirect: '/',
  failureFlash: true
}));

// Process the signup form.
router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/wall',
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
    successRedirect: '/wall',
    failureRedirect: '/'
  }));


// =====================================================================
// Authorize (Already Logged In / Connecting Other Social Account)
// =====================================================================

// Local

router.post('/connect/local', passport.authenticate('local-signup', {
  successRedirect: '/wall',
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
    successRedirect: '/wall',
    failureRedirect: '/'
  }));


module.exports = router;
