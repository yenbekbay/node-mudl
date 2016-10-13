/* @flow */

import _ from 'lodash/fp';

import type { Result } from './getResultsFromVk';

const calculateBitrate = (size: number, duration: number): number => _.flow(
  _.multiply(8),
  _.divide(_, 1024),
  _.divide(_, duration),
  _.divide(_, 64),
  _.round,
  _.multiply(64),
  _.thru((bitrate: number): number => _.min([bitrate, 320])),
)(size);

const formatDuration = (duration: number) => {
  const minutes = _.floor(duration / 60);
  const seconds = _.floor(duration % 60);

  return minutes === 0 ? `${seconds}s` : `${minutes}m${seconds}s`;
};

const formatSize = (size: number) =>
  `${_.round((size / 1024 / 1024) * 100) / 100}MB`;

const metaForResult = (result: Result): string => _.join(', ', [
  formatDuration(result.duration),
  `${result.bitrate}kbps`,
]);

export { calculateBitrate, formatDuration, formatSize, metaForResult };
