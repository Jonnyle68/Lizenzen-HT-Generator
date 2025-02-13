const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware, um JSON-Daten aus Requests zu verarbeiten
app.use(express.json());

app.post("/check-license", (req, res) => {
    const { name, email, licenseKey } = req.body;
    
    // Überprüfen, ob alle nötigen Parameter vorhanden sind
    if (!name || !email || !licenseKey) {
        return res.status(400).json({ error: "Name, E-Mail und Lizenzschlüssel sind erforderlich" });
    }

    const filePath = path.join(__dirname, "licenses.json");
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Fehler beim Lesen der Lizenzdatei:", err);
            return res.status(500).json({ error: "Interner Serverfehler" });
        }
        try {
            const licenses = JSON.parse(data).licenses;
            // Suchen nach einem Eintrag, der alle Kriterien erfüllt
            const license = licenses.find(l => 
                l.name === name &&
                l.email === email &&
                l.licenseKey === licenseKey
            );

            if (license) {
                res.json({ active: license.active });
            } else {
                res.json({ active: false });
            }
        } catch (parseError) {
            console.error("Fehler beim Verarbeiten der JSON-Datei:", parseError);
            res.status(500).json({ error: "Fehlerhafte JSON-Datei" });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Lizenz-Server läuft auf http://localhost:${PORT}`);
});
