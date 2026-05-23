const pool = require('../config/database');

const BlogModel = {
  async getAll({ publishedOnly = false } = {}) {
    const where = publishedOnly ? 'WHERE published = 1' : '';
    const [rows] = await pool.query(`
      SELECT id, title, slug, excerpt, meta_description, cover_image,
             published, author, created_at, updated_at
      FROM blog_posts
      ${where}
      ORDER BY created_at DESC
    `);
    return rows;
  },

  async getBySlug(slug) {
    const [rows] = await pool.query(
      'SELECT * FROM blog_posts WHERE slug = ?',
      [slug]
    );
    return rows[0];
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ title, slug, excerpt, content, meta_description, cover_image, published, author }) {
    const [result] = await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, meta_description, cover_image, published, author)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, excerpt || null, content, meta_description || null, cover_image || null, published ? 1 : 0, author || null]
    );
    return result.insertId;
  },

  async update(id, { title, slug, excerpt, content, meta_description, cover_image, published, author }) {
    const [result] = await pool.query(
      `UPDATE blog_posts SET title=?, slug=?, excerpt=?, content=?, meta_description=?, cover_image=?, published=?, author=?
       WHERE id=?`,
      [title, slug, excerpt || null, content, meta_description || null, cover_image || null, published ? 1 : 0, author || null, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM blog_posts WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = BlogModel;
