CREATE TABLE IF NOT EXISTS left_messages (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 4000),
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS left_messages_session_time ON left_messages(session_id, received_at);
CREATE INDEX IF NOT EXISTS left_messages_time ON left_messages(received_at);
