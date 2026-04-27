/** Map a workout description (Korean or English) to a fitting emoji. */
export function pickWorkoutIcon(label: string): string {
  const t = label.toLowerCase();
  if (/요가|yoga/.test(t)) return "🧘";
  if (/필라테스|pilates/.test(t)) return "🧘‍♀️";
  if (/수영|swim/.test(t)) return "🏊";
  if (/자전거|싸이클|사이클|bike|cycling|cycle/.test(t)) return "🚴";
  if (/등산|hike|hiking/.test(t)) return "🥾";
  if (/산책|걷기|walk|walking/.test(t)) return "🚶";
  if (/달리기|런닝|러닝|조깅|run|running|jog|jogging/.test(t)) return "🏃";
  if (/근력|스쿼트|덤벨|벤치|squat|strength|weight|lifting|lift/.test(t))
    return "🏋️";
  if (/댄스|줌바|dance|zumba/.test(t)) return "💃";
  if (/스트레칭|stretch/.test(t)) return "🤸";
  if (/복싱|boxing/.test(t)) return "🥊";
  if (/골프|golf/.test(t)) return "⛳";
  if (/테니스|tennis/.test(t)) return "🎾";
  if (/스키|ski/.test(t)) return "⛷️";
  if (/축구|soccer|football/.test(t)) return "⚽";
  if (/농구|basketball/.test(t)) return "🏀";
  return "🏃";
}
