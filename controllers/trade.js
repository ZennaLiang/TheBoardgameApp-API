const Trade = require("../models/tradeRequest");
const mongoose = require("mongoose");

exports.createTrade = async (req, res) => {
  try {
    await Trade.create({
      tradeSender: new mongoose.Types.ObjectId(req.body.userID),
      tradeReceiver: new mongoose.Types.ObjectId(req.body.searchedUserID),
      tradeOffer: req.body.userTradeList,
      tradeWants: req.body.searchedUserTradeList,
      notes: req.body.notes
    }).then(data => {
      //returns tradeId to be used by application
      res.status(200).json({ success: true, tradeId: data._id });
    });
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      error: "Request not found"
    });
  }
};

exports.getAllTrades = async (req, res) => {
  // return 5 trades per page use' .limit(perPage)
  const perPage = 5;
  let totalItems;

  const trades = await Trade.find()
    // countDocuments() gives you total count of trades
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Trade.find()
        .populate("tradeSender", "_id name")
        .populate("tradeReceiver", "_id name")
        .select("tradeOffer tradeWants notes createdDate");
    })
    .then(trades => {
      res.status(200).json(trades);
    })
    .catch(err => console.log(err));
};

exports.getTradeById = async (req, res) => {
  const tradeId = req.params.tradeId;
  const trade = await Trade.findById(tradeId)
    .populate("tradeSender", "_id name")
    .populate("tradeReceiver", "_id name")
    .then(data => {
      res.status(200).json(data);
    })
    .catch(err => console.log(err));
};

exports.getTradesById = async (req, res) => {
  const userId = req.params.userId;
  // return 5 trades per page use' .limit(perPage)
  const perPage = 5;
  let totalItems;

  const trades = await Trade.find({
    $or: [{ tradeSender: userId }, { tradeReceiver: userId }]
  })
    // countDocuments() gives you total count of trades
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Trade.find()
        .populate("tradeSender", "_id name")
        .populate("tradeReceiver", "_id name")
        .select("tradeOffer tradeWants status notes createdDate");
    })
    .then(trades => {
      res.status(200).json(trades);
    })
    .catch(err => console.log(err));
};

exports.deleteTrade = (req, res) => {
  let tradeId = req.params.tradeId;
  Trade.findByIdAndDelete(tradeId, function(err) {
    if (err) console.log(err);
    console.log("Successful deletion");
  });
};

exports.updateTradeStatus = (req, res) => {
  let tradeId = req.params.tradeId;
  console.log(req.body);
  let status = req.body.status;
  console.log(status);
  Trade.updateOne({_id: tradeId}, { status: status }, function(err, result) {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
};
