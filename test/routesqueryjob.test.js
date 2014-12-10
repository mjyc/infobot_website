// =====================================================================
// Requires
// =====================================================================

var async = require('async');
var colors = require('colors');
var expect = require('expect.js');
var mongo = require('mongoskin');
var superagent = require('superagent');
var loremIpsum = require('lorem-ipsum'); // function
var ObjectID = require('mongodb').ObjectID; // class

// Locals.
var auth = require('../config/auth.js');
var database = require('../config/database.js');

// DB setups.
// Make sure the test database is clean.
var sara_db = mongo.db(database.url, {
  native_parser: true
});
sara_db.collectionNames(function(err, items) {
  expect(items).to.eql([]); // MUST NOT BE USED!
});
// Connect to test db.
var db = mongo.db(database.urlTest, {
  native_parser: true
});


// =====================================================================
// Functions
// =====================================================================

// Utilities

function randomBoolean() {
  return Math.random() < 0.5;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomDate(startDate, endDate) {
  return new Date(randomInt(startDate.getTime(), endDate.getTime()));
}


// Test Routines

function signupUser(agent) {
  return function(done) {
    agent
      .post('http://localhost:8080/signup')
      .send(auth.accountTest)
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.status).to.eql(200);
        return done();
      });
  };
}

function loginUser(agent) {
  return function(done) {
    agent
      .post('http://localhost:8080/login')
      .send(auth.accountTest)
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.status).to.eql(200);
        return done();
      });
  };
}

function removeCollections(agent) {
  return function(done) {
    async.series([

        function(callback) {
          console.log('Dropping "users" collection...');
          db.collection('users').drop(callback);
        },
        function(callback) {
          console.log('Dropping "queryjobs" collection...');
          db.collection('queryjobs').drop(callback);
        }
      ],
      function(err, results) {
        console.log('removeCollections err and results:'.yellow);
        console.log('err =');
        console.log(err);
        console.log('results =');
        console.log(results);

        console.log('Dropping database...');
        db.dropDatabase();
        db.close();
        done();
      });
  };
}


// =====================================================================
// Tests
// =====================================================================

describe('queryjobs routing test', function() {
  var agent = superagent.agent();

  before(signupUser(agent));

  beforeEach(loginUser(agent));

  var id;
  var timeissued = new Date();
  var typed_cmd = loremIpsum();
  var notification_sms = randomBoolean();
  var notification_email = randomBoolean();
  var is_public = randomBoolean();
  var deadline = new Date(new Date().getTime() + 1000 * 60 * 60 * 1 * 1);

  it('post queryjob', function(done) {
    agent
      .post('http://localhost:8080/queryjobs')
      .send({
        timeissued: timeissued,
        typed_cmd: typed_cmd,
        notification_sms: notification_sms,
        notification_email: notification_email,
        is_public: is_public,
        deadline: deadline
      })
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body.length).to.eql(1);
        expect(res.body[0].timeissued).to.eql(timeissued.toISOString());
        expect(res.body[0].typed_cmd).to.eql(typed_cmd);
        expect(res.body[0].notification_sms).to.eql(notification_sms);
        expect(res.body[0].notification_email).to.eql(notification_email);
        expect(res.body[0].is_public).to.eql(is_public);
        expect(res.body[0].deadline).to.eql(deadline.toISOString());
        id = res.body[0]._id;
        return done();
      });
  });

  it('retrieve queryjob', function(done) {
    agent
      .get('http://localhost:8080/queryjobs/' + id)
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body.timeissued).to.eql(timeissued.toISOString());
        expect(res.body.typed_cmd).to.eql(typed_cmd);
        expect(res.body.notification_sms).to.eql(notification_sms);
        expect(res.body.notification_email).to.eql(notification_email);
        expect(res.body.is_public).to.eql(is_public);
        expect(res.body.deadline).to.eql(deadline.toISOString());
        return done();
      });
  });

  it('retrieve queryjob list', function(done) {
    var N = 10;
    var endCb = function(err, res) {
      expect(err).to.eql(null);
    };
    for (var i = N - 1; i >= 0; i--) {
      agent
        .post('http://localhost:8080/queryjobs')
        .send({
          timeissued: new Date(),
          typed_cmd: loremIpsum(),
          notification_sms: randomBoolean(),
          notification_email: randomBoolean(),
          is_public: randomBoolean(),
          deadline: new Date(new Date().getTime() + 1000 * 60 * 60 * 1 * 1)
        })
        .end(endCb);
    }

    agent
      .get('http://localhost:8080/queryjobs/list/all/0/0')
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body.length).to.eql(N + 1);
        return done();
      });
  });

  after(removeCollections(agent));

});
