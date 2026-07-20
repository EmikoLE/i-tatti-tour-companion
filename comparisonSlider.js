export class ComparisonSliders {
  constructor() {
    this.isDragging = false;
    this.activeStage = null;

    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onStop = this.onStop.bind(this);

    document.addEventListener("mousedown", this.onStart);
    document.addEventListener("touchstart", this.onStart, { passive: false });

    window.addEventListener("mousemove", this.onMove);
    window.addEventListener("touchmove", this.onMove, { passive: false });

    window.addEventListener("mouseup", this.onStop);
    window.addEventListener("touchend", this.onStop);
  }

  setSplit(stageEl, clientY) {
    const rect = stageEl.getBoundingClientRect();
    let percentage = ((clientY - rect.top) / rect.height) * 100;

    percentage = Math.max(2, Math.min(98, percentage));
    stageEl.style.setProperty("--split", `${percentage}%`);
  }

  onStart(event) {
    const stageEl = event.target.closest(".comparisonStage");
    if (!stageEl) return;

    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
    this.activeStage = stageEl;

    const point = event.touches ? event.touches[0] : event;
    this.setSplit(stageEl, point.clientY);
  }

  onMove(event) {
    if (!this.isDragging || !this.activeStage) return;

    event.preventDefault();
    event.stopPropagation();

    const point = event.touches ? event.touches[0] : event;
    this.setSplit(this.activeStage, point.clientY);
  }

  onStop(event) {
    if (!this.isDragging) return;

    event.stopPropagation();
    this.isDragging = false;
    this.activeStage = null;
  }

  reset() {
    this.isDragging = false;
    this.activeStage = null;
  }
}
