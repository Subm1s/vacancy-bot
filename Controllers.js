const db = require("knex")(require("./knexfile").development);
const axios = require("axios");

class Controller {
  constructor() {
    this.getUser = this.getUser.bind(this);
    this.addWinner = this.addWinner.bind(this);
  }
  async getUser(req, res) {
    try {
      const users = await db("users")
        .where({ is_show: true })
        .select("id", "nickname", "name", "phone", "selected_option");
      const winner = await db("users")
        .whereNot({ winner_place: 0 })
        .select("id", "nickname", "name", "phone", "selected_option")
        .orderBy("winner_place", "desc");
      const response = { users, winner };
      res.status(200).json(response);
      return response;
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }
  async addWinner(req, res) {
    try {
      const { id, place } = req.body;
      await db("users").where({ id: id }).update({
        is_show: 0,
        winner_place: place,
      });
      const users = await db("users")
        .where({ is_show: true })
        .select("id", "nickname", "name", "phone", "selected_option");
      const winner = await db("users")
        .whereNot({ winner_place: 0 })
        .select(
          "id",
          "nickname",
          "name",
          "phone",
          "selected_option",
          "winner_place"
        )
        .orderBy("winner_place", "desc");
      res.status(200).json({ users, winner });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }
  async hideUser(req, res) {
    try {
      const { id } = req.params;
      await db("users").where({ id: id }).update({ is_show: 0 });
      const users = await db("users")
        .where({ is_show: true })
        .select("id", "nickname", "name", "phone", "selected_option");
      const winner = await db("users")
        .whereNot({ winner_place: 0 })
        .select(
          "id",
          "nickname",
          "name",
          "phone",
          "selected_option",
          "winner_place"
        )
        .orderBy("winner_place", "desc");
      res.status(200).json({ users, winner });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }
  async delete(req, res) {
    await db("users").whereNot({ winner_place: 0 }).update({ winner_place: 0 });
    await db("users").whereNot({ is_show: 1 }).update({ is_show: 1 });
    res.status(200).json("Очищено🗑️");
  }
  async usersDelete(req, res) {
    await db("users").del();
    res.status(200).json("Очищено користувачів🗑️");
  }
  async checkMembers(req, res) {
    const userId = req.params.userId;

    try {
      const isUser = await db("users")
        .where({ telegram_id: userId, is_show: 1 })
        .first();
      if (isUser) {
        const response = await axios.get(
          `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getChatMember`,
          {
            params: {
              chat_id: process.env.TELEGRAM_CHANEL,
              user_id: userId,
            },
          }
        );

        if (response.data.ok) {
          const memberStatus = response.data.result.status;

          if (
            memberStatus === "member" ||
            memberStatus === "administrator" ||
            memberStatus === "creator"
          ) {
            return res.json({ isSubscribed: true });
          } else {
            return res.json({ isSubscribed: false });
          }
        } else {
          return res.json({ isSubscribed: false });
        }
      } else {
        return res.json({ isSubscribed: false });
      }
    } catch (err) {
      // Обробка випадку, коли користувача немає в чаті
      if (
        err.response &&
        err.response.data &&
        err.response.data.error_code === 400 &&
        (err.response.data.description.includes("user not found") ||
          err.response.data.description.includes("USER_ID_INVALID"))
      ) {
        return res.json({ isSubscribed: false });
      }

      // Для інших помилок
      console.log(err);
      res.status(400).json({ isSubscribed: false });
    }
  }
}

module.exports = new Controller();
