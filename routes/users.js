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

router.get('/current', function(req, res, next) {
  var result = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.google.email,
  };
  res.send(result);
});

router.get('/:id', function(req, res, next) {
  var db = req.db;
  var queryjobID = new ObjectID(req.params.id);
  db.collection('users').findById(queryjobID, function(err, result) {
    if (err) {
      return next(err);
    }
    result.email = result.google.email;
    // for security
    delete result.local;
    delete result.google;
    res.send(result);
  });
});


// =====================================================================
// Module
// =====================================================================

module.exports = router;
