import type { DemoStepProps } from './types'

export default function ConfirmStep({ data, patch, step }: DemoStepProps) {
  const title = String(step?.props?.title ?? '提交确认')
  const disabled = !data.loggedIn || !(data.assets?.length ?? 0) || !data.riskAgreed

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        这个步骤用 <code>checkKey: &quot;confirmed&quot;</code> 判断是否完成。你可以在这里做最终校验/提交。
      </div>

      <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 10, border: '1px solid #eee' }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>用户</div>
          <div>{data.userId || '-'}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>资产数量</div>
          <div>{String(data.assets?.length ?? 0)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>风险同意</div>
          <div>{String(Boolean(data.riskAgreed))}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
          <button
            disabled={disabled}
            onClick={() => {
              patch({ confirmed: true })
            }}
          >
            确认提交
          </button>
          <button onClick={() => patch({ confirmed: false })}>撤销确认</button>
          {disabled ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              需要先完成登录、拉取资产、风险确认
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}


