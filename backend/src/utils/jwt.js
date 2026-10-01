import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
const jwtUtil = {
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "15m"
      }
    );
  },
  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.id
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d"
      }
    );
  },
  verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  },
  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  }
}
export default jwtUtil;