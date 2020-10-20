const formidable = require("formidable"); // handle files
const fs = require("fs"); // file system
const _ = require("lodash");

const Event = require("../models/event");
const user = require("../models/user");

exports.findEventById = (req, res, next, id) => {
  Event.findById(id)
    .populate("owner", "_id name")
    .exec((err, event) => {
      if (err || !event) {
        return res.status(400).json({
          error: err,
        });
      }
      req.event = event;
      next();
    });
};

exports.eventsByUser = (req, res) => {
  Event.find({ owner: req.profile._id })
    .populate("owner", "_id name")
    .select(
      "_id title description startDate endDate allDay bgColor createdDate"
    )
    .sort("_created")
    .exec((err, events) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      res.json(events);
    });
};

exports.createEvent = (req, res) => {
  //console.log("creating new event");
  const event = new Event(req.body);
  event.save();
  res.status(200).json({ message: "event created" });
};

exports.getEvent = (req, res) => {
  return res.json(req.event);
};
