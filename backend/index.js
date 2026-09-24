const connectDB = require(`./db/connection`);
const app = require("./app.js");

connectDB();
app.listen(process.env.PORT || 3001);
