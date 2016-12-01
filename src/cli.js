#! /usr/bin/env node

/* @flow */

import fs from 'fs';

import _ from 'lodash/fp';
import chalk from 'chalk';
import Configstore from 'configstore';
import inquirer from 'inquirer';
import ora from 'ora';
import pathExists from 'path-exists';
import updateNotifier from 'update-notifier';
import yargs from 'yargs';

import { formatDuration, metaForResult } from './helpers';
import authenticate from './authenticate';
import downloadTrack from './downloadTrack';
import getMatches from './getMatches';
import getResultsFromVk from './getResultsFromVk';
import parseQuery from './parseQuery';
import pkg from '../package.json';
import type { Match } from './getMatches';
import type { Result } from './getResultsFromVk';

const config = new Configstore(pkg.name);

updateNotifier({ pkg }).notify();

const { argv } = yargs
  .usage('mudl <query> [options]')
  .option('d', {
    alias: 'dir',
    describe: 'Directory to save the downloaded mp3 file to',
    type: 'string',
    coerce: (dir: string): string => dir.replace(/\\/gi, ''),
  })
  .help('h', 'Display help message')
  .alias('h', 'help')
  .version('v', 'Display version information', pkg.version)
  .alias('v', 'version')
  .example(
    'mudl "Daft Punk - Get Lucky"',
    'Download the track "Get Lucky" by Daft Punk in the current directory',
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

      return getMatches(query)
        .then((matches: Array<Match>) => {
          spinner.stop();

          if (matches.length === 0) return Promise.resolve();

          const bestMatch = _.head(matches);

          if (bestMatch.score >= 0.9) {
            return Promise.resolve(bestMatch);
          }

          return inquirer
            .prompt([{
              name: 'match',
              message: 'Please select the best match',
              choices: [
                ..._.map(
                  (match: Match) => ({
                    name: `${match.artist} - ${match.title} ` +
                      `(${match.source}, ${formatDuration(match.duration)})`,
                    value: match,
                  }),
                  matches,
                ),
                { name: '→ Skip', value: null },
              ],
              type: 'list',
            }])
            .then(({ match }) => match);
        })
        .then((match: ?Match) => {
          if (match) {
            const { source, artist, title, duration } = match;

            console.log(chalk.green(
              `Found a match from ${source}: ${artist} - ${title} ` +
              `(${formatDuration(duration)})`,
            ));
          } else {
            console.log(chalk.yellow('No match found'));
          }

          spinner.text = 'Gettings results from VK...';
          spinner.start();

          return getResultsFromVk({ accessToken, userId }, query, match)
            .then((results: Array<Result>): Promise<?Result> => {
              spinner.stop();

              if (results.length === 0) return Promise.resolve();

              const bestResult = _.flow(
                _.sortBy(['bitrate', 'score']),
                _.reverse,
                _.head,
              )(results);

              if (bestResult.bitrate === 320) {
                return Promise.resolve(bestResult);
              }

              return inquirer
                .prompt([{
                  name: 'result',
                  message: 'Please select the best result',
                  choices: _.map(
                    (result: Result) => ({
                      name: `${result.artist} - ${result.title} ` +
                        `(${metaForResult(result)})`,
                      value: result,
                    }),
                    results,
                  ),
                  type: 'list',
                }])
                .then(({ result }) => Promise.resolve(result));
            })
            .then((result: ?Result): Promise<void> => {
              if (!result) {
                return Promise.reject(new Error(
                  `Could not find anything for "${argv._[0]}"`,
                ));
              }

              const trackInfo: Object = _.thru(
                (info: Object) => (
                  !info.version && query.version
                    ? { ...info, ..._.pick(['version', 'title'], query) }
                    : info
                ),
                match || result,
              );

              return downloadTrack(result, trackInfo, argv.dir);
            })
            .catch((err: Error) => {
              spinner.stop();

              return Promise.reject(err);
            });
        });
    })
    .catch((err: Error) => {
      const isFriendlyError = new RegExp(_.join('|', [
        'could not find anything',
        'already exists',
        'authorization failed',
      ]), 'i').test(err.message);

      if (isFriendlyError) {
        console.error(chalk.red(err.message));
      } else {
        console.error(err);
      }

      process.exit(1);
    });
}
