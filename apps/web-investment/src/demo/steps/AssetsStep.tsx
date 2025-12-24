import { useMemo, useState } from 'react'
import type { DemoStepProps } from './types'

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export default function AssetsStep({ data, patch, step }: DemoStepProps) {
  const [loading, setLoading] = useState(false)
  const canLoad = Boolean(data.loggedIn)
  const title = String(step?.props?.title ?? '拉取资产（异步）')

  const total = useMemo(() => {
    return (data.assets ?? []).reduce((sum, a) => sum + a.amount, 0)
  }, [data.assets])

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        这个步骤用 <code>matcher</code>：<code>assetsLoaded &amp;&amp; assets.length &gt; 0</code> 判断是否完成。
      </div>

      {!canLoad ? (
        <div style={{ padding: 12, borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa' }}>
          需要先登录才能拉取资产。
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
        <button
          disabled={!canLoad || loading}
          onClick={async () => {
            setLoading(true)
            try {
              // 模拟请求延迟 + 返回数据
              await sleep(600)
              patch({
                assetsLoaded: true,
                assets: [
                  { symbol: 'AAPL', amount: 10 },
                  { symbol: 'TSLA', amount: 5 },
                ],
              })
            } finally {
              setLoading(false)
            }
          }}
        >
          {loading ? '拉取中...' : '拉取资产'}
        </button>
        <button
          onClick={() =>
            patch({
              assetsLoaded: false,
              assets: [],
            })
          }
          disabled={loading}
        >
          清空资产
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>资产列表</div>
        {(data.assets?.length ?? 0) === 0 ? (
          <div style={{ opacity: 0.6 }}>暂无</div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {(data.assets ?? []).map((a) => (
              <div key={a.symbol} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>{a.symbol}</div>
                <div>{a.amount}</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: 8 }}>
              <div style={{ fontWeight: 600 }}>合计</div>
              <div style={{ fontWeight: 600 }}>{total}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


