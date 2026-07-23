function validationErrorFormatter(errors) {
  return errors.array().map((e) => ({ field: e.path, message: e.msg }));
}

// Central error handler - keeps route handlers clean via next(err)
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.publicMessage || 'Internal server error',
  });
}

function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

module.exports = { errorHandler, notFound, validationErrorFormatter };
