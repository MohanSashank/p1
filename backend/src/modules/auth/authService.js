import AppError from "../../utils/AppError.js";
import jwtUtil from "../../utils/jwt.js";
import totp from "../../utils/totp.js";
import authRepository from "./authRepository.js";
import bcrypt from "bcrypt";
import sendPasswordResetOtp from "../../utils/otpGenerator.js";
import crypto from "crypto";
import redisClient from "../../config/redisConfig.js";
import "dotenv/config";
const authService = {
  async generateToken(user) {
    const accessToken = jwtUtil.generateAccessToken(user);
    const refreshToken = jwtUtil.generateRefreshToken(user);
    return { mfaRequired: false, success: true, accessToken: accessToken, refreshToken: refreshToken };
  },
  async login(email, password) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new AppError(404, "user not found");
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new AppError(401, "Invalid credentials");
    }
    if (user.role !== "learner" && user.role !== "tutor") {
      const secret = totp.generateSecret();
      const otpAuthUrl = totp.generateOtpAuthUrl(user.email, secret);
      await authRepository.saveSecret(secret);
      return { secret: secret, otpAuthUrl: otpAuthUrl, mfaRequired: true, userId: user.id }
    }
    return await this.generateToken(user);
  },

  async signup(name, email, password, phone_number, roles) {
    const email = await authRepository.findByEmail(email);
    if (email) {
      throw new AppError(400, "email is already registered");
    }
    const phone = await authRepository.findByPhone(phone_number);
    if (phone) {
      throw new AppError(400, "phone_number is already registered");
    }
    const hashPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));
    const user = await authRepository.createUser(name, email, hashPassword, phone_number);
    for (const role of roles) {
      await authRepository.storeRole(user.id, role);
    }
    return await this.generateToken(user);
  },

  async verifyMFA(userId, token) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError(401, "user not found for the given id");
    }
    const isValid = await totp.verifyToken(token);
    if (!isValid) {
      throw new AppError(401, "Invalid Authentication");
    }
    return await this.generateToken(user);
  },

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError(401, "refresh token is missing")
    }
    let payload;
    try {
      payload = jwtUtil.verifyRefreshToken(refreshToken);
    }
    catch (err) {
      throw new AppError(401, "Invalid or expired refreshToken");
    }
    const user = await authRepository.findById(payload.userId);
    if (!user) {
      throw new AppError(401, "Invalid refreshToken");
    }
    const accessToken = jwtUtil.generateAccessToken(user);
    return { accessToken: accessToken };
  },

  async forgotPassword(email) {
    const otp = crypto.randomInt(100000, 1000000);
    sendPasswordResetOtp(email, otp);
    const key = `password-reset:otp:${email}`
    await redisClient.set(key, JSON.stringify({ otp, attempts: 0 }), "EX", 300);
    return { message: "otp is send successfully", email: email };
  },

  async verifyOtp(otp, email) {
    const key = `password-reset:otp:${email}`;
    const storedOtp = await redisClient.get(key);
    if (!storedOtp) {
      throw new AppError(400, "error while retriving otp from the redis at verifyOtp authService otp expired");
    }
    const data = JSON.parse(storedOtp);
    if (Number(otp) !== Number(data.otp)) {
      return { storeStatus: true, isCorrect: false, message: "not same" }
    }
    await redisClient.del(key);
    await redisClient.set(`password-reset:verified:${email}`, "true", "EX", 600);
    return { storeStatus: true, isCorrect: true, message: "otp is correct" }
  },

  async resetPassword(email, password) {
    const key = `password-reset:verified:${email}`;
    const verificationStatus = await redisClient.get(key);
    if (verificationStatus === null) {
      throw new AppError(400, "otp verification is not yet done complete that at resetPassword at authService");
    }
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new AppError(404, "user not found at resetPassword authService")
    }
    const hashPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));
    const response = await authRepository.updatePassword(user.id, hashPassword);
    await redisClient.del(key);
    return response;
  },

  async changePassword(id, old_password, new_password) {
    const user = await authRepository.findById(id);
    if (!user) {
      throw new AppError(404, "user not found");
    }
    const password_hash = user.password_hash;
    const isOldPasswordValid = await bcrypt.compare(old_password, password_hash);
    if (!isOldPasswordValid) {
      throw new AppError(400, "old password is not correct");
    }
    const hashPassword = await bcrypt.hash(new_password, Number(process.env.SALT_ROUNDS));
    await authRepository.updatePassword(user.id, hashPassword);
    return { message: "password changed successfully" };
  }

}
export default authService;