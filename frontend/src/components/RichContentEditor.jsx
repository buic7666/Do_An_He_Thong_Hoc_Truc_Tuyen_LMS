import React, { useEffect, useState, useRef } from 'react';
import { uploadTeacherFileApi } from '../api/teacherApi';

export const createEmptyRichBlocks = () => ([
  { type: 'text', text: '' },
]);

export const richContentToPlainText = (blocks = []) => blocks.map((block) => {
  if (!block || typeof block !== 'object') {
    return '';
  }

  if (block.type === 'text') {
    const s = String(block.text || '').trim();
    // strip HTML tags
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = s;
      const text = String(tmp.textContent || tmp.innerText || '').trim();
      if (text) {
        return text;
      }

      const inlineMediaText = Array.from(tmp.querySelectorAll('img, video')).map((node) => {
        if (node.tagName === 'IMG') {
          return String(node.getAttribute('alt') || node.getAttribute('src') || '').trim();
        }
        if (node.tagName === 'VIDEO') {
          return String(node.getAttribute('title') || node.getAttribute('src') || '').trim();
        }
        return '';
      }).filter(Boolean).join(' ');
      return inlineMediaText.trim();
    } catch (_e) {
      return s;
    }
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
    const s = String(block.text || '').trim();
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = s;
      const text = String(tmp.textContent || tmp.innerText || '').trim();
      if (text) {
        return text;
      }

      const inlineMediaText = Array.from(tmp.querySelectorAll('img, video')).map((node) => {
        if (node.tagName === 'IMG') {
          return String(node.getAttribute('alt') || node.getAttribute('src') || '').trim();
        }
        if (node.tagName === 'VIDEO') {
          return String(node.getAttribute('title') || node.getAttribute('src') || '').trim();
        }
        return '';
      }).filter(Boolean).join(' ');
      return inlineMediaText.trim();
    } catch (_e) {
      return s;
    }
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
  const blocksRef = useRef(blocks);
  const [textValue, setTextValue] = useState(String(textBlock.text || ''));
  const [lastAction, setLastAction] = useState('');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const htmlTextareaRef = useRef(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    const incoming = String(textBlock.text || '');
    setTextValue((prev) => (prev === incoming ? prev : incoming));
  }, [textBlock.text]);

  useEffect(() => {
    const editor = textareaRef.current;
    if (!editor) return;

    const nextHtml = String(textValue || '');
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [textValue]);

  // Auto-test helper: when URL contains ?editorAutoTest=1, run a quick selection->Bold flow
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search || '');
      if (!params.get('editorAutoTest')) return;

      const run = async () => {
        await new Promise(r => setTimeout(r, 400));
        const ta = textareaRef.current;
        if (!ta) return;
        const sample = 'auto test SAMPLE_TEXT';
        ta.focus();
        // set value via updateTextBlock to keep parent in sync
        updateTextBlock(sample);
        await new Promise(r => setTimeout(r, 120));
        // select SAMPLE_TEXT in contenteditable
        try {
          const editor = textareaRef.current;
          const textNode = editor.firstChild && editor.firstChild.nodeType === Node.TEXT_NODE ? editor.firstChild : null;
          const start = sample.indexOf('SAMPLE_TEXT');
          const end = start + 'SAMPLE_TEXT'.length;
          if (textNode) {
            const range = document.createRange();
            range.setStart(textNode, start);
            range.setEnd(textNode, end);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            selectionRef.current = { range: range.cloneRange() };
          }
        } catch (e) { /* ignore */ }
        // apply bold
        wrapSelection('**');
        await new Promise(r => setTimeout(r, 200));
        const final = (textareaRef.current && textareaRef.current.value) || textValue;
        console.debug('[RichContentEditor][autoTest] result', final);
        try { alert('AutoTest result:\n' + final); } catch (_) { /* noop */ }
      };

      run();
    } catch (err) {
      // ignore
    }
  }, []);

  // Handle HTML mode toggle: populate editor after DOM render
  useEffect(() => {
    if (isHtmlMode) {
      // Just switched to HTML mode
      const textarea = htmlTextareaRef.current;
      if (textarea) {
        textarea.value = textValue;
        textarea.focus();
        textarea.select();
      }
    } else {
      // Just switched to visual mode
      const editor = textareaRef.current;
      if (editor && editor.isContentEditable) {
        editor.innerHTML = textValue;
        editor.focus();
        updateTextBlock(textValue);
      }
    }
  }, [isHtmlMode]);

  const updateTextBlock = (newText) => {
    setTextValue(newText);

    const source = Array.isArray(blocksRef.current) ? blocksRef.current : createEmptyRichBlocks();
    const next = [...source];
    const idx = next.findIndex((b) => b?.type === 'text');
    if (idx !== -1) {
      next[idx] = { ...next[idx], text: newText };
    } else {
      next.unshift({ type: 'text', text: newText });
    }

    blocksRef.current = next;
    onChange(next);
  };

  const getSelectionRange = () => {
    return selectionRef.current;
  };

  const getCurrentText = () => {
    const editor = textareaRef.current;
    if (editor && typeof editor.innerHTML === 'string') {
      return editor.innerHTML;
    }
    return String(textValue || '');
  };

  const saveSelectionRange = () => {
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0).cloneRange();
        selectionRef.current = { range };
        return;
      }
    } catch (_e) {
      // ignore
    }
    selectionRef.current = {};
  };

  const restoreSelection = () => {
    try {
      const editor = textareaRef.current;
      const sel = window.getSelection();
      if (!sel) return;
      sel.removeAllRanges();
      const saved = selectionRef.current && selectionRef.current.range;
      if (saved) {
        sel.addRange(saved);
      } else if (editor) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.addRange(range);
      }
    } catch (_e) {
      // ignore
    }
  };

  const runExecCommand = (command, value = null) => {
    const editor = textareaRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    try {
      document.execCommand(command, false, value);
    } catch (_e) {
      // ignore
    }
    updateTextBlock(editor.innerHTML);
  };

  const insertInlineHtml = (html) => {
    const editor = textareaRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();

    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(String(html));
        const lastNode = fragment.lastChild;
        range.insertNode(fragment);

        if (lastNode) {
          const nextRange = document.createRange();
          nextRange.setStartAfter(lastNode);
          nextRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(nextRange);
          selectionRef.current = { range: nextRange };
        }
      } else {
        editor.innerHTML = `${editor.innerHTML || ''}${html}`;
      }
    } catch (_e) {
      editor.innerHTML = `${editor.innerHTML || ''}${html}`;
    }

    updateTextBlock(editor.innerHTML);
  };

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // HTML → Visual: extract content từ textarea rồi setState
      const htmlEditor = htmlTextareaRef.current;
      const rawHtml = htmlEditor?.value || '';
      setTextValue(rawHtml);
      setIsHtmlMode(false);
    } else {
      // Visual → HTML: extract content từ contentEditable rồi setState
      const editor = textareaRef.current;
      const currentHtml = editor?.innerHTML || '';
      setTextValue(currentHtml);
      setIsHtmlMode(true);
    }
  };

  // Handle HTML mode toggle: populate editor after DOM render
  useEffect(() => {
    if (isHtmlMode) {
      // Just switched to HTML mode
      const textarea = htmlTextareaRef.current;
      if (textarea) {
        textarea.value = textValue;
        textarea.focus();
        textarea.select();
      }
    } else {
      // Just switched to visual mode
      const editor = textareaRef.current;
      if (editor && editor.isContentEditable) {
        editor.innerHTML = textValue;
        editor.focus();
      }
    }
  }, [isHtmlMode]);

  const getLineRange = (text, start, end) => {
    const from = Math.max(0, Math.min(start, text.length));
    const to = Math.max(0, Math.min(end, text.length));
    const lineStart = text.lastIndexOf('\n', Math.max(0, from - 1)) + 1;
    const lineEndBreak = text.indexOf('\n', Math.max(from, to));
    const lineEnd = lineEndBreak === -1 ? text.length : lineEndBreak;
    return { lineStart, lineEnd };
  };

  const replaceSelectedLines = (transformLines) => {
    const editor = textareaRef.current;
    // Prefer working with plain text when editor is present
    if (editor) {
      const full = editor.innerText || editor.textContent || '';
      const sel = getSelectionRange();
      let start = 0; let end = 0;
      if (sel && sel.range) {
        const selected = sel.range.toString() || '';
        const idx = full.indexOf(selected);
        if (idx !== -1) {
          start = idx;
          end = idx + selected.length;
        }
      } else {
        start = Number(sel.start) || 0;
        end = Number(sel.end) || 0;
      }
      const { lineStart, lineEnd } = getLineRange(full, start, end);
      const segment = full.slice(lineStart, lineEnd);
      const lines = segment.split('\n');
      const transformed = transformLines(lines);
      const nextText = `${full.slice(0, lineStart)}${transformed.join('\n')}${full.slice(lineEnd)}`;
      // set plain text (this will clear some HTML formatting)
      updateTextBlock(nextText);
      selectionRef.current = { start: lineStart, end: lineStart + transformed.join('\n').length };
      return;
    }

    // fallback when no editor DOM: operate on stored HTML/text
    const text = getCurrentText();
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
    const trimmed = String(prefix || '').trim();
    // If there is a text selection, convert only that selection into a list
    try {
      const sel = window.getSelection && window.getSelection();
      const hasSelection = sel && sel.rangeCount && sel.toString().trim().length > 0;
      if (hasSelection && (trimmed === '-' || trimmed === '*')) {
        // wrap the selected text into a single-item ul; if selection contains multiple lines,
        // split into multiple <li>
        replaceSelection((selText) => {
          const parts = String(selText || '').split(/\n+/).map(p => p.trim()).filter(Boolean);
          if (!parts.length) return '<ul><li></li></ul>';
          const lis = parts.map(p => `<li>${p}</li>`).join('');
          return `<ul>${lis}</ul>`;
        });
        return;
      }
      if (hasSelection && trimmed === '>' ) {
        replaceSelection((selText) => {
          const safe = String(selText || '');
          return `<blockquote>${safe}</blockquote>`;
        });
        return;
      }
    } catch (_e) {
      // ignore and fallback
    }

    if (trimmed === '-' || trimmed === '*') {
      runExecCommand('insertUnorderedList');
      return;
    }
    if (trimmed === '>') {
      runExecCommand('formatBlock', 'blockquote');
      return;
    }
    // fallback: simple prefix
    replaceSelectedLines((lines) => lines.map((line) => `${prefix}${line}`));
  };

  const replaceSelection = (transform, caretOffset = null) => {
    const editor = textareaRef.current;
    let range = null;
    try {
      range = (selectionRef.current && selectionRef.current.range) || (window.getSelection() && window.getSelection().rangeCount && window.getSelection().getRangeAt(0));
    } catch (_e) {
      range = null;
    }

    const transformed = transform(range ? (range.toString() || '') : '');
    setLastAction(`Applied: ${String(transformed).slice(0, 40)}`);

    if (range && editor) {
      try {
        // replace range contents with HTML
        range.deleteContents();
        const frag = range.createContextualFragment(String(transformed));
        range.insertNode(frag);
        // collapse selection after inserted content
        const sel = window.getSelection();
        sel.removeAllRanges();
        const newRange = document.createRange();
        // place caret after the inserted nodes
        newRange.selectNodeContents(editor);
        newRange.collapse(false);
        sel.addRange(newRange);
        // update stored range
        selectionRef.current = { range: newRange };
      } catch (_e) {
        // fallback: set innerHTML directly
        updateTextBlock(String(transformed));
      }
      updateTextBlock(editor.innerHTML);
      return;
    }

    // fallback to text replacement when no range available
    const text = getCurrentText();
    const { start = 0, end = 0 } = getSelectionRange() || {};
    const s = Math.max(0, Math.min(start, text.length));
    const e = Math.max(0, Math.min(end, text.length));
    const before = text.slice(0, s);
    const after = text.slice(e);
    const nextText = `${before}${transformed}${after}`;
    updateTextBlock(nextText);
    console.debug('[RichContentEditor] replaceSelection fallback', { start: s, end: e, transformed, caretOffset });
    selectionRef.current = { start: s, end: s + String(transformed).length };
  };

  const wrapSelection = (prefix, suffix = prefix) => {
    // For inline formatting (bold/italic/underline/strike/code/link) we
    // directly wrap the selected range via DOM insertion to avoid
    // execCommand issues that sometimes apply formatting to the whole block.
    const editor = textareaRef.current;
    if (editor) {
      // bold
      if (prefix === '**') {
        replaceSelection((sel) => (sel ? `<b>${sel}</b>` : '<b></b>'));
        return;
      }
      // italic
      if (prefix === '_') {
        replaceSelection((sel) => (sel ? `<i>${sel}</i>` : '<i></i>'));
        return;
      }
      // underline
      if (prefix === '__') {
        replaceSelection((sel) => (sel ? `<u>${sel}</u>` : '<u></u>'));
        return;
      }
      // strike
      if (prefix === '~~') {
        replaceSelection((sel) => (sel ? `<strike>${sel}</strike>` : '<strike></strike>'));
        return;
      }
      // inline code
      if (prefix === '`') {
        replaceSelection((sel) => {
          const text = String(sel || '');
          if (!text) return '<code></code>';
          if (text.includes('\n')) {
            return `<pre class="rich-code-block"><code>${escapeHtml(text)}</code></pre>`;
          }
          return `<code class="rich-inline-code">${escapeHtml(text)}</code>`;
        });
        return;
      }
      // link markdown pattern: wrapSelection('[', '](url)') -> prompt and insert <a>
      if (String(prefix) === '[' && String(suffix).startsWith('](')) {
        const url = window.prompt('Enter URL', 'https://');
        if (url) {
          replaceSelection((sel) => {
            const text = sel || url;
            return `<a href="${String(url).replace(/\"/g, '%22')}">${text}</a>`;
          });
        }
        return;
      }
    }

    // fallback to wrapping selection as HTML/markdown
    replaceSelection((sel) => {
      if (!sel) return `${prefix}${suffix}`;
      return `${prefix}${sel}${suffix}`;
    });
  };

  const transformHeading = (level) => {
    const editor = textareaRef.current;
    // If there's a selection, wrap only the selected text in an inline-styled span
    // so the heading appearance applies to that selection only. If no selection
    // or selection is collapsed, fall back to block-level heading via formatBlock.
    try {
      const sel = window.getSelection && window.getSelection();
      const hasSelection = sel && sel.rangeCount && sel.toString().trim().length > 0;
      if (editor && hasSelection) {
        replaceSelection((selText) => {
          const safe = String(selText || '').trim() || '';
          return `<span class=\"rich-heading h${level}\">${safe}</span>`;
        });
        return;
      }
    } catch (_e) {
      // ignore and fallback to block behavior
    }

    if (editor) {
      runExecCommand('formatBlock', `h${level}`);
      return;
    }

    replaceSelectedLines((lines) => lines.map((line) => {
      const cleaned = line.replace(/^#{1,6}\s*/, '');
      return `${'#'.repeat(level)} ${cleaned}`.trimEnd();
    }));
  };

  const transformNumberedList = () => {
    try {
      const sel = window.getSelection && window.getSelection();
      const hasSelection = sel && sel.rangeCount && sel.toString().trim().length > 0;
      if (hasSelection) {
        replaceSelection((selText) => {
          const parts = String(selText || '').split(/\n+/).map(p => p.trim()).filter(Boolean);
          if (!parts.length) return '<ol><li></li></ol>';
          const lis = parts.map(p => `<li>${p}</li>`).join('');
          return `<ol>${lis}</ol>`;
        });
        return;
      }
    } catch (_e) {
      // fallback
    }

    runExecCommand('insertOrderedList');
  };

  const transformNestedList = () => {
    try {
      const sel = window.getSelection && window.getSelection();
      const hasSelection = sel && sel.rangeCount && sel.toString().trim().length > 0;
      if (hasSelection) {
        replaceSelection((selText) => {
          const parts = String(selText || '').split(/\n+/).map(p => p.trim()).filter(Boolean);
          if (!parts.length) return '<ul style="margin-left: 20px; padding-left: 10px;"><li></li></ul>';
          const lis = parts.map(p => `<li>${p}</li>`).join('');
          return `<ul style="margin-left: 20px; padding-left: 10px;">${lis}</ul>`;
        });
        return;
      }
    } catch (_e) {
      // fallback
    }

    runExecCommand('insertUnorderedList');
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
    try {
      action();
      console.debug('[RichContentEditor] toolbar action', selectionRef.current);
      setLastAction('Toolbar action');
      setTimeout(() => setLastAction(''), 1800);
    } catch (err) {
      console.error('[RichContentEditor] toolbar action error', err);
      setLastAction('Error');
      setTimeout(() => setLastAction(''), 3000);
    }
    requestAnimationFrame(() => {
      const editor = textareaRef.current;
      if (editor) {
        editor.focus();
        restoreSelection();
      }
    });
  };

  const [uploading, setUploading] = useState({});
  const fileInputRefs = useRef({});
  const [mediaDialog, setMediaDialog] = useState({ open: false, kind: 'image', url: '' });

  const openMediaDialog = (kind) => {
    saveSelectionRange();
    setMediaDialog({ open: true, kind, url: '' });
  };

  const closeMediaDialog = () => {
    setMediaDialog((prev) => ({ ...prev, open: false, url: '' }));
  };

  const insertMediaByUrl = () => {
    const rawUrl = String(mediaDialog.url || '').trim();
    if (!rawUrl) return;

    if (mediaDialog.kind === 'image') {
      const safeUrl = rawUrl.replace(/"/g, '%22');
      insertInlineHtml(`<span data-image-wrap="1" style="position: relative; display: inline-block; vertical-align: middle; margin: 0 4px;"><img src="${safeUrl}" alt="" style="max-width: 100%; height: auto; display: inline-block; vertical-align: middle;" /><button type="button" data-remove-image="1" data-editor-remove-only="1" contenteditable="false" style="position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.9); background: rgba(17,24,39,0.82); color: #fff; font-size: 14px; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">×</button></span>`);
    } else {
      const safeUrl = rawUrl.replace(/"/g, '%22');
      insertInlineHtml(`<video controls src="${safeUrl}" style="max-width: 100%; display: inline-block; vertical-align: middle; margin: 0 4px;"></video>`);
    }
    closeMediaDialog();
  };

  const pickLocalMedia = () => {
    const input = fileInputRefs.current[mediaDialog.kind];
    closeMediaDialog();
    if (input) input.click();
  };

  const handleEditorClick = (event) => {
    const target = event.target;
    const removeButton = target && target.closest ? target.closest('[data-remove-image="1"]') : null;
    if (removeButton) {
      event.preventDefault();
      event.stopPropagation();
      const wrap = removeButton.closest('[data-image-wrap="1"]');
      if (wrap) {
        wrap.remove();
        const editor = textareaRef.current;
        if (editor) {
          updateTextBlock(editor.innerHTML);
        }
      }
      return;
    }
    saveSelectionRange();
  };

  const handleFileSelected = async (file, kind) => {
    if (!file) return;
    try {
      setUploading((s) => ({ ...s, [kind]: true }));
      const data = await uploadTeacherFileApi(file, kind === 'image' ? 'image' : 'video');
      const url = data?.url || data?.path || data?.location || '';
      if (url) {
        if (kind === 'image') {
          const safeUrl = String(url).replace(/\"/g, '%22');
          insertInlineHtml(`<span data-image-wrap="1" style="position: relative; display: inline-block; vertical-align: middle; margin: 0 4px;"><img src="${safeUrl}" alt="" style="max-width: 100%; height: auto; display: inline-block; vertical-align: middle;" /><button type="button" data-remove-image="1" data-editor-remove-only="1" contenteditable="false" style="position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.9); background: rgba(17,24,39,0.82); color: #fff; font-size: 14px; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">×</button></span>`);
        } else {
          insertInlineHtml(`<video controls src="${String(url).replace(/\"/g, '%22')}" style="max-width: 100%; display: inline-block; vertical-align: middle; margin: 0 4px;"></video>`);
        }
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading((s) => ({ ...s, [kind]: false }));
    }
  };

  return (
    <div className="rich-content-editor" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
      {title ? <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{title}</label> : null}
      {helperText ? <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{helperText}</div> : null}

      {/* Main text editor with toolbar */}
      <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: '#f1f3f5', borderBottom: '1px solid #dee2e6', flexWrap: 'wrap', alignItems: 'center', opacity: isHtmlMode ? 0.5 : 1 }}>
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
          <button type="button" title="Danh sách lồng" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', fontSize: 12 }} onMouseDown={withToolbarAction(() => transformNestedList())}>⊳</button>
          
          <div style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 4px' }} />

          {/* Code & Quote */}
          <button type="button" title="Chuyển đổi HTML source mode" style={{ padding: '4px 8px', border: isHtmlMode ? '2px solid #f97316' : '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: isHtmlMode ? '#fed7aa' : '#f0f0f0', fontFamily: 'monospace', fontSize: 11, fontWeight: isHtmlMode ? 700 : 400 }} onClick={() => toggleHtmlMode()}>{'<>'}HTML</button>
          <button type="button" title="Block quote" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'white', fontSize: 12 }} onMouseDown={withToolbarAction(() => prefixSelectedLines('> '))}>❝</button>
          
          <div style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 4px' }} />

          {/* Link & Media */}
          <button type="button" title="Chèn link" style={{ padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: 4, cursor: 'pointer', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 12 }} onMouseDown={withToolbarAction(() => wrapSelection('[', '](https://example.com)'))}>🔗 Link</button>
          <button
            type="button"
            title="Chèn ảnh"
            onMouseDown={saveSelectionRange}
            disabled={isHtmlMode}
            style={{ padding: '4px 8px', border: '1px solid #059669', borderRadius: 4, cursor: isHtmlMode ? 'not-allowed' : 'pointer', background: '#ecfdf5', color: '#047857', fontWeight: 600, fontSize: 12, opacity: isHtmlMode ? 0.5 : 1 }}
            onClick={() => openMediaDialog('image')}
          >
            📷 Ảnh
          </button>
          <input
            ref={(el) => { fileInputRefs.current['image'] = el; }}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              handleFileSelected(e.target.files && e.target.files[0], 'image');
              e.target.value = '';
            }}
          />
          <button
            type="button"
            title="Chèn video"
            onMouseDown={saveSelectionRange}
            disabled={isHtmlMode}
            style={{ padding: '4px 8px', border: '1px solid #0ea5e9', borderRadius: 4, cursor: isHtmlMode ? 'not-allowed' : 'pointer', background: '#f0f9ff', color: '#0369a1', fontWeight: 600, fontSize: 12, opacity: isHtmlMode ? 0.5 : 1 }}
            onClick={() => openMediaDialog('video')}
          >
            🎬 Video
          </button>
          <input
            ref={(el) => { fileInputRefs.current['video'] = el; }}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              handleFileSelected(e.target.files && e.target.files[0], 'video');
              e.target.value = '';
            }}
          />
          
          <div style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 4px' }} />

          {/* Clear formatting */}
          <button type="button" title="Xóa định dạng" style={{ padding: '4px 8px', border: '1px solid #dc2626', borderRadius: 4, cursor: 'pointer', background: '#fee2e2', color: '#b91c1c', fontWeight: 600, fontSize: 11 }} onMouseDown={withToolbarAction(() => transformClearFormatting())}>✕ Xóa</button>
          
          {uploading['image'] || uploading['video'] ? <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>⏳ Đang tải...</span> : null}
        </div>

        {/* Temporary visual debug indicator */}
        {lastAction ? (
          <div style={{ marginTop: 8, marginBottom: 6, color: '#065f46', fontSize: 13, fontWeight: 700 }}>
            {lastAction}
          </div>
        ) : null}

        {/* Text editor */}
        {isHtmlMode ? (
          <textarea
            ref={htmlTextareaRef}
            placeholder="Chỉnh sửa HTML source..."
            spellCheck="false"
            style={{
              border: '1px solid #f97316',
              borderRadius: 4,
              padding: 12,
              minHeight: 300,
              fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
              fontSize: 12,
              lineHeight: 1.6,
              width: '100%',
              boxSizing: 'border-box',
              display: 'block',
              background: '#fffbf0',
              outline: 'none',
              color: '#111827',
              tabSize: 2,
            }}
            defaultValue={textValue}
          />
        ) : (
          <div
            ref={textareaRef}
            contentEditable
            suppressContentEditableWarning
            placeholder="Nhập nội dung..."
            onInput={(e) => {
              const html = e.currentTarget.innerHTML;
              // update selection by reading window selection
              try { saveSelectionRange(); } catch (_e) { /* ignore */ }
              updateTextBlock(html);
            }}
            onFocus={saveSelectionRange}
            onBlur={saveSelectionRange}
            onMouseUp={saveSelectionRange}
            onKeyUp={saveSelectionRange}
            onClick={handleEditorClick}
            style={{ border: 'none', borderRadius: 0, padding: 12, minHeight: 100, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5, width: '100%', boxSizing: 'border-box', display: 'block', background: 'white', outline: 'none' }}
          />
        )}
      </div>

      {mediaDialog.open ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeMediaDialog}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 24, 39, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.18)',
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 10 }}>
              {mediaDialog.kind === 'image' ? 'Chèn ảnh' : 'Chèn video'}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={pickLocalMedia}
                style={{ padding: '8px 12px', border: '1px solid #0ea5e9', borderRadius: 6, background: '#f0f9ff', color: '#075985', fontWeight: 600, cursor: 'pointer' }}
              >
                Tải từ máy
              </button>
              <span style={{ alignSelf: 'center', color: '#6b7280', fontSize: 13 }}>hoặc dán link bên dưới</span>
            </div>

            <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>
              Link {mediaDialog.kind === 'image' ? 'ảnh' : 'video'}
            </label>
            <input
              type="url"
              placeholder={mediaDialog.kind === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
              value={mediaDialog.url}
              onChange={(e) => setMediaDialog((prev) => ({ ...prev, url: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  insertMediaByUrl();
                }
              }}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 6, padding: '9px 10px', fontSize: 14, marginBottom: 12 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={closeMediaDialog}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', color: '#374151', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={insertMediaByUrl}
                disabled={!String(mediaDialog.url || '').trim()}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #2563eb',
                  borderRadius: 6,
                  background: String(mediaDialog.url || '').trim() ? '#2563eb' : '#93c5fd',
                  color: '#fff',
                  cursor: String(mediaDialog.url || '').trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                }}
              >
                Chèn từ link
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Media is now inserted inline into the text block. */}
    </div>
  );
};

export default RichContentEditor;