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

// Add comment.
router.post('/addcomment', function(req, res, next) {
  var db = req.db;
  var newComment = {};
  // Add user info.
  newComment.user_id = req.user._id;
  newComment.user_name = req.user.name;
  // Add QueryJon info.
  newComment.queryjob_id = new ObjectID(req.body.queryjobID);
  // Data from req.
  newComment.timecommented = new Date(req.body.timecommented);
  newComment.comment = req.body.comment;

  db.collection('comments').insert(newComment, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });
});

// Get comments.
// Returns comments in decreasing timecommented sorted manner.
router.post('/getcomments', function(req, res, next) {
  var db = req.db;

  var queryjobID = req.body.queryjobID;
  var criteria = {};
  if (queryjobID) {
    criteria.queryjob_id = new ObjectID(queryjobID);
  }

  db.collection('comments').find(criteria).sort({
    'timecommented': 1
  }).toArray(function(err, results) {
    if (err) {
      return next(err);
    }
    res.send(results);
  });
});


module.exports = router;
