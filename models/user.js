// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var Schema   = mongoose.Schema;
var userSchema = Schema({

    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }
    // ,

    // queryjob_hitory : [{
    //     queryjob_id : {type: Schema.ObjectId, required: true}
    // }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
