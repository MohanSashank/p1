import { generateSecret, generateURI, verify } from "otplib";
const totp = {
  generateSecret() {
    return generateSecret();
  },
  generateToken(email, secret) {
    return generateURI(email, "p1", secret);
  },
  verifyToken(token, secret) {
    return verify(token, secret);
  }
}
export default totp;