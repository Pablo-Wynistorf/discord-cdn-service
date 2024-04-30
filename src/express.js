const express = require('express');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const { timeStamp } = require('console');
require('dotenv').config();

const API_PORT = process.env.API_PORT;
const APP_URL = process.env.APP_URL;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const app = express();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.login(DISCORD_BOT_TOKEN);

const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(cors());

app.use('/', express.static(path.join(__dirname, 'public/home')));
app.use('/links', express.static(path.join(__dirname, 'public/links')));

const checkFileUpload = async (req, res, next) => {
    const requestSize = req.headers['content-length'];
    if (requestSize > 500 * 1024 * 1024) {
        return res.status(460).json({ message: 'You cannot upload more than 500MB of data per single request' });
    }
    next();
};

app.post("/api/upload", checkFileUpload, upload.array("files"), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).send("Please upload at least one file");
        }

        for (const file of files) {
            if (file.size > 25 * 1024 * 1024) {
                return res.status(461).json({ message: `The file '${file.originalname}' exceeds the 25MB limit per file` });
            }
        }

        const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        if (!channel) {
            return res.status(500).send('Internal Server Error');
        }

        const messageIds = [];
        for (const file of files) {
            channel.send({ files: [{ attachment: file.path, name: file.originalname }] })
                .then(message => {
                    messageIds.push({ [file.originalname]: `${APP_URL}/attachment/${message.id}` });
                    if (messageIds.length === files.length) {
                        res.json({ cdnLinks: messageIds });
                    }
                    fs.unlink(file.path, err => {
                        if (err) {
                            console.error(`Error deleting file ${file.path}:`, err);
                        }
                    });
                })
                .catch(error => {
                    res.status(500).send('Internal Server Error');
                });
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


app.get("/attachment/:messageId", async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);

        const message = await channel.messages.fetch(messageId);
        if (!message) return res.redirect('/');

        const attachments = [];
        message.attachments.each(attachment => {
            attachments.push(attachment.url);
        });

        if (attachments.length === 0) {
            return res.redirect('/')
        }
        return res.redirect(attachments[0]);
    } catch (err) {
        return res.redirect('/')
    }
});


app.get("/attachment" , async (req, res) => {
    return res.redirect('/')
});


app.listen(API_PORT, () => {
    client.on('ready', () => {
        console.log(`Logged in as application: ${client.user.tag}!`);
        console.log(`API started at http://localhost:${API_PORT}`);

        setInterval(async () => {
            try {
                const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
                await channel.messages.cache.clear();
            } catch (err) {
                console.error('Error clearing cache:', err);
            }
        }, 1 * 60 * 1000);
    });
});


