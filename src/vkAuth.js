/**
 * @flow
 */

import _ from 'lodash';
import cheerio from 'cheerio';
import requestPromise from 'request-promise';

const vkClientId = 3607693;
const vkClientSecret = '3bpFB2SKpfQxShx6gI2r';
const vkRedirectUri = 'https://oauth.vk.com/blank.html';

export type AuthResponse = {
  accessToken: string,
  userId: string
};

const request = requestPromise.defaults({
  jar: true,
  resolveWithFullResponse: true
});

export default (email: string, pass: string): Promise<AuthResponse> => request
  .get({
    uri: 'https://oauth.vk.com/authorize',
    qs: {
      client_id: vkClientId,
      redirect_uri: vkRedirectUri,
      display: 'mobile',
      scope: 'offline,audio',
      response_type: 'code'
    }
  })
  .then(({ body }: { body: Object }): Promise<Object> => {
    const $ = cheerio.load(body);

    const form = $('form');
    const uri = form.attr('action');
    const params = form
      .serializeArray()
      .map((el) => ({ [el.name]: el.value }))
      .reduce((param, reducedParams) => ({ ...reducedParams, ...param }));

    if (!uri || !params) {
      return Promise.reject('VK authorization failed');
    }

    return request.post({
      uri,
      form: {
        ...params,
        ...{ email, pass }
      },
      followAllRedirects: true
    });
  })
  .then(({ request: { uri } }: { request: Object }): Promise<Object> => {
    const code = _.nth(_.get(uri, 'hash', '').match(/code=(.*)/), 1);

    if (!code) {
      return Promise.reject('VK authorization failed');
    }

    return request.get({
      uri: 'https://oauth.vk.com/access_token',
      qs: {
        client_id: vkClientId,
        client_secret: vkClientSecret,
        redirect_uri: vkRedirectUri,
        code
      },
      json: true
    });
  })
  .then(({ body }: { body: Object }): Promise<AuthResponse> => {
    if (!body || !body.access_token || !body.user_id) {
      return Promise.reject('VK authorization failed');
    }

    return Promise.resolve({
      accessToken: body.access_token,
      userId: body.user_id
    });
  });
