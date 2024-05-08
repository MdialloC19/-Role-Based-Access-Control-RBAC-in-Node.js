class HttpError extends Error {
  constructor(errObject, statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.error = errObject;
  }
}

module.exports = {
  HttpError,
};
