const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // Logs to console
    new winston.transports.File({ filename: 'logs/auth.log' }) // Logs to a file
  ],
});

module.exports = logger; 