#! /usr/bin/env node

/**
 * @flow
 */

import fs from 'fs';

import chalk from 'chalk';
import Configstore from 'configstore';
import ora from 'ora';
import pathExists from 'path-exists';
import updateNotifier from 'update-notifier';
import yargs from 'yargs';

import { formatDuration } from './helpers';
import authenticate from './authenticate';
import downloadTrack from './downloadTrack';
import getMatch from './getMatch';
import getResultFromVk from './getResultFromVk';
import parseQuery from './parseQuery';
import pkg from '../package';
import type { Match } from './getMatch';
import type { Result } from './getResultFromVk';

const config = new Configstore(pkg.name);

updateNotifier({ pkg }).notify();

const { argv } = yargs
  .usage('mudl <query> [options]')
  .option('d', {
    alias: 'dir',
    describe: 'Directory to save the downloaded mp3 file to',
    type: 'string',
    coerce: (dir) => dir.replace(/\\/gi, '')
  })
  .help('h', 'Display help message')
  .alias('h', 'help')
  .version('v', 'Display version information', pkg.version)
  .alias('v', 'version')
  .example(
    'mudl "Daft Punk - Get Lucky"',
    'Download the track "Get Lucky" by Daft Punk in the current directory'
  )
  .check(({ dir }) => {
    if (!dir || (pathExists.sync(dir) && fs.lstatSync(dir).isDirectory())) {
      return true;
    }

    throw new Error('Please enter a valid directory');
  })
  .demand(1, 'Please provide query in format "Artist - Title"');

const query = parseQuery(argv._[0]);

if (!query) {
  yargs.showHelp();
  console.log('Please provide query in format "Artist - Title"');
  process.exit(1);
} else {
  authenticate(config)
    .then(({ accessToken, userId }) => {
      const spinner = ora('Looking for a match...').start();

      return getMatch(query)
        .then((match: ?Match) => {
          spinner.stop();

          if (match) {
            const { source, artist, title, duration } = match;

            console.log(chalk.green(
              `Found a match from ${source}: ${artist} - ${title} ` +
              `(${formatDuration(duration)})`
            ));
          } else {
            console.log(chalk.yellow('No match found'));
          }

          spinner.text = 'Gettings results from VK...';
          spinner.start();

          return getResultFromVk({ accessToken, userId }, query, match)
            .then((result: ?Result) => {
              spinner.stop();

              const trackInfo = match || result;

              if (trackInfo && !trackInfo.version && query.version) {
                trackInfo.version = query.version;
                trackInfo.title = query.title;
              }

              return result
                ? downloadTrack(result, match || result, argv.dir)
                : Promise.reject(new Error(
                    `Could not find anything for "${argv._[0]}"`
                  ));
            });
        });
    })
    .catch((err: Error) => {
      console.error(chalk.red(err.message));
      process.exit(1);
    });
}
