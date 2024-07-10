const db = require("knex")(require("./knexfile").development);

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
    res.status(200).json("ЙДИНАХ");
  }
}

module.exports = new Controller();
