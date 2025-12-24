import type { DemoStepProps } from './types'

export default function LoginStep({ data, patch, step }: DemoStepProps) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
        {String(step?.props?.title ?? '登录')}
      </div>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        这个步骤用 <code>checkKey: &quot;loggedIn&quot;</code> 判断是否完成。
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>userId</div>
          <input
            value={data.userId ?? ''}
            onChange={(e) => patch({ userId: e.target.value })}
            placeholder="例如: u_10001"
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => patch({ loggedIn: true, userId: data.userId || 'u_10001' })}
            disabled={Boolean(data.loggedIn)}
          >
            {data.loggedIn ? '已登录' : '登录'}
          </button>
          <button onClick={() => patch({ loggedIn: false })} disabled={!data.loggedIn}>
            退出登录
          </button>
        </div>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          当前状态：loggedIn = <b>{String(Boolean(data.loggedIn))}</b>
        </div>
      </div>
    </div>
  )
}


