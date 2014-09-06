// =====================================================================
// Requires
// =====================================================================

var async = require('async');
var colors = require('colors');
var expect = require('expect.js');
var mongo = require('mongoskin');
var superagent = require('superagent');
var loremIpsum=require('lorem-ipsum');  // function
var ObjectID = require('mongodb').ObjectID;  // class

// Locals.
var configTest = require('../config/test.js');

// DB setups.
var db = mongo.db(configTest.dbUrl, {native_parser:true});
// Make sure the test database is clean.
db.collectionNames(function(err, items) {
  console.log('items');
  console.log(items);
  expect(items).to.eql([]);
});


// =====================================================================
// Functions
// =====================================================================

function randomBoolean() { return Math.random() < 0.5; }

function signupUser(agent) {
  return function(done) {
    agent
      .post('http://localhost:8080/signup')
      .send(configTest.account)
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
      .send(configTest.account)
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
    var timeissued = new Date().toISOString();  // ISO is the date
    //   format MongoDB expects
    var typed_cmd = loremIpsum();
    var notification_sms = randomBoolean();
    var notification_email = randomBoolean();
    var deadline = new Date(new Date().getTime() + 60*60000).toISOString();
    //   1 hr from now

    agent
      .post('http://localhost:8080/queryjobs/addqueryjob')
      .send({
        'timeissued': timeissued,
        'typed_cmd': typed_cmd,
        'notification_sms': notification_sms,
        'notification_email': notification_email,
        'deadline': deadline
      })
      .end(function(err, res) {
        expect(err).to.eql(null);
        expect(res.body.length).to.eql(1);
        expect(res.body[0].timeissued).to.eql(timeissued);
        expect(res.body[0].typed_cmd).to.eql(typed_cmd);
        expect(res.body[0].notification_sms).to.eql(notification_sms);
        expect(res.body[0].notification_email).to.eql(notification_email);
        expect(res.body[0].deadline).to.eql(deadline);
        return done();
      });
  });

  after(removeCollections(agent));

});
