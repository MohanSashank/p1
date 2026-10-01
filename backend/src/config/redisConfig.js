import "dotenv/config"
import Redis from "ioredis"
const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on("connect", () => {
  console.log("redis is connected");
});
redisClient.on("error", () => {
  console.log("error while connecting to the redis");
})
export default redisClient;
