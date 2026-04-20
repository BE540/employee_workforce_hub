"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("./routes/index"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: 'http://localhost:5173', credentials: true }));
app.use(express_1.default.json());
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));
app.use('/api', index_1.default);
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
exports.default = app;
