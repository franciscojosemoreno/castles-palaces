/** Converts the editorial markdown subset used across castle and tour copy — [text](url) links, **bold**, and newlines — into HTML. */
export function renderEditorialHtml(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#1761a0] hover:underline">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}
