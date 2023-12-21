const jwt = require('jsonwebtoken');
const User = require("../models/user.model");

module.exports.authenticateToken = (req, res, next) => {
    if (!req.headers || !req.headers["authorization"]) {
        return res.sendStatus(401);
    }
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET,
        (err, payload) => {
            if (err) {
                console.log(err);
                return res.sendStatus(403);
            }
            
            req.username = payload.username;
            next();
        })
}
