const A = "assets/";

const decks = {
  berensons: {
    title: "The Berensons at I Tatti",
    cover: "bernard and mary.jpg",
    slides: [
      { type: "image", image: "bernard and mary.jpg", orientation: "portrait" },

      { type: "image", image: "Bernard Berenson as a child.jpg", orientation: "portrait" },
      { type: "image", image: "harvard_yard_aerial_web.jpg", orientation: "portrait" },
      { type: "image", image: "Harvard Yard 1885.jpg", orientation: "landscape" },

      { type: "image", image: "Bernard Berenson in the French Library at Villa I Tatti.jpg", orientation: "landscape" },
      { type: "image", image: "Mary Berenson in the garden at Villa I Tatti.jpg", orientation: "portrait" }
    ]
  },

garden: {
  title: "The Garden",
  cover: "Geoffrey Scott.jpg",
  slides: [
    // Dot 1
    { type: "image", image: "Geoffrey Scott.jpg", orientation: "portrait" },

    // Dot 2
    { type: "image", image: "Cecil Pinsent in uniform.jpg", orientation: "portrait" },

    // Dot 3 — Original comparison
    {
      type: "comparison",
      orientation: "portrait",
      before: "Pinsent 7.jpg",
      after: "WhatsApp Image 2026-06-25 at 08.42.13.jpeg",
      start: 75
    },

    // Dot 4
    {
      type: "comparison",
      orientation: "portrait",
      before: "Pinsent 1.jpg",
      after: "pinset 1 match.JPG",
      start: 75
    },

    // Dot 5
    {
      type: "comparison",
      orientation: "portrait",
      before: "Pinsent 2.jpg",
      beforeRotate: -90,
      after: "Pinset 2 match.JPG",
      start: 75
    },

    // Dot 6
    {
      type: "comparison",
      orientation: "portrait",
      before: "Pinsent 3.jpg",
      beforeRotate: -90,
      after: "Pinset 3 match.JPG",
      start: 75
    },

    // Dot 7
    { type: "image", image: "Pinsent 4.jpg", orientation: "portrait" },

    // Dot 8
    {
      type: "comparison",
      orientation: "portrait",
      before: "Pinsent 5.jpg",
      after: "Pinset 5 match.JPG",
      start: 75
    },

    // Dot 9
    { type: "image", image: "Pinsent 6.jpg", orientation: "portrait" },

    // Dot 10
    {
      type: "comparison",
      orientation: "portrait",
      before: "Pinsent 8.jpg",
      beforeRotate: -90,
      after: "Pinset 8 match.JPG",
      start: 75
    },

    // Dot 11
    {
      type: "comparison",
      orientation: "portrait",
      before: "Pinsent 9.jpg",
      after: "Pinset 9 match.JPG",
      start: 75
    }
  ]
},
  today: {
    title: "I Tatti Today",
    cover: "modern book published from i tatti 3.jpg",
    slides: [
      { type: "image", image: "modern book published from i tatti 1.jpg", orientation: "portrait" },
      { type: "image", image: "modern book published from i tatti 2.jpeg", orientation: "portrait" },
      { type: "image", image: "modern book published from i tatti 3.jpg", orientation: "portrait" },
      { type: "image", image: "modern concert.jpg", orientation: "portrait" },
      { type: "image", image: "modern conference poster 1.jpeg", orientation: "portrait" },
      { type: "image", image: "modern conference poster 2.jpg", orientation: "portrait" },
      { type: "image", image: "modern conference poster 3.jpeg", orientation: "portrait" },
      { type: "image", image: "modern conference poster 4.jpg", orientation: "portrait" },
      { type: "image", image: "modern conference poster 5.jpeg", orientation: "portrait" },
      { type: "image", image: "modern conference poster 6.jpg", orientation: "portrait" },
      { type: "image", image: "modern conference poster 7.jpg", orientation: "portrait" },
      { type: "image", image: "modern conference poster 8.jpg", orientation: "portrait" },
      { type: "image", image: "modern conference.jpg", orientation: "landscape" },
      { type: "image", image: "modern fellow working.jpg", orientation: "landscape" },
      { type: "image", image: "modern fellows discussing.jpg", orientation: "landscape" },
      { type: "image", image: "modern fellows studying.jpg", orientation: "landscape" },
      { type: "image", image: "modern term fellowships.jpg", orientation: "landscape" },
      { type: "image", image: "modern working.jpg", orientation: "landscape" }
    ]
  }
};


let activeDeckId = "berensons";
let storySlides = [];
let current = 0;

let introFinished = false;
let isTransitioning = false;
let isUsingComparisonSlider = false;
let isDraggingTray = false;

let uiTimer = null;
let holdTimer = null;
let touchStartX = 0;
let touchStartY = 0;
let bookTimer = null;
let introTimer = null;
let chapterTimer = null;
let orientationTimer = null;
let orientationCleanupTimer = null;

const stage = document.getElementById("storyStage");
const dots = document.getElementById("dots");

const introTransition = document.getElementById("introTransition");
const introPhoto = document.querySelector(".introPhoto");
const introTitle = document.querySelector("#introContent h1");

const bookOpenTransition = document.getElementById("bookOpenTransition");
const bookOpenBackdrop = document.getElementById("bookOpenBackdrop");
const bookOpenCardImg = document.querySelector("#bookOpenCard img");
const bookOpenCardTitle = document.querySelector("#bookOpenCard span");

const rotateOverlay = document.getElementById("rotateOverlay");
const rotatePhoto = document.getElementById("rotatePhoto");

const directoryScreen = document.getElementById("directoryScreen");
const homeButton = document.getElementById("homeButton");
const slideTrayButton = document.getElementById("slideTrayButton");

const routeDrawer = document.getElementById("routeDrawer");
const routeDrawerGrid = document.getElementById("routeDrawerGrid");

const chapterClose = document.getElementById("chapterClose");

function slidePreviewImage(slide) {
  return slide.type === "comparison" ? slide.before : slide.image;
}
function preloadDeck(deck) {
  const images = new Set();

  deck.slides.forEach(slide => {
    if (slide.image) {
      images.add(slide.image);
    }

    if (slide.before) {
      images.add(slide.before);
    }

    if (slide.after) {
      images.add(slide.after);
    }
  });

  images.forEach(src => {
    const img = new Image();
    img.src = A + src;
  });
}

function getSavedSlideOrder(deckId) {
  const saved = localStorage.getItem(`slideOrder_${deckId}`);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveSlideOrder(deckId) {
  const order = storySlides.map(slide => slidePreviewImage(slide));
  localStorage.setItem(`slideOrder_${deckId}`, JSON.stringify(order));
}

function applySavedSlideOrder(deckId, slides) {
  const savedOrder = getSavedSlideOrder(deckId);
  if (!savedOrder) return slides;

  const ordered = [];
  const remaining = [...slides];

  savedOrder.forEach(savedImage => {
    const matchIndex = remaining.findIndex(slide => slidePreviewImage(slide) === savedImage);

    if (matchIndex !== -1) {
      ordered.push(remaining.splice(matchIndex, 1)[0]);
    }
  });

  return [...ordered, ...remaining];
}

function prepareDeck(deckId) {
  activeDeckId = deckId;
  storySlides = applySavedSlideOrder(deckId, [...decks[deckId].slides]);

  const deck = decks[deckId];

  preloadDeck(deck);

  introPhoto.src = A + deck.cover;
  introTitle.textContent = deck.title;

  bookOpenBackdrop.style.setProperty("--book-image", `url("${A + deck.cover}")`);
  bookOpenCardImg.src = A + deck.cover;
  bookOpenCardTitle.textContent = deck.title;
}

function launchDeck(deckId) {
  if (!decks[deckId]) return;

  prepareDeck(deckId);
  requestAnimationFrame(() => preloadDeck(decks[deckId]));

  current = 0;
  introFinished = false;
  isTransitioning = false;
  isUsingComparisonSlider = false;

  document.body.classList.remove(
    "storyActive",
    "portraitMode",
    "rotatingCue",
    "introPlaying"
  );

  stage.innerHTML = "";
  dots.innerHTML = "";
  routeDrawer.classList.remove("visible");

  document.body.classList.add("bookOpening");
  directoryScreen.classList.add("bookLaunching");
  bookOpenTransition.classList.add("visible");

  setTimeout(() => {
    directoryScreen.classList.remove("visible");
    directoryScreen.classList.remove("bookLaunching");
    document.body.classList.remove("directoryOpen");

    bookOpenTransition.classList.remove("visible");
    document.body.classList.remove("bookOpening");

    document.body.classList.add("introPlaying");
    introTransition.classList.add("visible");

    setTimeout(() => {
      introTransition.classList.remove("visible");
      document.body.classList.remove("introPlaying");

      introFinished = true;

      showInitialOrientationCue(() => {
        renderStory();
        renderRouteDrawer();
        document.body.classList.add("storyActive");
      });
    }, 2900);
  }, 1800);
}
function setupCustomTrayScrollbar() {
  const track = document.getElementById("customTrayScrollbar");
  const thumb = document.getElementById("customTrayThumb");

  if (!track || !thumb || !routeDrawerGrid) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;

  function updateThumb() {
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

  function moveToClient(clientX, clientY) {
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

  thumb.addEventListener("mousedown", event => {
    event.preventDefault();
    event.stopPropagation();

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = routeDrawerGrid.scrollLeft;
    thumb.classList.add("dragging");

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDrag);
  });

  thumb.addEventListener("touchstart", event => {
    if (!event.touches || event.touches.length !== 1) return;

    event.preventDefault();
    event.stopPropagation();

    dragging = true;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    startScrollLeft = routeDrawerGrid.scrollLeft;
    thumb.classList.add("dragging");

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", stopDrag);
    window.addEventListener("touchcancel", stopDrag);
  }, { passive: false });

  track.addEventListener("mousedown", event => {
    if (event.target === thumb) return;

    event.preventDefault();
    event.stopPropagation();

    moveToClient(event.clientX, event.clientY);
    updateThumb();
  });

  track.addEventListener("touchstart", event => {
    if (!event.touches || event.touches.length !== 1) return;
    if (event.target === thumb) return;

    event.preventDefault();
    event.stopPropagation();

    moveToClient(event.touches[0].clientX, event.touches[0].clientY);
    updateThumb();
  }, { passive: false });

  function onMouseMove(event) {
    if (!dragging) return;

    event.preventDefault();

    const isPortraitMode = document.body.classList.contains("portraitMode");
    const trackWidth = track.clientWidth;
    const thumbWidth = thumb.offsetWidth;
    const maxThumbMove = trackWidth - thumbWidth;
    const maxScroll = routeDrawerGrid.scrollWidth - routeDrawerGrid.clientWidth;

    const delta = isPortraitMode
      ? event.clientY - startY
      : event.clientX - startX;

    if (maxThumbMove > 0) {
      routeDrawerGrid.scrollLeft = startScrollLeft + (delta / maxThumbMove) * maxScroll;
    }

    updateThumb();
  }

  function onTouchMove(event) {
    if (!dragging || !event.touches || event.touches.length !== 1) return;

    event.preventDefault();

    const touch = event.touches[0];
    const isPortraitMode = document.body.classList.contains("portraitMode");
    const trackWidth = track.clientWidth;
    const thumbWidth = thumb.offsetWidth;
    const maxThumbMove = trackWidth - thumbWidth;
    const maxScroll = routeDrawerGrid.scrollWidth - routeDrawerGrid.clientWidth;

    const delta = isPortraitMode
      ? touch.clientY - startY
      : touch.clientX - startX;

    if (maxThumbMove > 0) {
      routeDrawerGrid.scrollLeft = startScrollLeft + (delta / maxThumbMove) * maxScroll;
    }

    updateThumb();
  }

  function stopDrag() {
    dragging = false;
    thumb.classList.remove("dragging");

    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", stopDrag);

    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", stopDrag);
    window.removeEventListener("touchcancel", stopDrag);
  }

  routeDrawerGrid.addEventListener("scroll", updateThumb);
  window.addEventListener("resize", updateThumb);

  requestAnimationFrame(updateThumb);
}

function renderStory() {
  stage.innerHTML = storySlides.map((slide, index) => {
    const preview = slidePreviewImage(slide);
    const imageUrl = A + preview;

    if (slide.type === "comparison") {
      return `
        <article
          class="storySlide ${slide.orientation} ${index === current ? "active justArrived" : ""}"
          style="--image:url('${imageUrl}')"
        >
          <div class="backdrop"></div>

          <div class="imageStage">
            <div class="comparisonStage" style="--split:${slide.start || 75}%">
              <div class="comparisonImage base">
                <div
                  class="comparisonImageInner"
                  style="
                    background-image:url('${A + slide.after}');
                    transform: rotate(${slide.afterRotate || 0}deg) scale(${slide.afterRotate ? 1.32 : 1});
                  "
                ></div>
              </div>

              <div class="comparisonImage reveal">
                <div
                  class="comparisonImageInner"
                  style="
                    background-image:url('${A + slide.before}');
                    transform: rotate(${slide.beforeRotate || 0}deg) scale(${slide.beforeRotate ? 1.32 : 1});
                  "
                ></div>
              </div>

              <div class="comparisonDivider"></div>
              <div class="comparisonHandle"></div>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <article
        class="storySlide ${slide.orientation} ${index === current ? "active justArrived" : ""}"
        style="--image:url('${imageUrl}')"
      >
        <div class="backdrop"></div>

        <div class="imageStage">
          <img src="${imageUrl}" alt="">
        </div>
      </article>
    `;
  }).join("");

  dots.innerHTML = storySlides.map((_, index) => `
    <button class="dot ${index === current ? "active" : ""}" data-index="${index}"></button>
  `).join("");

  document.querySelectorAll(".dot").forEach(dot => {
    dot.addEventListener("click", event => {
      event.stopPropagation();

      const targetIndex = Number(dot.dataset.index);

      if (targetIndex !== current) {
        goToSlide(targetIndex);
      }
    });
  });

  setupComparisonSliders();
  updateOrientationUI();
  renderRouteDrawer();
  showUI();

  setTimeout(() => {
    document.querySelectorAll(".justArrived").forEach(slide => {
      slide.classList.remove("justArrived");
    });
  }, 1200);
}

function setupComparisonSliders() {
  document.querySelectorAll(".comparisonStage").forEach(stageEl => {
    const setSplit = clientY => {
      const rect = stageEl.getBoundingClientRect();
      let percentage = ((clientY - rect.top) / rect.height) * 100;

      percentage = Math.max(2, Math.min(98, percentage));
      stageEl.style.setProperty("--split", `${percentage}%`);
    };

    const start = event => {
      event.preventDefault();
      event.stopPropagation();

      isUsingComparisonSlider = true;

      const point = event.touches ? event.touches[0] : event;
      setSplit(point.clientY);
    };

    const move = event => {
      if (!isUsingComparisonSlider) return;

      event.preventDefault();
      event.stopPropagation();

      const point = event.touches ? event.touches[0] : event;
      setSplit(point.clientY);
    };

    const stop = event => {
      if (!isUsingComparisonSlider) return;

      event.stopPropagation();
      isUsingComparisonSlider = false;
    };

    stageEl.addEventListener("mousedown", start);
    stageEl.addEventListener("touchstart", start, { passive: false });

    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: false });

    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
  });
}

function renderRouteDrawer() {
  routeDrawerGrid.innerHTML = storySlides.map((slide, index) => {
    const image = slidePreviewImage(slide);

    return `
      <button
        class="jumpThumb ${index === current ? "active" : ""}"
        data-slide-index="${index}"
        data-index="${index + 1}"
      >
        <img src="${A + image}" alt="" draggable="false">
      </button>
    `;
  }).join("");

  setupTrayInteractions();
  setupCustomTrayScrollbar();
}

function setupTrayInteractions() {
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

    isDraggingTray = true;
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
      setupCustomTrayScrollbar();
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
      isDraggingTray = false;
    }, 160);

    if (!shouldReorder) {
      resetDragState();
      return;
    }

    if (!moved) {
      const targetIndex = Number(releasedThumb.dataset.slideIndex);

      if (targetIndex !== current) {
        routeDrawer.classList.remove("visible");
        goToSlide(targetIndex);
      }

      resetDragState();
      return;
    }

    if (fromIndex !== toIndex) {
      const currentSlide = storySlides[current];
      const movedSlide = storySlides.splice(fromIndex, 1)[0];

      let insertIndex = toIndex;

      if (fromIndex < toIndex) {
        insertIndex = toIndex - 1;
      }

      storySlides.splice(insertIndex, 0, movedSlide);
      current = storySlides.indexOf(currentSlide);

      saveSlideOrder(activeDeckId);

      renderStory();
      routeDrawer.classList.add("visible");

      requestAnimationFrame(() => {
        routeDrawerGrid.scrollLeft = savedScrollLeft;
        setupCustomTrayScrollbar();
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

function updateOrientationUI() {
  if (storySlides[current]?.orientation === "portrait") {
    document.body.classList.add("portraitMode");
  } else {
    document.body.classList.remove("portraitMode");
  }
}

function getCueClass(currentOrientation, targetOrientation) {
  if (currentOrientation === targetOrientation) return null;

  if (currentOrientation === "landscape" && targetOrientation === "portrait") {
    return "rotateToPortrait";
  }

  if (currentOrientation === "portrait" && targetOrientation === "landscape") {
    return "rotateToLandscape";
  }

  return null;
}

function showInitialOrientationCue(callback) {
  const firstSlide = storySlides[current];
  const cue = getCueClass("landscape", firstSlide.orientation);

  if (!cue) {
    callback();
    return;
  }

  rotatePhoto.src = A + slidePreviewImage(firstSlide);
  document.getElementById("rotateInstruction").textContent =
  firstSlide.orientation === "portrait" ? "Rotate to portrait" : "Rotate to landscape";

  document.body.classList.add("preparingSlide", "rotatingCue");

  rotateOverlay.className = "";
  rotateOverlay.classList.add("visible", cue);

  setTimeout(() => {
    callback();

    setTimeout(() => {
      rotateOverlay.className = "";
      document.body.classList.remove("preparingSlide", "rotatingCue");
    }, 150);
  }, 3400);
}

function showOrientationCue(targetIndex, callback) {
  const currentOrientation = storySlides[current].orientation;
  const targetOrientation = storySlides[targetIndex].orientation;
  const cue = getCueClass(currentOrientation, targetOrientation);

  if (!cue) {
    callback();
    return;
  }

  rotatePhoto.src = A + slidePreviewImage(storySlides[targetIndex]);
  document.getElementById("rotateInstruction").textContent =
  targetOrientation === "portrait" ? "Rotate to portrait" : "Rotate to landscape";

  document.body.classList.add("preparingSlide", "rotatingCue");

  rotateOverlay.className = "";
  rotateOverlay.classList.add("visible", cue);

  setTimeout(() => {
    callback();

    setTimeout(() => {
      rotateOverlay.className = "";
      document.body.classList.remove("preparingSlide", "rotatingCue");
    }, 150);
  }, 3400);
}

function goToSlide(targetIndex) {
  if (isTransitioning) return;

  isTransitioning = true;

  showOrientationCue(targetIndex, () => {
    current = targetIndex;
    renderStory();

    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  });
}

function next() {
  if (current === storySlides.length - 1) {
    closeChapter();
    return;
  }

  goToSlide(current + 1);
}

function prev() {
  if (current === 0) return;

  goToSlide(current - 1);
}

function showUI() {
  document.body.classList.add("showUI");

  clearTimeout(uiTimer);

  uiTimer = setTimeout(() => {
    document.body.classList.remove("showUI");
  }, 3400);
}

function cleanupStoryForDirectory() {
  clearTimeout(bookTimer);
  clearTimeout(introTimer);
  clearTimeout(chapterTimer);
  clearTimeout(orientationTimer);
  clearTimeout(orientationCleanupTimer);
  clearTimeout(uiTimer);
  clearTimeout(holdTimer);

  routeDrawer.classList.remove("visible");

  document.body.classList.remove(
    "storyActive",
    "portraitMode",
    "rotatingCue",
    "introPlaying",
    "bookOpening",
    "preparingSlide",
    "sortingSlides"
  );

  rotateOverlay.className = "";
  introTransition.classList.remove("visible");
  bookOpenTransition.classList.remove("visible");
  chapterClose.classList.remove("visible");

  stage.innerHTML = "";
  dots.innerHTML = "";
}

function openDirectory() {
  cleanupStoryForDirectory();

  directoryScreen.classList.add("visible");
  document.body.classList.add("directoryOpen");

  showUI();
}

function closeDirectory() {
  directoryScreen.classList.remove("visible");
  document.body.classList.remove("directoryOpen");

  if (introFinished) {
    document.body.classList.add("storyActive");
    updateOrientationUI();
  }

  showUI();
}

function closeChapter() {
  chapterClose.classList.add("visible");

  chapterTimer = setTimeout(() => {
    chapterClose.classList.remove("visible");
    openDirectory();
  }, 1300);
}

function setupDirectory() {
  ["garden", "living", "today"].forEach(packId => {
    const card = document.querySelector(`.bookCard[data-pack="${packId}"]`);

    if (card && decks[packId]) {
      card.classList.remove("placeholder");

      if (!card.querySelector("img")) {
        card.insertAdjacentHTML("afterbegin", `<img src="${A + decks[packId].cover}" alt="">`);
      }
    }
  });

  document.querySelectorAll(".bookCard").forEach(card => {
    card.addEventListener("click", event => {
      event.stopPropagation();

      const pack = card.dataset.pack;

      if (decks[pack]) {
        launchDeck(pack);
      }
    });
  });
}

homeButton.addEventListener("click", event => {
  event.stopPropagation();

  routeDrawer.classList.remove("visible");
  openDirectory();
});

slideTrayButton.addEventListener("click", event => {
  event.stopPropagation();

  if (!introFinished || directoryScreen.classList.contains("visible")) return;

  routeDrawer.classList.toggle("visible");
});

document.addEventListener("click", event => {
  if (
    routeDrawer.classList.contains("visible") &&
    !event.target.closest("#routeDrawer") &&
    !event.target.closest("#slideTrayButton")
  ) {
    event.stopPropagation();
    routeDrawer.classList.remove("visible");
  }
}, true);

document.addEventListener("click", event => {
  if (isDraggingTray) return;

  if (
    !introFinished ||
    isTransitioning ||
    isUsingComparisonSlider ||
    directoryScreen.classList.contains("visible") ||
    routeDrawer.classList.contains("visible") ||
    event.target.closest(".dot") ||
    event.target.closest("#homeButton") ||
    event.target.closest("#slideTrayButton") ||
    event.target.closest(".comparisonStage")
  ) {
    return;
  }

  if (event.clientX > window.innerWidth / 2) {
    next();
  } else {
    prev();
  }
});

document.addEventListener("mousedown", event => {
  if (
    event.target.closest("#homeButton") ||
    event.target.closest("#slideTrayButton") ||
    event.target.closest("#directoryScreen") ||
    event.target.closest("#routeDrawer") ||
    event.target.closest(".dot") ||
    event.target.closest(".comparisonStage")
  ) {
    return;
  }

  holdTimer = setTimeout(() => {
    openDirectory();
  }, 650);
});

document.addEventListener("mouseup", () => clearTimeout(holdTimer));
document.addEventListener("mouseleave", () => clearTimeout(holdTimer));

document.addEventListener("touchstart", event => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;

  showUI();

  if (
    event.target.closest("#homeButton") ||
    event.target.closest("#slideTrayButton") ||
    event.target.closest("#directoryScreen") ||
    event.target.closest("#routeDrawer") ||
    event.target.closest(".dot") ||
    event.target.closest(".comparisonStage")
  ) {
    return;
  }

  holdTimer = setTimeout(() => {
    openDirectory();
  }, 650);
});

document.addEventListener("touchend", event => {
  clearTimeout(holdTimer);

  if (
    !introFinished ||
    isTransitioning ||
    isUsingComparisonSlider ||
    directoryScreen.classList.contains("visible") ||
    routeDrawer.classList.contains("visible")
  ) {
    return;
  }

  const endX = event.changedTouches[0].clientX;
  const endY = event.changedTouches[0].clientY;

  const deltaX = endX - touchStartX;
  const deltaY = endY - touchStartY;

  const orientation = storySlides[current].orientation;

  if (orientation === "portrait") {
    if (Math.abs(deltaY) > 60 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY < 0) next();
      if (deltaY > 0) prev();
    }
  } else {
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) next();
      if (deltaX > 0) prev();
    }
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (routeDrawer.classList.contains("visible")) {
      routeDrawer.classList.remove("visible");
    } else {
      closeDirectory();
    }
    return;
  }

  if (!introFinished || isTransitioning) return;

  if (event.key === "ArrowRight") next();
  if (event.key === "ArrowLeft") prev();
});

stage.innerHTML = "";
dots.innerHTML = "";

setupDirectory();
openDirectory();