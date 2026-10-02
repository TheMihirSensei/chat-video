import React from 'react';
import {Img} from 'remotion';
import {resolveAvatar} from '../assets';
import type {Theme} from '../theme';
import type {Person} from '../types';

const FALLBACK_COLORS = ['#ef6c00', '#00897b', '#5e35b1', '#d81b60', '#1e88e5', '#43a047'];

export type AvatarLook = {background?: string; border?: string | null; initialsColor?: string | null};

export const Avatar: React.FC<{person: Person; size: number; look?: AvatarLook}> = ({person, size, look = {}}) => {
  const src = resolveAvatar(person.avatar);
  const common: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    boxSizing: 'border-box',
    border: look.border ?? undefined,
  };
  if (src) return <Img src={src} style={{...common, objectFit: 'cover', background: look.background}} />;
  const initials = person.name
    .split(/\s+/)
    .map((w) => Array.from(w)[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hash = Array.from(person.name).reduce((h, c) => h + c.codePointAt(0)!, 0);
  return (
    <div
      style={{
        ...common,
        background: look.initialsColor ? look.background : FALLBACK_COLORS[hash % FALLBACK_COLORS.length],
        color: look.initialsColor ?? 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 600,
      }}
    >
      {initials}
    </div>
  );
};

const Icon: React.FC<{d: string; size: number; color: string; fill?: boolean}> = ({d, size, color, fill}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d={d}
      fill={fill ? color : 'none'}
      stroke={fill ? 'none' : color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BACK = 'M15 4 L7 12 L15 20';
const VIDEO = 'M3 7 h11 a2 2 0 0 1 2 2 v6 a2 2 0 0 1 -2 2 h-11 a2 2 0 0 1 -2 -2 v-6 a2 2 0 0 1 2 -2 z M16 10.5 L22 7 V17 L16 13.5 Z';
const PHONE =
  'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z';

export const Header: React.FC<{theme: Theme; person: Person; typing: boolean; topInset: number}> = ({
  theme,
  person,
  typing,
  topInset,
}) => {
  const h = theme.header;
  const iconSize = h.nameSize * 1.1;
  const headerPerson = {...person, avatar: h.avatar ?? person.avatar};

  if (h.variant === 'logo') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: h.height + topInset,
          boxSizing: 'border-box',
          padding: `${topInset}px ${theme.layout.paddingX}px 0`,
          background: h.background,
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          zIndex: 10,
        }}
      >
        <Avatar person={headerPerson} size={h.avatarSize} look={theme.avatars} />
        <div style={{minWidth: 0}}>
          <div
            style={{
              fontFamily: h.titleFont ? `"${h.titleFont}", sans-serif` : undefined,
              fontSize: h.titleSize,
              fontWeight: h.titleWeight,
              color: h.titleColor,
              lineHeight: 1.1,
              letterSpacing: 1,
              WebkitTextStroke: h.titleStroke ? `${h.titleStrokeWidth}px ${h.titleStroke}` : undefined,
              // Draw the outline behind the fill so letters stay chunky.
              paintOrder: 'stroke fill',
              whiteSpace: 'nowrap',
            }}
          >
            {h.title ?? person.name}
          </div>
          {h.showStatus && (
            <div
              style={{
                fontSize: h.statusSize,
                color: typing ? h.typingStatusColor : h.statusColor,
                marginTop: 6,
              }}
            >
              {typing ? h.typingText : h.onlineText}
            </div>
          )}
        </div>
      </div>
    );
  }

  const status = h.showStatus && (
    <div style={{fontSize: h.statusSize, color: typing ? h.typingStatusColor : h.statusColor, lineHeight: 1.2}}>
      {typing ? h.typingText : h.onlineText}
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: h.height + topInset,
        boxSizing: 'border-box',
        background: h.background,
        backdropFilter: h.blur ? `blur(${h.blur}px)` : undefined,
        borderBottom: h.borderBottom ?? undefined,
        color: h.textColor,
        display: 'flex',
        alignItems: 'center',
        padding: `${topInset}px 28px 0`,
        gap: 22,
        zIndex: 10,
      }}
    >
      {h.showBackArrow && <Icon d={BACK} size={iconSize} color={h.textColor} />}
      {h.centered ? (
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
          <Avatar person={headerPerson} size={h.avatarSize} />
          <div style={{fontSize: h.nameSize, fontWeight: 600, lineHeight: 1.1}}>{person.name}</div>
          {status}
        </div>
      ) : (
        <>
          <Avatar person={headerPerson} size={h.avatarSize} />
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontSize: h.nameSize, fontWeight: 600, lineHeight: 1.2}}>{person.name}</div>
            {status}
          </div>
        </>
      )}
      {h.showCallIcons ? (
        <div style={{display: 'flex', gap: 40, paddingRight: 12}}>
          <Icon d={VIDEO} size={iconSize} color={h.textColor} />
          <Icon d={PHONE} size={iconSize} color={h.textColor} fill />
        </div>
      ) : (
        h.centered && h.showBackArrow && <div style={{width: iconSize}} />
      )}
    </div>
  );
};
