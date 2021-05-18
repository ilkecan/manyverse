/* Copyright (C) 2020-2021 The Manyverse Authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import xs, {Stream} from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import {Command} from 'cycle-native-navigation';
import {FeedId, MsgId} from 'ssb-typescript';
import {Screens} from '../enums';
import {navOptions as profileScreenNavOpts} from '../profile';
import {Props as ProfileProps} from '../profile/props';
import {
  navOptions as threadScreenNavOpts,
  Props as ThreadProps,
} from '../thread';
import {State} from './model';
const urlParse = require('url-parse');

interface Actions {
  goToProfile$: Stream<{authorFeedId: FeedId}>;
  goToThread$: Stream<{rootMsgId: MsgId}>;
  handleUriConsumeAlias$: Stream<string>;
}

export default function navigation(
  actions: Actions,
  state$: Stream<State>,
): Stream<Command> {
  const toProfile$ = xs
    .merge(
      actions.goToProfile$.map((ev) => ev.authorFeedId),
      actions.handleUriConsumeAlias$.map(
        (uri) => urlParse(uri, true).query!.userId,
      ),
    )
    .compose(sampleCombine(state$))
    .filter(([_feedId, state]) => !!state.selfFeedId)
    .map(
      ([feedId, state]) =>
        ({
          type: 'push',
          layout: {
            component: {
              name: Screens.Profile,
              passProps: {
                selfFeedId: state.selfFeedId,
                selfAvatarUrl: state.selfAvatarUrl,
                feedId,
              } as ProfileProps,
              options: profileScreenNavOpts,
            },
          },
        } as Command),
    );

  const toThread$ = actions.goToThread$
    .compose(sampleCombine(state$))
    .filter(([_ev, state]) => !!state.selfFeedId)
    .map(
      ([ev, state]) =>
        ({
          type: 'push',
          layout: {
            component: {
              name: Screens.Thread,
              passProps: {
                selfFeedId: state.selfFeedId,
                selfAvatarUrl: state.selfAvatarUrl,
                rootMsgId: ev.rootMsgId,
                lastSessionTimestamp: state.lastSessionTimestamp ?? Infinity,
              } as ThreadProps,
              options: threadScreenNavOpts,
            },
          },
        } as Command),
    );

  return xs.merge(toProfile$, toThread$);
}
