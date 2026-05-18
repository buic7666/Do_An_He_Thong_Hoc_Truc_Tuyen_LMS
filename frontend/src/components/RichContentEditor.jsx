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
}).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

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

  const updateBlock = (index, field, nextValue) => {
    const next = blocks.map((block, blockIndex) => (
      blockIndex === index ? { ...block, [field]: nextValue } : block
    ));
    onChange(next);
  };

  const [uploading, setUploading] = useState({});
  const fileInputRefs = useRef({});

  const handleFileSelected = async (index, file, kind) => {
    if (!file) return;
    try {
      setUploading((s) => ({ ...s, [index]: true }));
      const data = await uploadTeacherFileApi(file, kind === 'image' ? 'image' : 'video');
      // expect returned { url }
      const url = data?.url || data?.path || data?.location || '';
      if (url) {
        updateBlock(index, 'url', url);
      }
    } catch (err) {
      // swallow: parent UI may show error elsewhere
      // eslint-disable-next-line no-console
      console.error('Upload failed', err);
    } finally {
      setUploading((s) => ({ ...s, [index]: false }));
    }
  };

  const addBlock = (type) => {
    const next = [...blocks];
    if (type === 'image') {
      next.push({ type: 'image', url: '', alt: '' });
    } else if (type === 'video') {
      next.push({ type: 'video', url: '', title: '' });
    } else {
      next.push({ type: 'text', text: '' });
    }
    onChange(next);
  };

  const removeBlock = (index) => {
    const next = blocks.filter((_, blockIndex) => blockIndex !== index);
    onChange(next.length ? next : createEmptyRichBlocks());
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
      {title ? <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{title}</label> : null}
      {helperText ? <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{helperText}</div> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {blocks.map((block, index) => (
          <div key={`rich-block-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: 'white' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <select
                className="form-input"
                style={{ maxWidth: 180 }}
                value={block.type}
                onChange={(event) => {
                  const nextType = event.target.value;
                  const next = blocks.map((b, i) => {
                    if (i !== index) return b;
                    if (nextType === 'image') {
                      return { type: 'image', url: String(b.url || ''), alt: String(b.alt || '') };
                    }
                    if (nextType === 'video') {
                      return { type: 'video', url: String(b.url || ''), title: String(b.title || '') };
                    }
                    return { type: 'text', text: String(b.text || '') };
                  });
                  onChange(next);
                }}
              >
                <option value="text">Văn bản</option>
                <option value="image">Ảnh</option>
                <option value="video">Video</option>
              </select>
              <button type="button" className="form-button secondary" onClick={() => removeBlock(index)}>
                Xóa khối
              </button>
            </div>

            {block.type === 'text' ? (
              <textarea
                className="form-textarea"
                placeholder="Nhập văn bản..."
                value={block.text}
                onChange={(event) => updateBlock(index, 'text', event.target.value)}
              />
            ) : null}

            {block.type === 'image' ? (
              <>
                <input
                  className="form-input"
                  placeholder="URL ảnh"
                  value={block.url}
                  onChange={(event) => updateBlock(index, 'url', event.target.value)}
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="form-button upload-button"
                    onClick={() => {
                      const input = fileInputRefs.current[`image-${index}`];
                      if (input) input.click();
                    }}
                    style={{
                      backgroundColor: '#059669',
                      color: 'white',
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 2px 6px rgba(5,150,105,0.2)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    📤 Tải ảnh
                  </button>
                  <input
                    ref={(el) => { fileInputRefs.current[`image-${index}`] = el; }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelected(index, e.target.files && e.target.files[0], 'image')}
                  />
                  {uploading[index] ? <span style={{ color: '#6b7280' }}>Đang tải...</span> : null}
                </div>
                <input
                  className="form-input"
                  style={{ marginTop: 10 }}
                  placeholder="Alt text"
                  value={block.alt}
                  onChange={(event) => updateBlock(index, 'alt', event.target.value)}
                />
              </>
            ) : null}

            {block.type === 'video' ? (
              <>
                <input
                  className="form-input"
                  placeholder="URL video"
                  value={block.url}
                  onChange={(event) => updateBlock(index, 'url', event.target.value)}
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="form-button upload-button"
                    onClick={() => {
                      const input = fileInputRefs.current[`video-${index}`];
                      if (input) input.click();
                    }}
                    style={{
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 2px 6px rgba(14,165,233,0.18)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    📤 Tải video
                  </button>
                  <input
                    ref={(el) => { fileInputRefs.current[`video-${index}`] = el; }}
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelected(index, e.target.files && e.target.files[0], 'video')}
                  />
                  {uploading[index] ? <span style={{ color: '#6b7280' }}>Đang tải...</span> : null}
                </div>
                <input
                  className="form-input"
                  style={{ marginTop: 10 }}
                  placeholder="Tiêu đề video"
                  value={block.title}
                  onChange={(event) => updateBlock(index, 'title', event.target.value)}
                />
              </>
            ) : null}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" className="form-button secondary" onClick={() => addBlock('text')}>+ Văn bản</button>
        <button type="button" className="form-button secondary" onClick={() => addBlock('image')}>+ Ảnh</button>
        <button type="button" className="form-button secondary" onClick={() => addBlock('video')}>+ Video</button>
      </div>
    </div>
  );
};

export default RichContentEditor;