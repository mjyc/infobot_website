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

  queryjob.timeissued = JSON.parse(req.body.timeissued);
  queryjob.typed_cmd = req.body.typed_cmd;
  queryjob.notification_sms = JSON.parse(req.body.notification_sms || false);
  queryjob.notification_email = JSON.parse(req.body.notification_email || false);
  queryjob.is_public = JSON.parse(req.body.is_public || false);
  queryjob.deadline = JSON.parse(req.body.deadline);
  queryjob.user_id = req.user._id;

  db.collection('queryjobs').insert(queryjob, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });
});

// Retrieve.
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

router.get('/list', function(req, res, next) {
  var db = req.db;

  // limit: maximum number of items desired
  // after: retrieve querjobs with their timeissued field larger than "after"
  // useronly: retrieve querjobs which are belong to the current user
  // publiconly: retrieve querjobs which has "true" value for the public field
  var limit = JSON.parse(req.body.limit || '0');
  var after = req.body.after;
  var useronly = JSON.parse(req.body.userid || false);
  var publiconly = JSON.parse(req.body.public || false);

  var criteria = {};
  if (after) {
    criteria.timeissued = {
      '$lt': after
    };
  }
  if (useronly) {
    criteria.user_id = req.user._id;
  }
  if (publiconly) {
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
