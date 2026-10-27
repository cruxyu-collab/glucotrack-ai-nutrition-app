/**
 * 端末のローカルタイムゾーンに基づき YYYY-MM-DD 形式の日付文字列を生成
 * (UTCによる日付のズレを防止)
 * @param d 基準日時 (デフォルト: 現在時刻)
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 端末のローカル時刻を基準としたISOフォーマット互換の文字列を生成
 * 例: "2026-03-30T14:30:00"
 */
export const toLocalISOString = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};