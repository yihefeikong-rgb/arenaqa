import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByText('No items')).toBeTruthy();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="There is nothing here yet" />);
    expect(screen.getByText('There is nothing here yet')).toBeTruthy();
  });

  it('does not render description element when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="Empty" icon={<span data-testid="test-icon">📭</span>} />);
    expect(screen.getByTestId('test-icon')).toBeTruthy();
  });

  it('renders action when provided', () => {
    render(<EmptyState title="Empty" action={<button>Add</button>} />);
    expect(screen.getByText('Add')).toBeTruthy();
  });

  it('renders with all props', () => {
    render(
      <EmptyState
        title="No results"
        description="Try a different search"
        icon={<span>🔍</span>}
        action={<button>Retry</button>}
      />
    );
    expect(screen.getByText('No results')).toBeTruthy();
    expect(screen.getByText('Try a different search')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });
});
