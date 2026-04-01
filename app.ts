import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

dotenv.config();

/**************************************************************************
 ********************       Env Var Validation       **********************
 **************************************************************************/

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Required environment variable ${envVar} is not set.`);
    process.exit(1);
  }
}

const app: Application = express();
const server = http.createServer(app);

/**************************************************************************
 **************************       DB Connection    ************************
 **************************************************************************/

const conString = process.argv.toString().includes('mocha')
  ? "mongodb://localhost/bggapi"
  : process.env.MONGO_URI!;

mongoose
  .connect(conString)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.error("DB connection error:", err));

mongoose.connection.on("error", (err: Error) => {
  console.log(`DB connection error: ${err.message}`);
});

/**************************************************************************
 ****************************       Routes       ***************************
 **************************************************************************/
import postRoutes from './routes/post';
import eventRoutes from './routes/event';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import boardgameRoutes from './routes/boardgame';
import tradeRoutes from './routes/trade';
import chatRoutes from './routes/chat';

/**************************************************************************
 **************************         API DOC         ************************
 **************************************************************************/
app.get("/api", (_req: Request, res: Response) => {
  fs.readFile(path.join(__dirname, "../docs/apiDocs.json"), (err, data) => {
    if (err) {
      res.status(400).json({
        error: err.message,
      });
      return;
    }
    const docs = JSON.parse(data.toString());
    res.json(docs);
  });
});

/**************************************************************************
**************************       Middleware       ************************
**************************************************************************/
app.use(helmet());
app.use(mongoSanitize());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

app.use('/api', postRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', boardgameRoutes);
app.use('/api', tradeRoutes);
app.use("/api", eventRoutes);
app.use("/api", chatRoutes);

interface UnauthorizedError extends Error {
  name: string;
  status?: number;
}

app.use(function (err: UnauthorizedError, _req: Request, res: Response, next: NextFunction) {
  if (err.name === "UnauthorizedError") {
    res.status(401).json({ error: "Unauthorized Access!" });
  } else {
    next(err);
  }
});

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const io = new SocketIOServer(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"]
  }
});

import { initSocket } from './controllers/chat';
initSocket(io);

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`A Node Js API is listening on port: ${port}`);
});

export default app;
