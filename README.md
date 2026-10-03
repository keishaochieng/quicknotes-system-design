# QuickNotes System Design

This project has two parts. The first is a small web client that talks to a real API (the JSONPlaceholder practice API) to load, create and delete notes using fetch. The second is a set of design documents for the real QuickNotes service, which the backend team could build from for 1 million users.

## How to run the API client

1. Clone the repository: `git clone https://github.com/keishaochieng/quicknotes-system-design`
2. Open the folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server** (or open it in a browser).
4. Click **Load notes**, add a note with the form, and delete notes with their Delete buttons.

Note: JSONPlaceholder is a practice API that does not really store changes, so created and deleted notes are not saved on the server.

## Documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- I learnt how fetch, async/await and try/catch handle loading and errors.
- I understood why a join table is needed for a many-to-many relationship.
- I've learnt how caching and read replicas help a read-heavy system.