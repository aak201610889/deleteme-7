const express = require("express");
const chalk = require("chalk");
const http = require('http'); // Use the http module instead of https
const cors = require('cors'); 

const { PORT } = require("./config");
const expressApp = require("./app");
const connectDB = require("./database/connect");
const { initializeSocket } = require('./socket');

const startServer = async () => {
  try {
    const app = express();
    app.use(cors({
      origin: "https://deleteme-7.onrender.com",
      credentials: true,
    }));
    await connectDB();
    await expressApp(app);

    const server = http.createServer(app); // Create an HTTP server
    const io = initializeSocket(server);
    
    server.listen(PORT, () => {
      console.log(
        chalk.blue.italic.underline(`Server started on http://localhost:${PORT}`)
      );
    });
  } catch (err) {
    console.error(chalk.gray(`Failed to start server: ${err.message}`));
    process.exit(1);
  }
};

startServer();
