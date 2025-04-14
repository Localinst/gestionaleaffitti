declare module 'node-cron' {
  /**
   * Schedule a task.
   * @param cronExpression The cron expression to use
   * @param task The task to execute
   * @param options Optional options
   */
  export function schedule(
    cronExpression: string,
    task: () => void,
    options?: {
      scheduled?: boolean;
      timezone?: string;
    }
  ): {
    start: () => void;
    stop: () => void;
  };

  /**
   * Validate a cron expression.
   * @param cronExpression The cron expression to validate
   */
  export function validate(cronExpression: string): boolean;
} 