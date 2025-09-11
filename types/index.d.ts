import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  hashed_password?: string;
  salt?: string;
  about?: string;
  role?: string;
  history?: any[];
  created?: Date;
  updated?: Date;
  photo?: {
    data: Buffer;
    contentType: string;
  };
  following?: string[];
  followers?: string[];
  resetPasswordLink?: string;
  token?: string;
  googleId?: string;
  bggUsername?: string;
  boardgames?: Array<{
    boardgame: any;
    notes?: string;
    forTrade?: boolean;
    wantFromTrade?: boolean;
    wantFromBuy?: boolean;
    wantToPlay?: boolean;
    numOfPlay?: number;
    price?: number;
    condition?: string;
    tags?: string[];
  }>;
  authenticate: (plainText: string) => boolean;
  encryptPassword: (password: string) => string;
  makeSalt: () => string;
}

export interface IPost extends Document {
  title: string;
  body: string;
  photo?: {
    data: Buffer;
    contentType: string;
  };
  postedBy: IUser['_id'];
  created?: Date;
  updated?: Date;
  likes?: string[];
  comments?: IComment[];
}

export interface IComment {
  text: string;
  created?: Date;
  postedBy: IUser['_id'];
}

export interface IEvent extends Document {
  title: string;
  body: string;
  photo?: {
    data: Buffer;
    contentType: string;
  };
  postedBy: IUser['_id'];
  created?: Date;
  updated?: Date;
  eventDate?: Date;
  eventTime?: string;
  location?: string;
  attendees?: string[];
  maxAttendees?: number;
  eventType?: string;
  privateEvent?: boolean;
  invitees?: string[];
}

export interface IBoardgame extends Document {
  bggId: string;
  name: string;
  yearPublished?: number;
  description?: string;
  thumbnail?: string;
  image?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minAge?: number;
  rating?: number;
  weight?: number;
  rank?: number;
  designer?: string[];
  publisher?: string[];
  artist?: string[];
  category?: string[];
  mechanic?: string[];
  isExpansion?: boolean;
  created?: Date;
  updated?: Date;
}

export interface ITradeRequest extends Document {
  requester: IUser['_id'];
  recipient: IUser['_id'];
  offeredGames?: IBoardgame['_id'][];
  requestedGames?: IBoardgame['_id'][];
  message?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created?: Date;
  updated?: Date;
}

export interface IChat extends Document {
  participants: IUser['_id'][];
  messages: IMessage[];
  created?: Date;
  updated?: Date;
  lastMessage?: Date;
}

export interface IMessage {
  sender: IUser['_id'];
  text: string;
  created?: Date;
  read?: boolean;
}

export interface AuthRequest extends Request {
  profile?: IUser;
  auth?: IUser;
}

declare global {
  namespace Express {
    interface Request {
      profile?: IUser;
      auth?: IUser;
      post?: IPost;
      event?: IEvent;
      boardgame?: IBoardgame;
      trade?: ITradeRequest;
      chat?: IChat;
    }
  }
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}