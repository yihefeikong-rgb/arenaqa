import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders plain text', () => {
    render(<MarkdownRenderer content="Hello World" />);
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('renders bold text', () => {
    render(<MarkdownRenderer content="This is **bold** text" />);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('renders italic text', () => {
    render(<MarkdownRenderer content="This is *italic* text" />);
    expect(screen.getByText('italic').tagName).toBe('EM');
  });

  it('renders headings', () => {
    render(<MarkdownRenderer content={'# Heading 1\n\n## Heading 2'} />);
    expect(screen.getByText('Heading 1').tagName).toBe('H1');
    expect(screen.getByText('Heading 2').tagName).toBe('H2');
  });

  it('renders list items', () => {
    render(<MarkdownRenderer content={'- Item 1\n- Item 2'} />);
    expect(screen.getByText('Item 1')).toBeTruthy();
    expect(screen.getByText('Item 2')).toBeTruthy();
  });

  it('renders code blocks', () => {
    render(<MarkdownRenderer content="`inline code`" />);
    expect(screen.getByText('inline code').tagName).toBe('CODE');
  });

  it('shows streaming cursor when streaming is true', () => {
    const { container } = render(<MarkdownRenderer content="Hello" streaming />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('does not show streaming cursor when streaming is false', () => {
    const { container } = render(<MarkdownRenderer content="Hello" streaming={false} />);
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  it('renders empty content gracefully', () => {
    const { container } = render(<MarkdownRenderer content="" />);
    expect(container.textContent).toBe('');
  });

  it('renders multiple paragraphs', () => {
    render(<MarkdownRenderer content={'First paragraph.\n\nSecond paragraph.'} />);
    expect(screen.getByText('First paragraph.')).toBeTruthy();
    expect(screen.getByText('Second paragraph.')).toBeTruthy();
  });
});
