/* Copyright (C) 2018-2020 The Manyverse Authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const noauthTransformPlugin = require('multiserver/plugins/noauth');
const wsTransportPlugin = require('multiserver/plugins/ws');

export = function multiserverAddons(ssb: any, cfg: any) {
  ssb.multiserver.transform({
    name: 'noauth',
    create: () =>
      noauthTransformPlugin({
        keys: {publicKey: Buffer.from(cfg.keys.public, 'base64')},
      }),
  });

  ssb.multiserver.transport({
    name: 'ws',
    create: () => wsTransportPlugin({}),
  });

  if (process.env.MANYVERSE_PLATFORM === 'mobile') {
    try {
      const rnBridge = require('rn-bridge');
      const rnChannelPlugin = require('multiserver-rn-channel');
      ssb.multiserver.transport({
        name: 'channel',
        create: () => rnChannelPlugin(rnBridge.channel),
      });
    } catch (err) {}
  } else {
    try {
      const {ipcMain} = require('electron');
      const electronIpcPlugin = require('multiserver-electron-ipc');
      const webContentsPromise = (process as any).webContentsP;
      ssb.multiserver.transport({
        name: 'channel',
        create: () => electronIpcPlugin({ipcMain, webContentsPromise}),
      });
    } catch (err) {
      console.error(err);
    }
  }
};
