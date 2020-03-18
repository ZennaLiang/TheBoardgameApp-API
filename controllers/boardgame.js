const formidable = require("formidable"); // handle files
const fs = require("fs"); // file system
const _ = require("lodash");
const axios = require("axios");
const XML2JS = require("xml2js");

const Boardgame = require("../models/boardgame");

exports.findBgByUsername = (req, res, next, id) => {
  console.log("Find bg by id", id);
  fetch(
    `https://www.boardgamegeek.com/xmlapi2/collection?username=ZennaL&subtype=boardgame&own=0`
  )
    .then(response => response.text())
    .then(data => {
      console.log("data: ", data);
    });
  next();
};

exports.getBoardgame = (req, res) => {
  return res.json(req.boardgame);
};

function fetchCollection(url) {
  let boardgames = [];
  return axios
    .get(url)
    .then(response => {
      if (response.status === 200) {
        return response;
      } else if (response.status === 202) {
        console.log("timeout");
        setTimeout(() => {
          this.fetchCollection(url);
        }, 5000);
      } else {
        return response;
      }
    })
    .catch(err => console.log(err));
}

exports.getBoardgames = async (req, res) => {
  console.log("here:", req.params.username);
  const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${req.params.username}&subtype=boardgame&own=0&stats=1`;
  fetchCollection(url)
    .then(response => {
      if (response.status === 200) {
        let xml = XML2JS.parseString(response.data, (err, result) => {
          // console.log(result.items);
          if (result.items.$.totalitems !== "0") {
            let boardgames = [];
            result.items.item.forEach(bgItem => {
              
              let boardgame = new Boardgame();
              boardgame.objectId = bgItem.$.objectid;
              boardgame.title = bgItem.name[0]._;
              boardgame.imgThumbnail = bgItem.thumbnail[0];
              boardgame.avgRating = isNaN(
                bgItem.stats[0].rating[0].average[0].$.value
              )
                ? "N/A"
                : bgItem.stats[0].rating[0].average[0].$.value;
              boardgame.yearPublished =
                bgItem.yearpublished[0] === undefined
                  ? "--"
                  : bgItem.yearpublished[0];

              boardgame.minPlayers = isNaN(bgItem.stats[0].$.minplayers)
                ? "--"
                : bgItem.stats[0].$.minplayers;
              boardgame.maxPlayers = isNaN(bgItem.stats[0].$.maxplayers)
                ? "--"
                : bgItem.stats[0].$.maxplayers;
              boardgame.minPlayTime = isNaN(bgItem.stats[0].$.minplaytime)
                ? "--"
                : bgItem.stats[0].$.minplaytime;
              boardgame.maxPlayTime = isNaN(bgItem.stats[0].$.maxplaytime)
                ? "--"
                : bgItem.stats[0].$.maxplaytime;
              boardgames.push(boardgame);
            });
            res.status(200).json(boardgames);
          }
        });
      }
    })
    .catch(err => console.log(err));
};