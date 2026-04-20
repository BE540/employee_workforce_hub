import { Request, Response } from 'express';
import pool from '../config/db';

// GET /api/analytics/dashboard
export const getDashboard = async (req: Request, res: Response) => {
  const userProjects = req.userProjects || [];

  try {
    const [[headcount]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM employees e
       JOIN teams t ON e.current_team_id = t.id
       WHERE t.project_id IN (${userProjects.map(() => '?').join(',')})`,
      userProjects
    ) as any;

    const [[utilization]] = await pool.execute<any[]>(
      `SELECT ROUND(AVG(e.utilization_pct)) AS avg FROM employees e
       JOIN teams t ON e.current_team_id = t.id
       WHERE t.project_id IN (${userProjects.map(() => '?').join(',')})`,
      userProjects
    ) as any;

    const [[pending_transfers]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM transfers tr
       JOIN teams ft ON tr.from_team_id = ft.id
       JOIN teams tt ON tr.to_team_id = tt.id
       WHERE tr.status IN ('pending_director','pending_vp')
       AND (ft.project_id IN (${userProjects.map(() => '?').join(',')})
            OR tt.project_id IN (${userProjects.map(() => '?').join(',')}))`,
      [...userProjects, ...userProjects]
    ) as any;

    const [[bench]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM employees e
       JOIN teams t ON e.current_team_id = t.id
       WHERE e.availability = 'immediate' AND e.utilization_pct < 50
       AND t.project_id IN (${userProjects.map(() => '?').join(',')})`,
      userProjects
    ) as any;

    // Team utilization breakdown - only for user's projects
    const [teams] = await pool.execute<any[]>(
      `SELECT t.name, ROUND(AVG(e.utilization_pct)) AS avg_util, COUNT(e.id) AS member_count
       FROM teams t LEFT JOIN employees e ON e.current_team_id = t.id
       WHERE t.project_id IN (${userProjects.map(() => '?').join(',')})
       GROUP BY t.id`,
      userProjects
    );

    // Skill concentration - only for user's projects
    const [concentration] = await pool.execute<any[]>(
      `SELECT s.name AS skill, COUNT(DISTINCT es.employee_id) AS holder_count
       FROM skills s
       JOIN employee_skills es ON s.id = es.skill_id
       JOIN employees e ON es.employee_id = e.id
       JOIN teams t ON e.current_team_id = t.id
       WHERE t.project_id IN (${userProjects.map(() => '?').join(',')})
       GROUP BY s.id
       HAVING holder_count <= 2
       ORDER BY holder_count ASC
       LIMIT 5`,
      userProjects
    );

    res.json({
      data: {
        headcount: headcount.total,
        avg_utilization: utilization.avg,
        pending_transfers: pending_transfers.total,
        bench_count: bench.total,
        teams,
        critical_skills_concentration: concentration,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/analytics/resource-planner
export const getResourcePlanner = async (req: Request, res: Response) => {
  const userProjects = req.userProjects || [];

  try {
    // Get projects with team and employee counts
    const [projects] = await pool.execute<any[]>(
      `SELECT
         p.id, p.name, p.description, p.status, p.start_date, p.end_date,
         COUNT(DISTINCT t.id) AS team_count,
         COUNT(DISTINCT e.id) AS employee_count,
         ROUND(AVG(e.utilization_pct)) AS avg_utilization,
         SUM(CASE WHEN e.availability = 'immediate' AND e.utilization_pct < 50 THEN 1 ELSE 0 END) AS bench_count
       FROM projects p
       LEFT JOIN teams t ON t.project_id = p.id
       LEFT JOIN employees e ON e.current_team_id = t.id
       WHERE p.id IN (${userProjects.map(() => '?').join(',')})
       GROUP BY p.id`,
      userProjects
    );

    // Get team utilization breakdown
    const [teams] = await pool.execute<any[]>(
      `SELECT
         t.id, t.name, t.project_id, p.name AS project_name,
         COUNT(e.id) AS member_count,
         ROUND(AVG(e.utilization_pct)) AS avg_utilization,
         ROUND(AVG(CASE WHEN e.availability = 'immediate' THEN 100 ELSE 0 END)) AS availability_pct
       FROM teams t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN employees e ON e.current_team_id = t.id
       WHERE t.project_id IN (${userProjects.map(() => '?').join(',')})
       GROUP BY t.id`,
      userProjects
    );

    // Get employee utilization data
    const [employees] = await pool.execute<any[]>(
      `SELECT
         e.id, e.employee_code, e.name, e.designation, e.utilization_pct, e.availability,
         t.name AS team_name, p.name AS project_name,
         GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS skills
       FROM employees e
       JOIN teams t ON e.current_team_id = t.id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN employee_skills es ON e.id = es.employee_id
       LEFT JOIN skills s ON es.skill_id = s.id
       WHERE t.project_id IN (${userProjects.map(() => '?').join(',')})
       GROUP BY e.id
       ORDER BY e.utilization_pct DESC`,
      userProjects
    );

    // Calculate resource allocation status for each project
    const projectsWithStatus = projects.map(project => {
      let status = 'healthy';
      let statusColor = 'bg-green-100 text-green-700';

      if (project.avg_utilization > 90) {
        status = 'overload';
        statusColor = 'bg-amber-100 text-amber-700';
      } else if (project.avg_utilization < 60) {
        status = 'understaffed';
        statusColor = 'bg-red-100 text-red-700';
      }

      return {
        ...project,
        status,
        statusColor,
        allocation_status: status
      };
    });

    res.json({
      data: {
        projects: projectsWithStatus,
        teams,
        employees,
        summary: {
          total_projects: projects.length,
          total_teams: teams.length,
          total_employees: employees.length,
          avg_utilization: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.avg_utilization || 0), 0) / projects.length) : 0,
          bench_resources: employees.filter(e => e.availability === 'immediate' && e.utilization_pct < 50).length
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/analytics/skill-gaps
export const getSkillGaps = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT
         t.name AS team, s.name AS skill,
         trs.required_count,
         trs.min_level AS required_level,
         COUNT(DISTINCT CASE WHEN es.level IN ('senior','expert') OR trs.min_level IN ('beginner','intermediate') THEN e.id END) AS actual_count,
         trs.required_count - COUNT(DISTINCT e.id) AS gap
       FROM team_required_skills trs
       JOIN teams t ON trs.team_id = t.id
       JOIN skills s ON trs.skill_id = s.id
       LEFT JOIN employees e ON e.current_team_id = t.id
       LEFT JOIN employee_skills es ON e.id = es.employee_id AND es.skill_id = trs.skill_id
       GROUP BY trs.id
       HAVING gap > 0
       ORDER BY gap DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
