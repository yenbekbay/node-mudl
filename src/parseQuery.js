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
  let components = he
    .decode(args.join(' - '))
    .replace(/\s+(‒|–|—)\s+/g, ' - ')
    .split(' - ')
    .map(_.trim);

  if (components.length < 2) return null;

  components = [components[0], _.drop(components).join(' - ')];

  // Capitalize each word in title if query doesn't contain any foreign chars
  if (!/[^\x00-\x7F]+/.test(components.join(' - '))) {
    components = [
      components[0],
      components[1].replace(/\b\w/g, (char) => char.toUpperCase())
    ];
  }

  components = components.map((comp) => comp
    .replace(/\//g, ' & ')
    .replace(/(\s+|\()f((eat|t)\.?|eaturing)\s+/ig, '$1feat. ')
    .replace(/\s+v(s\.?|ersus)\s+/ig, ' vs. ')
    .replace(/\s+dj\s+/ig, ' DJ ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\(/g, ' (')
  );

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
  const title = getComponent(1)
    .replace(
      /\([^\(]*(download|preview|out now|premiere|recordings)[^\)]*\)/ig,
      ''
    )
    .trim();
  const version = _.nth(title.match(/((?:\([^\(]*\)\s?)+$)/), 1);

  return { primaryArtist, artist, title, version };
};
