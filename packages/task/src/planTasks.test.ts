import type {FunctionTask, TaskContext} from './Task.js';
import {describe, expect, test} from 'vitest';
import {labelsOf, planTasks} from './planTasks.js';
import {parallel, serial} from './collections.js';

const ctx: TaskContext = {
  directory: process.cwd(),
  diff: new Map([
    ['greeting.txt', {type: 'create', content: new Uint8Array()}],
  ]),
};

function task(label: string, when?: FunctionTask['when']): FunctionTask {
  return {type: 'function', label, when, run: () => Promise.resolve()};
}

describe(planTasks, () => {
  test('removes function tasks whose when is false, and collections left empty', async () => {
    const plan = await planTasks(
      serial([
        task('always'),
        task('greeting changed', ({diff}) => diff.has('greeting.txt')),
        task('readme changed', ({diff}) => diff.has('README.md')),
        parallel([task('never', () => false)]),
      ]),
      ctx,
    );
    expect(plan).toMatchObject({
      type: 'serial',
      tasks: [{label: 'always'}, {label: 'greeting changed'}],
    });
    expect(plan?.type === 'serial' && plan.tasks).toHaveLength(2);
  });

  test('returns undefined when nothing would run', async () => {
    await expect(
      planTasks(serial([task('never', () => false)]), ctx),
    ).resolves.toBeUndefined();
  });

  test('removes the when of planned tasks, so running the plan runs what was planned', async () => {
    const plan = await planTasks(
      task('maybe', () => true),
      ctx,
    );
    expect(plan).not.toHaveProperty('when');
  });
});

describe(labelsOf, () => {
  test('lists the labels in the order the tasks would start', () => {
    expect(
      labelsOf(
        serial([task('a'), parallel([task('b'), task('c')]), task('d')]),
      ),
    ).toEqual(['a', 'b', 'c', 'd']);
  });
});
