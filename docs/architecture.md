# QuickNotes Architecture

## 1. Requirements

### Functional
- Users can register and log in.
- Users can create, view, edit and delete their notes.
- Users can tag notes and filter by tag.
- Notes are saved online and available from any device.

### Non-functional
- **Availability:** the service should stay up even if one server fails (target 99.9%).
- **Performance:** listing notes should respond in under 300 ms.
- **Scalability:** it must handle 1 million users and grow.
- **Durability:** saved notes must never be lost (backups and replication).
- **Security:** passwords are hashed, traffic uses HTTPS, and users see only their own notes.

## 2. Load estimate for 1 million users

Assumptions: 1,000,000 registered users; 20% active per day (200,000); each active user opens their notes list 20 times a day and creates 5 notes a day; an average note takes 2 KB; one day has 86,400 seconds; peak is 5x the average.

- **Reads:** 200,000 x 20 = 4,000,000 per day / 86,400 = about **46 reads per second** on average, **about 231 per second** at peak.
- **Writes:** 200,000 x 5 = 1,000,000 per day / 86,400 = about **11.6 writes per second** on average, **about 58 per second** at peak.
- **Storage per year:** 1,000,000 notes x 2 KB = 2 GB per day; x 365 = about **730 GB per year** (a little more with indexes).
- **Read or write heavy?** Reads outnumber writes about 4 to 1, so the system is read-heavy.

## 3. Architecture diagram

```text
Client (browser / phone)
   |
   v
  DNS
   |
   v
  CDN  (static files: HTML, CSS, JS)
   |
   v
Load balancer
   |
   +--------------+--------------+
   v              v              v
App server 1   App server 2   App server N
   |   \           |           /   \
   |    +----------+----------+     +--> Queue --> Worker
   |               |                      (search index, emails, backups)
   v               v
 Cache         Primary database --replication--> Read replica
(hot notes)     (all writes)                     (read queries)
```

## 4. What each component does

- **Client:** the browser or phone app where the user reads and writes notes.
- **DNS:** turns the name quicknotes.example into the address of our service so users can find it.
- **CDN:** serves static files from servers near the user, so pages load fast and our servers carry less traffic.
- **Load balancer:** spreads requests across the app servers and stops sending traffic to a server that fails.
- **App servers (two or more):** run the API logic, and having several means one can fail or be upgraded without downtime.
- **Cache:** keeps recently read notes in memory so most reads never reach the database.
- **Primary database:** the single source of truth that handles every write and keeps data consistent.
- **Read replica:** a live copy of the database that answers read queries and takes load off the primary.
- **Queue:** holds background jobs so the API can reply quickly without waiting for slow work.
- **Worker:** takes jobs from the queue and does them, such as updating the search index or sending emails.

## 5. Request flows

### GET /notes
1. The client looks up the address through DNS and sends the request over HTTPS.
2. The load balancer sends it to one of the app servers.
3. The app server checks the token (401 if missing or invalid).
4. It looks for the user's notes in the cache.
5. On a cache hit, it returns them at once.
6. On a miss, it reads from the read replica, stores the result in the cache, and returns `200 OK` with the notes.

### POST /notes
1. The client sends the new note through DNS and the load balancer to an app server.
2. The app server checks the token and validates the data (400 if the title is missing or too long).
3. It saves the note in the primary database.
4. It clears that user's cached note list, so the next read is fresh.
5. It puts a background job on the queue (for example, update the search index).
6. It returns `201 Created` with the new note, without waiting for the job.
7. The database copies the change to the read replica, and a worker later finishes the queued job.

## 6. Trade-offs

- **Cache speed vs fresh data:** the cache makes reads fast, but cached data can be out of date. We reduce this by clearing a user's cache when they write, at the cost of extra work on each write.
- **Read replica vs consistency:** the replica takes read load off the primary, but it can lag by a moment behind it. Right after a user creates a note, their next read may need to come from the primary so they see it.
- **Queue vs instant results:** background jobs keep the API fast, but their results (such as search) appear a little later, and the queue and workers are more parts to run and monitor.

## 7. Avoiding single points of failure

- **App servers:** at least two behind the load balancer, so one failure doesn't stop the service.
- **Load balancer:** run as a redundant pair, so one failing doesn't cut off all traffic.
- **Database:** the primary has a read replica that can be promoted automatically if the primary fails, and backups are taken regularly.
- **Cache:** run as a small cluster, and if it fails the app can still read from the database, only more slowly.
- **Queue and workers:** the queue stores jobs safely, and several workers run so one failure doesn't stop processing.
- **DNS and CDN:** both are spread across many locations by their providers, so there isn't one machine to fail.