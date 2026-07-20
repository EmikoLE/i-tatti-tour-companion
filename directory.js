import { decks } from "./decks.js?v=1";

const A = "assets/";

export class Directory {
  constructor() {
    this.directoryScreen = document.getElementById("directoryScreen");
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
    ["garden", "sassetta", "living", "today"].forEach(packId => {
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
          onLaunch(pack);
        }
      });
    });
  }
}
