const RPC_URL = "https://cronos-evm-rpc.publicnode.com";

const MULTICALL_TO = "0xcA11bde05977b3631167028862bE2a173976CA11";
const MULTICALL_DATA =
  "0x82ad56cb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000807d0de6fe5bf18a82e9b925eed8fa18e6ad200d0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000045ee9d9b500000000000000000000000000000000000000000000000000000000";

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

    // Take the last 32 bytes (64 hex chars) from result
    const lastWord = "0x" + resultHex.slice(-64);

    // Convert hex to BigInt, then to MOON with 18 decimals
    const valueWei = BigInt(lastWord);
    const decimals = 18n;
    const divisor = 10n ** decimals;

    const whole = valueWei / divisor;
    const fraction = valueWei % divisor;

    // Keep 2 decimal places
    const fractionStr = (fraction * 100n / divisor).toString().padStart(2, "0");
    const display = `${whole.toString()}.${fractionStr}`;

    const el = document.getElementById("burn-cache-value");
    if (el) el.textContent = display;
  } catch (e) {
    console.error("Error fetching burn cache", e);
  }
}

fetchBurnCache();
setInterval(fetchBurnCache, 5000);
