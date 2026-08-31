import dotenv from "dotenv";
dotenv.config();
import { Worker } from "bullmq";
import { runAgentLoop } from "./agent/loop.js";
import Task from "./models/Task.js";
import connectDB from "./config/db.js";
import connection from "./config/redis.js";

await connectDB();

const worker = new Worker(
  "agentQueue",
  async (job) => {
    const { original_question, taskId } = job.data;

    try {
      const state = await runAgentLoop(original_question, taskId);

      await Task.findOneAndUpdate({ taskId }, state, {
        returnDocument: 'after',
        upsert: true,
      });
      console.log(`Task ${taskId} saved with status: ${state.status}`);
    } catch (err) {
      console.error(`Worker crashed on task ${taskId}: `, err);

      await Task.findOneAndUpdate(
        { taskId },
        { status: "failed", final_answer: `Worker error: ${err.message}` },
        { returnDocument: "after", upsert: true },
      );
    }
  },
  { connection },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed`, err.message);
});

console.log("Worker started, listening for jobs on 'agentQueue'...");
