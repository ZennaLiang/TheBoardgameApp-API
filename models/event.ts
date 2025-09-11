import mongoose, { Schema, Model } from 'mongoose';
import { IEvent } from '../types';

const { ObjectId } = Schema.Types;

interface IEventDocument extends IEvent {
  description?: string;
  startDate?: Date;
  endDate?: Date;
  allDay?: boolean;
  boardgames?: mongoose.Types.ObjectId[];
  owner?: mongoose.Types.ObjectId;
  bgColor?: string;
  createdDate?: Date;
}

type EventModel = Model<IEventDocument>;

const eventSchema = new Schema<IEventDocument, EventModel>({
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
  },
  description: {
    type: String,
  },
  photo: {
    data: Buffer,
    contentType: String
  },
  postedBy: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  eventDate: {
    type: Date,
  },
  eventTime: {
    type: String,
  },
  location: {
    type: String,
  },
  allDay: {
    type: Boolean,
  },
  invitees: [{ type: ObjectId, ref: "User" }],
  attendees: [{ type: ObjectId, ref: "User" }],
  maxAttendees: {
    type: Number,
  },
  eventType: {
    type: String,
  },
  privateEvent: {
    type: Boolean,
  },
  boardgames: [{ type: ObjectId, ref: "Boardgame" }],
  owner: {
    type: ObjectId,
    ref: "User",
  },
  bgColor: {
    type: String,
    default: "bg-primary",
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: Date,
});

const Event = mongoose.model<IEventDocument, EventModel>("Event", eventSchema);

export default Event;