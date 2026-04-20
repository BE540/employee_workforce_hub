"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const employeeController_1 = require("../controllers/employeeController");
const teamController_1 = require("../controllers/teamController");
const transferController_1 = require("../controllers/transferController");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Auth
router.post('/auth/login', authController_1.login);
router.get('/auth/verify', auth_1.authenticate, (req, res) => res.json({ user: req.user }));
// Employees (protected)
router.get('/employees', auth_1.authenticate, auth_1.scopeQueryToUserProjects, employeeController_1.getEmployees);
router.get('/employees/match', auth_1.authenticate, auth_1.scopeQueryToUserProjects, employeeController_1.skillMatch);
router.get('/employees/:id', auth_1.authenticate, auth_1.scopeQueryToUserProjects, employeeController_1.getEmployee);
router.get('/employees/:id/skills', auth_1.authenticate, auth_1.scopeQueryToUserProjects, employeeController_1.getEmployeeSkills);
// Teams & Projects
router.get('/projects', auth_1.authenticate, auth_1.scopeQueryToUserProjects, teamController_1.getProjects);
router.get('/teams', auth_1.authenticate, auth_1.scopeQueryToUserProjects, teamController_1.getTeams);
router.get('/teams/:id/members', auth_1.authenticate, auth_1.scopeQueryToUserProjects, teamController_1.getTeamMembers);
router.get('/teams/:id/skill-coverage', auth_1.authenticate, auth_1.scopeQueryToUserProjects, teamController_1.getTeamSkillCoverage);
// Transfers
router.post('/transfers', auth_1.authenticate, (0, auth_1.requireRole)('manager', 'director', 'vp'), auth_1.scopeQueryToUserProjects, transferController_1.createTransfer);
router.get('/transfers', auth_1.authenticate, auth_1.scopeQueryToUserProjects, transferController_1.getTransfers);
router.get('/transfers/:id', auth_1.authenticate, auth_1.scopeQueryToUserProjects, transferController_1.getTransfer);
router.patch('/transfers/:id/approve', auth_1.authenticate, (0, auth_1.requireRole)('director', 'vp'), auth_1.scopeQueryToUserProjects, transferController_1.approveTransfer);
// Analytics (director + vp only)
router.get('/analytics/dashboard', auth_1.authenticate, (0, auth_1.requireRole)('director', 'vp', 'manager'), auth_1.scopeQueryToUserProjects, analyticsController_1.getDashboard);
router.get('/analytics/skill-gaps', auth_1.authenticate, (0, auth_1.requireRole)('director', 'vp', 'manager'), auth_1.scopeQueryToUserProjects, analyticsController_1.getSkillGaps);
router.get('/analytics/resource-planner', auth_1.authenticate, (0, auth_1.requireRole)('director', 'vp', 'manager'), auth_1.scopeQueryToUserProjects, analyticsController_1.getResourcePlanner);
exports.default = router;
