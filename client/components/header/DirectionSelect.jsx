import classNames from 'classnames';

export default function DirectionSelect({ direction, onChange, className }) {
  return (
    <select
      value={direction}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Richtung"
      className={classNames('pr-8', className)}
    >
      <option value="en-de">Englisch → Deutsch</option>
      <option value="de-en">Deutsch → Englisch</option>
      <option value="mixed">Englisch ↔ Deutsch</option>
      <option value="irregular">Irreguläre Verben</option>
    </select>
  );
}
