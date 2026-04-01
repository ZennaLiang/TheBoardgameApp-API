import formidable from "formidable";
import fs from "fs";
import _ from "lodash";
import { Request, Response, NextFunction } from "express";
import Event from "../models/event";
import { IEvent, IUser, ApiResponse } from "../types";

interface EventByIdParams extends Request {
  params: {
    id: string;
  };
}

export const findEventById = async (req: EventByIdParams, res: Response, next: NextFunction, id: string): Promise<void> => {
  try {
    const event = await Event.findById(id)
      .populate("owner", "_id name")
      .exec() as IEvent;

    if (!event) {
      res.status(400).json({
        success: false,
        error: "Event not found"
      } as ApiResponse);
      return;
    }

    req.event = event;
    next();
  } catch (error) {
    console.error('Error finding event by ID:', error);
    res.status(500).json({
      success: false,
      error: "Error finding event"
    } as ApiResponse);
  }
};

export const eventsByUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.profile?._id) {
      return res.status(401).json({
        success: false,
        error: "User profile not found"
      } as ApiResponse);
    }

    const events = await Event.find({ owner: req.profile._id })
      .populate("owner", "_id name")
      .populate("boardgames", "_id title bggId")
      .select("_id title description startDate endDate allDay bgColor createdDate")
      .sort("startDate")
      .exec() as IEvent[];

    return res.json({
      success: true,
      data: events
    } as ApiResponse<IEvent[]>);
  } catch (error) {
    console.error('Error fetching events by user:', error);
    return res.status(400).json({
      success: false,
      error: "Error fetching events"
    } as ApiResponse);
  }
};

export const createEvent = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.auth?._id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      } as ApiResponse);
    }

    const event = new Event(req.body);
    event.postedBy = req.auth._id;

    const savedEvent = await event.save();

    return res.json({
      success: true,
      data: savedEvent
    } as ApiResponse<IEvent>);
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(400).json({
      success: false,
      error: "Error creating event"
    } as ApiResponse);
  }
};

export const getEvent = (req: Request, res: Response): Response => {
  if (!req.event) {
    return res.status(404).json({
      success: false,
      error: "Event not found"
    } as ApiResponse);
  }

  return res.json({
    success: true,
    data: req.event
  } as ApiResponse<IEvent>);
};

export const isOwner = (req: Request, res: Response, next: NextFunction): void => {
  const event = req.event as IEvent;
  const auth = req.auth as IUser;

  if (!event || !auth) {
    res.status(401).json({
      success: false,
      error: "Authentication required"
    } as ApiResponse);
    return;
  }

  const sameUser = event.postedBy.toString() === auth._id.toString();
  const adminUser = auth.role === "admin";
  const isOwner = sameUser || adminUser;

  if (!isOwner) {
    res.status(403).json({
      success: false,
      error: "User is not authorized to perform this action"
    } as ApiResponse);
    return;
  }

  next();
};

export const updateEvent = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.event) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      } as ApiResponse);
    }

    let event = req.event as IEvent;
    event = _.extend(event, req.body);
    event.updated = new Date();

    const savedEvent = await event.save();

    return res.json({
      success: true,
      data: savedEvent
    } as ApiResponse<IEvent>);
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(400).json({
      success: false,
      error: "Error updating event"
    } as ApiResponse);
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.event) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      } as ApiResponse);
    }

    const event = req.event as IEvent;
    await event.deleteOne();

    return res.json({
      success: true,
      message: "Event deleted successfully"
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(400).json({
      success: false,
      error: "Error deleting event"
    } as ApiResponse);
  }
};