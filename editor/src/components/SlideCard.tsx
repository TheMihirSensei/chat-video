import React from 'react';
import type {LessonLine, LessonSlide} from '../../../src/lesson/types';
import {blankLine, ROLE_NAMES, type Issue} from '../model';
import {LineEditor} from './LineEditor';

export const SlideCard: React.FC<{
  index: number;
  count: number;
  slide: LessonSlide;
  issues: Issue[];
  onChange: (slide: LessonSlide) => void;
  onMove: (delta: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPreview: () => void;
}> = ({index, count, slide, issues, onChange, onMove, onDuplicate, onDelete, onPreview}) => {
  const setLine = (i: number, line: LessonLine) =>
    onChange({...slide, lines: slide.lines.map((l, j) => (j === i ? line : l))});

  return (
    <section className={`slide ${issues.length ? 'slide--warn' : ''}`} id={`slide-${index}`}>
      <header className="slide__head">
        <h2>Slide {index + 1}</h2>
        {issues.length > 0 && <span className="badge badge--warn">{issues.length} to fix</span>}
        <div className="slide__actions">
          <button type="button" className="btn btn--small" onClick={onPreview} title="Jump the preview to this slide">
            ▶ Preview
          </button>
          <button type="button" className="btn btn--small btn--icon" onClick={() => onMove(-1)} disabled={index === 0} title="Move up">↑</button>
          <button type="button" className="btn btn--small btn--icon" onClick={() => onMove(1)} disabled={index === count - 1} title="Move down">↓</button>
          <button type="button" className="btn btn--small" onClick={onDuplicate}>Duplicate</button>
          <button
            type="button"
            className="btn btn--small btn--danger"
            onClick={() => window.confirm(`Delete slide ${index + 1}?`) && onDelete()}
            disabled={count === 1}
          >
            Delete
          </button>
        </div>
      </header>

      {slide.lines.map((line, i) => (
        <LineEditor
          key={i}
          role={ROLE_NAMES[i] ?? `Line ${i + 1}`}
          line={line}
          onChange={(l) => setLine(i, l)}
          onRemove={slide.lines.length > 1 && i > 0 ? () => onChange({...slide, lines: slide.lines.filter((_, j) => j !== i)}) : undefined}
        />
      ))}
      {slide.lines.length < 2 && (
        <button
          type="button"
          className="btn btn--dashed"
          onClick={() => onChange({...slide, lines: [...slide.lines, blankLine(slide.lines[0]?.side === 'left' ? 'right' : 'left')]})}
        >
          + Add answer
        </button>
      )}
    </section>
  );
};
