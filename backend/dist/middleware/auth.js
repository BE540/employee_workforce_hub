"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scopeQueryToUserProjects = exports.requireProjectAccess = exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const authenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = auth.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireProjectAccess = (req, res, next) => {
    const projectId = req.params.projectId || req.query.project_id || req.body.project_id;
    if (projectId && !req.user.projects.includes(Number(projectId))) {
        return res.status(403).json({ error: 'Access denied to this project' });
    }
    next();
};
exports.requireProjectAccess = requireProjectAccess;
const scopeQueryToUserProjects = async (req, res, next) => {
    try {
        const user = req.user;
        let userProjects = [];
        if (user.role === 'vp' || user.role === 'director') {
            // VPs and Directors have access to all projects
            const [projects] = await db_1.default.execute('SELECT id FROM projects');
            userProjects = projects.map(p => p.id);
        }
        else {
            // Managers only have access to assigned projects
            const [userProj] = await db_1.default.execute('SELECT project_id FROM user_projects WHERE user_id = ?', [user.id]);
            userProjects = userProj.map(up => up.project_id);
        }
        req.userProjects = userProjects;
        req.user.projects = userProjects;
        next();
    }
    catch (err) {
        console.error('Error fetching user projects:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.scopeQueryToUserProjects = scopeQueryToUserProjects;
