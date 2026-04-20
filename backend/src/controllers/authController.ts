import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { sign, SignOptions } from "jsonwebtoken";
import pool from '../config/db';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT u.id, u.name, u.email, u.password_hash, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // For demo seed users, allow plain password "Test@1234" when the stored hash is a placeholder.
    let valid = false;
    const isDemoHash = user.password_hash.includes('demoHash');

    if (user.password_hash.startsWith('$2b$') && !isDemoHash) {
      valid = await bcrypt.compare(password, user.password_hash);
    } else {
      // fallback for seed/demo users with placeholder hash, or plain text demo mode
      valid = password === 'Test@1234';
    }

    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Get user's accessible projects
    let userProjects: number[] = [];
    if (user.role === 'vp' || user.role === 'director') {
      // VPs and Directors have access to all projects
      const [projects] = await pool.execute<any[]>('SELECT id FROM projects');
      userProjects = projects.map(p => p.id);
    } else {
      // Managers only have access to assigned projects
      const [userProj] = await pool.execute<any[]>(
        'SELECT project_id FROM user_projects WHERE user_id = ?',
        [user.id]
      );
      userProjects = userProj.map(up => up.project_id);
    }

    const token = sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, projects: userProjects },
      process.env.JWT_SECRET || 'secret' as any,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' } as SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        projects: userProjects
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
