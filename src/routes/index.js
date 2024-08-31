const express = require('express');
const router = express.Router();

router.use('/', require('./imageProcessing'));

module.exports = router;