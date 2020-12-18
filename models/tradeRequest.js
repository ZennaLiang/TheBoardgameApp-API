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

  tradeOffer: [
    {
      id: {
        type: String,
        ref: "Boardgame"
      },
      name: {
        type: String
      },
      condition: {
        type: String,
        enum: ["Excellent", "Good", "Fair", "Poor", "N/A"],
        default: "N/A"
      },
      price: {
        type: Number
      },
      tags: [{ type: String, unique: true, default: [] }]
    }
  ],

  tradeWants: [
    {
      id: {
        type: String,
        ref: "Boardgame"
      },
      name: {
        type: String
      },
      condition: {
        type: String,
        enum: ["Excellent", "Good", "Fair", "Poor", "N/A"],
        default: "N/A"
      },
      tags: [{ type: String, unique: true, default: [] }]
    }
  ],

  notes: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Open", "Closed", "Pending"],
    required: true,
    default: "Open"
  },

  createdDate: {
    type: Date,
    default: Date.now
  },
  updated: Date
});

module.exports = mongoose.model("Trades", tradeRequestSchema);
