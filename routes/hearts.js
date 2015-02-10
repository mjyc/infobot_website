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

  var heart = {};
  heart.queryjob = {
    id: new ObjectID(req.body.qid),
  };
  heart.user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.google.email,
  };

  db.collection('hearts').insert(heart, function(err, result) {
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

  db.collection('hearts').find(criteria)
    .toArray(function(err, results) {
      if (err) {
        return next(err);
      }
      res.send(results);
    });
});

// Delete.
router.delete('/:id', function(req, res, next) {
  var db = req.db;
  var id = new ObjectID(req.params.id);
  db.collection('hearts').removeById(id, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send({
      msg: ''
    });
  });
});


// =====================================================================
// Module
// =====================================================================

module.exports = router;
