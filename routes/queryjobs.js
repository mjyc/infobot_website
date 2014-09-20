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
  newQueryJob.notification_sms = JSON.parse(req.body.notification_sms);
  newQueryJob.notification_email = JSON.parse(
    req.body.notification_email || false);
  newQueryJob.is_public = JSON.parse(req.body.is_public || false);
  newQueryJob.deadline = new Date(req.body.deadline);
  newQueryJob.hearts = [];

  db.collection('queryjobs').insert(newQueryJob, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });
});

router.post('/addheart', function(req, res, next) {
  var db = req.db;

  db.collection('queryjobs').findAndModify({
    _id: new ObjectID(req.body.queryjobID)
  }, {}, {
    '$push': {
      hearts: req.user._id
    }
  }, {
    new: true
  }, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });

});

router.post('/removeheart', function(req, res, next) {
  var db = req.db;

  db.collection('queryjobs').findAndModify({
    _id: new ObjectID(req.body.queryjobID)
  }, {}, {
    $pull: {
      hearts: req.user._id
    }
  }, {
    new: true
  }, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });

});

router.post('/checkheart', function(req, res, next) {
  var db = req.db;

  db.collection('queryjobs').findOne({
    _id: new ObjectID(req.body.queryjobID)
  }, function(err, result) {
    if (err) {
      return next(err);
    }
    var sendTrue = false;
    for (var i = result.hearts.length - 1; i >= 0; i--) {
      if (result.hearts[i].toString() === req.user._id.toString()) {
        sendTrue = true;
        break;
      }
    }
    if (sendTrue) {
      res.send(true);
    } else {
      res.send(false);
    }
  });

});

// Get QueryJobs.
// Returns QueryJobs in decreasing timeissued sorted manner. Can provide
// parameters to control types of QueryJobs being returned.
router.post('/getqueryjobs', function(req, res, next) {
  var db = req.db;

  // Parse inputs.
  var queryjobID = req.body.queryjobID; // get one QueryJob with id
  var limit = parseInt(req.body.limit || '0'); // get limit #
  var startDate = req.body.startDate; // get QueryJobs from startDate
  var userOnly = JSON.parse(req.body.userOnly || false); // get user's
  //   QueryJobs
  var publicOnly = JSON.parse(req.body.publicOnly || false); // get
  //   public QueryJobs

  // Set query.
  var criteria = {};
  if (queryjobID) {
    criteria._id = new ObjectID(queryjobID);
  }
  if (startDate) {
    criteria.timeissued = {
      '$lt': new Date(startDate)
    };
  }
  if (userOnly) {
    criteria.user_id = req.user._id;
  }
  if (publicOnly) {
    criteria.is_public = true;
  }

  db.collection('queryjobs').find(criteria).sort({
    'timeissued': -1
  })
    .limit(limit).toArray(function(err, results) {
      if (err) {
        return next(err);
      }
      res.send(results);
    });
});


module.exports = router;
