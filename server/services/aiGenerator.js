import yaml from 'js-yaml';

/**
 * Main AI Generation Entry Point
 */
export async function generateSystemArchitecture(userInput, userApiKey = null) {
  const cleanInput = (userInput || '').trim();
  if (!cleanInput) {
    throw new Error("System description or name cannot be empty.");
  }

  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const geminiResult = await callGeminiAPI(cleanInput, apiKey);
      if (geminiResult) return geminiResult;
    } catch (err) {
      console.warn("Gemini API call failed, falling back to dynamic AI engine:", err.message);
    }
  }

  // Dynamic Rule-Based AI Engine Fallback (Guarantees dynamic results for ANY input)
  return generateDynamicArchitecture(cleanInput);
}

/**
 * Call Gemini API using standard fetch
 */
async function callGeminiAPI(userInput, apiKey) {
  const prompt = `You are an expert Principal Database Architect and Backend API Engineer.
Analyze the following user input describing a system and generate a complete, normalized PostgreSQL database schema, RESTful APIs, JSON Schemas, OpenAPI 3.0 spec, and realistic mock data.

User System Input: "${userInput}"

CRITICAL REQUIREMENTS:
1. Analyze the exact domain described by "${userInput}".
2. Design 3 to 6 normalized relational database tables specifically tailored to this system.
3. Every table MUST include primary keys, appropriate Postgres data types (INT, VARCHAR, DECIMAL, TIMESTAMP, BOOLEAN, TEXT, UUID, JSONB), foreign key relationships where appropriate, NOT NULL constraints, and appropriate indexes.
4. Generate standard REST API endpoints (GET /, GET /:id, POST /, PUT /:id, DELETE /:id) for EVERY table with clean route definitions, request body schema, response body schema, and Express JS handler code.
5. Produce realistic mock seed records (3 items per table) matching the exact schema.

Return ONLY a valid, raw JSON object (no markdown wrapping, no text before or after) with this exact JSON structure:
{
  "systemName": "String system title derived from user prompt",
  "description": "Brief description of the system",
  "tables": [
    {
      "name": "TableNameSingularOrPlural",
      "sqlName": "snake_case_table_name",
      "description": "Table description",
      "columns": [
        { "name": "column_name", "type": "VARCHAR(255)", "isPrimary": true, "isForeign": false, "nullable": false, "references": null, "description": "Column detail" }
      ],
      "indexes": ["CREATE INDEX idx_... ON ... (...)"],
      "sampleRecords": [
        { "id": 1, ... }
      ]
    }
  ],
  "relationships": [
    { "fromTable": "orders", "fromColumn": "customer_id", "toTable": "customers", "toColumn": "id", "type": "MANY_TO_ONE" }
  ]
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini API");

  const rawJson = JSON.parse(text);
  return formatGeneratedPayload(rawJson, userInput);
}

/**
 * Dynamic Dynamic Schema Synthesizer
 * Synthesizes unique PostgreSQL schemas, REST APIs, JSON Schemas, and ERD structures
 * dynamically based on natural language keyword extraction and domain entity rules.
 */
function generateDynamicArchitecture(userInput) {
  const normalizedInput = userInput.toLowerCase();
  const words = normalizedInput.match(/[a-z0-9]+/g) || [];
  
  // Clean System Name
  const formattedSystemName = userInput.replace(/system|app|management|platform|builder/gi, '').trim() || userInput;
  const capitalizedSystemName = formattedSystemName
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  // Domain Entity Extractor
  const entities = extractEntitiesFromInput(normalizedInput, words);
  
  const tables = entities.map(entity => buildTableDefinition(entity, entities));
  const relationships = buildRelationships(tables);

  const payload = {
    systemName: `${capitalizedSystemName} System`,
    description: `Automated PostgreSQL relational schema & RESTful API suite generated for ${capitalizedSystemName}.`,
    tables,
    relationships
  };

  return formatGeneratedPayload(payload, userInput);
}

/**
 * Extracts entities dynamically from input keywords or creates smart custom domain entities
 */
function extractEntitiesFromInput(normalizedInput, words) {
  const domainKnowledge = [
    {
      keywords: ['restaurant', 'food', 'dining', 'cafe', 'bistro', 'baking', 'pizza', 'kitchen'],
      entities: [
        { name: 'Restaurants', sqlName: 'restaurants', role: 'root' },
        { name: 'MenuItems', sqlName: 'menu_items', role: 'catalog' },
        { name: 'Customers', sqlName: 'customers', role: 'user' },
        { name: 'Orders', sqlName: 'orders', role: 'transaction' },
        { name: 'OrderItems', sqlName: 'order_items', role: 'item' },
        { name: 'Staff', sqlName: 'staff', role: 'employee' }
      ]
    },
    {
      keywords: ['hospital', 'clinic', 'medical', 'doctor', 'patient', 'healthcare', 'pharma', 'dentist'],
      entities: [
        { name: 'Patients', sqlName: 'patients', role: 'user' },
        { name: 'Doctors', sqlName: 'doctors', role: 'staff' },
        { name: 'Appointments', sqlName: 'appointments', role: 'transaction' },
        { name: 'Prescriptions', sqlName: 'prescriptions', role: 'record' },
        { name: 'Departments', sqlName: 'departments', role: 'root' }
      ]
    },
    {
      keywords: ['library', 'book', 'borrow', 'reading', 'author', 'publication'],
      entities: [
        { name: 'Books', sqlName: 'books', role: 'catalog' },
        { name: 'Members', sqlName: 'members', role: 'user' },
        { name: 'Authors', sqlName: 'authors', role: 'master' },
        { name: 'BorrowRecords', sqlName: 'borrow_records', role: 'transaction' },
        { name: 'Categories', sqlName: 'categories', role: 'root' }
      ]
    },
    {
      keywords: ['school', 'university', 'college', 'student', 'course', 'teacher', 'education', 'class', 'grade'],
      entities: [
        { name: 'Students', sqlName: 'students', role: 'user' },
        { name: 'Teachers', sqlName: 'teachers', role: 'staff' },
        { name: 'Courses', sqlName: 'courses', role: 'catalog' },
        { name: 'Enrollments', sqlName: 'enrollments', role: 'transaction' },
        { name: 'Grades', sqlName: 'grades', role: 'record' }
      ]
    },
    {
      keywords: ['store', 'shop', 'ecommerce', 'e-commerce', 'product', 'cart', 'inventory', 'retail'],
      entities: [
        { name: 'Products', sqlName: 'products', role: 'catalog' },
        { name: 'Categories', sqlName: 'categories', role: 'root' },
        { name: 'Customers', sqlName: 'customers', role: 'user' },
        { name: 'Orders', sqlName: 'orders', role: 'transaction' },
        { name: 'Payments', sqlName: 'payments', role: 'record' }
      ]
    },
    {
      keywords: ['gym', 'fitness', 'workout', 'trainer', 'membership'],
      entities: [
        { name: 'Members', sqlName: 'members', role: 'user' },
        { name: 'Trainers', sqlName: 'trainers', role: 'staff' },
        { name: 'WorkoutClasses', sqlName: 'workout_classes', role: 'catalog' },
        { name: 'Subscriptions', sqlName: 'subscriptions', role: 'transaction' }
      ]
    },
    {
      keywords: ['hotel', 'resort', 'room', 'booking', 'guest', 'lodging'],
      entities: [
        { name: 'Rooms', sqlName: 'rooms', role: 'catalog' },
        { name: 'Guests', sqlName: 'guests', role: 'user' },
        { name: 'Reservations', sqlName: 'reservations', role: 'transaction' },
        { name: 'Payments', sqlName: 'payments', role: 'record' }
      ]
    },
    {
      keywords: ['flight', 'airline', 'airport', 'ticket', 'aviation', 'travel'],
      entities: [
        { name: 'Flights', sqlName: 'flights', role: 'catalog' },
        { name: 'Passengers', sqlName: 'passengers', role: 'user' },
        { name: 'Bookings', sqlName: 'bookings', role: 'transaction' },
        { name: 'Airports', sqlName: 'airports', role: 'root' }
      ]
    },
    {
      keywords: ['real estate', 'property', 'house', 'rent', 'tenant', 'landlord', 'realty'],
      entities: [
        { name: 'Properties', sqlName: 'properties', role: 'catalog' },
        { name: 'Tenants', sqlName: 'tenants', role: 'user' },
        { name: 'Leases', sqlName: 'leases', role: 'transaction' },
        { name: 'Agents', sqlName: 'agents', role: 'staff' }
      ]
    },
    {
      keywords: ['crypto', 'coin', 'wallet', 'blockchain', 'token', 'exchange', 'trade'],
      entities: [
        { name: 'Wallets', sqlName: 'wallets', role: 'user' },
        { name: 'Cryptocurrencies', sqlName: 'cryptocurrencies', role: 'catalog' },
        { name: 'Transactions', sqlName: 'transactions', role: 'transaction' },
        { name: 'ExchangeOrders', sqlName: 'exchange_orders', role: 'record' }
      ]
    }
  ];

  // Try matching known domains
  for (const domain of domainKnowledge) {
    if (domain.keywords.some(kw => normalizedInput.includes(kw))) {
      return domain.entities;
    }
  }

  // Fallback: Generate completely dynamic custom entities based on user's specific terms!
  const topicTerm = words.find(w => !['system', 'management', 'app', 'tool', 'platform', 'service', 'tracker', 'builder', 'manager', 'hub', 'api'].includes(w)) || 'item';
  const capTopic = topicTerm.charAt(0).toUpperCase() + topicTerm.slice(1);
  const sqlTopic = topicTerm.toLowerCase();

  return [
    { name: `${capTopic}s`, sqlName: `${sqlTopic}s`, role: 'catalog' },
    { name: 'Users', sqlName: 'users', role: 'user' },
    { name: `${capTopic}Requests`, sqlName: `${sqlTopic}_requests`, role: 'transaction' },
    { name: 'AuditLogs', sqlName: 'audit_logs', role: 'record' }
  ];
}

/**
 * Builds full column definition & sample data for an entity
 */
function buildTableDefinition(entity, allEntities) {
  const { name, sqlName, role } = entity;
  const columns = [
    { name: 'id', type: 'SERIAL', isPrimary: true, isForeign: false, nullable: false, references: null, description: 'Primary Key auto-increment ID' }
  ];

  const sampleRecords = [];

  // Entity specific columns based on role & entity name
  if (role === 'user' || sqlName.includes('user') || sqlName.includes('patient') || sqlName.includes('customer') || sqlName.includes('member') || sqlName.includes('passenger') || sqlName.includes('guest') || sqlName.includes('student') || sqlName.includes('tenant')) {
    columns.push(
      { name: 'first_name', type: 'VARCHAR(100)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Given name' },
      { name: 'last_name', type: 'VARCHAR(100)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Family name' },
      { name: 'email', type: 'VARCHAR(255)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Unique email address' },
      { name: 'phone', type: 'VARCHAR(20)', isPrimary: false, isForeign: false, nullable: true, references: null, description: 'Contact phone number' },
      { name: 'status', type: 'VARCHAR(50)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Account status (active, pending, inactive)' }
    );

    sampleRecords.push(
      { id: 1, first_name: 'Alex', last_name: 'Morgan', email: 'alex.m@example.com', phone: '+1-555-0192', status: 'active' },
      { id: 2, first_name: 'Sarah', last_name: 'Connor', email: 'sarah.c@example.com', phone: '+1-555-0144', status: 'active' },
      { id: 3, first_name: 'David', last_name: 'Smith', email: 'david.s@example.com', phone: '+1-555-0188', status: 'pending' }
    );
  } else if (role === 'staff' || sqlName.includes('doctor') || sqlName.includes('teacher') || sqlName.includes('trainer') || sqlName.includes('agent') || sqlName.includes('employee')) {
    columns.push(
      { name: 'full_name', type: 'VARCHAR(200)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Full legal name' },
      { name: 'specialization', type: 'VARCHAR(150)', isPrimary: false, isForeign: false, nullable: true, references: null, description: 'Area of expertise or role title' },
      { name: 'email', type: 'VARCHAR(255)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Work email' },
      { name: 'salary', type: 'DECIMAL(10,2)', isPrimary: false, isForeign: false, nullable: true, references: null, description: 'Base pay or hourly rate' },
      { name: 'is_active', type: 'BOOLEAN', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Employment active flag' }
    );

    sampleRecords.push(
      { id: 1, full_name: 'Dr. Evelyn Reed', specialization: 'Senior Specialist', email: 'e.reed@organization.com', salary: 115000.00, is_active: true },
      { id: 2, full_name: 'Marcus Vance', specialization: 'Operations Lead', email: 'm.vance@organization.com', salary: 88000.00, is_active: true },
      { id: 3, full_name: 'Elena Rostova', specialization: 'Consultant', email: 'e.rostova@organization.com', salary: 92500.00, is_active: true }
    );
  } else if (role === 'catalog' || sqlName.includes('product') || sqlName.includes('menu') || sqlName.includes('book') || sqlName.includes('course') || sqlName.includes('room') || sqlName.includes('flight') || sqlName.includes('property') || sqlName.includes('crypto') || sqlName.includes('workout')) {
    columns.push(
      { name: 'title', type: 'VARCHAR(255)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Item title or name' },
      { name: 'description', type: 'TEXT', isPrimary: false, isForeign: false, nullable: true, references: null, description: 'Detailed description' },
      { name: 'price', type: 'DECIMAL(10,2)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Unit cost or rate' },
      { name: 'category', type: 'VARCHAR(100)', isPrimary: false, isForeign: false, nullable: true, references: null, description: 'Grouping category' },
      { name: 'stock_quantity', type: 'INTEGER', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Available count' }
    );

    sampleRecords.push(
      { id: 1, title: `${name.slice(0, -1)} Alpha Premium`, description: `Top-tier high quality ${name.toLowerCase()} offering.`, price: 49.99, category: 'Standard', stock_quantity: 150 },
      { id: 2, title: `${name.slice(0, -1)} Deluxe Pro`, description: `Advanced edition with full feature set.`, price: 99.50, category: 'Premium', stock_quantity: 80 },
      { id: 3, title: `${name.slice(0, -1)} Essential Lite`, description: `Budget friendly starter choice.`, price: 19.99, category: 'Basic', stock_quantity: 300 }
    );
  } else if (role === 'transaction' || sqlName.includes('order') || sqlName.includes('appointment') || sqlName.includes('booking') || sqlName.includes('lease') || sqlName.includes('borrow') || sqlName.includes('enrollment') || sqlName.includes('subscription')) {
    // Find parent user table
    const userTable = allEntities.find(e => e.role === 'user');
    const fkCol = userTable ? `${userTable.sqlName.slice(0, -1)}_id` : 'user_id';
    const fkRef = userTable ? userTable.sqlName : 'users';

    columns.push(
      { name: fkCol, type: 'INTEGER', isPrimary: false, isForeign: true, nullable: false, references: `${fkRef}(id)`, description: `Foreign key linking to ${fkRef}` },
      { name: 'reference_code', type: 'VARCHAR(50)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Unique transaction code' },
      { name: 'total_amount', type: 'DECIMAL(10,2)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Financial total' },
      { name: 'status', type: 'VARCHAR(50)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Lifecycle state (pending, confirmed, completed, cancelled)' },
      { name: 'scheduled_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false, nullable: true, references: null, description: 'Scheduled date and time' }
    );

    sampleRecords.push(
      { id: 1, [fkCol]: 1, reference_code: 'TRX-90412', total_amount: 149.99, status: 'completed', scheduled_at: '2026-08-10T14:30:00Z' },
      { id: 2, [fkCol]: 2, reference_code: 'TRX-90413', total_amount: 89.50, status: 'confirmed', scheduled_at: '2026-08-12T10:00:00Z' },
      { id: 3, [fkCol]: 3, reference_code: 'TRX-90414', total_amount: 210.00, status: 'pending', scheduled_at: '2026-08-15T16:15:00Z' }
    );
  } else {
    columns.push(
      { name: 'name', type: 'VARCHAR(255)', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Record title or identifier' },
      { name: 'notes', type: 'TEXT', isPrimary: false, isForeign: false, nullable: true, references: null, description: 'Freeform notes or metadata' },
      { name: 'is_enabled', type: 'BOOLEAN', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Enabled status' }
    );

    sampleRecords.push(
      { id: 1, name: 'Default Entry 1', notes: 'Automated initial configuration entry.', is_enabled: true },
      { id: 2, name: 'Secondary Entry 2', notes: 'System parameter check entry.', is_enabled: true },
      { id: 3, name: 'Archived Entry 3', notes: 'Legacy record preserved for reference.', is_enabled: false }
    );
  }

  // Common Timestamps
  columns.push(
    { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Creation timestamp' },
    { name: 'updated_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', isPrimary: false, isForeign: false, nullable: false, references: null, description: 'Last update timestamp' }
  );

  // Add default timestamp to sample records
  const nowStr = new Date().toISOString();
  sampleRecords.forEach(rec => {
    rec.created_at = nowStr;
    rec.updated_at = nowStr;
  });

  const indexes = [
    `CREATE INDEX idx_${sqlName}_id ON ${sqlName} (id);`
  ];
  if (columns.some(c => c.name === 'email')) {
    indexes.push(`CREATE UNIQUE INDEX idx_${sqlName}_email ON ${sqlName} (email);`);
  }
  if (columns.some(c => c.name === 'status')) {
    indexes.push(`CREATE INDEX idx_${sqlName}_status ON ${sqlName} (status);`);
  }

  return {
    name,
    sqlName,
    description: `Relational table storing ${name.toLowerCase()} domain data.`,
    columns,
    indexes,
    sampleRecords
  };
}

/**
 * Build FK relationships
 */
function buildRelationships(tables) {
  const relations = [];
  tables.forEach(table => {
    table.columns.forEach(col => {
      if (col.isForeign && col.references) {
        const [targetTable, targetCol] = col.references.replace(')', '').split('(');
        relations.push({
          fromTable: table.sqlName,
          fromColumn: col.name,
          toTable: targetTable,
          toColumn: targetCol || 'id',
          type: 'MANY_TO_ONE'
        });
      }
    });
  });
  return relations;
}

/**
 * Formats full output payload with SQL DDL, REST Endpoints, JSON Schemas, OpenAPI spec, and code snippets
 */
function formatGeneratedPayload(rawPayload, userInput) {
  const { systemName, description, tables, relationships } = rawPayload;

  // 1. Generate Complete PostgreSQL DDL Script
  let postgresSql = `-- ========================================================\n`;
  postgresSql += `-- PostgreSQL Database Schema for ${systemName}\n`;
  postgresSql += `-- Generated dynamically based on input: "${userInput}"\n`;
  postgresSql += `-- Date: ${new Date().toISOString().split('T')[0]}\n`;
  postgresSql += `-- ========================================================\n\n`;

  postgresSql += `-- Enable UUID Extension if needed\nCREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;

  // Drop tables in reverse order for safety
  postgresSql += `-- Cleanup Drop Statements\n`;
  [...tables].reverse().forEach(t => {
    postgresSql += `DROP TABLE IF EXISTS ${t.sqlName} CASCADE;\n`;
  });
  postgresSql += `\n`;

  tables.forEach(t => {
    postgresSql += `-- Table: ${t.sqlName} (${t.name})\n`;
    postgresSql += `CREATE TABLE ${t.sqlName} (\n`;
    const colLines = t.columns.map(c => {
      let line = `  ${c.name.padEnd(20)} ${c.type}`;
      if (c.isPrimary) line += ` PRIMARY KEY`;
      if (!c.nullable && !c.isPrimary) line += ` NOT NULL`;
      if (c.isForeign && c.references) line += ` REFERENCES ${c.references} ON DELETE CASCADE`;
      return line;
    });
    postgresSql += colLines.join(',\n');
    postgresSql += `\n);\n\n`;

    if (t.indexes && t.indexes.length > 0) {
      postgresSql += `-- Indexes for ${t.sqlName}\n`;
      t.indexes.forEach(idx => {
        postgresSql += `${idx}\n`;
      });
      postgresSql += `\n`;
    }
  });

  // Seed Data Insert SQL
  postgresSql += `-- Initial Seed Data\n`;
  tables.forEach(t => {
    if (t.sampleRecords && t.sampleRecords.length > 0) {
      t.sampleRecords.forEach(rec => {
        const keys = Object.keys(rec).filter(k => k !== 'created_at' && k !== 'updated_at');
        const vals = keys.map(k => {
          const val = rec[k];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          return val;
        });
        postgresSql += `INSERT INTO ${t.sqlName} (${keys.join(', ')}) VALUES (${vals.join(', ')});\n`;
      });
    }
  });

  // 2. Generate REST API Endpoints with Express JS Code & cURL Examples
  const apiEndpoints = [];
  tables.forEach(t => {
    const resourcePath = `/api/v1/${t.sqlName}`;
    const singularName = t.name.endsWith('s') ? t.name.slice(0, -1) : t.name;

    // GET ALL
    apiEndpoints.push({
      id: `get_all_${t.sqlName}`,
      table: t.name,
      method: 'GET',
      path: resourcePath,
      summary: `Retrieve all ${t.name}`,
      description: `Fetches a paginated list of ${t.name.toLowerCase()} with optional search filters.`,
      requestBody: null,
      responseBody: {
        success: true,
        count: t.sampleRecords.length,
        data: t.sampleRecords
      },
      curlExample: `curl -X GET "http://localhost:5000${resourcePath}" \\
  -H "Accept: application/json"`,
      expressCode: `// GET /api/v1/${t.sqlName} - Fetch all records
router.get('${resourcePath}', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const { rows } = await db.query(
      'SELECT * FROM ${t.sqlName} ORDER BY id ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});`
    });

    // GET BY ID
    apiEndpoints.push({
      id: `get_one_${t.sqlName}`,
      table: t.name,
      method: 'GET',
      path: `${resourcePath}/:id`,
      summary: `Retrieve ${singularName} by ID`,
      description: `Fetches a specific ${singularName.toLowerCase()} record using primary key ID.`,
      requestBody: null,
      responseBody: {
        success: true,
        data: t.sampleRecords[0] || { id: 1 }
      },
      curlExample: `curl -X GET "http://localhost:5000${resourcePath}/1" \\
  -H "Accept: application/json"`,
      expressCode: `// GET /api/v1/${t.sqlName}/:id - Fetch single record
router.get('${resourcePath}/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM ${t.sqlName} WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '${singularName} not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});`
    });

    // POST CREATE
    const samplePayload = { ...t.sampleRecords[0] };
    delete samplePayload.id;
    delete samplePayload.created_at;
    delete samplePayload.updated_at;

    apiEndpoints.push({
      id: `create_${t.sqlName}`,
      table: t.name,
      method: 'POST',
      path: resourcePath,
      summary: `Create new ${singularName}`,
      description: `Inserts a new ${singularName.toLowerCase()} record into database after validating schema.`,
      requestBody: samplePayload,
      responseBody: {
        success: true,
        message: `${singularName} created successfully`,
        data: { id: (t.sampleRecords.length + 1), ...samplePayload, created_at: new Date().toISOString() }
      },
      curlExample: `curl -X POST "http://localhost:5000${resourcePath}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(samplePayload, null, 2).replace(/'/g, "\\'")}'`,
      expressCode: `// POST /api/v1/${t.sqlName} - Create new record
router.post('${resourcePath}', async (req, res) => {
  try {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    const valuePlaceholders = values.map((_, i) => \`$\${i + 1}\`).join(', ');

    const sql = \`INSERT INTO ${t.sqlName} (\${fields.join(', ')}) VALUES (\${valuePlaceholders}) RETURNING *\`;
    const { rows } = await db.query(sql, values);
    
    res.status(201).json({ success: true, message: '${singularName} created', data: rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});`
    });

    // PUT UPDATE
    apiEndpoints.push({
      id: `update_${t.sqlName}`,
      table: t.name,
      method: 'PUT',
      path: `${resourcePath}/:id`,
      summary: `Update ${singularName} by ID`,
      description: `Modifies existing ${singularName.toLowerCase()} fields by ID.`,
      requestBody: samplePayload,
      responseBody: {
        success: true,
        message: `${singularName} updated successfully`,
        data: { id: 1, ...samplePayload, updated_at: new Date().toISOString() }
      },
      curlExample: `curl -X PUT "http://localhost:5000${resourcePath}/1" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(samplePayload, null, 2).replace(/'/g, "\\'")}'`,
      expressCode: `// PUT /api/v1/${t.sqlName}/:id - Update record
router.put('${resourcePath}/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClause = Object.keys(updates).map((key, i) => \`\${key} = $\${i + 2}\`).join(', ');
    
    const sql = \`UPDATE ${t.sqlName} SET \${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *\`;
    const { rows } = await db.query(sql, [id, ...Object.values(updates)]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '${singularName} not found' });
    }
    res.json({ success: true, message: '${singularName} updated', data: rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});`
    });

    // DELETE
    apiEndpoints.push({
      id: `delete_${t.sqlName}`,
      table: t.name,
      method: 'DELETE',
      path: `${resourcePath}/:id`,
      summary: `Delete ${singularName} by ID`,
      description: `Removes ${singularName.toLowerCase()} record from database permanently.`,
      requestBody: null,
      responseBody: {
        success: true,
        message: `${singularName} with ID 1 deleted successfully`
      },
      curlExample: `curl -X DELETE "http://localhost:5000${resourcePath}/1" \\
  -H "Accept: application/json"`,
      expressCode: `// DELETE /api/v1/${t.sqlName}/:id - Delete record
router.delete('${resourcePath}/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM ${t.sqlName} WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: '${singularName} not found' });
    }
    res.json({ success: true, message: '${singularName} deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});`
    });
  });

  // 3. Generate JSON Schemas (Draft-07 standard)
  const jsonSchemas = {};
  tables.forEach(t => {
    const properties = {};
    const requiredProps = [];

    t.columns.forEach(c => {
      if (c.name === 'created_at' || c.name === 'updated_at') return;

      let jsonType = 'string';
      if (c.type.includes('INT') || c.type.includes('SERIAL')) jsonType = 'integer';
      else if (c.type.includes('DECIMAL') || c.type.includes('NUMERIC') || c.type.includes('FLOAT')) jsonType = 'number';
      else if (c.type.includes('BOOLEAN')) jsonType = 'boolean';

      properties[c.name] = {
        type: jsonType,
        description: c.description
      };

      if (!c.nullable && !c.isPrimary) {
        requiredProps.push(c.name);
      }
    });

    jsonSchemas[t.name] = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: t.name,
      type: "object",
      description: t.description,
      properties,
      required: requiredProps
    };
  });

  // 4. Generate OpenAPI 3.0 Documentation Specification (JSON & YAML)
  const openApiPaths = {};
  const openApiComponents = {};

  tables.forEach(t => {
    const resourcePath = `/api/v1/${t.sqlName}`;
    const singularName = t.name.endsWith('s') ? t.name.slice(0, -1) : t.name;

    openApiComponents[t.name] = {
      type: 'object',
      properties: jsonSchemas[t.name].properties
    };

    openApiPaths[resourcePath] = {
      get: {
        tags: [t.name],
        summary: `List all ${t.name}`,
        responses: {
          '200': {
            description: 'Successful retrieval',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: `#/components/schemas/${t.name}` } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: [t.name],
        summary: `Create new ${singularName}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${t.name}` }
            }
          }
        },
        responses: {
          '201': {
            description: 'Created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: `#/components/schemas/${t.name}` }
                  }
                }
              }
            }
          }
        }
      }
    };

    openApiPaths[`${resourcePath}/{id}`] = {
      get: {
        tags: [t.name],
        summary: `Get ${singularName} by ID`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Found' },
          '404': { description: 'Not Found' }
        }
      },
      put: {
        tags: [t.name],
        summary: `Update ${singularName}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: `#/components/schemas/${t.name}` } } }
        },
        responses: {
          '200': { description: 'Updated successfully' }
        }
      },
      delete: {
        tags: [t.name],
        summary: `Delete ${singularName}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Deleted successfully' }
        }
      }
    };
  });

  const openApiObject = {
    openapi: '3.0.3',
    info: {
      title: `${systemName} REST API`,
      description: `Auto-generated REST API Specification for ${systemName}.`,
      version: '1.0.0'
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development Server' }
    ],
    paths: openApiPaths,
    components: {
      schemas: openApiComponents
    }
  };

  const openApiYaml = yaml.dump(openApiObject);

  return {
    systemName,
    userInput,
    description,
    generatedAt: new Date().toISOString(),
    tables,
    relationships,
    sql: postgresSql,
    apiEndpoints,
    jsonSchemas,
    openApiJson: openApiObject,
    openApiYaml
  };
}
