import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MemoryIcon from './MemoryIcon';

describe('MemoryIcon', () => {
  it('renders the supplied icon artwork with theme and accent hooks', () => {
    const markup = renderToStaticMarkup(<MemoryIcon name="calendar" className="h-6 w-6" label="캘린더" />);

    expect(markup).toContain('class="memory-icon inline-flex shrink-0 h-6 w-6"');
    expect(markup).toContain('stroke="currentColor"');
    expect(markup).toContain('class=\'a\'');
    expect(markup).toContain('aria-label="캘린더"');
  });
});
