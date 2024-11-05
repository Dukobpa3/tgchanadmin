import {DBot} from "./src/bot.js";
import {DServer} from "./src/express.js";
import {env} from "./config.js";

const dbot: DBot = new DBot(env.botToken);
dbot.Run()

const server: DServer = new DServer(env.port, dbot);
server.Run()
