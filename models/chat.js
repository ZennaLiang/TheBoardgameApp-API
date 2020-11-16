const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema; // object with name and ids

const User = require("./user");
const messageSchema = new mongoose.Schema(
  {
    from: {
      type: ObjectId,
      ref: "User"
    },
    message: {
      type: String,
      maxlength: 250
    },
    timestamp: {
      type: Date,
      default: Date.now()
    }
  }
) 

const chatSchema = new mongoose.Schema(
  {
    between: [
      {
        type: ObjectId,
        ref: "User"
      }
    ],
    messages: [
      {
        type: messageSchema
      }
    ]

  },
  { toJson: { virtual: true } }
);

module.exports = mongoose.model("Chat", chatSchema);

module.exports.Message = mongoose.model("Message", messageSchema)
