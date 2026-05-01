const JiraModel = require('../models/jiraModel');

module.exports = {
  // ── Projects ──────────────────────────────────────────────────────────────

  async getProjects(req, res) {
    try {
      const data = await JiraModel.getAllProjects();
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createProject(req, res) {
    try {
      const { name, key_code, description } = req.body;
      if (!name || !key_code) {
        return res.status(400).json({ success: false, message: 'name and key_code are required' });
      }
      const id = await JiraModel.createProject({ name, key_code, description, created_by: req.user.id });
      const project = await JiraModel.getProjectById(id);
      res.status(201).json({ success: true, data: project });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Project key already exists' });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteProject(req, res) {
    try {
      const affected = await JiraModel.deleteProject(req.params.id);
      if (!affected) return res.status(404).json({ success: false, message: 'Project not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ── Issues ────────────────────────────────────────────────────────────────

  async getIssues(req, res) {
    try {
      const data = await JiraModel.getIssuesByProject(req.params.projectId);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createIssue(req, res) {
    try {
      const { title, description, status, priority, assignee } = req.body;
      if (!title) return res.status(400).json({ success: false, message: 'title is required' });
      const id = await JiraModel.createIssue({
        project_id: req.params.projectId,
        title,
        description,
        status,
        priority,
        assignee,
        reporter_id: req.user.id,
      });
      const issue = await JiraModel.getIssueById(id);
      res.status(201).json({ success: true, data: issue });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateIssue(req, res) {
    try {
      const { title, description, priority, assignee } = req.body;
      if (!title) return res.status(400).json({ success: false, message: 'title is required' });
      const affected = await JiraModel.updateIssue(req.params.id, { title, description, priority, assignee });
      if (!affected) return res.status(404).json({ success: false, message: 'Issue not found' });
      const issue = await JiraModel.getIssueById(req.params.id);
      res.json({ success: true, data: issue });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateIssueStatus(req, res) {
    try {
      const { status } = req.body;
      const valid = ['todo', 'inprogress', 'review', 'done'];
      if (!valid.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      const affected = await JiraModel.updateIssueStatus(req.params.id, status);
      if (!affected) return res.status(404).json({ success: false, message: 'Issue not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteIssue(req, res) {
    try {
      const affected = await JiraModel.deleteIssue(req.params.id);
      if (!affected) return res.status(404).json({ success: false, message: 'Issue not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
