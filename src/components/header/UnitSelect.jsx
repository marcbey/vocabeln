import classNames from 'classnames';

export default function UnitSelect({
  units,
  unit,
  completedUnits,
  disabled,
  onChange,
  className,
}) {
  return (
    <select
      value={unit}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Unit"
      className={classNames('pr-7 truncate', className)}
      disabled={disabled}
    >
      {units.map((item) => (
        <option key={item} value={item}>
          {item}
          {completedUnits.has(item) ? ' ✅' : ''}
        </option>
      ))}
    </select>
  );
}
