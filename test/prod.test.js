/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */

'use strict';

const assert = require('assert');

const {
  IT_DEFAULT_TIMEOUT,
  startBrowser,
  stopBrowser,
  openPage,
  closeAllPages,
  Nock,
} = require('./utils.js');
const { SidekickTest } = require('./SidekickTest.js');

describe('Test production plugin', () => {
  let browser;

  before(async function before() {
    this.timeout(10000);
    browser = await startBrowser();
  });
  after(async () => stopBrowser(browser));

  let page;
  let nock;

  beforeEach(async () => {
    page = await openPage(browser);
    nock = new Nock();
  });

  afterEach(async () => {
    await closeAllPages(browser);
    nock.done();
  });

  it('Production plugin switches to production from gdrive URL', async () => {
    nock('https://pages.adobe.com')
      .get('/creativecloud/en/test')
      .reply(200, 'some content...');
    const { popupOpened } = await new SidekickTest({
      page,
      setup: 'pages',
      url: 'https://docs.google.com/document/d/2E1PNphAhTZAZrDjevM0BX7CZr7KjomuBO6xE1TUo9NU/edit',
      plugin: 'prod',
      waitPopup: 2000,
    }).run();
    assert.strictEqual(
      popupOpened,
      'https://pages.adobe.com/creativecloud/en/test',
      'Production URL not opened',
    );
  }).timeout(IT_DEFAULT_TIMEOUT);

  it('Production plugin switches to production from onedrive URL', async () => {
    nock('https://blog.adobe.com')
      .get('/en/topics/bla')
      .reply(200, 'some content...');
    const { popupOpened } = await new SidekickTest({
      page,
      url: 'https://adobe.sharepoint.com/:w:/r/sites/TheBlog/_layouts/15/Doc.aspx?sourcedoc=%7BE8EC80CB-24C3-4B95-B082-C51FD8BC8760%7D&file=bla.docx&action=default&mobileredirect=true',
      plugin: 'prod',
      waitPopup: 2000,
    }).run();
    assert.strictEqual(
      popupOpened,
      'https://blog.adobe.com/en/topics/bla',
      'Production URL not opened',
    );
  }).timeout(IT_DEFAULT_TIMEOUT);

  it('Production plugin switches to production from preview URL', async () => {
    const { requestsMade } = await new SidekickTest({
      page,
      plugin: 'prod',
      waitNavigation: 'https://blog.adobe.com/en/topics/bla',
    }).run();
    assert.strictEqual(
      requestsMade.pop().url,
      'https://blog.adobe.com/en/topics/bla',
      'Production URL not opened',
    );
  }).timeout(IT_DEFAULT_TIMEOUT);

  it('Production plugin switches to production from live URL', async () => {
    const { requestsMade } = await new SidekickTest({
      page,
      url: 'https://main--blog--adobe.hlx.live/en/topics/bla?foo=bar',
      plugin: 'prod',
      waitNavigation: 'https://blog.adobe.com/en/topics/bla?foo=bar',
    }).run();
    assert.strictEqual(
      requestsMade.pop().url,
      'https://blog.adobe.com/en/topics/bla?foo=bar',
      'Production URL not opened',
    );
  }).timeout(IT_DEFAULT_TIMEOUT);

  it('Production plugin button disabled if page not published', async () => {
    const test = new SidekickTest({
      page,
    });
    test.apiResponses[0].live = {};
    const { plugins } = await test.run();
    assert.ok(plugins.find((p) => p.id === 'prod' && !p.buttonEnabled), 'Production plugin button not disabled');
  }).timeout(IT_DEFAULT_TIMEOUT);
});
