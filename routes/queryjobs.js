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
router.get('/list/:select/:limit/:after?', function(req, res, next) {
  var db = req.db;

  // publicOnly: retrieve querjobs which has "true" value for the public field
  // userOnly: retrieve querjobs which are belong to the current user
  // limit: maximum number of items desired
  // after: retrieve querjobs with their timeissued field larger than "after"
  //        utc time string in miliseconds
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
      userOnly = false;
      break;
    case 'usercse':
      publicOnly = false;
      userOnly = false;
      break;
    default:
      publicOnly = true;
      userOnly = false;
  }
  var limit = 0;
  if (req.params.limit > 0) {
    limit = req.params.limit;
  }

  var criteria = {};
  // if (after) {
  //   criteria.timeissued = {
  //     '$lt': new Date(after)
  //   };
  // }
  if (userOnly) {
    criteria.user_id = req.user._id;
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
  var queryjobID = new ObjectID(req.params.id);
  db.collection('queryjobs').findById(queryjobID, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });
});

// router.post('/addheart', function(req, res, next) {
//   var db = req.db;

//   db.collection('queryjobs').findAndModify({
//     _id: new ObjectID(req.body.queryjobID)
//   }, {}, {
//     '$push': {
//       hearts: req.user._id
//     }
//   }, {
//     new: true
//   }, function(err, result) {
//     if (err) {
//       return next(err);
//     }
//     res.send(result);
//   });

// });

// router.post('/removeheart', function(req, res, next) {
//   var db = req.db;

//   db.collection('queryjobs').findAndModify({
//     _id: new ObjectID(req.body.queryjobID)
//   }, {}, {
//     $pull: {
//       hearts: req.user._id
//     }
//   }, {
//     new: true
//   }, function(err, result) {
//     if (err) {
//       return next(err);
//     }
//     res.send(result);
//   });

// });

// router.post('/checkheart', function(req, res, next) {
//   var db = req.db;

//   db.collection('queryjobs').findOne({
//     _id: new ObjectID(req.body.queryjobID)
//   }, function(err, result) {
//     if (err) {
//       return next(err);
//     }
//     var sendTrue = false;
//     for (var i = result.hearts.length - 1; i >= 0; i--) {
//       if (result.hearts[i].toString() === req.user._id.toString()) {
//         sendTrue = true;
//         break;
//       }
//     }
//     if (sendTrue) {
//       res.send(true);
//     } else {
//       res.send(false);
//     }
//   });

// });


// =====================================================================
// Module
// =====================================================================

module.exports = router;
