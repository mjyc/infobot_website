// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;


// =====================================================================
// Routes
// =====================================================================


// POST

// Add QueryJob.
router.post('/addqueryjob', function(req, res, next) {
  var db = req.db;
  var newQueryJob = {};
  // Add user info.
  newQueryJob.user_id = req.user._id;
  newQueryJob.user_name = req.user.name;
  // Data from req.
  newQueryJob.timeissued = new Date(req.body.timeissued);
  newQueryJob.typed_cmd = req.body.typed_cmd;
  newQueryJob.notification_sms = req.body.notification_sms;
  newQueryJob.notification_email = req.body.notification_email;
  newQueryJob.is_public = req.body.is_public;
  newQueryJob.deadline = new Date(req.body.deadline);

  db.collection('queryjobs').insert(newQueryJob, function(err, result) {
    if (err) { return next(err); }
    res.send(result);
  });
});

// Get QueryJobs.
// Returns QueryJobs in decreasing timeissued sorted manner. Can provide
// parameters to control types of QueryJobs being returned.
router.post('/getqueryjobs', function(req, res, next) {
  var db = req.db;

  // Parse inputs.
  var queryjobID = req.body.queryjobID;   // get one QueryJob with id
  var limit = parseInt(req.body.limit || '0');  // get limit #
  var startDate = req.body.startDate;  // get QueryJobs from startDate
  var userOnly = req.body.userOnly === 'true';  // get user's QueryJobs

  // Set query.
  var criteria = {};
  if (queryjobID) { criteria._id = new ObjectID(queryjobID); }
  if (startDate) { criteria.timeissued = {'$lt': new Date(startDate)}; }
  if (userOnly) { criteria.user_id = req.user._id; }

  db.collection('queryjobs').find(criteria).sort({'timeissued': -1})
    .limit(limit).toArray(function(err, results) {
      if (err) { return next(err); }
        res.send(results);
    });
});


module.exports = router;
