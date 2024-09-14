require("dotenv").config();
const express = require("express");
const app = express();

const cors = require("cors");
const bodyParser = require("body-parser");

const PORT = process.env.PORT;
const DOMAIN = process.env.DOMAIN;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOption = {
  origin: ["http://localhost:3001","http://localhost:3002"],
  OptionSuccessStatus: 200,
};

app.use(cors(corsOption));

// Connect Database 
const db = require("./models/mainModel");
db.sequelize
  .sync()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.log("Database Connect Failed :" + err.message));


// Include Routes 
require('./routes/router')(app);
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));