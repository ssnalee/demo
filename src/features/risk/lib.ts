/** 위험도 등급 문구 (원본 score(): 15↑ 매우 높음, 10↑ 높음, 5↑ 보통, 그 외 낮음) */
export function riskLevel(score: number): "매우 높음" | "높음" | "보통" | "낮음" {
  const n = Number(score) || 0;
  return n >= 15 ? "매우 높음" : n >= 10 ? "높음" : n >= 5 ? "보통" : "낮음";
}

/** 고위험 기준 (대시보드 kHigh: score ≥ 15) */
export const isHighRisk = (score: number) => (Number(score) || 0) >= 15;

/** 위험도 → 개선조치 우선순위 (15↑ 긴급, 10↑ 높음, 그 외 보통) */
export function actionPriority(score: number): "긴급" | "높음" | "보통" {
  const n = Number(score) || 0;
  return n >= 15 ? "긴급" : n >= 10 ? "높음" : "보통";
}

export function riskTone(score: number): "danger" | "warning" | "info" | "neutral" {
  const n = Number(score) || 0;
  return n >= 15 ? "danger" : n >= 10 ? "warning" : n >= 5 ? "info" : "neutral";
}
