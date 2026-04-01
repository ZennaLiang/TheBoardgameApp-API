import mongoose, { Schema, Model } from 'mongoose';
import { ITradeRequest } from '../types';


interface ITradeItem {
  id: string;
  name: string;
  condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'N/A';
  price?: number;
  tags?: string[];
}

interface ITradeRequestDocument extends ITradeRequest {
  tradeSender?: mongoose.Types.ObjectId;
  tradeReceiver?: mongoose.Types.ObjectId;
  tradeOffer?: ITradeItem[];
  tradeWants?: ITradeItem[];
  notes?: string;
  createdDate?: Date;
}

type TradeRequestModel = Model<ITradeRequestDocument>;

const tradeRequestSchema = new Schema<ITradeRequestDocument, TradeRequestModel>({
  // Interface fields
  requester: {
    type: Schema.Types.ObjectId as any,
    ref: "User"
  },
  recipient: {
    type: Schema.Types.ObjectId as any,
    ref: "User"
  },
  offeredGames: [{ type: Schema.Types.ObjectId as any, ref: "Boardgame" }],
  requestedGames: [{ type: Schema.Types.ObjectId as any, ref: "Boardgame" }],
  message: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: Date,

  // Legacy fields from original JS model
  tradeSender: {
    type: Schema.Types.ObjectId as any,
    ref: "User"
  },
  tradeReceiver: {
    type: Schema.Types.ObjectId as any,
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
      tags: [{ type: String, default: [] }]
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
      tags: [{ type: String, default: [] }]
    }
  ],
  notes: {
    type: String,
    required: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});

// Virtuals removed - they were conflicting with real schema fields

const TradeRequest = mongoose.model<ITradeRequestDocument, TradeRequestModel>("Trades", tradeRequestSchema);

export default TradeRequest;