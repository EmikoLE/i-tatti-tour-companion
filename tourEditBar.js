import { decks } from "./decks.js?v=1";
import { getTour } from "./tours.js?v=2";

const SAVE_CONFIRM_DURATION_MS = 1400;

export class TourEditBar {
  constructor({ onSave, onReset, onDone }) {
    this.onSave = onSave;
    this.onReset = onReset;
    this.onDone = onDone;

    this.tourId = null;
    this.deckId = null;
    this.saveConfirmTimer = null;

    this.bar = document.getElementById("tourEditBar");
    this.label = document.getElementById("tourEditLabel");
    this.resetButton = document.getElementById("tourEditReset");
    this.saveButton = document.getElementById("tourEditSave");
    this.doneButton = document.getElementById("tourEditDone");

    this.saveLabel = this.saveButton.textContent;

    this.resetButton.addEventListener("click", event => {
      event.stopPropagation();
      this.onReset();
    });

    this.saveButton.addEventListener("click", event => {
      event.stopPropagation();
      this.onSave();
      this.flashSaved();
    });

    this.doneButton.addEventListener("click", event => {
      event.stopPropagation();
      this.onDone();
    });
  }

  get isShowing() {
    return this.tourId !== null;
  }

  show(tourId, deckId) {
    this.tourId = tourId;
    this.deckId = deckId;

    document.body.classList.add("tourEditing");

    this.refresh();
  }

  hide() {
    this.tourId = null;
    this.deckId = null;

    clearTimeout(this.saveConfirmTimer);
    this.saveButton.textContent = this.saveLabel;
    this.saveButton.classList.remove("justSaved");

    document.body.classList.remove("tourEditing");
  }

  flashSaved() {
    clearTimeout(this.saveConfirmTimer);

    this.saveButton.textContent = "Saved";
    this.saveButton.classList.add("justSaved");

    this.saveConfirmTimer = setTimeout(() => {
      this.saveButton.textContent = this.saveLabel;
      this.saveButton.classList.remove("justSaved");
    }, SAVE_CONFIRM_DURATION_MS);
  }

  refresh() {
    const tour = getTour(this.tourId);
    if (!tour) return;

    const deck = decks[this.deckId];
    this.label.textContent = `${tour.name}${deck ? " — " + deck.title : ""}`;
  }
}
