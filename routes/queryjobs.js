// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var router = express.Router();

var User = require('../models/user');
var QueryJob = require('../models/queryjob');


// =====================================================================
// Routes
// =====================================================================

// POST to adduser.
router.post('/addqueryjob', function(req, res) {

  console.log(req.user._id);
  console.log(req.body);

  var newQueryJob = new QueryJob();
  newQueryJob.user_id = req.user._id;
  newQueryJob.typed_cmd = req.body.typed_cmd;
  newQueryJob.notification_sms = req.body.sms_notification;
  newQueryJob.notification_email = req.body.email_notification;
  console.log(newQueryJob);

  newQueryJob.save(function(err) {
    res.send(
      (err === null) ? {msg: ''} : {msg: err}
    );
  });

  // // if the user is not already logged in:
  // if (!req.user) {
  //   User.findOne({ 'local.email' :  email }, function(err, user) {
  //     // if there are any errors, return the error
  //     if (err)
  //       return done(err);

  //     // check to see if theres already a user with that email
  //     if (user) {
  //       return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
  //     } else {

  //       // create the user
  //       var newUser            = new User();

  //       newUser.local.email    = email;
  //       newUser.local.password = newUser.generateHash(password);

  //       newUser.save(function(err) {
  //         if (err)
  //           return done(err);

  //         return done(null, newUser);
  //       });
  //     }

  //   });

  // var db = req.db;
  // db.collection('queryjob').insert(req.body, function(err, result){
  //     res.send(
  //         (err === null) ? { msg: '' } : { msg: err }
  //     );
  // });
});


module.exports = router;
