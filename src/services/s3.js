const { s3Client } = require("../config/s3");
const fs = require("fs");

const uploadFileFromBuffer = async (
  buffer,
  fileName,
  contentType = "image/jpeg"
) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType, 
    };

    const data = await s3Client.upload(params).promise();
    return data.Location;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

const uploadFileFromPath = async (
  filePath,
  s3Key,
  contentType = "application/octet-stream"
) => {
  try {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    };

    const data = await s3Client.upload(params).promise();
    return data.Location;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
module.exports = { uploadFileFromBuffer, uploadFileFromPath };
