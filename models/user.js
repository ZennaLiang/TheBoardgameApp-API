const mongoose = require("mongoose");
const uuidv1 = require("uuid/v1");//for random string and time stamp
const crypto = require("crypto"); //for hash password
const { ObjectId } = mongoose.Schema; // object with name and ids

const Post = require("./post");
const Boardgame = require("./boardgame");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    hashed_password: {
        type: String,
        required: true
    },
    salt: String,
    createdDate: {
        type: Date,
        default: Date.now
    },
    updated: Date,
    photo: {
        data: Buffer,
        contentType: String
    },
    about: {
        type: String,
        trim: true
    },
    following: [{ type: ObjectId, ref: "User" }],
    followers: [{ type: ObjectId, ref: "User" }],
    resetPasswordLink: {
        data: String,
        default: ""
    },
    role: {
        type: String,
        default: "subscriber"
    },
    bbgUsername: {
        type: String
    },
    boardgames:[{
        bbgId: { type: String, ref: "Boardgame", unique: true },
        notes: String,
        forTrade: Boolean,
        forSale: Boolean,
        wantFromTrade: Boolean,
        wantFromBuy: Boolean,
        wantToPlay:Boolean,
        numOfPlay: Number
    }]
});

/**************************************************************************
**************************************************************************
 * Virtual fields are additional fields for a given model.
 * Their values can be set manually or automatically with defined functionality.
 * Keep in mind: virtual properties (password) don’t get persisted in the database.
 * They only exist logically and are not written to the document’s collection.
**************************************************************************
**************************************************************************/

// virtual field for temp password
userSchema
    .virtual("password")
    .set(function (password) {
        // create temporary variable called _password
        this._password = password;
        // generate a timestamp
        this.salt = uuidv1();
        // encrypt password
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function () {
        return this._password;
    });

    userSchema.virtual('boardgameColl', {
        ref:"Boardgame",
        localField: 'boardgames.bbgId',
        foreignField: 'bbgId'
    })
/**************************************************************************
**************************************************************************
***************************       methods       **************************
**************************************************************************
**************************************************************************/

userSchema.methods = {
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },
    // encrypt the password and check if password match
    encryptPassword: function (password) {
        if (!password) return "";
        try {
            return crypto
                .createHmac("sha1", this.salt)
                .update(password)
                .digest("hex");
        } catch (err) {
            return "";
        }
    }
};

userSchema.pre("remove", function(next) {
    Post.remove({ postedBy: this._id }).exec();
    next();
});

module.exports = mongoose.model("User", userSchema);
