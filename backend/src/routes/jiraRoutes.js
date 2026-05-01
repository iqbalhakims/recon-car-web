const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/jiraController');
const requireAuth = require('../middleware/auth');

// Projects
router.get('/projects', requireAuth, ctrl.getProjects);
router.post('/projects', requireAuth, ctrl.createProject);
router.delete('/projects/:id', requireAuth, ctrl.deleteProject);

// Issues
router.get('/projects/:projectId/issues', requireAuth, ctrl.getIssues);
router.post('/projects/:projectId/issues', requireAuth, ctrl.createIssue);
router.put('/issues/:id', requireAuth, ctrl.updateIssue);
router.patch('/issues/:id/status', requireAuth, ctrl.updateIssueStatus);
router.delete('/issues/:id', requireAuth, ctrl.deleteIssue);

module.exports = router;
