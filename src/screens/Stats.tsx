import { useStore } from '../store'
import { chartSeries, periodStats, personalRecord, volume } from '../lib/stats'
import { formatNumber, plural } from '../lib/time'
import { Chart } from '../components/Chart'

export function Stats() {
  const { workouts } = useStore()
  const now = Date.now()

  const vol = volume(workouts)
  const pr = personalRecord(workouts)
  const total = workouts.filter((w) => w.status !== 'in_progress').length
  const d7 = periodStats(workouts, now, 7)
  const d30 = periodStats(workouts, now, 30)
  const series = chartSeries(workouts, 30)

  return (
    <>
      <header className="app-header">
        <h1 className="h-page">Статистика</h1>
      </header>

      <div className="stat-rows glass">
        <div className="stat-row">
          <span className="k">Общий объём</span>
          <span className="v num">
            {formatNumber(vol)}
            <small>{plural(vol, 'отжимание', 'отжимания', 'отжиманий')}</small>
          </span>
        </div>
        <div className="stat-row">
          <span className="k">Личный рекорд</span>
          <span className="v num">
            {pr}
            <small>за подход</small>
          </span>
        </div>
        <div className="stat-row">
          <span className="k">Тренировок</span>
          <span className="v num">{total}</span>
        </div>
      </div>

      <Chart points={series} />

      <div className="stat-rows glass">
        <div className="stat-row">
          <span className="k">За 7 дней</span>
          <span className="v num">
            {formatNumber(d7.volume)}
            <small>
              {d7.workouts} {plural(d7.workouts, 'тренировка', 'тренировки', 'тренировок')}
            </small>
          </span>
        </div>
        <div className="stat-row">
          <span className="k">За 30 дней</span>
          <span className="v num">
            {formatNumber(d30.volume)}
            <small>
              {d30.workouts} {plural(d30.workouts, 'тренировка', 'тренировки', 'тренировок')}
            </small>
          </span>
        </div>
      </div>
    </>
  )
}
