import mongoose from "mongoose";

const connectDB = async () => {
  if(mongoose.connection.readyState === 1){
    console.log("MongoDB already connected, skipping.");
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
