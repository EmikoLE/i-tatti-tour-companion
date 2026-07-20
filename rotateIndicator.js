const TOOLTIP_MAX_TAPS = 3;
const TOOLTIP_VISIBLE_MS = 2600;
const TAP_COUNT_STORAGE_KEY = "rotateHintTaps";

export class RotateIndicator {
  constructor() {
    this.button = document.getElementById("rotateIndicator");
    this.tooltip = document.getElementById("rotateIndicatorTip");
    this.tooltipTimer = null;

    this.button.addEventListener("click", event => {
      event.stopPropagation();
      this.handleTap();
    });
  }

  setVisible(isVisible) {
    this.button.classList.toggle("visible", isVisible);

    if (!isVisible) {
      this.hideTooltip();
    }
  }

  handleTap() {
    const taps = Number(localStorage.getItem(TAP_COUNT_STORAGE_KEY) || 0);

    if (taps >= TOOLTIP_MAX_TAPS) return;

    localStorage.setItem(TAP_COUNT_STORAGE_KEY, String(taps + 1));
    this.showTooltip();
  }

  showTooltip() {
    this.tooltip.classList.add("visible");

    clearTimeout(this.tooltipTimer);

    this.tooltipTimer = setTimeout(() => {
      this.hideTooltip();
    }, TOOLTIP_VISIBLE_MS);
  }

  hideTooltip() {
    this.tooltip.classList.remove("visible");
    clearTimeout(this.tooltipTimer);
  }
}
