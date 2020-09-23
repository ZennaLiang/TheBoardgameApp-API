const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");
const axios = require("axios");
const User = require("../models/user");
const XML2JS = require("xml2js");
const Boardgame = require("../models/boardgame");
exports.findUserById = (req, res, next, id) => {
  //console.log("find user by id: ", id);
  //.exec will either get error or user info
  User.findById(id)
    // populate followers and following users array
    .populate("following", "_id name") // with just name and id
    .populate("followers", "_id name")
    .exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: "User not found"
        });
      }
      req.profile = user; // adds profile object in req with user info
      next();
    });
};

exports.hasAuthorization = (req, res, next) => {
  let sameUser = req.profile && req.auth && req.profile._id == req.auth._id;
  let adminUser = req.profile && req.auth && req.auth.role === "admin";

  const authorized = sameUser || adminUser;

  if (!authorized) {
    return res.status(403).json({
      error: "User is not authorized to perform this action"
    });
  }
  next();
};

exports.findAllUsers = (req, res) => {
  User.find((err, users) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json(users);
  }).select("name email updated createdDate role");
};

exports.getUser = (req, res) => {
  // so these don't get pass to the front end
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

exports.updateUser = (req, res, next) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Photo could not be uploaded"
      });
    }
    // save user
    let user = req.profile;
    user = _.extend(user, fields);
    user.updated = Date.now();

    if (files.photo) {
      user.photo.data = fs.readFileSync(files.photo.path);
      user.photo.contentType = files.photo.type;
    }

    user.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }
      // so these don't get pass to the front end
      user.hashed_password = undefined;
      user.salt = undefined;
      res.json({ user });
    });
  });
};

async function fetchCollection(url) {
  return await axios
    .get(url)
    .then(response => {
      return response;
    })
    .catch(err => console.log(err));
}

function processBggBoardgame(bgItem) {
  //console.log("bgItem", bgItem.comment);
  let stats = bgItem.status[0].$;
  let bg = {
    bggId: bgItem.$.objectid,
    forTade: stats.fortrade,
    wantFromTrade: stats.want,
    wantFromBuy: stats.wantotbuy,
    wantToPlay: stats.wanttoplay,
    notes: bgItem.comment === undefined ? "" : bgItem.comment[0],
    numOfPlay: bgItem.numplays[0]
  };
  return bg;
}

exports.updateBggUsername = (req, res) => {
  let user = req.profile;
  user.updated = Date.now();
  const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${req.params.bggUsername}&subtype=boardgame&stats=1`;
  if (req.body.counter === undefined) {
    req.body.counter = 0;
  } else {
    req.body.counter += 1;
  }
  if (req.body.counter > 5) {
    return res.status(419).json({ error: "Collection too large" });
  }
  fetchCollection(url)
    .then(response => {
      if (response.status === 200) {
        let boardgames = [];
        let xml = XML2JS.parseString(response.data, (err, result) => {
          if (result.errors && result.items === undefined) {
            return res.status(404).json({ error: "Username not found" });
          }
          if (result.items.$.totalitems !== "0") {
            result.items.item.forEach(bgItem => {
              let boardgame = processBggBoardgame(bgItem);
              boardgames.push(boardgame);
            });
            boardgames.forEach(async bgItem => {
              if(user.boardgames.find(boardgame => boardgame.bggId === bgItem.bggId) === undefined){
                user.boardgames.push(bgItem);
              }
            });
            user.save((err, result) => {
              if (err) {
                console.log(err);
              }
              user.hashed_password = undefined;
              user.salt = undefined;
            });
          }
        });
        res.status(200).json({ user });
      } else if (response.status === 202) {
        console.log("status", response.status);
        setTimeout(() => {
          this.updateBggUsername(req, res);
        }, 5000);
      }
    })
    .catch(err => {
      return res.status(404).json({ error: "Error fetching data." });
    });
};



exports.deleteUser = (req, res, next) => {
  let user = req.profile;
  user.remove((err, user) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json({ message: "User deleted successfully" });
  });
};

exports.getUserPhoto = (req, res, next) => {
  if (req.profile.photo.data) {
    res.set(("Content-Type", req.profile.photo.contentType));
    return res.send(req.profile.photo.data);
  }
  next();
};

exports.addFollowing = (req, res, next) => {
  console.log("request body userID: ", req.body.userId);
  User.findByIdAndUpdate(
    // mongo fxn to find and update
    req.body.userId,
    { $push: { following: req.body.followId } },
    (err, result) => {
      if (err) {
        return res.status(400).json({ error: err });
      }
      next();
    }
  );
};

exports.addFollower = (req, res) => {
  User.findByIdAndUpdate(
    req.body.followId,
    { $push: { followers: req.body.userId } }, // add new data to user
    { new: true } // to get updated data - w/o it will return old data
  )
    .populate("following", "_id name")
    .populate("followers", "_id name")
    .exec((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }
      result.hashed_password = undefined;
      result.salt = undefined;
      res.json(result);
    });
};

// remove follow unfollow
exports.removeFollowing = (req, res, next) => {
  User.findByIdAndUpdate(
    req.body.userId,
    { $pull: { following: req.body.unfollowId } },
    (err, result) => {
      if (err) {
        return res.status(400).json({ error: err });
      }
      next();
    }
  );
};

exports.removeFollower = (req, res) => {
  User.findByIdAndUpdate(
    req.body.unfollowId,
    { $pull: { followers: req.body.userId } },
    { new: true }
  )
    .populate("following", "_id name")
    .populate("followers", "_id name")
    .exec((err, result) => {
      if (err) {
        return res.status(400).json({
          error: err
        });
      }
      result.hashed_password = undefined;
      result.salt = undefined;
      res.json(result);
    });
};

exports.findPeople = (req, res) => {
  let following = req.profile.following;
  following.push(req.profile._id);
  // nin - not including the list of following ppl and self
  User.find({ _id: { $nin: following } }, (err, users) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json(users);
  }).select("name");
};
