const express = require("express");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: "http://localhost:8080"
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// tmp route
app.get("/", (req, res) => {
  res.send("Hi.");
});
app.post("/", (req, res) => {
    res.json(req.body);
});

module.exports = app
