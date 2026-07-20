import { decks } from "./decks.js?v=1";
import { ComparisonSliders } from "./comparisonSlider.js?v=1";
import { Tray } from "./tray.js?v=1";

const A = "assets/";

const BOOK_OPEN_DURATION_MS = 1800;
const INTRO_DURATION_MS = 2900;
const JUST_ARRIVED_DURATION_MS = 1200;
const ROTATE_CUE_DURATION_MS = 3400;
const ROTATE_CUE_CLEANUP_DELAY_MS = 150;
const SLIDE_TRANSITION_LOCK_MS = 300;
const UI_AUTOHIDE_DELAY_MS = 3400;

function slidePreviewImage(slide) {
  if (slide.type === "comparison") return slide.before;
  return slide.image;
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

export class Story {
  constructor({ onChapterEnd }) {
    this.onChapterEnd = onChapterEnd;

    this.comparisonSliders = new ComparisonSliders();
    this.tray = new Tray();

    this.activeDeckId = "berensons";
    this.storySlides = [];
    this.current = 0;

    this.introFinished = false;
    this.isTransitioning = false;

    this.uiTimer = null;
    this.bookTimer = null;
    this.introTimer = null;
    this.orientationTimer = null;
    this.orientationCleanupTimer = null;

    this.stage = document.getElementById("storyStage");
    this.dots = document.getElementById("dots");

    this.introTransition = document.getElementById("introTransition");
    this.introPhoto = document.querySelector(".introPhoto");
    this.introTitle = document.querySelector("#introContent h1");

    this.bookOpenTransition = document.getElementById("bookOpenTransition");
    this.bookOpenBackdrop = document.getElementById("bookOpenBackdrop");
    this.bookOpenCardImg = document.querySelector("#bookOpenCard img");
    this.bookOpenCardTitle = document.querySelector("#bookOpenCard span");

    this.rotateOverlay = document.getElementById("rotateOverlay");
    this.rotatePhoto = document.getElementById("rotatePhoto");
    this.rotateInstruction = document.getElementById("rotateInstruction");

    this.directoryScreen = document.getElementById("directoryScreen");
  }

  prepareDeck(deckId) {
    this.activeDeckId = deckId;
    this.storySlides = applySavedSlideOrder(deckId, [...decks[deckId].slides]);

    const deck = decks[deckId];

    preloadDeck(deck);

    this.introPhoto.src = A + deck.cover;
    this.introTitle.textContent = deck.title;

    this.bookOpenBackdrop.style.setProperty("--book-image", `url("${A + deck.cover}")`);
    this.bookOpenCardImg.src = A + deck.cover;
    this.bookOpenCardTitle.textContent = deck.title;
  }

  launchDeck(deckId) {
    if (!decks[deckId]) return;

    this.prepareDeck(deckId);
    requestAnimationFrame(() => preloadDeck(decks[deckId]));

    this.current = 0;
    this.introFinished = false;
    this.isTransitioning = false;
    this.comparisonSliders.reset();

    document.body.classList.remove(
      "storyActive",
      "portraitMode",
      "rotatingCue",
      "introPlaying"
    );

    this.stage.innerHTML = "";
    this.dots.innerHTML = "";
    this.tray.close();

    document.body.classList.add("bookOpening");
    this.directoryScreen.classList.add("bookLaunching");
    this.bookOpenTransition.classList.add("visible");

    setTimeout(() => {
      this.directoryScreen.classList.remove("visible");
      this.directoryScreen.classList.remove("bookLaunching");
      document.body.classList.remove("directoryOpen");

      this.bookOpenTransition.classList.remove("visible");
      document.body.classList.remove("bookOpening");

      document.body.classList.add("introPlaying");
      this.introTransition.classList.add("visible");

      setTimeout(() => {
        this.introTransition.classList.remove("visible");
        document.body.classList.remove("introPlaying");

        this.introFinished = true;

        this.showInitialOrientationCue(() => {
          this.renderStory();
          document.body.classList.add("storyActive");
        });
      }, INTRO_DURATION_MS);
    }, BOOK_OPEN_DURATION_MS);
  }

  renderStory() {
    this.stage.innerHTML = this.storySlides.map((slide, index) => {
      const preview = slidePreviewImage(slide);
      const imageUrl = A + preview;

      if (slide.type === "zoom") {
        return `
          <article
            class="storySlide ${slide.orientation} ${index === this.current ? "active justArrived" : ""}"
            style="--image:url('${imageUrl}')"
          >
            <div class="backdrop"></div>

            <div class="imageStage">
              <div class="zoomStage">
                <img
                  src="${imageUrl}"
                  alt=""
                  style="
                    --zoom-scale:${slide.scale || 1};
                    --zoom-x:${slide.x || 50}%;
                    --zoom-y:${slide.y || 50}%;
                  "
                >
              </div>
            </div>
          </article>
        `;
      }

      if (slide.type === "comparison") {
        return `
          <article
            class="storySlide ${slide.orientation} ${index === this.current ? "active justArrived" : ""}"
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
          class="storySlide ${slide.orientation} ${index === this.current ? "active justArrived" : ""}"
          style="--image:url('${imageUrl}')"
        >
          <div class="backdrop"></div>

          <div class="imageStage">
            <img src="${imageUrl}" alt="">
          </div>
        </article>
      `;
    }).join("");

    this.dots.innerHTML = this.storySlides.map((_, index) => `
      <button class="dot ${index === this.current ? "active" : ""}" data-index="${index}"></button>
    `).join("");

    document.querySelectorAll(".dot").forEach(dot => {
      dot.addEventListener("click", event => {
        event.stopPropagation();

        const targetIndex = Number(dot.dataset.index);
        if (targetIndex !== this.current) this.goToSlide(targetIndex);
      });
    });

    this.updateOrientationUI();
    this.renderRouteDrawer();
    this.showUI();

    setTimeout(() => {
      document.querySelectorAll(".justArrived").forEach(slide => {
        slide.classList.remove("justArrived");
      });
    }, JUST_ARRIVED_DURATION_MS);
  }

  renderRouteDrawer() {
    this.tray.render(this.storySlides, this.current, {
      imageUrl: slide => A + slidePreviewImage(slide),
      onTap: targetIndex => this.goToSlide(targetIndex),
      onReorder: (fromIndex, toIndex) => this.reorderSlides(fromIndex, toIndex)
    });
  }

  reorderSlides(fromIndex, toIndex) {
    const currentSlide = this.storySlides[this.current];
    const movedSlide = this.storySlides.splice(fromIndex, 1)[0];

    let insertIndex = toIndex;

    if (fromIndex < toIndex) {
      insertIndex = toIndex - 1;
    }

    this.storySlides.splice(insertIndex, 0, movedSlide);
    this.current = this.storySlides.indexOf(currentSlide);

    this.saveSlideOrder();

    this.renderStory();
  }

  saveSlideOrder() {
    const order = this.storySlides.map(slide => slidePreviewImage(slide));
    localStorage.setItem(`slideOrder_${this.activeDeckId}`, JSON.stringify(order));
  }

  updateOrientationUI() {
    if (this.storySlides[this.current]?.orientation === "portrait") {
      document.body.classList.add("portraitMode");
    } else {
      document.body.classList.remove("portraitMode");
    }
  }

  showInitialOrientationCue(callback) {
    const firstSlide = this.storySlides[this.current];
    const cue = getCueClass("landscape", firstSlide.orientation);

    if (!cue) {
      callback();
      return;
    }

    this.rotatePhoto.src = A + slidePreviewImage(firstSlide);
    this.rotateInstruction.textContent =
      firstSlide.orientation === "portrait" ? "Rotate to portrait" : "Rotate to landscape";

    document.body.classList.add("preparingSlide", "rotatingCue");

    this.rotateOverlay.className = "";
    this.rotateOverlay.classList.add("visible", cue);

    setTimeout(() => {
      callback();

      setTimeout(() => {
        this.rotateOverlay.className = "";
        document.body.classList.remove("preparingSlide", "rotatingCue");
      }, ROTATE_CUE_CLEANUP_DELAY_MS);
    }, ROTATE_CUE_DURATION_MS);
  }

  showOrientationCue(targetIndex, callback) {
    const currentOrientation = this.storySlides[this.current].orientation;
    const targetOrientation = this.storySlides[targetIndex].orientation;
    const cue = getCueClass(currentOrientation, targetOrientation);

    if (!cue) {
      callback();
      return;
    }

    this.rotatePhoto.src = A + slidePreviewImage(this.storySlides[targetIndex]);
    this.rotateInstruction.textContent =
      targetOrientation === "portrait" ? "Rotate to portrait" : "Rotate to landscape";

    document.body.classList.add("preparingSlide", "rotatingCue");

    this.rotateOverlay.className = "";
    this.rotateOverlay.classList.add("visible", cue);

    setTimeout(() => {
      callback();

      setTimeout(() => {
        this.rotateOverlay.className = "";
        document.body.classList.remove("preparingSlide", "rotatingCue");
      }, ROTATE_CUE_CLEANUP_DELAY_MS);
    }, ROTATE_CUE_DURATION_MS);
  }

  goToSlide(targetIndex) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    this.showOrientationCue(targetIndex, () => {
      this.current = targetIndex;
      this.renderStory();

      setTimeout(() => {
        this.isTransitioning = false;
      }, SLIDE_TRANSITION_LOCK_MS);
    });
  }

  next() {
    if (this.current === this.storySlides.length - 1) {
      this.onChapterEnd();
      return;
    }

    this.goToSlide(this.current + 1);
  }

  prev() {
    if (this.current === 0) return;

    this.goToSlide(this.current - 1);
  }

  showUI() {
    document.body.classList.add("showUI");

    clearTimeout(this.uiTimer);

    this.uiTimer = setTimeout(() => {
      document.body.classList.remove("showUI");
    }, UI_AUTOHIDE_DELAY_MS);
  }

  cleanupForDirectory() {
    clearTimeout(this.bookTimer);
    clearTimeout(this.introTimer);
    clearTimeout(this.orientationTimer);
    clearTimeout(this.orientationCleanupTimer);
    clearTimeout(this.uiTimer);

    this.tray.close();

    document.body.classList.remove(
      "storyActive",
      "portraitMode",
      "rotatingCue",
      "introPlaying",
      "bookOpening",
      "preparingSlide",
      "sortingSlides"
    );

    this.rotateOverlay.className = "";
    this.introTransition.classList.remove("visible");
    this.bookOpenTransition.classList.remove("visible");

    this.stage.innerHTML = "";
    this.dots.innerHTML = "";
  }
}
