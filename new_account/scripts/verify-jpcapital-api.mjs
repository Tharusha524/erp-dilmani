/**
 * Quick check that the JP Capital backend API is reachable.
 * Usage: node scripts/verify-jpcapital-api.mjs
 */

const API_BASE =
  process.env.VITE_API_BASE_URL?.trim() ||
  "https://finance.skytechsl.com/sky_erp/backend/public/index.php/api";

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

async function check(name, url, init) {
  try {
    const res = await fetch(url, { ...init, headers: { ...headers, ...init?.headers } });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 200);
    }
    console.log(`[${res.status}] ${name}: ${url}`);
    if (res.status >= 400) console.log("  ", typeof body === "object" ? JSON.stringify(body) : body);
    return res.status;
  } catch (e) {
    console.error(`[FAIL] ${name}: ${e.message}`);
    return 0;
  }
}

console.log("API base:", API_BASE);
console.log("");

await check("GET item-categories", `${API_BASE}/item-categories`);
const loginStatus = await check("POST login (bad creds — expect 401/422)", `${API_BASE}/login`, {
  method: "POST",
  body: JSON.stringify({ email: "verify@test.local", password: "invalid" }),
});

if (loginStatus === 0) {
  console.log("\nAPI unreachable. Check backend URL, CORS, and .env on the server.");
  process.exit(1);
}

console.log("\nBackend is responding. Use valid user credentials on the login page.");
process.exit(0);
