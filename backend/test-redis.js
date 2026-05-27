const Redis = require('ioredis');

// Read the .env file values or let process.env default them if already loaded
require('dotenv').config();

const host = process.env.REDIS_HOST || 'localhost';
const port = parseInt(process.env.REDIS_PORT || '6379', 10);
const username = process.env.REDIS_USERNAME;
const password = process.env.REDIS_PASSWORD;

console.log(`Connecting to Redis at ${host}:${port} with user: ${username || '(none)'}`);

async function testConnection() {
  console.log('--- Test 1: Standard Connection ---');
  try {
    const client = new Redis({
      host,
      port,
      username,
      password,
      connectTimeout: 5000,
      retryStrategy: () => null // don't retry
    });
    client.on('error', (err) => console.log('Standard client error:', err.message));
    await client.ping();
    console.log('Standard connection SUCCESS!');
    await client.quit();
  } catch (err) {
    console.error('Standard connection FAILED:', err.message);
  }

  console.log('\n--- Test 2: TLS Connection ---');
  try {
    const client = new Redis({
      host,
      port,
      username,
      password,
      tls: {},
      connectTimeout: 5000,
      retryStrategy: () => null // don't retry
    });
    client.on('error', (err) => console.log('TLS client error:', err.message));
    await client.ping();
    console.log('TLS connection SUCCESS!');
    await client.quit();
  } catch (err) {
    console.error('TLS connection FAILED:', err.message);
  }
}

testConnection();
