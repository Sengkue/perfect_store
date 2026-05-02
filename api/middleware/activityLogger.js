import logger from '../utils/logger.js';

const activityLogger = (req, res, next) => {
  // Only log state-changing methods
  const methodsToLog = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (methodsToLog.includes(req.method)) {
    // We capture the original end function to log after the response is sent
    const oldEnd = res.end;

    res.end = function (chunk, encoding) {
      res.end = oldEnd;
      res.end(chunk, encoding);

      // Log after response is finished
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user ? req.user.id : 'anonymous';
        const username = req.user ? req.user.username : 'anonymous';
        
        // Scrub sensitive fields from body
        const body = { ...req.body };
        const sensitiveFields = ['password', 'token', 'oldPassword', 'newPassword'];
        sensitiveFields.forEach(field => {
          if (body[field]) body[field] = '********';
        });

        logger.info('ACTION: %s %s by %s (%s)', req.method, req.originalUrl, username, userId, {
          method: req.method,
          url: req.originalUrl,
          userId,
          username,
          statusCode: res.statusCode,
          body: Object.keys(body).length > 0 ? body : undefined,
          ip: req.ip
        });
      }
    };
  }

  next();
};

export default activityLogger;
