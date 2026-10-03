# QuickNotes API Design

A REST API for the real QuickNotes service. All paths start with `/api/v1`, and requests and responses use JSON. Every endpoint except login needs a valid token in the `Authorization: Bearer <token>` header.

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Log in with email and password and receive a token | 200 OK |
| GET | `/api/v1/notes` | List the logged-in user's notes (supports `?tag=` and `?page=`) | 200 OK |
| GET | `/api/v1/notes/{id}` | Get one note | 200 OK |
| POST | `/api/v1/notes` | Create a note | 201 Created |
| PUT | `/api/v1/notes/{id}` | Replace the title, body and tags of a note | 200 OK |
| DELETE | `/api/v1/notes/{id}` | Delete a note | 204 No Content |
| GET | `/api/v1/tags` | List all tags | 200 OK |

## Examples

### Create a note: `POST /api/v1/notes`

Request body:

```json
{
  "title": "Buy milk",
  "body": "Two litres of fresh milk",
  "tags": ["personal", "shopping"]
}
```

Response (`201 Created`):

```json
{
  "id": 101,
  "title": "Buy milk",
  "body": "Two litres of fresh milk",
  "tags": ["personal", "shopping"],
  "userId": 1,
  "createdAt": "2026-10-03T09:30:00Z"
}
```

### List notes: `GET /api/v1/notes?page=1`

Response (`200 OK`):

```json
{
  "page": 1,
  "total": 2,
  "notes": [
    {
      "id": 101,
      "title": "Buy milk",
      "body": "Two litres of fresh milk",
      "tags": ["personal", "shopping"],
      "createdAt": "2026-10-03T09:30:00Z"
    },
    {
      "id": 100,
      "title": "Revise JavaScript",
      "body": "Arrays and fetch",
      "tags": ["study"],
      "createdAt": "2026-10-02T18:10:00Z"
    }
  ]
}
```

## Error status codes

Errors use the same JSON shape:

```json
{
  "error": {
    "code": 400,
    "message": "The title is required and must be 100 characters or fewer."
  }
}
```

- **400 Bad Request:** the request is invalid. Example: `POST /notes` without a title, or with a title of 150 characters.
- **401 Unauthorized:** the user isn't logged in. Example: a request with no token, or an expired token.
- **403 Forbidden:** the user is logged in but isn't allowed to do this. Example: trying to delete a note that belongs to another user.
- **404 Not Found:** the resource doesn't exist. Example: `GET /notes/9999` when no note has that id.
- **500 Internal Server Error:** something went wrong on the server. Example: the database is unreachable while saving a note.