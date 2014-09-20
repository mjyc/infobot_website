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
router.post('/addcomment', function(req, res, next) {
  var db = req.db;
  var newComment = {};
  // Add user info.
  newComment.user_id = req.user._id;
  newComment.user_name = req.user.name;
  // Data from req.
  newComment.timeissued = new Date(req.body.timeissued);
  newComment.text = req.body.text;

  db.collection('comments').insert(newComment, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send(result);
  });
});

// // Get QueryJobs.
// // Returns QueryJobs in decreasing timeissued sorted manner. Can provide
// // parameters to control types of QueryJobs being returned.
// router.post('/getqueryjobs', function(req, res, next) {
//   var db = req.db;

//   // Parse inputs.
//   var queryjobID = req.body.queryjobID; // get one QueryJob with id
//   var limit = parseInt(req.body.limit || '0'); // get limit #
//   var startDate = req.body.startDate; // get QueryJobs from startDate
//   var userOnly = JSON.parse(req.body.userOnly || false); // get user's
//   //   QueryJobs
//   var publicOnly = JSON.parse(req.body.publicOnly || false); // get
//   //   public QueryJobs

//   // Set query.
//   var criteria = {};
//   if (queryjobID) {
//     criteria._id = new ObjectID(queryjobID);
//   }
//   if (startDate) {
//     criteria.timeissued = {
//       '$lt': new Date(startDate)
//     };
//   }
//   if (userOnly) {
//     criteria.user_id = req.user._id;
//   }
//   if (publicOnly) {
//     criteria.is_public = true;
//   }

//   db.collection('queryjobs').find(criteria).sort({
//     'timeissued': -1
//   })
//     .limit(limit).toArray(function(err, results) {
//       if (err) {
//         return next(err);
//       }
//       res.send(results);
//     });
// });


module.exports = router;
