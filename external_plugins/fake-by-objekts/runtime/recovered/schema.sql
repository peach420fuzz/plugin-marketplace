CREATE TABLE "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  project_key_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  current_version INTEGER NOT NULL,
  state_json TEXT NOT NULL,
  identity_master_output_id TEXT
);
CREATE TABLE state_versions (
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  parent_version INTEGER,
  created_at TEXT NOT NULL,
  source TEXT NOT NULL,
  delta_json TEXT NOT NULL,
  state_json TEXT NOT NULL,
  PRIMARY KEY (project_id, version)
);
CREATE TABLE generation_jobs (
  job_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  state_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  requested_count INTEGER NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  geometry_key TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE outputs (
  output_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  state_version INTEGER NOT NULL,
  job_id TEXT,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  image_key TEXT NOT NULL,
  parent_output_id TEXT,
  prompt_hash TEXT NOT NULL,
  lineage_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_versions_project ON state_versions(project_id, version DESC);
CREATE INDEX idx_jobs_project ON generation_jobs(project_id, created_at DESC);
CREATE INDEX idx_outputs_project ON outputs(project_id, created_at DESC);
CREATE TABLE reference_assets (
  asset_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_reference_assets_project
ON reference_assets(project_id, created_at DESC);
CREATE TABLE mcp_invocations (
  event_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  rpc_method TEXT NOT NULL,
  tool_name TEXT,
  category TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  session_hash TEXT,
  client_family TEXT NOT NULL,
  country TEXT,
  source TEXT NOT NULL DEFAULT 'external',
  http_status INTEGER NOT NULL,
  ok INTEGER NOT NULL
);
CREATE INDEX idx_mcp_invocations_created_at
ON mcp_invocations(created_at DESC);
CREATE INDEX idx_mcp_invocations_tool
ON mcp_invocations(tool_name, created_at DESC);
CREATE INDEX idx_mcp_invocations_client
ON mcp_invocations(client_hash, created_at DESC);
CREATE INDEX idx_mcp_invocations_category
ON mcp_invocations(category, created_at DESC);
CREATE INDEX idx_mcp_invocations_source
ON mcp_invocations(source, created_at DESC);
