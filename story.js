import { decks } from "./decks.js?v=6";
import { ComparisonSliders } from "./comparisonSlider.js?v=1";
import { Tray } from "./tray.js?v=4";
import { RotateIndicator } from "./rotateIndicator.js?v=1";
import {
  resolveDeckSlides,
  applyOrderToSlides,
  getTour,
  updateDeckOrder,
  clearDeckOrder,
  toggleHiddenSlide,
  clearHiddenSlides
} from "./tours.js?v=2";
import { resolveAssetUrl } from "./imageStore.js?v=1";
import { addImageToDeck, removeImageFromDeck } from "./customDecks.js?v=2";

const A = "assets/";

const BOOK_OPEN_DURATION_MS = 1800;
const INTRO_DURATION_MS = 2900;
const JUST_ARRIVED_DURATION_MS = 1200;
const SLIDE_TRANSITION_LOCK_MS = 300;
const UI_AUTOHIDE_DELAY_MS = 3400;

const EMBED_CANVAS_WIDTH = 1200;
const EMBED_CANVAS_HEIGHT = 700;

function scaleEmbedFrames() {
  document.querySelectorAll(".embedFrameWrap").forEach(wrap => {
    const iframe = wrap.querySelector(".embedFrame");
    if (!iframe) return;

    const scale = Math.min(
      wrap.clientWidth / EMBED_CANVAS_WIDTH,
      wrap.clientHeight / EMBED_CANVAS_HEIGHT
    );

    if (scale > 0) {
      iframe.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
  });
}

function slidePreviewImage(slide) {
  if (slide.type === "comparison") return slide.before;
  if (slide.type === "embed") return slide.src;
  return slide.image;
}

function preloadDeck(deck) {
  deck.slides.forEach(slide => {
    [slide.image, slide.before, slide.after].forEach(key => {
      if (!key) return;

      const url = resolveAssetUrl(key, slide.custom);
      if (!url) return;

      const img = new Image();
      img.src = url;
    });
  });
}

export class Story {
  constructor({ onChapterEnd, onContentChanged }) {
    this.onChapterEnd = onChapterEnd;
    this.onContentChanged = onContentChanged;

    this.comparisonSliders = new ComparisonSliders();
    this.tray = new Tray();
    this.rotateIndicator = new RotateIndicator();

    this.editingTourId = null;
    this.editingDeckId = null;

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

    this.directoryScreen = document.getElementById("directoryScreen");

    window.addEventListener("resize", () => scaleEmbedFrames());
  }

  resolveSlidesForDeck(deckId) {
    const baseSlides = decks[deckId].slides;

    if (this.editingTourId) {
      const tour = getTour(this.editingTourId);
      const order = tour && tour.deckOrders[deckId];
      return order ? applyOrderToSlides(order, baseSlides) : [...baseSlides];
    }

    return resolveDeckSlides(deckId, baseSlides);
  }

  enterTourEditing(tourId, deckId) {
    this.editingTourId = tourId;
    this.editingDeckId = deckId;
  }

  exitTourEditing() {
    this.editingTourId = null;
    this.editingDeckId = null;
  }

  saveCurrentDeckOrder() {
    if (!this.editingTourId) return;
    updateDeckOrder(this.editingTourId, this.activeDeckId, this.currentOrderSnapshot());
  }

  resetCurrentDeckOrder() {
    if (!this.editingTourId) return;
    clearDeckOrder(this.editingTourId, this.activeDeckId);
    clearHiddenSlides(this.editingTourId, this.activeDeckId);
    this.refreshSlidesFromSource();
  }

  refreshSlidesFromSource() {
    this.storySlides = this.resolveSlidesForDeck(this.activeDeckId);
    this.current = Math.min(this.current, this.storySlides.length - 1);
    this.renderStory();
  }

  toggleSlideHidden(index) {
    if (!this.editingTourId) return;

    const slide = this.storySlides[index];
    if (!slide) return;

    toggleHiddenSlide(this.editingTourId, this.activeDeckId, slidePreviewImage(slide));
    this.renderRouteDrawer();
  }

  deleteSlideAtIndex(index) {
    if (!this.editingTourId) return;

    const slide = this.storySlides[index];
    if (!slide || !slide.custom) return;

    const confirmed = window.confirm("Remove this photo? This can't be undone.");
    if (!confirmed) return;

    removeImageFromDeck(this.activeDeckId, slide.image).then(() => {
      this.storySlides.splice(index, 1);
      this.current = Math.min(this.current, Math.max(0, this.storySlides.length - 1));
      this.renderRouteDrawer();

      if (this.onContentChanged) this.onContentChanged();
    });
  }

  async addPhotosFromFiles(fileList) {
    if (!this.editingTourId) return;

    const files = Array.from(fileList).filter(file => file.type.startsWith("image/"));
    let addedFirstCover = false;

    for (const file of files) {
      const hadCover = Boolean(decks[this.activeDeckId].cover);

      try {
        const slide = await addImageToDeck(this.activeDeckId, file);
        if (slide) {
          this.storySlides.push(slide);
          if (!hadCover && decks[this.activeDeckId].cover) addedFirstCover = true;
        }
      } catch {
        // skip files that fail to store; the rest still get added
      }
    }

    this.renderRouteDrawer();

    if (addedFirstCover && this.onContentChanged) this.onContentChanged();
  }

  prepareDeck(deckId) {
    this.activeDeckId = deckId;
    this.storySlides = this.resolveSlidesForDeck(deckId);

    const deck = decks[deckId];

    preloadDeck(deck);

    const coverUrl = resolveAssetUrl(deck.cover, deck.custom);

    this.introPhoto.src = coverUrl;
    this.introTitle.textContent = deck.title;

    this.bookOpenBackdrop.style.setProperty("--book-image", coverUrl ? `url("${coverUrl}")` : "none");
    this.bookOpenCardImg.src = coverUrl;
    this.bookOpenCardTitle.textContent = deck.title;
  }

  launchDeckForEditing(deckId) {
    if (!decks[deckId]) return;

    this.prepareDeck(deckId);

    this.current = 0;
    this.introFinished = true;
    this.isTransitioning = false;
    this.comparisonSliders.reset();

    this.directoryScreen.classList.remove("visible");
    document.body.classList.remove("directoryOpen", "bookOpening", "introPlaying");
    document.body.classList.add("storyActive");

    this.renderStory();
    this.tray.open();
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

        this.renderStory();
        document.body.classList.add("storyActive");
      }, INTRO_DURATION_MS);
    }, BOOK_OPEN_DURATION_MS);
  }

  renderStory() {
    this.stage.innerHTML = this.storySlides.map((slide, index) => {
      if (slide.type === "embed") {
        return `
          <article class="storySlide ${slide.orientation} embedSlide ${index === this.current ? "active justArrived" : ""}">
            <div class="imageStage">
              <div class="embedFrameWrap">
                <iframe class="embedFrame" src="${slide.src}" loading="lazy" title="Interactive Sassetta illustration"></iframe>
              </div>
            </div>
          </article>
        `;
      }

      const preview = slidePreviewImage(slide);
      const imageUrl = resolveAssetUrl(preview, slide.custom);

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
    scaleEmbedFrames();

    setTimeout(() => {
      document.querySelectorAll(".justArrived").forEach(slide => {
        slide.classList.remove("justArrived");
      });
    }, JUST_ARRIVED_DURATION_MS);
  }

  renderRouteDrawer() {
    const tour = this.editingTourId ? getTour(this.editingTourId) : null;
    const hiddenSet = tour ? new Set((tour.hiddenSlides && tour.hiddenSlides[this.activeDeckId]) || []) : null;

    this.tray.render(this.storySlides, this.current, {
      imageUrl: slide => resolveAssetUrl(slidePreviewImage(slide), slide.custom),
      onTap: targetIndex => {
        this.goToSlide(targetIndex);
        if (!this.editingTourId) this.tray.close();
      },
      onReorder: (fromIndex, toIndex) => this.reorderSlides(fromIndex, toIndex),
      isHidden: hiddenSet ? slide => hiddenSet.has(slidePreviewImage(slide)) : null,
      onToggleHidden: this.editingTourId ? index => this.toggleSlideHidden(index) : null,
      onAddPhotos: this.editingTourId ? () => document.getElementById("addPhotosInput").click() : null,
      isDeletable: this.editingTourId ? slide => Boolean(slide.custom) : null,
      onDeletePhoto: this.editingTourId ? index => this.deleteSlideAtIndex(index) : null
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

    this.renderStory();
  }

  currentOrderSnapshot() {
    return this.storySlides.map(slide => slidePreviewImage(slide));
  }

  updateOrientationUI() {
    const isPortrait = this.storySlides[this.current]?.orientation === "portrait" && !this.editingTourId;

    if (isPortrait) {
      document.body.classList.add("portraitMode");
    } else {
      document.body.classList.remove("portraitMode");
    }

    this.rotateIndicator.setVisible(isPortrait);
  }

  goToSlide(targetIndex) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    this.current = targetIndex;
    this.renderStory();

    setTimeout(() => {
      this.isTransitioning = false;
    }, SLIDE_TRANSITION_LOCK_MS);
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

    this.introTransition.classList.remove("visible");
    this.bookOpenTransition.classList.remove("visible");

    this.stage.innerHTML = "";
    this.dots.innerHTML = "";
  }
}
