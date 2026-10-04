import React, { forwardRef, useEffect, useRef } from 'react';
import { BellIcon } from './bell';
import { CalendarDaysIcon } from './calendar-days';
import { DeleteIcon } from './delete';
import { DownloadIcon } from './download';
import { ExternalLinkIcon } from './external-link';
import { LinkIcon } from './link';
import { LogoutIcon } from './logout';
import { MoonIcon } from './moon';
import { PlusIcon } from './plus';
import { SearchIcon } from './search';
import { SettingsIcon } from './settings';
import { SparklesIcon } from './sparkles';
import { SunIcon } from './sun';
import { UploadIcon } from './upload';
import { XIcon } from './x';

interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type AnimatedIconProps = { size?: number; className?: string; 'aria-hidden'?: boolean };

const INTERACTIVE_PARENT = 'button, a, [role="button"]';

/**
 * 아이콘 자체가 아니라 감싸고 있는 버튼/링크에 마우스를 올렸을 때 애니메이션이 재생되도록 연결한다.
 * 작은 아이콘(14px)은 아이콘 위에 직접 올리기 어렵기 때문이다.
 */
function withParentHover<H extends IconHandle>(
  Icon: React.ForwardRefExoticComponent<AnimatedIconProps & React.RefAttributes<H>>,
  displayName: string,
) {
  const Wrapped = ({ className, ...props }: AnimatedIconProps) => {
    const hostRef = useRef<HTMLSpanElement>(null);
    const iconRef = useRef<H>(null);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return undefined;
      const target = host.closest(INTERACTIVE_PARENT) ?? host;
      const start = () => iconRef.current?.startAnimation();
      const stop = () => iconRef.current?.stopAnimation();
      target.addEventListener('mouseenter', start);
      target.addEventListener('mouseleave', stop);
      target.addEventListener('focusin', start);
      target.addEventListener('focusout', stop);
      return () => {
        target.removeEventListener('mouseenter', start);
        target.removeEventListener('mouseleave', stop);
        target.removeEventListener('focusin', start);
        target.removeEventListener('focusout', stop);
      };
    }, []);

    return (
      <span ref={hostRef} className={`inline-flex shrink-0 ${className ?? ''}`}>
        <Icon ref={iconRef} {...props} />
      </span>
    );
  };
  Wrapped.displayName = displayName;
  return Wrapped;
}

export const AnimatedBell = withParentHover(BellIcon, 'AnimatedBell');
export const AnimatedCalendarDays = withParentHover(CalendarDaysIcon, 'AnimatedCalendarDays');
export const AnimatedTrash = withParentHover(DeleteIcon, 'AnimatedTrash');
export const AnimatedDownload = withParentHover(DownloadIcon, 'AnimatedDownload');
export const AnimatedExternalLink = withParentHover(ExternalLinkIcon, 'AnimatedExternalLink');
export const AnimatedLink = withParentHover(LinkIcon, 'AnimatedLink');
export const AnimatedLogOut = withParentHover(LogoutIcon, 'AnimatedLogOut');
export const AnimatedMoon = withParentHover(MoonIcon, 'AnimatedMoon');
export const AnimatedPlus = withParentHover(PlusIcon, 'AnimatedPlus');
export const AnimatedSearch = withParentHover(SearchIcon, 'AnimatedSearch');
export const AnimatedSettings = withParentHover(SettingsIcon, 'AnimatedSettings');
export const AnimatedSparkles = withParentHover(SparklesIcon, 'AnimatedSparkles');
export const AnimatedSun = withParentHover(SunIcon, 'AnimatedSun');
export const AnimatedUpload = withParentHover(UploadIcon, 'AnimatedUpload');
export const AnimatedX = withParentHover(XIcon, 'AnimatedX');
