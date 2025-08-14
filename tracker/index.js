const express = require('express');
const app = express();
app.use(express.json({ limit: '256kb' }));

const DEFAULT_PORT = process.env.TRACKER_PORT ? parseInt(process.env.TRACKER_PORT, 10) : 8080;

// Simple in-memory event store to avoid DB setup during tests/demo
const inMemoryEvents = [];
let nextEventId = 1;

app.get('/', (_req, res) => {
  res.send('tracker:OK');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// List events
app.get('/events', async (_req, res) => {
  try {
    const latest = inMemoryEvents
      .slice()
      .sort((a, b) => b.id - a.id)
      .slice(0, 50);
    res.json(latest);
  } catch (e) {
    console.error('[tracker] /events error', e);
    res.status(500).json({ error: 'failed_list_events' });
  }
});

// Create event
app.post('/events', async (req, res) => {
  const { type, payload } = req.body || {};
  if (!type || typeof type !== 'string') return res.status(400).json({ error: 'type_required' });
  try {
    const created = {
      id: nextEventId++,
      createdAt: new Date().toISOString(),
      type,
      payload: payload ? JSON.stringify(payload) : null,
    };
    inMemoryEvents.push(created);
    res.status(201).json(created);
  } catch (e) {
    console.error('[tracker] /events create error', e);
    res.status(500).json({ error: 'failed_create_event' });
  }
});

app
  .listen(DEFAULT_PORT, () => {
    console.log(`[tracker] listening on ${DEFAULT_PORT}`);
  })
  .on('error', (err) => {
    console.error('[tracker] failed to start', err);
    process.exit(1);
  });
