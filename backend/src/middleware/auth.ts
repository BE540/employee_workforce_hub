import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  name: string;
  projects: number[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      userProjects?: number[];
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireProjectAccess = (req: Request, res: Response, next: NextFunction) => {
  const projectId = req.params.projectId || req.query.project_id || req.body.project_id;
  if (projectId && !req.user!.projects.includes(Number(projectId))) {
    return res.status(403).json({ error: 'Access denied to this project' });
  }
  next();
};

export const scopeQueryToUserProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
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

    req.userProjects = userProjects;
    req.user!.projects = userProjects;
    next();
  } catch (err) {
    console.error('Error fetching user projects:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
