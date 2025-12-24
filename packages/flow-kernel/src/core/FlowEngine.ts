import { StepConfig } from '../types/config'
import { EngineState } from '../types/engine'
import { Observable } from '../state/Observable' // 继承 Observable
import { Registry } from './Registry'
import { isStepCompleted } from '../strategies/Matcher'
import { logger } from '../utils/logger'

// 定义一个副作用处理器类型
type StepChangeInterceptor<TData> = (
  step: StepConfig<TData>,
  context: { previousStepId: string | null; data: TData },
) => void

/**
 * 核心流程引擎
 * @template TData 业务数据类型
 */
export class FlowEngine<TData = any> extends Observable<EngineState> {
  private config: StepConfig<TData>[]
  private registry: Registry
  private state: EngineState

  // [新增] 副作用拦截器列表
  private interceptors: Set<StepChangeInterceptor<TData>> = new Set()

  constructor(config: StepConfig<TData>[]) {
    super() // 调用 Observable 的构造函数
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

    // 可以在这里注册一些默认的拦截器，例如日志或默认的埋点
    this.addInterceptor((step) => {
      logger.log(`[Lifecycle] Sync triggered. Current step: "${step.id}"`)
      if (step.meta?.trackEvent) {
        // 示例：这里可以触发真正的埋点SDK
        logger.log(`[Analytics] Track Event: ${step.meta.trackEvent} for step "${step.id}"`)
      }
    })
  }

  /**
   * 注册组件加载器
   */
  public registerLoader(type: string, loader: () => Promise<any>) {
    this.registry.register(type, loader)
  }

  /**
   * [新增] 注册副作用拦截器
   * 这些拦截器会在步骤变更时被触发
   */
  public addInterceptor(fn: StepChangeInterceptor<TData>) {
    this.interceptors.add(fn)
  }

  /**
   * 核心驱动方法：接收外部数据，计算并驱动状态流转
   * 通常在 useEffect 或 数据 fetch 回来后调用
   * @param data 最新的业务数据
   */
  public sync(data: TData) {
    // 记录旧的步骤ID，用于判断是否发生变更
    const previousStepId = this.state.currentStepId

    // 1. 遍历配置，找到第一个"未完成"的步骤
    // isStepCompleted 内部已经包含了 required 和 skipKey 的逻辑
    const nextStep = this.config.find((step) => !isStepCompleted(step, data))

    // Case A: 所有步骤都通过了 -> 流程结束
    if (!nextStep) {
      if (!this.state.isCompleted) {
        // 避免重复通知
        logger.log('All steps completed.')
        this.updateState({
          isCompleted: true,
          currentStepId: null, // 全部完成，没有当前步骤
          activeModule: null,
          error: null,
        })
        // 触发最终完成的副作用
        this.triggerSideEffects(null, previousStepId, data)
      }
      return
    }

    // Case B: 找到了下一个步骤，且与当前步骤不同 -> 触发加载和状态更新
    if (nextStep.id !== previousStepId) {
      logger.log(`Step changed: ${previousStepId || 'NULL'} -> ${nextStep.id}`)

      // 触发副作用（在新步骤加载前触发，可以做页面跳转等）
      this.triggerSideEffects(nextStep, previousStepId, data)

      this.updateState({
        isCompleted: false,
        currentStepId: nextStep.id,
        activeModule: null, // 清空旧组件，避免 UI 闪烁旧内容
        error: null, // 重置错误状态
      })

      // 异步加载代码
      this.loadStepModule(nextStep.type)
    }
    // Case C: 数据变化，但仍然停留在当前步骤 (幂等性)
    // 此时不需要触发重新加载，也不需要通知 ActiveComponent 以外部状态变化
    // ActiveComponent 内部可以通过 props.data 收到最新的数据
    else {
      // 如果只是数据变化，但步骤未切换，可以考虑是否需要 notify 一次当前状态
      // 这一步通常是为了确保 UI (FlowRenderer) 始终拿到最新的 EngineState
      // 即使 currentStepId 未变，但其他属性如 isLoading, error 可能已变
      this.notify(this.state)
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
   * [新增] 辅助判断当前步骤是否必填 (给 UI 用)
   */
  public isCurrentStepRequired(): boolean {
    const step = this.getCurrentStepConfig()
    return step?.required ?? true // 默认为 true
  }

  /**
   * [新增] 获取流程的进度信息 (给 UI 进度条用)
   * @param data 最新的业务数据，用于计算完成状态
   */
  public getProgressInfo(data: TData) {
    const totalSteps = this.config.length
    let completedSteps = 0
    let requiredSteps = 0
    let completedRequiredSteps = 0

    this.config.forEach((step) => {
      const isCurrentStepRequired = step.required ?? true // 默认为必填
      if (isCurrentStepRequired) {
        requiredSteps++
      }

      if (isStepCompleted(step, data)) {
        completedSteps++
        if (isCurrentStepRequired) {
          completedRequiredSteps++
        }
      }
    })

    return {
      total: totalSteps, // 总步骤数
      completed: completedSteps, // 已完成的步骤数 (含可选)
      requiredTotal: requiredSteps, // 必填步骤总数
      requiredCompleted: completedRequiredSteps, // 已完成的必填步骤数
      percent: totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100), // 总进度百分比
    }
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
   * [新增] 内部：触发所有注册的副作用拦截器
   */
  private triggerSideEffects(
    currentStep: StepConfig<TData> | null,
    previousStepId: string | null,
    data: TData,
  ) {
    // 只有在步骤真正切换时才触发，并且传递完整的 step config 和上下文
    if (currentStep) {
      this.interceptors.forEach((fn) => {
        try {
          fn(currentStep, { previousStepId, data })
        } catch (e) {
          logger.error('Interceptor execution failed', e)
        }
      })
    }
    // TODO: 考虑在流程最终完成时也触发一个特殊类型的拦截器
  }

  /**
   * 内部：更新状态并通知订阅者
   */
  private updateState(patch: Partial<EngineState>) {
    this.state = { ...this.state, ...patch }
    this.notify(this.state) // 调用 Observable 基类的 notify
  }
}
