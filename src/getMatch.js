/**
 * @flow
 */

import _ from 'lodash';
import similarity from 'similarity';
import requestPromise from 'request-promise';

import parseQuery, { featuringArtistRegex } from './parseQuery';
import pkg from '../package';
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
    trackNumber?: string
  }
};

const request = requestPromise.defaults({
  headers: {
    'User-Agent': `${pkg.name}v${pkg.version}`
  }
});

export default (query: TrackQuery): Promise<?Match> => {
  const getMatchesFromSoundcloud = () => request
    .get({
      uri: 'http://api.soundcloud.com/tracks',
      qs: {
        client_id: '2eaab453dce03a7bca4b475e4132a163',
        q: `${query.artist} - ${query.title}`
      },
      json: true
    })
    .then((json) => _.map(json, (result) => ({
      artist: _.get(result, 'user.username'),
      title: result.title,
      duration: _.divide(result.duration, 1000),
      coverUrl: _.replace(result.artwork_url, 'large', 't500x500'),
      album: {
        releaseDate: new Date(result.created_at)
      },
      source: 'Soundcloud',
      ...parseQuery(result.title)
    })));

  const formatArtistFromMusibrainzResponse = (res) => _
    .map(
      res['artist-credit'],
      ({ joinphrase = '', artist }) => `${artist.name}${joinphrase}`
    )
    .join('');
  const getMatchesFromMusicbrainz = () => request
    .get({
      uri: 'http://musicbrainz.org/ws/2/recording',
      qs: {
        query: [
          query.title,
          `artist:"${query.primaryArtist}"`,
          'status:"Official"'
        ].join(' AND '),
        limit: 10,
        fmt: 'json'
      },
      json: true
    })
    .then((json) => _.map(json.recordings, (result) => ({
      ...parseQuery(
        formatArtistFromMusibrainzResponse(result),
        result.title
      ),
      duration: _.divide(result.length, 1000),
      source: 'Musicbrainz',
      album: _
        .chain(result.releases)
        .map(
          (release) => ({
            ..._.pick(release, ['id', 'title']),
            artist: formatArtistFromMusibrainzResponse(release) ||
              formatArtistFromMusibrainzResponse(result)
                .replace(featuringArtistRegex, '')
                .trim(),
            releaseDate: new Date(release.date),
            trackNumber: _.thru(
              _.get(release, 'media[0]', {}),
              (media) => [
                (parseInt(media['track-offset'], 10) || 0) + 1,
                media['track-count'] || 1
              ].join('/')
            )
          })
        )
        .head()
        .value()
    })));

  return Promise
    .all([
      getMatchesFromSoundcloud(),
      getMatchesFromMusicbrainz()
    ])
    .then((matches) => Promise.resolve(_
      .chain(matches)
      .flattenDeep()
      .map((match) => ({
        ...match,
        score: (
          similarity(match.title, query.title) +
            similarity(match.artist, query.artist)
        ) / 2
      }))
      .sortBy('score', (match) => !!match.coverUrl)
      .reverse()
      .head()
      .value()
    ));
};
