import React, { useState, useRef } from 'react';
import { uploadTeacherFileApi } from '../api/teacherApi';

export const createEmptyRichBlocks = () => ([
  { type: 'text', text: '' },
]);

export const richContentToPlainText = (blocks = []) => blocks.map((block) => {
  if (!block || typeof block !== 'object') {
    return '';
  }

  if (block.type === 'text') {
    return String(block.text || '').trim();
  }

  if (block.type === 'image') {
    return String(block.alt || block.url || '').trim();
  }

  if (block.type === 'video') {
    return String(block.title || block.url || '').trim();
  }

  return '';
}).filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim();

export const richContentTextOnlyToPlainText = (blocks = []) => blocks.map((block) => {
  if (!block || typeof block !== 'object') {
    return '';
  }

  if (block.type === 'text') {
    return String(block.text || '').trim();
  }

  return '';
}).filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim();

const normalizeBlocks = (blocks = []) => {
  if (!Array.isArray(blocks) || !blocks.length) {
    return createEmptyRichBlocks();
  }

  return blocks.map((block) => ({
    type: block?.type === 'image' || block?.type === 'video' ? block.type : 'text',
    text: block?.type === 'text' ? String(block?.text || '') : '',
    url: block?.type === 'image' || block?.type === 'video' ? String(block?.url || '') : '',
    alt: block?.type === 'image' ? String(block?.alt || '') : '',
    title: block?.type === 'video' ? String(block?.title || '') : '',
  }));
};

const RichContentEditor = ({
  value,
  onChange,
  title,
  helperText,
}) => {
  const blocks = normalizeBlocks(value);
  const textBlockIndex = blocks.findIndex(b => b.type === 'text');
  const textBlock = textBlockIndex !== -1 ? blocks[textBlockIndex] : { type: 'text', text: '' };
  const textareaRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  const updateTextBlock = (newText) => {
    const next = [...blocks];
    if (textBlockIndex !== -1) {
      next[textBlockIndex] = { ...next[textBlockIndex], text: newText };
    } else {
      next.unshift({ type: 'text', text: newText });
    }
    onChange(next);
  };

  const getSelectionRange = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      return {
        start: Number.isFinite(textarea.selectionStart) ? textarea.selectionStart : 0,
        end: Number.isFinite(textarea.selectionEnd) ? textarea.selectionEnd : 0,
      };
    }

    return selectionRef.current;
  };

  const saveSelectionRange = () => {
    const next = getSelectionRange();
    selectionRef.current = next;
  };

  const getLineRange = (text, start, end) => {
    const from = Math.max(0, Math.min(start, text.length));
    const to = Math.max(0, Math.min(end, text.length));
    const lineStart = text.lastIndexOf('\n', Math.max(0, from - 1)) + 1;
    const lineEndBreak = text.indexOf('\n', Math.max(from, to));
    const lineEnd = lineEndBreak === -1 ? text.length : lineEndBreak;
    return { lineStart, lineEnd };
  };

  const replaceSelectedLines = (transformLines) => {
    const text = String(textBlock.text || '');
    const { start, end } = getSelectionRange();
    const { lineStart, lineEnd } = getLineRange(text, start, end);
    const segment = text.slice(lineStart, lineEnd);
    const lines = segment.split('\n');
    const transformed = transformLines(lines);
    const nextText = `${text.slice(0, lineStart)}${transformed.join('\n')}${text.slice(lineEnd)}`;
    updateTextBlock(nextText);
    selectionRef.current = { start: lineStart, end: lineStart + transformed.join('\n').length };
  };

  const wrapSelectedLines = (prefix, suffix = prefix) => {
    replaceSelectedLines((lines) => lines.map((line) => `${prefix}${line}${suffix}`));
  };

  const prefixSelectedLines = (prefix) => {
    replaceSelectedLines((lines) => lines.map((line) => `${prefix}${line}`));
  };

  const replaceSelection = (transform, caretOffset = null) => {
    const text = String(textBlock.text || '');
    const { start, end } = getSelectionRange();
    const s = Math.max(0, Math.min(start, text.length));
    const e = Math.max(0, Math.min(end, text.length));
    const before = text.slice(0, s);
    const selected = text.slice(s, e);
    const after = text.slice(e);
    const transformed = transform(selected);
    const nextText = `${before}${transformed}${after}`;
    updateTextBlock(nextText);
    if (typeof caretOffset === 'number') {
      const pos = s + caretOffset;
      selectionRef.current = { start: pos, end: pos };
    } else {
      selectionRef.current = { start: s, end: s + String(transformed).length };
    }
  };

  const wrapSelection = (prefix, suffix = prefix) => {
    const text = String(textBlock.text || '');
    const { start, end } = getSelectionRange();
    const s = Math.max(0, Math.min(start, text.length));
    const e = Math.max(0, Math.min(end, text.length));
    const isEmpty = s === e;
    replaceSelection((sel) => {
      if (!sel) return `${prefix}${suffix}`;
      return `${prefix}${sel}${suffix}`;
    }, isEmpty ? prefix.length : null);
  };

  const transformHeading = (level) => {
    replaceSelectedLines((lines) => lines.map((line) => {
      const cleaned = line.replace(/^#{1,6}\s*/, '');
      return `${'#'.repeat(level)} ${cleaned}`.trimEnd();
    }));
  };

  const transformNumberedList = () => {
    replaceSelectedLines((lines) => lines.map((line, index) => {
      const cleaned = line.replace(/^\d+\.\s*/, '');
      return `${index + 1}. ${cleaned}`;
    }));
  };

  const transformClearFormatting = () => {
    replaceSelectedLines((lines) => lines.map((line) => {
      let nextLine = line;
      nextLine = nextLine.replace(/^#{1,6}\s*/, '');
      nextLine = nextLine.replace(/^>\s*/, '');
      nextLine = nextLine.replace(/^[-*+]\s*/, '');
      nextLine = nextLine.replace(/^\d+\.\s*/, '');
      nextLine = nextLine.replace(/^\s{2,}[-*+]\s*/, '');
      nextLine = nextLine.replace(/^\*\*(.*)\*\*$/, '$1');
      nextLine = nextLine.replace(/^__(.*)__$/, '$1');
      nextLine = nextLine.replace(/^_(.*)_$/, '$1');
      nextLine = nextLine.replace(/^~~(.*)~~$/, '$1');
      nextLine = nextLine.replace(/^`(.*)`$/, '$1');
      const linkMatch = nextLine.match(/^\[(.*)\]\((.*)\)$/);
      if (linkMatch) {
        nextLine = linkMatch[1];
      }
      return nextLine;
    }));
  };

  const withToolbarAction = (action) => (event) => {
    event.preventDefault();
    saveSelectionRange();
    action();
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        const { start, end } = selectionRef.current;
        try {
          textarea.setSelectionRange(start, end);
        } catch (_error) {
          // ignore selection restoration failures
        }
      }
    });
  };

  const [uploading, setUploading] = useState({});
  const fileInputRefs = useRef({});

  const handleFileSelected = async (file, kind) => {
    if (!file) return;
    try {
      setUploading((s) => ({ ...s, [kind]: true }));
      const data = await uploadTeacherFileApi(file, kind === 'image' ? 'image' : 'video');
      const url = data?.url || data?.path || data?.location || '';
      if (url) {
        const next = [...blocks];
        if (kind === 'image') {
          next.push({ type: 'image', url, alt: '' });
        } else {
          next.push({ type: 'video', url, title: '' });
        }
        onChange(next);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading((s) => ({ ...s, [kind]: false }));
    }
  };

  const removeBlock = (index) => {
    const next = blocks.filter((_, blockIndex) => blockIndex !== index);
    onChange(next.length ? next : createEmptyRichBlocks());
  };

  const updateMediaBlock = (index, field, value) => {
    const next = blocks.map((block, blockIndex) => {
      if (blockIndex !== index) return block;
      return { ...block, [field]: value };
    });
    onChange(next);
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
      {title ? <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{title}</label> : null}
      {helperText ? <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{helperText}</div> : null}

      {/* Main text editor with toolbar */}
      <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: '#f1f3f5', borderBottom: '1px solid #dee2e6', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Heading buttons */}
          <button type="button" title="Tiêu đề 1" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', fontWeight: 'bold' }} onMouseDown={withToolbarAction(() => transformHeading(1))}>H1</button>
          <button type="button" title="Tiêu đề 2" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', fontWeight: 'bold', fontSize: 14 }} onMouseDown={withToolbarAction(() => transformHeading(2))}>H2</button>
          <button type="button" title="Tiêu đề 3" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', fontWeight: 'bold', fontSize: 12 }} onMouseDown={withToolbarAction(() => transformHeading(3))}>H3</button>
          
          <div style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 4px' }} />

          {/* Text formatting */}
          <button type="button" title="Đậm" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', fontWeight: 'bold' }} onMouseDown={withToolbarAction(() => wrapSelection('**'))}>B</button>
          <button type="button" title="Nghiêng" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', fontStyle: 'italic' }} onMouseDown={withToolbarAction(() => wrapSelection('_'))}>I</button>
          <button type="button" title="Gạch chân" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', textDecoration: 'underline' }} onMouseDown={withToolbarAction(() => wrapSelection('__'))}>U</button>
          <button type="button" title="Gạch ngang" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', textDecoration: 'line-through', fontSize: 12 }} onMouseDown={withToolbarAction(() => wrapSelection('~~'))}>S</button>
          
          <div style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 4px' }} />

          {/* Lists */}
          <button type="button" title="Danh sách bullet" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white' }} onMouseDown={withToolbarAction(() => prefixSelectedLines('- '))}>•</button>
          <button type="button" title="Danh sách số" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white' }} onMouseDown={withToolbarAction(() => transformNumberedList())}>1.</button>
          <button type="button" title="Danh sách lồng" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', fontSize: 12 }} onMouseDown={withToolbarAction(() => prefixSelectedLines('   - '))}>⊳</button>
          
          <div style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 4px' }} />

          {/* Code & Quote */}
          <button type="button" title="Inline code" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#f0f0f0', fontFamily: 'monospace', fontSize: 11 }} onMouseDown={withToolbarAction(() => wrapSelection('`'))}>{'<>'}code</button>
          <button type="button" title="Block quote" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', fontSize: 12 }} onMouseDown={withToolbarAction(() => prefixSelectedLines('> '))}>❝</button>
          
          <div style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 4px' }} />

          {/* Link & Media */}
          <button type="button" title="Chèn link" style={{ padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: 4, cursor: 'pointer', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 12 }} onMouseDown={withToolbarAction(() => wrapSelection('[', '](https://example.com)'))}>🔗 Link</button>
          <button
            type="button"
            title="Chèn ảnh"
            style={{ padding: '4px 8px', border: '1px solid #059669', borderRadius: 4, cursor: 'pointer', background: '#ecfdf5', color: '#047857', fontWeight: 600, fontSize: 12 }}
            onClick={() => { const input = fileInputRefs.current['image']; if (input) input.click(); }}
          >
            📷 Ảnh
          </button>
          <input
            ref={(el) => { fileInputRefs.current['image'] = el; }}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelected(e.target.files && e.target.files[0], 'image')}
          />
          <button
            type="button"
            title="Chèn video"
            style={{ padding: '4px 8px', border: '1px solid #0ea5e9', borderRadius: 4, cursor: 'pointer', background: '#f0f9ff', color: '#0369a1', fontWeight: 600, fontSize: 12 }}
            onClick={() => { const input = fileInputRefs.current['video']; if (input) input.click(); }}
          >
            🎬 Video
          </button>
          <input
            ref={(el) => { fileInputRefs.current['video'] = el; }}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelected(e.target.files && e.target.files[0], 'video')}
          />
          
          <div style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 4px' }} />

          {/* Clear formatting */}
          <button type="button" title="Xóa định dạng" style={{ padding: '4px 8px', border: '1px solid #dc2626', borderRadius: 4, cursor: 'pointer', background: '#fee2e2', color: '#b91c1c', fontWeight: 600, fontSize: 11 }} onMouseDown={withToolbarAction(() => transformClearFormatting())}>✕ Xóa</button>
          
          {uploading['image'] || uploading['video'] ? <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>⏳ Đang tải...</span> : null}
        </div>

        {/* Text editor */}
        <textarea
          ref={textareaRef}
          placeholder="Nhập nội dung... (Hỗ trợ Markdown: # tiêu đề, **đậm**, _nghiêng_, - danh sách)"
          value={textBlock.text}
          onChange={(event) => updateTextBlock(event.target.value)}
          onSelect={saveSelectionRange}
          onMouseUp={saveSelectionRange}
          onKeyUp={saveSelectionRange}
          onClick={saveSelectionRange}
          style={{ border: 'none', borderRadius: 0, padding: 12, minHeight: 100, fontFamily: '"Monaco", "Menlo", monospace', fontSize: 14, lineHeight: 1.5, width: '100%', boxSizing: 'border-box', display: 'block' }}
        />
      </div>

      {/* Media blocks preview */}
      {blocks.filter(b => b.type !== 'text').length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>📎 Ảnh / Video đã thêm:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {blocks.map((block, index) => (
              block.type !== 'text' ? (
                <div key={`media-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: 'white' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                      <span style={{ fontSize: 18 }}>{block.type === 'image' ? '🖼️' : '🎥'}</span>
                      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{block.type === 'image' ? 'Ảnh' : 'Video'}</span>
                    </div>
                    <button type="button" className="form-button secondary" onClick={() => removeBlock(index)} style={{ padding: '4px 8px', fontSize: 12 }}>
                      Xóa
                    </button>
                  </div>

                  {block.type === 'image' ? (
                    <>
                      <input
                        className="form-input"
                        placeholder="URL ảnh"
                        value={block.url}
                        onChange={(e) => updateMediaBlock(index, 'url', e.target.value)}
                        style={{ marginBottom: 8, fontSize: 12 }}
                      />
                      <input
                        className="form-input"
                        placeholder="Alt text (mô tả cho ảnh)"
                        value={block.alt}
                        onChange={(e) => updateMediaBlock(index, 'alt', e.target.value)}
                        style={{ fontSize: 12 }}
                      />
                    </>
                  ) : (
                    <>
                      <input
                        className="form-input"
                        placeholder="URL video hoặc YouTube"
                        value={block.url}
                        onChange={(e) => updateMediaBlock(index, 'url', e.target.value)}
                        style={{ marginBottom: 8, fontSize: 12 }}
                      />
                      <input
                        className="form-input"
                        placeholder="Tiêu đề video"
                        value={block.title}
                        onChange={(e) => updateMediaBlock(index, 'title', e.target.value)}
                        style={{ fontSize: 12 }}
                      />
                    </>
                  )}
                </div>
              ) : null
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RichContentEditor;