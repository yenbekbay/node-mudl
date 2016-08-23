/**
 * @flow
 */

import _ from 'lodash';

export const formatDuration = (duration: number): string => {
  const minutes = _.floor(duration / 60);
  const seconds = _.floor(duration % 60);

  return minutes === 0 ? `${seconds}s` : `${minutes}m${seconds}s`;
};

export const formatSize = (size: number) =>
  `${_.round(size / 1024 / 1024, 2)}MB`;
