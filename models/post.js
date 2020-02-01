const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    image: {
        data: Buffer,
        contenType: String
    },
    postedBy: {
        type: ObjectId,
        ref: "User"
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Post", postSchema);
