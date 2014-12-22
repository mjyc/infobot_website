'use strict';

// =====================================================================
// Requires
// =====================================================================

var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;


// =====================================================================
// Routes
// =====================================================================

// Create.
router.post('/', function(req, res, next) {
  var db = req.db;

  var queryjob = {};
  queryjob.timeissued = new Date(req.body.timeissued);
  queryjob.typed_cmd = req.body.typed_cmd;
  queryjob.notification_sms = JSON.parse(req.body.notification_sms || false);
  queryjob.notification_email = JSON.parse(req.body.notification_email || false);
  queryjob.is_public = JSON.parse(req.body.is_public || false);
  queryjob.deadline = new Date(req.body.deadline);
  queryjob.user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.google.email,
  };

  db.collection('queryjobs').insert(queryjob, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });
});

// Retrieve.

// retrieve list
router.get('/list/:select/:after/:limit', function(req, res, next) {
  var db = req.db;

  // publicOnly: retrieve querjobs which has "true" value for the public field
  // userOnly: retrieve querjobs which are belong to the current user
  // after: retrieve querjobs with their timeissued field larger than "after"
  //        utc time string in miliseconds
  // limit: maximum number of items desired
  //        <= 0 means all items
  var publicOnly = true;
  var userOnly = false;
  switch (req.params.select) {
    case 'all':
      publicOnly = false;
      userOnly = false;
      break;
    case 'cse':
      publicOnly = true;
      userOnly = false;
      break;
    case 'userall':
      publicOnly = false;
      userOnly = true;
      break;
    case 'usercse':
      publicOnly = true;
      userOnly = true;
      break;
    default:
      publicOnly = true;
      userOnly = false;
  }
  var after = JSON.parse(req.params.after);
  var limit = JSON.parse(req.params.limit);
  if (limit <= 0) {
    limit = 0;
  }

  var criteria = {};
  if (after > 0) {
    criteria.timeissued = {
      '$lt': new Date(after)
    };
  }
  if (userOnly) {
    criteria['user.id'] = req.user._id;
  }
  if (publicOnly) {
    criteria.is_public = true;
  }

  db.collection('queryjobs').find(criteria).sort({
    'timeissued': -1
  }).limit(limit).toArray(function(err, results) {
    if (err) {
      return next(err);
    }
    res.send(results);
  });
});

// retrieve single object
router.get('/:id', function(req, res, next) {
  var db = req.db;

  var qid = new ObjectID(req.params.id);
  db.collection('queryjobs').findById(qid, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });
});


// =====================================================================
// Module
// =====================================================================

module.exports = router;
