/**
 * @flow
 */

import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import chalk from 'chalk';
import Gauge from 'gauge';
import ID3Writer from 'browser-id3-writer';
import ipics from 'ipics';
import pathExists from 'path-exists';
import progress from 'request-progress';
import request from 'request-promise';

import { formatDuration, formatSize, metaForResult } from './helpers';
import type { Result } from './getResultsFromVk';

export default (
  result: Result,
  trackInfo: Object,
  dir: ?string
): Promise<any> => {
  const gauge = new Gauge();
  const fileName = `${trackInfo.artist} - ${trackInfo.title}.mp3`;
  const filePath = path.join(dir || '', fileName);

  if (pathExists.sync(filePath)) {
    return Promise.reject(new Error(`File named "${fileName}" already exists`));
  }

  const meta = metaForResult(result);
  console.log(chalk.green(`Downloading "${fileName}" (${meta})`));
  gauge.show();

  return new Promise((resolve: () => void, reject: (err: Error) => void) => {
    progress(request(result.url), { throttle: 50 })
      .on('progress', (
        { percentage, size, time }: {
          percentage: number,
          size: {
            total: number,
            transferred: number
          },
          time: { remaining: number }
        }
      ) => {
        gauge.show(
          `${formatSize(size.transferred)}/${formatSize(size.total)}`,
          percentage
        );
        gauge.pulse(`${formatDuration(time.remaining)} remaining`);
      })
      .on('error', reject)
      .on('end', resolve)
      .pipe(fs.createWriteStream(filePath));
  })
  .then(() => (
    trackInfo.coverUrl
      ? Promise.resolve(trackInfo.coverUrl)
      : ipics(`${trackInfo.artist} - ${trackInfo.title}`, 'album')
          .then((res) => _.get(_.head(res), 'imageUrl'))
  ))
  .then((coverUrl: ?string) => (
    coverUrl
      ? request(coverUrl, { encoding: null })
      : Promise.resolve()
  ))
  .then((coverBuffer: ?Buffer) => {
    const trackBuffer = fs.readFileSync(filePath);

    const writer = new ID3Writer(trackBuffer);
    writer.removeTag();
    writer
      .setFrame('TPE1', [trackInfo.artist]) // Set artist tag
      .setFrame('TIT2', trackInfo.title) // Set title tag
      // Set album title tag
      .setFrame('TALB', _.get(
        trackInfo,
        'album.title',
        /\((original|extended|radio).*\)/i.test(trackInfo.title)
          ? _.nth(trackInfo.title.match(/([^\(]*)/), 1) || ''
          : trackInfo.title
      ))
      // Set album artist tag
      .setFrame('TPE2', _.get(
        trackInfo,
        'album.artist',
        ''
      ))
      // Set track number tag
      .setFrame('TRCK', _.get(trackInfo, 'album.trackNumber', '1/1'))
      // Set year tag
      .setFrame('TYER', _
        .get(
          trackInfo,
          'album.releaseDate',
          new Date()
        )
        .getFullYear()
      );

    if (coverBuffer) {
      writer.setFrame('APIC', coverBuffer); // Set cover art tag
    }

    writer.addTag();

    const taggedTrackBuffer = new Buffer(writer.arrayBuffer);

    fs.writeFileSync(filePath, taggedTrackBuffer);

    gauge.hide();
    console.log(chalk.green('Downloaded the track successfully'));
  })
  .catch((err: Error): Promise<any> => {
    gauge.hide();

    return Promise.reject(err);
  });
};
