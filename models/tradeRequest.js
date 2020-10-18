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
        id: { 
            type: String, 
            ref: "Boardgame" },
        name:{
            type: String
        },
        condition:{
            type: String,
            enum: ['Excellent','Good','Fair','Poor']
        },
        price:{
            type: Number
        }
        }],

    tradeWants: [{
        id: { 
            type: String, 
            ref: "Boardgame" },
        name:{
            type: String
        },
        condition:{
            type: String,
            enum: ['Excellent','Good','Fair','Poor']
        },
        price:{
            type: Number
        }
        }],
    
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

module.exports = mongoose.model("Trades", tradeRequestSchema);
