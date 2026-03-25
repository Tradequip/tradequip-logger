/**
 * TradeQuip – Backend API Server
 * Handles all data storage in PostgreSQL
 * Runs on Railway — connects app to database
 */

const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:xZgImDQHXLNOSutWQGdJtReTBiEcQzoQ@crossover.proxy.rlwy.net:20741/railway',
  ssl: { rejectUnauthorized: false }
});

const PORT = process.env.PORT || 3000;

// ── CORS HEADERS ──────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url.split('?')[0];
  const method = req.method;

  try {

    // ── WORKERS ──────────────────────────────────────────────────────────────
    if (url === '/api/workers' && method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM workers ORDER BY fname, lname');
      return json(res, rows);
    }

    if (url === '/api/workers' && method === 'POST') {
      const b = await getBody(req);
      const { rows } = await pool.query(
        `INSERT INTO workers (id, fname, lname, type, role, phone, email, client_id, pin)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           fname=$2, lname=$3, type=$4, role=$5, phone=$6, email=$7, client_id=$8, pin=$9
         RETURNING *`,
        [b.id, b.fname, b.lname, b.type, b.role, b.phone, b.email, b.client_id, b.pin]
      );
      return json(res, rows[0]);
    }

    if (url.startsWith('/api/workers/') && method === 'DELETE') {
      const id = url.split('/')[3];
      await pool.query('DELETE FROM workers WHERE id=$1', [id]);
      return json(res, { success: true });
    }

    // ── CLIENTS ──────────────────────────────────────────────────────────────
    if (url === '/api/clients' && method === 'GET') {
      const { rows: clients } = await pool.query('SELECT * FROM clients ORDER BY name');
      const { rows: sites } = await pool.query('SELECT * FROM sites ORDER BY name');
      const result = clients.map(c => ({
        ...c,
        sites: sites.filter(s => s.client_id === c.id)
      }));
      return json(res, result);
    }

    if (url === '/api/clients' && method === 'POST') {
      const b = await getBody(req);
      await pool.query(
        `INSERT INTO clients (id, name, contact, phone, email)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO UPDATE SET name=$2, contact=$3, phone=$4, email=$5`,
        [b.id, b.name, b.contact, b.phone, b.email]
      );
      // Delete old sites for this client and re-insert
      await pool.query('DELETE FROM sites WHERE client_id=$1', [b.id]);
      if (b.sites && b.sites.length) {
        for (const s of b.sites) {
          await pool.query(
            `INSERT INTO sites (id, client_id, name, lat, lng, radius) VALUES ($1,$2,$3,$4,$5,$6)`,
            [s.id, b.id, s.name, s.lat, s.lng, s.r || s.radius || 15]
          );
        }
      }
      return json(res, { success: true });
    }

    if (url.startsWith('/api/clients/') && method === 'DELETE') {
      const id = url.split('/')[3];
      await pool.query('DELETE FROM clients WHERE id=$1', [id]);
      return json(res, { success: true });
    }

    // ── SUBMISSIONS ───────────────────────────────────────────────────────────
    if (url === '/api/submissions' && method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM submissions ORDER BY submitted_at DESC');
      return json(res, rows);
    }

    if (url === '/api/submissions' && method === 'POST') {
      const b = await getBody(req);
      const { rows } = await pool.query(
        `INSERT INTO submissions
          (id, worker_id, worker_name, client_name, site_name, task, notes,
           auth_method, gps_in, gps_out, clock_in, clock_out, duration, status, date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO UPDATE SET
           status=$14, notes=$7, clock_out=$12, duration=$13
         RETURNING *`,
        [b.id, b.worker_id, b.worker_name, b.client_name, b.site_name,
         b.task, b.notes, b.auth_method, b.gps_in, b.gps_out,
         b.clock_in, b.clock_out, b.duration, b.status || 'draft', b.date]
      );
      return json(res, rows[0]);
    }

    // ── CLOCK EVENTS ──────────────────────────────────────────────────────────
    if (url === '/api/clock-events' && method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM clock_events ORDER BY created_at DESC LIMIT 100');
      return json(res, rows);
    }

    if (url === '/api/clock-events' && method === 'POST') {
      const b = await getBody(req);
      const { rows } = await pool.query(
        `INSERT INTO clock_events (worker_name, site_name, event_type, lat, lng, distance_m, auth_method)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [b.worker_name, b.site_name, b.event_type, b.lat, b.lng, b.distance_m, b.auth_method]
      );
      return json(res, rows[0]);
    }

    // ── HEALTH CHECK ──────────────────────────────────────────────────────────
    if (url === '/api/health') {
      const { rows } = await pool.query('SELECT NOW() as time');
      return json(res, { status: 'ok', time: rows[0].time });
    }

    res.writeHead(404); res.end('Not found');

  } catch (err) {
    console.error('API Error:', err.message);
    json(res, { error: err.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`TradeQuip API running on port ${PORT}`);
});
