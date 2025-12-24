import { ModuleLoader } from '../types/engine'
import { logger } from '../utils/logger'

export class Registry {
  private loaders = new Map<string, ModuleLoader>()

  /**
   * 注册组件加载器
   * @param type 组件类型 Key (如 "AuthComponent")
   * @param loader 动态 import 函数
   */
  register(type: string, loader: ModuleLoader) {
    if (this.loaders.has(type)) {
      logger.warn(`Overwriting loader for type: ${type}`)
    }
    this.loaders.set(type, loader)
  }

  /**
   * 获取加载器
   */
  get(type: string): ModuleLoader | undefined {
    return this.loaders.get(type)
  }

  /**
   * 检查是否存在
   */
  has(type: string): boolean {
    return this.loaders.has(type)
  }
}
