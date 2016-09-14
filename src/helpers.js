/**
 * @flow
 */

import _ from 'lodash/fp';

import type { Result } from './getResultsFromVk';

export const formatDuration = (duration: number): string => {
  const minutes = _.floor(duration / 60);
  const seconds = _.floor(duration % 60);

  return minutes === 0 ? `${seconds}s` : `${minutes}m${seconds}s`;
};
export const formatSize = (size: number): string =>
  `${_.round((size / 1024 / 1024) * 100) / 100}MB`;
export const metaForResult = (result: Result): string => _.join(', ')(
  [formatDuration(result.duration), `${result.bitrate}kbps`],
);
