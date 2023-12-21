const app = require("./app");
const mongoose = require("mongoose");

require("dotenv").config();
const PORT = 8080;

mongoose
  .connect(process.env.MONGODB_URI.concat("/prod"))
  .then(() => {
    app.listen(PORT, console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.log(err);
  });
