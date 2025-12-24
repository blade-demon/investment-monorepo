import { StepConfig } from '../types/config'
import { EngineState } from '../types/engine'
import { Observable } from '../state/Observable'
import { Registry } from './Registry'
import { isStepCompleted } from '../strategies/Matcher'
import { logger } from '../utils/logger'

/**
 * 核心流程引擎
 * @template TData 业务数据类型
 */
export class FlowEngine<TData = any> extends Observable<EngineState> {
  private config: StepConfig<TData>[]
  private registry: Registry
  private state: EngineState

  constructor(config: StepConfig<TData>[]) {
    super()
    this.config = config
    this.registry = new Registry()

    // 初始状态
    this.state = {
      currentStepId: null,
      activeModule: null,
      isLoading: false,
      error: null,
      isCompleted: false,
    }
  }

  /**
   * 注册组件加载器
   */
  public registerLoader(type: string, loader: () => Promise<any>) {
    this.registry.register(type, loader)
  }

  /**
   * 核心驱动方法：接收外部数据，计算并驱动状态流转
   * 通常在 useEffect 或 数据 fetch 回来后调用
   */
  public sync(data: TData) {
    // 1. 遍历配置，找到第一个"未完成"的步骤
    const nextStep = this.config.find((step) => !isStepCompleted(step, data))

    // Case A: 所有步骤都通过了 -> 流程结束
    if (!nextStep) {
      if (!this.state.isCompleted) {
        logger.log('All steps completed.')
        this.updateState({
          isCompleted: true,
          currentStepId: null,
          activeModule: null,
          error: null,
        })
      }
      return
    }

    // Case B: 找到了新步骤，且与当前不同 -> 触发加载
    if (nextStep.id !== this.state.currentStepId) {
      logger.log(`Step changed: ${this.state.currentStepId} -> ${nextStep.id}`)

      this.updateState({
        isCompleted: false,
        currentStepId: nextStep.id,
        // 清空旧组件，防止 UI 闪烁旧内容
        activeModule: null,
      })

      // 异步加载代码
      this.loadStepModule(nextStep.type)
    }
  }

  /**
   * 获取当前状态
   */
  public getState(): EngineState {
    return this.state
  }

  /**
   * 获取当前步骤的完整配置（用于 UI 渲染 Title 等）
   */
  public getCurrentStepConfig(): StepConfig<TData> | undefined {
    return this.config.find((s) => s.id === this.state.currentStepId)
  }

  /**
   * 内部：加载模块
   */
  private async loadStepModule(type: string) {
    const loader = this.registry.get(type)

    if (!loader) {
      const msg = `No loader registered for type: "${type}". Did you forget to call registerLoader()?`
      logger.error(msg)
      this.updateState({ error: new Error(msg), isLoading: false })
      return
    }

    this.updateState({ isLoading: true, error: null })

    try {
      const module = await loader()

      // 兼容 ES Module 的 default export 和 CommonJS
      const component = module.default || module

      this.updateState({
        activeModule: component,
        isLoading: false,
      })
      logger.log(`Module loaded for type: ${type}`)
    } catch (err) {
      logger.error(`Failed to load module for type: ${type}`, err)
      this.updateState({
        isLoading: false,
        error: err instanceof Error ? err : new Error('Unknown load error'),
      })
    }
  }

  /**
   * 内部：更新状态并通知订阅者
   */
  private updateState(patch: Partial<EngineState>) {
    this.state = { ...this.state, ...patch }
    this.notify(this.state)
  }
}
