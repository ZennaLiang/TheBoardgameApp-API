const Chat = require("../models/chat");
const User = require("../models/user")
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

exports.getChats = (req, res) => {
  Chat.find({ between: req.auth._id })
    .populate("between", "_id name")
    .exec((err, chats) => {
      if (err || !chats) {
        return res.status(400).json({
          error: err,
        });
      }

      res.json(chats)
    });
};

exports.createChat = async (req, res, next) => {
  let user = await User.findOne({ name: req.body.who })

  if (!user) {
    return res.status(400).json({ error: "User not found" })
  }

  let found = await Chat.findOne({ "$and": [{ between: user._id }, { between: req.auth._id }] })
  if (found) {
    return res.status(409).json({ error: "Chat exists" })
  }

  const chat = await new Chat({
    between: [
      ObjectId(req.auth._id),
      user._id
    ]
  })

  await chat.save(async (err, data) => {
    data = await Chat.findOne(data).populate("between", "_id name").populate("messages.from", "_id name");
    if (err) {
      return res.status(500).json(err)
    }
    res.json(data)
  })
}


exports.getChat = async (req, res) => {
  Chat.findById(req.params.id)
    .populate("between", "_id name")
    .populate("messages.from", "_id name")
    .exec((err, chat) => {
      if (err || !chat) {
        return res.status(400).json({
          error: err,
        });
      }

      res.json(chat)
    });
}

exports.createMessage = async (req, res) => {
  Chat.findById(req.body._id)
    .exec((error, chat) => {
      if (error || !chat) {
        return res.status(500).json({ error });
      }
      let msgObject = {
        message: req.body.message,
        timestamp: Date.now()
      };
      msgObject.from = req.auth._id


      chat.messages.push(msgObject)

      chat.save().then(async (saved) => {
        res.status(200).json(msgObject)
      }).catch((error) => {
        res.status(400).json({ error })
      })



    })
}