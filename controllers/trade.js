const Trade = require("../models/tradeRequest");
const mongoose = require('mongoose');

exports.createTrade = (req, res) => {

  try{
     Trade.create({
    tradeSender: new mongoose.Types.ObjectId(req.body.userID),
    tradeReceiver: new mongoose.Types.ObjectId(req.body.searchedUserID),
     tradeOffer: req.body.userTradeList,
     tradeWants: req.body.searchedUserTradeList,
    notes: req.body.notes
  })
    
  res.status(200).json({success: true});
  }catch(e){
    console.log(e);
    return res.status(400).json({
      error: "Request not found",
    });
  }


};

exports.getAllTrades = (req,res) => {



}