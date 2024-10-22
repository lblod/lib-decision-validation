import {
    AGENDA_LINK,
    AGENDA_LINK_2,
    AGENDA_LINK_3,
    AGENDA_LINK_4,
    BESLUITEN_LINK,
    BESLUITEN_LINK2,
    BESLUITEN_LINK3,
    BESLUITEN_LINK4,
    NOTULEN_LINK,
    NOTULEN_LINK_2,
    NOTULEN_LINK_3,
    TESTHTMLSTRING,
    TESTSTRING2,
  } from './data/testData';

  import HttpRequestMock from 'http-request-mock';

//const PROXY = 'https://corsproxy.io/?';
const PROXY = '';

import * as fs from 'fs';

export function setupMocker() {
    const mocker = HttpRequestMock.setup();

    mocker.mock({
      url: `${PROXY}${AGENDA_LINK}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(AGENDA_LINK)}`),
    });

    mocker.mock({
      url: `${PROXY}${AGENDA_LINK_2}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(AGENDA_LINK_2)}`),
    });

    mocker.mock({
      url: `${PROXY}${AGENDA_LINK_4}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(AGENDA_LINK_4)}`),
    });

    mocker.mock({
      url: `${PROXY}${BESLUITEN_LINK}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(BESLUITEN_LINK)}`),
    });

    mocker.mock({
      url: `${PROXY}${BESLUITEN_LINK2}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(BESLUITEN_LINK2)}`),
    });

    mocker.mock({
      url: `${PROXY}${BESLUITEN_LINK3}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(BESLUITEN_LINK3)}`),
    });

    mocker.mock({
      url: `${PROXY}${BESLUITEN_LINK4}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(BESLUITEN_LINK4)}`),
    });

    mocker.mock({
      url: `${PROXY}${NOTULEN_LINK}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(NOTULEN_LINK)}`),
    });

    mocker.mock({
      url: `${PROXY}${NOTULEN_LINK_2}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(NOTULEN_LINK_2)}`),
    });

    mocker.mock({
      url: `${PROXY}${NOTULEN_LINK_3}`, // or RegExp: /.*\/some-api$/
      method: 'get', // get, post, put, patch or delete
      delay: 0,
      status: 200,
      headers: {
        // respone headers
        'content-type': 'text/html;charset=UTF-8',
      },
      body: fs.readFileSync(`tests/data/${encodeURIComponent(NOTULEN_LINK_3)}`),
    });
}