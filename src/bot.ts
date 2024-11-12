import {Bot, GrammyError, HttpError} from "grammy";
import {config} from "../config.js";
import {convertUlyssesToTelegramHtml} from "./parser.js";
import {ContentType, TgData} from "./middleware.js";
import {InputFile, InputMediaAudio, InputMediaDocument, InputMediaPhoto, InputMediaVideo} from "grammy/types";

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

        return this.bot.api
            .sendMessage(tgData.channel, text2, {parse_mode: "HTML"});
    }

    async SendMediaMessage(tgData: TgData) {
        if (tgData.content === undefined) return
        if (tgData.channel === undefined) return

        const media = tgData.media as InputFile;
        if (media === undefined) return;

        let text2 = convertUlyssesToTelegramHtml(tgData.content)

        switch (tgData.contentType) {
            case ContentType.photo:
                return this.bot.api
                    .sendPhoto(tgData.channel, media, {parse_mode: "HTML", caption: text2});
            case ContentType.video:
                return this.bot.api
                    .sendVideo(tgData.channel, media, {parse_mode: "HTML", caption: text2});
            case ContentType.animation:
                return this.bot.api
                    .sendAnimation(tgData.channel, media, {parse_mode: "HTML", caption: text2});
            case ContentType.audio:
                return this.bot.api
                    .sendAudio(tgData.channel, media, {parse_mode: "HTML", caption: text2});
            case ContentType.document:
                return this.bot.api
                    .sendDocument(tgData.channel, media, {parse_mode: "HTML", caption: text2});
        }
    }

    async SendGroupMessage(tgData: TgData) {
        if (tgData.content === undefined) return
        if (tgData.channel === undefined) return
        if (tgData.media === undefined) return

        const media = tgData.media as Array<InputMediaDocument | InputMediaAudio | InputMediaPhoto | InputMediaVideo>
        if (media === undefined) return;

        media[0].caption = convertUlyssesToTelegramHtml(tgData.content);
        return this.bot.api.sendMediaGroup(tgData.channel, media);
    }

    async EditMessage(tgData: TgData) {
        if (tgData.content === undefined) return
        if (tgData.channel === undefined) return
        if (tgData.message === undefined) return

        let text2 = convertUlyssesToTelegramHtml(tgData.content)

        console.log("Trying to edit:", tgData.channel, tgData.message, tgData.contentType);
        if (tgData.contentType != ContentType.text) {
            return this.bot.api
                .editMessageCaption(tgData.channel, tgData.message, {parse_mode: "HTML", caption: text2});

        } else {
            return this.bot.api
                .editMessageText(tgData.channel, tgData.message, text2, {parse_mode: "HTML"});
        }
    }
}
