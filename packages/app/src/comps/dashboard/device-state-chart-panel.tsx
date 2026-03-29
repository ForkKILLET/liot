'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/comps/ui/select'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/comps/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/comps/ui/card'

type NumberFieldMeta = {
  field: string
  label: string
  unit: string
  min?: number
  max?: number
  precision?: number
}

type HistoryPoint = {
  ts: string
  values: Record<string, number>
}

type ChartRow = {
  ts: string
} & Record<string, string | number>

type DeviceStateChartPanelProps = {
  deviceId: number
  selectedFields: NumberFieldMeta[]
}

const colors = ['#60a5fa', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#22d3ee']

type WindowOption = 'latest-10' | '15m' | '60m' | '360m'

const windowLabels: Record<WindowOption, string> = {
  'latest-10': '最近10次',
  '15m': '15分钟',
  '60m': '1小时',
  '360m': '6小时',
}

export function DeviceStateChartPanel({ deviceId, selectedFields }: DeviceStateChartPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [points, setPoints] = useState<HistoryPoint[]>([])
  const [windowOption, setWindowOption] = useState<WindowOption>('latest-10')

  const fieldMap = useMemo(() => {
    const map = new Map<string, NumberFieldMeta>()
    selectedFields.forEach((meta) => map.set(meta.field, meta))
    return map
  }, [selectedFields])

  const rows = useMemo<ChartRow[]>(() => {
    return points.map((point) => ({
      ts: new Date(point.ts).toLocaleTimeString(),
      ...point.values,
    }))
  }, [points])

  const yDomain = useMemo<[number, number] | ['auto', 'auto']>(() => {
    const values: number[] = []

    for (const row of rows) {
      for (const field of selectedFields) {
        const value = row[field.field]
        if (typeof value === 'number' && Number.isFinite(value)) {
          values.push(value)
        }
      }
    }

    if (!values.length) {
      return ['auto', 'auto']
    }

    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)

    if (minValue === maxValue) {
      const pad = Math.max(Math.abs(minValue) * 0.05, 1)
      return [minValue - pad, maxValue + pad]
    }

    const span = maxValue - minValue
    const pad = Math.max(span * 0.08, 0.5)
    return [minValue - pad, maxValue + pad]
  }, [rows, selectedFields])

  const yTickFormatter = (value: number | string) => {
    const numericValue = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numericValue)) {
      return String(value)
    }

    return Number(numericValue.toFixed(2)).toString()
  }

  const loadHistory = async () => {
    if (!selectedFields.length) {
      setPoints([])
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        fields: selectedFields.map((field) => field.field).join(','),
      })

      if (windowOption === 'latest-10') {
        params.set('limit', '10')
      }
      else {
        const windowMap: Record<Exclude<WindowOption, 'latest-10'>, string> = {
          '15m': '15',
          '60m': '60',
          '360m': '360',
        }
        params.set('windowMinutes', windowMap[windowOption])
        params.set('limit', '2000')
      }

      const response = await fetch(`/api/devices/${deviceId}/state-history?${params.toString()}`)
      const payload = await response.json() as {
        success: boolean
        data?: {
          meta: NumberFieldMeta[]
          points: Array<{ ts: string, values: Record<string, number> }>
        }
      }

      if (!response.ok || !payload.success || !payload.data) {
        setPoints([])
        return
      }

      setPoints(payload.data.points)
    }
    finally {
      setIsLoading(false)
    }
  }

  const selectedFieldKey = selectedFields.map((item) => item.field).join(',')

  useEffect(() => {
    void loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, selectedFieldKey, windowOption])

  useEffect(() => {
    const onRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ deviceId?: number }>
      if (customEvent.detail?.deviceId !== deviceId) return
      void loadHistory()
    }

    window.addEventListener('device-state:refresh', onRefresh as EventListener)
    return () => window.removeEventListener('device-state:refresh', onRefresh as EventListener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, selectedFieldKey, windowOption])

  if (!selectedFields.length) {
    return (
      <Card className='border-border bg-card'>
        <CardHeader className='pb-2'>
          <CardTitle>状态图表</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>在左侧状态字段点击图表按钮后，这里会展示实时曲线。</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-border bg-card'>
      <CardHeader className='pb-2'>
        <CardTitle>状态图表</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-xs text-muted-foreground'>数据范围</span>
          <Select
            value={windowOption}
            onValueChange={(value) => setWindowOption(value as WindowOption)}
          >
            <SelectTrigger size='sm' className='w-28'>
              <SelectValue placeholder='选择范围' />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(windowLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => void loadHistory()}
            disabled={isLoading}
          >
            拉取历史
          </Button>
        </div>

        <div className='flex flex-wrap gap-2 text-xs'>
          {selectedFields.map((meta, index) => (
            <div key={meta.field} className='rounded border border-border bg-card px-2 py-1'>
              <span style={{ color: colors[index % colors.length] }}>{meta.label}</span>
              <span className='text-muted-foreground'> ({meta.unit})</span>
              <span className='text-muted-foreground'> · 范围 {meta.min ?? '-'} ~ {meta.max ?? '-'}</span>
            </div>
          ))}
        </div>

        <div className='h-80 w-full'>
          {isLoading ? (
            <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>加载中...</div>
          ) : rows.length ? (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                <XAxis dataKey='ts' stroke='#94a3b8' tick={{ fill: '#94a3b8', fontSize: 12 }} minTickGap={24} />
                <YAxis
                  stroke='#94a3b8'
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  domain={yDomain}
                  tickFormatter={yTickFormatter}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(value, name) => {
                    const meta = fieldMap.get(String(name))
                    if (!meta) return [String(value), String(name)]
                    const numericValue = typeof value === 'number' ? value : Number(value)
                    const displayValue = Number.isFinite(numericValue)
                      ? numericValue.toFixed(meta.precision ?? 2)
                      : String(value)
                    return [`${displayValue} ${meta.unit}`, meta.label]
                  }}
                />
                <Legend
                  formatter={(name) => fieldMap.get(String(name))?.label || String(name)}
                />
                {selectedFields.map((meta, index) => (
                  <Line
                    key={meta.field}
                    type='monotone'
                    dataKey={meta.field}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>当前窗口暂无数据</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
