import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleClusterCandidates } from '../../src/app/atlas-map/cluster-visibility.ts';

const item = (key, tileZoom, members) => ({ key, tileZoom, members, value: key });

test('drops an old group when finer tiles contain both of its members', () => {
  const input = [item('group', 14, ['a', 'b']), item('a', 15, ['a']), item('b', 15, ['b'])];
  assert.deepEqual(
    visibleClusterCandidates(input).map((x) => x.key),
    ['a', 'b'],
  );
});

test('keeps a parent while finer tiles are incomplete', () => {
  const input = [item('group', 14, ['a', 'b']), item('a', 15, ['a'])];
  assert.ok(visibleClusterCandidates(input).some((x) => x.key === 'group'));
});

test('deduplicates buffered points and keeps unrelated or same zoom groups', () => {
  const input = [
    item('a', 14, ['a']),
    item('a', 15, ['a']),
    item('b', 15, ['b']),
    item('group', 15, ['a', 'b']),
    item('c', 14, ['c']),
  ];
  const result = visibleClusterCandidates(input);
  assert.deepEqual(
    result.map((x) => x.key),
    ['a', 'b', 'group', 'c'],
  );
  assert.equal(result[0].tileZoom, 15);
});

test('the independently selected marker is not duplicated by stale source data', () => {
  const input = [item('group', 14, ['a', 'b']), item('a', 15, ['a']), item('b', 15, ['b'])];
  assert.deepEqual(
    visibleClusterCandidates(input, 'a').map((x) => x.key),
    ['b'],
  );
});
