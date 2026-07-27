import { NavigationArrowButton } from "../ui/ModalControls";

interface CalendarNavigationProps {
  currentMonthLabel: string;
  monthRangeLabel: string;
  canPreviousMonth: boolean;
  canNextMonth: boolean;
  canPreviousPair: boolean;
  canNextPair: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onPreviousPair: () => void;
  onNextPair: () => void;
}

export function CalendarNavigation({
  currentMonthLabel,
  monthRangeLabel,
  canPreviousMonth,
  canNextMonth,
  canPreviousPair,
  canNextPair,
  onPreviousMonth,
  onNextMonth,
  onPreviousPair,
  onNextPair,
}: CalendarNavigationProps) {
  return (
    <nav
      aria-label="Navegación del calendario"
      className="flex items-center justify-center gap-4"
    >
      <span className="md:hidden">
        <NavigationArrowButton
          direction="previous"
          label="Ver mes anterior"
          disabled={!canPreviousMonth}
          onClick={onPreviousMonth}
        />
      </span>
      <span className="hidden md:block">
        <NavigationArrowButton
          direction="previous"
          label="Ver los dos meses anteriores"
          disabled={!canPreviousPair}
          onClick={onPreviousPair}
        />
      </span>

      <p
        className="min-w-0 flex-1 text-center text-lg font-bold sm:flex-none sm:min-w-72"
        aria-live="polite"
      >
        <span className="md:hidden">{currentMonthLabel}</span>
        <span className="hidden md:inline">{monthRangeLabel}</span>
      </p>

      <span className="md:hidden">
        <NavigationArrowButton
          direction="next"
          label="Ver mes siguiente"
          disabled={!canNextMonth}
          onClick={onNextMonth}
        />
      </span>
      <span className="hidden md:block">
        <NavigationArrowButton
          direction="next"
          label="Ver los dos meses siguientes"
          disabled={!canNextPair}
          onClick={onNextPair}
        />
      </span>
    </nav>
  );
}
