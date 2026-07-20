const TOURS_KEY = "tours";
const CURRENT_TOUR_KEY = "currentTourId";

function slidePreviewImage(slide) {
  if (slide.type === "comparison") return slide.before;
  return slide.image;
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

export function getTours() {
  const raw = localStorage.getItem(TOURS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTours(tours) {
  localStorage.setItem(TOURS_KEY, JSON.stringify(tours));
}

export function getCurrentTourId() {
  return localStorage.getItem(CURRENT_TOUR_KEY);
}

export function setCurrentTourId(id) {
  if (id) {
    localStorage.setItem(CURRENT_TOUR_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_TOUR_KEY);
  }
}

export function getTour(id) {
  return getTours().find(tour => tour.id === id) || null;
}

export function getCurrentTour() {
  const id = getCurrentTourId();
  if (!id) return null;
  return getTour(id);
}

function generateTourId() {
  return `tour_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createTour(name) {
  const tours = getTours();

  const tour = {
    id: generateTourId(),
    name,
    updatedAt: Date.now(),
    deckOrders: {},
    hiddenSlides: {}
  };

  tours.push(tour);
  saveTours(tours);

  return tour;
}

export function duplicateTour(id, newName) {
  const source = getTour(id);
  if (!source) return null;

  const tour = {
    id: generateTourId(),
    name: newName,
    updatedAt: Date.now(),
    deckOrders: { ...source.deckOrders },
    hiddenSlides: { ...(source.hiddenSlides || {}) }
  };

  const tours = getTours();
  tours.push(tour);
  saveTours(tours);

  return tour;
}

export function renameTour(id, newName) {
  const tours = getTours();
  const tour = tours.find(t => t.id === id);

  if (!tour) return;

  tour.name = newName;
  tour.updatedAt = Date.now();
  saveTours(tours);
}

export function deleteTour(id) {
  const tours = getTours().filter(tour => tour.id !== id);
  saveTours(tours);

  if (getCurrentTourId() === id) {
    setCurrentTourId(null);
  }
}

export function updateDeckOrder(tourId, deckId, order) {
  const tours = getTours();
  const tour = tours.find(t => t.id === tourId);

  if (!tour) return;

  tour.deckOrders[deckId] = order;
  tour.updatedAt = Date.now();
  saveTours(tours);
  setCurrentTourId(tourId);
}

export function clearDeckOrder(tourId, deckId) {
  const tours = getTours();
  const tour = tours.find(t => t.id === tourId);

  if (!tour) return;

  delete tour.deckOrders[deckId];
  tour.updatedAt = Date.now();
  saveTours(tours);
}

export function getHiddenSlides(tourId, deckId) {
  const tour = getTour(tourId);
  return (tour && tour.hiddenSlides && tour.hiddenSlides[deckId]) || [];
}

export function toggleHiddenSlide(tourId, deckId, imageKey) {
  const tours = getTours();
  const tour = tours.find(t => t.id === tourId);

  if (!tour) return;

  if (!tour.hiddenSlides) tour.hiddenSlides = {};
  if (!tour.hiddenSlides[deckId]) tour.hiddenSlides[deckId] = [];

  const hidden = tour.hiddenSlides[deckId];
  const index = hidden.indexOf(imageKey);

  if (index === -1) {
    hidden.push(imageKey);
  } else {
    hidden.splice(index, 1);
  }

  tour.updatedAt = Date.now();
  saveTours(tours);
}

export function clearHiddenSlides(tourId, deckId) {
  const tours = getTours();
  const tour = tours.find(t => t.id === tourId);

  if (!tour || !tour.hiddenSlides) return;

  delete tour.hiddenSlides[deckId];
  tour.updatedAt = Date.now();
  saveTours(tours);
}

export function resolveDeckSlides(deckId, baseSlides) {
  const tour = getCurrentTour();
  const order = tour && tour.deckOrders[deckId];
  const ordered = order ? applyOrderToSlides(order, baseSlides) : [...baseSlides];

  const hidden = (tour && tour.hiddenSlides && tour.hiddenSlides[deckId]) || [];
  if (!hidden.length) return ordered;

  return ordered.filter(slide => !hidden.includes(slidePreviewImage(slide)));
}
