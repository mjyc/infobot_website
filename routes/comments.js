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

  var comment = {};
  comment.timecommented = new Date(req.body.timecommented);
  comment.text = req.body.text;
  comment.queryjob = {
    id: new ObjectID(req.body.qid),
  };
  comment.user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.google.email,
  };

  db.collection('comments').insert(comment, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });
});

// Retrieve.

// retrieve list with queryjob id
router.get('/list/:qid', function(req, res, next) {
  var db = req.db;

  var qid = req.params.qid;
  var criteria = {};
  if (qid) {
    criteria['queryjob.id'] = new ObjectID(qid);
  }

  // returns comments in decreasing timecommented sorted manner
  db.collection('comments').find(criteria).sort({
    'timecommented': 1
  }).toArray(function(err, results) {
    if (err) {
      return next(err);
    }
    res.send(results);
  });
});


// =====================================================================
// Module
// =====================================================================

module.exports = router;
