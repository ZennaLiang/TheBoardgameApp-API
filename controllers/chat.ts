import { Request, Response, NextFunction } from "express";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Chat from "../models/chat";
import User from "../models/user";
import { IChat, IUser, IMessage, ApiResponse } from "../types";

const { ObjectId } = mongoose.Types;

interface AuthenticatedSocket extends Socket {
  user?: {
    _id: string;
    role?: string;
  };
}

interface JWTPayload {
  _id: string;
  role?: string;
  iss?: string;
}

interface ChatMessage {
  _id: string;
  message: string;
  timestamp: number;
  from: string;
}

interface CreateChatRequest extends Request {
  body: {
    who: string;
  };
}

interface CreateMessageRequest extends Request {
  body: {
    _id: string;
    message: string;
  };
}

interface SearchUserRequest extends Request {
  body: {
    name: string;
  };
}

export const initSocket = (io: Server): void => {
  io.on('connection', (conn: AuthenticatedSocket) => {
    console.log('User connected to socket');
    
    conn.on('auth', (data: { token: string }) => {
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET not configured');
        return;
      }
      
      jwt.verify(data.token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      }, (err, decoded) => {
        if (err) {
          console.error('JWT ERROR:', err);
        } else {
          const payload = decoded as JWTPayload;
          console.log(`JWT SUCCESS - user ${payload._id} connected securely`);
          conn.user = payload;
        }
      });
    });

    conn.on("join", (data: { chatId: string }) => {
      conn.join(data.chatId);
    });

    conn.on("chat", async (data: { _id: string; message: string }) => {
      try {
        const chat = await Chat.findById(data._id) as IChat;
        
        if (!chat) {
          console.error('Chat not found');
          return;
        }
        
        if (!conn.user) {
          console.error('User not authenticated');
          return;
        }

        const msgObject: ChatMessage = {
          _id: (chat as any)._id.toString(),
          message: data.message,
          timestamp: Date.now(),
          from: conn.user._id
        };

        chat.messages.push(msgObject as any);

        const saved = await chat.save();
        if (saved) {
          io.to(data._id).emit("newMsg", msgObject);
        }
      } catch (error) {
        console.error('CHAT ERROR:', error);
      }
    });
  });
};

export const getChats = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.auth?._id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      } as ApiResponse);
    }

    const chats = await Chat.find({ between: req.auth._id })
      .populate("between", "_id name photo")
      .exec() as IChat[];

    return res.json({
      success: true,
      data: chats
    } as ApiResponse<IChat[]>);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({
      success: false,
      error: "Error fetching chats"
    } as ApiResponse);
  }
};

export const createChat = async (req: CreateChatRequest, res: Response): Promise<Response> => {
  try {
    if (!req.auth?._id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      } as ApiResponse);
    }

    const user = await User.findOne({ name: req.body.who.toLowerCase() }) as IUser;

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found"
      } as ApiResponse);
    }

    const existingChat = await Chat.findOne({
      "$and": [{ between: user._id }, { between: req.auth._id }]
    }) as IChat;

    if (existingChat) {
      return res.status(409).json({
        success: false,
        error: "Chat already exists"
      } as ApiResponse);
    }

    const chat = new Chat({
      between: [
        new ObjectId(req.auth._id),
        user._id
      ]
    });

    const savedChat = await chat.save();
    const populatedChat = await Chat.findById(savedChat._id)
      .populate("between", "_id name photo")
      .populate("messages.from", "_id name") as IChat;

    return res.json({
      success: true,
      data: populatedChat
    } as ApiResponse<IChat>);
  } catch (error) {
    console.error('Error creating chat:', error);
    return res.status(500).json({
      success: false,
      error: "Error creating chat"
    } as ApiResponse);
  }
};

export const getChat = async (req: Request, res: Response): Promise<Response> => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate("between", "_id name photo")
      .populate("messages.from", "_id name")
      .exec() as IChat;

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: "Chat not found"
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: chat
    } as ApiResponse<IChat>);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return res.status(500).json({
      success: false,
      error: "Error fetching chat"
    } as ApiResponse);
  }
};

export const createMessage = async (req: CreateMessageRequest, res: Response): Promise<Response> => {
  try {
    if (!req.auth?._id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      } as ApiResponse);
    }

    const chat = await Chat.findById(req.body._id) as IChat;

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: "Chat not found"
      } as ApiResponse);
    }

    const msgObject: Partial<IMessage> = {
      text: req.body.message,
      created: new Date(),
      sender: req.auth._id
    };

    chat.messages.push(msgObject as IMessage);
    
    await chat.save();

    return res.status(200).json({
      success: true,
      data: msgObject
    } as ApiResponse<Partial<IMessage>>);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(400).json({
      success: false,
      error: "Error creating message"
    } as ApiResponse);
  }
};

const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const searchUser = async (req: SearchUserRequest, res: Response): Promise<Response> => {
  try {
    const sanitized = escapeRegex(req.body.name.toLowerCase());
    const regex = new RegExp(`^${sanitized}`);
    const users = await User.find({ name: regex }).limit(5).exec() as IUser[];
    
    return res.json({
      success: true,
      data: users
    } as ApiResponse<IUser[]>);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({
      success: false,
      error: "Error searching users"
    } as ApiResponse);
  }
};