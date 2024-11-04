import {Bot, GrammyError, HttpError} from "grammy";
import {config} from "../config.js";
import {convertUlyssesToTelegramHtml} from "./parser.js";
import {ContentType, TgData} from "./middleware.js";

export class DBot {
    bot: Bot

    constructor(BOT_TOKEN: string) {
        if (config) {
            console.log(`Registered ${Object.keys(config.collection).length} channels amount`);
        }

        this.bot = new Bot(BOT_TOKEN);
        this.initialize();
    }

    private initialize(): void {
        this.bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

        this.bot.catch((err) => {
            const ctx = err.ctx;
            console.error(`Error while handling update ${ctx.update.update_id}:`);
            const e = err.error;
            if (e instanceof GrammyError) {
                console.error("Error in request:", e.description);
            } else if (e instanceof HttpError) {
                console.error("Could not contact Telegram:", e);
            } else {
                console.error("Unknown error:", e);
            }
        });
    }

    Run() {
        this.bot.start();
    }

    Stop() {
        this.bot.stop()
    }

    async SendMessage(tgData: TgData) {
        if (tgData.content === undefined) return
        if (tgData.channel === undefined) return

        let text2 = convertUlyssesToTelegramHtml(tgData.content)


        if (tgData.message) {
            console.log("Trying to edit:", tgData.channel, tgData.message, tgData.contentType);
            if (tgData.contentType > 0) {
                return this.bot.api
                    .editMessageCaption(tgData.channel, tgData.message, {parse_mode: "HTML", caption: text2});

            } else {
                return this.bot.api
                    .editMessageText(tgData.channel, tgData.message, text2, {parse_mode: "HTML"});
            }
        } else {
            console.log("Trying to send:", tgData.channel, tgData.message, ContentType[tgData.contentType]);
            switch (tgData.contentType) {
                case ContentType.Text:
                    return this.bot.api
                        .sendMessage(tgData.channel, text2, {parse_mode: "HTML"});
                case ContentType.Photo:
                    return this.bot.api
                        .sendPhoto(tgData.channel, tgData.media[0].media, {parse_mode: "HTML", caption: text2});
                case ContentType.Video:
                    return this.bot.api
                        .sendVideo(tgData.channel, tgData.media[0].media, {parse_mode: "HTML", caption: text2});
                case ContentType.Audio:
                    return this.bot.api
                        .sendAudio(tgData.channel, tgData.media[0].media, {parse_mode: "HTML", caption: text2});
                case ContentType.Document:
                    return this.bot.api
                        .sendDocument(tgData.channel, tgData.media[0].media, {parse_mode: "HTML", caption: text2});
                case ContentType.Group:
                    tgData.media[0].caption = text2;
                    return this.bot.api
                        .sendMediaGroup(tgData.channel, tgData.media);
            }

        }
    }

}
