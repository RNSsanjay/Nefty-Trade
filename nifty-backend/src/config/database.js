const mongoose = require('mongoose');
const config = require('./config');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const mongoUri = config.NODE_ENV === 'test' ? config.MONGODB_TEST_URI : config.MONGODB_URI;
      
      this.connection = await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB connected to: ${mongoUri}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('📴 MongoDB disconnected');
      });

      process.on('SIGINT', this.disconnect.bind(this));
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('📴 MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      process.exit(1);
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();