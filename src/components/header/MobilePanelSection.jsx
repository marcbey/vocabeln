import classNames from 'classnames';

export default function MobilePanelSection({ label, className, children }) {
  return (
    <section className={classNames('grid gap-2', className)}>
      <p className="m-0 text-[12px] uppercase tracking-[0.08em] text-muted font-extrabold">
        {label}
      </p>
      {children}
    </section>
  );
}
