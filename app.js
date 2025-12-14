const RPC_URL = "https://cronos-evm-rpc.publicnode.com";

const MULTICALL_TO = "0xcA11bde05977b3631167028862bE2a173976CA11";
const MULTICALL_DATA =
  "0x82ad56cb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000807d0de6fe5bf18a82e9b925eed8fa18e6ad200d0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000045ee9d9b500000000000000000000000000000000000000000000000000000000";

const TARGET_MOON = 1_000_000;

function formatMoon(valueWei) {
  const decimals = 18n;
  const divisor = 10n ** decimals;

  const whole = valueWei / divisor;
  const fraction = valueWei % divisor;

  const fractionStr = (fraction * 100n / divisor).toString().padStart(2, "0");
  return `${whole.toString()}.${fractionStr}`;
}

async function fetchBurnCache() {
  try {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: MULTICALL_TO,
          data: MULTICALL_DATA
        },
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

    const remaining = Math.max(0, TARGET_MOON - moonWhole);
    const remainingEl = document.getElementById("remaining-value");
    if (remainingEl) remainingEl.textContent = remaining.toLocaleString();

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
