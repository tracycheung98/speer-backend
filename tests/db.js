const mongoose = require('mongoose');

require("dotenv").config();


module.exports.connect = async () => {
    await mongoose.connect(process.env.MONGODB_URI.concat("/test"));
}

module.exports.closeDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
}

module.exports.cleanupDatabase = async () => {
    const collections = Object.keys(mongoose.connection.collections)
    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName]
      await collection.deleteMany()
    }
}