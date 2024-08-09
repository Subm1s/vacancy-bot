require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const knex = require("knex")(require("./knexfile").development);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const askName = async (ctx) => {
  await ctx.reply("Як Вас звати?");
};

const askContact = async (ctx) => {
  await ctx.reply(
    "Будь ласка, поділіться своїм номером телефону.",
    Markup.keyboard([Markup.button.contactRequest("Поділитися контактом")])
      .oneTime()
      .resize()
  );
};

const askTicTok = async (ctx) => {
  await ctx.reply("Введіть свій nickname в TikTok");
};

const finalMessage = async (ctx, id) => {
  await ctx.reply(
    `Ви успішно зареєстровані! Ваш номер: ${id}\nВаш вибір збережено.\nО 21:00 компанія OneTouch розпочне розіграш. Очікуємо на вас.\nУмови розіграшу:\n- підписатись на [Instagram](https://www.instagram.com/one_touch_vn?igsh=MTdvM2oyMzB5NnIxeg==)\n- підписатись на [TikTok](https://www.tiktok.com/@one.touch.vn?_t=8o5r6mZTWsf&_r=1)\n- підписатись на [Новини компанії](https://t.me/onetouchvn)`,
    { parse_mode: "Markdown" }
  );
};

bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const nickname = ctx.from.username ? `@${ctx.from.username}` : null;

    // Перевіряємо, чи існує користувач з таким telegram_id
    const user = await knex("users").where({ telegram_id: telegramId }).first();

    if (!user) {
      // Якщо користувача немає, додаємо його
      await knex("users").insert({ telegram_id: telegramId, nickname });
      await ctx.reply("Вітаємо!");
      await askName(ctx);
    } else {
      if (!user.name) await askName(ctx);
      else if (!user.phone) await askContact(ctx);
      else if (!user.tiktok) await askTicTok(ctx);
      else {
        await ctx.reply(
          `Ви вже заповнили всі дані. Ваш номер для участі в розіграші: ${user.id}`
        );
      }
    }
  } catch (err) {
    console.log(err);
  }
});

bot.on("text", async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const text = ctx.message.text;

    // Отримуємо дані користувача
    const user = await knex("users").where({ telegram_id: telegramId }).first();

    if (!user.name) {
      // Оновлюємо ім'я користувача в базі даних
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ name: text });

      await ctx.reply(`Дякую, ${text}!`);
      await askContact(ctx);
    } else if (!user.tiktok) {
      // Оновлюємо TikTok nickname користувача в базі даних
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ tiktok: text, is_show: 1 });

      await ctx.reply(`Дякую за ваш TikTok nickname: ${text}!`);
      await finalMessage(ctx, user.id);
    } else {
      await ctx.reply(
        "Будь ласка, дайте дійсну відповідь, або ще раз введіть команду /start"
      );
    }
  } catch (err) {
    console.log(err);
  }
});

bot.on("contact", async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const phone = ctx.message.contact.phone_number;

    // Оновлюємо номер телефону користувача в базі даних
    await knex("users").where({ telegram_id: telegramId }).update({ phone });

    await askTicTok(ctx);
  } catch (err) {
    console.log(err);
  }
});

const startBot = () => {
  try {
    console.log("Bot start");
    bot.launch();
  } catch (err) {
    console.log(err);
  }
};

module.exports = startBot;
