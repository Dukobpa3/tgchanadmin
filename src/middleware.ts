import {NextFunction, Request, Response} from 'express';
import {env} from "../config.js";
import fs from "fs";
import AdmZip from "adm-zip";
import mime from "mime-types";
import {InputFile, InputMediaAudio, InputMediaDocument, InputMediaPhoto, InputMediaVideo} from "grammy/types";
import {InputMediaBuilder} from "grammy";

export type InputMedia = InputMediaAudio | InputMediaDocument | InputMediaPhoto | InputMediaVideo

export enum ContentType {
    Text, // simple message without media
    Media, // generic media type
    Photo,
    Video,
    Audio,
    Document, // any attachment
    Group,
}

export interface TgData {
    channel: number;
    message: number | undefined;
    content: string | undefined;
    contentType: ContentType;
    media: ReadonlyArray<InputMedia>;
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
        media: media,
    }

    next();
}

function getContentType(clientSign: string, media: Array<InputMedia>) {
    switch (clientSign) {
        case 'm':
            return ContentType.Media;
        case 'p':
            return ContentType.Photo;
        case 'v':
            return ContentType.Video;
        case 'a':
            return ContentType.Audio;
        default:
            return getReversContentType(media);
    }
}

function getReversContentType(media: Array<InputMedia>) {
    // todo check if there is only media or with documents

    let firstElemType: ContentType;

    switch (media[0].type) {
        case 'photo':
            firstElemType = ContentType.Photo;
            break;
        case 'video':
            firstElemType = ContentType.Video;
            break;
        case 'audio':
            firstElemType = ContentType.Audio;
            break;
        case "document":
            firstElemType = ContentType.Document;
            break;
    }

    switch (media.length) {
        case 0:
            return ContentType.Text;
        case 1:
            return firstElemType;
        default:
            return ContentType.Group;
    }
}
