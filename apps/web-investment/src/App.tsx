import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlowEngine, isStepCompleted, type EngineState, type StepConfig } from '@blade-demon/flow-kernel'
import './App.css'

type DemoData = {
  loggedIn?: boolean
  userId?: string
  assetsLoaded?: boolean
  assets?: { symbol: string; amount: number }[]
  riskAgreed?: boolean
  confirmed?: boolean
}

export function App({ data }: { data?: any }) {
  // 更现实的 demo：用 data 驱动“登录 -> 拉取资产(异步) -> 风险确认 -> 提交确认”
  const steps = useMemo<StepConfig<DemoData>[]>(
    () => [
      { id: 'login', type: 'LoginStep', checkKey: 'loggedIn', props: { title: '登录' } },
      {
        id: 'assets',
        type: 'AssetsStep',
        matcher: (d) => Boolean(d.assetsLoaded && (d.assets?.length ?? 0) > 0),
        props: { title: '拉取资产（异步）' },
      },
      { id: 'risk', type: 'RiskStep', checkKey: 'riskAgreed', props: { title: '风险确认' } },
      { id: 'confirm', type: 'ConfirmStep', checkKey: 'confirmed', props: { title: '提交确认' } },
    ],
    [],
  )

  const engine = useMemo(() => {
    const e = new FlowEngine<DemoData>(steps)
    e.registerLoader('LoginStep', () => import('./demo/steps/LoginStep'))
    e.registerLoader('AssetsStep', () => import('./demo/steps/AssetsStep'))
    e.registerLoader('RiskStep', () => import('./demo/steps/RiskStep'))
    e.registerLoader('ConfirmStep', () => import('./demo/steps/ConfirmStep'))
    return e
  }, [steps])
  const [state, setState] = useState<EngineState>(engine.getState())
  const [demoData, setDemoData] = useState<DemoData>(() => ({
    loggedIn: false,
    userId: '',
    assetsLoaded: false,
    assets: [],
    riskAgreed: false,
    confirmed: false,
    ...(data ?? {}),
  }))

  useEffect(() => engine.subscribe(setState), [engine])
  useEffect(() => engine.sync(demoData), [engine, demoData])

  const patch = useCallback(
    (p: Partial<DemoData>) => {
      setDemoData((prev) => ({ ...prev, ...p }))
    },
    [setDemoData],
  )

  const reset = useCallback(() => {
    setDemoData({
      loggedIn: false,
      userId: '',
      assetsLoaded: false,
      assets: [],
      riskAgreed: false,
      confirmed: false,
    })
  }, [])

  const errorMessage = state.error ? String((state as any).error?.message ?? (state as any).error) : null
  if (errorMessage) return <div>错误：{errorMessage}</div>
  if (state.isCompleted) return <div>已完成</div>
  if (state.isLoading) return <div>加载中...</div>

  const Active = state.activeModule
  const step = engine.getCurrentStepConfig() as StepConfig<DemoData> | undefined
  const completedCount = steps.reduce((acc, s) => acc + (isStepCompleted(s, demoData) ? 1 : 0), 0)
  const totalCount = steps.length || 1
  const percent = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="flowDemoRoot">
      <div className="flowDemoHeader">
        <div className="flowDemoTitle">Flow Demo</div>
        <div className="flowDemoSubtitle">
          当前步骤：{state.currentStepId ?? '-'} {step?.props?.title ? `（${String(step.props.title)}）` : ''}
        </div>
        <div className="flowDemoProgressWrap" aria-label="完成进度">
          <div className="flowDemoProgressMeta">
            <span className="flowDemoProgressText">
              进度：{completedCount}/{totalCount}
            </span>
            <span className="flowDemoProgressText">{percent}%</span>
          </div>
          <progress className="flowDemoProgressNative" value={percent} max={100} />
        </div>
        <button onClick={reset} className="flowDemoReset">
          重置
        </button>
      </div>

      <div className="flowDemoGrid">
        <div className="flowDemoPanel">
          {Active ? <Active data={demoData} patch={patch} step={step} /> : null}
        </div>

        <div className="flowDemoPanel">
          <div className="flowDemoPanelTitle">调试面板</div>
          <div className="flowDemoLabel">demoData</div>
          <pre className="flowDemoPre">
            {JSON.stringify(demoData, null, 2)}
          </pre>
          <div className="flowDemoLabel flowDemoLabelSpacing">engineState</div>
          <pre className="flowDemoPre">
            {JSON.stringify(
              {
                currentStepId: state.currentStepId,
                isLoading: state.isLoading,
                isCompleted: state.isCompleted,
                error: errorMessage,
              },
              null,
              2,
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default App
