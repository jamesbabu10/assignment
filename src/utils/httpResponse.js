module.exports = {
  Success: class Success {
    constructor(message, data, statusCode = 200) {
      this.status = true;
      this.statusCode = statusCode;
      this.message = message;
      this.data = data;
    }
  },
  HttpError: class Error {
    constructor(message, name, errors, statusCode = 500) {
      this.status = false;
      this.statusCode = statusCode;
      this.message = message;
      this.name = name;
      this.errors = errors;
    }
  },
};
