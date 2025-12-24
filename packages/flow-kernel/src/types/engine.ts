/** 模块加载器函数类型 */
export type ModuleLoader = () => Promise<any>

/** 引擎运行时状态 */
export interface EngineState {
  /** 当前正在进行的步骤 ID，null 表示全部完成或尚未开始 */
  currentStepId: string | null

  /** 当前加载完成的组件/模块 (React Component, Vue Object etc.) */
  activeModule: any | null

  /** 是否正在加载模块代码 */
  isLoading: boolean

  /** 加载或执行过程中的错误 */
  error: Error | null

  /** 是否所有流程均已完成 */
  isCompleted: boolean
}

/** 状态变更监听器 */
export type StateListener = (state: EngineState) => void
