import classNames from 'classnames';

export default function ClassSelect({ value, options, onChange, className }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Klasse"
      className={classNames('pr-7', className)}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
