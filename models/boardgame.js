const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const boardgameSchema = new mongoose.Schema({
    objectId:{
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    yearPublished:{
        type:String,
        required: true
    },
    minPlayers: {
        type: String,
        required:true
    },
    maxPlayers: {
        type:String,
        required:true
    },
    minPlayTime: {
        type:String,
        required:true
    },
    maxPlayTime: {
        type:String,
        required:true
    },
    imgThumbnail: {
        type: String,
        required: true
    },
    avgRating: {
        type: String,
        required:true
    }
});

module.exports = mongoose.model("Boardgame", boardgameSchema);
