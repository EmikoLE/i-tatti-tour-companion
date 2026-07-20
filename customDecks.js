import { decks } from "./decks.js?v=1";
import { generateImageId, saveImage, deleteImage, detectOrientation } from "./imageStore.js?v=1";

const CUSTOM_KEY = "customContent";

function loadRaw() {
  const raw = localStorage.getItem(CUSTOM_KEY);
  if (!raw) return { decks: {}, addedSlides: {} };

  try {
    const parsed = JSON.parse(raw);

    return {
      decks: parsed.decks && typeof parsed.decks === "object" ? parsed.decks : {},
      addedSlides: parsed.addedSlides && typeof parsed.addedSlides === "object" ? parsed.addedSlides : {}
    };
  } catch {
    return { decks: {}, addedSlides: {} };
  }
}

function saveRaw(data) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(data));
}

export function initCustomContent() {
  const data = loadRaw();

  Object.keys(data.decks).forEach(deckId => {
    decks[deckId] = { ...data.decks[deckId], slides: [] };
  });

  Object.keys(data.addedSlides).forEach(deckId => {
    if (!decks[deckId]) return;
    decks[deckId].slides = [...decks[deckId].slides, ...data.addedSlides[deckId]];
  });
}

export function createCustomDeck(name) {
  const data = loadRaw();
  const id = `deck_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  data.decks[id] = { title: name, cover: null, custom: true };
  saveRaw(data);

  decks[id] = { title: name, cover: null, custom: true, slides: [] };

  return id;
}

export async function addImageToDeck(deckId, file) {
  if (!decks[deckId]) return null;

  const orientation = await detectOrientation(file);
  const imageId = generateImageId();

  await saveImage(imageId, file);

  const slide = { type: "image", image: imageId, orientation, custom: true };

  const data = loadRaw();

  if (!data.addedSlides[deckId]) data.addedSlides[deckId] = [];
  data.addedSlides[deckId].push(slide);

  const deck = decks[deckId];

  if (deck.custom && data.decks[deckId] && !data.decks[deckId].cover) {
    data.decks[deckId].cover = imageId;
  }

  saveRaw(data);

  deck.slides.push(slide);
  if (deck.custom && !deck.cover) deck.cover = imageId;

  return slide;
}

export async function removeImageFromDeck(deckId, imageKey) {
  const deck = decks[deckId];
  if (!deck) return;

  const data = loadRaw();

  if (data.addedSlides[deckId]) {
    data.addedSlides[deckId] = data.addedSlides[deckId].filter(slide => slide.image !== imageKey);
  }

  deck.slides = deck.slides.filter(slide => !(slide.image === imageKey && slide.custom));

  if (deck.custom && deck.cover === imageKey) {
    const nextCustomSlide = deck.slides.find(slide => slide.custom);
    const nextCover = nextCustomSlide ? nextCustomSlide.image : null;

    deck.cover = nextCover;
    if (data.decks[deckId]) data.decks[deckId].cover = nextCover;
  }

  saveRaw(data);

  await deleteImage(imageKey);
}

export async function deleteCustomDeck(deckId) {
  const deck = decks[deckId];
  if (!deck || !deck.custom) return;

  const data = loadRaw();
  const imageKeys = (data.addedSlides[deckId] || []).map(slide => slide.image);

  delete data.decks[deckId];
  delete data.addedSlides[deckId];
  saveRaw(data);

  delete decks[deckId];

  await Promise.all(imageKeys.map(key => deleteImage(key)));
}
