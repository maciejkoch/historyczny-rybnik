import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validMentionDate, displayMentionDate, storeMentionDate } from './mention-date.ts';

test('mention dates preserve year, month and valid leap days', () => {
  for (const value of ['', '1939', '05-1939', '29-02-2000', '31-12-1939'])
    assert.equal(validMentionDate(value), true, value);
  for (const value of ['13-1939', '31-04-1939', '29-02-1900', '00-01-1939', '1-05-1939', '1939a'])
    assert.equal(validMentionDate(value), false, value);
  for (const stored of ['1939', '1939-05', '1939-05-12'])
    assert.equal(storeMentionDate(displayMentionDate(stored)), stored);
});
