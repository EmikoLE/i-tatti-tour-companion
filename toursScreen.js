import { decks } from "./decks.js?v=1";
import {
  getTours,
  getCurrentTourId,
  getTour,
  createTour,
  duplicateTour,
  renameTour,
  deleteTour,
  setCurrentTourId,
  clearDeckOrder
} from "./tours.js?v=2";
import { showHintOnce } from "./hints.js?v=1";
import { createCustomDeck, deleteCustomDeck } from "./customDecks.js?v=2";
import { resolveAssetUrl } from "./imageStore.js?v=1";

function suggestedTourName() {
  const now = new Date();
  return `I Tatti Tour ${now.getMonth() + 1}/${now.getDate()}/${String(now.getFullYear()).slice(-2)}`;
}

export class ToursScreen {
  constructor({ onEditDeck, onDeckDeleted }) {
    this.onEditDeck = onEditDeck;
    this.onDeckDeleted = onDeckDeleted;
    this.view = "list";
    this.openTourId = null;

    this.section = document.getElementById("toursScreen");
    this.backButton = document.getElementById("toursBack");
    this.closeButton = document.getElementById("toursClose");
    this.title = document.getElementById("toursTitle");

    this.listView = document.getElementById("toursListView");
    this.list = document.getElementById("toursList");
    this.newTourButton = document.getElementById("newTourButton");
    this.newTourRow = document.getElementById("newTourRow");
    this.newTourName = document.getElementById("newTourName");
    this.newTourCreate = document.getElementById("newTourCreate");
    this.newTourCancel = document.getElementById("newTourCancel");

    this.detailView = document.getElementById("toursDetailView");
    this.detailActions = document.getElementById("toursDetailActions");
    this.makeCurrentButton = document.getElementById("tourMakeCurrent");
    this.renameButton = document.getElementById("tourRename");
    this.duplicateButton = document.getElementById("tourDuplicate");
    this.deleteButton = document.getElementById("tourDelete");
    this.renameRow = document.getElementById("renameTourRow");
    this.renameName = document.getElementById("renameTourName");
    this.renameSave = document.getElementById("renameTourSave");
    this.renameCancel = document.getElementById("renameTourCancel");
    this.duplicateRow = document.getElementById("duplicateTourRow");
    this.duplicateName = document.getElementById("duplicateTourName");
    this.duplicateCreate = document.getElementById("duplicateTourCreate");
    this.duplicateCancel = document.getElementById("duplicateTourCancel");
    this.deckList = document.getElementById("tourDeckList");
    this.newDeckButton = document.getElementById("newDeckButton");
    this.newDeckRow = document.getElementById("newDeckRow");
    this.newDeckName = document.getElementById("newDeckName");
    this.newDeckCreate = document.getElementById("newDeckCreate");
    this.newDeckCancel = document.getElementById("newDeckCancel");

    this.backButton.addEventListener("click", event => {
      event.stopPropagation();
      this.showList();
    });

    this.closeButton.addEventListener("click", event => {
      event.stopPropagation();
      this.close();
    });

    this.newTourButton.addEventListener("click", event => {
      event.stopPropagation();
      this.newTourName.value = suggestedTourName();
      this.newTourRow.classList.add("visible");
      this.newTourName.focus();
    });

    this.newTourCancel.addEventListener("click", event => {
      event.stopPropagation();
      this.newTourRow.classList.remove("visible");
    });

    this.newTourCreate.addEventListener("click", event => {
      event.stopPropagation();
      this.handleCreateTour();
    });

    this.makeCurrentButton.addEventListener("click", event => {
      event.stopPropagation();
      setCurrentTourId(this.openTourId);
      this.renderDetail();
    });

    this.renameButton.addEventListener("click", event => {
      event.stopPropagation();
      const tour = getTour(this.openTourId);
      this.renameName.value = tour ? tour.name : "";
      this.renameRow.classList.add("visible");
      this.renameName.focus();
    });

    this.renameCancel.addEventListener("click", event => {
      event.stopPropagation();
      this.renameRow.classList.remove("visible");
    });

    this.renameSave.addEventListener("click", event => {
      event.stopPropagation();
      this.handleRenameTour();
    });

    this.duplicateButton.addEventListener("click", event => {
      event.stopPropagation();
      this.duplicateName.value = suggestedTourName();
      this.duplicateRow.classList.add("visible");
      this.duplicateName.focus();
    });

    this.duplicateCancel.addEventListener("click", event => {
      event.stopPropagation();
      this.duplicateRow.classList.remove("visible");
    });

    this.duplicateCreate.addEventListener("click", event => {
      event.stopPropagation();
      this.handleDuplicateTour();
    });

    this.deleteButton.addEventListener("click", event => {
      event.stopPropagation();
      this.handleDeleteTour();
    });

    this.newDeckButton.addEventListener("click", event => {
      event.stopPropagation();
      this.newDeckName.value = "";
      this.newDeckRow.classList.add("visible");
      this.newDeckName.focus();
    });

    this.newDeckCancel.addEventListener("click", event => {
      event.stopPropagation();
      this.newDeckRow.classList.remove("visible");
    });

    this.newDeckCreate.addEventListener("click", event => {
      event.stopPropagation();
      this.handleCreateDeck();
    });
  }

  get isOpen() {
    return this.section.classList.contains("visible");
  }

  open() {
    this.showList();
    this.section.classList.add("visible");
    document.body.classList.add("toursOpen");
  }

  close() {
    this.section.classList.remove("visible");
    document.body.classList.remove("toursOpen");
  }

  showList() {
    this.view = "list";
    this.openTourId = null;

    this.title.textContent = "Tours";
    this.backButton.classList.remove("visible");
    this.listView.classList.add("visible");
    this.detailView.classList.remove("visible");
    this.newTourRow.classList.remove("visible");

    this.renderList();

    showHintOnce(
      "toursList",
      this.listView,
      "Each tour remembers its own slide order per chapter. Create one below, or open an existing tour to arrange its chapters."
    );
  }

  showDetail(tourId) {
    const tour = getTour(tourId);
    if (!tour) return;

    this.view = "detail";
    this.openTourId = tourId;

    this.title.textContent = tour.name;
    this.backButton.classList.add("visible");
    this.listView.classList.remove("visible");
    this.detailView.classList.add("visible");
    this.renameRow.classList.remove("visible");
    this.duplicateRow.classList.remove("visible");
    this.newDeckRow.classList.remove("visible");

    this.renderDetail();

    showHintOnce(
      "toursDetail",
      this.detailView,
      "Tap a chapter to arrange its slides. The dot means it already has a custom order in this tour."
    );
  }

  renderList() {
    const tours = getTours();
    const currentId = getCurrentTourId();

    if (!tours.length) {
      this.list.innerHTML = `<p class="toursEmpty">No tours saved yet — create one below.</p>`;
      return;
    }

    this.list.innerHTML = tours.map(tour => {
      const customizedCount = Object.keys(tour.deckOrders).length;
      const totalCount = Object.keys(decks).length;

      return `
        <button class="tourRow ${tour.id === currentId ? "current" : ""}" data-tour-id="${tour.id}">
          <span class="tourRowName">${tour.name}</span>
          <span class="tourRowMeta">${customizedCount} of ${totalCount} chapters customized</span>
          ${tour.id === currentId ? `<span class="tourRowBadge">Current</span>` : ""}
        </button>
      `;
    }).join("");

    Array.from(this.list.querySelectorAll(".tourRow")).forEach(row => {
      row.addEventListener("click", event => {
        event.stopPropagation();
        this.showDetail(row.dataset.tourId);
      });
    });
  }

  renderDetail() {
    const tour = getTour(this.openTourId);
    if (!tour) {
      this.showList();
      return;
    }

    const currentId = getCurrentTourId();
    this.makeCurrentButton.disabled = tour.id === currentId;
    this.makeCurrentButton.textContent = tour.id === currentId ? "Current tour" : "Make current";

    this.deckList.innerHTML = Object.keys(decks).map(deckId => {
      const deck = decks[deckId];
      const hasCustomOrder = Boolean(tour.deckOrders[deckId]);

      return `
        <div class="tourDeckRow">
          <button class="tourDeckOpen" data-deck-id="${deckId}">
            ${deck.cover
              ? `<img src="${resolveAssetUrl(deck.cover, deck.custom)}" alt="">`
              : `<span class="tourDeckNoCover"></span>`}
            <span class="tourDeckRowTitle">${deck.title}</span>
            <span class="tourDeckRowStatus">${hasCustomOrder ? "Custom order" : "Using default"}</span>
          </button>
          ${hasCustomOrder ? `<button class="tourDeckReset" data-deck-id="${deckId}">Reset</button>` : ""}
          ${deck.custom ? `<button class="tourDeckDelete" data-deck-id="${deckId}">Delete</button>` : ""}
        </div>
      `;
    }).join("");

    Array.from(this.deckList.querySelectorAll(".tourDeckOpen")).forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        this.onEditDeck(this.openTourId, button.dataset.deckId);
      });
    });

    Array.from(this.deckList.querySelectorAll(".tourDeckReset")).forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        clearDeckOrder(this.openTourId, button.dataset.deckId);
        this.renderDetail();
      });
    });

    Array.from(this.deckList.querySelectorAll(".tourDeckDelete")).forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        this.handleDeleteDeck(button.dataset.deckId);
      });
    });
  }

  handleCreateTour() {
    const name = this.newTourName.value.trim();
    if (!name) return;

    const tour = createTour(name);
    this.newTourRow.classList.remove("visible");
    this.showDetail(tour.id);
  }

  handleRenameTour() {
    const name = this.renameName.value.trim();
    if (!name) return;

    renameTour(this.openTourId, name);
    this.renameRow.classList.remove("visible");
    this.title.textContent = name;
  }

  handleDuplicateTour() {
    const name = this.duplicateName.value.trim();
    if (!name) return;

    const tour = duplicateTour(this.openTourId, name);
    this.duplicateRow.classList.remove("visible");

    if (tour) {
      this.showDetail(tour.id);
    }
  }

  handleCreateDeck() {
    const name = this.newDeckName.value.trim();
    if (!name) return;

    const deckId = createCustomDeck(name);
    this.newDeckRow.classList.remove("visible");
    this.onEditDeck(this.openTourId, deckId);
  }

  handleDeleteDeck(deckId) {
    const deck = decks[deckId];
    if (!deck || !deck.custom) return;

    const confirmed = window.confirm(
      `Delete the chapter "${deck.title}"? This removes it and its photos from every tour. This can't be undone.`
    );
    if (!confirmed) return;

    deleteCustomDeck(deckId);
    this.renderDetail();

    if (this.onDeckDeleted) this.onDeckDeleted();
  }

  handleDeleteTour() {
    const tour = getTour(this.openTourId);
    if (!tour) return;

    const confirmed = window.confirm(`Delete "${tour.name}"? This can't be undone.`);
    if (!confirmed) return;

    deleteTour(this.openTourId);
    this.showList();
  }
}
