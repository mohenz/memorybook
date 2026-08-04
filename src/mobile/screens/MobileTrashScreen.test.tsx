import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MobileTrashScreen from './MobileTrashScreen';

describe('MobileTrashScreen', () => {
  it('shows deleted notes and schedules with restore actions', () => {
    const markup = renderToStaticMarkup(
      <MobileTrashScreen
        notes={[{
          id: 'note-1',
          title: '삭제된 메모',
          content: '본문',
          groupId: 'personal',
          createdAt: 'created',
          updatedAt: 'updated',
          dateString: '2026-08-03',
          isFavorite: false,
          isDeleted: true,
          images: [],
          checklist: [],
        }]}
        schedules={[{
          id: 'schedule-1',
          title: '삭제된 일정',
          dateString: '2026-08-04',
          allDay: true,
          priority: 'normal',
          isDeleted: true,
          createdAt: 'created',
          updatedAt: 'updated',
        }]}
        onRestoreNote={() => undefined}
        onPermanentlyDeleteNote={() => undefined}
        onRestoreSchedule={() => undefined}
        onPermanentlyDeleteSchedule={() => undefined}
      />,
    );

    expect(markup).toContain('삭제된 메모');
    expect(markup).toContain('삭제된 일정');
    expect(markup.match(/복원/g)).toHaveLength(2);
    expect(markup.match(/영구 삭제/g)).toHaveLength(2);
  });
});
