/**
 * @flow
 */

import _ from 'lodash';
import request from 'request-promise';
import similarity from 'similarity';

import parseQuery from './parseQuery';
import type { Match } from './getMatches';
import type { TrackQuery } from './parseQuery';

const calculateBitrate = (size: number, duration: number) => _
  .chain(size)
  .multiply(8)
  .divide(1024)
  .divide(duration)
  .divide(64)
  .round()
  .multiply(64)
  .thru((bitrate) => _.min([bitrate, 320]))
  .value();

export type Result = TrackQuery & {
  duration: number,
  url: string,
  score: number,
  bitrate: number
};

export default (
  { accessToken, userId }: { accessToken: string, userId: string },
  query: TrackQuery,
  match: ?Match
): Promise<Array<Result>> => request
  .get({
    uri: 'https://api.vk.com/method/audio.search',
    qs: {
      access_token: accessToken,
      uids: userId,
      q: `${query.artist} - ${query.title}`
    },
    json: true
  })
  .then((json) => Promise.all(_
    .chain(json)
    .get('response', [])
    .drop()
    .map((result) => ({
      ..._.pick(result, ['duration', 'url']),
      ...parseQuery(result.artist, result.title)
    }))
    .map((result) => ({
      ...result,
      score: _.mean([
        similarity(result.title, _.get(match, 'title', query.title)),
        similarity(result.artist, _.get(match, 'artist', query.artist)),
        match
          ? 1 - _.min([1, Math.abs(match.duration - result.duration) / 20])
          : 1
      ])
    }))
    .sortBy('score')
    .reverse()
    .slice(0, 10)
    .map((result) => request
      .head({
        uri: result.url,
        resolveWithFullResponse: true
      })
      .then(({ headers }) => Promise.resolve({
        ...result,
        bitrate: calculateBitrate(
          parseInt(headers['content-length'], 10),
          result.duration
        )
      }))
    )
    .value()
  ));
