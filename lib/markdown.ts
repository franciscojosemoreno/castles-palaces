/** Converts the editorial markdown subset used across castle and tour copy — [text](url) links, **bold**, *italic*, and newlines — into HTML. */
export function renderEditorialHtml(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#1761a0] hover:underline">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<![\w*])\*([^*\s](?:[^*]*[^*\s])?)\*(?![\w*])/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
