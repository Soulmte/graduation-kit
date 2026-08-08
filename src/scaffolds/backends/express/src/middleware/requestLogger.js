/** 请求日志中间件（开发期彩色输出） */
import chalk from 'chalk';

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalJson = res.json;

  res.json = function(data) {
    const duration = Date.now() - startTime;
    const statusCode = data.code || res.statusCode;

    let statusColor;
    if (statusCode === 200) statusColor = chalk.green;
    else if (statusCode >= 400 && statusCode < 500) statusColor = chalk.yellow;
    else if (statusCode >= 500) statusColor = chalk.red;
    else statusColor = chalk.blue;

    // dev only — 开发期彩色请求日志
    console.log(
      chalk.gray(`[${new Date().toLocaleTimeString()}]`),
      chalk.cyan(req.method.padEnd(6)),
      chalk.white(req.path.padEnd(30)),
      statusColor(`CODE: ${statusCode}`),
      chalk.magenta(`${duration}ms`)
    );

    return originalJson.call(this, data);
  };

  next();
};
