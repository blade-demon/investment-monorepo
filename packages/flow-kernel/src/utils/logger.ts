const PREFIX = '[FlowKernel]'

// flow-kernel 既可能在 Node 环境运行，也可能在浏览器/小程序等环境运行。
// 这里用最小声明避免要求业务方引入 @types/node。
declare const process:
  | {
      env?: {
        NODE_ENV?: string
      }
    }
  | undefined

export const logger = {
  log: (msg: string, ...args: any[]) => {
    if (typeof process === 'undefined' || process?.env?.NODE_ENV !== 'production') {
      console.log(`${PREFIX} ${msg}`, ...args)
    }
  },
  warn: (msg: string, ...args: any[]) => {
    console.warn(`${PREFIX} [WARN] ${msg}`, ...args)
  },
  error: (msg: string, ...args: any[]) => {
    console.error(`${PREFIX} [ERROR] ${msg}`, ...args)
  },
}
