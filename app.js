const RPC_URL = "https://cronos-evm-rpc.publicnode.com";

const MULTICALL_TO =
  "0xcA11bde05977b3631167028862bE2a173976CA11";
const MULTICALL_DATA =
  "0x82ad56cb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000807d0de6fe5bf18a82e9b925eed8fa18e6ad200d0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000045ee9d9b500000000000000000000000000000000000000000000000000000000";

const TARGET_MOON = 1000000; // 1M goal

function formatMoon(valueWei) {
  const decimals = 18n;
  const divisor = 10n ** decimals;
  const whole = valueWei / divisor;
  const fraction = valueWei % divisor;
  const fractionStr = (fraction * 100n / divisor)
    .toString()
    .padStart(2, "0");
  return `${whole.toString()}.${fractionStr}`;
}

async function fetchBurnCache() {
  try {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        { to: MULTICALL_TO, data: MULTICALL_DATA },
        "latest"
      ]
    };

    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    const resultHex = json.result;

    // Take the last 32 bytes as the value
    const lastWord = "0x" + resultHex.slice(-64);
    const valueWei = BigInt(lastWord);

    // Main cache display
    const display = formatMoon(valueWei);
    const burnEl = document.getElementById("burn-cache-value");
    if (burnEl) burnEl.textContent = display;

    // Whole MOON amount for math
    const decimals = 18n;
    const divisor = 10n ** decimals;
    const moonWhole = Number(valueWei / divisor);

    // Progress toward goal
    let percent = 0;
    if (!Number.isNaN(moonWhole) && Number.isFinite(moonWhole)) {
      percent = Math.min(100, (moonWhole / TARGET_MOON) * 100);
    }
    const percentText = `${percent.toFixed(1)}%`;

    const percentEl = document.getElementById("progress-percent");
    const fillEl = document.getElementById("progress-fill");
    if (percentEl) percentEl.textContent = percentText;
    if (fillEl) fillEl.style.width = `${percent}%`;

    // Remaining cache
    const remaining = Math.max(0, TARGET_MOON - moonWhole);
    const remainingEl = document.getElementById("remaining-value");
    if (remainingEl) {
      remainingEl.textContent = remaining.toLocaleString();
    }

    // Last updated time
    const now = new Date();
    const ts = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const lastUpdatedEl = document.getElementById("last-updated");
    if (lastUpdatedEl) lastUpdatedEl.textContent = `Last update: ${ts}`;
  } catch (e) {
    console.error("Error fetching burn cache", e);
  }
}

// Initial load + refresh every 5 seconds
fetchBurnCache();
setInterval(fetchBurnCache, 5000);

// --- MOON market card via CoinGecko ---
const MOON_CG_API =
  "https://api.coingecko.com/api/v3/simple/price?ids=moonflow&vs_currencies=usd&include_24hr_change=true";

async function fetchMoonMarket() {
  try {
    const res = await fetch(MOON_CG_API);
    if (!res.ok) throw new Error("CoinGecko response not ok");
    const data = await res.json();

    const coin = data.moonflow;
    if (!coin || typeof coin.usd !== "number") {
      throw new Error("Unexpected CoinGecko payload");
    }

    const priceUsd = coin.usd;
    const change24h = coin.usd_24h_change || 0;

    const priceEl = document.getElementById("moon-price");
    const changeEl = document.getElementById("moon-change");
    const lastUpdatedEl = document.getElementById("moon-last-updated");

    if (priceEl && !Number.isNaN(priceUsd)) {
      priceEl.textContent = `$${priceUsd.toFixed(6)}`;
    }

    if (changeEl && !Number.isNaN(change24h)) {
      const sign = change24h > 0 ? "+" : "";
      changeEl.textContent = `24h: ${sign}${change24h.toFixed(2)}%`;

      if (change24h > 0) {
        changeEl.style.color = "#19ff6b";
        changeEl.style.borderColor = "rgba(25,255,107,0.5)";
      } else if (change24h < 0) {
        changeEl.style.color = "#ff3737";
        changeEl.style.borderColor = "rgba(255,55,55,0.7)";
      } else {
        changeEl.style.color = "#f5f5f7";
        changeEl.style.borderColor = "rgba(255,255,255,0.08)";
      }
    }

    if (lastUpdatedEl) {
      const now = new Date();
      const ts = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      lastUpdatedEl.textContent = `Last update: ${ts}`;
    }
  } catch (e) {
    console.error("Error fetching MOON market data", e);
  }
}

// Initial load + refresh for MOON market
fetchMoonMarket();
setInterval(fetchMoonMarket, 60000);
