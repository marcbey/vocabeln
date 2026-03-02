import classNames from 'classnames';

function formatPageLabel(label) {
  const pageOnlyMatch = label.match(/page\s*\d+\b/i);
  if (pageOnlyMatch?.[0]) {
    return pageOnlyMatch[0].replace(/^page/i, 'Seite');
  }

  const withoutClassPrefix = label.replace(/^class\s*\d+\s*-\s*/i, '').trim();
  return withoutClassPrefix || label;
}

export default function PageSelect({
  pages,
  page,
  completedPages,
  disabled,
  onChange,
  className,
}) {
  return (
    <select
      value={page}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Seite"
      className={classNames('pr-8 truncate', className)}
      disabled={disabled}
    >
      {pages.map((item) => (
        <option key={item} value={item}>
          {formatPageLabel(item)}
          {completedPages.has(item) ? ' ✅' : ''}
        </option>
      ))}
    </select>
  );
}
