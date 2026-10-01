
import userService from "./userService"
const userController = {
  async getProfile(req, res, next) {
    try {
      const id = req.user.userId;
      const user = await userService.getProfile(id);
      res.status(200).json(user);
    }
    catch (err) {
      console.log("Error at userController getProfile");
      next(err);
    }
  },
  async updateProfile(req, res, next) {
    try {
      const resposne = await userService.updateProfile(req.body)
    }
    catch (err) {
      console.log("Error at useControlelr updateProfile");
      next(err);
    }
  }
}
export default userController;