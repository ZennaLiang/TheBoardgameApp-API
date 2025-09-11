import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import expressJwt from "express-jwt";
import _ from "lodash";
import { OAuth2Client } from "google-auth-library";
import { Request, Response, NextFunction } from "express";
import { sendEmail } from "../helpers";
import User from "../models/user";
import { IUser, ApiResponse } from "../types";

dotenv.config();

interface SignUpRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

interface SignInRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface GoogleLoginRequest extends Request {
  body: {
    tokenId: string;
  };
}

interface FacebookLoginRequest extends Request {
  body: {
    email: string;
    name: string;
    password?: string;
  };
}

interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}

interface ResetPasswordRequest extends Request {
  body: {
    resetPasswordLink: string;
    newPassword: string;
  };
}

interface UserResponse {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthResponse extends ApiResponse {
  token?: string;
  user?: UserResponse;
}

export const signUp = async (req: SignUpRequest, res: Response): Promise<Response> => {
  try {
    req.body.name = req.body.name.toLowerCase();
    
    const userExists = await User.findOne({ email: req.body.email });
    const nameExists = await User.findOne({ name: req.body.name });
    
    if (userExists) {
      return res.status(403).json({
        success: false,
        error: "This email is already taken. Please try another."
      } as ApiResponse);
    }
    
    if (nameExists) {
      return res.status(403).json({
        success: false,
        error: "This name is already taken. Please try another."
      } as ApiResponse);
    }
    
    const user = new User(req.body);
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "Signup success! Please login."
    } as ApiResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error during signup"
    } as ApiResponse);
  }
};

export const signIn = async (req: SignInRequest, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }) as IUser;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User with that email does not exist. Please sign up!"
      } as ApiResponse);
    }
    
    if (!user.authenticate(password)) {
      return res.status(401).json({
        success: false,
        error: "Email and password do not match"
      } as ApiResponse);
    }
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: "JWT secret not configured"
      } as ApiResponse);
    }
    
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    // Set cookie to expire in ~9999ms (about 10 seconds)
    res.cookie("t", token, { expires: new Date(Date.now() + 9999) });

    const { _id, name, email: userEmail, role } = user;
    return res.json({
      success: true,
      token,
      user: { _id, email: userEmail, name, role }
    } as AuthResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error during signin"
    } as ApiResponse);
  }
};

const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);

export const googleLogin = async (req: GoogleLoginRequest, res: Response): Promise<Response> => {
  try {
    const idToken = req.body.tokenId;
    
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID || !process.env.JWT_SECRET || !process.env.APP_NAME) {
      return res.status(500).json({
        success: false,
        error: "Google authentication not properly configured"
      } as ApiResponse);
    }
    
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.REACT_APP_GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        error: "Invalid Google token"
      } as ApiResponse);
    }
    
    const {
      email_verified,
      email,
      name,
      picture,
      sub: googleid
    } = payload;
    
    if (email_verified && email) {
      const newUser = { email, name: name || "", password: googleid };
      
      let user = await User.findOne({ email }) as IUser;
      
      if (!user) {
        // Create a new user and login
        user = new User(newUser);
        user.name = user.name.toLowerCase();
        await user.save();
      } else {
        // Update existing user with new social info
        user = _.extend(user, newUser);
        user.updated = new Date();
        await user.save();
      }
      
      const token = jwt.sign(
        { _id: user._id, role: user.role, iss: process.env.APP_NAME },
        process.env.JWT_SECRET
      );
      
      res.cookie("t", token, { expires: new Date(Date.now() + 9999) });
      
      const { _id, name: userName, email: userEmail, role } = user;
      return res.json({
        success: true,
        token,
        user: { _id, name: userName, email: userEmail, role }
      } as AuthResponse);
    }
    
    return res.status(400).json({
      success: false,
      error: "Email not verified by Google"
    } as ApiResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error during Google authentication"
    } as ApiResponse);
  }
};

export const facebookLogin = async (req: FacebookLoginRequest, res: Response): Promise<Response> => {
  try {
    if (!process.env.JWT_SECRET || !process.env.APP_NAME) {
      return res.status(500).json({
        success: false,
        error: "Facebook authentication not properly configured"
      } as ApiResponse);
    }
    
    let user = await User.findOne({ email: req.body.email }) as IUser;
    
    if (!user) {
      // Create a new user and login
      user = new User(req.body);
      user.name = user.name.toLowerCase();
      await user.save();
    } else {
      // Update existing user with new social info
      user = _.extend(user, req.body);
      user.updated = new Date();
      await user.save();
    }
    
    const token = jwt.sign(
      { _id: user._id, role: user.role, iss: process.env.APP_NAME },
      process.env.JWT_SECRET
    );
    
    res.cookie("t", token, { expires: new Date(Date.now() + 9999) });
    
    const { _id, name, email } = user;
    return res.json({
      success: true,
      token,
      user: { _id, name, email }
    } as AuthResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error during Facebook authentication"
    } as ApiResponse);
  }
};

export const signOut = (req: Request, res: Response): Response => {
  res.clearCookie("t");
  return res.json({
    success: true,
    message: "Signout success!"
  } as ApiResponse);
};

export const requireSignIn = expressJwt({
  secret: process.env.JWT_SECRET || "",
  algorithms: ["HS256"],
  userProperty: "auth"
});

export const forgotPassword = async (req: ForgotPasswordRequest, res: Response): Promise<Response> => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "No request body"
      } as ApiResponse);
    }
    
    if (!req.body.email) {
      return res.status(400).json({
        success: false,
        message: "No Email in request body"
      } as ApiResponse);
    }
    
    if (!process.env.JWT_SECRET || !process.env.CLIENT_URL) {
      return res.status(500).json({
        success: false,
        error: "Server configuration error"
      } as ApiResponse);
    }
    
    const { email } = req.body;
    
    const user = await User.findOne({ email }) as IUser;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User with that email does not exist!"
      } as ApiResponse);
    }
    
    const token = jwt.sign(
      { _id: user._id, iss: "NODEAPI" },
      process.env.JWT_SECRET
    );
    
    const emailData = {
      from: "noreply@node-react.com",
      to: email,
      subject: "Password Reset Instructions",
      text: `Please use the following link to reset your password: 
                ${process.env.CLIENT_URL}/reset-password/${token}`,
      html: `<p>Please use the following link to reset your password:</p> 
                <a target="_blank" href="${process.env.CLIENT_URL}/reset-password/${token}">Click here to reset password</a>
                <br/>
                <p>If you did not request for password change, please ignore this email.</p>`
    };
    
    await user.updateOne({ resetPasswordLink: token });
    sendEmail(emailData);
    
    return res.status(200).json({
      success: true,
      message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
    } as ApiResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error processing password reset request"
    } as ApiResponse);
  }
};

export const resetPassword = async (req: ResetPasswordRequest, res: Response): Promise<Response> => {
  try {
    const { resetPasswordLink, newPassword } = req.body;
    
    const user = await User.findOne({ resetPasswordLink }) as IUser;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid Link!"
      } as ApiResponse);
    }
    
    const updatedFields = {
      password: newPassword,
      resetPasswordLink: ""
    };
    
    const updatedUser = _.extend(user, updatedFields);
    updatedUser.updated = new Date();
    
    await updatedUser.save();
    
    return res.json({
      success: true,
      message: "Great! Now you can login with your new password."
    } as ApiResponse);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: "Error resetting password"
    } as ApiResponse);
  }
};