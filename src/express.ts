import express, {Application, Request, Response} from "express";
import cors, {CorsOptions} from "cors";
import {DBot} from "./bot";
import multer from "multer";
import AdmZip from "adm-zip";
import mime from 'mime-types';
import fs from "fs";
import {env} from "../config.js";

const memoryStorage = multer.memoryStorage();
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = env.botUploadPath;
        fs.mkdirSync(uploadPath, {recursive: true});
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const safeName = `${Date.now()}-${originalName}`;
        cb(null, safeName);
    }
});

const storage = env.botUploadPath === "" ? memoryStorage : diskStorage;
const upload = multer({storage});

export class DServer {

    app: Application = express();
    bot: DBot;
    port: number;

    constructor(port: number, bot: DBot) {
        this.port = port
        this.bot = bot
        this.config();
        this.initializeRoutes();
    }

    private config(): void {
        const corsOptions: CorsOptions = {
            origin: "http://0.0.0.0:8081"
        };

        this.app.use(cors(corsOptions));
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: false}));
    }

    initializeRoutes() {
        this.app.get("/",
            (req: Request, res: Response) => {
                res.status(200).json({message: "Welcome to Dukobpa3's botadmin application."});
            });

        // Create a new Post
        this.app.post("/api", upload.single('data'),
            (req, res) => this.create(req, res));

        // Retrieve all available channels
        this.app.get("/api", (req, res) => this.findAll(req, res));

        // Retrieve a single Post with id
        this.app.get("/api:id", this.findOne);

        // Update a Post with id
        this.app.put("/api:id", this.update);

        // Delete a Post with id
        this.app.delete("/api:id", this.delete);
    }

    Run() {
        const port = this.port
        return this.app.listen(port, "0.0.0.0", function () {
            console.log(`Server is running on port ${port}.`);
        })
            .on("error", (err: any) => {
                if (err.code === "EADDRINUSE") {
                    console.log("Error: address already in use");
                } else {
                    console.log(err);
                }
            });
    }


    async create(req: Request, res: Response) {
        console.log("Received data is:", req.body)

        if (!req.file)
            res.status(400).send('No file uploaded.');
        else {
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

            let content: string | undefined = undefined;
            zipEntries.forEach(entry => {
                console.log("Unzipped entry", entry.entryName)
                if (!entry.isDirectory) {
                    const mimeType = mime.lookup(entry.name);
                    if (mimeType && (mimeType as string).startsWith("text/")) {
                        content = zip.readAsText(entry);
                    }
                    // else if(mimeType.) { if media
                    //
                    // }
                }
            });

            console.log("Sending content:", content)
            this.bot
                .SendMessage(content, req.body.channel)
                .then((message) => {
                    console.log("sent to bot");
                    if (message === true) res.status(201).json({
                        ok: message,
                    });
                    else res.status(201).json({
                        m: message?.message_id,
                        c: message?.chat.id,
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json({
                        code: err.error_code,
                        name: err.name,
                        description: err.description
                    })
                });
        }
    }

    async findAll(req: Request, res: Response) {
        try {
            res.status(200).json(
                Object.keys(this.bot.config.collection)
            );
        } catch (err) {
            res.status(500).json({
                message: "Internal Server Error!"
            });
        }
    }

    async findOne(req: Request, res: Response) {
        try {
            res.status(200).json({
                message: "findOne OK",
                reqParamId: req.params.id
            });
        } catch (err) {
            res.status(500).json({
                message: "Internal Server Error!"
            });
        }
    }

    async update(req: Request, res: Response) {
        try {
            res.status(200).json({
                message: "update OK",
                reqParamId: req.params.id,
                reqBody: req.body
            });
        } catch (err) {
            res.status(500).json({
                message: "Internal Server Error!"
            });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            res.status(200).json({
                message: "delete OK",
                reqParamId: req.params.id
            });
        } catch (err) {
            res.status(500).json({
                message: "Internal Server Error!"
            });
        }
    }
}
