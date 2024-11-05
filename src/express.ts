import express, {Application, Request, Response} from "express";
import cors, {CorsOptions} from "cors";
import {DBot} from "./bot";
import multer from "multer";
import fs from "fs";
import {config, env} from "../config.js";
import {ContentType, TgData, ulyssesTgMiddleware} from "./middleware.js";

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
        //this.app.use(ulyssesTgMiddleware);
    }

    initializeRoutes() {
        this.app.get("/",
            (req: Request, res: Response) => {
                res.status(200).json({message: "Welcome to Dukobpa3's botadmin application."});
            });

        // Create a new Post
        this.app.post("/api",
            upload.single('data'),
            ulyssesTgMiddleware,
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
        if (!req.tgData) {
            res.status(500).json({
                code: 500,
                message: "Empty data to send"
            })
            return;
        }

        const tgData = req.tgData;
        console.log("Sending content:", req.tgData.content)

        return this.chooseRightSendingMethod(tgData)
            .then((result) => {
                console.log("sent to bot", result);
                res.status(201).json(result)
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

    async findAll(req: Request, res: Response) {
        try {
            res.status(200).json(
                config.collection
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

    async chooseRightSendingMethod(tgData: TgData) {
        const res: {
            ok?: boolean
            c?: number
            m?: number
            t?: string
        } = {}

        if (tgData.message) {
            return this.bot
                .EditMessage(tgData)
                .then((response) => {
                    res.t = ContentType[tgData.contentType]
                    if (response === true) {
                        res.ok = true;
                    } else {
                        res.c = response?.chat.id;
                        res.m = response?.message_id;
                    }
                    return res;
                })
        } else if (tgData.contentType == ContentType.text) {
            return this.bot
                .SendMessage(tgData)
                .then((response) => {
                    res.t = ContentType[tgData.contentType];
                    res.c = response?.chat.id;
                    res.m = response?.message_id;
                    return res;
                })
        } else if (tgData.contentType == ContentType.group) {
            return this.bot
                .SendGroupMessage(tgData)
                .then((response) => {
                    const first = response ? response[0] : undefined;
                    res.c = first?.chat.id;
                    res.m = first?.message_id;
                    res.t = ContentType[tgData.contentType];
                    return res;
                })
        } else {
            return this.bot
                .SendMediaMessage(tgData)
                .then((response) => {
                    res.c = response?.chat.id;
                    res.m = response?.message_id;
                    res.t = ContentType[tgData.contentType];
                    return res;
                })
        }
    }
}
