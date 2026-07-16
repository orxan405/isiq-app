const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server xətası';

  // Mongoose - yanlış ID formatı
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Məlumat tapılmadı';
  }

  // Mongoose - unikal sahə xətası
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Bu ${field} artıq istifadə edilir`;
  }

  // Mongoose - validasiya xətası
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // JWT xətaları
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token etibarsızdır';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token müddəti bitib';
  }

  // Multer xətası
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'Şəkil 5MB-dan böyük ola bilməz';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Tapılmadı: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };