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

    const lastWord = "0x" + resultHex.slice(-64);
    const valueWei = BigInt(lastWord);

    const display = formatMoon(valueWei);
    const burnEl = document.getElementById("burn-cache-value");
    if (burnEl) burnEl.textContent = display;

    const decimals = 18n;
    const divisor = 10n ** decimals;
    const moonWhole = Number(valueWei / divisor);

    let percent = 0;
    if (!Number.isNaN(moonWhole) && Number.isFinite(moonWhole)) {
      percent = Math.min(100, (moonWhole / TARGET_MOON) * 100);
    }
    const percentText = `${percent.toFixed(1)}%`;

    const percentEl = document.getElementById("progress-percent");
    const fillEl = document.getElementById("progress-fill");
    if (percentEl) percentEl.textContent = percentText;
    if (fillEl) fillEl.style.width = `${percent}%`;

    const remaining = Math.max(0, TARGET_MOON - moonWhole);
    const remainingEl = document.getElementById("remaining-value");
    if (remainingEl) {
      remainingEl.textContent = remaining.toLocaleString();
    }

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

fetchBurnCache();
setInterval(fetchBurnCache, 5000);

// ---------- $MOON market card (Dexscreener) ----------

const MOON_PAIR_API =
  "https://api.dexscreener.com/latest/dex/pairs/cronos/0x9e5a2f511cfc1eb4a6be528437b9f2ddcaef9975";

async function fetchMoonMarket() {
  try {
    const res = await fetch(MOON_PAIR_API);
    const data = await res.json();

    if (!data || !data.pairs || !data.pairs[0]) return;

    const pair = data.pairs[0];

    const priceUsd = pair.priceUsd ? Number(pair.priceUsd) : null;
    const change24h = pair.priceChange && pair.priceChange.h24 != null
      ? Number(pair.priceChange.h24)
      : null;

    const priceEl = document.getElementById("moon-price");
    if (priceEl && priceUsd != null && Number.isFinite(priceUsd)) {
      priceEl.textContent = `$${priceUsd.toFixed(6)}`;
    }

    const changeEl = document.getElementById("moon-change");
    if (changeEl && change24h != null && Number.isFinite(change24h)) {
      const sign = change24h > 0 ? "+" : "";
      changeEl.textContent = `24h: ${sign}${change24h.toFixed(2)}%`;
      changeEl.style.color = change24h >= 0 ? "#19ff6b" : "#ff3737";
    }
  } catch (e) {
    console.error("Error fetching MOON market data", e);
  }
}

fetchMoonMarket();
setInterval(fetchMoonMarket, 60000);
