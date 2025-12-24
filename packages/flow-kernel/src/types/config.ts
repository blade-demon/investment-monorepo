/**
 * 步骤配置定义
 * @template TData 业务数据的类型
 */
export interface StepConfig<TData = any> {
  /** 步骤唯一标识 (例如: "kyc_step") */
  id: string

  /**
   * 组件类型标识 (例如: "FormPage", "VideoRecord")
   * 用于在 Registry 中查找对应的加载器
   */
  type: string

  /** 透传给 UI 组件的静态 Props (例如: { title: "实名认证", required: true }) */
  props?: Record<string, any>

  /**
   * 判断该步骤是否完成的逻辑
   * 返回 true 表示已完成（跳过），false 表示未完成（命中）
   */
  matcher?: (data: TData) => boolean

  /**
   * 简化的匹配模式：检查数据中是否存在该字段且为 Truthy
   * 如果提供了 matcher，则忽略 checkKey
   */
  checkKey?: keyof TData
}
