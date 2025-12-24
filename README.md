涵盖了从 **数据输入** -> **引擎计算** -> **资源加载** -> **状态分发** -> **UI 渲染** 的全过程。

### 📊 完整架构逻辑流程图

```mermaid
graph TD
    %% 定义样式
    classDef ui fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000;
    classDef core fill:#fff3e0,stroke:#ff6f00,stroke-width:2px,color:#000;
    classDef data fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000;
    classDef config fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,stroke-dasharray: 5 5,color:#000;

    %% --- 区域：业务数据层 ---
    subgraph Data_Layer ["数据输入层"]
        BackendAPI("后端接口 / 业务数据"):::data
    end

    %% --- 区域：配置层 ---
    subgraph Config_Layer ["配置定义层"]
        FlowConfig("StepConfig 数组"):::config
        RegistryConfig("组件注册表 Map"):::config
    end

    %% --- 区域：核心内核层 (Flow Kernel) ---
    subgraph Kernel_Layer ["Flow Kernel 核心引擎"]
        direction TB

        EngineSync("⚡ FlowEngine.sync(data)"):::core

        subgraph Calculation ["状态计算循环"]
            StepLoop{"遍历配置步骤"}:::core
            Matcher("🔎 Matcher 策略判断<br/>(checkKey/required/skipKey)"):::core
            IsDone{"是否完成?"}:::core
        end

        DiffCheck{"⚖️ 步骤是否变更?<br/>(NewID !== OldID)"}:::core

        subgraph Transition ["状态跃迁 & 副作用"]
            SideEffects("✨ 触发 Interceptors<br/>(埋点 / Title修改)"):::core
            UpdateState1("📝 更新状态: Loading"):::core
            RegistryLookup("🗂️ Registry 查找加载器"):::core
            AsyncLoad("☁️ 异步加载 import()"):::core
            UpdateState2("✅ 更新状态: ActiveModule"):::core
        end

        Notify("📢 Notify (发布订阅)"):::core
    end

    %% --- 区域：UI 适配与渲染层 ---
    subgraph UI_Layer ["UI 渲染层 (React)"]
        ReactHook("🪝 useFlowEngine<br/>(useSyncExternalStore)"):::ui
        FlowRenderer("🎨 FlowRenderer 组件"):::ui
        BusinessComp("🧩 具体的业务组件<br/>(实名 / 绑卡 / 密码)"):::ui
        UserAction("👤 用户操作<br/>(点击提交)"):::ui
    end

    %% --- 连线逻辑 ---

    %% 1. 数据驱动
    BackendAPI -->|1. 数据变化| ReactHook
    ReactHook -->|2. 调用| EngineSync
    FlowConfig -.->|注入规则| EngineSync

    %% 2. 计算逻辑
    EngineSync --> StepLoop
    StepLoop --> Matcher
    Matcher --> IsDone
    IsDone -- Yes (跳过) --> StepLoop
    IsDone -- No (命中拦路虎) --> DiffCheck

    %% 3. 状态变更逻辑
    DiffCheck -- No (幂等) --> Notify
    DiffCheck -- Yes (切换步骤) --> SideEffects
    SideEffects --> UpdateState1
    UpdateState1 --> RegistryLookup
    RegistryConfig -.->|查找 Loader| RegistryLookup
    RegistryLookup --> AsyncLoad
    AsyncLoad --> UpdateState2
    UpdateState2 --> Notify

    %% 4. 渲染逻辑
    Notify -->|3. 通知更新| ReactHook
    ReactHook -->|4. 触发重渲染| FlowRenderer
    FlowRenderer -->|5. 渲染当前步骤| BusinessComp

    %% 5. 闭环
    BusinessComp --> UserAction
    UserAction -->|6. 提交接口刷新数据| BackendAPI
```

---

### 🗺️ 图解说明

这张图分为四个核心纵队，展示了数据如何在系统中流转：

#### 1. 🟢 数据输入层 (Data Layer)

- **起点**：一切始于 `BackendAPI` 返回的数据（例如 `{ hasAuth: true, hasPwd: false }`）。
- **单一数据源**：前端不自己维护“当前是第几步”，完全由这份数据决定。

#### 2. 🟣 配置定义层 (Config Layer)

- **静态规则**：这里定义了流程的“地图”（`StepConfig`）和“武器库”（`Registry`）。
- **热插拔**：修改这里的 JSON 配置，就能改变下面内核的运行路径。

#### 3. 🟠 Flow Kernel 核心引擎 (The Brain)

这是最复杂的逻辑部分：

1. **Sync**: 接收数据，开始计算。
2. **Matcher Loop**: 贪婪匹配，一个个问 `Matcher`：“这一步做完了吗？”（结合 `required`, `skipKey`, `matcher` 函数判断）。
3. **Diff**: 找到第一个没做完的步骤，和当前步骤对比。如果一样，什么都不做（**幂等性**）。
4. **Transition**: 如果步骤变了：
   - 触发 **Side Effects** (拦截器/埋点)。
   - 去 **Registry** 找对应的代码加载器。
   - 执行 **Async Load** (Webpack 动态导入)。
   - 更新内部 State。
5. **Notify**: 拿着最新的 State，大喊一声“状态变啦！”

#### 4. 🔵 UI 渲染层 (UI Layer)

- **React Hook**: 听到引擎的喊声，触发 React 的 Re-render。
- **FlowRenderer**: 根据引擎给的 `ActiveModule`，把真正的组件画在屏幕上。
- **闭环**: 用户在组件里点击“提交”，调用 API，数据发生变化，**再次触发第一步**，形成完美的闭环。
