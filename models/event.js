const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  allDay: {
    type: Boolean,
  },
  owner: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  bgColor: {
    type: String,
    default: "bg-primary",
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  updated: Date,
  // participant: [{ type: ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Event", eventSchema);
