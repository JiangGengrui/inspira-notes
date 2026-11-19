import { Flame } from 'lucide-react'
import type { HeatmapData } from '../lib/date'

export function Heatmap({ data }: { data: HeatmapData }): JSX.Element {
  return (
    <div className="heatmap-card">
      <div className="heatmap-head">
        <span className="heatmap-title">灵感热力</span>
        <span className="streak" title="连续记录天数">
          <Flame size={12} />
          {data.streak > 0 ? `${data.streak} 天` : '从今天开始'}
        </span>
      </div>
      <div className="heatmap-grid" role="img" aria-label="最近 16 周的灵感记录热力图">
        {data.weeks.map((week) => (
          <div className="heat-week" key={week.key}>
            {week.cells.map((cell) =>
              cell.level < 0 ? (
                <span key={cell.key} className="heat-cell is-future" />
              ) : (
                <span
                  key={cell.key}
                  className={`heat-cell level-${cell.level}`}
                  title={cell.title}
                />
              )
            )}
          </div>
        ))}
      </div>
      <div className="heatmap-foot">
        <span>{data.total} 条灵感</span>
        <span>活跃 {data.activeDays} 天</span>
      </div>
    </div>
  )
}
