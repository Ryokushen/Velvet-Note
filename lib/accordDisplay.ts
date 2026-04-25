export function formatAccordLabel(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(formatAccordWord)
    .join(' ');
}

export function formatAccordList(values: string[]): string {
  return values.map(formatAccordLabel).join(', ');
}

function formatAccordWord(word: string): string {
  return word
    .split('/')
    .map((part) =>
      part
        .split('-')
        .map(capitalize)
        .join('-'),
    )
    .join('/');
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
