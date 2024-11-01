import {Server, DBot} from "./src/";

const BOT_TOKEN: string = process.env.BOT_TOKEN ?? (() => { throw new Error("BOT_TOKEN is missing in .env"); })();
const dbot: DBot = new DBot(BOT_TOKEN);
dbot.Run()


const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const server: Server = new Server(PORT, dbot);
server.Run()
