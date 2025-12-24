import type { DemoStepProps } from './types'

export default function OptionalSurveyStep({ data, patch, step }: DemoStepProps) {
  const title = String(step?.meta?.pageTitle ?? step?.props?.title ?? '可选问卷（可跳过）')

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        这是一个 <b>required: false</b> 的可选步骤：点击“跳过”会写入 <code>skipKey</code>（
        <code>surveySkipped</code>），引擎会直接认为本步骤已完成。
      </div>

      <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 10, border: '1px solid #eee' }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          surveyDone: <b>{String(Boolean(data.surveyDone))}</b>，surveySkipped: <b>{String(Boolean(data.surveySkipped))}</b>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => patch({ surveyDone: true, surveySkipped: false })}>完成问卷</button>
          <button onClick={() => patch({ surveySkipped: true })}>跳过</button>
          <button onClick={() => patch({ surveyDone: false, surveySkipped: false })}>重置本步骤</button>
        </div>

        {step?.meta ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            meta：<code>{JSON.stringify(step.meta)}</code>
          </div>
        ) : null}
      </div>
    </div>
  )
}


