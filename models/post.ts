import mongoose, { Schema, Model, Types } from 'mongoose';
import { IPost } from '../types';


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
    type: Schema.Types.ObjectId as any,
    ref: "User"
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  updated: Date,
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      text: String,
      createdDate: { type: Date, default: Date.now },
      postedBy: { type: Schema.Types.ObjectId, ref: "User" }
    }
  ]
});

// Add virtual for created field to match interface
postSchema.virtual('created').get(function(this: IPostDocument) {
  return this.createdDate;
});

const Post = mongoose.model<IPostDocument, PostModel>("Post", postSchema);

export default Post;