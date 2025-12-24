graph TD
%% 定义样式
classDef ui fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000;
classDef core fill:#fff3e0,stroke:#ff6f00,stroke-width:2px,color:#000;
classDef data fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000;
classDef config fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,stroke-dasharray: 5 5,color:#000;

    %% --- 区域：业务数据层 ---
    subgraph Data_Layer [数据输入层]
        BackendAPI(后端接口 / 业务数据):::data
    end

    %% --- 区域：配置层 ---
    subgraph Config_Layer [配置定义层]
        FlowConfig(StepConfig 数组):::config
        RegistryConfig(组件注册表 Map):::config
    end

    %% --- 区域：核心内核层 (Flow Kernel) ---
    subgraph Kernel_Layer [Flow Kernel 核心引擎]
        direction TB

        EngineSync("⚡ FlowEngine.sync(data)"):::core

        subgraph Calculation [状态计算循环]
            StepLoop{遍历配置步骤}:::core
            Matcher("🔎 Matcher 策略判断<br/>(checkKey / matcher / required / skipKey)"):::core
            IsDone{是否完成?}:::core
        end

        DiffCheck{"⚖️ 步骤是否变更?<br/>(NewID !== OldID)"}:::core

        subgraph Transition [状态跃迁 & 副作用]
            SideEffects("✨ 触发 Interceptors<br/>(埋点 / Title修改)"):::core
            UpdateState1("📝 更新状态: Loading"):::core
            RegistryLookup("🗂️ Registry 查找加载器"):::core
            AsyncLoad("☁️ 异步加载 import()"):::core
            UpdateState2("✅ 更新状态: ActiveModule"):::core
        end

        Notify("📢 Notify (发布订阅)"):::core
    end

    %% --- 区域：UI 适配与渲染层 ---
    subgraph UI_Layer [UI 渲染层 (React)]
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
