import mongoose, { Schema, Model } from 'mongoose';
import { IChat, IMessage } from '../types';

const { ObjectId } = Schema.Types;

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
    type: ObjectId,
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
    type: ObjectId,
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

// Add virtuals to map between different field names
messageSchema.virtual('sender').get(function(this: IMessageDocument) {
  return this.from;
});

messageSchema.virtual('text').get(function(this: IMessageDocument) {
  return this.message;
});

messageSchema.virtual('created').get(function(this: IMessageDocument) {
  return this.timestamp;
});

const chatSchema = new Schema<IChatDocument, ChatModel>(
  {
    // Interface fields
    participants: [
      {
        type: ObjectId,
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
        type: ObjectId,
        ref: "User"
      }
    ]
  },
  { toJSON: { virtuals: true } }
);

// Add virtuals to map between different field names
chatSchema.virtual('participants').get(function(this: IChatDocument) {
  return this.between;
});

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