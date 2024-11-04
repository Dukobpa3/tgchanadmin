import {Bot, GrammyError, HttpError} from "grammy";
import {config, Config} from "../config.js";

export class DBot {
    bot: Bot
    config: Config

    constructor(BOT_TOKEN: string, config: Config) {
        if (config) {
            console.log(`Registered ${Object.keys(config.collection).length} channels amount`);
        }

        this.config = config;
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

    async SendMessage(text: string | undefined, channel: number | undefined, message: number|undefined) {
        if (text === undefined) return
        if (channel === undefined) return

        let text2 = convertUlyssesToTelegramHtml(text)
        console.log("Trying to send:", channel, message, text2);

        if (message) {
            console.log("Trying to edit:", channel, message);
            return this.bot.api
                .editMessageText(channel, message, text2, {parse_mode: "HTML"})
                .then((resp) => {
                    console.log();
                    return resp;
                });
        } else {
            return this.bot.api
                .sendMessage(channel, text2, {parse_mode: "HTML"})
                .then((message) => {
                    console.log(message.from, message.chat, message.message_id);
                    return message;
                });
        }
    }
}

function getMessageId(text: string, chat: string): string {
    const reg = new RegExp(`<!--.*?ulysses-tg\\s+${chat}:(\\d+).*?-->`);
    const match = text.match(reg)
    console.log("Message id match:", match)
    return match ? match[1] : "";
}

function convertUlyssesToTelegramHtml(input: string): string {
    return input
        .replace(/\s*<!--.*ulysses-tg.*-->\s*/g, "\n") // clean technical information

        .replace(/~(.*?)~/g, (match, code) => {
            return `<pre>${escapeHtml(code)}</pre>`
        }) // Preformat
        .replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
        }) // Code block
        .replace(/`(.*?)`/g, (match, code) => {
            return `<code>${escapeHtml(code)}</code>`
        }) // Inline code
        .replace(/(^|\n)(>.*?\n)+/g, (match) => {
            return `\n<blockquote>${match.replace(/^> ?/gm, '').trim()}</blockquote>\n`
        }) // Quote

        .replace(/\|\|(.*?)\|\|/g, '<span class="tg-spoiler">$1</span>') // Spoiler
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/__(.*?)__/g, '<u>$1</u>') // Underline
        .replace(/_(.*?)_/g, '<i>$1</i>') // Italic
        .replace(/~(.*?)~/g, '<s>$1</s>') // Stroke

        .replace(/(^|\n)#{2,}[ \t](.*?)\n/g, (match, p1, p2) => {
            return `\n<strong>${markP2(p2)}</strong>\n`
        }) // Header 2
        .replace(/(^|\n)#[ \t](.*?)\n/g, (match, p1, p2) => {
            return `\n<strong>${markP1(p2)}</strong>\n`
        }) // Header 1

        .replace(/(^|\n)([ \t]+[*-].*?)(?=\n)/g, (match, p1, p2) => {
            return `\n   ${markList2(p2)}`
        }) // List 2
        .replace(/(^|\n)([*-].*?)(?=\n)/g, (match, p1, p2) => {
            return `\n ${markList1(p2)}`
        }) // List 1

        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Link

        // Cleanup zone
        .replace(/\n\n\n/g, '\n\n')
        .replace(/<\/pre>\n\n/g, '</pre>\n')
        .trim();

}

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;') // Change & to &amp;
        .replace(/</g, '&lt;') // Change < to &lt;
        .replace(/>/g, '&gt;'); // Change > to &gt;
}

function markP1(input: string): string {
    const marker = config.format.header.first ? `${config.format.header.first} ` : ``;
    return `${marker}${input}`;
}

function markP2(input: string): string {
    const marker = config.format.header.first ? `${config.format.header.second} ` : ``;
    return `${marker}${input}`;
}

function markList1(input: string): string {
    console.log("Editing List 1:", input)
    const marker = config.format.list.first ?? `–`;
    return input.replace(/^([-*])\s/g, `${marker} `);
}

function markList2(input: string): string {
    console.log("Editing List 2:", input)
    const marker = config.format.list.second ?? `–`;
    return input
        .replace(/^\s+([-*])\s/g, `${marker} `);
}
