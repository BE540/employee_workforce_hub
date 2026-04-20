import { Router } from 'express';
import { login } from '../controllers/authController';
import {
  getEmployees, getEmployee, getEmployeeSkills, skillMatch
} from '../controllers/employeeController';
import {
  getTeams, getTeamMembers, getTeamSkillCoverage, getProjects
} from '../controllers/teamController';
import {
  createTransfer, getTransfers, getTransfer, approveTransfer
} from '../controllers/transferController';
import {
  getDashboard, getSkillGaps, getResourcePlanner
} from '../controllers/analyticsController';
import { authenticate, requireRole, scopeQueryToUserProjects } from '../middleware/auth';

const router = Router();

// Auth
router.post('/auth/login', login);
router.get('/auth/verify', authenticate, (req, res) => res.json({ user: req.user }));

// Employees (protected)
router.get('/employees',        authenticate, scopeQueryToUserProjects, getEmployees);
router.get('/employees/match',  authenticate, scopeQueryToUserProjects, skillMatch);
router.get('/employees/:id',    authenticate, scopeQueryToUserProjects, getEmployee);
router.get('/employees/:id/skills', authenticate, scopeQueryToUserProjects, getEmployeeSkills);

// Teams & Projects
router.get('/projects',              authenticate, scopeQueryToUserProjects, getProjects);
router.get('/teams',                 authenticate, scopeQueryToUserProjects, getTeams);
router.get('/teams/:id/members',     authenticate, scopeQueryToUserProjects, getTeamMembers);
router.get('/teams/:id/skill-coverage', authenticate, scopeQueryToUserProjects, getTeamSkillCoverage);

// Transfers
router.post('/transfers',            authenticate, requireRole('manager','director','vp'), scopeQueryToUserProjects, createTransfer);
router.get('/transfers',             authenticate, scopeQueryToUserProjects, getTransfers);
router.get('/transfers/:id',         authenticate, scopeQueryToUserProjects, getTransfer);
router.patch('/transfers/:id/approve', authenticate, requireRole('director','vp'), scopeQueryToUserProjects, approveTransfer);

// Analytics (director + vp only)
router.get('/analytics/dashboard',  authenticate, requireRole('director','vp','manager'), scopeQueryToUserProjects, getDashboard);
router.get('/analytics/skill-gaps', authenticate, requireRole('director','vp','manager'), scopeQueryToUserProjects, getSkillGaps);
router.get('/analytics/resource-planner', authenticate, requireRole('director','vp','manager'), scopeQueryToUserProjects, getResourcePlanner);

export default router;
