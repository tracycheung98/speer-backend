const express = require("express");
const router = express.Router();

const User = require("../models/user.model");

router.post("/login", (req, res) => {
    User.findOne({ username: req.body.username }, function (err, user) {
        if (user === null) {
            return res.status(400).send({
                message: "User not found.",
            });
        }
        if (user.isPasswordValid(req.body.password)) {
            return res.status(201).send({
                // TODO: return JWT token
                message: "User Logged In",
            });
        } else {
            return res.status(400).send({
                message: "Incorrect Password",
            });
        }
    });
});

router.post("/signup", (req, res) => {
    if (req.body.password == "") {
        return res.status(400).send({
            message: "Password cannot be empty.",
        });
    }

    let newUser = new User();

    newUser.username = req.body.username
    newUser.setPassword(req.body.password);

    newUser.save()
        .then((user) => {
            return res.status(200).send({
                message: "User added successfully.",
            });
        })
        .catch((error) => {
            console.log(error);
            return res.status(400).send({
                message: "Failed to add user.",
            });
        });
})
module.exports = router;
