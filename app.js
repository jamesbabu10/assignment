require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const { errorHandler } = require('./src/error/handler');
const { connectDb } = require('./src/config/db');
const { connectToRabbitMQ } = require('./src/config/queue');
const { startConsumer } = require('./src/services/imageProcessing');
connectDb();
connectToRabbitMQ();
startConsumer();

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: 'api working' });
});

app.use('/api', require('./src/routes'));
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});