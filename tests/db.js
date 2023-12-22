const mongoose = require('mongoose');

require("dotenv").config();

const connect = async (database) => {
    await mongoose.connect(process.env.MONGODB_URI.concat(`/${database}`));
}

const closeDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
}

const cleanupDatabase = async () => {
    const collections = Object.keys(mongoose.connection.collections)
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName]
        await collection.deleteMany()
    }
}

module.exports = {
    setupDB(databaseName) {
        beforeAll(async () => await connect(databaseName))

        afterEach(async () => await cleanupDatabase())

        afterAll(async () => await closeDatabase())
    }
}