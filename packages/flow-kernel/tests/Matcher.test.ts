import { describe, it, expect } from 'vitest'
import { isStepCompleted } from '../src/strategies/Matcher'
import { StepConfig } from '../src/types/config'

describe('Matcher Strategy', () => {
  // 准备一些测试数据
  const mockData = {
    hasName: true,
    hasId: false,
    score: 100,
    obj: { nested: true },
  }

  it('策略1: 使用 matcher 函数 (最高优先级)', () => {
    // 场景 A: matcher 返回 true -> 步骤完成
    const configDone: StepConfig = {
      id: '1',
      type: 'any',
      matcher: (d: typeof mockData) => d.score > 50,
    }
    expect(isStepCompleted(configDone, mockData)).toBe(true)

    // 场景 B: matcher 返回 false -> 步骤未完成
    const configTodo: StepConfig = {
      id: '2',
      type: 'any',
      matcher: (d: typeof mockData) => d.score > 200,
    }
    expect(isStepCompleted(configTodo, mockData)).toBe(false)
  })

  it('策略2: 使用 checkKey (次优先级)', () => {
    // 场景 A: 字段为 Truthy -> 完成
    const configDone: StepConfig = {
      id: '3',
      type: 'any',
      checkKey: 'hasName', // mockData.hasName is true
    }
    expect(isStepCompleted(configDone, mockData)).toBe(true)

    // 场景 B: 字段为 Falsy -> 未完成
    const configTodo: StepConfig = {
      id: '4',
      type: 'any',
      checkKey: 'hasId', // mockData.hasId is false
    }
    expect(isStepCompleted(configTodo, mockData)).toBe(false)
  })

  it('优先级测试: matcher 应该覆盖 checkKey', () => {
    const config: StepConfig = {
      id: '5',
      type: 'any',
      checkKey: 'hasName', // 这个字段是 true
      matcher: () => false, // 但是函数强制返回 false
    }

    // 预期结果：遵循 matcher 的结果 (false)
    expect(isStepCompleted(config, mockData)).toBe(false)
  })

  it('兜底策略: 无配置时默认未完成', () => {
    const config: StepConfig = {
      id: '6',
      type: 'any',
      // 没有 matcher 也没有 checkKey
    }
    expect(isStepCompleted(config, mockData)).toBe(false)
  })
})
