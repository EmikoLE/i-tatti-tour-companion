import { decks } from "./decks.js?v=1";
import { resolveAssetUrl } from "./imageStore.js?v=1";

export class Directory {
  constructor() {
    this.directoryScreen = document.getElementById("directoryScreen");
    this.bookGrid = document.getElementById("bookGrid");
    this.onLaunch = null;
  }

  get isOpen() {
    return this.directoryScreen.classList.contains("visible");
  }

  open() {
    this.directoryScreen.classList.add("visible");
    document.body.classList.add("directoryOpen");
  }

  close() {
    this.directoryScreen.classList.remove("visible");
    document.body.classList.remove("directoryOpen");
  }

  setup(onLaunch) {
    this.onLaunch = onLaunch;

    ["garden", "sassetta", "living", "today"].forEach(packId => {
      const card = document.querySelector(`.bookCard[data-pack="${packId}"]`);

      if (card && decks[packId]) {
        card.classList.remove("placeholder");

        if (!card.querySelector("img")) {
          card.insertAdjacentHTML("afterbegin", `<img src="${resolveAssetUrl(decks[packId].cover, false)}" alt="">`);
        }
      }
    });

    this.refreshCustomDecks();
  }

  refreshCustomDecks() {
    Object.keys(decks).forEach(deckId => {
      const deck = decks[deckId];
      if (!deck.custom) return;

      let card = document.querySelector(`.bookCard[data-pack="${deckId}"]`);

      if (!card) {
        card = document.createElement("button");
        card.className = "bookCard";
        card.dataset.pack = deckId;
        card.innerHTML = `<span>${deck.title}</span>`;
        this.bookGrid.appendChild(card);
      }

      const hasCover = Boolean(deck.cover);
      card.classList.toggle("placeholder", !hasCover);

      const existingImg = card.querySelector("img");

      if (!hasCover && existingImg) {
        existingImg.remove();
      } else if (hasCover) {
        const coverUrl = resolveAssetUrl(deck.cover, true);

        if (existingImg) {
          if (existingImg.src !== coverUrl) existingImg.src = coverUrl;
        } else {
          card.insertAdjacentHTML("afterbegin", `<img src="${coverUrl}" alt="">`);
        }
      }
    });

    Array.from(this.bookGrid.querySelectorAll(".bookCard")).forEach(card => {
      if (!decks[card.dataset.pack]) card.remove();
    });

    this.bindCardClicks();
  }

  bindCardClicks() {
    document.querySelectorAll(".bookCard").forEach(card => {
      if (card.dataset.bound === "1") return;
      card.dataset.bound = "1";

      card.addEventListener("click", event => {
        event.stopPropagation();

        const pack = card.dataset.pack;

        if (decks[pack] && this.onLaunch) {
          this.onLaunch(pack);
        }
      });
    });
  }
}
