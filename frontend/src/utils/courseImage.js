function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const palettes = [
  { start: '#1e3a8a', end: '#2563eb' },
  { start: '#14532d', end: '#22c55e' },
  { start: '#7c2d12', end: '#f97316' },
  { start: '#581c87', end: '#a855f7' },
  { start: '#0f766e', end: '#14b8a6' },
];

export function getCourseImageDataUrl(title, courseId = 1) {
  const palette = palettes[(Number(courseId || 1) - 1) % palettes.length];
  const safeTitle = escapeXml(String(title || 'Khoa hoc').slice(0, 42));

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.start}"/>
      <stop offset="100%" stop-color="${palette.end}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="1080" cy="120" r="180" fill="rgba(255,255,255,0.15)"/>
  <circle cx="140" cy="560" r="220" fill="rgba(255,255,255,0.10)"/>
  <text x="70" y="95" fill="#ffffff" font-size="36" font-family="Segoe UI, Arial, sans-serif" font-weight="700">LMS COURSE</text>
  <foreignObject x="70" y="170" width="1040" height="360">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:#fff;font-family:Segoe UI, Arial, sans-serif;font-size:56px;font-weight:700;line-height:1.2;">
      ${safeTitle}
    </div>
  </foreignObject>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
