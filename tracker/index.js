const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
app.use(express.json({ limit: '256kb' }));
const prisma = new PrismaClient();

const DEFAULT_PORT = process.env.TRACKER_PORT ? parseInt(process.env.TRACKER_PORT, 10) : 8080;

app.get('/', (_req, res) => {
  res.send('tracker:OK');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// List events
app.get('/events', async (_req, res) => {
  try {
    const events = await prisma.eventLog.findMany({ orderBy: { id: 'desc' }, take: 50 });
    res.json(events);
  } catch (e) {
    console.error('[tracker] /events error', e);
    res.status(500).json({ error: 'failed_list_events' });
  }
});

// Create event
app.post('/events', async (req, res) => {
  const { type, payload } = req.body || {};
  if(!type || typeof type !== 'string') return res.status(400).json({ error: 'type_required' });
  try {
    const created = await prisma.eventLog.create({ data: { type, payload: payload ? JSON.stringify(payload) : null } });
    res.status(201).json(created);
  } catch (e) {
    console.error('[tracker] /events create error', e);
    res.status(500).json({ error: 'failed_create_event' });
  }
});

function start(port, attemptsLeft) {
  const server = app.listen(port, () => {
    console.log(`[tracker] listening on ${port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`[tracker] port ${port} in use, trying ${port + 1}`);
      start(port + 1, attemptsLeft - 1);
    } else {
      console.error('[tracker] failed to start', err);
      process.exit(1);
    }
  });
}

start(DEFAULT_PORT, 5);
