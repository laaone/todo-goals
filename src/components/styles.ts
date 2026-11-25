/*
 * 공통 스타일 (docs/Apple DESIGN.md). 색은 globals.css 토큰만 쓴다.
 * 이 파일은 "use client"가 아니어서 서버 컴포넌트에서도 import할 수 있다.
 */

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus";

/** 주요 행동: 파란 알약 */
export const primaryBtn = `press inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-[22px] text-[17px] text-on-primary disabled:cursor-not-allowed disabled:opacity-40 ${focus}`;
/** 작은 주요 행동 (상단 바 등) */
export const primarySmBtn = `press inline-flex h-8 items-center justify-center gap-1 rounded-full bg-primary px-4 text-sm text-on-primary ${focus}`;
/** 보조 행동: 파란 테두리 알약 */
export const secondaryBtn = `press inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary bg-transparent px-[22px] text-[17px] text-primary disabled:cursor-not-allowed disabled:opacity-40 ${focus}`;
/** 링크처럼 보이는 행동 */
export const linkBtn = `rounded-util text-[17px] text-primary hover:underline underline-offset-4 ${focus}`;
export const linkSmBtn = `rounded-util text-sm text-primary hover:underline underline-offset-4 ${focus}`;
/** 삭제 등 위험한 행동 */
export const dangerLinkBtn = `rounded-util text-sm text-danger hover:underline underline-offset-4 ${focus}`;
/** 입력칸: 11px 모서리, 옅은 테두리, 포커스 시 파란 링 */
export const inputCls = `w-full rounded-capsule border border-black/10 bg-canvas px-4 py-2.5 text-[17px] text-ink placeholder:text-muted-48 focus:border-primary-focus focus:outline-2 focus:outline-primary-focus/30 disabled:bg-parchment disabled:text-muted-48`;
/** 알약 모양 선택 상자 */
export const selectPillCls = `rounded-full border border-black/10 bg-canvas px-4 py-2 text-sm text-ink focus:border-primary-focus focus:outline-2 focus:outline-primary-focus/30`;
export const labelCls = "mb-1.5 block text-sm font-semibold text-ink-80";

/** 큰 제목 / 타일 제목 / 섹션 제목 / 한 줄 소개 */
export const heroTitleCls = "headline text-[34px] leading-[1.1] text-ink sm:text-[48px]";
export const tileTitleCls = "headline text-[28px] leading-[1.14] sm:text-[34px]";
export const sectionTitleCls = "headline text-[21px] leading-[1.19]";
export const taglineCls = "text-[19px] leading-[1.4] text-muted sm:text-[21px]";
