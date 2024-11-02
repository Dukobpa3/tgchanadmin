import {Server, DBot} from "./src/";

import * as fs from 'fs';
import * as yaml from 'js-yaml';


const config = loadConfig('config.yml');

const BOT_TOKEN: string = process.env.BOT_TOKEN ?? (() => {
    throw new Error("BOT_TOKEN is missing in .env");
})();
const dbot: DBot = new DBot(BOT_TOKEN, config);
dbot.Run()


const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const server: Server = new Server(PORT, dbot);
server.Run()


interface ChannelGroup {
    channel: number;
    group: number;
}

interface Collection {
    [key: string]: ChannelGroup;
}

export interface Config {
    collection: Collection;
}

function loadConfig(filePath: string): Config {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents) as Config;
    return data;
}

