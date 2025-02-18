/* This file is from react-native-flag-secure-android, copied here because for
 * some reason Metro bundler cannot find it in node_modules. License is ISC.
 *
 * Copyright (c) 2019, Andre 'Staltz' Medeiros
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

import {Component} from 'react';
import {NativeModules, Platform} from 'react-native';

export default class FlagSecure extends Component {
  public static isActive = false;

  public static activate() {
    if (!FlagSecure.isActive) {
      if (Platform.OS === 'android') NativeModules.FlagSecure.activate();
      FlagSecure.isActive = true;
    }
  }

  public static deactivate() {
    if (FlagSecure.isActive) {
      if (Platform.OS === 'android') NativeModules.FlagSecure.deactivate();
      FlagSecure.isActive = false;
    }
  }

  public componentDidMount() {
    FlagSecure.activate();
  }

  public componentWillUnmount() {
    FlagSecure.deactivate();
  }

  public render() {
    return this.props.children ?? null;
  }
}
