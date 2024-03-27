const express = require('express');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();


const API_PORT = process.env.API_PORT;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const app = express();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.login(DISCORD_BOT_TOKEN);


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());
app.use(cors());

app.use('/', express.static(path.join(__dirname, 'public')));


app.post("/api/upload", upload.array("files"), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).send("Please upload at least one file");
        }

        let totalSize = 0;
        for (const file of files) {
            totalSize += file.size;
        }
        if (totalSize > 25 * 1024 * 1024) {
            return res.status(413).send("At least one file exceeds the 25MB limit.");
        }

        const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        if (channel && files) {
            const cdnLinks = [];
            for (const file of files) {
                channel.send({ files: [{ attachment: file.buffer, name: file.originalname }] })
                    .then(message => {
                        const cdnLink = message.attachments.first().url;
                        cdnLinks.push({ [file.originalname]: cdnLink });
                        if (cdnLinks.length === files.length) {
                            res.json({ cdnLinks });
                        }
                    })
                    .catch(error => {
                        res.status(500).send('Internal Server Error');
                    });
            }
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


app.listen(API_PORT, () => {
    client.on('ready', () => {
        console.log(`Logged in as application: ${client.user.tag}!`);
        console.log(`API started at http://localhost:${API_PORT}`);
    });
});
