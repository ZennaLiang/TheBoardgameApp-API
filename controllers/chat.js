const Chat = require("../models/chat");

exports.getChats = (req, res, next, user) => {
  console.log("got");
  Chat.find({ between: user })
    .populate("between", "_id name")
    .exec((err, chats) => {
      if (err || !chats) {
        return res.status(400).json({
          error: err,
        });
      }

      next();
    });
};
