function slidePreviewImage(slide) {
  if (slide.type === "comparison") return slide.before;
  return slide.image;
}

function presetsKey(deckId) {
  return `tourPresets_${deckId}`;
}

function activePresetKey(deckId) {
  return `activeTourPreset_${deckId}`;
}

function getPresets(deckId) {
  const raw = localStorage.getItem(presetsKey(deckId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setPresets(deckId, presets) {
  localStorage.setItem(presetsKey(deckId), JSON.stringify(presets));
}

function getActivePresetName(deckId) {
  return localStorage.getItem(activePresetKey(deckId));
}

function setActivePresetName(deckId, name) {
  localStorage.setItem(activePresetKey(deckId), name);
}

function suggestedPresetName() {
  const now = new Date();
  return `I Tatti Tour ${now.getMonth() + 1}/${now.getDate()}/${String(now.getFullYear()).slice(-2)}`;
}

export function applyOrderToSlides(order, slides) {
  const ordered = [];
  const remaining = [...slides];

  order.forEach(savedImage => {
    const matchIndex = remaining.findIndex(slide => slidePreviewImage(slide) === savedImage);

    if (matchIndex !== -1) {
      ordered.push(remaining.splice(matchIndex, 1)[0]);
    }
  });

  return [...ordered, ...remaining];
}

export function resolveDeckSlides(deckId, baseSlides) {
  const activeName = getActivePresetName(deckId);
  if (!activeName) return [...baseSlides];

  const preset = getPresets(deckId).find(p => p.name === activeName);
  if (!preset) return [...baseSlides];

  return applyOrderToSlides(preset.order, baseSlides);
}

export class TourDesigner {
  constructor(story) {
    this.story = story;
    this.active = false;
    this.selectedPresetName = null;

    this.toggleButton = document.getElementById("designerToggle");
    this.panel = document.getElementById("designerPanel");
    this.presetsContainer = document.getElementById("designerPresets");
    this.nameInput = document.getElementById("designerPresetName");
    this.saveNewButton = document.getElementById("designerSaveNew");
    this.saveOverButton = document.getElementById("designerSaveOver");

    this.toggleButton.addEventListener("click", event => {
      event.stopPropagation();
      this.toggle();
    });

    this.saveNewButton.addEventListener("click", event => {
      event.stopPropagation();
      this.saveAsNew();
    });

    this.saveOverButton.addEventListener("click", event => {
      event.stopPropagation();
      this.saveOverSelected();
    });
  }

  get isActive() {
    return this.active;
  }

  toggle() {
    this.active = !this.active;
    this.toggleButton.classList.toggle("active", this.active);
    this.panel.classList.toggle("visible", this.active);
    document.body.classList.toggle("designerMode", this.active);

    if (this.active) {
      this.refreshForCurrentDeck();
    } else {
      this.story.reloadActiveOrder();
    }
  }

  onDeckChanged() {
    if (!this.active) return;
    this.refreshForCurrentDeck();
  }

  refreshForCurrentDeck() {
    this.selectedPresetName = getActivePresetName(this.story.activeDeckId);
    this.nameInput.value = this.selectedPresetName || suggestedPresetName();
    this.renderPresetList();
  }

  renderPresetList() {
    const deckId = this.story.activeDeckId;
    const presets = getPresets(deckId);

    this.presetsContainer.innerHTML = presets.map(preset => `
      <button
        class="designerPresetChip ${preset.name === this.selectedPresetName ? "active" : ""}"
        data-name="${preset.name}"
      >${preset.name}</button>
    `).join("");

    this.saveOverButton.disabled = !this.selectedPresetName;

    Array.from(this.presetsContainer.querySelectorAll(".designerPresetChip")).forEach(chip => {
      chip.addEventListener("click", event => {
        event.stopPropagation();
        this.selectPreset(chip.dataset.name);
      });
    });
  }

  selectPreset(name) {
    const deckId = this.story.activeDeckId;
    const preset = getPresets(deckId).find(p => p.name === name);

    if (!preset) return;

    this.selectedPresetName = name;
    this.nameInput.value = name;
    this.story.applyOrderDraft(preset.order);
    this.renderPresetList();
  }

  saveAsNew() {
    const deckId = this.story.activeDeckId;
    const name = this.nameInput.value.trim();

    if (!name) return;

    const order = this.story.currentOrderSnapshot();
    const presets = getPresets(deckId).filter(p => p.name !== name);

    presets.push({ name, order });

    setPresets(deckId, presets);
    setActivePresetName(deckId, name);

    this.selectedPresetName = name;
    this.renderPresetList();
  }

  saveOverSelected() {
    if (!this.selectedPresetName) {
      this.saveAsNew();
      return;
    }

    const deckId = this.story.activeDeckId;
    const order = this.story.currentOrderSnapshot();
    const presets = getPresets(deckId);
    const index = presets.findIndex(p => p.name === this.selectedPresetName);

    if (index === -1) {
      presets.push({ name: this.selectedPresetName, order });
    } else {
      presets[index] = { name: this.selectedPresetName, order };
    }

    setPresets(deckId, presets);
    setActivePresetName(deckId, this.selectedPresetName);
    this.renderPresetList();
  }
}
