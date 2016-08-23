/**
 * @flow
 */

import Configstore from 'configstore';
import emailRegex from 'email-regex';
import inquirer from 'inquirer';

import vkAuth from './vkAuth';
import type { AuthResponse } from './vkAuth';

export default (config: Configstore): Promise<AuthResponse> => {
  const cachedAccessToken = config.get('accessToken');
  const cachedUserId = config.get('userId');

  if (cachedAccessToken && cachedUserId) {
    return Promise.resolve({
      accessToken: cachedAccessToken,
      userId: cachedUserId
    });
  }

  console.log(
    'We need to configure your VK account for access to music search'
  );

  return inquirer
    .prompt([
      {
        name: 'email',
        message: 'Please enter your VK email',
        validate: (email: string) =>
          emailRegex().test(email) || 'Please provide a valid email'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Please enter your VK password',
        validate: (password, { email }): Promise<bool | string> =>
          vkAuth(email, password)
            .then(({ accessToken, userId }: AuthResponse): Promise<bool> => {
              config.set('accessToken', accessToken);
              config.set('userId', userId);

              return Promise.resolve(true);
            })
            .catch(() => Promise.resolve('Please try again'))
      }
    ])
    .then(() => Promise.resolve({
      accessToken: config.get('accessToken'),
      userId: config.get('userId')
    }));
};
