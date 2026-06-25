import React, { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
}

export const TagInput: React.FC<Props> = ({
  tags,
  onChange,
  max = 15,
  placeholder = 'Nhập tag rồi nhấn Enter...',
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const value = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!value || tags.includes(value) || tags.length >= max) return;
    onChange([...tags, value]);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex flex-wrap gap-1.5 min-h-[44px] px-3 py-2 rounded-xl border border-[#FFC9D2]/60 bg-white cursor-text focus-within:border-[#F65C88] focus-within:ring-2 focus-within:ring-[#FFC9D2]/40 transition-all"
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFC9D2]/40 text-[#040316]"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(tags.filter((t) => t !== tag)); }}
            className="hover:text-[#F65C88] transition-colors"
            aria-label={`Xoá tag ${tag}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}

      {tags.length < max && (
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-[#040316] placeholder-[#040316]/30"
        />
      )}
    </div>
  );
};
