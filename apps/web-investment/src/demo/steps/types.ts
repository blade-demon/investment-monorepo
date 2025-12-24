import type { StepConfig } from '@blade-demon/flow-kernel'

export type DemoData = {
  loggedIn?: boolean
  userId?: string
  assetsLoaded?: boolean
  assets?: { symbol: string; amount: number }[]
  riskAgreed?: boolean
  surveyDone?: boolean
  surveySkipped?: boolean
  confirmed?: boolean
}

export type DemoStepProps = {
  data: DemoData
  patch: (p: Partial<DemoData>) => void
  step?: StepConfig<DemoData>
}
