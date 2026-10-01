const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || err.statuscode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode: statusCode,
    message: message
  });
};
export default errorMiddleware;