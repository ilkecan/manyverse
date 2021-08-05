/* Copyright (C) 2021 The Manyverse Authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {h} from '@cycle/react';
import {Component} from 'react';
import {
  Platform,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {t} from '../../drivers/localization';
import {styles, iconProps} from './styles';

const Touchable = Platform.select<any>({
  android: TouchableNativeFeedback,
  default: TouchableOpacity,
});

const touchableProps: any = {};
if (Platform.OS === 'android') {
  touchableProps.background = TouchableNativeFeedback.SelectableBackground();
}

export default class PrivateTabIcon extends Component<{
  isSelected: boolean;
  numOfUpdates: number;
}> {
  public shouldComponentUpdate(nextProps: PrivateTabIcon['props']) {
    const prevProps = this.props;
    if (nextProps.isSelected !== prevProps.isSelected) return true;
    // numOfPrivateUpdates has one threshold: >=1
    const nextNum = nextProps.numOfUpdates;
    const prevNum = prevProps.numOfUpdates;
    if (prevNum === nextNum) return false;
    if (prevNum < 1 && nextNum >= 1) return true;
    if (prevNum >= 1 && nextNum < 1) return true;
    return false;
  }

  public render() {
    const {isSelected, numOfUpdates} = this.props;
    return h(
      Touchable,
      {
        ...touchableProps,
        sel: 'private-tab-button',
        style: styles.tabButton, // iOS needs this
        accessible: true,
        accessibilityRole: 'tab',
        accessibilityLabel: t('central.tabs.private.accessibility_label'),
      },
      [
        h(View, {style: styles.tabButton, pointerEvents: 'box-only'}, [
          h(View, [
            h(Icon, {
              name:
                numOfUpdates >= 1 ? 'message-text-outline' : 'message-outline',
              ...(isSelected ? iconProps.tabSelected : iconProps.tab),
            }),
          ]),

          h(
            Text,
            {
              style: isSelected
                ? styles.tabButtonTextSelected
                : styles.tabButtonText,
              numberOfLines: 1,
            },
            t('central.tab_footers.private'),
          ),
        ]),
      ],
    );
  }
}