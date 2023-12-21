const User = require("../models/user.model");

const getUser = (username) => {
    return User.findOne({ username: username });
}

const createUser = (username, password) => {
    let newUser = new User();
    newUser.username = username;
    newUser.setPassword(password);

    return newUser.save();
}

module.exports = {
    getUser,
    createUser
}