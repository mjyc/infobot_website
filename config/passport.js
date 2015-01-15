'use strict';

/**
 * Passport configurations
 */

// ===================================================================
// Requires
// ===================================================================

var bcrypt   = require('bcrypt-nodejs');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var ObjectID = require('mongodb').ObjectID;
var config = require('config');


// ===================================================================
// Functions
// ===================================================================

// generating a hash
var generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
var validPassword = function(password, localPassword) {
    return bcrypt.compareSync(password, localPassword);
};


// ===================================================================
// Module
// ===================================================================

module.exports = function(passport, db, mode) {

  // Configuration.
  var googleAuth = config.get('googleAuth');

  // ===================================================================
  // Passport Session Setup
  // ===================================================================
  // Required for persistent login sessions.
  // Passport needs ability to serialize and unserialize users out of
  // session.

  // Used to serialize the user for the session.
  passport.serializeUser(function(user, done) {
    done(null, user._id.toHexString());
  });

  // Used to deserialize the user.
  passport.deserializeUser(function(id, done) {
    var _id = new ObjectID(id);
    db.collection('users').findOne({_id: _id}, function(err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // Local
  // =========================================================================

  // Login.
  passport.use('local-login', new LocalStrategy({
      // By default, local strategy uses username and password, we will
      // override with email.
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass in the req from our
      // route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
      if (email) {
        email = email.toLowerCase();  // Use lower-case e-mails to avoid
        //   case-sensitive e-mail matching
      }

      // Asynchronous.
      process.nextTick(function() {
        db.collection('users').findOne({'local.email': email},
          function(err, user) {
            // If there are any errors, return the error.
            if (err) {
              return done(err);
            }

            // If no user is found, return the message.
            if (!user) {
              return done(
                null, false, req.flash('loginMessage', 'No user found.'));
            }

            if (!validPassword(password, user.local.password)) {
              return done(
                null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
            } else { // all is well, return user
              return done(null, user);
          }
        });
      });

    }));

  // Singup.
  passport.use('local-signup', new LocalStrategy({
      // By default, local strategy uses username and password, we will
      // override with email.
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true  // allows us to pass in the req from our
      //   route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
      if (email) {
        email = email.toLowerCase();  // Use lower-case e-mails to avoid
        //   case-sensitive e-mail matching
      }

      // Asynchronous.
      process.nextTick(function() {
        // If the user is not already logged in.
        if (!req.user) {
          db.collection('users').findOne({'local.email': email},
            function(err, user) {
              // If there are any errors, return the error.
              if (err) {
                return done(err);
              }

              // Check to see if theres already a user with that email.
              if (user) {
                return done(
                  null, false,
                  req.flash('signupMessage', 'That email is already taken.'));
              } else {

                // create the user
                var newUser = {
                  local: {},
                  google: {}
                };

                newUser.name = email;
                newUser.local.email = email;
                newUser.local.password = generateHash(password);

                db.collection('users').insert(newUser, function(err) {
                  if (err) {
                    return done(err);
                  }

                  return done(null, newUser);
                });
              }
            });
        // If the user is logged in but has no local account...
        } else if (!req.user.local.email) {
          // ...presumably they're trying to connect a local account.
          var user = req.user;
          user.local.email = email;
          user.local.password = generateHash(password);
          db.collection('users').insert(user, function(err) {
            if (err) {
              return done(err);
            }

            return done(null, user);
          });
        } else {
          // User is logged in and already has a local account.
          // Ignore signup. (You should log out before trying to create
          // a new account, user!)
          return done(null, req.user);
        }

      });

    }));

  // ===================================================================
  // Google
  // ===================================================================

  passport.use(new GoogleStrategy({

      clientID: googleAuth.clientID,
      clientSecret: googleAuth.clientSecret,
      callbackURL: googleAuth.callbackURL,
      passReqToCallback: true  // allows us to pass in the req from our
      //   route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

      // Asynchronous.
      process.nextTick(function() {

        // Check if the user is already logged in.
        if (!req.user) {

          db.collection('users').findOne({'google.id': profile.id},
            function(err, user) {
              if (err) {
                return done(err);
              }

              if (user) {

                // If there is a user id already but no token (user was
                // linked at one point and then removed).
                if (!user.google.token) {
                  user.google.token = token;
                  user.google.name = profile.displayName;
                  user.google.email = (
                    profile.emails[0].value || ''
                  ).toLowerCase();  // pull the first email

                  db.collection('users').insert(user, function(err) {
                    if (err) {
                      return done(err);
                    }

                    return done(null, user);
                  });
                }

                return done(null, user);
              } else {
                var newUser = {
                  local: {},
                  google: {}
                };

                newUser.name = profile.displayName;
                newUser.google.id = profile.id;
                newUser.google.token = token;
                newUser.google.name = profile.displayName;
                newUser.google.picture = profile._json['picture'];
                newUser.google.email = (
                  profile.emails[0].value || ''
                ).toLowerCase();  // pull the first email

                db.collection('users').insert(newUser, function(err) {
                  if (err) {
                    return done(err);
                  }

                  return done(null, newUser);
                });
              }
            });
        } else {
          // User already exists and is logged in, we have to link
          // accounts.
          var user = req.user;  // pull the user out of the session

          user.google.id = profile.id;
          user.google.token = token;
          user.google.name = profile.displayName;
          user.google.email = (
            profile.emails[0].value || ''
          ).toLowerCase();  // pull the first email

          db.collection('users').insert(user, function(err) {
            if (err) {
              return done(err);
            }

            return done(null, user);
          });

        }

      });

    }));

};
