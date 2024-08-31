const { getRabbitMQChannel } = require("../config/queue");
const { QUEUE_NAME } = require("../utils/constants");
const Product = require("../models/Product");
const Request = require("../models/Request");
const axios = require("axios");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { uploadFileFromBuffer, uploadFileFromPath } = require("./s3");
const { S3_FOLDER_NAME } = require("../utils/constants");
const csv = require("fast-csv");
const fs = require("fs");
const startConsumer = async () => {
  try {
    const channel = await getRabbitMQChannel();
    await channel.assertQueue(QUEUE_NAME.IMAGE_PROCESSING, { durable: true });
    channel.consume(QUEUE_NAME.IMAGE_PROCESSING, async (message) => {
      if (message !== null) {
        const requestId = message.content.toString();
        try {
          const products = await getProductByRequestId(requestId);
          for (const product of products) {
            const compressedImageUrls = await processAndCompressImages(
              product.inputImageUrls
            );
            product.outputImageUrls = compressedImageUrls;
            await product.save();
          }

          const csvUrl = await saveProductsToCSVAndUpload(requestId);
          await Request.update(
            { status: "PROCESSED", outputCsvUrl: csvUrl },
            { where: { requestId } }
          );

          channel.ack(message);
          console.log("Request processed successfully");
        } catch (error) {
          console.error("Error processing request:", error);
          channel.nack(message); // Requeue the message if there was an error
        }
      }
    });
  } catch (error) {
    console.error("Error starting RabbitMQ consumer:", error);
  }
};

const getProductByRequestId = async (requestId) => {
  const products = await Product.findAll({ where: { requestId } });
  return products;
};

const compressImage = async (url) => {
  const response = await axios({ url, responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(response.data, "binary");

  const compressedImageBuffer = await sharp(imageBuffer)
    .jpeg({ quality: 50 })
    .toBuffer();

  return compressedImageBuffer;
};

const processAndCompressImages = async (inputUrls) => {
  const outputImageUrls = [];

  for (const url of inputUrls) {
    try {
      const compressedImageBuffer = await compressImage(url);

      const s3Key = `${S3_FOLDER_NAME}/${uuidv4()}.jpg`;

      const compressedImageUrl = await uploadFileFromBuffer(
        compressedImageBuffer,
        s3Key
      );
      outputImageUrls.push(compressedImageUrl);
    } catch (error) {
      console.error(`Error processing image ${url}:`, error.message);
    }
  }

  return outputImageUrls;
};

const saveProductsToCSVAndUpload = async (requestId) => {
  try {
    const products = await Product.findAll({ where: { requestId } });

    const csvData = products.map((product) => ({
      id: product.serialNumber,
      ProductName: product.productName,
      inputImageUrls: product.inputImageUrls.join(", "),
      outputImageUrls: product.outputImageUrls.join(", "),
    }));

    const csvFilePath = `/tmp/${requestId}.csv`;

    await new Promise((resolve, reject) => {
      csv
        .writeToPath(csvFilePath, csvData, { headers: true })
        .on("error", reject)
        .on("finish", resolve);
    });

    const s3Key = `${S3_FOLDER_NAME}/${requestId}.csv`;

    const csvUrl = await uploadFileFromPath(csvFilePath, s3Key);

    console.log(`CSV file uploaded to S3: ${csvUrl}`);

    // Clean up the temporary file
    fs.unlinkSync(csvFilePath);

    return csvUrl;
  } catch (error) {
    console.error("Error saving products to CSV and uploading:", error);
    throw error;
  }
};

module.exports = { startConsumer, processAndCompressImages };
