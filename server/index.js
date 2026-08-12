import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import archiver from 'archiver';
import { generateSystemArchitecture } from './services/aiGenerator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Database Store for API Sandbox Simulation
const activeSimulations = new Map();

/**
 * POST /api/generate
 * Generates dynamic PostgreSQL schema & REST API specification based on user input
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: "Missing system prompt input" });
    }

    const architecture = await generateSystemArchitecture(prompt, apiKey);

    // Initialize sandbox simulation state for this system
    const simId = `sim_${Date.now()}`;
    const initialSimData = {};
    architecture.tables.forEach(t => {
      initialSimData[t.sqlName] = [...(t.sampleRecords || [])];
    });

    activeSimulations.set(simId, {
      architecture,
      db: initialSimData
    });

    res.json({
      success: true,
      simulationId: simId,
      data: architecture
    });
  } catch (err) {
    console.error("Generation error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to generate system architecture"
    });
  }
});

/**
 * POST /api/simulate
 * Simulates real REST API operations (GET, POST, PUT, DELETE) against the live state
 */
app.post('/api/simulate', (req, res) => {
  const { simulationId, endpointId, method, path, requestBody, params } = req.body;
  const sim = activeSimulations.get(simulationId);

  const startTime = Date.now();

  if (!sim) {
    return res.status(404).json({
      status: 404,
      statusText: "Not Found",
      headers: { "content-type": "application/json" },
      timeMs: Date.now() - startTime,
      body: { success: false, error: "Simulation session expired or invalid. Please regenerate system." }
    });
  }

  // Find table from path
  const pathParts = path.split('/').filter(Boolean);
  const tableSqlName = pathParts[2]; // e.g. /api/v1/restaurants -> 'restaurants'
  const recordId = pathParts[3] ? parseInt(pathParts[3], 10) : null;

  const tableData = sim.db[tableSqlName] || [];

  if (method === 'GET') {
    if (recordId) {
      const item = tableData.find(r => r.id === recordId);
      if (!item) {
        return res.status(404).json({
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json", "x-simulated-by": "AI-API-Builder" },
          timeMs: Date.now() - startTime,
          body: { success: false, error: `Record with ID ${recordId} not found in ${tableSqlName}` }
        });
      }
      return res.json({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json", "x-simulated-by": "AI-API-Builder" },
        timeMs: Date.now() - startTime,
        body: { success: true, data: item }
      });
    }

    return res.json({
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json", "x-simulated-by": "AI-API-Builder" },
      timeMs: Date.now() - startTime,
      body: { success: true, count: tableData.length, data: tableData }
    });
  }

  if (method === 'POST') {
    const nextId = tableData.length > 0 ? Math.max(...tableData.map(r => r.id || 0)) + 1 : 1;
    const newItem = {
      id: nextId,
      ...requestBody,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    tableData.push(newItem);
    sim.db[tableSqlName] = tableData;

    return res.status(201).json({
      status: 201,
      statusText: "Created",
      headers: { "content-type": "application/json", "location": `${path}/${nextId}` },
      timeMs: Date.now() - startTime,
      body: { success: true, message: "Record created successfully", data: newItem }
    });
  }

  if (method === 'PUT') {
    const targetId = recordId || requestBody?.id || 1;
    const index = tableData.findIndex(r => r.id === targetId);

    if (index === -1) {
      return res.status(404).json({
        status: 404,
        statusText: "Not Found",
        headers: { "content-type": "application/json" },
        timeMs: Date.now() - startTime,
        body: { success: false, error: `Record with ID ${targetId} not found in ${tableSqlName}` }
      });
    }

    tableData[index] = {
      ...tableData[index],
      ...requestBody,
      updated_at: new Date().toISOString()
    };

    return res.json({
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      timeMs: Date.now() - startTime,
      body: { success: true, message: "Record updated successfully", data: tableData[index] }
    });
  }

  if (method === 'DELETE') {
    const targetId = recordId || 1;
    const index = tableData.findIndex(r => r.id === targetId);

    if (index === -1) {
      return res.status(404).json({
        status: 404,
        statusText: "Not Found",
        headers: { "content-type": "application/json" },
        timeMs: Date.now() - startTime,
        body: { success: false, error: `Record with ID ${targetId} not found in ${tableSqlName}` }
      });
    }

    tableData.splice(index, 1);

    return res.json({
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      timeMs: Date.now() - startTime,
      body: { success: true, message: `Record ${targetId} deleted successfully` }
    });
  }

  return res.status(405).json({
    status: 405,
    statusText: "Method Not Allowed",
    headers: { "content-type": "application/json" },
    timeMs: Date.now() - startTime,
    body: { success: false, error: `HTTP ${method} not supported` }
  });
});

/**
 * POST /api/export-project
 * Generates downloadable ZIP archive of complete Express + PG backend app
 */
app.post('/api/export-project', (req, res) => {
  const { architecture } = req.body;
  if (!architecture) {
    return res.status(400).json({ error: "Missing architecture definition" });
  }

  const archive = archiver('zip', { zlib: { level: 9 } });

  res.attachment(`${architecture.systemName.toLowerCase().replace(/\s+/g, '-')}-backend.zip`);
  archive.pipe(res);

  // 1. package.json
  const pkgJson = {
    name: architecture.systemName.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    description: architecture.description,
    main: 'server.js',
    type: 'module',
    scripts: {
      "start": "node server.js",
      "dev": "node --watch server.js"
    },
    dependencies: {
      "cors": "^2.8.5",
      "dotenv": "^16.4.5",
      "express": "^4.19.2",
      "pg": "^8.11.5"
    }
  };
  archive.append(JSON.stringify(pkgJson, null, 2), { name: 'package.json' });

  // 2. schema.sql
  archive.append(architecture.sql, { name: 'schema.sql' });

  // 3. db.js
  const dbJs = `import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/${architecture.systemName.toLowerCase().replace(/\s+/g, '_')}'
});

export const query = (text, params) => pool.query(text, params);
`;
  archive.append(dbJs, { name: 'db.js' });

  // 4. server.js
  let serverJs = `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as db from './db.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', system: '${architecture.systemName}' }));

`;

  architecture.tables.forEach(t => {
    const resourcePath = `/api/v1/${t.sqlName}`;
    const singular = t.name.endsWith('s') ? t.name.slice(0, -1) : t.name;

    serverJs += `// ===================== ${t.name} Routes =====================\n`;
    serverJs += `app.get('${resourcePath}', async (req, res) => {\n`;
    serverJs += `  try {\n`;
    serverJs += `    const { rows } = await db.query('SELECT * FROM ${t.sqlName} ORDER BY id ASC');\n`;
    serverJs += `    res.json({ success: true, count: rows.length, data: rows });\n`;
    serverJs += `  } catch (err) { res.status(500).json({ success: false, error: err.message }); }\n`;
    serverJs += `});\n\n`;

    serverJs += `app.get('${resourcePath}/:id', async (req, res) => {\n`;
    serverJs += `  try {\n`;
    serverJs += `    const { rows } = await db.query('SELECT * FROM ${t.sqlName} WHERE id = $1', [req.params.id]);\n`;
    serverJs += `    if (!rows.length) return res.status(404).json({ success: false, message: '${singular} not found' });\n`;
    serverJs += `    res.json({ success: true, data: rows[0] });\n`;
    serverJs += `  } catch (err) { res.status(500).json({ success: false, error: err.message }); }\n`;
    serverJs += `});\n\n`;

    serverJs += `app.post('${resourcePath}', async (req, res) => {\n`;
    serverJs += `  try {\n`;
    serverJs += `    const keys = Object.keys(req.body);\n`;
    serverJs += `    const vals = Object.values(req.body);\n`;
    serverJs += `    const placeholders = vals.map((_, i) => \`$\${i + 1}\`).join(', ');\n`;
    serverJs += `    const { rows } = await db.query(\`INSERT INTO ${t.sqlName} (\${keys.join(', ')}) VALUES (\${placeholders}) RETURNING *\`, vals);\n`;
    serverJs += `    res.status(201).json({ success: true, data: rows[0] });\n`;
    serverJs += `  } catch (err) { res.status(400).json({ success: false, error: err.message }); }\n`;
    serverJs += `});\n\n`;

    serverJs += `app.delete('${resourcePath}/:id', async (req, res) => {\n`;
    serverJs += `  try {\n`;
    serverJs += `    const { rowCount } = await db.query('DELETE FROM ${t.sqlName} WHERE id = $1', [req.params.id]);\n`;
    serverJs += `    if (!rowCount) return res.status(404).json({ success: false, message: '${singular} not found' });\n`;
    serverJs += `    res.json({ success: true, message: '${singular} deleted' });\n`;
    serverJs += `  } catch (err) { res.status(500).json({ success: false, error: err.message }); }\n`;
    serverJs += `});\n\n`;
  });

  serverJs += `const PORT = process.env.PORT || 5000;\n`;
  serverJs += `app.listen(PORT, () => console.log(\`🚀 ${architecture.systemName} REST API server running on port \${PORT}\`));\n`;

  archive.append(serverJs, { name: 'server.js' });

  // 5. openapi.yaml
  archive.append(architecture.openApiYaml, { name: 'openapi.yaml' });

  // 6. .env.example
  archive.append(`PORT=5000\nDATABASE_URL=postgresql://postgres:postgres@localhost:5432/${architecture.systemName.toLowerCase().replace(/\s+/g, '_')}\n`, { name: '.env.example' });

  archive.finalize();
});

app.listen(PORT, () => {
  console.log(`⚡ AI API Builder Backend Server running on port ${PORT}`);
});
