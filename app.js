const express = require("express");
const cors = require("cors");
const port = 5005;
const Controller = require("./Controllers");
const app = express();
app.use(
  cors({
    credentials: true,
    origin: ["*", "http://localhost:5173"],
  })
);
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json("Hello world");
});
app.get("/getUsers", Controller.getUser);
app.post("/addWinner", Controller.addWinner);
app.get("/hideUser/:id", Controller.hideUser);
app.get('/delete', Controller.delete)

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущено на порту: ${port}`);
});
