-- ============================================================
-- WorkspaceHub POC - Toyota Internal Mobility Platform
-- Schema Version: 1.0
-- Run this file first in MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS workforce_poc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE workforce_poc;

-- ============================================================
-- 1. ROLES (Manager, Director, VP)
-- ============================================================
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,         -- 'manager', 'director', 'vp'
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES
  ('vp',       'VP - full visibility, approve all transfers'),
  ('director', 'Director - can approve transfers in their division'),
  ('manager',  'Manager - can initiate transfers within project');

-- ============================================================
-- 2. USERS (Managers, Directors, VPs who log in)
-- ============================================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ============================================================
-- 3. PROJECTS
-- ============================================================
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status ENUM('active','completed','on_hold') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. TEAMS (belong to a project)
-- ============================================================
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  manager_id INT,                           -- user managing this team
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- ============================================================
-- 5. SKILLS LIBRARY
-- ============================================================
CREATE TABLE skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,        -- 'React', 'Java', 'AWS', etc.
  category VARCHAR(100),                    -- 'Frontend', 'Backend', 'DevOps'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. EMPLOYEES
-- ============================================================
CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_code VARCHAR(30) UNIQUE,         -- e.g. EMP-4829
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  designation VARCHAR(100),                 -- 'Senior Java Developer'
  current_team_id INT,
  utilization_pct INT DEFAULT 0,            -- 0-100
  availability ENUM('immediate','2w_wait','assigned') DEFAULT 'immediate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (current_team_id) REFERENCES teams(id)
);

-- ============================================================
-- 7. EMPLOYEE SKILLS (many-to-many)
-- ============================================================
CREATE TABLE employee_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  skill_id INT NOT NULL,
  level ENUM('beginner','intermediate','senior','expert') DEFAULT 'intermediate',
  years_exp DECIMAL(4,1) DEFAULT 0,
  UNIQUE KEY uq_emp_skill (employee_id, skill_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);

-- ============================================================
-- 8. TEAM REQUIRED SKILLS
-- ============================================================
CREATE TABLE team_required_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  skill_id INT NOT NULL,
  min_level ENUM('beginner','intermediate','senior','expert') DEFAULT 'intermediate',
  required_count INT DEFAULT 1,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);

-- ============================================================
-- 9. TRANSFERS (core workflow table)
-- ============================================================
CREATE TABLE transfers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  from_team_id INT NOT NULL,
  to_team_id INT NOT NULL,
  reason TEXT,
  effective_date DATE,
  status ENUM('draft','pending_director','pending_vp','approved','rejected','executed') DEFAULT 'draft',
  requested_by INT NOT NULL,               -- user who initiated
  skill_gap_flag TINYINT(1) DEFAULT 0,     -- 1 if transfer creates a skill gap
  skill_gap_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (from_team_id) REFERENCES teams(id),
  FOREIGN KEY (to_team_id) REFERENCES teams(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);

-- ============================================================
-- 10. TRANSFER APPROVALS (step-by-step audit)
-- ============================================================
CREATE TABLE transfer_approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transfer_id INT NOT NULL,
  approver_id INT NOT NULL,
  action ENUM('approved','rejected','pending') DEFAULT 'pending',
  note TEXT,
  actioned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transfer_id) REFERENCES transfers(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- ============================================================
-- 11. AUDIT LOGS (immutable)
-- ============================================================
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,            -- 'transfer.created', 'transfer.approved'
  entity_type VARCHAR(50),                 -- 'transfer', 'employee'
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_employees_team ON employees(current_team_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_employee ON transfers(employee_id);
CREATE INDEX idx_emp_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Skills
INSERT INTO skills (name, category) VALUES
('Java','Backend'), ('Spring Boot','Backend'), ('React','Frontend'),
('TypeScript','Frontend'), ('AWS','DevOps'), ('Kubernetes','DevOps'),
('Node.js','Backend'), ('PostgreSQL','Database'), ('Python','Backend'),
('Terraform','DevOps'), ('Go','Backend'), ('Docker','DevOps'),
('GraphQL','Backend'), ('Redis','Database'), ('Rust','Backend');

-- Users (password: Test@1234 → bcrypt hash stored, we use plain for seed demo)
-- In real app hash these with bcrypt
INSERT INTO users (name, email, password_hash, role_id) VALUES
('Marcus Vance',  'vp@toyota.poc',        '$2b$10$demoHashVP1234567890123456789012345', 1),
('Diana Prince',  'director@toyota.poc',  '$2b$10$demoHashDir123456789012345678901234', 2),
('Mike Ross',     'manager1@toyota.poc',  '$2b$10$demoHashMgr123456789012345678901234', 3),
('Rachel Zane',   'manager2@toyota.poc',  '$2b$10$demoHashMgr223456789012345678901234', 3);

-- Project
INSERT INTO projects (name, description, start_date, end_date, status) VALUES
('Toyota Connected Platform','Cloud-native telematics and OTA update platform','2024-01-01','2024-12-31','active');

-- Teams
INSERT INTO teams (project_id, name, description, manager_id) VALUES
(1, 'Team Alpha - Backend',   'Core API and microservices', 3),
(1, 'Team Beta - Frontend',   'React dashboard and mobile', 4),
(1, 'Team Gamma - DevOps',    'Infrastructure and CI/CD', 3),
(1, 'Team Delta - Data',      'Analytics and ML pipelines', 4);

-- Team Required Skills
INSERT INTO team_required_skills (team_id, skill_id, min_level, required_count) VALUES
(1, 1, 'senior', 3),(1, 2, 'intermediate', 2),(1, 7, 'intermediate', 2),
(2, 3, 'senior', 3),(2, 4, 'senior', 2),(2, 13, 'intermediate', 1),
(3, 5, 'senior', 2),(3, 6, 'intermediate', 2),(3, 10, 'intermediate', 1),
(4, 9, 'senior', 2),(4, 8, 'intermediate', 2),(4, 14, 'intermediate', 1);

-- Employees
INSERT INTO employees (employee_code, name, email, designation, current_team_id, utilization_pct, availability) VALUES
('EMP-4829','Alex Rivera',   'alex@toyota.poc',    'Staff Cloud Engineer',      3, 80, 'immediate'),
('EMP-9102','Sarah Jenkins',  'sarah@toyota.poc',   'Sr. Backend Architect',     1, 90, '2w_wait'),
('EMP-3310','Chen Wei',       'chen@toyota.poc',    'Security Engineer',         3, 95, 'assigned'),
('EMP-5521','Jordan Lee',     'jordan@toyota.poc',  'Data Scientist',            4, 60, 'immediate'),
('EMP-7731','Priya Sharma',   'priya@toyota.poc',   'Sr. React Developer',       2, 85, 'immediate'),
('EMP-8842','Tom Hanks',      'tom@toyota.poc',     'Java Developer',            1, 70, 'immediate'),
('EMP-2201','Nina Patel',     'nina@toyota.poc',    'DevOps Engineer',           3, 75, 'immediate'),
('EMP-6614','Lucas Martin',   'lucas@toyota.poc',   'Full Stack Developer',      2, 88, '2w_wait'),
('EMP-1190','Aisha Brown',    'aisha@toyota.poc',   'Python Engineer',           4, 65, 'immediate'),
('EMP-3345','Ryan Clark',     'ryan@toyota.poc',    'Backend Developer',         1, 72, 'immediate');

-- Employee Skills
INSERT INTO employee_skills (employee_id, skill_id, level, years_exp) VALUES
(1,5,'expert',8),(1,10,'senior',5),(1,11,'senior',4),(1,6,'senior',3),
(2,1,'expert',9),(2,2,'expert',7),(2,7,'senior',5),(2,8,'intermediate',3),
(3,5,'senior',6),(3,6,'intermediate',4),(3,15,'intermediate',2),
(4,9,'expert',7),(4,8,'senior',5),(4,14,'intermediate',3),
(5,3,'expert',6),(5,4,'expert',5),(5,13,'senior',4),
(6,1,'senior',5),(6,2,'intermediate',3),(6,7,'intermediate',2),
(7,5,'senior',4),(7,6,'senior',3),(7,12,'intermediate',2),
(8,3,'senior',5),(8,4,'senior',4),(8,7,'intermediate',3),
(9,9,'senior',4),(9,8,'intermediate',3),(9,14,'beginner',1),
(10,1,'intermediate',3),(10,2,'beginner',1),(10,7,'intermediate',2);

-- ============================================================
-- 12. USER-PROJECT RELATIONSHIPS
-- ============================================================
CREATE TABLE user_projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_project (user_id, project_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Seed user-project assignments
-- VPs and Directors get access to all projects automatically (handled in code)
-- Managers get assigned to specific projects
INSERT INTO user_projects (user_id, project_id) VALUES
(3, 1), -- Mike Ross (manager1) -> Toyota Connected Platform
(4, 1); -- Rachel Zane (manager2) -> Toyota Connected Platform
