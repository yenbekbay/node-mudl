/* @flow */

import _ from 'lodash/fp';
import request from 'request-promise';
import similarity from 'similarity';

import { calculateBitrate } from './helpers';
import parseQuery from './parseQuery';
import type { Match } from './getMatches';
import type { TrackQuery } from './parseQuery';

export type Result = TrackQuery & {
  duration: number,
  url: string,
  score: number,
  bitrate: number,
};

const getResultsFromVk = (
  { accessToken, userId }: { accessToken: string, userId: string },
  query: TrackQuery,
  match: ?Match,
): Promise<Array<Result>> => request
  .get({
    uri: 'https://api.vk.com/method/audio.search',
    qs: {
      access_token: accessToken,
      uids: userId,
      q: `${query.artist} - ${query.title}`,
    },
    json: true,
  })
  .then(_.flow(
    _.getOr([], 'response'),
    _.drop(1),
    _.map(
      _.flow(
        (result: Object) => ({
          ..._.pick(['duration', 'url'])(result),
          ...parseQuery(`${result.artist} - ${result.title}`),
        }),
        (result: Object) => ({
          ...result,
          score: _.mean([
            similarity(result.title, _.getOr(query.title, 'title', match)),
            similarity(result.artist, _.getOr(query.artist, 'artist', match)),
            match
              ? 1 - _.min([1, Math.abs(match.duration - result.duration) / 20])
              : 1,
          ]),
        }),
      ),
    ),
    _.sortBy('score'),
    _.reverse,
    _.slice(0, 10),
    _.map((result: Object): Promise<Result> => request
      .head({
        uri: result.url,
        resolveWithFullResponse: true,
      })
      .then(({ headers }: { headers: Object }): Result => ({
        ...result,
        bitrate: calculateBitrate(
          parseInt(headers['content-length'], 10),
          result.duration,
        ),
      })),
    ),
    (promises: Array<Promise<Result>>) => Promise.all(promises),
  ));

export default getResultsFromVk;
