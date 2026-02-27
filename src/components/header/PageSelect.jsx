import classNames from 'classnames';

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
      className={classNames('pr-6 truncate', className)}
      disabled={disabled}
    >
      {pages.map((item) => (
        <option key={item} value={item}>
          {item}
          {completedPages.has(item) ? ' ✅' : ''}
        </option>
      ))}
    </select>
  );
}
