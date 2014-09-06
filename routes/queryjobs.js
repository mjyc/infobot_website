// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var router = express.Router();


// =====================================================================
// Routes
// =====================================================================

// POST to addqueryjob.
router.post('/addqueryjob', function(req, res, next) {
  var db = req.db;
  var newQueryJob = {};
  newQueryJob.user_id = req.body.user_id;
  newQueryJob.timeissued = req.body.timeissued;
  newQueryJob.typed_cmd = req.body.typed_cmd;
  newQueryJob.notification_sms = req.body.sms_notification;
  newQueryJob.notification_email = req.body.email_notification;
  newQueryJob.deadline = req.body.deadline;

  db.collection('queryjobs').insert(req.body, function(err, result) {
      if (err) { return next(err); }
      res.send(result);
  });
});


module.exports = router;
