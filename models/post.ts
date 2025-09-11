import mongoose, { Schema, Model } from 'mongoose';
import { IPost, IComment } from '../types';

const { ObjectId } = Schema.Types;

interface IPostDocument extends IPost {
  createdDate?: Date;
}

type PostModel = Model<IPostDocument>;

const postSchema = new Schema<IPostDocument, PostModel>({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  photo: {
    data: Buffer,
    contentType: String
  },
  postedBy: {
    type: ObjectId,
    ref: "User"
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  updated: Date,
  likes: [{ type: ObjectId, ref: "User" }],
  comments: [
    {
      text: String,
      createdDate: { type: Date, default: Date.now },
      postedBy: { type: ObjectId, ref: "User" }
    }
  ]
});

// Add virtual for created field to match interface
postSchema.virtual('created').get(function(this: IPostDocument) {
  return this.createdDate;
});

const Post = mongoose.model<IPostDocument, PostModel>("Post", postSchema);

export default Post;