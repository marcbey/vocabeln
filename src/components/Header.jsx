import { useState } from 'react';
import HeaderDesktopControls from './header/HeaderDesktopControls.jsx';
import HeaderIntro from './header/HeaderIntro.jsx';
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
  const runAndClose = (action) => (...args) => {
    action(...args);
    closeMobileMenu();
  };

  const handlePageChange = runAndClose(onPageChange);
  const handleDirectionChange = runAndClose(onDirectionChange);
  const handleToggleBoardMode = runAndClose(onToggleBoardMode);
  const handleReset = runAndClose(onReset);
  const handleClassChange = runAndClose(onClassChange);

  return (
    <header className="w-full max-w-[1100px] rounded-xl2 border-2 border-[#3f567e] bg-white px-4 py-4 md:px-5 md:py-[18px] flex flex-col gap-3 shadow-deep">
      <div className="flex w-full items-start gap-3 md:items-center">
        <HeaderIntro headline={headline} />

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
          boardMode={boardMode}
          onClassChange={handleClassChange}
          onPageChange={handlePageChange}
          onDirectionChange={handleDirectionChange}
          onToggleBoardMode={handleToggleBoardMode}
          onReset={handleReset}
          onClose={closeMobileMenu}
        />
      )}
    </header>
  );
}
