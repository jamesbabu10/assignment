const amqp = require('amqplib');
const { QUEUE_NAME } = require('../utils/constants');
const { RABBITMQ_URL } = process.env;

let channel = null;

const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME.IMAGE_PROCESSING, {
      durable: true,
    });
    console.log('Connected to RabbitMQ and queue asserted');
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
};

const getRabbitMQChannel = async () => {
  if (!channel) {
    await connectToRabbitMQ();
  }
  return channel;
};

module.exports = { connectToRabbitMQ, getRabbitMQChannel };
