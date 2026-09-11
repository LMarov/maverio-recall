import { beforeEach, describe, expect, it } from 'vitest';
import { getRecentErrors, recordError } from './errorLog';
import { resetDb } from './testDb';

beforeEach(async () => {
  await resetDb();
});

describe('errorLog', () => {
  it('persists and reads back an error, most recent first', async () => {
    await recordError({ message: 'first failure', statusCode: 500, method: 'GET', path: '/foo' });
    await recordError({ message: 'second failure', statusCode: 422, method: 'POST', path: '/bar', requestId: 'req-2' });

    const errors = await getRecentErrors();

    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatchObject({ message: 'second failure', statusCode: 422, path: '/bar', requestId: 'req-2' });
    expect(errors[1]).toMatchObject({ message: 'first failure', statusCode: 500, path: '/foo' });
  });

  it('respects the limit argument', async () => {
    for (let i = 0; i < 5; i++) {
      await recordError({ message: `failure ${i}` });
    }
    const errors = await getRecentErrors(2);
    expect(errors).toHaveLength(2);
  });

  it('never throws, even for a write it cannot make (bad foreign key)', async () => {
    await expect(recordError({ message: 'bad user ref', userId: 'not-a-real-uuid' })).resolves.toBeUndefined();
  });
});
