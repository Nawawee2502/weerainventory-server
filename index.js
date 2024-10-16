require("dotenv").config();
const express = require("express");
const app = express();

const cors = require("cors");
const bodyParser = require("body-parser");

const apiRouter = require('./routes/router');

const PORT = process.env.PORT;
const DOMAIN = process.env.DOMAIN;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOption = {
  origin: ["https://weerainventory.com", "http://35.86.111.240", "http://localhost:3001"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  OptionSuccessStatus: 200,
};

app.use(cors(corsOption));


console.log('Deploy Version 6');

app.get('/api/test', (req, res) => {
  console.log('Root Backend get is running on port 4001');
  res.send('Root API is working with app');
});

// Connect Database 
const db = require("./models/mainModel");
db.sequelize
  .sync()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.log("Database Connect Failed :" + err.message));


// Include Routes 
app.use("/api", apiRouter)

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));