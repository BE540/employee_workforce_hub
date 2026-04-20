import { Request, Response } from 'express';
import pool from '../config/db';

// GET /api/employees?team_id=&skill=&level=&availability=
export const getEmployees = async (req: Request, res: Response) => {
  const { team_id, skill, level, availability, search } = req.query;
  const userProjects = req.userProjects || [];

  let query = `
    SELECT
      e.id, e.employee_code, e.name, e.email, e.designation,
      e.utilization_pct, e.availability,
      t.id AS team_id, t.name AS team_name,
      p.id AS project_id, p.name AS project_name,
      GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ',') AS skills,
      GROUP_CONCAT(DISTINCT es.level ORDER BY s.name SEPARATOR ',') AS skill_levels
    FROM employees e
    LEFT JOIN teams t ON e.current_team_id = t.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN employee_skills es ON e.id = es.employee_id
    LEFT JOIN skills s ON es.skill_id = s.id
    WHERE p.id IN (${userProjects.map(() => '?').join(',')})
  `;
  const params: any[] = [...userProjects];

  if (team_id) { query += ' AND e.current_team_id = ?'; params.push(team_id); }
  if (availability) { query += ' AND e.availability = ?'; params.push(availability); }
  if (search) { query += ' AND (e.name LIKE ? OR e.designation LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ' GROUP BY e.id';

  if (skill) {
    query = `SELECT * FROM (${query}) sub WHERE FIND_IN_SET(?, sub.skills)`;
    params.push(skill);
  }
  if (level) {
    if (skill) {
      query += ' AND FIND_IN_SET(?, sub.skill_levels)';
    }
    params.push(level);
  }

  try {
    const [rows] = await pool.execute<any[]>(query, params);
    const employees = rows.map(r => ({
      ...r,
      skills: r.skills ? r.skills.split(',') : [],
      skill_levels: r.skill_levels ? r.skill_levels.split(',') : [],
    }));
    res.json({ data: employees, total: employees.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/employees/:id/skills
export const getEmployeeSkills = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT s.id, s.name, s.category, es.level, es.years_exp
       FROM employee_skills es
       JOIN skills s ON es.skill_id = s.id
       WHERE es.employee_id = ?`,
      [id]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/employees/:id
export const getEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT e.*, t.name AS team_name, p.name AS project_name
       FROM employees e
       LEFT JOIN teams t ON e.current_team_id = t.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE e.id = ?`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Employee not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/employees/skill-match?required_skills=Java,React&team_id=
export const skillMatch = async (req: Request, res: Response) => {
  const { required_skills, exclude_team_id } = req.query;
  if (!required_skills) return res.status(400).json({ error: 'required_skills param needed' });

  const skillNames = (required_skills as string).split(',').map(s => s.trim());
  const placeholders = skillNames.map(() => '?').join(',');

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT
         e.id, e.employee_code, e.name, e.designation,
         e.utilization_pct, e.availability,
         t.name AS team_name,
         COUNT(DISTINCT s.id) AS matched_skills,
         ${skillNames.length} AS required_skills,
         ROUND(COUNT(DISTINCT s.id) * 100 / ${skillNames.length}) AS match_pct
       FROM employees e
       LEFT JOIN teams t ON e.current_team_id = t.id
       JOIN employee_skills es ON e.id = es.employee_id
       JOIN skills s ON es.skill_id = s.id AND s.name IN (${placeholders})
       ${exclude_team_id ? 'WHERE e.current_team_id != ?' : ''}
       GROUP BY e.id
       ORDER BY match_pct DESC, e.utilization_pct ASC`,
      exclude_team_id ? [...skillNames, exclude_team_id as string] : skillNames
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
