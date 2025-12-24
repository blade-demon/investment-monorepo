import { StepConfig } from '../types/config'

/**
 * 判断步骤是否已完成
 * @param step 步骤配置
 * @param data 业务数据
 * @returns true: 已完成(跳过); false: 未完成(需执行)
 */
export function isStepCompleted<TData>(step: StepConfig<TData>, data: TData): boolean {
  // 1. 优先使用自定义函数
  if (step.matcher) {
    return step.matcher(data)
  }

  // 2. 使用简单的 Key 检查
  if (step.checkKey) {
    const val = data[step.checkKey]
    // 简单的真值判断，业务复杂时建议用 matcher
    return !!val
  }

  // 3. 默认防御：如果没有任何配置，认为该步骤未完成
  return false
}
