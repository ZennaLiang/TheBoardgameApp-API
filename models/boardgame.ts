import mongoose, { Schema, Model } from 'mongoose';
import { IBoardgame } from '../types';

interface IBoardgameDocument extends IBoardgame {
  title?: string;
  minPlayTime?: number;
  maxPlayTime?: number;
  imgThumbnail?: string;
  avgRating?: string;
}

type BoardgameModel = Model<IBoardgameDocument>;

const boardgameSchema = new Schema<IBoardgameDocument, BoardgameModel>({
  bggId: {
    type: String,
    unique: true,
    index: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  yearPublished: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  image: {
    type: String,
  },
  imgThumbnail: {
    type: String,
  },
  minPlayers: {
    type: Number,
    required: true,
  },
  maxPlayers: {
    type: Number,
    required: true,
  },
  playingTime: {
    type: Number,
  },
  minPlayTime: {
    type: Number,
    required: true,
  },
  maxPlayTime: {
    type: Number,
    required: true,
  },
  minAge: {
    type: Number,
  },
  rating: {
    type: Number,
  },
  avgRating: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
  },
  rank: {
    type: Number,
  },
  designer: [String],
  publisher: [String],
  artist: [String],
  category: [String],
  mechanic: [String],
  isExpansion: {
    type: Boolean,
    default: false,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
  },
});

// Virtual fields removed - they were conflicting with real schema fields

const Boardgame = mongoose.model<IBoardgameDocument, BoardgameModel>("Boardgame", boardgameSchema);

export default Boardgame;