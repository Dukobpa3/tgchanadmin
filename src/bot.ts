import {Bot, GrammyError, HttpError, RawApi} from "grammy";
import {config} from "../config.js";
import {convertUlyssesToTelegramHtml} from "./parser.js";
import {ContentType, TgData} from "./middleware.js";
import {InputFile, InputMediaAudio, InputMediaDocument, InputMediaPhoto, InputMediaVideo} from "grammy/types";
import {Other} from "grammy/out/core/api";

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
        if (!tgData.content || !tgData.channel || !tgData.media) return;

        const media = tgData.media as InputFile;
        const text2 = convertUlyssesToTelegramHtml(tgData.content);

        type other = Other<RawApi, "sendPhoto", "photo" | "chat_id">;
        let options: other = {parse_mode: "HTML"};

        const textByteLength = Buffer.byteLength(text2, 'utf-8');
        if (textByteLength < 1024) {
            options.caption = text2;
        }

        const sendMedia = (sendMethod: Function) =>
            sendMethod(tgData.channel, media, options)
                .then((msg: any) => {
                    if (textByteLength >= 1024) {
                        return this.bot.api.sendMessage(tgData.channel, text2, {
                            parse_mode: "HTML",
                            disable_notification: true,
                            reply_to_message_id: msg.message_id
                        });
                    } else {
                        return Promise.resolve(msg)
                    }
                });

        switch (tgData.contentType) {
            case ContentType.photo:
                return sendMedia((id:number, media:InputFile, options:other) => this.bot.api.sendPhoto(id, media, options));
            case ContentType.video:
                return sendMedia((id:number, media:InputFile, options:other) => this.bot.api.sendVideo(id, media, options));
            case ContentType.animation:
                return sendMedia((id:number, media:InputFile, options:other) => this.bot.api.sendAnimation(id, media, options));
            case ContentType.audio:
                return sendMedia((id:number, media:InputFile, options:other) => this.bot.api.sendAudio(id, media, options));
            case ContentType.document:
                return sendMedia((id:number, media:InputFile, options:other) => this.bot.api.sendDocument(id, media, options));
        }
    }

    async SendGroupMessage(tgData: TgData) {
        if (tgData.content === undefined) return
        if (tgData.channel === undefined) return
        if (tgData.media === undefined) return

        const media = tgData.media as Array<InputMediaDocument | InputMediaAudio | InputMediaPhoto | InputMediaVideo>
        if (media === undefined) return;

        let text2 = convertUlyssesToTelegramHtml(tgData.content)

        const textByteLength = Buffer.byteLength(text2, 'utf-8');
        if (textByteLength < 1024) {
            media[0].caption = text2
        }

        return this.bot.api.sendMediaGroup(tgData.channel, media)
            .then((msg: any) => {
                if (textByteLength >= 1024) {
                    return this.bot.api.sendMessage(tgData.channel, text2, {
                        parse_mode: "HTML",
                        disable_notification: true,
                        reply_parameters: {message_id: msg[0].message_id}
                    })
                } else {
                    return Promise.resolve(msg)
                }
            });
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

function isTooLong(text: string): boolean {
    const textByteLength = Buffer.byteLength(text, 'utf-8');
    return textByteLength >= 1024
}
