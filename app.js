const express = require("express");
const cors = require("cors");
const port = 5005;
const Controller = require("./Controllers");
const app = express();
app.use(
  cors({
    credentials: true,
    origin: [
      "*",
      "http://localhost:5173",
      "https://bbrdq16w-5173.euw.devtunnels.ms",
      "https://fair.onetouch.com.ua",
      "https://api.fair.onetouch.com.ua",
    ],
  })
);
app.use(express.json());
function authentication(req, res, next) {
  const authheader = req.headers.authorization;

  if (!authheader) {
    let err = new Error("You are not authenticated!");
    res.setHeader("WWW-Authenticate", "Basic");
    err.status = 401;
    return next(err);
  }

  const auth = new Buffer.from(authheader.split(" ")[1], "base64")
    .toString()
    .split(":");
  const user = auth[0];
  const pass = auth[1];

  if (user == process.env.LOGIN && pass == process.env.PASSWORD) {
    next();
  } else {
    let err = new Error("You are not authenticated!");
    res.setHeader("WWW-Authenticate", "Basic");
    err.status = 401;
    return next(err);
  }
}
app.get("/", (req, res) => {
  res.status(200).json("Hello world");
});
app.get("/getUsers", Controller.getUser);
app.post("/addWinner", Controller.addWinner);
app.get("/hideUser/:id", Controller.hideUser);
app.get("/delete", authentication, Controller.delete);
app.get("/usersDelete", authentication, Controller.usersDelete);

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущено на порту: ${port}`);
});
