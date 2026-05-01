const pool = require('../config/database');

const JiraModel = {
  // ── Projects ──────────────────────────────────────────────────────────────

  async getAllProjects() {
    const [rows] = await pool.query(`
      SELECT p.*,
             COUNT(i.id) AS issue_count
      FROM jira_projects p
      LEFT JOIN jira_issues i ON i.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    return rows;
  },

  async getProjectById(id) {
    const [rows] = await pool.query('SELECT * FROM jira_projects WHERE id = ?', [id]);
    return rows[0];
  },

  async createProject({ name, key_code, description, created_by }) {
    const [result] = await pool.query(
      'INSERT INTO jira_projects (name, key_code, description, created_by) VALUES (?, ?, ?, ?)',
      [name, key_code.toUpperCase(), description || null, created_by || null]
    );
    return result.insertId;
  },

  async deleteProject(id) {
    const [result] = await pool.query('DELETE FROM jira_projects WHERE id = ?', [id]);
    return result.affectedRows;
  },

  // ── Issues ────────────────────────────────────────────────────────────────

  async getIssuesByProject(project_id) {
    const [rows] = await pool.query(
      `SELECT * FROM jira_issues WHERE project_id = ? ORDER BY created_at DESC`,
      [project_id]
    );
    return rows;
  },

  async getIssueById(id) {
    const [rows] = await pool.query('SELECT * FROM jira_issues WHERE id = ?', [id]);
    return rows[0];
  },

  async createIssue({ project_id, title, description, status, priority, assignee, reporter_id }) {
    const [result] = await pool.query(
      `INSERT INTO jira_issues (project_id, title, description, status, priority, assignee, reporter_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        project_id,
        title,
        description || null,
        status || 'todo',
        priority || 'medium',
        assignee || null,
        reporter_id || null,
      ]
    );
    return result.insertId;
  },

  async updateIssue(id, { title, description, priority, assignee }) {
    const [result] = await pool.query(
      `UPDATE jira_issues SET title = ?, description = ?, priority = ?, assignee = ? WHERE id = ?`,
      [title, description || null, priority, assignee || null, id]
    );
    return result.affectedRows;
  },

  async updateIssueStatus(id, status) {
    const [result] = await pool.query(
      'UPDATE jira_issues SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows;
  },

  async deleteIssue(id) {
    const [result] = await pool.query('DELETE FROM jira_issues WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = JiraModel;
