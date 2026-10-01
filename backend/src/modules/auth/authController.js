
import authService from "./authService.js";
const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      if (result.mfaRequired === true) {
        return res.status(200).json(result);
      }

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        message: result
      });
    }
    catch (err) {
      console.log("at authController login method");
      return next(err);
    }
  },
  async signup(req, res, next) {
    try {
      const { name, email, password, phone_number, roles } = req.body;
      const response = await authService.signup(name, email, password, phone_number, roles);
      res.cookie("refreshToken", response.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      return res.status(200).json({ success: true, message: response });
    }
    catch (err) {
      console.log("error at authController signup");
      next(err);
    }
  },
  async verifyMFA(req, res, next) {
    try {
      const { userId, code } = req.body;
      const result = await authService.verifyMFA(userId, code);
      return res.status(200).json(result);
    }
    catch (err) {
      console.log("at authController verifyMFA");
      next(err);
    }
  },
  async refreshAccessToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const result = await authService.refreshAccessToken(refreshToken);
      return res.status(200).json(result);
    }
    catch (err) {
      console.log("error at authController refresh");
      next(err);
    }
  },
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const response = await authService.forgotPassword(email);
      return res.status(200).json({ response, message: "email found and otp is send to that email" });
    }
    catch (err) {
      console.log("error at authController forgotpassword");
      next(err);
    }
  },
  async verifyOtp(req, res, next) {
    try {
      const { otp, email } = req.body;
      const response = await authService.verifyOtp(otp, email);
      return res.status(200).json(response);
    }
    catch (err) {
      console.log("error while verifying otp authController");
      next(err);
    }
  },
  async resetPassword(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.resetPassword(email, password);
      return res.status(200).json({ result: result, message: "password is reset successfully" });
    }
    catch (err) {
      console.log("error while resetting otp authController");
      next(err);
    }
  },
  async changePassword(req, res, next) {
    try {
      const { old_password, new_password } = req.body;
      const id = req.user.userId;
      const response = await authService.changePassword(id, old_password, new_password);
      res.status(200).json({ message: "password is successfully updated", response });
    }
    catch (err) {
      console.log("Error at changePassword authController");
      next(err);
    }
  }

}
export default authController;