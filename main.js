import { Story } from "./story.js?v=1";
import { Directory } from "./directory.js?v=1";

const CHAPTER_CLOSE_DURATION_MS = 1300;
const HOLD_TO_OPEN_DELAY_MS = 650;

const homeButton = document.getElementById("homeButton");
const slideTrayButton = document.getElementById("slideTrayButton");
const chapterClose = document.getElementById("chapterClose");

let holdTimer = null;
let touchStartX = 0;
let touchStartY = 0;
let chapterTimer = null;

const directory = new Directory();
const story = new Story({ onChapterEnd: () => closeChapter() });

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
  chapterClose.classList.add("visible");

  chapterTimer = setTimeout(() => {
    chapterClose.classList.remove("visible");
    openDirectory();
  }, CHAPTER_CLOSE_DURATION_MS);
}

homeButton.addEventListener("click", event => {
  event.stopPropagation();

  story.tray.close();
  openDirectory();
});

slideTrayButton.addEventListener("click", event => {
  event.stopPropagation();

  if (!story.introFinished || directory.isOpen) return;

  story.tray.toggle();
});

document.addEventListener("click", event => {
  if (
    story.tray.isOpen &&
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
    event.target.closest(".dot") ||
    event.target.closest("#homeButton") ||
    event.target.closest("#slideTrayButton") ||
    event.target.closest(".comparisonStage")
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
    event.target.closest("#directoryScreen") ||
    event.target.closest("#routeDrawer") ||
    event.target.closest(".dot") ||
    event.target.closest(".comparisonStage")
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
    event.target.closest("#directoryScreen") ||
    event.target.closest("#routeDrawer") ||
    event.target.closest(".dot") ||
    event.target.closest(".comparisonStage")
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
    story.tray.isOpen
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
    if (story.tray.isOpen) {
      story.tray.close();
    } else {
      closeDirectory();
    }
    return;
  }

  if (!story.introFinished || story.isTransitioning) return;

  if (event.key === "ArrowRight") story.next();
  if (event.key === "ArrowLeft") story.prev();
});

directory.setup(packId => story.launchDeck(packId));
openDirectory();
