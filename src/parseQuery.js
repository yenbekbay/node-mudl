/* @flow */

import _ from 'lodash/fp';
import he from 'he';

export const featuringArtistRegex = /\(?feat\. ([^()]*)\)?/;

export type TrackQuery = {
  primaryArtist: string,
  artist: string,
  title: string,
  version: ?string
};

export default (...args: Array<string>): ?TrackQuery => {
  let components = _.flow(
    _.replace(/\s+(‒|–|—)\s+/g, ' - '),
    _.split(' - '),
    _.map(_.trim),
  )(he.decode(args.join(' - ')));

  if (components.length < 2) return null;

  components = [components[0], _.drop(1)(components).join(' - ')];

  // Capitalize each word in title if query doesn't contain any foreign chars
  if (!/[^\x00-\x7F]+/.test(components.join(' - '))) {
    components = [
      components[0],
      components[1].replace(/\b\w/g, _.toUpper),
    ];
  }

  components = _.map((comp: string): string => comp
    .replace(/\//g, ' & ')
    .replace(/(\s+|\()f((eat|t)\.?|eaturing)\s+/ig, '$1feat. ')
    .replace(/\s+v(s\.?|ersus)\s+/ig, ' vs. ')
    .replace(/\s+dj\s+/ig, ' DJ ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\(/g, ' ('),
  )(components);

  const getComponent = (idx: number): string => components[idx]
    .replace(featuringArtistRegex, '')
    .replace(/\s+/g, ' ')
    .trim();

  const featuringArtists = _.flow(
    _.map((comp: string): string => _.flow(
      _.nth(1),
      _.trim,
    )(comp.match(featuringArtistRegex))),
    _.compact,
  )(components);
  const primaryArtist = getComponent(0);
  const artist = primaryArtist + (
    featuringArtists && featuringArtists.length
      ? ` feat. ${featuringArtists.join(' & ')}`.replace(/[Aa]nd/g, '&')
      : ''
  );
  const title = getComponent(1)
    .replace(
      /\([^\(]*(download|preview|out now|premiere|recordings)[^\)]*\)/ig,
      '',
    )
    .trim();
  const version = _.nth(1)(title.match(/((?:\([^\(]*\)\s?)+$)/));

  return { primaryArtist, artist, title, version };
};
