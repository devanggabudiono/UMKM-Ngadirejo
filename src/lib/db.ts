import mysql from 'mysql2/promise';

/**
 * MySQL Connection Pool
 *
 * Uses mysql2/promise for async/await support.
 * Connection pool is created once and reused across all requests.
 * Next.js hot-reload safe: singleton pattern via globalThis.
 *
 * Features:
 * - Connection retry with exponential backoff
 * - Health check validation on pool creation
 * - Typed DatabaseError for structured error handling
 * - Proper timeout configuration
 */

// =============================================
// Custom Error Types
// =============================================

export class DatabaseError extends Error {
  public readonly code: string;
  public readonly isRetryable: boolean;
  public readonly host: string;
  public readonly port: number;

  constructor(
    message: string,
    options: {
      code?: string;
      isRetryable?: boolean;
      host?: string;
      port?: number;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = options.code || 'DB_UNKNOWN';
    this.isRetryable = options.isRetryable ?? false;
    this.host = options.host || 'unknown';
    this.port = options.port || 0;
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

// =============================================
// Pool Configuration
// =============================================

const DB_CONFIG = {
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  user: process.env.DATABASE_USER || 'umkm_app',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'umkm_ngadirejo',
};

const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

// =============================================
// Singleton Pool
// =============================================

const globalForDb = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
  mysqlPoolValidated: boolean | undefined;
};

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000,
  });
}

// =============================================
// Connection Health Check with Retry
// =============================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validates the pool can connect to MySQL.
 * Retries with exponential backoff if the database is starting up.
 */
async function validateConnection(pool: mysql.Pool): Promise<void> {
  const { maxRetries, initialDelayMs, maxDelayMs } = RETRY_CONFIG;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await pool.getConnection();
      try {
        await connection.query('SELECT 1');
        console.log(
          `[DB] ✅ Connected to MySQL at ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`
        );
        return;
      } finally {
        connection.release();
      }
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      const isRetryable =
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.code === 'ER_ACCESS_DENIED_ERROR' === false;

      if (attempt === maxRetries || !isRetryable) {
        console.error(
          `[DB] ❌ Failed to connect after ${attempt} attempt(s):`,
          {
            host: DB_CONFIG.host,
            port: DB_CONFIG.port,
            database: DB_CONFIG.database,
            user: DB_CONFIG.user,
            errorCode: error.code,
            message: error.message,
          }
        );
        throw new DatabaseError(
          `Cannot connect to MySQL at ${DB_CONFIG.host}:${DB_CONFIG.port}: ${error.message}`,
          {
            code: error.code || 'DB_CONNECTION_FAILED',
            isRetryable: false,
            host: DB_CONFIG.host,
            port: DB_CONFIG.port,
            cause: error,
          }
        );
      }

      const delayMs = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      console.warn(
        `[DB] ⚠️  Connection attempt ${attempt}/${maxRetries} failed (${error.code}). Retrying in ${delayMs}ms...`
      );
      await sleep(delayMs);
    }
  }
}

// =============================================
// Pool Initialization
// =============================================

const pool = globalForDb.mysqlPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.mysqlPool = pool;
}

// Validate connection on first import (non-blocking)
if (!globalForDb.mysqlPoolValidated) {
  globalForDb.mysqlPoolValidated = true;
  validateConnection(pool).catch((err) => {
    console.error('[DB] ❌ Pool validation failed:', err instanceof DatabaseError ? err.message : err);
  });
}

// =============================================
// Exports
// =============================================

export default pool;

/**
 * Execute a query with automatic error wrapping.
 * Use this instead of pool.query() for better error context.
 */
export async function dbQuery<T extends mysql.RowDataPacket[]>(
  sql: string,
  params?: unknown[]
): Promise<[T, mysql.FieldPacket[]]> {
  try {
    return await pool.query<T>(sql, params);
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    throw new DatabaseError(
      `Query failed: ${error.message}`,
      {
        code: error.code || 'DB_QUERY_FAILED',
        isRetryable: error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST',
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        cause: error,
      }
    );
  }
}
