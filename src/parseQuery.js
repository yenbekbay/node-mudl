/* @flow */

import _ from 'lodash/fp';
import he from 'he';

export type TrackQuery = {
  primaryArtist: string,
  artist: string,
  title: string,
  version: ?string,
};

const featuringArtistRegex = /\(?feat\. ([^()]*)\)?/;

const getComponents: ((input: string) => Array<string>) = _.flow(
  he.decode,
  _.replace(/\s+(‒|–|—)\s+/g, ' - '),
  _.split(/ - (.+)/),
  _.dropRight(1),
  _.thru((comps: Array<string>) => (
    !/[^\x00-\x7F]+/.test(_.join(' - ', comps))
      ? _.map(_.replace(/\b\w/g, _.toUpper), comps)
      : comps
  )),
  _.map(_.flow(
    _.trim,
    _.replace(/\//g, ' & '),
    _.replace(/(\s+|\()f((eat|t)\.?|eaturing)\s+/ig, '$1feat. '),
    _.replace(/\s+v(s\.?|ersus)\s+/ig, ' vs. '),
    _.replace(/\s+dj\s+/ig, ' DJ '),
    _.replace(/\[/g, '('),
    _.replace(/]/g, ')'),
    _.replace(/\(/g, ' ('),
  )),
);

const parseQuery = (query: string): ?TrackQuery => {
  const components = getComponents(query);

  if (components.length < 2) return null;

  const getComponent: ((idx: number) => string) = _.flow(
    _.nth(_, components),
    _.replace(featuringArtistRegex, ''),
    _.replace(/\s+/g, ' '),
    _.trim,
  );

  const featuringArtists: Array<string> = _.flow(
    _.map(_.flow(
      _.thru((comp: string) => comp.match(featuringArtistRegex)),
      _.nth(1),
      _.trim,
    )),
    _.compact,
  )(components);

  const primaryArtist = getComponent(0);
  const artist = _.flow(
    _.castArray,
    _.concat(_, featuringArtists.length > 0
      ? `feat. ${_.join(' & ', featuringArtists)}`.replace(/[Aa]nd/g, '&')
      : '',
    ),
    _.join(' '),
    _.trim,
  )(primaryArtist);
  const title = _.flow(
    _.replace(
      /\([^(]*(download|preview|out now|premiere|recordings)[^)]*\)/ig,
      '',
    ),
    _.trim,
  )(getComponent(1));
  const version = _.nth(1, title.match(/((?:\([^(]*\)\s?)+$)/));

  return { primaryArtist, artist, title, version };
};

export { featuringArtistRegex };
export default parseQuery;
