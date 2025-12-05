import React, { useState } from 'react';
import classNames from 'classnames';

function PageSelect({ pages, page, completedPages, isIrregular, onChange, className }) {
  return (
    <select
      value={page}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Seite"
      className={classNames('pr-6 truncate', className)}
      disabled={isIrregular}
    >
      {pages.map((p) => (
        <option key={p} value={p}>
          {p}{completedPages.has(p) ? ' ✅' : ''}
        </option>
      ))}
    </select>
  );
}

function DirectionSelect({ direction, onChange, className }) {
  return (
    <select value={direction} onChange={(e) => onChange(e.target.value)} aria-label="Richtung" className={classNames('pr-7', className)}>
      <option value="en-de">Englisch → Deutsch</option>
      <option value="de-en">Deutsch → Englisch</option>
      <option value="mixed">Englisch ↔ Deutsch</option>
      <option value="irregular">Irreguläre Verben</option>
    </select>
  );
}

export default function Header({
  pages,
  page,
  direction,
  boardMode,
  completedPages,
  isIrregular,
  onPageChange,
  onDirectionChange,
  onToggleBoardMode,
  onReset,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePageChange = (value) => {
    onPageChange(value);
    setMobileMenuOpen(false);
  };

  const handleDirectionChange = (value) => {
    onDirectionChange(value);
    setMobileMenuOpen(false);
  };

  const handleToggleBoardMode = () => {
    onToggleBoardMode();
    setMobileMenuOpen(false);
  };

  const handleReset = () => {
    onReset();
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full max-w-[1100px] bg-panel/80 backdrop-blur-md border border-white/10 rounded-xl2 px-4 py-3 md:px-5 md:py-3.5 flex flex-col md:flex-row md:items-center md:gap-4 gap-3 shadow-deep">
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-xl tracking-tight flex items-center gap-2 font-extrabold">
          <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: 'linear-gradient(135deg, #3cdfff, #ff7ac3)', boxShadow: '0 0 14px rgba(255, 122, 195, 0.8)' }}></span>
          Orange Line 1 - Unit 1-6
        </h1>
        <button
          className="md:hidden secondary px-2 py-2 rounded-lg border flex flex-col items-end gap-1 min-w-[38px]"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Menü öffnen"
        >
          <span className="block w-5 h-0.5 bg-text rounded-sm" />
          <span className="block w-5 h-0.5 bg-text rounded-sm" />
          <span className="block w-4 h-0.5 bg-text rounded-sm" />
        </button>
      </div>

      <div className="hidden md:flex flex-1 items-center gap-3">
        <div className="flex gap-3 items-center justify-end md:ml-auto">
          <div className={classNames('flex items-center', { 'opacity-50 pointer-events-none': isIrregular })}>
            <PageSelect
              pages={pages}
              page={page}
              completedPages={completedPages}
              isIrregular={isIrregular}
              onChange={handlePageChange}
              className="w-[120px] sm:w-[140px]"
            />
          </div>
          <div className="flex items-center">
            <DirectionSelect direction={direction} onChange={handleDirectionChange} className="w-[190px] sm:w-[210px]" />
          </div>
        </div>
        <div className="hidden md:flex items-center px-3">
          <span className="w-px h-10 bg-white/20" aria-hidden />
        </div>
        <div className="flex items-center gap-3 justify-end">
          <button className={classNames('toggle px-4 py-2 rounded-xl border', { active: boardMode })} onClick={handleToggleBoardMode}>
            Tafel-Modus
          </button>
          <button className="secondary px-4 py-2 rounded-xl border" onClick={handleReset}>
            Neu anfangen
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden flex flex-col gap-3 bg-panel/90 border border-white/10 rounded-xl p-3 shadow-deep">
          <div className="flex gap-3 items-center justify-between">
            <div className={classNames('flex items-center flex-1 min-w-[150px] max-w-[200px]', { 'opacity-50 pointer-events-none': isIrregular })}>
              <PageSelect
                pages={pages}
                page={page}
                completedPages={completedPages}
                isIrregular={isIrregular}
                onChange={handlePageChange}
                className="pr-7 w-full md:mr-2"
              />
            </div>
            <div className="flex items-center flex-1">
              <DirectionSelect direction={direction} onChange={handleDirectionChange} className="pr-7 w-full md:mr-2" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button className={classNames('toggle px-4 py-2 rounded-xl border w-full', { active: boardMode })} onClick={handleToggleBoardMode}>
              Tafel-Modus
            </button>
            <button className="secondary px-4 py-2 rounded-xl border w-full" onClick={handleReset}>
              Neu anfangen
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
