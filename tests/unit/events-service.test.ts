import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "~/server/db/client";
import { isOpenNow } from "~/server/services/events";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("isOpenNow", () => {
  it("returns OPEN when current time falls within hours", () => {
    const now = new Date("2026-06-15T08:00:00Z"); // 11:00 Istanbul
    const status = isOpenNow({
      hours: [
        { season: "ALL_YEAR", dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false },
      ],
      now,
    });
    expect(status).toBe("OPEN");
  });

  it("returns CLOSED outside hours", () => {
    const now = new Date("2026-06-15T20:00:00Z"); // 23:00 Istanbul
    const status = isOpenNow({
      hours: [
        { season: "ALL_YEAR", dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false },
      ],
      now,
    });
    expect(status).toBe("CLOSED");
  });

  it("returns CLOSED when active closure", () => {
    const now = new Date("2026-06-15T10:00:00Z");
    const status = isOpenNow({
      hours: [
        { season: "ALL_YEAR", dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false },
      ],
      closures: [
        {
          startsAt: new Date("2026-06-10T00:00:00Z"),
          endsAt: new Date("2026-06-20T00:00:00Z"),
        },
      ],
      now,
    });
    expect(status).toBe("CLOSED");
  });

  it("returns UNKNOWN when no hours for the day", () => {
    const now = new Date("2026-06-15T10:00:00Z");
    const status = isOpenNow({ hours: [], now });
    expect(status).toBe("UNKNOWN");
  });

  it("respects season splitting", () => {
    const winterNow = new Date("2026-01-15T10:00:00Z");
    const status = isOpenNow({
      hours: [
        { season: "SUMMER", dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isClosed: false },
      ],
      now: winterNow,
    });
    expect(status).toBe("UNKNOWN");
  });
});
