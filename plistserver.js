const express = require('express');
const fs = require('fs');
const https = require('https');
const app = express();

const CONFIG_PATH = './config.json';

function loadConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
    return {
        address: '127.0.0.1:80',
        useSSL: true,
        certPath: './cert.pem',
        keyPath: './key.pem'
    };
}

function saveConfig(config) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

const config = loadConfig();

function startServer() {
    const PLIST_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>{fetchurl}</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>{bundleid}</string>
                <key>bundle-version</key>
                <string>{version}</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>{name}</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;

    app.get('/genPlist', (req, res) => {
        const { bundleid, name, version, fetchurl } = req.query;
        const plistXml = PLIST_TEMPLATE
            .replace('{bundleid}', bundleid)
            .replace('{name}', name)
            .replace('{version}', version)
            .replace('{fetchurl}', fetchurl);

        res.set('Content-Type', 'application/octet-stream');
        res.send(plistXml);
    });

    if (config.useSSL) {
        const options = {
            key: fs.readFileSync(config.keyPath),
            cert: fs.readFileSync(config.certPath)
        };

        https.createServer(options, app).listen(config.address.split(':')[1], config.address.split(':')[0], () => {
            console.log(`Server is running on https://${config.address}`);
        });
    } else {
        app.listen(config.address.split(':')[1], config.address.split(':')[0], () => {
            console.log(`Server is running on http://${config.address}`);
        });
    }
}

startServer();