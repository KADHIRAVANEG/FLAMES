// ============================================================================
// Default main-frame content when no sidebar category is selected. Left
// intentionally empty of any task content — just a faint hint so the page
// doesn't look broken, per the "otherwise it should be blank" requirement.
// ============================================================================

export function BlankPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-gray-300 text-[12.5px] select-none">Select a category from the sidebar to begin.</p>
    </div>
  );
}
