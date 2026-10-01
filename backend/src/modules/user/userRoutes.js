import express from "express"
import userController from "./userController";
import authMiddleware from "../../middlewares/authMiddleware";
const userRouter = express.Router();
userRouter.get("/profile", authMiddleware.authMiddleware, userController.getProfile).patch("/profile", authMiddleware.authMiddleware, userController.updateProfile);

export default userRouter;