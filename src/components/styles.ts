/*
 * 공통 스타일 (docs/DESIGN.md). 색은 globals.css 토큰만 쓴다.
 * primary(포인트 색)는 화면마다 한두 번, 가장 중요한 버튼에만.
 */

/** 주요 버튼: 포인트 색, 8px 모서리, 높이 48px */
export const primaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-primary px-6 text-base font-medium text-on-primary transition-colors active:bg-primary-active disabled:cursor-not-allowed disabled:bg-primary-disabled";
/** 보조 버튼: 흰 바탕 + 잉크 테두리 */
export const secondaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-btn border border-ink bg-canvas px-6 text-base font-medium text-ink transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:border-border-strong disabled:text-muted-soft";
/** 텍스트 버튼: 바탕·테두리 없음, hover 시 밑줄 */
export const textBtn =
  "rounded-btn px-2 py-1 text-sm font-medium text-ink underline-offset-4 hover:underline";
/** 삭제 등 위험 동작용 텍스트 버튼 */
export const dangerTextBtn =
  "rounded-btn px-2 py-1 text-sm font-medium text-error underline-offset-4 hover:underline";
/** 입력: 1px 테두리, 포커스 시 잉크색 2px (glow·ring 없음) */
export const inputCls =
  "w-full rounded-btn border border-hairline bg-canvas px-3 py-3 text-base text-ink placeholder:text-muted-soft focus:border-ink focus:shadow-[inset_0_0_0_1px_var(--color-ink)] focus:outline-none disabled:bg-surface-soft disabled:text-muted-soft";
/** 입력 위 라벨 */
export const labelCls = "mb-1.5 block text-sm font-medium text-muted";
/** 흰 카드: 14px 모서리 + 1px 선 (그림자 없음) */
export const cardCls = "rounded-card border border-hairline bg-canvas";
/** 화면 제목 / 섹션 제목 */
export const pageTitleCls = "text-[28px] font-bold leading-tight text-ink";
export const sectionTitleCls = "text-xl font-semibold text-ink";
