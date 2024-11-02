import {Bot, GrammyError, HttpError} from "grammy";
import {Config} from "../server"

export class DBot {
    bot: Bot
    config: Config

    constructor(BOT_TOKEN: string, config: Config) {
        if (config) {
            console.log(config.collection.bhl.channel);
        }

        this.config = config;
        this.bot = new Bot(BOT_TOKEN);
        this.initialize();
    }

    private initialize(): void {
        this.bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

        this.bot.command('send', async (ctx) => {
            await this.bot.api.sendMessage(this.config.collection.my.channel, 'Тестове повідомлення!');
        });

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

    async SendMessage(text: string | undefined, key: string | undefined) {
        if (text === undefined) return
        if (key === undefined) return

        const id = this.config.collection[key].channel

        let text2 = convertUlyssesToTelegramHtml(text)
        console.log("Trying to send:", text2);
        await this.bot.api
            .sendMessage(id, text2, {parse_mode: "HTML"})
            .then((message) => {
                console.log(message.from, message.chat, message.message_id);
            })
            .catch((err) => {
                console.log(err);
            });
    }
}

function convertUlyssesToTelegramHtml(input: string): string {
    return input
        .replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
        }) // Code block
        .replace(/`(.*?)`/g, (match, code) => {
            return `<code>${escapeHtml(code)}</code>`
        }) // Inline code
        .replace(/(^|\n)(>.*?\n)+/g, (match) => {
            return `<blockquote>${escapeHtml(match.replace(/^> ?/gm, '').trim())}</blockquote>\n`
        }) // Quote
        .replace(/#+(.*?)\n/g, '<strong>$1</strong>\n') // Headers
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/__(.*?)__/g, '<u>$1</u>') // Underline
        .replace(/_(.*?)_/g, '<i>$1</i>') // Italic
        .replace(/~(.*?)~/g, '<s>$1</s>') // Stroke
        .replace(/\|\|(.*?)\|\|/g, '<span class="tg-spoiler">$1</span>') // Spoiler
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>'); // Link

}

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;') // Change & to &amp;
        .replace(/</g, '&lt;') // Change < to &lt;
        .replace(/>/g, '&gt;'); // Change > to &gt;
}
