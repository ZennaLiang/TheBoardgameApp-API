const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const tradeRequestSchema = new mongoose.Schema({
    tradeSender: { 
        type: ObjectId, 
        ref: "User" 
    },

    tradeReceiver: { 
        type: ObjectId, 
        ref: "User" 
    },

    tradeOffer: [{
        bggId: { 
            type: String, 
            ref: "Boardgame", 
            unique: true }}],

    tradeWants: [{
        bggId: { 
            type: String, 
            ref: "Boardgame", 
            unique: true }}],
    
    notes: {
        type: String,
        required: true
    },

    createdDate: {
        type: Date,
        default: Date.now
    },
    updated: Date,
   
});

module.exports = mongoose.model("TradeRequest", tradeRequestSchema);
