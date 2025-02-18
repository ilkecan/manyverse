/* Copyright (C) 2018-2021 The Manyverse Authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import xs, {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {StateSource, Reducer} from '@cycle/state';
import {ReactElement} from 'react';
import isolate from '@cycle/isolate';
import {ReactSource} from '@cycle/react';
import {SharedContent} from 'cycle-native-share';
import {
  AsyncStorageSource,
  Command as StorageCommand,
} from 'cycle-native-asyncstorage';
import {Command, NavSource} from 'cycle-native-navigation';
import {Toast} from '../../drivers/toast';
import {State as AppState} from '../../drivers/appstate';
import {NetworkSource} from '../../drivers/network';
import {SSBSource, Req} from '../../drivers/ssb';
import {GlobalEvent} from '../../drivers/eventbus';
import {Command as AlertCommand, DialogSource} from '../../drivers/dialogs';
import {publicTab, Sinks as PublicTabSinks} from './public-tab/index';
import {privateTab, Sinks as PrivateTabSinks} from './private-tab/index';
import {activityTab, Sinks as ActivityTabSinks} from './activity-tab/index';
import {
  connectionsTab,
  Sinks as ConnectionsTabSinks,
} from './connections-tab/index';
import {topBar, Sinks as TBSinks} from './top-bar';
import intent from './intent';
import model, {
  State,
  publicTabLens,
  privateTabLens,
  activityTabLens,
  connectionsTabLens,
  topBarLens,
} from './model';
import view from './view';
import navigation from './navigation';

export type Sources = {
  screen: ReactSource;
  navigation: NavSource;
  globalEventBus: Stream<GlobalEvent>;
  asyncstorage: AsyncStorageSource;
  appstate: Stream<AppState>;
  network: NetworkSource;
  state: StateSource<State>;
  dialog: DialogSource;
  ssb: SSBSource;
};

export type Sinks = {
  screen: Stream<ReactElement<any>>;
  navigation: Stream<Command>;
  asyncstorage: Stream<StorageCommand>;
  dialog: Stream<AlertCommand>;
  state: Stream<Reducer<any>>;
  ssb: Stream<Req>;
  clipboard: Stream<string>;
  linking: Stream<string>;
  toast: Stream<Toast>;
  share: Stream<SharedContent>;
  globalEventBus: Stream<GlobalEvent>;
  exit: Stream<any>;
};

export const navOptions = {
  topBar: {
    visible: false,
    drawBehind: true,
    hideOnScroll: false,
    animate: false,
    borderHeight: 0,
    elevation: 0,
    height: 0,
  },
  sideMenu: {
    left: {
      enabled: true,
    },
  },
};

export function central(sources: Sources): Sinks {
  const topBarSinks: TBSinks = isolate(topBar, {
    '*': 'topBar',
    state: topBarLens,
  })(sources);

  const state$ = sources.state.stream;

  const actions = intent(sources.screen, sources.globalEventBus, state$);

  const fabPress$: Stream<string> = sources.screen
    .select('fab')
    .events('pressItem');

  const publicTabSinks = isolate(publicTab, {
    state: publicTabLens,
    '*': 'publicTab',
  })({
    ...sources,
    fab: fabPress$,
    scrollToTop: actions.scrollToPublicTop$,
  }) as PublicTabSinks;

  const privateTabSinks = isolate(privateTab, {
    state: privateTabLens,
    '*': 'privateTab',
  })({
    ...sources,
    fab: fabPress$,
    scrollToTop: actions.scrollToPrivateTop$,
  }) as PrivateTabSinks;

  const activityTabSinks = isolate(activityTab, {
    state: activityTabLens,
    '*': 'activityTab',
  })({
    ...sources,
    scrollToTop: actions.scrollToActivityTop$,
  }) as ActivityTabSinks;

  const connectionsTabSinks = isolate(connectionsTab, {
    state: connectionsTabLens,
    '*': 'connectionsTab',
  })({...sources, fab: fabPress$}) as ConnectionsTabSinks;

  const fabProps$ = state$
    .map((state) =>
      state.currentTab === 'public'
        ? publicTabSinks.fab
        : state.currentTab === 'private'
        ? privateTabSinks.fab
        : connectionsTabSinks.fab,
    )
    .flatten();

  const command$ = navigation(
    state$,
    {
      openDrawer$: topBarSinks.menuPress,
      closeDrawer$: actions.closeDrawer$,
      goToSearch$: topBarSinks.publicSearch,
    },
    xs.merge(
      publicTabSinks.navigation,
      privateTabSinks.navigation,
      activityTabSinks.navigation,
      connectionsTabSinks.navigation,
    ),
  );

  const centralReducer$ = model(actions, sources.ssb);

  const reducer$ = xs.merge(
    centralReducer$,
    publicTabSinks.state,
    privateTabSinks.state,
    activityTabSinks.state,
    connectionsTabSinks.state,
  ) as Stream<Reducer<State>>;

  const vdom$ = view(
    state$,
    fabProps$,
    topBarSinks.screen,
    publicTabSinks.screen,
    privateTabSinks.screen,
    activityTabSinks.screen,
    connectionsTabSinks.screen,
  );

  const toast$ = xs.merge(publicTabSinks.toast, connectionsTabSinks.toast);

  const ssb$ = xs.merge(publicTabSinks.ssb, connectionsTabSinks.ssb);

  const storageCommand$ = publicTabSinks.asyncstorage;

  const globalEvent$ = xs.merge(
    state$
      .map((state) => state.numOfPublicUpdates)
      .compose(dropRepeats())
      .map(
        (counter) =>
          ({
            type: 'centralScreenUpdate',
            subtype: 'publicUpdates',
            counter,
          } as GlobalEvent),
      ),

    state$
      .map((state) => state.numOfPrivateUpdates)
      .compose(dropRepeats())
      .map(
        (counter) =>
          ({
            type: 'centralScreenUpdate',
            subtype: 'privateUpdates',
            counter,
          } as GlobalEvent),
      ),

    state$
      .map((state) => state.numOfActivityUpdates)
      .compose(dropRepeats())
      .map(
        (counter) =>
          ({
            type: 'centralScreenUpdate',
            subtype: 'activityUpdates',
            counter,
          } as GlobalEvent),
      ),

    state$
      .map((state) => state.connectionsTab)
      .compose(dropRepeats())
      .map(
        (substate) =>
          ({
            type: 'centralScreenUpdate',
            subtype: 'connections',
            substate,
          } as GlobalEvent),
      ),
  );

  return {
    screen: vdom$,
    state: reducer$,
    navigation: command$,
    asyncstorage: storageCommand$,
    dialog: connectionsTabSinks.dialog,
    ssb: ssb$,
    linking: connectionsTabSinks.linking,
    clipboard: publicTabSinks.clipboard,
    toast: toast$,
    share: connectionsTabSinks.share,
    globalEventBus: globalEvent$,
    exit: actions.exitApp$,
  };
}
