import { Request, Response } from 'express';
import pool from '../config/db';

// GET /api/teams?project_id=
export const getTeams = async (req: Request, res: Response) => {
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
    const params: any[] = [...userProjects];

    if (project_id) {
      query += ' AND t.project_id = ?';
      params.push(project_id);
    }

    query += ' GROUP BY t.id';

    const [rows] = await pool.execute<any[]>(query, params);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/teams/:id/skill-coverage
export const getTeamSkillCoverage = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Required skills for the team
    const [required] = await pool.execute<any[]>(
      `SELECT s.id, s.name, s.category, trs.min_level, trs.required_count
       FROM team_required_skills trs
       JOIN skills s ON trs.skill_id = s.id
       WHERE trs.team_id = ?`,
      [id]
    );

    // Actual skills in team
    const [actual] = await pool.execute<any[]>(
      `SELECT s.id, s.name, COUNT(DISTINCT e.id) AS count, MAX(es.level) AS max_level
       FROM employees e
       JOIN employee_skills es ON e.id = es.employee_id
       JOIN skills s ON es.skill_id = s.id
       WHERE e.current_team_id = ?
       GROUP BY s.id`,
      [id]
    );

    const actualMap = new Map(actual.map((a: any) => [a.id, a]));
    const coverage = (required as any[]).map(req => {
      const has = actualMap.get(req.id) as any;
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/teams/:id/members
export const getTeamMembers = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT
         e.id, e.employee_code, e.name, e.designation,
         e.utilization_pct, e.availability,
         GROUP_CONCAT(s.name SEPARATOR ', ') AS skills
       FROM employees e
       LEFT JOIN employee_skills es ON e.id = es.employee_id
       LEFT JOIN skills s ON es.skill_id = s.id
       WHERE e.current_team_id = ?
       GROUP BY e.id`,
      [id]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/projects
export const getProjects = async (req: Request, res: Response) => {
  const userProjects = req.userProjects || [];
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT p.*, COUNT(DISTINCT t.id) AS team_count, COUNT(DISTINCT e.id) AS employee_count
       FROM projects p
       LEFT JOIN teams t ON t.project_id = p.id
       LEFT JOIN employees e ON e.current_team_id = t.id
       WHERE p.id IN (${userProjects.map(() => '?').join(',')})
       GROUP BY p.id`,
      userProjects
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
