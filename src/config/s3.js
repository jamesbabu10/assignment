const AWS = require("aws-sdk");

const {
  AWS_S3_CREDENTIALS_ACCESS_KEY,
  AWS_S3_CREDENTIALS_SECRET_KEY,
  S3_REGION,
} = process.env;

// new sdk
const s3Client = new AWS.S3({
  credentials: {
    secretAccessKey: AWS_S3_CREDENTIALS_SECRET_KEY,
    accessKeyId: AWS_S3_CREDENTIALS_ACCESS_KEY,
  },
  region: S3_REGION,
});

module.exports = { s3Client };
