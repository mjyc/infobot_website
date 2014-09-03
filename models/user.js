// Load the things we need.
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// Define the schema for our user model.
var userSchema = mongoose.Schema({

  google   : {
    id     : String,
    token  : String,
    email  : String,
    name   : String
  },

  queryjob_hitory : [{
    queryjob_id : {type: mongoose.Schema.ObjectId, required: true}
  }]
});

// Create the model for users and expose it to our app.
module.exports = mongoose.model('User', userSchema);
