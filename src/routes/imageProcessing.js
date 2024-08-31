const express = require('express');
const router = express.Router();
const { uploadFile, imageStatus } = require('../controllers/imageProcessing');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), uploadFile);
router.get('/image-status/:requestId', imageStatus);

module.exports = router;
