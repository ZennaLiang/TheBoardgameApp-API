import _ from "lodash";
import formidable from "formidable";
import fs from "fs";
import axios, { AxiosResponse } from "axios";
import XML2JS from "xml2js";
import { Request, Response, NextFunction } from "express";
import User from "../models/user";
import Boardgame from "../models/boardgame";
import { IUser, IBoardgame, ApiResponse } from "../types";

interface UserByNameParams extends Request {
  params: {
    username: string;
  };
}

interface UserByIdParams extends Request {
  params: {
    id: string;
  };
}

interface BggUsernameParams extends Request {
  params: {
    bggUsername: string;
  };
  body: {
    counter?: number;
  };
}

interface FollowRequest extends Request {
  body: {
    userId: string;
    followId: string;
  };
}

interface UnfollowRequest extends Request {
  body: {
    userId: string;
    unfollowId: string;
  };
}

interface BggBoardgameItem {
  $: { objectid: string };
  name: Array<{ _?: string }>;
  thumbnail?: string[];
  yearpublished?: number[];
  comment?: string[];
  numplays: number[];
  status: Array<{
    $: {
      fortrade: string;
      want: string;
      wanttobuy: string;
      wanttoplay: string;
    };
  }>;
  stats: Array<{
    $: {
      minplayers?: string;
      maxplayers?: string;
      minplaytime?: string;
      maxplaytime?: string;
    };
    rating: Array<{
      average: Array<{ $: { value: string } }>;
    }>;
  }>;
}

interface ProcessedBggBoardgame {
  bggId: string;
  title: string;
  imgThumbnail: string;
  avgRating: string;
  yearPublished: number;
  minPlayers: number;
  maxPlayers: number;
  minPlayTime: number;
  maxPlayTime: number;
  forTrade: boolean;
  wantFromTrade: boolean;
  wantFromBuy: boolean;
  wantToPlay: boolean;
  notes: string;
  numOfPlay: number;
}

interface BggCollectionResponse {
  errors?: any;
  items?: {
    $: { totalitems: string };
    item: BggBoardgameItem[];
  };
}

export const findUserByName = async (req: UserByNameParams, res: Response): Promise<Response> => {
  try {
    const guruName = req.params.username.toLowerCase();

    const user = await User.findOne({ name: guruName }).exec() as IUser;

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found"
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      data: { user }
    } as ApiResponse<{ user: IUser }>);
  } catch (error) {
    console.error('Error finding user by name:', error);
    return res.status(500).json({
      success: false,
      error: "Error finding user"
    } as ApiResponse);
  }
};

export const findUserById = async (req: UserByIdParams, res: Response, next: NextFunction, id: string): Promise<void> => {
  try {
    const user = await User.findById(id)
      .populate("following", "_id name")
      .populate("followers", "_id name")
      .populate("friends", "_id name")
      .populate(
        "boardgames.boardgame",
        "_id bggId title yearPublished minPlayers maxPlayers minPlayTime maxPlayTime imgThumbnail avgRating"
      )
      .exec() as IUser;

    if (!user) {
      res.status(400).json({
        success: false,
        error: "User not found"
      } as ApiResponse);
      return;
    }

    req.profile = user;
    next();
  } catch (error) {
    console.error('Error finding user by ID:', error);
    res.status(500).json({
      success: false,
      error: "Error finding user"
    } as ApiResponse);
  }
};

export const hasAuthorization = (req: Request, res: Response, next: NextFunction): void => {
  const profile = req.profile as IUser;
  const auth = req.auth as IUser;

  if (!profile || !auth) {
    res.status(401).json({
      success: false,
      error: "Authentication required"
    } as ApiResponse);
    return;
  }

  const sameUser = profile._id.toString() === auth._id.toString();
  const adminUser = auth.role === "admin";
  const authorized = sameUser || adminUser;

  if (!authorized) {
    res.status(403).json({
      success: false,
      error: "User is not authorized to perform this action"
    } as ApiResponse);
    return;
  }

  next();
};

export const findAllUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const users = await User.find()
      .select("name email updated created role photo.contentType")
      .exec() as IUser[];

    return res.json({
      success: true,
      data: users
    } as ApiResponse<IUser[]>);
  } catch (error) {
    console.error('Error finding all users:', error);
    return res.status(400).json({
      success: false,
      error: "Error fetching users"
    } as ApiResponse);
  }
};

export const getUser = (req: Request, res: Response): Response => {
  if (!req.profile) {
    return res.status(404).json({
      success: false,
      error: "User profile not found"
    } as ApiResponse);
  }

  const user = req.profile as IUser;
  user.hashed_password = undefined;
  user.salt = undefined;

  return res.json({
    success: true,
    data: user
  } as ApiResponse<IUser>);
};

export const updateUser = (req: Request, res: Response): void => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: "Photo could not be uploaded"
      } as ApiResponse);
    }

    try {
      if (!req.profile) {
        return res.status(404).json({
          success: false,
          error: "User profile not found"
        } as ApiResponse);
      }

      let user = req.profile as IUser;
      user = _.extend(user, fields);
      user.updated = new Date();

      if (files.photo && Array.isArray(files.photo)) {
        const photoFile = files.photo[0];
        if (photoFile.filepath) {
          user.photo = {
            data: fs.readFileSync(photoFile.filepath),
            contentType: photoFile.mimetype || 'image/jpeg'
          };
        }
      } else if (files.photo && typeof files.photo === 'object' && 'filepath' in files.photo) {
        if (files.photo.filepath) {
          user.photo = {
            data: fs.readFileSync(files.photo.filepath),
            contentType: files.photo.mimetype || 'image/jpeg'
          };
        }
      }

      const savedUser = await user.save();
      savedUser.hashed_password = undefined;
      savedUser.salt = undefined;

      return res.json({
        success: true,
        data: { user: savedUser }
      } as ApiResponse<{ user: IUser }>);
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(400).json({
        success: false,
        error: "Error updating user"
      } as ApiResponse);
    }
  });
};

const fetchCollection = async (url: string): Promise<AxiosResponse | undefined> => {
  try {
    const response = await axios.get(url);
    return response;
  } catch (error) {
    console.error("Error fetching collection:", error);
    return undefined;
  }
};

const processBggBoardgame = (bgItem: BggBoardgameItem): ProcessedBggBoardgame => {
  const bgStats = bgItem.status[0].$;
  const boardgameInfo = bgItem.stats[0].$;
  
  const bg: ProcessedBggBoardgame = {
    bggId: bgItem.$.objectid,
    title: bgItem.name[0]._ === undefined ? "Missing Name" : bgItem.name[0]._,
    imgThumbnail: bgItem.thumbnail === undefined ? "" : bgItem.thumbnail[0],
    avgRating:
      bgItem.stats[0] === undefined ||
      isNaN(parseFloat(bgItem.stats[0].rating[0].average[0].$.value))
        ? "N/A"
        : bgItem.stats[0].rating[0].average[0].$.value,
    yearPublished:
      bgItem.yearpublished === undefined || isNaN(bgItem.yearpublished[0])
        ? -1
        : bgItem.yearpublished[0],
    minPlayers:
      bgItem.stats[0] === undefined || isNaN(parseInt(boardgameInfo.minplayers || ""))
        ? -1
        : parseInt(boardgameInfo.minplayers || ""),
    maxPlayers:
      bgItem.stats[0] === undefined || isNaN(parseInt(boardgameInfo.maxplayers || ""))
        ? -1
        : parseInt(boardgameInfo.maxplayers || ""),
    minPlayTime:
      bgItem.stats[0] === undefined || isNaN(parseInt(boardgameInfo.minplaytime || ""))
        ? -1
        : parseInt(boardgameInfo.minplaytime || ""),
    maxPlayTime:
      bgItem.stats[0] === undefined || isNaN(parseInt(boardgameInfo.maxplaytime || ""))
        ? -1
        : parseInt(boardgameInfo.maxplaytime || ""),
    forTrade: bgStats.fortrade === "1",
    wantFromTrade: bgStats.want === "1",
    wantFromBuy: bgStats.wanttobuy === "1",
    wantToPlay: bgStats.wanttoplay === "1",
    notes: bgItem.comment === undefined ? "" : bgItem.comment[0],
    numOfPlay: bgItem.numplays[0]
  };

  return bg;
};

const processNewBoardgame = (bgItem: ProcessedBggBoardgame) => {
  return {
    bggId: bgItem.bggId,
    title: bgItem.title,
    imgThumbnail: bgItem.imgThumbnail,
    avgRating: bgItem.avgRating,
    yearPublished: bgItem.yearPublished,
    minPlayers: bgItem.minPlayers,
    maxPlayers: bgItem.maxPlayers,
    minPlayTime: bgItem.minPlayTime,
    maxPlayTime: bgItem.maxPlayTime
  };
};

const processNewBoardgameStats = (bgItem: ProcessedBggBoardgame, boardgameInfo: IBoardgame) => {
  return {
    boardgame: boardgameInfo._id,
    forTrade: bgItem.forTrade,
    wantFromTrade: bgItem.wantFromTrade,
    wantFromBuy: bgItem.wantFromBuy,
    wantToPlay: bgItem.wantToPlay,
    numOfPlay: bgItem.numOfPlay,
    notes: bgItem.notes
  };
};

export const updateBggUsername = async (req: BggUsernameParams, res: Response): Promise<Response> => {
  try {
    if (!req.profile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found"
      } as ApiResponse);
    }

    let user = req.profile as IUser;
    user.updated = new Date();
    user.bggUsername = req.params.bggUsername;

    const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${req.params.bggUsername}&subtype=boardgame&stats=1`;

    if (req.body.counter === undefined) {
      req.body.counter = 0;
    } else {
      req.body.counter += 1;
    }

    if (req.body.counter > 5) {
      return res.status(419).json({
        success: false,
        error: "WOW! Collection is too large to process."
      } as ApiResponse);
    }

    const response = await fetchCollection(url);

    if (!response) {
      return res.status(404).json({
        success: false,
        error: "Error fetching data. Please try again later"
      } as ApiResponse);
    }

    if (response.status === 200) {
      let boardgames: ProcessedBggBoardgame[] = [];

      XML2JS.parseString(response.data, async (err, result: BggCollectionResponse) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: "Error parsing BGG response"
          } as ApiResponse);
        }

        if (result.errors && result.items === undefined) {
          return res.status(404).json({
            success: false,
            error: "BGG username not found. Please try again."
          } as ApiResponse);
        }

        if (result.items && result.items.$.totalitems !== "0") {
          result.items.item.forEach(bgItem => {
            const boardgame = processBggBoardgame(bgItem);
            boardgames.push(boardgame);
          });

          // Process each boardgame
          const processPromises = boardgames.map(async (bgItem) => {
            try {
              const newBg = processNewBoardgame(bgItem);
              const foundBoardgame = await Boardgame.findOneAndUpdate(
                { bggId: newBg.bggId },
                newBg,
                { upsert: true, new: true }
              ) as IBoardgame;

              if (foundBoardgame && user.boardgames) {
                const findUserBoardgame = user.boardgames.find(
                  (bg: any) =>
                    bg.boardgame != undefined && 
                    bg.boardgame != null &&
                    bg.boardgame._id &&
                    bg.boardgame._id.toString() === foundBoardgame._id.toString()
                );

                if (findUserBoardgame) {
                  // Update existing boardgame stats
                  findUserBoardgame.forTrade = bgItem.forTrade;
                  findUserBoardgame.wantFromTrade = bgItem.wantFromTrade;
                  findUserBoardgame.wantFromBuy = bgItem.wantFromBuy;
                  findUserBoardgame.wantToPlay = bgItem.wantToPlay;
                  findUserBoardgame.numOfPlay = bgItem.numOfPlay;
                  findUserBoardgame.notes = bgItem.notes;

                  await User.findOneAndUpdate(
                    {
                      _id: user._id,
                      "boardgames.boardgame": foundBoardgame._id
                    },
                    { $set: { "boardgames.$": findUserBoardgame } },
                    { new: true }
                  );
                } else {
                  // Add new boardgame to user
                  const newBgStat = processNewBoardgameStats(bgItem, foundBoardgame);
                  await User.findByIdAndUpdate(
                    user._id,
                    { $push: { boardgames: newBgStat } },
                    { upsert: true, new: true }
                  );
                }
              }
            } catch (error) {
              console.error('Error processing boardgame:', error);
            }
          });

          await Promise.all(processPromises);
        }

        const savedUser = await user.save();
        savedUser.hashed_password = undefined;
        savedUser.salt = undefined;

        return res.status(200).json({
          success: true,
          data: { user: savedUser }
        } as ApiResponse<{ user: IUser }>);
      });
    } else if (response.status === 202) {
      setTimeout(() => {
        updateBggUsername(req, res);
      }, 5000);
      return res.status(202).json({
        success: false,
        message: "BGG is processing request, please wait..."
      } as ApiResponse);
    }

    return res.status(404).json({
      success: false,
      error: "Error fetching data. Please try again later"
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating BGG username:', error);
    return res.status(500).json({
      success: false,
      error: "Error updating BGG username"
    } as ApiResponse);
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.profile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found"
      } as ApiResponse);
    }

    const user = req.profile as IUser;
    await user.deleteOne();

    return res.json({
      success: true,
      message: "User deleted successfully"
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(400).json({
      success: false,
      error: "Error deleting user"
    } as ApiResponse);
  }
};

export const getUserPhoto = (req: Request, res: Response): Response => {
  if (!req.profile?.photo) {
    return res.status(404).json({
      success: false,
      error: "Photo not found"
    } as ApiResponse);
  }

  res.set("Content-Type", req.profile.photo.contentType);
  return res.send(req.profile.photo.data);
};

export const addFollowing = async (req: FollowRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await User.findByIdAndUpdate(
      req.body.userId,
      { $push: { following: req.body.followId } }
    );
    next();
  } catch (error) {
    console.error('Error adding following:', error);
    res.status(400).json({
      success: false,
      error: "Error adding following"
    } as ApiResponse);
  }
};

export const addFollower = async (req: FollowRequest, res: Response): Promise<Response> => {
  try {
    const result = await User.findByIdAndUpdate(
      req.body.followId,
      { $push: { followers: req.body.userId } },
      { new: true }
    )
      .populate("following", "_id name")
      .populate("followers", "_id name")
      .exec() as IUser;

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      } as ApiResponse);
    }

    result.hashed_password = undefined;
    result.salt = undefined;

    return res.json({
      success: true,
      data: result
    } as ApiResponse<IUser>);
  } catch (error) {
    console.error('Error adding follower:', error);
    return res.status(400).json({
      success: false,
      error: "Error adding follower"
    } as ApiResponse);
  }
};

export const removeFollowing = async (req: UnfollowRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await User.findByIdAndUpdate(
      req.body.userId,
      { $pull: { following: req.body.unfollowId } }
    );
    next();
  } catch (error) {
    console.error('Error removing following:', error);
    res.status(400).json({
      success: false,
      error: "Error removing following"
    } as ApiResponse);
  }
};

export const removeFollower = async (req: UnfollowRequest, res: Response): Promise<Response> => {
  try {
    const result = await User.findByIdAndUpdate(
      req.body.unfollowId,
      { $pull: { followers: req.body.userId } },
      { new: true }
    )
      .populate("following", "_id name")
      .populate("followers", "_id name")
      .exec() as IUser;

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      } as ApiResponse);
    }

    result.hashed_password = undefined;
    result.salt = undefined;

    return res.json({
      success: true,
      data: result
    } as ApiResponse<IUser>);
  } catch (error) {
    console.error('Error removing follower:', error);
    return res.status(400).json({
      success: false,
      error: "Error removing follower"
    } as ApiResponse);
  }
};

export const findPeople = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.profile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found"
      } as ApiResponse);
    }

    const following = req.profile.following ? [...req.profile.following] : [];
    following.push(req.profile._id);

    const users = await User.find({ _id: { $nin: following } })
      .select("name")
      .exec() as IUser[];

    return res.json({
      success: true,
      data: users
    } as ApiResponse<IUser[]>);
  } catch (error) {
    console.error('Error finding people:', error);
    return res.status(400).json({
      success: false,
      error: "Error finding people"
    } as ApiResponse);
  }
};