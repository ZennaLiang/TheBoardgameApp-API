const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const boardgameSchema = new mongoose.Schema({
  bggId: {
    type: String,
    unique: true,
    index: true,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  yearPublished: {
    type: String,
    required: true,
  },
  minPlayers: {
    type: Number,
    required: true,
  },
  maxPlayers: {
    type: Number,
    required: true,
  },
  minPlayTime: {
    type: Number,
    required: true,
  },
  maxPlayTime: {
    type: Number,
    required: true,
  },
  imgThumbnail: {
    type: String,
  },
  avgRating: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Boardgame", boardgameSchema);
