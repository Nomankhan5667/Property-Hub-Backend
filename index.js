import app from './src/app.js';
import connectDB from './src/config/db.js';

// Initialize database connection for the serverless container environment
connectDB();

export default app;
