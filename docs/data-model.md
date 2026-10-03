# QuickNotes Data Model

## Entities

### users
| Column | Type | Notes |
|---|---|---|
| user_id | INTEGER | primary key |
| name | TEXT | required |
| email | TEXT | required, unique |
| password_hash | TEXT | required |
| created_at | DATETIME | defaults to the current time |

### notes
| Column | Type | Notes |
|---|---|---|
| note_id | INTEGER | primary key |
| user_id | INTEGER | foreign key to users.user_id, required |
| title | TEXT | required, up to 100 characters |
| body | TEXT | optional |
| created_at | DATETIME | defaults to the current time |
| updated_at | DATETIME | changes when the note is edited |

### tags
| Column | Type | Notes |
|---|---|---|
| tag_id | INTEGER | primary key |
| name | TEXT | required, unique |

### note_tags (join table)
| Column | Type | Notes |
|---|---|---|
| note_id | INTEGER | foreign key to notes.note_id |
| tag_id | INTEGER | foreign key to tags.tag_id |

The primary key of `note_tags` is the pair (`note_id`, `tag_id`), so a note can't have the same tag twice.

## Relationships

- **users to notes: one-to-many.** One user owns many notes, and each note belongs to exactly one user.
- **notes to tags: many-to-many.** A note can have many tags, and a tag can be used on many notes. A single foreign key can only point to one row, so the `note_tags` join table stores one row per note-tag pair.

## CREATE TABLE statements

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE tags (
  tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes (note_id),
  FOREIGN KEY (tag_id) REFERENCES tags (tag_id)
);
```

## Example queries

```sql
-- 1. A user's notes, newest first
SELECT note_id, title, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;

-- 2. All notes with the tag "study" (uses JOINs)
SELECT notes.title, notes.body
FROM notes
JOIN note_tags ON notes.note_id = note_tags.note_id
JOIN tags ON note_tags.tag_id = tags.tag_id
WHERE tags.name = 'study';

-- 3. How many notes each tag has
SELECT tags.name, COUNT(note_tags.note_id) AS note_count
FROM tags
LEFT JOIN note_tags ON tags.tag_id = note_tags.tag_id
GROUP BY tags.tag_id, tags.name;
```

## Index

```sql
CREATE INDEX idx_notes_user_created ON notes (user_id, created_at DESC);
```

The most common request is "show this user's notes, newest first". Without an index the database would scan every note of every user. This index lets it jump to one user's notes already in date order, which stays fast as the table grows to hundreds of millions of rows.

## SQL or NoSQL?

I would choose SQL (for example PostgreSQL). The data is structured and the relationships are important: users own notes, and notes and tags are linked many-to-many. SQL enforces these links with foreign keys and rules such as `UNIQUE`, and it handles joins and counts like "notes per tag" directly. A document database could store each note with its tags inside it, but queries across tags and users would be harder and tag names could end up inconsistent. With 1 million users the load is easily handled by one primary database with read replicas, so we don't need NoSQL's extra scaling flexibility yet.