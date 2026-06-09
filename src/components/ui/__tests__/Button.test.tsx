import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} loading>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('.animate-spin')).toBeTruthy();
  });

  it('applies variant class', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button').className).toContain('color-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button').className).toContain('border');

    rerender(<Button variant="text">Text</Button>);
    expect(screen.getByRole('button').className).toContain('text-body');
  });

  it('applies size class', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button').className).toContain('h-8');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button').className).toContain('h-10');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('h-12');
  });

  it('renders icon with text', () => {
    render(<Button icon={<span data-testid="test-icon">🔍</span>}>Search</Button>);
    expect(screen.getByTestId('test-icon')).toBeTruthy();
    expect(screen.getByText('Search')).toBeTruthy();
  });

  it('renders icon-only button', () => {
    render(<Button variant="icon" icon={<span data-testid="icon-only">X</span>} />);
    expect(screen.getByTestId('icon-only')).toBeTruthy();
  });

  it('applies additional className', () => {
    render(<Button className="extra-class">Styled</Button>);
    expect(screen.getByRole('button').className).toContain('extra-class');
  });

  it('forwards additional HTML attributes', () => {
    render(<Button data-testid="custom-btn" type="submit">Submit</Button>);
    expect(screen.getByTestId('custom-btn').getAttribute('type')).toBe('submit');
  });
});
