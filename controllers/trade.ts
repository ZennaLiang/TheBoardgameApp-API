import { Request, Response } from "express";
import mongoose from "mongoose";
import Trade from "../models/tradeRequest";
import { ITradeRequest, IBoardgame, ApiResponse } from "../types";

interface CreateTradeRequest extends Request {
  body: {
    userID: string;
    searchedUserID: string;
    userTradeList: IBoardgame['_id'][];
    searchedUserTradeList: IBoardgame['_id'][];
    notes?: string;
  };
}

interface TradeByIdParams extends Request {
  params: {
    tradeId: string;
  };
}

interface TradesByUserParams extends Request {
  params: {
    userId: string;
  };
}

interface UpdateTradeStatusRequest extends Request {
  params: {
    tradeId: string;
  };
  body: {
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  };
}

export const createTrade = async (req: CreateTradeRequest, res: Response): Promise<Response> => {
  try {
    const tradeData = {
      requester: new mongoose.Types.ObjectId(req.body.userID),
      recipient: new mongoose.Types.ObjectId(req.body.searchedUserID),
      offeredGames: req.body.userTradeList,
      requestedGames: req.body.searchedUserTradeList,
      message: req.body.notes || "",
      status: 'pending' as const,
      created: new Date(),
      updated: new Date()
    };

    const trade = await Trade.create(tradeData as any);

    return res.status(200).json({
      success: true,
      data: { tradeId: trade._id?.toString() },
      message: "Trade request created successfully"
    } as ApiResponse<{ tradeId: string }>);
  } catch (error) {
    console.error('Error creating trade:', error);
    return res.status(400).json({
      success: false,
      error: "Error creating trade request"
    } as ApiResponse);
  }
};

export const getAllTrades = async (req: Request, res: Response): Promise<Response> => {
  try {
    const perPage = 5;

    const totalItems = await Trade.countDocuments();

    if (totalItems === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No trades found"
      } as ApiResponse<ITradeRequest[]>);
    }

    const trades = await Trade.find()
      .populate("requester", "_id name")
      .populate("recipient", "_id name")
      .select("offeredGames requestedGames message status created")
      .exec() as ITradeRequest[];

    return res.status(200).json({
      success: true,
      data: trades,
      totalItems
    } as ApiResponse<ITradeRequest[]> & { totalItems: number });
  } catch (error) {
    console.error('Error fetching all trades:', error);
    return res.status(500).json({
      success: false,
      error: "Error fetching trades"
    } as ApiResponse);
  }
};

export const getTradeById = async (req: TradeByIdParams, res: Response): Promise<Response> => {
  try {
    const tradeId = req.params.tradeId;

    const trade = await Trade.findById(tradeId)
      .populate("requester", "_id name")
      .populate("recipient", "_id name")
      .exec() as ITradeRequest;

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: "Trade not found"
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      data: trade
    } as ApiResponse<ITradeRequest>);
  } catch (error) {
    console.error('Error fetching trade by ID:', error);
    return res.status(500).json({
      success: false,
      error: "Error fetching trade"
    } as ApiResponse);
  }
};

export const getTradesById = async (req: TradesByUserParams, res: Response): Promise<Response> => {
  try {
    const userId = req.params.userId;
    const perPage = 5;

    const query = {
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    };

    const totalItems = await Trade.countDocuments(query);

    if (totalItems === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No trades found for this user"
      } as ApiResponse<ITradeRequest[]>);
    }

    const trades = await Trade.find(query)
      .populate("requester", "_id name photo")
      .populate("recipient", "_id name photo")
      .select("offeredGames requestedGames status message created")
      .exec() as ITradeRequest[];

    return res.status(200).json({
      success: true,
      data: trades,
      totalItems
    } as ApiResponse<ITradeRequest[]> & { totalItems: number });
  } catch (error) {
    console.error('Error fetching trades by user ID:', error);
    return res.status(500).json({
      success: false,
      error: "Error fetching user trades"
    } as ApiResponse);
  }
};

export const deleteTrade = async (req: TradeByIdParams, res: Response): Promise<Response> => {
  try {
    const tradeId = req.params.tradeId;

    const deletedTrade = await Trade.findByIdAndDelete(tradeId);

    if (!deletedTrade) {
      return res.status(404).json({
        success: false,
        error: "Trade not found"
      } as ApiResponse);
    }

    console.log("Trade deleted successfully");
    return res.status(200).json({
      success: true,
      message: "Trade deleted successfully"
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting trade:', error);
    return res.status(500).json({
      success: false,
      error: "Error deleting trade"
    } as ApiResponse);
  }
};

export const updateTradeStatus = async (req: UpdateTradeStatusRequest, res: Response): Promise<Response> => {
  try {
    const tradeId = req.params.tradeId;
    const status = req.body.status;

    console.log(`Updating trade ${tradeId} status to:`, status);

    const result = await Trade.updateOne(
      { _id: tradeId },
      { 
        status: status,
        updated: new Date()
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Trade not found"
      } as ApiResponse);
    }

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        error: "Trade status was not updated"
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: "Trade status updated successfully",
      data: { status }
    } as ApiResponse<{ status: string }>);
  } catch (error) {
    console.error('Error updating trade status:', error);
    return res.status(500).json({
      success: false,
      error: "Error updating trade status"
    } as ApiResponse);
  }
};