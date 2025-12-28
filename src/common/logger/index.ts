import fs from 'fs';
import path from 'path';
import envConfig from '@/common/config/env';
import { PROJECT_ROOT } from '@/common/helper/pathUtil';

// 创建日志目录
const logDir = path.resolve(PROJECT_ROOT, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 日志工具：输出终端日志并写入文件
 */
export class Logger {
  private static getTimestamp(): string {
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  }

  private static shouldLog(level: LogLevel): boolean {
    const levelOrder: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = envConfig.LOG_LEVEL as LogLevel;
    return levelOrder[level] >= levelOrder[currentLevel];
  }

  private static writeToFile(level: LogLevel, message: string): void {
    const logFileName = `test-${new Date().toISOString().split('T')[0]}.log`;
    const logFilePath = path.join(logDir, logFileName);
    const logContent = `[${this.getTimestamp()}] [${level.toUpperCase()}] ${message}\n`;
    
    fs.appendFile(logFilePath, logContent, (err) => {
      if (err) console.error('写入日志文件失败：', err);
    });
  }

  public static debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.log(`\x1b[36m[${this.getTimestamp()}] [DEBUG] ${message}\x1b[0m`);
      this.writeToFile('debug', message);
    }
  }

  public static info(message: string): void {
    if (this.shouldLog('info')) {
      console.log(`\x1b[32m[${this.getTimestamp()}] [INFO] ${message}\x1b[0m`);
      this.writeToFile('info', message);
    }
  }

  public static warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.log(`\x1b[33m[${this.getTimestamp()}] [WARN] ${message}\x1b[0m`);
      this.writeToFile('warn', message);
    }
  }

  public static error(message: string): void {
    if (this.shouldLog('error')) {
      console.log(`\x1b[31m[${this.getTimestamp()}] [ERROR] ${message}\x1b[0m`);
      this.writeToFile('error', message);
    }
  }
}