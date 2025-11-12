import { marked } from 'marked';

const renderer = new marked.Renderer();
renderer.link = (href, title, text) => {
  const safeHref = href ?? '#';
  const t = title ? ` title="${title}"` : '';
  return `<a href="${safeHref}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

marked.setOptions({
  renderer,
  breaks: true,
});

export function renderMarkdown(markdownText = '') {
  if (typeof markdownText !== 'string' || !markdownText.trim()) {
    return '';
  }
  return marked.parse(markdownText);
}
