import React, { useEffect, useState } from 'react';
import { useVuex } from 'components-react/hooks';
import cx from 'classnames';
import moment from 'moment';
import { $t } from 'services/i18n';
import { IRecentEvent } from 'services/recent-events';
import styles from './RecentEvents.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { Services } from 'components-react/service-provider';

export default function RecentEvents(p: { isOverlay?: boolean }) {
  const { RecentEventsService } = Services;

  const { recentEvents } = useVuex(() => ({
    recentEvents: RecentEventsService.state.recentEvents,
  }));

  return (
    <div className={styles.container}>
      {!p.isOverlay && <Toolbar />}
      <Scrollable className={cx(styles.eventContainer, p.isOverlay ? styles.overlay : '')}>
        {recentEvents.length !== 0 &&
          recentEvents.map(event => <EventCell key={event.uuid} event={event} />)}
        {recentEvents.length === 0 && (
          <div className={styles.empty}>{$t('There are no events to display')}</div>
        )}
      </Scrollable>
    </div>
  );
}

function Toolbar() {
  const { RecentEventsService, UserService, SpinWheelService } = Services;

  const { muted, queuePaused, mediaShareEnabled, safeModeEnabled, spinWheelExists } = useVuex(
    () => ({
      muted: RecentEventsService.state.muted,
      queuePaused: RecentEventsService.state.queuePaused,
      safeModeEnabled: RecentEventsService.state.safeMode.enabled,
      mediaShareEnabled: RecentEventsService.state.mediaShareEnabled,
      spinWheelExists: RecentEventsService.views.spinWheelExists,
    }),
  );

  const pauseTooltip = queuePaused ? $t('Unpause Alert Queue') : $t('Pause Alert Queue');
  return (
    <div className={styles.topBar}>
      <h2 className="studio-controls__label">{$t('Mini Feed')}</h2>
      {spinWheelExists && (
        <i
          className="fas fa-chart-pie action-icon"
          onClick={() => SpinWheelService.actions.spinWheel()}
          v-tooltip={{ content: $t('Spin Wheel'), placement: 'bottom' }}
        />
      )}
      {UserService.views.isTwitchAuthed && (
        <i
          className={cx('fa fa-shield-alt action-icon', {
            [styles.teal]: safeModeEnabled,
          })}
          onClick={() => RecentEventsService.actions.showSafeModeWindow()}
          v-tooltip={{ content: $t('Safe Mode'), placement: 'bottom' }}
        />
      )}
      <i
        className="icon-filter action-icon"
        onClick={() => RecentEventsService.actions.showFilterMenu()}
        v-tooltip={{ content: $t('Popout Event Filtering Options'), placement: 'bottom' }}
      />
      {mediaShareEnabled && (
        <i
          className="icon-music action-icon"
          onClick={() => RecentEventsService.actions.openRecentEventsWindow(true)}
          v-tooltip={{ content: $t('Popout Media Share Controls'), placement: 'bottom' }}
        />
      )}
      <i
        className={`${queuePaused ? 'icon-media-share-2' : 'icon-pause'} action-icon`}
        onClick={() => RecentEventsService.actions.toggleQueue()}
        v-tooltip={{ content: pauseTooltip, placement: 'left' }}
      />
      <i
        className="icon-skip action-icon"
        onClick={() => RecentEventsService.actions.skipAlert()}
        v-tooltip={{ content: $t('Skip Alert'), placement: 'left' }}
      />
      <i
        className={cx('action-icon', {
          [styles.red]: muted,
          fa: !muted,
          'fa-volume-up': !muted,
          'icon-mute': muted,
        })}
        onClick={() => RecentEventsService.actions.toggleMuteEvents()}
        v-tooltip={{ content: $t('Mute Event Sounds'), placement: 'left' }}
      />
    </div>
  );
}

function EventCell(p: { event: IRecentEvent }) {
  const { RecentEventsService } = Services;

  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    updateTimestamp();

    const timestampInterval = window.setInterval(() => {
      updateTimestamp();
    }, 60 * 1000);

    return () => {
      if (timestampInterval) clearInterval(timestampInterval);
    };
  }, []);

  function platformIcon() {
    const platform = p.event.platform;
    return {
      twitch_account: <PlatformLogo platform="twitch" />,
      youtube_account: <PlatformLogo platform="youtube" />,
      facebook_account: <PlatformLogo platform="facebook" />,
      trovo_account: <PlatformLogo platform="trovo" size={16} />,
      streamlabs: <PlatformLogo platform="streamlabs" size={16} />,
      streamlabscharity: <PlatformLogo platform="streamlabs" size={16} />,
    }[platform];
  }

  function updateTimestamp() {
    setTimestamp(moment.utc(createdAt()).fromNow(true));
  }

  function createdAt(): moment.Moment {
    if (p.event.iso8601Created) {
      return moment(p.event.iso8601Created);
    }

    return moment.utc(p.event.created_at);
  }

  function getName(event: IRecentEvent) {
    if (event.gifter) return event.gifter;
    if (event.from) return event.from;
    return event.name;
  }

  function classForType(event: IRecentEvent): string {
    if ((event.type === 'sticker' || event.type === 'effect') && event.currency) {
      return event.currency;
    }
    if (event.type === 'superchat' || event.formatted_amount || event.formattedAmount) {
      return 'donation';
    }
    return event.type;
  }

  function amountString(event: IRecentEvent) {
    if (event.formattedAmount) return event.formattedAmount;
    if (event.formatted_amount) return event.formatted_amount;
    if (event.type === 'superchat') return event.displayString;
    if (event.type === 'sticker' || event.type === 'effect') {
      return `${event.amount} ${event.currency}`;
    }
    return `${event.amount} ${event.type}`;
  }

  return (
    <div
      className={cx(styles.cell, p.event.read ? styles.cellRead : '')}
      onClick={() => RecentEventsService.actions.readAlert(p.event)}
    >
      <span className={styles.timestamp}>{timestamp}</span>
      {platformIcon()}
      <span className={styles.name}>{getName(p.event)}</span>
      <span className={styles.message}>{RecentEventsService.views.getEventString(p.event)}</span>
      {p.event.gifter && (
        <span className={cx(styles.name, styles.message)}>
          {p.event.from ? p.event.from : p.event.name}
        </span>
      )}
      {p.event.amount && (
        <span className={styles[classForType(p.event)]}>{amountString(p.event)}</span>
      )}
      {(p.event.comment || p.event.message) && (
        <span className={styles.whisper}>{p.event.comment ?? p.event.message}</span>
      )}
      <i
        className="icon-repeat action-icon"
        onClick={(event: any) => {
          event.stopPropagation();
          RecentEventsService.actions.repeatAlert(p.event);
        }}
        v-tooltip={{ content: $t('Repeat Alert'), placement: 'left' }}
      />
    </div>
  );
}
