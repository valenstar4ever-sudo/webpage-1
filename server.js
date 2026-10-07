const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Temporary login credentials for local testing
const ADMIN_PASSWORD = "ChangeMe123!";

app.post("/api/login", (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true });
    }

    res.status(401).json({
        success: false,
        message: "Incorrect password"
    });
});

app.get("/api/status", (req, res) => {
    res.json({ message: "Backend is working!" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});