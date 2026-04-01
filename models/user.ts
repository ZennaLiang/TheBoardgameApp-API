import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '../types';

const SALT_ROUNDS = 12;

interface IBoardgameEntry {
  boardgame: mongoose.Types.ObjectId;
  notes?: string;
  forTrade?: boolean;
  wantFromTrade?: boolean;
  wantFromBuy?: boolean;
  wantToPlay?: boolean;
  numOfPlay?: number;
  price?: number;
  condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  tags?: string[];
}

interface IUnconfirmedFriend {
  friend: mongoose.Types.ObjectId[];
  sender: boolean;
  confirmed: boolean;
}

interface IUserDocument extends IUser {
  _password?: string;
  friends?: mongoose.Types.ObjectId[];
  unconfirmedFriends?: IUnconfirmedFriend[];
  bggUsername?: string;
  boardgames?: IBoardgameEntry[];
  createdDate?: Date;
}

interface IUserMethods {
  authenticate: (plainText: string) => Promise<boolean>;
  encryptPassword: (password: string) => Promise<string>;
}

type UserModel = Model<IUserDocument, {}, IUserMethods>;

const userSchema = new Schema<IUserDocument, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true
    },
    email: {
      type: String,
      trim: true,
      required: true
    },
    hashed_password: {
      type: String,
      required: true
    },
    salt: String,
    createdDate: {
      type: Date,
      default: Date.now
    },
    updated: Date,
    photo: {
      data: Buffer,
      contentType: String
    },
    about: {
      type: String,
      trim: true
    },
    following: [{ type: Schema.Types.ObjectId as any, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId as any, ref: "User" }],
    friends: [{ type: Schema.Types.ObjectId as any, ref: "User" }],
    unconfirmedFriends: [
      {
        friend: [{ type: Schema.Types.ObjectId as any, ref: "User" }],
        sender: Boolean,
        confirmed: Boolean
      }
    ],
    resetPasswordLink: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      default: "subscriber"
    },
    bggUsername: {
      type: String
    },
    boardgames: [
      {
        boardgame: {
          type: Schema.Types.ObjectId as any,
          ref: "Boardgame",
          unique: true,
          sparse: true
        },
        notes: String,
        forTrade: Boolean,
        wantFromTrade: Boolean,
        wantFromBuy: Boolean,
        wantToPlay: Boolean,
        numOfPlay: Number,
        price: Number,
        condition: {
          type: String,
          enum: ["Excellent", "Good", "Fair", "Poor"]
        },
        tags: [
          {
            type: String,
            maxlength: 25
          }
        ]
      }
    ]
  },
  { toJSON: { virtuals: true } }
);

/**************************************************************************
 **************************************************************************
 * Virtual fields are additional fields for a given model.
 * Their values can be set manually or automatically with defined functionality.
 * Keep in mind: virtual properties (password) don't get persisted in the database.
 * They only exist logically and are not written to the document's collection.
 **************************************************************************
 **************************************************************************/

// virtual field for temp password
userSchema
  .virtual("password")
  .set(function(this: IUserDocument, password: string) {
    this._password = password;
  })
  .get(function(this: IUserDocument) {
    return this._password;
  });

// Hash password before saving
userSchema.pre("save", async function() {
  if (!this._password) return;
  this.hashed_password = await bcrypt.hash(this._password, SALT_ROUNDS);
});

/**************************************************************************
 **************************************************************************
 ***************************       methods       **************************
 **************************************************************************
 **************************************************************************/

userSchema.method('authenticate', async function(this: IUserDocument, plainText: string): Promise<boolean> {
  if (!this.hashed_password) return false;
  return bcrypt.compare(plainText, this.hashed_password);
});

userSchema.method('encryptPassword', async function(_password: string): Promise<string> {
  return bcrypt.hash(_password, SALT_ROUNDS);
});

userSchema.pre("deleteOne", { document: true, query: false }, async function(this: IUserDocument) {
  const Post = mongoose.model("Post");
  await Post.deleteMany({ postedBy: this._id });
});

const User = mongoose.model<IUserDocument, UserModel>("User", userSchema);

export default User;
