const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin icazəsi yoxdur' });
  }
  next();
};

module.exports = adminMiddleware;