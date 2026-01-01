const RPC_URLS = [
  "https://evm.cronos.org",
  "https://cronosrpc.ankr.com",
  "https://cronos-evm-rpc.publicnode.com"
];

const MULTICALL_TO = "0xcA11bde05977b3631167028862bE2a173976CA11";
const MULTICALL_DATA = "0x82ad56cb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000807d0de6fe5bf18a82e9b925eed8fa18e6ad200d0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000045ee9d9b500000000000000000000000000000000000000000000000000000000";

const TARGET_MOON = 1000000;
const TOTAL_CRITTERS = 3000;

function formatMoon(valueWei) {
  const decimals = 18n;
  const divisor = 10n ** decimals;
  const whole = valueWei / divisor;
  const fraction = valueWei % divisor;
  const fractionStr = (fraction * 100n / divisor).toString().padStart(2, "0");
  return `${whole.toString()}.${fractionStr}`;
}

async function fetchWithFallback(rpcs, body) {
  for (let rpc of rpcs) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.log(`RPC ${rpc} failed:`, e.message);
    }
  }
  throw new Error("All RPCs failed");
}

async function fetchBurnCache() {
  try {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: MULTICALL_TO, data: MULTICALL_DATA }, "latest"]
    };

    const json = await fetchWithFallback(RPC_URLS, body);
    const resultHex = json.result;
    const lastWord = "0x" + resultHex.slice(-64);
    const valueWei = BigInt(lastWord);

    // Cache display
    const display = formatMoon(valueWei);
    const burnEl = document.getElementById("burn-cache-value");
    if (burnEl) burnEl.textContent = display;

    // Progress
    const decimals = 18n;
    const divisor = 10n ** decimals;
    const moonWhole = Number(valueWei / divisor);
    const percent = Math.min(100, (moonWhole / TARGET_MOON) * 100);
    const percentText = `${percent.toFixed(1)}%`;

    const percentEl = document.getElementById("progress-percent");
    const fillEl = document.getElementById("progress-fill");
    if (percentEl) percentEl.textContent = percentText;
    if (fillEl) fillEl.style.width = `${percent}%`;

    // Remaining
    const remaining = Math.max(0, TARGET_MOON - moonWhole);
    const remainingEl = document.getElementById("remaining-value");
    if (remainingEl) remainingEl.textContent = remaining.toLocaleString();

    // Circulation (3000 - cache)
    const circ = TOTAL_CRITTERS - moonWhole;
    const circEl = document.getElementById("circ-supply");  // Update ID
    if (circEl) circEl.textContent = circ;

    // Timestamp
    const now = new Date();
    const ts = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const lastUpdatedEl = document.getElementById("last-updated");
    if (lastUpdatedEl) lastUpdatedEl.textContent = `Last update: ${ts}`;
  } catch (e) {
    console.error("Burn cache failed:", e);
    // Fallback display
    document.getElementById("burn-cache-value")?.textContent = "Error";
  }
}

const MOON_CG_API = "https://api.coingecko.com/api/v3/simple/price?ids=moonflow&vs_currencies=usd&include_24hr_change=true";

async function fetchMoonMarket() {
  try {
    const res = await fetch(MOON_CG_API);
    if (!res.ok) throw new Error("CoinGecko failed");
    const data = await res.json();
    const coin = data.moonflow;
    const priceUsd = coin?.usd || 0;
    const change24h = coin?.usd_24h_change || 0;

    const priceEl = document.getElementById("moon-price");
    const changeEl = document.getElementById("moon-change");
    const lastUpdatedEl = document.getElementById("moon-last-updated");

    if (priceEl) priceEl.textContent = `$${priceUsd.toFixed(6)}`;
    if (changeEl) {
      const sign = change24h > 0 ? "+" : "";
      changeEl.textContent = `24h: ${sign}${change24h.toFixed(2)}%`;
      changeEl.style.color = change24h > 0 ? "#19ff6b" : change24h < 0 ? "#ff3737" : "#f5f5f7";
    }
    if (lastUpdatedEl) {
      const now = new Date();
      lastUpdatedEl.textContent = `Last update: ${now.toLocaleTimeString()}`;
    }
  } catch (e) {
    console.error("MOON market failed:", e);
  }
}

// Load + refresh
fetchBurnCache();
setInterval(fetchBurnCache, 5000);
fetchMoonMarket();
setInterval(fetchMoonMarket, 60000);
