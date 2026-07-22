'use strict';

import { describe, it, expect } from 'vitest';
import { minutesSinceScheduledToday, isWithinMissedDoseWindow, GRACE_MINUTES, MAX_ALERT_WINDOW_MINUTES } from './medication-schedule.js';

const at = (hh, mm) => {
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
};

describe('minutesSinceScheduledToday', () => {
    it('is 0 exactly at the scheduled time', () => {
        const now = at(8, 0);
        expect(minutesSinceScheduledToday('08:00', now)).toBe(0);
    });

    it('is positive when the scheduled time already passed', () => {
        const now = at(9, 0);
        expect(minutesSinceScheduledToday('08:00', now)).toBe(60);
    });

    it('is negative when the scheduled time has not happened yet', () => {
        const now = at(7, 0);
        expect(minutesSinceScheduledToday('08:00', now)).toBe(-60);
    });
});

describe('isWithinMissedDoseWindow', () => {
    it('is false before the grace period elapses', () => {
        expect(isWithinMissedDoseWindow(GRACE_MINUTES - 1)).toBe(false);
    });

    it('is true right after the grace period elapses', () => {
        expect(isWithinMissedDoseWindow(GRACE_MINUTES)).toBe(true);
        expect(isWithinMissedDoseWindow(GRACE_MINUTES + 30)).toBe(true);
    });

    it('is false once the dose is far too old to bother alerting', () => {
        expect(isWithinMissedDoseWindow(MAX_ALERT_WINDOW_MINUTES + 1)).toBe(false);
    });

    it('is false for a dose scheduled in the future', () => {
        expect(isWithinMissedDoseWindow(-10)).toBe(false);
    });
});
