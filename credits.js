export class Credits {
  constructor() {
    this.section = document.getElementById("creditsScreen");
    this.closeButton = document.getElementById("creditsClose");

    this.closeButton.addEventListener("click", event => {
      event.stopPropagation();
      this.close();
    });
  }

  get isOpen() {
    return this.section.classList.contains("visible");
  }

  open() {
    this.section.classList.add("visible");
    document.body.classList.add("creditsOpen");
  }

  close() {
    this.section.classList.remove("visible");
    document.body.classList.remove("creditsOpen");
  }
}
