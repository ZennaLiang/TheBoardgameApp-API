const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");
const axios = require("axios");
const User = require("../models/user");
const XML2JS = require("xml2js");
const Boardgame = require("../models/boardgame");

exports.findUserByName = (req, res) => {
  var guruName = req.params.username;

  User.findOne({ name: guruName }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found"
      });
    } else {
      return res.status(200).json({ user });
    }
  });
};

exports.findUserById = (req, res, next, id) => {
  //.exec will either get error or user info
  User.findById(id)
    // populate followers and following users array
    .populate("following", "_id name") // with just name and id
    .populate("followers", "_id name")
    .populate("friends", "_id name")
    .populate(
      "boardgames.boardgame",
      "_id bggId title yearPublished minPlayers maxPlayers minPlayTime maxPlayTime imgThumbnail avgRating"
    )
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

// helper fxn to get collection
// use for loops in the other fxn
async function fetchCollection(url) {
  return await axios
    .get(url)
    .then(response => {
      return response;
    })
    .catch(err => console.log(err));
}

// helper fxn to process bggeek format to be use
function processBggBoardgame(bgItem) {
  let bgStats = bgItem.status[0].$;
  let boardgameInfo = bgItem.stats[0].$;
  let bg = {
    bggId: bgItem.$.objectid,
    title: bgItem.name[0]._ === undefined ? "Missing Name" : bgItem.name[0]._,

    imgThumbnail: bgItem.thumbnail === undefined ? "" : bgItem.thumbnail[0],

    avgRating:
      bgItem.stats[0] === undefined ||
      isNaN(bgItem.stats[0].rating[0].average[0].$.value)
        ? "N/A"
        : bgItem.stats[0].rating[0].average[0].$.value,

    yearPublished:
      bgItem.yearpublished === undefined || isNaN(bgItem.yearpublished[0])
        ? -1
        : bgItem.yearpublished[0],

    minPlayers:
      bgItem.stats[0] === undefined || isNaN(boardgameInfo.minplayers)
        ? -1
        : boardgameInfo.minplayers,

    maxPlayers:
      bgItem.stats[0] === undefined || isNaN(boardgameInfo.maxplayers)
        ? -1
        : boardgameInfo.maxplayers,

    minPlayTime:
      bgItem.stats[0] === undefined || isNaN(boardgameInfo.minplaytime)
        ? -1
        : boardgameInfo.minplaytime,

    maxPlayTime:
      bgItem.stats[0] === undefined || isNaN(boardgameInfo.maxplaytime)
        ? -1
        : boardgameInfo.maxplaytime,
    forTrade: bgStats.fortrade === "1",
    wantFromTrade: bgStats.want === "1",
    wantFromBuy: bgStats.wanttobuy === "1",
    wantToPlay: bgStats.wanttoplay === "1",
    notes: bgItem.comment === undefined ? "" : bgItem.comment[0],
    numOfPlay: bgItem.numplays[0]
  };

  return bg;
}

function processNewBoardgame(bgItem) {
  let newBoardgame = {
    bggId: bgItem.bggId,
    title: bgItem.title,
    imgThumbnail: bgItem.imgThumbnail,
    avgRating: bgItem.avgRating,
    yearPublished: bgItem.yearPublished,
    minPlayers: bgItem.minPlayers,
    maxPlayers: bgItem.maxPlayers,
    minPlayTime: bgItem.minPlayTime,
    maxPlayTime: bgItem.maxPlayTime
  };
  return newBoardgame;
}

function processNewBoardgameStats(bgItem, boardgameInfo) {
  let userBgStats = {
    boardgame: boardgameInfo._id,
    forTrade: bgItem.forTrade,
    wantFromTrade: bgItem.wantFromTrade,
    wantFromBuy: bgItem.wantFromBuy,
    wantToPlay: bgItem.wantToPlay,
    numOfPlay: bgItem.numOfPlay,
    notes: bgItem.notes
  };

  return userBgStats;
}
// set boardgamegeek username and sync collection to bgguru
// get collection, format it, then check if each exist within user collection
// add if not exist, update if it does
// since it may take a while to load from bggeek and it may return 202
// keep looping until successful
exports.updateBggUsername = (req, res) => {
  let user = req.profile;
  user.updated = Date.now();
  user.bggUsername = req.params.bggUsername;
  const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${req.params.bggUsername}&subtype=boardgame&stats=1`;
  if (req.body.counter === undefined) {
    req.body.counter = 0;
  } else {
    req.body.counter += 1;
  }
  if (req.body.counter > 5) {
    return res
      .status(419)
      .json({ error: "WOW! Collection is too large to process." });
  }

  fetchCollection(url)
    .then(response => {
      if (response.status === 200) {
        let boardgames = [];
        let xml = XML2JS.parseString(response.data, (err, result) => {
          if (result.errors && result.items === undefined) {
            return res
              .status(404)
              .json({ error: "BGG username not found. Please try again." });
          }
          if (result.items.$.totalitems !== "0") {
            result.items.item.forEach(bgItem => {
              let boardgame = processBggBoardgame(bgItem);
              boardgames.push(boardgame);
            });

            boardgames.forEach(async bgItem => {
              // add if bg not in database
              // update boardgame info if it's there
              let newBg = processNewBoardgame(bgItem);
              let foundBoardgame = await Boardgame.findOneAndUpdate(
                { bggId: newBg.bggId },
                newBg,
                { upsert: true }
              );
              // check if user already have the boardgame
              let findUserBoardgame = user.boardgames.find(
                bg =>
                  bg.boardgame != undefined &&
                  bg.boardgame._id == String(foundBoardgame._id)
              );
              // if bg found, update status from boardgamegeek to guru
              if (findUserBoardgame !== undefined) {
                findUserBoardgame.forTrade = bgItem.forTrade;
                findUserBoardgame.wantFromTrade = bgItem.wantFromTrade;
                findUserBoardgame.wantFromBuy = bgItem.wantFromBuy;
                findUserBoardgame.wantToPlay = bgItem.wantToPlay;
                findUserBoardgame.numOfPlay = bgItem.numOfPlay;
                findUserBoardgame.notes = bgItem.notes;

                let updated = await User.findOneAndUpdate(
                  {
                    _id: user._id,
                    "boardgames.boardgame": foundBoardgame._id
                  },
                  { $set: { "boardgames.$": findUserBoardgame } },
                  {
                    new: true
                  }
                );
              } else {
                // otherwise, add the new game to user with stats
                let newBgStat = processNewBoardgameStats(
                  bgItem,
                  foundBoardgame
                );
                await User.findByIdAndUpdate(
                  user._id,
                  { $push: { boardgames: newBgStat } },
                  {
                    upsert: true,
                    new: true
                  }
                );
              }
            });
          }
        });
        if (res.statusCode !== 404) {
          user.save((err, result) => {
            if (err) {
              return res.status(400).json({
                error: "Cannot save data. Please try again later."
              });
            }
            // so these don't get pass to the front end
            user.hashed_password = undefined;
            user.salt = undefined;
            res.status(200).json({ user });
          });
        }
      } else if (response.status === 202) {
        setTimeout(() => {
          this.updateBggUsername(req, res);
        }, 5000);
      }
    })
    .catch(err => {
      return res
        .status(404)
        .json({ error: "Error fetching data. Please try again later" });
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
  } else {
    return res.send("Error: Image Not Found");
  }
  next();
};

exports.addFollowing = (req, res, next) => {
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
