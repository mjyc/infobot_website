// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var User = require('./user');
var queryjobSchema = mongoose.Schema({

    user_id : {type:mongoose.Schema.ObjectId, required: true},
    timeissued : {type: Date, default: Date.now},
    timecompleted : Date,
    notification_sms : Boolean,
    notification_email : Boolean,
    typed_cmd : {type: String, trim: true},
    ros_cmd: String

});

// create the model for users and expose it to our app
module.exports = mongoose.model('QueryJob', queryjobSchema);
