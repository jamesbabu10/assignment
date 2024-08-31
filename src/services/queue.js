const { getRabbitMQChannel } = require("../config/queue");

const sendToQueue = async (queue, message) => {
  const channel = await getRabbitMQChannel();
  await channel.sendToQueue(queue, message, { persistent: true });
};

module.exports = { sendToQueue };
