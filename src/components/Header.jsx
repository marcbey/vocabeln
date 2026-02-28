import { useState } from 'react';
import HeaderDesktopControls from './header/HeaderDesktopControls.jsx';
import HeaderMobilePanel from './header/HeaderMobilePanel.jsx';
import MobileMenuButton from './header/MobileMenuButton.jsx';

export default function Header({
  headline,
  activeClassId,
  classOptions,
  pages,
  page,
  direction,
  boardMode,
  completedPages,
  isIrregular,
  onClassChange,
  onPageChange,
  onDirectionChange,
  onToggleBoardMode,
  onReset,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handlePageChange = (nextPage) => {
    onPageChange(nextPage);
    closeMobileMenu();
  };

  const handleDirectionChange = (nextDirection) => {
    onDirectionChange(nextDirection);
    closeMobileMenu();
  };

  const handleToggleBoardMode = () => {
    onToggleBoardMode();
    closeMobileMenu();
  };

  const handleReset = () => {
    onReset();
    closeMobileMenu();
  };

  const handleClassChange = (nextClassId) => {
    onClassChange(nextClassId);
    closeMobileMenu();
  };

  return (
    <header className="w-full max-w-[1100px] rounded-xl2 border-2 border-[#3f567e] bg-white px-4 py-4 md:px-5 md:py-[18px] flex flex-col gap-3 shadow-deep">
      <div className="flex w-full items-start gap-3 md:items-center">
        <div className="min-w-0 shrink">
          <h1 className="m-0 text-lg md:text-2xl tracking-tight flex items-center gap-2 font-extrabold min-w-0">
            <span
              className="w-4 h-4 rounded-full inline-block shrink-0"
              style={{
                background: 'linear-gradient(135deg, #2179ff, #ff9f1c)',
                boxShadow: '0 0 0 4px rgba(33, 121, 255, 0.18)',
              }}
            />
            <span className="truncate">{headline}</span>
          </h1>
          <p className="mt-1 text-[13px] md:text-[14px] text-muted font-semibold">
            Jede Runde macht dich besser, hol dir den Highscore und rock die naechste Englischarbeit.
          </p>
        </div>

        <MobileMenuButton
          open={mobileMenuOpen}
          onToggle={() => setMobileMenuOpen((open) => !open)}
        />
      </div>

      <HeaderDesktopControls
        pages={pages}
        page={page}
        completedPages={completedPages}
        isIrregular={isIrregular}
        direction={direction}
        boardMode={boardMode}
        onPageChange={handlePageChange}
        onDirectionChange={handleDirectionChange}
        onToggleBoardMode={handleToggleBoardMode}
        onReset={handleReset}
      />

      {mobileMenuOpen && (
        <HeaderMobilePanel
          activeClassId={activeClassId}
          classOptions={classOptions}
          pages={pages}
          page={page}
          completedPages={completedPages}
          isIrregular={isIrregular}
          direction={direction}
          onClassChange={handleClassChange}
          onPageChange={handlePageChange}
          onDirectionChange={handleDirectionChange}
          onClose={closeMobileMenu}
        />
      )}
    </header>
  );
}
