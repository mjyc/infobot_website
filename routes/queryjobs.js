// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var router = express.Router();


// =====================================================================
// Routes
// =====================================================================

// GET

// List QueryJobs.
router.post('/listqueryjobs', function(req, res, next) {
  var db = req.db;
  // Parse inputs.
  var limit = parseInt(req.body.limit || '0');
  var startDate = new Date(req.body.startDate);
  var userOnly = req.body.userOnly === 'true';
  // Set query.
  var criteria = {};
  if (startDate) { criteria.timeissued = {'$lt': startDate}; }
  if (userOnly) { criteria.user_id = req.user._id; }

  db.collection('queryjobs').find(criteria).sort({'timeissued': -1})
    .limit(limit).toArray(function(err, results) {
      if (err) { return next(err); }
        res.send(results);
    });
});


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
  newQueryJob.deadline = new Date(req.body.deadline);

  db.collection('queryjobs').insert(newQueryJob, function(err, result) {
    if (err) { return next(err); }
    res.send(result);
  });
});


module.exports = router;
