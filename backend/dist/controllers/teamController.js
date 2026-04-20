"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjects = exports.getTeamMembers = exports.getTeamSkillCoverage = exports.getTeams = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/teams?project_id=
const getTeams = async (req, res) => {
    const { project_id } = req.query;
    const userProjects = req.userProjects || [];
    try {
        let query = `
      SELECT
         t.id, t.name, t.description,
         p.id AS project_id, p.name AS project_name,
         u.name AS manager_name,
         COUNT(DISTINCT e.id) AS member_count,
         ROUND(AVG(e.utilization_pct)) AS avg_utilization
       FROM teams t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.manager_id = u.id
       LEFT JOIN employees e ON e.current_team_id = t.id
       WHERE t.project_id IN (${userProjects.map(() => '?').join(',')})
    `;
        const params = [...userProjects];
        if (project_id) {
            query += ' AND t.project_id = ?';
            params.push(project_id);
        }
        query += ' GROUP BY t.id';
        const [rows] = await db_1.default.execute(query, params);
        res.json({ data: rows });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getTeams = getTeams;
// GET /api/teams/:id/skill-coverage
const getTeamSkillCoverage = async (req, res) => {
    const { id } = req.params;
    try {
        // Required skills for the team
        const [required] = await db_1.default.execute(`SELECT s.id, s.name, s.category, trs.min_level, trs.required_count
       FROM team_required_skills trs
       JOIN skills s ON trs.skill_id = s.id
       WHERE trs.team_id = ?`, [id]);
        // Actual skills in team
        const [actual] = await db_1.default.execute(`SELECT s.id, s.name, COUNT(DISTINCT e.id) AS count, MAX(es.level) AS max_level
       FROM employees e
       JOIN employee_skills es ON e.id = es.employee_id
       JOIN skills s ON es.skill_id = s.id
       WHERE e.current_team_id = ?
       GROUP BY s.id`, [id]);
        const actualMap = new Map(actual.map((a) => [a.id, a]));
        const coverage = required.map(req => {
            const has = actualMap.get(req.id);
            return {
                skill: req.name,
                category: req.category,
                required_count: req.required_count,
                actual_count: has ? has.count : 0,
                max_level: has ? has.max_level : null,
                status: !has ? 'critical_gap'
                    : has.count < req.required_count ? 'gap'
                        : 'covered',
            };
        });
        res.json({ data: coverage });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getTeamSkillCoverage = getTeamSkillCoverage;
// GET /api/teams/:id/members
const getTeamMembers = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db_1.default.execute(`SELECT
         e.id, e.employee_code, e.name, e.designation,
         e.utilization_pct, e.availability,
         GROUP_CONCAT(s.name SEPARATOR ', ') AS skills
       FROM employees e
       LEFT JOIN employee_skills es ON e.id = es.employee_id
       LEFT JOIN skills s ON es.skill_id = s.id
       WHERE e.current_team_id = ?
       GROUP BY e.id`, [id]);
        res.json({ data: rows });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getTeamMembers = getTeamMembers;
// GET /api/projects
const getProjects = async (req, res) => {
    const userProjects = req.userProjects || [];
    try {
        const [rows] = await db_1.default.execute(`SELECT p.*, COUNT(DISTINCT t.id) AS team_count, COUNT(DISTINCT e.id) AS employee_count
       FROM projects p
       LEFT JOIN teams t ON t.project_id = p.id
       LEFT JOIN employees e ON e.current_team_id = t.id
       WHERE p.id IN (${userProjects.map(() => '?').join(',')})
       GROUP BY p.id`, userProjects);
        res.json({ data: rows });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getProjects = getProjects;
