const STORAGE_KEY = "ace-of-spades-panel-v2";
const MAX_HISTORY = 30;
let deferredInstallPrompt;

const initialState = Object.freeze({
  enemyName: "",
  enemyNumber: 1,
  enemyHealth: 0,
  bullets: 0,
  draws: 0,
});

const limits = {
  enemyHealth: [0, 99],
  bullets: [0, 9],
  draws: [0, 9],
};

const counterKeys = Object.keys(limits);
const outputs = Object.fromEntries(
  counterKeys.map((key) => [key, document.getElementById(`${key}-output`)]),
);
const elements = {
  combatStatus: document.getElementById("combat-status"),
  damageGuideDialog: document.getElementById("damage-guide-dialog"),
  discardButton: document.getElementById("discard-button"),
  enemyName: document.getElementById("enemy-name"),
  encounterNumber: document.getElementById("encounter-number"),
  handDialog: document.getElementById("hand-dialog"),
  handForm: document.getElementById("hand-form"),
  installButton: document.getElementById("install-button"),
  playHandButton: document.getElementById("play-hand-button"),
  renewButton: document.getElementById("renew-button"),
  resetDialog: document.getElementById("reset-dialog"),
  resultBanner: document.getElementById("result-banner"),
  resultKicker: document.getElementById("result-kicker"),
  resultMessage: document.getElementById("result-message"),
  resultTitle: document.getElementById("result-title"),
  setupDialog: document.getElementById("setup-dialog"),
  setupForm: document.getElementById("setup-form"),
  statusMessage: document.getElementById("status-message"),
  undoButton: document.getElementById("undo-button"),
};

let state = loadState();
let history = [];
let statusTimer;
let pendingEnemyNumber = state.enemyNumber;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function toBoundedInteger(value, minimum, maximum, fallback = minimum) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? clamp(number, minimum, maximum) : fallback;
}

function loadState() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) {
    return { ...initialState };
  }

  try {
    const parsedState = JSON.parse(savedState);
    return {
      enemyName: typeof parsedState.enemyName === "string" ? parsedState.enemyName.slice(0, 30) : "",
      enemyNumber: toBoundedInteger(parsedState.enemyNumber, 1, 99, 1),
      enemyHealth: toBoundedInteger(parsedState.enemyHealth, ...limits.enemyHealth),
      bullets: toBoundedInteger(parsedState.bullets, ...limits.bullets),
      draws: toBoundedInteger(parsedState.draws, ...limits.draws),
    };
  } catch (error) {
    console.error("No se pudo recuperar la partida guardada.", error);
    return { ...initialState };
  }
}

function getCombatState() {
  if (!state.enemyName) {
    return "idle";
  }
  if (state.enemyHealth === 0) {
    return "victory";
  }
  if (state.enemyHealth > 0 && state.bullets === 0) {
    return "defeat";
  }
  if (state.enemyHealth > 0) {
    return "active";
  }
  return "idle";
}

function render() {
  counterKeys.forEach((key) => {
    outputs[key].value = state[key];
    outputs[key].textContent = state[key];
  });

  const combatState = getCombatState();
  elements.enemyName.textContent = state.enemyName || "Sin preparar";
  elements.encounterNumber.textContent = `Enemigo ${state.enemyNumber}`;
  elements.undoButton.disabled = history.length === 0;
  elements.playHandButton.disabled = combatState !== "active";
  elements.discardButton.disabled = state.draws === 0 || combatState !== "active";
  elements.renewButton.disabled = state.draws === 0 || combatState !== "active";

  elements.combatStatus.className = `status-badge status-badge--${combatState}`;
  elements.resultBanner.hidden = combatState !== "victory" && combatState !== "defeat";

  if (combatState === "victory") {
    elements.combatStatus.textContent = "Victoria";
    elements.resultKicker.textContent = "Duelo resuelto";
    elements.resultTitle.textContent = "Enemigo derrotado";
    elements.resultMessage.textContent = "Prepara al siguiente enemigo para continuar la escena.";
  } else if (combatState === "defeat") {
    elements.combatStatus.textContent = "Sin jugadas";
    elements.resultKicker.textContent = "Derrota";
    elements.resultTitle.textContent = "Te has quedado sin jugadas";
    elements.resultMessage.textContent = "El enemigo todavía tiene vida. Puedes corregir un contador o iniciar una nueva partida.";
  } else if (combatState === "active") {
    elements.combatStatus.textContent = "Combate en curso";
  } else {
    elements.combatStatus.textContent = "Prepara el combate";
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSnapshot() {
  history.push({ ...state });
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
}

function commitState(nextState, message) {
  if (JSON.stringify(nextState) === JSON.stringify(state)) {
    showStatus("No hay cambios");
    return false;
  }

  saveSnapshot();
  state = nextState;
  render();
  showStatus(message);
  return true;
}

function updateCounters(changes, message) {
  const nextState = { ...state };
  Object.entries(changes).forEach(([key, value]) => {
    const [minimum, maximum] = limits[key];
    nextState[key] = clamp(value, minimum, maximum);
  });

  if (!commitState(nextState, message)) {
    showStatus("Límite alcanzado");
  }
}

function showStatus(message) {
  window.clearTimeout(statusTimer);
  elements.statusMessage.textContent = message;
  statusTimer = window.setTimeout(() => {
    elements.statusMessage.textContent = "";
  }, 2200);
}

function openSetupDialog(enemyNumber = state.enemyNumber) {
  pendingEnemyNumber = enemyNumber;
  document.getElementById("setup-name").value = enemyNumber === state.enemyNumber ? state.enemyName : "";
  document.getElementById("setup-health").value = enemyNumber === state.enemyNumber ? state.enemyHealth || 20 : 20;
  document.getElementById("setup-bullets").value = enemyNumber === state.enemyNumber ? state.bullets || 6 : 6;
  document.getElementById("setup-draws").value = enemyNumber === state.enemyNumber ? state.draws || 2 : 2;
  elements.setupDialog.showModal();
}

function calculateDamage() {
  const handDamage = toBoundedInteger(document.getElementById("hand-type").value, 1, 12, 1);
  const figures = toBoundedInteger(document.getElementById("figure-bonus").value, 0, 5);
  const aces = toBoundedInteger(document.getElementById("ace-bonus").value, 0, 5);
  const otherBonus = toBoundedInteger(document.getElementById("other-bonus").value, 0, 99);
  return handDamage + figures + (aces * 3) + otherBonus;
}

function updateDamagePreview() {
  const figuresInput = document.getElementById("figure-bonus");
  const acesInput = document.getElementById("ace-bonus");
  const figures = toBoundedInteger(figuresInput.value, 0, 5);
  const aces = toBoundedInteger(acesInput.value, 0, 5);
  const hasTooManyCards = figures + aces > 5;
  acesInput.setCustomValidity(hasTooManyCards ? "Una jugada solo puede contener cinco cartas." : "");

  const damage = calculateDamage();
  document.getElementById("damage-preview").value = damage;
  document.getElementById("damage-preview").textContent = damage;
}

function useDiscardAction(message) {
  if (state.draws === 0 || getCombatState() !== "active") {
    showStatus("No puedes realizar esta acción");
    return;
  }
  updateCounters({ draws: state.draws - 1 }, message);
}

document.addEventListener("click", (event) => {
  const changeButton = event.target.closest("[data-action='change']");
  if (changeButton) {
    const counter = changeButton.dataset.counter;
    const amount = Number(changeButton.dataset.amount);
    updateCounters({ [counter]: state[counter] + amount }, "Contador corregido");
    return;
  }

  const closeButton = event.target.closest("[data-close-dialog]");
  if (closeButton) {
    document.getElementById(closeButton.dataset.closeDialog).close();
  }
});

elements.setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!elements.setupForm.reportValidity()) {
    return;
  }

  const data = new FormData(elements.setupForm);
  const nextState = {
    ...state,
    enemyName: String(data.get("enemyName")).trim().slice(0, 30) || `Enemigo ${pendingEnemyNumber}`,
    enemyNumber: pendingEnemyNumber,
    enemyHealth: toBoundedInteger(data.get("enemyHealth"), 1, 99, 20),
    bullets: toBoundedInteger(data.get("bullets"), 1, 9, 6),
    draws: toBoundedInteger(data.get("draws"), 0, 9, 2),
  };
  commitState(nextState, "Enemigo preparado");
  elements.setupDialog.close();
});

elements.handForm.addEventListener("input", updateDamagePreview);
elements.handForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!elements.handForm.reportValidity()) {
    return;
  }
  if (getCombatState() !== "active") {
    elements.handDialog.close();
    showStatus("No hay un combate activo");
    return;
  }

  const damage = calculateDamage();
  const nextHealth = Math.max(0, state.enemyHealth - damage);
  commitState(
    { ...state, enemyHealth: nextHealth, bullets: state.bullets - 1 },
    `${damage} puntos de daño`,
  );
  elements.handDialog.close();
});

elements.playHandButton.addEventListener("click", () => {
  elements.handForm.reset();
  updateDamagePreview();
  elements.handDialog.showModal();
});

elements.discardButton.addEventListener("click", () => {
  useDiscardAction("Has descartado y robado hasta 8 cartas");
});

elements.renewButton.addEventListener("click", () => {
  useDiscardAction("Mazo renovado y barajado");
});

document.getElementById("setup-button").addEventListener("click", () => openSetupDialog());
document.getElementById("damage-guide-button").addEventListener("click", () => {
  elements.damageGuideDialog.showModal();
});
document.getElementById("next-enemy-button").addEventListener("click", () => {
  openSetupDialog(state.enemyNumber + 1);
});

elements.undoButton.addEventListener("click", () => {
  const previousState = history.pop();
  if (!previousState) {
    return;
  }
  state = previousState;
  render();
  showStatus("Cambio deshecho");
});

document.getElementById("reset-button").addEventListener("click", () => {
  elements.resetDialog.showModal();
});

document.getElementById("confirm-reset").addEventListener("click", () => {
  saveSnapshot();
  state = { ...initialState };
  render();
  showStatus("Nueva partida iniciada");
});

function updateConnectionStatus() {
  const isOnline = navigator.onLine;
  document.getElementById("connection-dot").classList.toggle("connection-dot--offline", !isOnline);
  document.getElementById("connection-status").textContent = isOnline
    ? "Guardado local · disponible sin conexión"
    : "Sin conexión · la app sigue disponible";
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  elements.installButton.hidden = false;
});

elements.installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    showStatus("Usa el menú del navegador para instalar");
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = undefined;
  elements.installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = undefined;
  elements.installButton.hidden = true;
  showStatus("Aplicación instalada");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (error) {
      console.error("No se pudo activar el funcionamiento sin conexión.", error);
      showStatus("No se pudo activar el modo offline");
    }
  });
}

updateDamagePreview();
updateConnectionStatus();
render();
