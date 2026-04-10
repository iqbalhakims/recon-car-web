const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = file.mimetype.startsWith('video/') ? 'video' : 'car';
    cb(null, `${prefix}_${req.params.id}_${Date.now()}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) cb(null, true);
  else cb(new Error('Only video files allowed'), false);
};

const imageUpload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const videoUpload = multer({ storage, fileFilter: videoFilter, limits: { fileSize: 200 * 1024 * 1024 } });

module.exports = { imageUpload, videoUpload };
