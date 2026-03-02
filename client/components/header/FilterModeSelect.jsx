import classNames from 'classnames';

export default function FilterModeSelect({
  value,
  onChange,
  disabled,
  className,
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Filter"
      className={classNames('pr-8', className)}
      disabled={disabled}
    >
      <option value="page">Seite</option>
      <option value="unit">Unit</option>
    </select>
  );
}
