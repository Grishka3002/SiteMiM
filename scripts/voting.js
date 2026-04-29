const voteRoot = document.getElementById("vote-root");
const voteStatus = document.getElementById("vote-status");
const voteAuthForm = document.getElementById("vote-auth-form");
const voteTicketQueryInput = document.getElementById("vote-ticket-query");
const voteTicketResult = document.getElementById("vote-ticket-result");

if (voteRoot) {
  initVoting();
}

async function fetchJson(url, options) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed: ${response.status}`);
    error.payload = payload;
    throw error;
  }

  return payload;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function countVotes(votes, candidateId) {
  return votes.filter((vote) => vote.boyId === candidateId || vote.girlId === candidateId).length;
}

function getStatusText(selection, activeTicket, isSaving = false) {
  if (!activeTicket) {
    return "Введите номер билета или место, чтобы открыть голосование.";
  }

  if (isSaving) {
    return "Сохраняем голос...";
  }

  if (selection.girlId && selection.boyId) {
    return "Голос сохранён. Один билет даёт 1 голос за девушку и 1 голос за парня.";
  }

  if (selection.girlId) {
    return "Осталось выбрать одного парня для номинации Вице-мистер.";
  }

  if (selection.boyId) {
    return "Осталось выбрать одну девушку для номинации Вице-мисс.";
  }

  return "Выберите одну девушку и одного парня.";
}

function getTicketLabel(ticket) {
  if (!ticket) {
    return "";
  }

  return `${ticket.code} · ${ticket.seatDisplayLabel || ticket.seatLabel}`;
}

function getTicketErrorText(error) {
  if (error?.payload?.error === "ticket_not_checked_in") {
    const ticketLabel = getTicketLabel(error.payload.ticket);
    return ticketLabel
      ? `Билет найден: ${ticketLabel}. Голосование откроется после отметки входа.`
      : "Билет найден, но вход ещё не отмечен.";
  }

  return "Билет не найден. Проверьте номер билета или место.";
}

function renderGroup({ title, key, candidates, selection, votes, locked }) {
  if (!candidates.length) {
    return `
      <section class="vote-group">
        <div class="vote-group__heading">
          <h3>${title}</h3>
          <span>0 фото</span>
        </div>
        <p class="vote-empty">Добавьте фото в папку images/voting/${key}.</p>
      </section>
    `;
  }

  return `
    <section class="vote-group ${locked ? "is-locked" : ""}">
      <div class="vote-group__heading">
        <h3>${title}</h3>
        <span>${candidates.length} кандидатов</span>
      </div>
      <div class="vote-list">
        ${candidates
          .map((candidate) => {
            const selectionKey = key === "girls" ? "girlId" : "boyId";
            const isSelected = selection[selectionKey] === candidate.id;
            return `
              <button
                type="button"
                class="vote-card ${isSelected ? "is-selected" : ""}"
                data-vote-group="${key}"
                data-vote-id="${escapeHtml(candidate.id)}"
                aria-pressed="${isSelected ? "true" : "false"}"
                ${locked ? "disabled" : ""}
              >
                <img src="${candidate.image}" alt="${escapeHtml(candidate.name)}" loading="lazy" />
                <span class="vote-card__caption">${escapeHtml(candidate.name)}</span>
                <span class="vote-card__meta">${countVotes(votes, candidate.id)} голосов</span>
              </button>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

async function saveVote(selection, activeTicketQuery) {
  if (!selection.girlId || !selection.boyId || !activeTicketQuery) {
    return null;
  }

  return fetchJson("/api/votes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ticketQuery: activeTicketQuery,
      girlId: selection.girlId,
      boyId: selection.boyId
    })
  });
}

async function verifyTicket(ticketQuery) {
  return fetchJson("/api/vote-ticket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ticketQuery })
  });
}

async function initVoting() {
  let candidates = { girls: [], boys: [] };
  let votesState = { votes: [] };
  let selection = { girlId: "", boyId: "" };
  let activeTicket = null;
  let activeTicketQuery = "";

  const render = () => {
    voteRoot.innerHTML = `
      ${renderGroup({
        title: "Вице-мисс",
        key: "girls",
        candidates: candidates.girls,
        selection,
        votes: votesState.votes,
        locked: !activeTicket
      })}
      ${renderGroup({
        title: "Вице-мистер",
        key: "boys",
        candidates: candidates.boys,
        selection,
        votes: votesState.votes,
        locked: !activeTicket
      })}
    `;

    if (voteStatus) {
      voteStatus.textContent = getStatusText(selection, activeTicket);
    }
  };

  try {
    [candidates, votesState] = await Promise.all([
      fetchJson("/api/vote-candidates"),
      fetchJson("/api/votes")
    ]);
    render();
  } catch (error) {
    console.error(error);
    voteRoot.innerHTML = '<p class="vote-empty">Не удалось загрузить голосование. Обновите страницу.</p>';
  }

  voteAuthForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ticketQuery = String(voteTicketQueryInput?.value || "").trim();

    if (!ticketQuery) {
      return;
    }

    if (voteTicketResult) {
      voteTicketResult.textContent = "Проверяем билет...";
      voteTicketResult.classList.remove("is-error");
    }

    try {
      const result = await verifyTicket(ticketQuery);
      activeTicket = result.ticket;
      activeTicketQuery = ticketQuery;
      selection = {
        girlId: result.vote?.girlId || "",
        boyId: result.vote?.boyId || ""
      };

      if (voteTicketResult) {
        voteTicketResult.textContent = `Билет найден: ${getTicketLabel(activeTicket)}`;
        voteTicketResult.classList.remove("is-error");
      }

      render();
    } catch (error) {
      console.error(error);
      activeTicket = null;
      activeTicketQuery = "";
      selection = { girlId: "", boyId: "" };

      if (voteTicketResult) {
        voteTicketResult.textContent = getTicketErrorText(error);
        voteTicketResult.classList.add("is-error");
      }

      render();
    }
  });

  voteRoot.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-vote-group][data-vote-id]");
    if (!card || !activeTicket) return;

    const group = card.dataset.voteGroup;
    const candidateId = card.dataset.voteId;
    if (group === "girls") {
      selection = { ...selection, girlId: candidateId };
    } else if (group === "boys") {
      selection = { ...selection, boyId: candidateId };
    }

    render();

    if (!selection.girlId || !selection.boyId) {
      return;
    }

    if (voteStatus) {
      voteStatus.textContent = getStatusText(selection, activeTicket, true);
    }

    try {
      const result = await saveVote(selection, activeTicketQuery);
      votesState = { votes: result.votes || [] };
      activeTicket = result.ticket || activeTicket;
      render();
    } catch (error) {
      console.error(error);
      if (voteStatus) {
        voteStatus.textContent = "Не удалось сохранить голос. Проверьте билет и попробуйте ещё раз.";
      }
    }
  });
}
