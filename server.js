const express = require("express");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

// Middleware zur Verarbeitung von JSON-Requests
app.use(express.json());

// Rate-Limiting (max. 10 Anfragen pro Minute pro IP)
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 Minute
    max: 10, // 10 Anfragen pro Minute
    message: { error: "Zu viele Anfragen, bitte warte etwas!" }
});
app.use("/check-license", limiter);

// Lizenzprüfung mit Signatur
app.post("/check-license", (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: "Name und E-Mail erforderlich" });
    }

    // JSON-Datei sicher lesen
    const filePath = path.join(__dirname, "licenses.json");
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Fehler beim Lesen der Lizenzdatei:", err);
            return res.status(500).json({ error: "Interner Serverfehler" });
        }

        try {
            const licenses = JSON.parse(data).licenses;
            const license = licenses.find(l => l.name === name && l.email === email);

            if (license) {
                // Überprüfung der Lizenz mit HMAC-Signatur
                const secret = "geheimes_schluessel"; // Sollte in einer ENV-Variable gespeichert werden!
                const signature = crypto.createHmac("sha256", secret)
                                        .update(name + email)
                                        .digest("hex");

                res.json({ active: license.active, signature: signature });
            } else {
                res.json({ active: false });
            }
        } catch (parseError) {
            console.error("Fehler beim Verarbeiten der JSON-Datei:", parseError);
            res.status(500).json({ error: "Fehlerhafte JSON-Datei" });
        }
    });
});

// Server starten
app.listen(PORT, () => {
    console.log(`Sicherer Lizenz-Server läuft auf http://localhost:${PORT}`);
});

