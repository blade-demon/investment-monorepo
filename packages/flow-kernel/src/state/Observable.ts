import { StateListener } from '../types/engine'

/**
 * 基础发布订阅类
 * 提供 subscribe 能力
 */
export class Observable<TState> {
  protected listeners = new Set<(state: TState) => void>()

  /**
   * 订阅状态变化
   * @param listener 回调函数
   * @returns 取消订阅的函数
   */
  public subscribe(listener: (state: TState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 通知所有监听者
   */
  protected notify(state: TState) {
    this.listeners.forEach((cb) => cb(state))
  }
}
