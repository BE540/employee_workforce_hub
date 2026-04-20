import { Request, Response } from 'express';
import pool from '../config/db';

// POST /api/transfers
export const createTransfer = async (req: Request, res: Response) => {
  const { employee_id, from_team_id, to_team_id, reason, effective_date } = req.body;
  const requested_by = req.user!.id;
  const userProjects = req.userProjects || [];

  if (!employee_id || !from_team_id || !to_team_id) {
    return res.status(400).json({ error: 'employee_id, from_team_id, to_team_id required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if employee is in from_team AND both teams are in user's accessible projects
    const [emp] = await conn.execute<any[]>(
      `SELECT e.*, t.project_id
       FROM employees e
       JOIN teams t ON e.current_team_id = t.id
       WHERE e.id = ? AND e.current_team_id = ? AND t.project_id IN (${userProjects.map(() => '?').join(',')})`,
      [employee_id, from_team_id, ...userProjects]
    );
    if (!emp[0]) {
      await conn.rollback();
      return res.status(400).json({ error: 'Employee not in specified source team or access denied to this project' });
    }

    // Check if destination team is also in user's accessible projects
    const [destTeam] = await conn.execute<any[]>(
      'SELECT project_id FROM teams WHERE id = ? AND project_id IN (' + userProjects.map(() => '?').join(',') + ')',
      [to_team_id, ...userProjects]
    );
    if (!destTeam[0]) {
      await conn.rollback();
      return res.status(400).json({ error: 'Access denied to destination team/project' });
    }

    // Skill gap check: does this employee hold a unique skill in from_team?
    const [uniqueSkills] = await conn.execute<any[]>(
      `SELECT s.name
       FROM employee_skills es
       JOIN skills s ON es.skill_id = s.id
       WHERE es.employee_id = ?
       AND (
         SELECT COUNT(DISTINCT e2.id)
         FROM employees e2
         JOIN employee_skills es2 ON e2.id = es2.employee_id
         WHERE e2.current_team_id = ? AND es2.skill_id = es.skill_id AND e2.id != ?
       ) = 0`,
      [employee_id, from_team_id, employee_id]
    );
    const hasSkillGap = uniqueSkills.length > 0;
    const gapNote = hasSkillGap
      ? `Transfer leaves critical gap: ${(uniqueSkills as any[]).map(s => s.name).join(', ')}`
      : null;

    // Determine initial status based on requester role
    const role = req.user!.role;
    let status = 'pending_director';
    if (role === 'director') status = 'pending_vp';
    if (role === 'vp') status = 'approved';

    const [result] = await conn.execute<any>(
      `INSERT INTO transfers
         (employee_id, from_team_id, to_team_id, reason, effective_date, status, requested_by, skill_gap_flag, skill_gap_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, from_team_id, to_team_id, reason, effective_date, status, requested_by, hasSkillGap ? 1 : 0, gapNote]
    );
    const transferId = result.insertId;

    // Create first approval record
    await conn.execute(
      `INSERT INTO transfer_approvals (transfer_id, approver_id, action)
       VALUES (?, ?, 'pending')`,
      [transferId, requested_by]
    );

    // Audit log
    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'transfer.created', 'transfer', ?, ?)`,
      [requested_by, transferId, JSON.stringify({ employee_id, from_team_id, to_team_id, status })]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Transfer initiated',
      transfer_id: transferId,
      status,
      skill_gap_flag: hasSkillGap,
      skill_gap_note: gapNote,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
};

// GET /api/transfers
export const getTransfers = async (req: Request, res: Response) => {
  const { status, employee_id } = req.query;
  const userProjects = req.userProjects || [];

  let query = `
    SELECT
      tr.id, tr.status, tr.reason, tr.effective_date,
      tr.skill_gap_flag, tr.skill_gap_note, tr.created_at,
      e.name AS employee_name, e.employee_code, e.designation,
      ft.name AS from_team, tt.name AS to_team,
      u.name AS requested_by_name, u.email AS requested_by_email
    FROM transfers tr
    JOIN employees e ON tr.employee_id = e.id
    JOIN teams ft ON tr.from_team_id = ft.id
    JOIN teams tt ON tr.to_team_id = tt.id
    JOIN users u ON tr.requested_by = u.id
    WHERE ft.project_id IN (${userProjects.map(() => '?').join(',')})
       OR tt.project_id IN (${userProjects.map(() => '?').join(',')})
  `;
  const params: any[] = [...userProjects, ...userProjects];

  if (status) { query += ' AND tr.status = ?'; params.push(status); }
  if (employee_id) { query += ' AND tr.employee_id = ?'; params.push(employee_id); }
  query += ' ORDER BY tr.created_at DESC';

  try {
    const [rows] = await pool.execute<any[]>(query, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/transfers/:id
export const getTransfer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT
         tr.*, e.name AS employee_name, e.employee_code, e.designation, e.utilization_pct,
         ft.name AS from_team, tt.name AS to_team,
         u.name AS requested_by_name
       FROM transfers tr
       JOIN employees e ON tr.employee_id = e.id
       JOIN teams ft ON tr.from_team_id = ft.id
       JOIN teams tt ON tr.to_team_id = tt.id
       JOIN users u ON tr.requested_by = u.id
       WHERE tr.id = ?`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Transfer not found' });

    const [approvals] = await pool.execute<any[]>(
      `SELECT ta.*, u.name AS approver_name, r.name AS approver_role
       FROM transfer_approvals ta
       JOIN users u ON ta.approver_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE ta.transfer_id = ?
       ORDER BY ta.created_at`,
      [id]
    );

    res.json({ data: rows[0], approvals });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/transfers/:id/approve
export const approveTransfer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, note } = req.body; // action: 'approved' | 'rejected'
  const approver_id = req.user!.id;
  const approver_role = req.user!.role;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute<any[]>('SELECT * FROM transfers WHERE id = ?', [id]);
    const transfer = rows[0];
    if (!transfer) { await conn.rollback(); return res.status(404).json({ error: 'Transfer not found' }); }

    // Determine next status
    let newStatus = transfer.status;
    if (action === 'rejected') {
      newStatus = 'rejected';
    } else if (action === 'approved') {
      if (approver_role === 'director' && transfer.status === 'pending_director') {
        newStatus = 'pending_vp';
      } else if (approver_role === 'vp' && (transfer.status === 'pending_vp' || transfer.status === 'pending_director')) {
        newStatus = 'approved';
      } else if (approver_role === 'manager' && transfer.status === 'pending_director') {
        newStatus = 'pending_director';
      }
    }

    // If approved, execute the transfer (update employee team)
    if (newStatus === 'approved') {
      await conn.execute(
        'UPDATE employees SET current_team_id = ? WHERE id = ?',
        [transfer.to_team_id, transfer.employee_id]
      );
      // Mark as executed
      newStatus = 'executed';
    }

    await conn.execute('UPDATE transfers SET status = ? WHERE id = ?', [newStatus, id]);

    await conn.execute(
      `INSERT INTO transfer_approvals (transfer_id, approver_id, action, note, actioned_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, approver_id, action, note || null]
    );

    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'transfer', ?, ?)`,
      [approver_id, `transfer.${action}`, id, JSON.stringify({ note, new_status: newStatus })]
    );

    await conn.commit();
    res.json({ message: `Transfer ${action}`, new_status: newStatus });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
};
