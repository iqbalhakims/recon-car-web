const BlogModel = require('../models/blogModel');

module.exports = {
  // Public: published posts only
  async listPublished(req, res) {
    try {
      const data = await BlogModel.getAll({ publishedOnly: true });
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getBySlug(req, res) {
    try {
      const post = await BlogModel.getBySlug(req.params.slug);
      if (!post || !post.published) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: post });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Admin: all posts
  async listAll(req, res) {
    try {
      const data = await BlogModel.getAll({ publishedOnly: false });
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { title, slug, excerpt, content, meta_description, cover_image, published, author } = req.body;
      if (!title || !slug || !content) {
        return res.status(400).json({ success: false, message: 'title, slug and content are required' });
      }
      const id = await BlogModel.create({ title, slug, excerpt, content, meta_description, cover_image, published, author });
      const post = await BlogModel.getById(id);
      res.status(201).json({ success: true, data: post });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Slug already exists' });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const { title, slug, excerpt, content, meta_description, cover_image, published, author } = req.body;
      if (!title || !slug || !content) {
        return res.status(400).json({ success: false, message: 'title, slug and content are required' });
      }
      const affected = await BlogModel.update(req.params.id, { title, slug, excerpt, content, meta_description, cover_image, published, author });
      if (!affected) return res.status(404).json({ success: false, message: 'Post not found' });
      const post = await BlogModel.getById(req.params.id);
      res.json({ success: true, data: post });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Slug already exists' });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const affected = await BlogModel.delete(req.params.id);
      if (!affected) return res.status(404).json({ success: false, message: 'Post not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
