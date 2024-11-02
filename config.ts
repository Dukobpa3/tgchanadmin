import fs from "fs";
import * as yaml from "js-yaml";
import {fileURLToPath} from 'url';
import path from 'path';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

interface Collection {
    [key: string]: string;
}

export interface Config {
    collection: Collection;
}

interface Env {
    botToken: string;
    port: number;
    botUploadPath: string;
}

export const env: Env = new class implements Env {
    botToken: string = "";
    port: number = 0;
    botUploadPath: string = "";
}

export const config = loadConfig('config.yml');

env.botToken = process.env.BOT_TOKEN ?? (() => {
    throw new Error("BOT_TOKEN is missing in .env");
})();

env.port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

env.botUploadPath = process.env.BOT_UPLOAD_PATH ? path.join(projectRoot, process.env.BOT_UPLOAD_PATH) : "";

function loadConfig(filePath: string): Config {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents) as Config;
    return data;
}
