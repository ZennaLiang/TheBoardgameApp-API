import mongoose, { Schema, Model } from 'mongoose';
import { ITradeRequest } from '../types';

const { ObjectId } = Schema.Types;

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
    type: ObjectId,
    ref: "User"
  },
  recipient: {
    type: ObjectId,
    ref: "User"
  },
  offeredGames: [{ type: ObjectId, ref: "Boardgame" }],
  requestedGames: [{ type: ObjectId, ref: "Boardgame" }],
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
    type: ObjectId,
    ref: "User"
  },
  tradeReceiver: {
    type: ObjectId,
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

// Add virtuals to map between different field names
tradeRequestSchema.virtual('requester').get(function(this: ITradeRequestDocument) {
  return this.tradeSender;
});

tradeRequestSchema.virtual('recipient').get(function(this: ITradeRequestDocument) {
  return this.tradeReceiver;
});

tradeRequestSchema.virtual('message').get(function(this: ITradeRequestDocument) {
  return this.notes;
});

const TradeRequest = mongoose.model<ITradeRequestDocument, TradeRequestModel>("Trades", tradeRequestSchema);

export default TradeRequest;