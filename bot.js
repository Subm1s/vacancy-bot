require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const knex = require("knex")(require("./knexfile").development);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const askName = async (ctx) => {
  ctx.reply("Як Вас звати?");
};

const askContact = async (ctx) => {
  ctx.reply(
    "Будь ласка, поділіться своїм номером телефону.",
    Markup.keyboard([Markup.button.contactRequest("Поділитися контактом")])
      .oneTime()
      .resize()
  );
};

const askOption = async (ctx) => {
  ctx.reply(
    "Оберіть один з варіантів:",
    Markup.keyboard([
      [
        "Бухгалтер",
        "Інженер",
        "Менеджер з продажу",
        "Проєктувальник",
        "Електромонтер",
        "Різноробочий",
      ],
    ]).oneTime()
    //   .resize()
  );
};

bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  const nickname = ctx.from.username ? `@${ctx.from.username}` : null;

  // Перевіряємо, чи існує користувач з таким telegram_id
  const user = await knex("users").where({ telegram_id: telegramId }).first();

  if (!user) {
    // Якщо користувача немає, додаємо його
    await knex("users").insert({ telegram_id: telegramId, nickname });
    ctx.reply("Вітаємо!");
    await askName(ctx);
  } else {
    ctx.reply("Вітаємо знову! Ви вже зареєстровані.");
    if (!user.name) await askName(ctx);
    else if (!user.phone) await askContact(ctx);
    else if (!user.selected_option) await askOption(ctx);
    else ctx.reply("Ви вже заповнили всі дані.");
  }
});

bot.on("text", async (ctx) => {
  const telegramId = ctx.from.id;
  const text = ctx.message.text;

  // Отримуємо дані користувача
  const user = await knex("users").where({ telegram_id: telegramId }).first();

  if (!user.name) {
    // Оновлюємо ім'я користувача в базі даних
    await knex("users")
      .where({ telegram_id: telegramId })
      .update({ name: text });

    ctx.reply(`Дякую, ${text}! Ваше ім'я збережено.`);
    await askContact(ctx);
  } else if (
    !user.selected_option &&
    [
      "Бухгалтер",
      "Інженер",
      "Менеджер з продажу",
      "Проєктувальник",
      "Електромонтер",
      "Різноробочий",
    ].includes(text)
  ) {
    // Оновлюємо вибраний варіант користувача в базі даних
    const userId = await knex("users")
      .where({ telegram_id: telegramId })
      .update({ selected_option: text })
      .select("id");
    console.log(userId);
    ctx.reply(
      `Ви обрали: ${text}. цей id ${userId} Ваш вибір збережено\nО 15:00 компанія OneTouch розпочне розіграш. Очікуємо на вас. Для перемоги обов'язко потрібно підписатись на [інстаграм](https://www.instagram.com/yourprofile) та [тікток](https://www.tiktok.com/@yourprofile)`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.on("contact", async (ctx) => {
  const telegramId = ctx.from.id;
  const phone = ctx.message.contact.phone_number;

  // Оновлюємо номер телефону користувача в базі даних
  await knex("users").where({ telegram_id: telegramId }).update({ phone });

  ctx.reply("Ваш номер телефону збережено.");
  await askOption(ctx);
});

bot.launch();
