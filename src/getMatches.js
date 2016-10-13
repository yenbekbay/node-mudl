/* @flow */

import _ from 'lodash/fp';
import similarity from 'similarity';
import requestPromise from 'request-promise';

import parseQuery, { featuringArtistRegex } from './parseQuery';
import pkg from '../package.json';
import type { TrackQuery } from './parseQuery';

export type Match = TrackQuery & {
  duration: number,
  coverUrl?: string,
  source: 'Soundcloud' | 'Musicbrainz',
  score: number,
  album: {
    id?: string,
    title?: string,
    artist?: string,
    releaseDate?: Date,
    trackNumber?: string,
  },
};

const request = requestPromise.defaults({
  headers: {
    'User-Agent': `${pkg.name}v${pkg.version}`,
  },
});

const getMatches = (query: TrackQuery): Promise<Array<Match>> => {
  const getMatchesFromSoundcloud = (): Promise<Array<Object>> => request
    .get({
      uri: 'http://api.soundcloud.com/tracks',
      qs: {
        client_id: '02gUJC0hH2ct1EGOcYXQIzRFU91c72Ea',
        q: `${query.artist} - ${query.title}`,
      },
      json: true,
    })
    .then(_.map(
      (result: Object): Object => ({
        artist: _.get('user.username', result),
        title: result.title,
        duration: _.divide(result.duration, 1000),
        coverUrl: _.replace('large', 't500x500', result.artwork_url),
        album: {
          releaseDate: new Date(result.created_at),
        },
        source: 'Soundcloud',
        ...parseQuery(result.title),
      }),
    ));

  const formatArtistFromMusibrainzResponse: ((res: Object) => string) = _.flow(
    _.get('artist-credit'),
    _.map(
      ({ joinphrase = '', artist }: {
        joinphrase: string,
        artist: Object,
      }) => `${artist.name}${joinphrase}`,
    ),
    _.join(''),
  );
  const getMatchesFromMusicbrainz = (): Promise<Array<Object>> => request
    .get({
      uri: 'http://musicbrainz.org/ws/2/recording',
      qs: {
        query: _.join(' AND ', [
          query.title,
          `artist:"${query.primaryArtist}"`,
          'status:"Official"',
        ]),
        limit: 10,
        fmt: 'json',
      },
      json: true,
    })
    .then(_.get('recordings'))
    .then(_.map(
      (result: Object): Object => ({
        ...parseQuery(
          `${formatArtistFromMusibrainzResponse(result)} - ${result.title}`,
        ),
        duration: _.divide(result.length, 1000),
        source: 'Musicbrainz',
        album: _.flow(
          _.map(
            (release: Object): Object => ({
              ..._.pick(['id', 'title'], release),
              artist: formatArtistFromMusibrainzResponse(release) ||
                formatArtistFromMusibrainzResponse(result)
                  .replace(featuringArtistRegex, '')
                  .trim(),
              releaseDate: new Date(release.date),
              trackNumber: _.thru(
                (media: Object) => _.join('/', [
                  (parseInt(media['track-offset'], 10) || 0) + 1,
                  media['track-count'] || 1,
                ]),
                _.getOr({}, 'media[0]', release),
              ),
            }),
          ),
          _.head,
        )(result.releases),
      }),
    ));

  return Promise
    .all([
      getMatchesFromSoundcloud(),
      getMatchesFromMusicbrainz(),
    ])
    .then(_.flow(
      _.flattenDeep,
      _.map((match: Object): Match => ({
        ...match,
        score: _.divide(
          similarity(match.title, query.title) +
          similarity(match.artist, query.artist),
          2,
        ),
      })),
      _.sortBy(['score', (match: Match): boolean => !!match.coverUrl]),
      _.reverse,
    ));
};

export default getMatches;
