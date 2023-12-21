const mongoose = require("mongoose");
var crypto = require("crypto");

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    hash: String,
    salt: String,
});

UserSchema.methods.setPassword = function (password) {
    // Creating a unique salt for a particular user
    this.salt = crypto.randomBytes(16).toString("hex");

    // Hashing salt and password
    this.hash = crypto
        .pbkdf2Sync(password, this.salt, 100, 32, "sha256")
        .toString(`hex`);
};

// Compute hash and compare
UserSchema.methods.isPasswordValid = function (password) {
    var hash = crypto
        .pbkdf2Sync(password, this.salt, 100, 32, "sha256")
        .toString(`hex`);
    return this.hash === hash;
};

const User = (module.exports = mongoose.model("User", UserSchema));
