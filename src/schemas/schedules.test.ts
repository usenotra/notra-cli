import { describe, expect, test } from 'bun:test';
import { validateCreateScheduleRequest } from './schedules';

const base = {
  name: 'Custom cadence',
  sourceType: 'cron' as const,
  targets: { repositoryIds: ['repo_1'] },
  outputType: 'changelog',
  enabled: true,
};

describe('schedule request validation', () => {
  test('accepts the backend custom schedule shape', () => {
    const result = validateCreateScheduleRequest({
      ...base,
      sourceConfig: {
        cron: {
          frequency: 'custom',
          hour: 9,
          minute: 30,
          intervalDays: 14,
          anchorDate: '2026-09-17',
        },
      },
    });
    expect(result.sourceConfig.cron.intervalDays).toBe(14);
  });

  test('enforces the custom interval and calendar date bounds', () => {
    for (const cron of [
      { frequency: 'custom', hour: 9, minute: 30 },
      { frequency: 'custom', hour: 9, minute: 30, intervalDays: 1 },
      { frequency: 'custom', hour: 9, minute: 30, intervalDays: 91 },
      { frequency: 'custom', hour: 9, minute: 30, intervalDays: 14, anchorDate: '2026-02-30' },
    ]) {
      expect(() => validateCreateScheduleRequest({
        ...base,
        sourceConfig: { cron },
      })).toThrow();
    }
  });
});
