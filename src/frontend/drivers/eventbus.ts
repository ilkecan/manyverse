/* Copyright (C) 2018-2021 The Manyverse Authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import xs, {Stream} from 'xstream';
import {FeedId, MsgId} from 'ssb-typescript';

export interface LocalizationLoaded {
  type: 'localizationLoaded';
}

export interface TriggerFeedCypherlink {
  type: 'triggerFeedCypherlink';
  feedId: FeedId;
}

export interface TriggerMsgCypherlink {
  type: 'triggerMsgCypherlink';
  msgId: MsgId;
}

export interface TriggerHashtagLink {
  type: 'triggerHashtagLink';
  hashtag: string;
}

export interface HardwareBackOnCentralScreen {
  type: 'hardwareBackOnCentralScreen';
}

export interface DrawerToggleOnCentralScreen {
  type: 'drawerToggleOnCentralScreen';
  open: boolean;
}

export interface AudioBlobComposed {
  type: 'audioBlobComposed';
  blobId: string;
}

export interface CentralChangeTab {
  subtype: 'changeTab';
  tab: 'public' | 'private' | 'activity' | 'connections';
}

export interface CentralScrollToTop {
  subtype: 'scrollToTop';
  tab: 'public' | 'private' | 'activity' | 'connections';
}

export interface CentralUpdatePublic {
  subtype: 'publicUpdates';
  counter: number;
}

export interface CentralUpdatePrivate {
  subtype: 'privateUpdates';
  counter: number;
}

export interface CentralUpdateActivity {
  subtype: 'activityUpdates';
  counter: number;
}

export interface CentralUpdateConnections {
  subtype: 'connections';
  substate: any;
}

export type CentralScreenUpdate = {
  type: 'centralScreenUpdate';
} & (
  | CentralChangeTab
  | CentralScrollToTop
  | CentralUpdatePublic
  | CentralUpdatePrivate
  | CentralUpdateActivity
  | CentralUpdateConnections
);

export type GlobalEvent =
  | LocalizationLoaded
  | TriggerFeedCypherlink
  | TriggerMsgCypherlink
  | TriggerHashtagLink
  | HardwareBackOnCentralScreen
  | DrawerToggleOnCentralScreen
  | AudioBlobComposed
  | CentralScreenUpdate;

export class EventBus {
  public _stream?: Stream<GlobalEvent>;

  public dispatch(event: GlobalEvent) {
    if (this._stream) {
      this._stream._n(event);
    } else {
      console.error(
        'Global event bus was not prepared but dispatch was called',
      );
    }
  }
}

export const GlobalEventBus = new EventBus();

export function makeEventBusDriver() {
  const response$ = xs.create<GlobalEvent>();
  GlobalEventBus._stream = response$;

  return function eventBusDriver(
    sink$: Stream<GlobalEvent>,
  ): Stream<GlobalEvent> {
    return xs.merge(response$, sink$);
  };
}
