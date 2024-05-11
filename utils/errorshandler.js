const createNotFoundError = (entity, message = "Not Found") => {
  const error = new Error(`${entity} ${message}`);
  error.statusCode = 404;
  return error;
};

const createValidationError = (entity, message = "Validation Error") => {
  const error = new Error(`${entity} ${message}`);
  error.statusCode = 400;
  return error;
};

module.exports = {
  createNotFoundError,
  createValidationError,
};
