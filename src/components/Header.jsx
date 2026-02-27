import { useState } from 'react';
import HeaderDesktopControls from './header/HeaderDesktopControls.jsx';
import HeaderMobilePanel from './header/HeaderMobilePanel.jsx';
import MobileMenuButton from './header/MobileMenuButton.jsx';

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

  return (
    <header className="w-full max-w-[1100px] bg-panel/80 backdrop-blur-md border border-white/10 rounded-xl2 px-4 py-3 md:px-5 md:py-3.5 flex flex-col md:flex-row md:items-center md:gap-4 gap-3 shadow-deep">
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-xl tracking-tight flex items-center gap-2 font-extrabold">
          <span
            className="w-3.5 h-3.5 rounded-full inline-block"
            style={{
              background: 'linear-gradient(135deg, #3cdfff, #ff7ac3)',
              boxShadow: '0 0 14px rgba(255, 122, 195, 0.8)',
            }}
          />
          Vokabeln für die Klasse 5
        </h1>

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
      )}
    </header>
  );
}
