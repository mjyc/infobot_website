// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var User = require('./user');
var queryjobSchema = mongoose.Schema({

    user_id : {type:mongoose.Schema.ObjectId, required: true},

	typed_cmd : {type: String, trim: true, required: true},
    sms_notification : {type: Boolean, required: true},
    email_notification : {type: Boolean, required: true}

});

// create the model for users and expose it to our app
module.exports = mongoose.model('QueryJob', queryjobSchema);
