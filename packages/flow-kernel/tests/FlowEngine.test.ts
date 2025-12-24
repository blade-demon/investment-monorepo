import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FlowEngine } from '../src/core/FlowEngine'
import { StepConfig } from '../src/types/config'

const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

// ----------------------------
// 业务语义风格测试 (step_1 / step_2)
// ----------------------------

interface MockData {
  step1Done: boolean
  step2Done: boolean
}

const mockConfig: StepConfig<MockData>[] = [
  { id: 'step_1', type: 'StepOne', matcher: (d) => d.step1Done },
  { id: 'step_2', type: 'StepTwo', matcher: (d) => d.step2Done },
]

describe('FlowEngine Logic', () => {
  let engine: FlowEngine<MockData>

  beforeEach(() => {
    engine = new FlowEngine(mockConfig)
    engine.registerLoader('StepOne', async () => ({ default: 'Component1' }))
    engine.registerLoader('StepTwo', async () => ({ default: 'Component2' }))
  })

  it('初始状态应为空', () => {
    expect(engine.getState().currentStepId).toBeNull()
  })

  it('当数据都未完成时，应该停留在第一步', async () => {
    engine.sync({ step1Done: false, step2Done: false })
    await flushAsync()

    const state = engine.getState()
    expect(state.currentStepId).toBe('step_1')
    expect(state.activeModule).toBe('Component1')
    expect(state.isCompleted).toBe(false)
  })

  it('当第一步完成时，应该自动跳到第二步', async () => {
    engine.sync({ step1Done: true, step2Done: false })
    await flushAsync()

    const state = engine.getState()
    expect(state.currentStepId).toBe('step_2')
    expect(state.activeModule).toBe('Component2')
  })

  it('当所有步骤都完成时，isCompleted 应该为 true', () => {
    engine.sync({ step1Done: true, step2Done: true })

    const state = engine.getState()
    expect(state.currentStepId).toBeNull()
    expect(state.isCompleted).toBe(true)
  })

  it('未注册 Loader 时应该报错', async () => {
    const newEngine = new FlowEngine(mockConfig)
    newEngine.sync({ step1Done: false, step2Done: false })
    await flushAsync()

    expect(newEngine.getState().error).toBeDefined()
  })
})

// ----------------------------
// 内核行为测试 (订阅 / 幂等 / 异常)
// ----------------------------

interface TestData {
  step1: boolean
  step2: boolean
}

const MockComponent1 = { default: 'Comp1' }
const MockComponent2 = { default: 'Comp2' }

describe('FlowEngine Core', () => {
  let engine: FlowEngine<TestData>

  const config: StepConfig<TestData>[] = [
    { id: 's1', type: 'type1', matcher: (d) => d.step1 },
    { id: 's2', type: 'type2', matcher: (d) => d.step2 },
  ]

  beforeEach(() => {
    engine = new FlowEngine(config)
    engine.registerLoader('type1', async () => MockComponent1)
    engine.registerLoader('type2', async () => MockComponent2)
  })

  it('初始化状态应正确', () => {
    const state = engine.getState()
    expect(state.currentStepId).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.isCompleted).toBe(false)
    expect(state.error).toBeNull()
  })

  it('流程流转: 初始 -> 步骤1 -> 步骤2 -> 完成', async () => {
    engine.sync({ step1: false, step2: false })
    await flushAsync()
    expect(engine.getState().currentStepId).toBe('s1')
    expect(engine.getState().activeModule).toBe('Comp1')

    engine.sync({ step1: true, step2: false })
    await flushAsync()
    expect(engine.getState().currentStepId).toBe('s2')
    expect(engine.getState().activeModule).toBe('Comp2')

    engine.sync({ step1: true, step2: true })
    expect(engine.getState().isCompleted).toBe(true)
    expect(engine.getState().currentStepId).toBeNull()
  })

  it('跳跃测试: 如果一开始 s1 就完成了，应该直接加载 s2', async () => {
    engine.sync({ step1: true, step2: false })
    await flushAsync()

    const state = engine.getState()
    expect(state.currentStepId).toBe('s2')
    expect(state.activeModule).toBe('Comp2')
    expect(state.isCompleted).toBe(false)
  })

  it('异常处理: 加载器未注册', async () => {
    const badConfig = [{ id: 'bad', type: 'unknown_type' }]
    const badEngine = new FlowEngine(badConfig)

    badEngine.sync({})
    await flushAsync()

    const state = badEngine.getState()
    expect(state.error).not.toBeNull()
    expect(state.error?.message).toContain('No loader registered')
    expect(state.isLoading).toBe(false)
  })

  it('异常处理: 加载器抛出错误 (如网络失败)', async () => {
    const failConfig = [{ id: 'f1', type: 'fail_type' }]
    const failEngine = new FlowEngine(failConfig)
    failEngine.registerLoader('fail_type', async () => {
      throw new Error('Network Error')
    })

    failEngine.sync({})
    await flushAsync()

    const state = failEngine.getState()
    expect(state.error).not.toBeNull()
    expect(state.error?.message).toBe('Network Error')
    expect(state.isLoading).toBe(false)
  })

  it('订阅机制: state 变化应通知监听器', async () => {
    const listener = vi.fn()
    const unsubscribe = engine.subscribe(listener)

    engine.sync({ step1: false, step2: false })
    await flushAsync()

    expect(listener).toHaveBeenCalled()

    const lastCallState = listener.mock.calls[listener.mock.calls.length - 1][0]
    expect(lastCallState.currentStepId).toBe('s1')

    unsubscribe()
    listener.mockClear()
    engine.sync({ step1: true, step2: false })
    expect(listener).not.toHaveBeenCalled()
  })

  it('幂等性: 数据变化但步骤未变时，不应重复加载', async () => {
    // 第一次 sync，触发加载 type1
    engine.sync({ step1: false, step2: false })
    await flushAsync()
    expect(engine.getState().currentStepId).toBe('s1')

    // 替换 loader 为 spy，用于检测“是否会重复触发加载”
    const spyLoader = vi.fn().mockResolvedValue({ default: 'Comp1' })
    engine.registerLoader('type1', spyLoader)

    // 第二次 sync，步骤仍为 s1，按实现不应再次调用 loadStepModule
    engine.sync({ step1: false, step2: false })
    await flushAsync()
    expect(spyLoader).not.toHaveBeenCalled()
  })
})
