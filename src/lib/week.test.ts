import { describe, expect, it } from "vitest";
import { addWeeks, dayIndexOf, formatWeekRange, getWeekStart, toISODate } from "./week";

describe("week", () => {
  it("월요일 시작 주를 로컬 시간으로 계산한다", () => {
    expect(getWeekStart(new Date(2026, 10, 25))).toBe("2026-11-23"); // 수
    expect(getWeekStart(new Date(2026, 10, 23))).toBe("2026-11-23"); // 월
  });

  it("일요일은 그 전 월요일 주에 속한다", () => {
    expect(getWeekStart(new Date(2026, 10, 29, 23, 59))).toBe("2026-11-23");
    expect(dayIndexOf(new Date(2026, 10, 29))).toBe(6);
  });

  it("자정 직후도 같은 날로 처리한다", () => {
    expect(toISODate(new Date(2026, 10, 30, 0, 0, 1))).toBe("2026-11-30");
    expect(getWeekStart(new Date(2026, 10, 30, 0, 0, 1))).toBe("2026-11-30");
  });

  it("월·연도 경계를 넘어 주를 이동한다", () => {
    expect(addWeeks("2026-12-28", 1)).toBe("2027-01-04");
    expect(addWeeks("2026-11-02", -1)).toBe("2026-10-26");
    expect(getWeekStart(new Date(2027, 0, 1))).toBe("2026-12-28");
  });

  it("주 범위를 표시한다", () => {
    expect(formatWeekRange("2026-11-23")).toBe("11/23 – 11/29");
  });
});
