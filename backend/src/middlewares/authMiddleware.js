import jwtUtil from "../utils/jwt.js";
import AppError from "../utils/AppError.js";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) {
      throw new AppError(401, "Authentication token is required");
    }
    const payload = jwtUtil.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return next(new AppError(401, "Invalid or expired access token"));
  }
};

export default authMiddleware;
