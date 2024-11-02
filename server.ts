import {Server, DBot} from "./src/";
import {config, env} from "./src/config";

const dbot: DBot = new DBot(env.botToken, config);
dbot.Run()



const server: Server = new Server(env.port, dbot);
server.Run()





