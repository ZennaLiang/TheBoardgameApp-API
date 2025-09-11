import mongoose, { Schema, Model } from 'mongoose';
import { IChat, IMessage } from '../types';


interface IMessageDocument extends IMessage {
  from?: mongoose.Types.ObjectId;
  message?: string;
  timestamp?: Date;
}

interface IChatDocument extends IChat {
  between?: mongoose.Types.ObjectId[];
}

type MessageModel = Model<IMessageDocument>;
type ChatModel = Model<IChatDocument>;

const messageSchema = new Schema<IMessageDocument, MessageModel>({
  // Interface fields
  sender: {
    type: Schema.Types.ObjectId as any,
    ref: "User"
  },
  text: {
    type: String,
    maxlength: 250
  },
  created: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },

  // Legacy fields from original JS model
  from: {
    type: Schema.Types.ObjectId as any,
    ref: "User"
  },
  message: {
    type: String,
    maxlength: 250
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Virtuals removed - they were conflicting with real schema fields

const chatSchema = new Schema<IChatDocument, ChatModel>(
  {
    // Interface fields
    participants: [
      {
        type: Schema.Types.ObjectId as any,
        ref: "User"
      }
    ],
    messages: [messageSchema],
    created: {
      type: Date,
      default: Date.now
    },
    updated: Date,
    lastMessage: {
      type: Date
    },

    // Legacy fields from original JS model
    between: [
      {
        type: Schema.Types.ObjectId as any,
        ref: "User"
      }
    ]
  },
  { toJSON: { virtuals: true } }
);

// Virtuals removed - they were conflicting with real schema fields

// Update lastMessage when messages are added
chatSchema.pre('save', function(this: IChatDocument, next) {
  if (this.messages && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = lastMsg.created || new Date();
  }
  next();
});

const Chat = mongoose.model<IChatDocument, ChatModel>("Chat", chatSchema);
const Message = mongoose.model<IMessageDocument, MessageModel>("Message", messageSchema);

export default Chat;
export { Message };