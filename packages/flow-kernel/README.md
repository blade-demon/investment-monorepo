# @blade-demon/flow-kernel

一个**与 UI 框架无关**的“流程/步骤驱动”内核：根据外部业务数据计算当前应停留的步骤，并按需异步加载对应模块（React/Vue/纯对象都可以）。

## 特性

- **声明式步骤配置**：用 `StepConfig[]` 描述流程步骤与完成条件
- **数据驱动流转**：调用 `engine.sync(data)`，引擎会自动定位到“第一个未完成步骤”
- **按需加载模块**：步骤变化时自动调用对应 `loader`，并暴露 `activeModule`
- **可订阅状态**：`engine.subscribe(listener)` 在状态变化时触发回调
- **健壮的错误处理**：未注册 loader / loader 抛错会写入 `state.error`

## 安装

在 monorepo 外部使用：

```bash
pnpm add @blade-demon/flow-kernel
```

在本仓库内（workspace）直接依赖即可。

## 快速上手

### 1) 定义步骤配置

- `matcher(data) => boolean`：返回 `true` 表示**已完成（跳过）**；返回 `false` 表示**未完成（命中）**
- 或者用 `checkKey` 做简单真值判断（存在且 truthy 即视为完成）

```ts
import { FlowEngine, type StepConfig } from '@blade-demon/flow-kernel'

type BizData = {
  kycDone: boolean
  riskDone: boolean
}

const steps: StepConfig<BizData>[] = [
  { id: 'kyc', type: 'KycStep', matcher: (d) => d.kycDone },
  { id: 'risk', type: 'RiskStep', matcher: (d) => d.riskDone },
]
```

### 2) 创建引擎并注册 loader

`loader` 是一个返回 `Promise<any>` 的函数（通常是动态 `import()`）。引擎兼容 `default export` 与 CommonJS。

```ts
const engine = new FlowEngine(steps)

engine.registerLoader('KycStep', () => import('./steps/KycStep'))
engine.registerLoader('RiskStep', () => import('./steps/RiskStep'))
```

### 3) 用数据驱动流程

```ts
engine.sync({ kycDone: false, riskDone: false })

// state.currentStepId === 'kyc'
// state.isLoading === true -> false
// state.activeModule === (KycStep 模块的 default 或模块本身)
```

## 核心 API

### `new FlowEngine<TData>(config: StepConfig<TData>[])`

创建流程引擎实例，内部初始状态如下：

- `currentStepId`: `null`
- `activeModule`: `null`
- `isLoading`: `false`
- `error`: `null`
- `isCompleted`: `false`

### `engine.registerLoader(type: string, loader: () => Promise<any>)`

注册指定 `type` 的模块加载器。重复注册会覆盖，并打印 warn 日志。

### `engine.sync(data: TData)`

核心驱动方法：

- 找到第一个 `!isStepCompleted(step, data)` 的步骤作为“当前步骤”
- 若所有步骤都完成：设置 `isCompleted = true`、`currentStepId = null`、`activeModule = null`
- 若步骤发生变化：清空旧 `activeModule`，并触发异步加载新步骤模块
- 若步骤未变化：**不会重复加载**（幂等）

### `engine.getState(): EngineState`

获取当前引擎状态。

### `engine.getCurrentStepConfig(): StepConfig<TData> | undefined`

根据 `currentStepId` 返回当前步骤的完整配置（可用于渲染标题、静态 props 等）。

### `engine.subscribe(listener): () => void`

订阅状态变化，返回取消订阅函数。

## 与 UI 框架集成示例（React）

```tsx
import { useEffect, useMemo, useState } from 'react'
import { FlowEngine, type EngineState } from '@blade-demon/flow-kernel'

export function FlowHost({ data }: { data: any }) {
  const engine = useMemo(() => new FlowEngine(/* steps */), [])
  const [state, setState] = useState<EngineState>(engine.getState())

  useEffect(() => engine.subscribe(setState), [engine])
  useEffect(() => engine.sync(data), [engine, data])

  if (state.error) return <div>错误：{state.error.message}</div>
  if (state.isCompleted) return <div>已完成</div>
  if (state.isLoading) return <div>加载中...</div>

  const Active = state.activeModule
  return Active ? <Active /> : null
}
```

## 常见问题

### 为什么 `matcher` 返回 `true` 反而会“跳过”？

这是有意设计：`matcher` 表达的是“**该步骤是否已完成**”。返回 `true` => 已完成 => 不需要执行 => 跳过；返回 `false` => 未完成 => 命中当前步骤。

### 没有注册 loader 会怎样？

`state.error` 会被设置为 `Error('No loader registered...')`，同时 `isLoading` 置为 `false`。

## 开发与测试

在本仓库内：

```bash
pnpm -C packages/flow-kernel test
pnpm -C packages/flow-kernel build
```
