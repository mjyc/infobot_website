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
var configAuth = require('../config/auth.js');
var configDB = require('../config/database.js');

// DB setups.
// Make sure the test database is clean.
var sara_db = mongo.db(configDB.url, {
  native_parser: true
});
sara_db.collectionNames(function(err, items) {
  expect(items).to.eql([]); // MUST NOT BE USED!
});
// Connect to test db.
var db = mongo.db(configDB.urlTest, {
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
      .send(configAuth.accountTest)
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
      .send(configAuth.accountTest)
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

  it('post queryjob', function(done) {
    var timeissued = new Date().toISOString();
    var typed_cmd = loremIpsum();
    var notification_sms = randomBoolean();
    var notification_email = randomBoolean();
    var is_public = randomBoolean();
    var deadline = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 1 * 1).toISOString(); // 1
      //   hr from now

    agent
      .post('http://localhost:8080/queryjobs/addqueryjob')
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
        expect(res.body[0].timeissued).to.eql(timeissued);
        expect(res.body[0].typed_cmd).to.eql(typed_cmd);
        expect(res.body[0].notification_sms).to.eql(notification_sms);
        expect(res.body[0].notification_email).to.eql(notification_email);
        expect(res.body[0].is_public).to.eql(is_public);
        expect(res.body[0].deadline).to.eql(deadline);
        return done();
      });
  });

  after(removeCollections(agent));

});
