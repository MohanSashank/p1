import express from "express";
import authController from "./authController.js";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "../../middlewares/rateLimiter.js";
import authMiddleware from "../../middlewares/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/login", rateLimiter(RATE_LIMIT_CONFIGS.login), authController.login);
authRouter.post("/signup", rateLimiter(RATE_LIMIT_CONFIGS.signup), authController.signup);
authRouter.post("/forgot-password", rateLimiter(RATE_LIMIT_CONFIGS.forgotPassword), authController.forgotPassword);
authRouter.post("/forgotpassword", rateLimiter(RATE_LIMIT_CONFIGS.forgotPassword), authController.forgotPassword);
authRouter.post("/verify-otp", rateLimiter(RATE_LIMIT_CONFIGS.verifyOtp), authController.verifyOtp);
authRouter.post("/verifyOtp", rateLimiter(RATE_LIMIT_CONFIGS.verifyOtp), authController.verifyOtp);
authRouter.post("/reset-password", rateLimiter(RATE_LIMIT_CONFIGS.resetPassword), authController.resetPassword);
authRouter.post("/resetPassword", rateLimiter(RATE_LIMIT_CONFIGS.resetPassword), authController.resetPassword);
authRouter.post("/verify-mfa", rateLimiter(RATE_LIMIT_CONFIGS.verifyMfa), authController.verifyMFA);
authRouter.post("/verify", rateLimiter(RATE_LIMIT_CONFIGS.verifyMfa), authController.verifyMFA);
authRouter.post("/refresh-token", rateLimiter(RATE_LIMIT_CONFIGS.refreshToken), authController.refreshAccessToken);
authRouter.post("/refresh", rateLimiter(RATE_LIMIT_CONFIGS.refreshToken), authController.refreshAccessToken);
authRouter.post("/changepassword", authMiddleware, rateLimiter(RATE_LIMIT_CONFIGS.changePassword), authController.changePassword);

export default authRouter;