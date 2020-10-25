const formidable = require("formidable"); // handle files
const fs = require("fs"); // file system
const _ = require("lodash");

const Event = require("../models/event");
const User = require("../models/user");

exports.findUserById = (req, res, next, id) => {
  //console.log("find user by id: ", id);
  //.exec will either get error or user info
  User.findById(id)
    .populate("boardgames")
    .populate("boardgames.boardgame", "_id bbgId title")
    .select("_id name")
    .exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: "User not found",
        });
      }

      req.profile = user; // adds profile object in req with user info
      next();
    });
};

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
    .sort("startDate")
    .exec((err, events) => {
      if (err) {
        return res.status(400).json({
          error: err,
        });
      }
      res.json(events);
    });
};

exports.createEvent = async (req, res) => {
  const event = await new Event(req.body);
  await event.save((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    res.json(result);
  });
};

exports.getEvent = (req, res) => {
  return res.json(req.event);
};

exports.isOwner = (req, res, next) => {
  let sameUser = req.event && req.auth && req.event.owner._id == req.auth._id;
  let adminUser = req.event && req.auth && req.auth.role === "admin";

  let isOwner = sameUser || adminUser;

  if (!isOwner) {
    return res.status(403).json({
      error: "User is not authorized",
    });
  }
  next();
};

exports.updateEvent = (req, res, next) => {
  let event = req.event;
  event = _.extend(event, req.body);
  event.updated = Date.now();
  event.save((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    res.json(event);
  });
};

exports.deleteEvent = (req, res) => {
  let event = req.event;
  event.remove((err, event) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    res.json({
      message: "Event deleted successfully",
    });
  });
};
