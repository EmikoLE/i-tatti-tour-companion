export class TrayScrollbar {
  constructor(routeDrawerGrid) {
    this.routeDrawerGrid = routeDrawerGrid;
    this.track = document.getElementById("customTrayScrollbar");
    this.thumb = document.getElementById("customTrayThumb");

    this.dragging = false;
    this.startX = 0;
    this.startY = 0;
    this.startScrollLeft = 0;

    this.updateThumb = this.updateThumb.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.stopDrag = this.stopDrag.bind(this);

    if (!this.track || !this.thumb || !this.routeDrawerGrid) return;

    this.thumb.addEventListener("mousedown", event => this.onThumbMouseDown(event));
    this.thumb.addEventListener("touchstart", event => this.onThumbTouchStart(event), { passive: false });

    this.track.addEventListener("mousedown", event => this.onTrackMouseDown(event));
    this.track.addEventListener("touchstart", event => this.onTrackTouchStart(event), { passive: false });

    this.routeDrawerGrid.addEventListener("scroll", this.updateThumb);
    window.addEventListener("resize", this.updateThumb);
  }

  attach() {
    requestAnimationFrame(this.updateThumb);
  }

  updateThumb() {
    const { routeDrawerGrid, track, thumb } = this;
    if (!track || !thumb || !routeDrawerGrid) return;

    const maxScroll = routeDrawerGrid.scrollWidth - routeDrawerGrid.clientWidth;
    const trackWidth = track.clientWidth;

    if (maxScroll <= 0) {
      thumb.style.display = "none";
      return;
    }

    thumb.style.display = "block";

    const thumbWidth = Math.max(
      90,
      (routeDrawerGrid.clientWidth / routeDrawerGrid.scrollWidth) * trackWidth
    );

    const maxThumbMove = trackWidth - thumbWidth;
    const thumbX = (routeDrawerGrid.scrollLeft / maxScroll) * maxThumbMove;

    thumb.style.width = `${thumbWidth}px`;
    thumb.style.transform = `translateX(${thumbX}px)`;
  }

  moveToClient(clientX, clientY) {
    const { routeDrawerGrid, track, thumb } = this;
    const isPortraitMode = document.body.classList.contains("portraitMode");
    const rect = track.getBoundingClientRect();
    const thumbWidth = thumb.offsetWidth;
    const maxThumbMove = track.clientWidth - thumbWidth;

    let x;

    if (isPortraitMode) {
      x = clientY - rect.top - thumbWidth / 2;
    } else {
      x = clientX - rect.left - thumbWidth / 2;
    }

    x = Math.max(0, Math.min(maxThumbMove, x));

    const maxScroll = routeDrawerGrid.scrollWidth - routeDrawerGrid.clientWidth;

    if (maxThumbMove > 0) {
      routeDrawerGrid.scrollLeft = (x / maxThumbMove) * maxScroll;
    }
  }

  onThumbMouseDown(event) {
    event.preventDefault();
    event.stopPropagation();

    this.dragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startScrollLeft = this.routeDrawerGrid.scrollLeft;
    this.thumb.classList.add("dragging");

    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.stopDrag);
  }

  onThumbTouchStart(event) {
    if (!event.touches || event.touches.length !== 1) return;

    event.preventDefault();
    event.stopPropagation();

    this.dragging = true;
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.startScrollLeft = this.routeDrawerGrid.scrollLeft;
    this.thumb.classList.add("dragging");

    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.stopDrag);
    window.addEventListener("touchcancel", this.stopDrag);
  }

  onTrackMouseDown(event) {
    if (event.target === this.thumb) return;

    event.preventDefault();
    event.stopPropagation();

    this.moveToClient(event.clientX, event.clientY);
    this.updateThumb();
  }

  onTrackTouchStart(event) {
    if (!event.touches || event.touches.length !== 1) return;
    if (event.target === this.thumb) return;

    event.preventDefault();
    event.stopPropagation();

    this.moveToClient(event.touches[0].clientX, event.touches[0].clientY);
    this.updateThumb();
  }

  onMouseMove(event) {
    if (!this.dragging) return;

    event.preventDefault();

    const { routeDrawerGrid, track, thumb } = this;
    const isPortraitMode = document.body.classList.contains("portraitMode");
    const trackWidth = track.clientWidth;
    const thumbWidth = thumb.offsetWidth;
    const maxThumbMove = trackWidth - thumbWidth;
    const maxScroll = routeDrawerGrid.scrollWidth - routeDrawerGrid.clientWidth;

    const delta = isPortraitMode
      ? event.clientY - this.startY
      : event.clientX - this.startX;

    if (maxThumbMove > 0) {
      routeDrawerGrid.scrollLeft = this.startScrollLeft + (delta / maxThumbMove) * maxScroll;
    }

    this.updateThumb();
  }

  onTouchMove(event) {
    if (!this.dragging || !event.touches || event.touches.length !== 1) return;

    event.preventDefault();

    const touch = event.touches[0];
    const { routeDrawerGrid, track, thumb } = this;
    const isPortraitMode = document.body.classList.contains("portraitMode");
    const trackWidth = track.clientWidth;
    const thumbWidth = thumb.offsetWidth;
    const maxThumbMove = trackWidth - thumbWidth;
    const maxScroll = routeDrawerGrid.scrollWidth - routeDrawerGrid.clientWidth;

    const delta = isPortraitMode
      ? touch.clientY - this.startY
      : touch.clientX - this.startX;

    if (maxThumbMove > 0) {
      routeDrawerGrid.scrollLeft = this.startScrollLeft + (delta / maxThumbMove) * maxScroll;
    }

    this.updateThumb();
  }

  stopDrag() {
    this.dragging = false;
    this.thumb.classList.remove("dragging");

    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.stopDrag);

    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.stopDrag);
    window.removeEventListener("touchcancel", this.stopDrag);
  }
}
