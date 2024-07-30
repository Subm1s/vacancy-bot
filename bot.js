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
      ["Бухгалтер"],
      ["Інженер"],
      ["Менеджер з продажу"],
      ["Проєктувальник"],
      ["Електромонтер"],
      ["Різноробочий"],
    ]).oneTime()
    //   .resize()
  );
};

const askEducationLevel = async (ctx) => {
  ctx.reply(
    "Вкажіть рівень вашої освіти:",
    Markup.keyboard([["Середня"], ["Середня – спеціальна"], ["Вища"]]).oneTime()
    //   .resize()
  );
};

const askAge = async (ctx) => {
  ctx.reply(
    "Вкажіть ваш вік:",
    Markup.keyboard([
      ["До 20"],
      ["Від 21-35"],
      ["Від 36-45"],
      ["Від 46-55"],
      ["Від 55"],
    ]).oneTime()
    //   .resize()
  );
};

const askJobSearchChannel = async (ctx) => {
  ctx.reply(
    "Вкажіть найефективніші для вас канали пошуку роботи:",
    Markup.keyboard([
      ["Сайти з пошуку роботи"],
      ["Телеграм канали"],
      ["Соціальні мережі"],
      ["Сайти компаній"],
      ["Ярмарки вакансій"],
      ["Сарафанне радіо"],
      ["Інше..."],
    ])
      .oneTime()
      .resize()
  );
};

const askAttention = async (ctx) => {
  ctx.reply(
    "При вивченні вакансії найбільше ви звертаєте увагу:",
    Markup.keyboard([
      ["Місце розташування роботи"],
      ["Рівень заробітної плати"],
      ["Опис посадових обов’язків"],
      ["Соціальний пакет"],
    ]).oneTime()
    //   .resize()
  );
};

const askWorkPlace = async (ctx) => {
  ctx.reply(
    "Який формат роботи ви розглядаєте:",
    Markup.keyboard([["В офісі"], ["Віддалений"], ["Гібридний"]]).oneTime()
    //   .resize()
  );
};

const askFactors = async (ctx) => {
  ctx.reply(
    "Які фактори при пошуку роботи для вас більш значущі:",
    Markup.keyboard([
      ["Сучасний офіс"],
      ["Місцезнаходження офісу"],
      ["Бренд роботодавця"],
      ["Умови роботи"],
    ]).oneTime()
    //   .resize()
  );
};

const askEmigrate = async (ctx) => {
  ctx.reply(
    "Чи плануєте ви при можливості виїжджати за кордон:",
    Markup.keyboard([["Так"], ["Ні"]]).oneTime()
    //   .resize()
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
      ctx.reply("Вітаємо знову! Ви вже зареєстровані.");
      if (!user.name) await askName(ctx);
      else if (!user.phone) await askContact(ctx);
      else if (!user.selected_option) await askOption(ctx);
      else if (!user.graduate) await askEducationLevel(ctx);
      else if (!user.years) await askAge(ctx);
      else if (!user.find_chanel) await askJobSearchChannel(ctx);
      else if (!user.attention) await askAttention(ctx);
      else if (!user.work_place) await askWorkPlace(ctx);
      else if (!user.factors) await askFactors(ctx);
      else if (user.emiigrate === null) await askEmigrate(ctx);
      else {
        ctx.reply(
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

      ctx.reply(`Дякую, ${text}!`);
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
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ selected_option: text });
      await askEducationLevel(ctx);
    } else if (
      !user.graduate &&
      ["Середня", "Середня – спеціальна", "Вища"].includes(text)
    ) {
      // Оновлюємо рівень освіти користувача в базі даних
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ graduate: text });
      await askAge(ctx);
    } else if (
      !user.years &&
      ["До 20", "Від 21-35", "Від 36-45", "Від 46-55", "Від 55"].includes(text)
    ) {
      // Оновлюємо вік користувача в базі даних
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ years: text });
      await askJobSearchChannel(ctx);
    } else if (
      !user.find_chanel &&
      [
        "Сайти з пошуку роботи",
        "Телеграм канали",
        "Соціальні мережі",
        "Сайти компаній",
        "Ярмарки вакансій",
        "Сарафанне радіо",
      ].includes(text)
    ) {
      // Оновлюємо канали пошуку роботи користувача в базі даних
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ find_chanel: text });
      await askAttention(ctx);
    } else if (
      !user.attention &&
      [
        "Місце розташування роботи",
        "Рівень заробітної плати",
        "Опис посадових обов’язків",
        "Соціальний пакет",
      ].includes(text)
    ) {
      // Оновлюємо критерії уваги користувача в базі даних
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ attention: text });
      await askWorkPlace(ctx);
    } else if (
      !user.work_place &&
      ["В офісі", "Віддалений", "Гібридний"].includes(text)
    ) {
      // Оновлюємо формат роботи користувача в базі даних
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ work_place: text });
      await askFactors(ctx);
    } else if (
      !user.factors &&
      [
        "Сучасний офіс",
        "Місцезнаходження офісу",
        "Бренд роботодавця",
        "Умови роботи",
      ].includes(text)
    ) {
      // Оновлюємо фактори пошуку роботи користувача в базі даних
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ factors: text });
      await askEmigrate(ctx);
    } else if (user.emiigrate === null && ["Так", "Ні"].includes(text)) {
      // Оновлюємо плани на виїзд користувача в базі даних
      await knex("users")
        .where({ telegram_id: telegramId })
        .update({ emiigrate: text });

      const { id } = await knex("users")
        .where({ telegram_id: telegramId })
        .select("id")
        .first();
      ctx.reply(
        `Ви успішно зареєстровані! Ваш номер: ${id}\nВаш вибір збережено.\nО 15:30 компанія OneTouch розпочне розіграш. Очікуємо на вас.\nУмови розіграшу:\n- підписатись на [Instagram](https://www.instagram.com/one_touch_vn?igsh=MTdvM2oyMzB5NnIxeg==)\n- підписатись на [TikTok](https://www.tiktok.com/@one.touch.vn?_t=8o5r6mZTWsf&_r=1)`,
        { parse_mode: "Markdown" }
      );
    } else {
      ctx.reply(
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

    ctx.reply("Дякую.");
    await askOption(ctx);
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
