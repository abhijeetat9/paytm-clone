require('dotenv').config();
const express = require('express');
const mainRouter = require("./routes/index.js");
const cors = require("cors");

const app = express();
app.use(cors({origin: process.env.CORS_ORIGIN?.split(',') ?? []}));
app.use(express.json());

app.use("/api/v1", mainRouter);

module.exports = app;
