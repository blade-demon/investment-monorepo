import type { DemoStepProps } from './types'

export default function RiskStep({ data, patch, step }: DemoStepProps) {
  const title = String(step?.props?.title ?? '风险确认')

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        这个步骤用 <code>checkKey: &quot;riskAgreed&quot;</code> 判断是否完成。
      </div>

      <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: 10 }}>
          我已阅读并理解投资风险提示，知悉本金可能波动甚至亏损。
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={Boolean(data.riskAgreed)}
            onChange={(e) => patch({ riskAgreed: e.target.checked })}
          />
          <div>同意风险提示</div>
        </label>
      </div>
    </div>
  )
}


