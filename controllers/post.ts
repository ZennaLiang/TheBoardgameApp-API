import formidable from "formidable";
import fs from "fs";
import _ from "lodash";
import { Request, Response, NextFunction } from "express";
import Post from "../models/post";
import { IPost, IUser, IComment, ApiResponse } from "../types";

interface PostByIdParams extends Request {
  params: {
    id: string;
  };
}

interface GetPostsQuery extends Request {
  query: {
    page?: string;
  };
}

interface LikePostRequest extends Request {
  body: {
    postId: string;
    userId: string;
  };
}

interface CommentPostRequest extends Request {
  body: {
    postId: string;
    userId: string;
    comment: IComment;
  };
}

interface UncommentPostRequest extends Request {
  body: {
    postId: string;
    comment: {
      _id: string;
    };
  };
}

export const findPostById = async (req: PostByIdParams, res: Response, next: NextFunction, id: string): Promise<void> => {
  try {
    const post = await Post.findById(id)
      .populate("postedBy", "_id name")
      .populate("comments.postedBy", "_id name")
      .exec() as IPost;

    if (!post) {
      res.status(400).json({
        success: false,
        error: "Post not found"
      } as ApiResponse);
      return;
    }

    req.post = post;
    next();
  } catch (error) {
    console.error('Error finding post by ID:', error);
    res.status(500).json({
      success: false,
      error: "Error finding post"
    } as ApiResponse);
  }
};

export const getPost = (req: Request, res: Response): Response => {
  if (!req.post) {
    return res.status(404).json({
      success: false,
      error: "Post not found"
    } as ApiResponse);
  }

  return res.json({
    success: true,
    data: req.post
  } as ApiResponse<IPost>);
};

export const getPosts = async (req: GetPostsQuery, res: Response): Promise<Response> => {
  try {
    const currentPage = parseInt(req.query.page || "1");
    const perPage = 5;

    const totalItems = await Post.countDocuments();

    const posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .populate("comments", "text createdDate")
      .populate("comments.postedBy", "_id name")
      .populate("postedBy", "_id name")
      .sort({ createdDate: -1 })
      .limit(perPage)
      .select("_id title body likes createdDate photo.contentType")
      .exec() as IPost[];

    return res.status(200).json({
      success: true,
      data: posts,
      totalItems,
      currentPage,
      totalPages: Math.ceil(totalItems / perPage)
    } as ApiResponse<IPost[]> & { totalItems: number; currentPage: number; totalPages: number });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({
      success: false,
      error: "Error fetching posts"
    } as ApiResponse);
  }
};

export const postsByUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.profile?._id) {
      return res.status(401).json({
        success: false,
        error: "User profile not found"
      } as ApiResponse);
    }

    const posts = await Post.find({ postedBy: req.profile._id })
      .populate("postedBy", "_id name")
      .select("_id title body createdDate likes")
      .sort("_created")
      .exec() as IPost[];

    return res.json({
      success: true,
      data: posts
    } as ApiResponse<IPost[]>);
  } catch (error) {
    console.error('Error fetching posts by user:', error);
    return res.status(400).json({
      success: false,
      error: "Error fetching posts by user"
    } as ApiResponse);
  }
};

export const createPost = (req: Request, res: Response): void => {
  const form = formidable({
    keepExtensions: true
  });
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: "Image could not be uploaded"
      } as ApiResponse);
    }

    try {
      if (!req.profile) {
        return res.status(401).json({
          success: false,
          error: "User profile not found"
        } as ApiResponse);
      }

      const post = new Post(fields);
      
      req.profile.hashed_password = undefined;
      req.profile.salt = undefined;
      post.postedBy = req.profile._id;

      if (files.photo) {
        const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;
        if (photoFile && 'filepath' in photoFile) {
          post.photo = {
            data: fs.readFileSync(photoFile.filepath),
            contentType: photoFile.mimetype || 'image/jpeg'
          };
        }
      }

      const savedPost = await post.save();
      
      return res.json({
        success: true,
        data: savedPost
      } as ApiResponse<IPost>);
    } catch (error) {
      console.error('Error creating post:', error);
      return res.status(400).json({
        success: false,
        error: "Error creating post"
      } as ApiResponse);
    }
  });
};

export const isPoster = (req: Request, res: Response, next: NextFunction): void => {
  const post = req.post as IPost;
  const auth = req.auth as IUser;

  if (!post || !auth) {
    res.status(401).json({
      success: false,
      error: "Authentication required"
    } as ApiResponse);
    return;
  }

  const sameUser = post.postedBy.toString() === auth._id.toString();
  const adminUser = auth.role === "admin";
  const isPoster = sameUser || adminUser;

  if (!isPoster) {
    res.status(403).json({
      success: false,
      error: "User is not authorized"
    } as ApiResponse);
    return;
  }

  next();
};

export const updatePost = (req: Request, res: Response): void => {
  const form = formidable({
    keepExtensions: true
  });
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: "Photo could not be uploaded"
      } as ApiResponse);
    }

    try {
      if (!req.post) {
        return res.status(404).json({
          success: false,
          error: "Post not found"
        } as ApiResponse);
      }

      let post = req.post as IPost;
      post = _.extend(post, fields);
      post.updated = new Date();

      if (files.photo) {
        const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;
        if (photoFile && 'filepath' in photoFile) {
          post.photo = {
            data: fs.readFileSync(photoFile.filepath),
            contentType: photoFile.mimetype || 'image/jpeg'
          };
        }
      }

      const savedPost = await post.save();

      return res.json({
        success: true,
        data: savedPost
      } as ApiResponse<IPost>);
    } catch (error) {
      console.error('Error updating post:', error);
      return res.status(400).json({
        success: false,
        error: "Error updating post"
      } as ApiResponse);
    }
  });
};

export const deletePost = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.post) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      } as ApiResponse);
    }

    const post = req.post as IPost;
    await post.deleteOne();

    return res.json({
      success: true,
      message: "Post deleted successfully"
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(400).json({
      success: false,
      error: "Error deleting post"
    } as ApiResponse);
  }
};

export const getPostPhoto = (req: Request, res: Response): Response => {
  if (!req.post?.photo) {
    return res.status(404).json({
      success: false,
      error: "Photo not found"
    } as ApiResponse);
  }

  res.set("Content-Type", req.post.photo.contentType);
  return res.send(req.post.photo.data);
};

export const likePost = async (req: LikePostRequest, res: Response): Promise<Response> => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $push: { likes: req.body.userId } },
      { new: true }
    ).exec() as IPost;

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: result
    } as ApiResponse<IPost>);
  } catch (error) {
    console.error('Error liking post:', error);
    return res.status(400).json({
      success: false,
      error: "Error liking post"
    } as ApiResponse);
  }
};

export const unlikePost = async (req: LikePostRequest, res: Response): Promise<Response> => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $pull: { likes: req.body.userId } },
      { new: true }
    ).exec() as IPost;

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: result
    } as ApiResponse<IPost>);
  } catch (error) {
    console.error('Error unliking post:', error);
    return res.status(400).json({
      success: false,
      error: "Error unliking post"
    } as ApiResponse);
  }
};

export const commentPost = async (req: CommentPostRequest, res: Response): Promise<Response> => {
  try {
    const comment = req.body.comment;
    comment.postedBy = req.body.userId;

    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $push: { comments: comment } },
      { new: true }
    )
      .populate("comments.postedBy", "_id name")
      .populate("postedBy", "_id name")
      .exec() as IPost;

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: result
    } as ApiResponse<IPost>);
  } catch (error) {
    console.error('Error commenting on post:', error);
    return res.status(400).json({
      success: false,
      error: "Error commenting on post"
    } as ApiResponse);
  }
};

export const uncommentPost = async (req: UncommentPostRequest, res: Response): Promise<Response> => {
  try {
    const comment = req.body.comment;

    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $pull: { comments: { _id: comment._id } } },
      { new: true }
    )
      .populate("comments.postedBy", "_id name")
      .populate("postedBy", "_id name")
      .exec() as IPost;

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Post not found"
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: result
    } as ApiResponse<IPost>);
  } catch (error) {
    console.error('Error removing comment from post:', error);
    return res.status(400).json({
      success: false,
      error: "Error removing comment from post"
    } as ApiResponse);
  }
};