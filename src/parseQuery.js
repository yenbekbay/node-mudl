/**
 * @flow
 */

import _ from 'lodash';
import he from 'he';

export const featuringArtistRegex = /\(?feat\. ([^()]*)\)?/;

export type TrackQuery = {
  primaryArtist: string,
  artist: string,
  title: string,
  version: ?string
};

export default (...args: Array<string>): ?TrackQuery => {
  const components = he
    .decode(args.join(' - '))
    .replace(/\//g, ' & ')
    .replace(/\s+[Ff]((eat|t)\.?|eaturing)\s+/g, ' feat. ')
    .replace(/\s+[Vv](s\.?|ersus)\s+/g, ' vs. ')
    .replace(/\s+[Dd]j\s+/g, ' DJ ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\(/g, ' (')
    .replace(/\s+(‒|–|—)\s+/g, ' - ')
    .split(' - ')
    .map(_.trim);

  if (components.length < 2) return null;

  const getComponent = (idx: number) => components[idx]
    .replace(featuringArtistRegex, '')
    .replace(/\s+/g, ' ')
    .trim();

  const featuringArtists = _.compact(components.map(
    (comp) => _.trim(_.nth(comp.match(featuringArtistRegex), 1))
  ));
  const primaryArtist = getComponent(0);
  const artist = primaryArtist + (
    featuringArtists && featuringArtists.length
      ? ` feat. ${featuringArtists.join(' & ')}`.replace(/[Aa]nd/g, '&')
      : ''
  );
  const title = getComponent(1);
  const version = _.nth(title.match(/((?:\([^\(]*\)\s?)+$)/), 1);

  return { primaryArtist, artist, title, version };
};
