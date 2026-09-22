require('dotenv').config();
const express = require('express');
const mainRouter = require("./routes/index.js");
const cors = require("cors");
const pinoHttp = require("pino-http");
const logger = require("./logger");

const app = express();
app.use(cors({origin: process.env.CORS_ORIGIN?.split(',') ?? []}));
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use("/api/v1", mainRouter);

module.exports = app;
