const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const authenticateToken = require("./middlewares/authenticateToken");
// const socketConfig = require("../config/socket.config.js");
const routes = require("./routes/index.routes.js");
// const socketMiddleware = require("./middlewares/socket.middleware.js");

const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./helpers/db");
const app = express();
connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(authenticateToken);
app.use("/api/v1", routes);
// welcome message
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Node.js, Express and Socket.io API",
  });
});

const server = http.createServer(app);
const PORT = process.env.PORT || 4200;

// const io = require("socket.io")(server, socketConfig);

// io.use(socketMiddleware.authMiddleware);
// io.on("connection", (socket) => {
//   console.log("New connection established");

//   socket.on("disconnect", () => {
//     console.log("Connection disconnected");
//   });
// });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
