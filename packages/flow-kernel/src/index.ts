// Core
export { FlowEngine } from './core/FlowEngine'

// Types
export type { StepConfig } from './types/config'
export type { EngineState, StateListener, ModuleLoader } from './types/engine'

// Strategies (可选导出，如果业务方需要复用匹配逻辑)
export { isStepCompleted } from './strategies/Matcher'
