import mongoose from "mongoose";
import dns from "node:dns";

// Fix for Windows / Node.js DNS SRV resolution issues with MongoDB Atlas (mongodb+srv://)
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("Could not set custom DNS servers for MongoDB connection:", dnsErr.message);
}

let mongodInstance = null;

const connectDB = async () => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;

  if (mongoUri) {
    try {
      console.log("Connecting to configured MongoDB...");
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`⚠️  Configured MongoDB connection failed: ${error.message}`);
    }
  } else {
    console.warn("⚠️  No MONGO_URI provided in backend/.env");
  }

  // In development mode, fallback to in-memory MongoDB if remote connection is unavailable
  if (process.env.NODE_ENV !== "production") {
    try {
      console.log("🚀 Initializing In-Memory MongoDB for local development...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      mongodInstance = await MongoMemoryServer.create();
      const inMemUri = mongodInstance.getUri();
      const conn = await mongoose.connect(inMemUri);
      console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);
      console.log(`💡 Note: To persist data permanently, update MONGO_URI in backend/.env with your MongoDB Atlas or local MongoDB URI.`);
      return;
    } catch (inMemError) {
      console.error(`❌ In-Memory MongoDB startup failed: ${inMemError.message}`);
    }
  }

  console.error("\n========================================================");
  console.error("❌ MONGODB CONNECTION FAILED");
  console.error("========================================================");
  console.error("Please provide a valid MongoDB connection string in backend/.env");
  console.error("========================================================\n");
  process.exit(1);
};

// Graceful cleanup on server shutdown
process.on("SIGINT", async () => {
  if (mongodInstance) {
    await mongodInstance.stop();
  }
  process.exit(0);
});

export default connectDB;
