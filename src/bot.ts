import {Bot, GrammyError, HttpError} from "grammy";

export class DBot {
    bot: Bot

    constructor(BOT_TOKEN: string) {
        this.bot = new Bot(BOT_TOKEN);
        this.config();
    }

    private config(): void {
        this.bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
        this.bot.on("message", (ctx) => ctx.reply("Got another message!"));

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

    async SendMessage(text: string | undefined) {
        if (text === undefined) return

        let text2 = convertUlyssesToTelegramHtml(text)
        console.log("Trying to send:", text2);
        await this.bot.api
            .sendMessage(-1002399074043, text2, {parse_mode: "HTML"})
            .then((message) => {
                console.log(message.from, message.chat, message.message_id);
            })
            .catch((err) => {
                console.log(err);
            });
    }
}

function convertUlyssesToTelegramMd(input: string): string {
    return input
        // Видаляємо заголовки (# Заголовок)
        .replace(/^#{1,6}\s+/gm, "*")
        // Жирний текст: **текст** або __текст__ -> *текст* у Telegram
        .replace(/(\*\*|__)(.*?)\1/g, "*$2*")
        // Курсив *текст* або _текст_ -> _текст_ у Telegram
        .replace(/(\*|_)(.*?)\1/g, "_$2_")
        // Підкреслення: __текст__ -> __underline__ у Telegram
        .replace(/__([^_]+)__/g, "__$1__")
        // Закреслення: ~~текст~~ -> ~текст~
        .replace(/~~(.*?)~~/g, "~$1~")
        // Спойлер: ||текст|| -> ||текст||
        .replace(/\|\|(.*?)\|\|/g, "||$1||")
        // Посилання [текст](URL)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "[$1]($2)")
        // Інлайн-код `код`
        .replace(/`([^`]+)`/g, "`$1`")
        // Блок коду (```код```)
        .replace(/```([\s\S]*?)```/g, "```\n$1\n```")
        // Цитати, що не підтримуються в Telegram
        //.replace(/^>\s+/gm, "")
        // Списки (видаляємо маркери списків)
        .replace(/^\s*([-*+]|\d+\.)\s+/gm, "–")
        // Видаляємо зайві рядки
        .replace(/\n{3,}/g, "\n\n")
        // Видалення картинок ![alt text](URL)
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "");
}

function escapeForTelegramMarkdown(input: string): string {
    // Загальне екранування символів, щоб уникнути конфліктів у Telegram Markdown
    let escaped = input
        .replace(/\\/g, "\\\\")       // Спершу екрануємо всі \
        .replace(/_/g, "\\_")
        .replace(/\*/g, "\\*")
        .replace(/\[/g, "\\[")
        .replace(/]/g, "\\]")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/~/g, "\\~")
        .replace(/`/g, "\\`")
        .replace(/>/g, "\\>")
        .replace(/#/g, "\\#")
        .replace(/\+/g, "\\+")
        .replace(/-/g, "\\-")
        .replace(/=/g, "\\=")
        .replace(/\|/g, "\\|")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}")
        .replace(/\./g, "\\.")
        .replace(/!/g, "\\!");

    // Спеціальне екранування для pre та code блоків
    escaped = escaped.replace(/`/g, "\\`");

    // Спеціальне екранування всередині посилань та custom emoji
    escaped = escaped.replace(/\((.*?)\)/g, (match) => {
        return match.replace(/\)/g, "\\)").replace(/\\/g, "\\\\");
    });

    return escaped;
}

function convertUlyssesToTelegramHtml(input: string): string {
    return input
        .replace(/^>(.*?)\n/g, (match, quote) => {
            return `<blockquote>${escapeHtml(quote)}</blockquote>\n`
        }) // Цитата
        .replace(/#+(.*?)\n/g, '<strong>$1</strong>\n') // Заголовок
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Жирний текст
        .replace(/__(.*?)__/g, '<u>$1</u>') // Підкреслений
        .replace(/_(.*?)_/g, '<i>$1</i>') // Курсив
        .replace(/~(.*?)~/g, '<s>$1</s>') // Закреслений
        .replace(/\|\|(.*?)\|\|/g, '<span class="tg-spoiler">$1</span>') // Спойлер
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Посилання
        .replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
        }) // Блок коду
        .replace(/`(.*?)`/g, (match, code) => {
            return `<code>${escapeHtml(code)}</code>`
        }); // Вбудований код
}

function escapeHtml(input: string): string {
    return input.replace(/</g, '&lt;') // Заміна < на &lt;
        .replace(/>/g, '&gt;') // Заміна > на &gt;
        .replace(/&/g, '&amp;'); // Заміна & на &amp;
}
