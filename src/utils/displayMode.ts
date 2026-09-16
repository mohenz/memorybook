type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export function isStandaloneDisplay(windowObject: Window = window): boolean {
  const matchesStandalone = windowObject.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const isIosStandalone = (windowObject.navigator as NavigatorWithStandalone).standalone === true;

  return matchesStandalone || isIosStandalone;
}
