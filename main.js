import { Story } from "./story.js?v=9";
import { Directory } from "./directory.js?v=3";
import { Onboarding } from "./onboarding.js?v=4";
import { ToursScreen } from "./toursScreen.js?v=4";
import { TourEditBar } from "./tourEditBar.js?v=5";
import { showHintOnce } from "./hints.js?v=1";
import { initCustomContent } from "./customDecks.js?v=2";
import { preloadAllImages } from "./imageStore.js?v=1";

initCustomContent();

const CHAPTER_CLOSE_DURATION_MS = 1300;
const HOLD_TO_OPEN_DELAY_MS = 650;

const homeButton = document.getElementById("homeButton");
const slideTrayButton = document.getElementById("slideTrayButton");
const chapterClose = document.getElementById("chapterClose");
const onboardingReplay = document.getElementById("onboardingReplay");
const toursButton = document.getElementById("toursButton");

let holdTimer = null;
let touchStartX = 0;
let touchStartY = 0;
let chapterTimer = null;

const directory = new Directory();
const story = new Story({
  onChapterEnd: () => closeChapter(),
  onContentChanged: () => directory.refreshCustomDecks()
});
const onboarding = new Onboarding({ onFinish: () => openDirectory() });
const addPhotosInput = document.getElementById("addPhotosInput");

const tourEditBar = new TourEditBar({
  onSave: () => {
    story.saveCurrentDeckOrder();
    tourEditBar.refresh();
  },
  onReset: () => {
    story.resetCurrentDeckOrder();
    tourEditBar.refresh();
  },
  onDone: () => {
    const tourId = story.editingTourId;

    story.exitTourEditing();
    tourEditBar.hide();
    story.cleanupForDirectory();
    directory.open();

    toursScreen.open();
    if (tourId) toursScreen.showDetail(tourId);
  }
});

const toursScreen = new ToursScreen({
  onEditDeck: (tourId, deckId) => {
    toursScreen.close();
    story.enterTourEditing(tourId, deckId);
    tourEditBar.show(tourId, deckId);
    story.launchDeckForEditing(deckId);
    directory.refreshCustomDecks();

    showHintOnce(
      "tourEditing",
      document.getElementById("routeDrawer"),
      "Drag any slide to reorder it. Save keeps the change, Reset restores the default order, and Chapters takes you back to see the other decks in this tour."
    );
  },
  onDeckDeleted: () => directory.refreshCustomDecks()
});

function openDirectory() {
  clearTimeout(chapterTimer);
  chapterClose.classList.remove("visible");
  clearTimeout(holdTimer);

  story.cleanupForDirectory();

  directory.open();

  story.showUI();
}

function closeDirectory() {
  directory.close();

  if (story.introFinished) {
    document.body.classList.add("storyActive");
    story.updateOrientationUI();
  }

  story.showUI();
}

function closeChapter() {
  if (story.editingTourId) {
    story.exitTourEditing();
    tourEditBar.hide();
  }

  chapterClose.classList.add("visible");

  chapterTimer = setTimeout(() => {
    chapterClose.classList.remove("visible");
    openDirectory();
  }, CHAPTER_CLOSE_DURATION_MS);
}

homeButton.addEventListener("click", event => {
  event.stopPropagation();

  story.tray.close();

  if (story.editingTourId) {
    story.exitTourEditing();
    tourEditBar.hide();
  }

  openDirectory();
});

slideTrayButton.addEventListener("click", event => {
  event.stopPropagation();

  if (!story.introFinished || directory.isOpen) return;

  story.tray.toggle();
});

toursButton.addEventListener("click", event => {
  event.stopPropagation();
  toursScreen.open();
});

document.addEventListener("click", event => {
  if (
    story.tray.isOpen &&
    !story.editingTourId &&
    !event.target.closest("#routeDrawer") &&
    !event.target.closest("#slideTrayButton")
  ) {
    event.stopPropagation();
    story.tray.close();
  }
}, true);

document.addEventListener("click", event => {
  if (story.tray.isDraggingTray) return;

  if (
    !story.introFinished ||
    story.isTransitioning ||
    story.comparisonSliders.isDragging ||
    directory.isOpen ||
    story.tray.isOpen ||
    toursScreen.isOpen ||
    event.target.closest(".dot") ||
    event.target.closest("#homeButton") ||
    event.target.closest("#slideTrayButton") ||
    event.target.closest("#rotateIndicator") ||
    event.target.closest("#tourEditBar") ||
    event.target.closest(".comparisonStage") ||
    event.target.closest("#onboarding") ||
    event.target.closest("#toursScreen")
  ) {
    return;
  }

  if (event.clientX > window.innerWidth / 2) {
    story.next();
  } else {
    story.prev();
  }
});

document.addEventListener("mousedown", event => {
  if (
    event.target.closest("#homeButton") ||
    event.target.closest("#slideTrayButton") ||
    event.target.closest("#rotateIndicator") ||
    event.target.closest("#tourEditBar") ||
    event.target.closest("#directoryScreen") ||
    event.target.closest("#routeDrawer") ||
    event.target.closest(".dot") ||
    event.target.closest(".comparisonStage") ||
    event.target.closest("#onboarding") ||
    event.target.closest("#toursScreen")
  ) {
    return;
  }

  holdTimer = setTimeout(() => {
    openDirectory();
  }, HOLD_TO_OPEN_DELAY_MS);
});

document.addEventListener("mouseup", () => clearTimeout(holdTimer));
document.addEventListener("mouseleave", () => clearTimeout(holdTimer));

document.addEventListener("touchstart", event => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;

  story.showUI();

  if (
    event.target.closest("#homeButton") ||
    event.target.closest("#slideTrayButton") ||
    event.target.closest("#rotateIndicator") ||
    event.target.closest("#tourEditBar") ||
    event.target.closest("#directoryScreen") ||
    event.target.closest("#routeDrawer") ||
    event.target.closest(".dot") ||
    event.target.closest(".comparisonStage") ||
    event.target.closest("#onboarding") ||
    event.target.closest("#toursScreen")
  ) {
    return;
  }

  holdTimer = setTimeout(() => {
    openDirectory();
  }, HOLD_TO_OPEN_DELAY_MS);
});

document.addEventListener("touchend", event => {
  clearTimeout(holdTimer);

  if (
    !story.introFinished ||
    story.isTransitioning ||
    story.comparisonSliders.isDragging ||
    directory.isOpen ||
    story.tray.isOpen ||
    toursScreen.isOpen
  ) {
    return;
  }

  const endX = event.changedTouches[0].clientX;
  const endY = event.changedTouches[0].clientY;

  const deltaX = endX - touchStartX;
  const deltaY = endY - touchStartY;

  const orientation = story.storySlides[story.current].orientation;

  if (orientation === "portrait") {
    if (Math.abs(deltaY) > 60 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY < 0) story.next();
      if (deltaY > 0) story.prev();
    }
  } else {
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) story.next();
      if (deltaX > 0) story.prev();
    }
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (onboarding.isOpen) {
      onboarding.close();
    } else if (toursScreen.isOpen) {
      if (toursScreen.view === "detail") {
        toursScreen.showList();
      } else {
        toursScreen.close();
      }
    } else if (story.tray.isOpen) {
      story.tray.close();
    } else if (story.editingTourId) {
      story.exitTourEditing();
      tourEditBar.hide();
      openDirectory();
    } else {
      closeDirectory();
    }
    return;
  }

  if (!story.introFinished || story.isTransitioning) return;

  if (event.key === "ArrowRight") story.next();
  if (event.key === "ArrowLeft") story.prev();
});

onboardingReplay.addEventListener("click", event => {
  event.stopPropagation();
  onboarding.open();
});

addPhotosInput.addEventListener("change", async event => {
  const files = event.target.files;

  if (files && files.length) {
    await story.addPhotosFromFiles(files);
  }

  addPhotosInput.value = "";
});

async function bootstrap() {
  await preloadAllImages();

  directory.setup(packId => story.launchDeck(packId));

  if (Onboarding.hasBeenSeen()) {
    openDirectory();
  } else {
    onboarding.open();
  }
}

bootstrap();
