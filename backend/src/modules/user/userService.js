import userRepository from "./userRepository";
import AppError from "../../utils/AppError";
const userService = {
  async getProfile(id) {
    const user = await userRepository.getProfile(id);
    if (!user) {
      throw new AppError(404, "user not found for the given id");
    }
    return user;
  },
  async updateProfile(user) {
    if (!user) {
      throw new AppError(404, "no body provided");
    }
    const { id, name, phone_number, photo_url, photo_public_id, bio, base_location } = user;
    const response = await userRepository.updateProfile(id, name, phone_number, photo_url, photo_public_id, bio, base_location);
    return response;
  },

}
export default userService;