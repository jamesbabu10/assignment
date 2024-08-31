const { error } = require("console");
const { errors, handleError } = require("../error");

const { Success, HttpError } = require("../utils/httpResponse");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const csvParser = require("csv-parser");
const Request = require("../models/Request");
const Product = require("../models/Product");
const { sequelize } = require("../config/db");
const { sendToQueue } = require("../services/queue");
const { QUEUE_NAME, S3_FOLDER_NAME } = require("../utils/constants");
const { uploadFileFromBuffer, uploadFileFromPath } = require("../services/s3");

const uploadFile = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { file } = req;
    const fileData = [];
    if (!req.file) {
      const { name, code } = errors[400];
      throw new HttpError("No file uploaded", name, [], code);
    }
    const requestId = uuidv4();

    const processFile = new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csvParser())
        .on("data", (row) => {
          try {
            if (
              !row["S. No."] ||
              !row["Product Name"] ||
              !row["Input Image Urls"]
            ) {
              const { name, code } = errors[400];
              throw new HttpError("File Validation Error", name, [], code);
            }
            fileData.push({
              serialNumber: row["S. No."],
              productName: row["Product Name"],
              inputImageUrls: row["Input Image Urls"]
                .trim()
                .replace(/[\n\r]/g, ""),
              requestId: requestId,
            });
          } catch (err) {
            reject(err);
          }
        })
        .on("end", () => resolve())
        .on("error", (error) => reject(error));
    });

    await processFile;
    const request = await Request.create(
      { requestId: requestId, status: "processing" },
      { transaction }
    );

    const CHUNK_SIZE = 1000;
    for (let i = 0; i < fileData.length; i += CHUNK_SIZE) {
      const chunk = fileData.slice(i, i + CHUNK_SIZE);
      await Product.bulkCreate(chunk, { transaction });
    }
    const csvUrl = await uploadFileFromPath(
      file.path,
      `${S3_FOLDER_NAME}/${requestId}.csv`
    );
    request.inputCsvUrl = csvUrl;
    await request.save({ transaction });

    await sendToQueue(QUEUE_NAME.IMAGE_PROCESSING, Buffer.from(requestId));
    await transaction.commit();

    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error deleting the file:", err);
      }
    });
    res
      .status(200)
      .json(new Success("File uploaded successfully", { requestId }));
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const imageStatus = async (req, res, next) => {
  try {
   const { requestId } = req.params;
    const request = await Request.findOne({ where: { requestId } });
    if (!request) {
      const { name, code } = errors[404];
      throw new HttpError("Request not found", name, [], code);
    }
    if (request.status === "processing") {
      res
        .status(200)
        .json(new Success("Request status", { status: "processing" }));
    }
    if (request.status === "PROCESSED") {
      res
        .status(200)
        .json(
          new Success("Request status", {
            status: "completed",
            outputCsvUrl: request.outputCsvUrl,
          })
        );
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  imageStatus,
};
