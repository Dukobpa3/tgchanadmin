import fs from "fs";
import * as yaml from "js-yaml";

interface Collection {
    [key: string]: string;
}

export interface Config {
    collection: Collection;
}

interface Env {
    botToken: string;
    port: number;
    botStorFiles: boolean;
}

export const env: Env = new class implements Env {
    botToken: string = "";
    port: number = 0;
    botStorFiles: boolean = false;
}

export const config = loadConfig('config.yml');

env.botToken = process.env.BOT_TOKEN ?? (() => {
    throw new Error("BOT_TOKEN is missing in .env");
})();

env.port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

env.botStorFiles = process.env.BOT_STORE_FILES === 'true';

function loadConfig(filePath: string): Config {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents) as Config;
    return data;
}
