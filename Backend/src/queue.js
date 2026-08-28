import  { Queue } from "bullmq";
import connection from "./config/redis.js";

const agentQueue = new Queue("agentQueue" , { connection });

export default agentQueue;
