/* @flow */

import parseQuery from '../parseQuery';

const featVariants = ['ft', 'ft.', 'feat', 'feat.', 'Feat', 'Feat.'];
const promoTexts = [
  'Download', 'Preview', 'OUT NOW', 'Premiere', 'Something Recordings',
];

const testQueries = [
  'Some Artist - Some Track',
  'Some Artist - Some Track (Some Remix)',
  ...featVariants.map(
    (feat: string) => `Some Artist ${feat} Another Artist - Some Track`,
  ),
  ...featVariants.map(
    (feat: string) => `Some Artist - Some Track (${feat} Another Artist)`,
  ),
  'some artist - some track (some remix)',
  'Какой-то артист - Какой-то трек (Какой-то ремикс)',
  ...promoTexts.map(
    (promo: string) => `Some Artist - Some Title (Some Remix) [${promo}]`,
  ),
];

describe('parseQuery', () => {
  it('processes a query', () => {
    testQueries.forEach((query: string) => {
      expect(parseQuery(query)).toMatchSnapshot();
    });
  });
});
