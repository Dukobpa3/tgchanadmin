import {NextFunction, Request, Response} from 'express';
import {env} from "../config.js";
import fs from "fs";
import AdmZip from "adm-zip";
import mime from "mime-types";
import {InputFile, InputMedia,} from "grammy/types";
import {InputMediaBuilder} from "grammy";

export enum ContentType {
    text = 'text', // simple message without media
    media = 'media', // generic media type
    photo = 'photo',
    video = 'video',
    audio = 'audio',
    animation = 'animation',
    document = 'document', // any attachment
    group = 'group',
}

export interface TgData {
    channel: number;
    message: number | undefined;
    content: string | undefined;
    contentType: ContentType;
    media?: InputFile | ReadonlyArray<InputMedia>;
}

declare global {
    namespace Express {
        export interface Request {
            tgData?: TgData;
        }
    }
}

export async function ulyssesTgMiddleware(req: Request, res: Response, next: NextFunction) {
    console.log("Received data is:", req.body)

    if (!req.file) {
        res.status(400).json({
            code: 400,
            message: 'No file uploaded.'
        });
        return
    }

    console.log("Received file is:", req.file.size, req.file.originalname, req.file.mimetype)

    let fileBuffer;
    if (env.botUploadPath === "") {
        fileBuffer = req.file.buffer;
    } else {
        fileBuffer = fs.readFileSync(req.file.path);
    }

    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();
    console.log("Entries in archive:", zipEntries.length)

    let media = new Array<InputMedia>()
    let text: string = "";
    zipEntries.forEach(entry => {
        console.log("Unzipped entry", entry.entryName)
        if (!entry.isDirectory) {
            const mimeType = mime.lookup(entry.name);
            if (!mimeType) {
                return;
            }

            const buffer = entry.getData();

            if (mimeType.startsWith("text/")) {
                if (text !== "") {
                    text = `${text}\n----`
                }
                text = `${text}${zip.readAsText(entry)}`;
            } else if (mimeType.startsWith("image/")) {
                media.push(InputMediaBuilder.photo(new InputFile(buffer, entry.name), {parse_mode: "HTML"}));
            } else if (mimeType.startsWith("video/")) {
                media.push(InputMediaBuilder.video(new InputFile(buffer, entry.name), {parse_mode: "HTML"}));
            } else if (mimeType.startsWith("audio/")) {
                media.push(InputMediaBuilder.audio(new InputFile(buffer, entry.name), {parse_mode: "HTML"}));
            } else if (mimeType.startsWith("animation/")) {
                media.push(InputMediaBuilder.animation(new InputFile(buffer, entry.name), {parse_mode: "HTML"}));
            } else {
                // todo pass documents for now
                //media.push(InputMediaBuilder.document(new InputFile(buffer), {parse_mode: "HTML"}));
            }
        }
    });

    req.tgData = {
        channel: parseInt(req.body.channel),
        message: parseInt(req.body.message),
        content: text,
        contentType: getContentType(req.body.media, media),
    }

    if (media.length > 0) {
        req.tgData.media = media.length > 1
            ? media
            : media[0].media as InputFile;
    }

    next();
}

function getContentType(clientSign: string, media: Array<InputMedia>) {
    if (clientSign in ContentType) {
        return ContentType[clientSign as keyof typeof ContentType]
    } else if (media.length === 0) {
        return ContentType.text;
    } else if (media.length === 1) {
        return ContentType[media[0].type as keyof typeof ContentType];
    }
    return ContentType.group;
}
