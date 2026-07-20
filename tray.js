import { TrayScrollbar } from "./trayScrollbar.js?v=1";

const DRAG_END_GRACE_MS = 160;

export class Tray {
  constructor() {
    this.routeDrawer = document.getElementById("routeDrawer");
    this.routeDrawerGrid = document.getElementById("routeDrawerGrid");
    this.trayScrollbar = new TrayScrollbar(this.routeDrawerGrid);

    this.isDraggingTray = false;
  }

  get isOpen() {
    return this.routeDrawer.classList.contains("visible");
  }

  open() {
    this.routeDrawer.classList.add("visible");
  }

  close() {
    this.routeDrawer.classList.remove("visible");
  }

  toggle() {
    this.routeDrawer.classList.toggle("visible");
  }

  render(slides, currentIndex, { imageUrl, onTap, onReorder }) {
    this.routeDrawerGrid.innerHTML = slides.map((slide, index) => `
      <button
        class="jumpThumb ${index === currentIndex ? "active" : ""}"
        data-slide-index="${index}"
        data-index="${index + 1}"
      >
        <img src="${imageUrl(slide)}" alt="" draggable="false">
      </button>
    `).join("");

    this.setupTrayInteractions(currentIndex, { onTap, onReorder });
    this.trayScrollbar.attach();
  }

  setupTrayInteractions(currentIndex, { onTap, onReorder }) {
    const routeDrawerGrid = this.routeDrawerGrid;
    const thumbs = Array.from(document.querySelectorAll(".jumpThumb"));
    const dropIndicator = document.getElementById("dropIndicator");

    let dragged = null;
    let fromIndex = null;
    let toIndex = null;
    let startX = 0;
    let startY = 0;
    let moved = false;
    let dragMode = null;

    let lastClientX = 0;
    let lastClientY = 0;
    let autoScrollFrame = null;

    const self = this;

    thumbs.forEach(thumb => {
      thumb.addEventListener("mousedown", event => {
        beginDrag(event, thumb, event.clientX, event.clientY, "mouse");
      });

      thumb.addEventListener("touchstart", event => {
        if (!event.touches || event.touches.length !== 1) return;

        const touch = event.touches[0];
        beginDrag(event, thumb, touch.clientX, touch.clientY, "touch");
      }, { passive: false });
    });

    function beginDrag(event, thumb, clientX, clientY, mode) {
      event.preventDefault();
      event.stopPropagation();

      self.isDraggingTray = true;
      dragMode = mode;

      dragged = thumb;
      fromIndex = Number(thumb.dataset.slideIndex);
      toIndex = fromIndex;
      startX = clientX;
      startY = clientY;
      lastClientX = clientX;
      lastClientY = clientY;
      moved = false;

      dragged.classList.add("lifting");
      document.body.classList.add("sortingSlides");

      updateDropIndicator(fromIndex);
      startAutoScroll();

      if (mode === "mouse") {
        window.addEventListener("mousemove", handleMouseMove, { passive: false });
        window.addEventListener("mouseup", handleMouseEnd, { passive: false });
      }

      if (mode === "touch") {
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd, { passive: false });
        window.addEventListener("touchcancel", handleTouchCancel, { passive: false });
      }
    }

    function handleMouseMove(event) {
      if (!dragged || dragMode !== "mouse") return;

      moveDrag(event, event.clientX, event.clientY);
    }

    function handleTouchMove(event) {
      if (!dragged || dragMode !== "touch") return;
      if (!event.touches || event.touches.length !== 1) return;

      const touch = event.touches[0];
      moveDrag(event, touch.clientX, touch.clientY);
    }

    function moveDrag(event, clientX, clientY) {
      event.preventDefault();
      event.stopPropagation();

      lastClientX = clientX;
      lastClientY = clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;
      const isPortraitMode = document.body.classList.contains("portraitMode");

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        moved = true;
        dragged.classList.add("dragging");
      }

      if (isPortraitMode) {
        dragged.style.transform = `translate(${dy}px, ${-dx}px) scale(1.06)`;
        toIndex = getDropIndexPortrait(clientY);
      } else {
        dragged.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
        toIndex = getDropIndexLandscape(clientX);
      }

      updateDropIndicator(toIndex);
    }

    function startAutoScroll() {
      if (autoScrollFrame) return;

      const tick = () => {
        if (!dragged) {
          autoScrollFrame = null;
          return;
        }

        autoScrollTray(lastClientX, lastClientY);
        autoScrollFrame = requestAnimationFrame(tick);
      };

      autoScrollFrame = requestAnimationFrame(tick);
    }

    function autoScrollTray(clientX, clientY) {
      const rect = routeDrawerGrid.getBoundingClientRect();
      const isPortraitMode = document.body.classList.contains("portraitMode");

      const edgeSize = 220;
      const maxSpeed = 30;
      let scrollAmount = 0;

      const maxScroll = routeDrawerGrid.scrollWidth - routeDrawerGrid.clientWidth;
      if (maxScroll <= 0) return;

      if (isPortraitMode) {
        const topEdge = rect.top + edgeSize;
        const bottomEdge = rect.bottom - edgeSize;

        if (clientY < topEdge) {
          const strength = (topEdge - clientY) / edgeSize;
          scrollAmount = -maxSpeed * Math.max(0, Math.min(1, strength));
        }

        if (clientY > bottomEdge) {
          const strength = (clientY - bottomEdge) / edgeSize;
          scrollAmount = maxSpeed * Math.max(0, Math.min(1, strength));
        }
      } else {
        const leftEdge = rect.left + edgeSize;
        const rightEdge = rect.right - edgeSize;

        if (clientX < leftEdge) {
          const strength = (leftEdge - clientX) / edgeSize;
          scrollAmount = -maxSpeed * Math.max(0, Math.min(1, strength));
        }

        if (clientX > rightEdge) {
          const strength = (clientX - rightEdge) / edgeSize;
          scrollAmount = maxSpeed * Math.max(0, Math.min(1, strength));
        }
      }

      if (scrollAmount !== 0) {
        const nextScroll = Math.max(
          0,
          Math.min(maxScroll, routeDrawerGrid.scrollLeft + scrollAmount)
        );

        routeDrawerGrid.scrollLeft = nextScroll;

        if (isPortraitMode) {
          toIndex = getDropIndexPortrait(clientY);
        } else {
          toIndex = getDropIndexLandscape(clientX);
        }

        updateDropIndicator(toIndex);
        self.trayScrollbar.attach();
      }
    }

    function stopAutoScroll() {
      if (autoScrollFrame) {
        cancelAnimationFrame(autoScrollFrame);
        autoScrollFrame = null;
      }
    }

    function handleMouseEnd(event) {
      if (!dragged || dragMode !== "mouse") return;

      event.preventDefault();
      event.stopPropagation();

      finishDrag(true);
    }

    function handleTouchEnd(event) {
      if (!dragged || dragMode !== "touch") return;

      event.preventDefault();
      event.stopPropagation();

      finishDrag(true);
    }

    function handleTouchCancel(event) {
      if (!dragged || dragMode !== "touch") return;

      event.preventDefault();
      event.stopPropagation();

      finishDrag(false);
    }

    function finishDrag(shouldReorder) {
      const releasedThumb = dragged;
      const savedScrollLeft = routeDrawerGrid.scrollLeft;

      stopAutoScroll();

      if (releasedThumb) {
        releasedThumb.classList.remove("lifting", "dragging");
        releasedThumb.style.transform = "";
      }

      document.body.classList.remove("sortingSlides");

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseEnd);

      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);

      setTimeout(() => {
        self.isDraggingTray = false;
      }, DRAG_END_GRACE_MS);

      if (!shouldReorder) {
        resetDragState();
        return;
      }

      if (!moved) {
        const targetIndex = Number(releasedThumb.dataset.slideIndex);

        if (targetIndex !== currentIndex) {
          self.close();
          onTap(targetIndex);
        }

        resetDragState();
        return;
      }

      if (fromIndex !== toIndex) {
        onReorder(fromIndex, toIndex);

        self.open();

        requestAnimationFrame(() => {
          routeDrawerGrid.scrollLeft = savedScrollLeft;
          self.trayScrollbar.attach();
        });
      }

      resetDragState();
    }

    function getDropIndexLandscape(pointerX) {
      const items = Array.from(document.querySelectorAll(".jumpThumb"));

      for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        const middle = rect.left + rect.width / 2;

        if (pointerX < middle) return i;
      }

      return items.length;
    }

    function getDropIndexPortrait(pointerY) {
      const items = Array.from(document.querySelectorAll(".jumpThumb"));

      for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        const middle = rect.top + rect.height / 2;

        if (pointerY < middle) return i;
      }

      return items.length;
    }

    function updateDropIndicator(index) {
      if (!dropIndicator) return;

      const items = Array.from(document.querySelectorAll(".jumpThumb"));

      if (!items.length) return;

      let x;

      if (index >= items.length) {
        const last = items[items.length - 1];
        x = last.offsetLeft + last.offsetWidth - routeDrawerGrid.scrollLeft + 7;
      } else {
        const target = items[index];
        x = target.offsetLeft - routeDrawerGrid.scrollLeft - 7;
      }

      dropIndicator.style.transform = `translateX(${x}px)`;
    }

    function resetDragState() {
      dragged = null;
      fromIndex = null;
      toIndex = null;
      startX = 0;
      startY = 0;
      lastClientX = 0;
      lastClientY = 0;
      moved = false;
      dragMode = null;

      if (dropIndicator) {
        dropIndicator.style.transform = "";
      }
    }
  }
}
