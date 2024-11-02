import {DBot} from "./src/bot.js";
import {DServer} from "./src/express.js";
import {config, env} from "./config.js";

const dbot: DBot = new DBot(env.botToken, config);
//dbot.Run()

const server: DServer = new DServer(env.port, dbot);
server.Run()





