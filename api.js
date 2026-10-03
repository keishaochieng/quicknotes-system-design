const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const form = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");

// Shows a message; type is "status-loading", "status-success" or "status-error"
function setStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

// Reusable request: calls fetch, checks response.ok and throws on errors
async function request(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { data: data, status: response.status };
}

function showEmptyMessage() {
  const li = document.createElement("li");
  li.classList.add("empty-message");
  li.textContent = "No notes to show.";
  notesList.appendChild(li);
}

// Builds one note card (user text goes in with textContent only)
function renderNote(note) {
  const li = document.createElement("li");
  li.classList.add("note-card");

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body || "";

  li.append(title, body);
  return li;
}

function renderNotes(notes) {
  notesList.textContent = "";

  if (notes.length === 0) {
    showEmptyMessage();
    return;
  }

  for (const note of notes) {
    notesList.appendChild(renderNote(note));
  }
}

// GET: load 10 notes
async function loadNotes() {
  setStatus("Loading notes...", "status-loading");
  loadBtn.disabled = true;

  try {
    const { data } = await request(`${API_URL}?_limit=10`);
    renderNotes(data);

    if (data.length === 0) {
      setStatus("No notes found on the server.", "status-success");
    } else {
      setStatus(`Loaded ${data.length} notes from the server.`, "status-success");
    }
  } catch (error) {
    console.error(error);
    notesList.textContent = "";
    setStatus("Sorry, we could not load your notes. Please try again.", "status-error");
  } finally {
    loadBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadNotes);
// POST: create a note
async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (title === "") {
    setStatus("Please enter a title.", "status-error");
    return;
  }
  if (title.length > 100) {
    setStatus("The title must be 100 characters or fewer.", "status-error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("Saving note...", "status-loading");

  try {
    const { data, status } = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, body: body, userId: 1 }),
    });

    // Remove the "No notes" message if it is showing
    const emptyMessage = notesList.querySelector(".empty-message");
    if (emptyMessage) {
      emptyMessage.remove();
    }

    notesList.prepend(renderNote(data));
    form.reset();
    setStatus(`Note created (status ${status}, id ${data.id}).`, "status-success");
  } catch (error) {
    console.error(error);
    setStatus("Sorry, we could not create the note. Please try again.", "status-error");
  } finally {
    submitBtn.disabled = false;
  }
}

form.addEventListener("submit", createNote);