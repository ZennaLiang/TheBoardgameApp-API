const formidable = require("formidable"); // handle files
const fs = require("fs"); // file system
const _ = require("lodash");
const axios = require("axios");
const XML2JS = require("xml2js");
const User = require("../models/user");

const Boardgame = require("../models/boardgame");
exports.findUserById = (req, res, next, id) => {
  //console.log("find user by id: ", id);
  //.exec will either get error or user info
  User.findById(id)
    .populate(
      "boardgames.boardgame",
      "_id bggId title yearPublished minPlayers maxPlayers minPlayTime maxPlayTime imgThumbnail avgRating"
    )
    .exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: "User not found",
        });
      }
      //console.log(user.games);
      req.profile = user; // adds profile object in req with user info
      //console.log(req.profile.games);
      next();
    });
};
exports.findBgByUsername = (req, res, next, id) => {
  console.log("Find bg by id", id);
  fetch(
    `https://www.boardgamegeek.com/xmlapi2/collection?username=ZennaL&subtype=boardgame&own=0`
  )
    .then((response) => response.text())
    .then((data) => {
      console.log("data: ", data);
    });
  next();
};

exports.getBoardgame = (req, res) => {
  return res.json(req.boardgame);
};

async function fetchCollection(url) {
  return axios
    .get(url)
    .then((response) => {
      return response;
    })
    .catch((err) => console.log(err));
}

function processBggBoardgame(bgItem) {
  console.log(bgItem);
  let boardgame = {
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
      bgItem.stats[0] === undefined || isNaN(bgItem.stats[0].$.minplayers)
        ? -1
        : bgItem.stats[0].$.minplayers,

    maxPlayers:
      bgItem.stats[0] === undefined || isNaN(bgItem.stats[0].$.maxplayers)
        ? -1
        : bgItem.stats[0].$.maxplayers,

    minPlayTime:
      bgItem.stats[0] === undefined || isNaN(bgItem.stats[0].$.minplaytime)
        ? -1
        : bgItem.stats[0].$.minplaytime,

    maxPlayTime:
      bgItem.stats[0] === undefined || isNaN(bgItem.stats[0].$.maxplaytime)
        ? -1
        : bgItem.stats[0].$.maxplaytime,
  };
  return boardgame;
}

exports.getBggBoardgames = (req, res) => {
  const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${req.params.bggUsername}&subtype=boardgame&stats=1`;
  //const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=sfsa&subtype=boardgame&own=0&stats=1`;
  if (req.body.counter === undefined) {
    req.body.counter = 0;
  } else {
    req.body.counter += 1;
  }
  if (req.body.counter > 5) {
    return res.status(419).json({ error: "Collection too large" });
  }
  fetchCollection(url)
    .then((response) => {
      if (response.status === 200) {
        let boardgames = [];
        let xml = XML2JS.parseString(response.data, (err, result) => {
          if (result.errors && result.items === undefined) {
            return res.status(404).json({ error: "Username not found" });
          }
          if (result.items.$.totalitems !== "0") {
            result.items.item.forEach((bgItem) => {
              let boardgame = processBggBoardgame(bgItem);
              //console.log("bgid: ", boardgame)
              boardgames.push(boardgame);
            });
            boardgames.forEach(async (bgItem) => {
              await Boardgame.findOneAndUpdate(
                { bggId: bgItem.bggId },
                bgItem,
                { upsert: true }
              );
            });
          }
        });
        return res.status(200).json(boardgames);
      } else if (response.status === 202) {
        setTimeout(() => {
          this.getBggBoardgames(req, res);
        }, 5000);
      }
    })
    .catch((err) => {
      return res.status(404).json({ error: "Error fetching data." });
    });
};

exports.getUserCollection = (req, res) => {
  req.profile.salt = undefined;
  req.profile.hashed_password = undefined;
  return res.json(req.profile.boardgames);
};
exports.getUserBggBoardgames = (req, res) => {
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
    .then((response) => {
      if (response.status === 200) {
        let boardgames = [];
        let xml = XML2JS.parseString(response.data, (err, result) => {
          if (result.errors && result.items === undefined) {
            return res.status(404).json({ error: "Username not found" });
          }
          if (result.items.$.totalitems !== "0") {
            result.items.item.forEach((bgItem) => {
              let boardgame = processBggBoardgame(bgItem);
              boardgames.push(boardgame);
            });
            boardgames.forEach(async (bgItem) => {
              await Boardgame.findOneAndUpdate(
                { bggObjId: bgItem.bggObjId },
                bgItem,
                { upsert: true }
              );
            });
          }
        });
        return res.status(200).json(boardgames);
      } else if (response.status === 202) {
        setTimeout(() => {
          this.getBggBoardgames(req, res);
        }, 5000);
      }
    })
    .catch((err) => {
      return res.status(404).json({ error: "Error fetching data." });
    });
};

exports.getBGGCounts = async (req, res) => {
  console.log("here:", req.params.username);
  const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${req.params.bggUsername}&subtype=boardgame&own=0&stats=1`;
  await fetchCollection(url)
    .then((response) => {
      console.log("got response from collection");
      if (response.status === 200) {
        let xml = XML2JS.parseString(response.data, (err, result) => {
          // console.log(result.items);
          if (result.errors) {
            return res.status(404).json({ error: "Username not found" });
          }
          if (result.items.$.totalitems !== "0") {
            res.status(200).json(result.items.$.totalitems);
          }
        });
      }
    })
    .catch((err) => console.log(err));
};

exports.checkBggAccountExist = async (req, res, next) => {
  console.log("here:", req.params.bggUsername);
  const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${req.params.bggUsername}&subtype=boardgame&stats=1`;
  await fetchCollection(url)
    .then((response) => {
      console.log("got response from collection");
      if (response.status === 200) {
        let xml = XML2JS.parseString(response.data, (err, result) => {
          // console.log(result.items);
          if (result.errors) {
            return res.status(404).json({
              error: `Username: ${req.params.bggUsername} not found. Please enter correct information.`,
            });
          }
          if (result.items.$.totalitems === "0") {
            return res.status(404).json({
              error: `Username: ${req.params.bggUsername} does not have a boardgame collection.`,
            });
          }
        });
      }
    })
    .catch((err) => console.log(err));
  next();
};
