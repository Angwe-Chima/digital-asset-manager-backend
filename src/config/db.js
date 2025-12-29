import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`
    ✅ MongoDB Connected Successfully
    📍 Host: ${conn.connection.host}
    🗄️  Database: ${conn.connection.name}
    `);
  } catch (error) {
    console.error(`
    ❌ MongoDB Connection Error:
    ${error.message}
    `);
    process.exit(1);
  }
};

export default connectDB;