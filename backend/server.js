import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import authRouter from "./src/modules/auth/authRoutes.js";
import userRouter from "./src/modules/user/userRoutes.js"
import errorMiddleware from "./src/middlewares/errorMiddleware.js";
import redisClient from "./src/config/redisConfig.js";
import pool from "./src/config/db.js";

const port = process.env.PORT;
const app = express();

app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth/v1", authRouter);
app.use("/api/user/v1", userRouter);

app.use(errorMiddleware);

const startServer = async () => {
  await redisClient.ping();
  console.log("redis is connected successfully");
  await pool.query("select 1");
  console.log("database is connected successfully");
  app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`);
  });
}

startServer();