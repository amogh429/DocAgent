import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import connectDB from "./config/db.js";
import agentRoutes from "./routes/agent.routes.js";

await connectDB();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/agent", agentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT} `));
