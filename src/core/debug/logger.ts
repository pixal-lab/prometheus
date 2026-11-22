type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const MODULE_COLORS: Record<string, string> = {
  Storage: '#4CAF50',
  Calendar: '#2196F3',
  Timetable: '#9C27B0',
  LessonPlanner: '#FF9800',
  Gradebook: '#00BCD4',
  ProofCorrection: '#E91E63',
  App: '#607D8B',
};

class Logger {
  private isEnabled = true;

  private format(module: string, level: LogLevel) {
    const color = MODULE_COLORS[module] || '#757575';
    return [
      `%c[Prometheus]%c[${module}]%c[${level}]`,
      'color: #ff9800; font-weight: bold;',
      `color: ${color}; font-weight: bold;`,
      'color: inherit; font-style: italic;',
    ];
  }

  debug(module: string, message: string, ...args: any[]) {
    if (!this.isEnabled) return;
    console.debug(...this.format(module, 'DEBUG'), message, ...args);
  }

  info(module: string, message: string, ...args: any[]) {
    if (!this.isEnabled) return;
    console.info(...this.format(module, 'INFO'), message, ...args);
  }

  warn(module: string, message: string, ...args: any[]) {
    console.warn(...this.format(module, 'WARN'), message, ...args);
  }

  error(module: string, message: string, ...args: any[]) {
    console.error(...this.format(module, 'ERROR'), message, ...args);
  }
}

export const logger = new Logger();

