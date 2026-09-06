/* ==========================================
   POPCORN MANAGER V3
   ========================================== */

/* =========================
   BUSINESS SETTINGS
   ========================= */

const POPCORN_PRICE = 1;
const PRODUCT_NAME = "Small Popcorn";
const PAYMENT_METHOD = "Cash";
const PACKAGING = "Bags";


/* =========================
   LOCAL STORAGE
   ========================= */

let sales = JSON.parse(
  localStorage.getItem("popcornSales") || "[]"
);

let expenses = JSON.parse(
  localStorage.getItem("popcornExpenses") || "[]"
);

let stock = JSON.parse(
  localStorage.getItem("popcornStock") || "[]"
);

let dailyClosings = JSON.parse(
  localStorage.getItem("popcornDailyClosings") || "[]"
);

let startingCashByDate = JSON.parse(
  localStorage.getItem("popcornStartingCashByDate") || "{}"
);


/* =========================
   SAVE DATA
   ========================= */

function saveData() {
  localStorage.setItem(
    "popcornSales",
    JSON.stringify(sales)
  );

  localStorage.setItem(
    "popcornExpenses",
    JSON.stringify(expenses)
  );

  localStorage.setItem(
    "popcornStock",
    JSON.stringify(stock)
  );

  localStorage.setItem(
    "popcornDailyClosings",
    JSON.stringify(dailyClosings)
  );

  localStorage.setItem(
    "popcornStartingCashByDate",
    JSON.stringify(startingCashByDate)
  );
}


/* =========================
   DATE FUNCTIONS
   ========================= */

function getTodayKey() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDate(dateValue) {

  const date = new Date(dateValue);

  if (isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


function formatDateTime(dateValue) {

  const date = new Date(dateValue);

  if (isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}


function todayReadable() {

  return new Date().toLocaleDateString("en-ZM", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}


/* =========================
   MONEY
   ========================= */

function money(amount) {

  return "K" + Number(amount || 0).toFixed(2);
}


/* =========================
   HTML SECURITY
   ========================= */

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   TOAST
   ========================= */

function showToast(message) {

  const toast = document.getElementById("toast");

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


/* =========================
   PAGE NAVIGATION
   ========================= */

function showPage(pageId) {

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.remove("active");
  });

  const navButton = document.querySelector(
    `.nav-button[data-page="${pageId}"]`
  );

  if (navButton) {
    navButton.classList.add("active");
  }

  updateAll();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   TODAY'S SALES
   ========================= */

function getTodaySales() {

  const today = getTodayKey();

  return sales
    .filter(sale => sale.dateKey === today)
    .reduce(
      (total, sale) => total + Number(sale.total || 0),
      0
    );
}


function getTodayBags() {

  const today = getTodayKey();

  return sales
    .filter(sale => sale.dateKey === today)
    .reduce(
      (total, sale) => total + Number(sale.quantity || 0),
      0
    );
}


/* =========================
   TODAY'S EXPENSES
   ========================= */

function getTodayExpenses() {

  const today = getTodayKey();

  return expenses
    .filter(expense => expense.dateKey === today)
    .reduce(
      (total, expense) => total + Number(expense.amount || 0),
      0
    );
}


/* =========================
   STARTING CASH
   ========================= */

function getTodayStartingCash() {

  const today = getTodayKey();

  return Number(startingCashByDate[today] || 0);
}


function saveStartingCash() {

  if (isTodayClosed()) {
    showToast("Reopen the day first.");
    return;
  }

  const input = document.getElementById("startingCash");

  const amount = Number(input.value);

  if (input.value === "" || amount < 0) {
    showToast("Enter a valid starting cash amount.");
    return;
  }

  const today = getTodayKey();

  startingCashByDate[today] = amount;

  saveData();

  updateAll();

  showToast("Starting cash saved.");
}


/* =========================
   EXPECTED CASH
   ========================= */

function getTodayExpectedCash() {

  const startingCash = getTodayStartingCash();
  const salesTotal = getTodaySales();
  const expensesTotal = getTodayExpenses();

  return startingCash + salesTotal - expensesTotal;
}


/* =========================
   DAILY CLOSING
   ========================= */

function getTodayClosing() {

  const today = getTodayKey();

  return dailyClosings.find(
    closing => closing.dateKey === today
  );
}


function isTodayClosed() {

  return Boolean(getTodayClosing());
}


/* =========================
   ADD SALE
   ========================= */

function addSale() {

  if (isTodayClosed()) {
    showToast("Day is closed. Reopen it first.");
    return;
  }

  const quantityInput =
    document.getElementById("saleQuantity");

  const quantity = Number(quantityInput.value);

  if (!quantity || quantity <= 0) {
    showToast("Enter the number of bags sold.");
    return;
  }

  const today = getTodayKey();

  const sale = {
    id: Date.now(),
    dateKey: today,
    date: new Date().toISOString(),
    product: PRODUCT_NAME,
    quantity: quantity,
    price: POPCORN_PRICE,
    total: quantity * POPCORN_PRICE,
    payment: PAYMENT_METHOD
  };

  sales.unshift(sale);

  saveData();

  quantityInput.value = "";

  updateAll();

  showToast(
    `${quantity} bag${quantity === 1 ? "" : "s"} sold for ${money(sale.total)}`
  );
}


/* =========================
   SALE PREVIEW
   ========================= */

function updateSalePreview() {

  const quantity =
    Number(document.getElementById("saleQuantity").value) || 0;

  const total = quantity * POPCORN_PRICE;

  document.getElementById(
    "saleTotalPreview"
  ).textContent = money(total);
}


/* =========================
   DELETE SALE
   ========================= */

function deleteSale(id) {

  const sale = sales.find(item => item.id === id);

  if (!sale) return;

  if (
    dailyClosings.some(
      closing => closing.dateKey === sale.dateKey
    )
  ) {
    showToast("This sale belongs to a closed day.");
    return;
  }

  if (!confirm("Delete this sale?")) {
    return;
  }

  sales = sales.filter(item => item.id !== id);

  saveData();

  updateAll();

  showToast("Sale deleted.");
}


/* =========================
   ADD EXPENSE
   ========================= */

function addExpense() {

  if (isTodayClosed()) {
    showToast("Day is closed. Reopen it first.");
    return;
  }

  const category =
    document.getElementById("expenseCategory").value;

  const amountInput =
    document.getElementById("expenseAmount");

  const noteInput =
    document.getElementById("expenseNote");

  const amount = Number(amountInput.value);

  if (!amountInput.value || amount <= 0) {
    showToast("Enter a valid expense amount.");
    return;
  }

  const today = getTodayKey();

  const expense = {
    id: Date.now(),
    dateKey: today,
    date: new Date().toISOString(),
    category: category,
    amount: amount,
    note: noteInput.value.trim()
  };

  expenses.unshift(expense);

  saveData();

  amountInput.value = "";
  noteInput.value = "";

  updateAll();

  showToast(`Expense of ${money(amount)} saved.`);
}


/* =========================
   DELETE EXPENSE
   ========================= */

function deleteExpense(id) {

  const expense = expenses.find(item => item.id === id);

  if (!expense) return;

  if (
    dailyClosings.some(
      closing => closing.dateKey === expense.dateKey
    )
  ) {
    showToast("This expense belongs to a closed day.");
    return;
  }

  if (!confirm("Delete this expense?")) {
    return;
  }

  expenses = expenses.filter(
    item => item.id !== id
  );

  saveData();

  updateAll();

  showToast("Expense deleted.");
}


/* =========================
   ADD STOCK
   ========================= */

function addStock() {

  const itemInput =
    document.getElementById("stockItem");

  const quantityInput =
    document.getElementById("stockQuantity");

  const item = itemInput.value.trim();
  const quantity = Number(quantityInput.value);

  if (!item) {
    showToast("Enter a stock item.");
    return;
  }

  if (
    quantityInput.value === "" ||
    quantity < 0
  ) {
    showToast("Enter a valid quantity.");
    return;
  }

  const existing = stock.find(
    stockItem =>
      stockItem.name.toLowerCase() === item.toLowerCase()
  );

  if (existing) {

    existing.quantity += quantity;

  } else {

    stock.unshift({
      id: Date.now(),
      name: item,
      quantity: quantity
    });

  }

  saveData();

  itemInput.value = "";
  quantityInput.value = "";

  updateAll();

  showToast("Stock updated.");
}


/* =========================
   DELETE STOCK
   ========================= */

function deleteStock(id) {

  if (!confirm("Remove this stock item?")) {
    return;
  }

  stock = stock.filter(item => item.id !== id);

  saveData();

  updateAll();

  showToast("Stock item removed.");
}


/* =========================
   CLOSE DAY
   ========================= */

function closeDay() {

  if (isTodayClosed()) {
    showToast("Today is already closed.");
    return;
  }

  const actualInput =
    document.getElementById("actualCash");

  const actualCash = Number(actualInput.value);

  if (
    actualInput.value === "" ||
    actualCash < 0
  ) {
    showToast("Enter your actual closing cash.");
    return;
  }

  const today = getTodayKey();

  const startingCash = getTodayStartingCash();
  const todaySales = getTodaySales();
  const todayExpenses = getTodayExpenses();
  const todayBags = getTodayBags();

  const expectedClosingCash =
    startingCash +
    todaySales -
    todayExpenses;

  const difference =
    actualCash -
    expectedClosingCash;

  const closing = {
    id: Date.now(),
    dateKey: today,
    date: new Date().toISOString(),

    startingCash: startingCash,
    sales: todaySales,
    expenses: todayExpenses,

    expectedClosingCash: expectedClosingCash,
    actualClosingCash: actualCash,

    difference: difference,

    bagsSold: todayBags,

    closedAt: new Date().toISOString()
  };

  dailyClosings.unshift(closing);

  saveData();

  updateAll();

  showToast("Business day closed successfully.");
}


/* =========================
   REOPEN TODAY
   ========================= */

function reopenToday() {

  const closing = getTodayClosing();

  if (!closing) {
    showToast("Today's business is already open.");
    return;
  }

  const confirmed = confirm(
    "Reopen today's business?\n\n" +
    "You will be able to record or correct today's sales and expenses again."
  );

  if (!confirmed) {
    return;
  }

  dailyClosings = dailyClosings.filter(
    item => item.dateKey !== getTodayKey()
  );

  saveData();

  updateAll();

  showToast("Today has been reopened.");
}


/* =========================
   RENDER DASHBOARD
   ========================= */

function renderDashboard() {

  document.getElementById(
    "todayDate"
  ).textContent = todayReadable();

  const startingCash =
    getTodayStartingCash();

  const todaySales =
    getTodaySales();

  const todayExpenses =
    getTodayExpenses();

  const todayBags =
    getTodayBags();

  const expectedCash =
    getTodayExpectedCash();

  document.getElementById(
    "dashboardStartingCash"
  ).textContent = money(startingCash);

  document.getElementById(
    "dashboardSales"
  ).textContent = money(todaySales);

  document.getElementById(
    "dashboardExpenses"
  ).textContent = money(todayExpenses);

  document.getElementById(
    "dashboardBags"
  ).textContent = todayBags;

  document.getElementById(
    "dashboardExpectedCash"
  ).textContent = money(expectedCash);


  const closing = getTodayClosing();

  const actualBox =
    document.getElementById(
      "dashboardActualCashBox"
    );

  if (closing) {

    actualBox.classList.remove("hidden");

    document.getElementById(
      "dashboardActualCash"
    ).textContent =
      money(closing.actualClosingCash);

    const differenceElement =
      document.getElementById(
        "dashboardDifference"
      );

    differenceElement.textContent =
      money(closing.difference);

    actualBox.classList.remove(
      "positive",
      "negative"
    );

    if (closing.difference > 0) {
      actualBox.classList.add("positive");
    }

    if (closing.difference < 0) {
      actualBox.classList.add("negative");
    }

  } else {

    actualBox.classList.add("hidden");

  }
}


/* =========================
   RENDER SALES
   ========================= */

function renderSales() {

  const list =
    document.getElementById("salesList");

  document.getElementById(
    "salesCount"
  ).textContent = sales.length;

  if (sales.length === 0) {

    list.innerHTML = `
      <div class="empty-state">
        🍿 No sales recorded yet.
      </div>
    `;

    return;
  }

  list.innerHTML = sales.map(sale => {

    const closed =
      dailyClosings.some(
        closing =>
          closing.dateKey === sale.dateKey
      );

    return `
      <div class="list-item">

        <div class="list-main">

          <strong>
            ${escapeHTML(sale.quantity)}
            bag${sale.quantity === 1 ? "" : "s"}
          </strong>

          <span>
            ${escapeHTML(sale.product)}
            • ${formatDateTime(sale.date)}
            • ${escapeHTML(sale.payment)}
          </span>

        </div>

        <div class="list-amount">

          <strong>
            ${money(sale.total)}
          </strong>

          ${
            closed
              ? `<span class="locked-label">🔒 Closed</span>`
              : `<button class="delete-button"
                    onclick="deleteSale(${sale.id})">
                    Delete
                 </button>`
          }

        </div>

      </div>
    `;

  }).join("");
}


/* =========================
   RENDER EXPENSES
   ========================= */

function renderExpenses() {

  const list =
    document.getElementById("expensesList");

  document.getElementById(
    "expensesCount"
  ).textContent = expenses.length;

  if (expenses.length === 0) {

    list.innerHTML = `
      <div class="empty-state">
        💸 No expenses recorded yet.
      </div>
    `;

    return;
  }

  list.innerHTML = expenses.map(expense => {

    const closed =
      dailyClosings.some(
        closing =>
          closing.dateKey === expense.dateKey
      );

    return `
      <div class="list-item">

        <div class="list-main">

          <strong>
            ${escapeHTML(expense.category)}
          </strong>

          <span>
            ${
              expense.note
                ? escapeHTML(expense.note) + " • "
                : ""
            }
            ${formatDateTime(expense.date)}
          </span>

        </div>

        <div class="list-amount">

          <strong>
            -${money(expense.amount)}
          </strong>

          ${
            closed
              ? `<span class="locked-label">🔒 Closed</span>`
              : `<button class="delete-button"
                    onclick="deleteExpense(${expense.id})">
                    Delete
                 </button>`
          }

        </div>

      </div>
    `;

  }).join("");
}


/* =========================
   RENDER STOCK
   ========================= */

function renderStock() {

  const list =
    document.getElementById("stockList");

  if (stock.length === 0) {

    list.innerHTML = `
      <div class="empty-state">
        📦 No stock items added yet.
      </div>
    `;

    return;
  }

  list.innerHTML = stock.map(item => {

    const low =
      Number(item.quantity) <= 10;

    return `
      <div class="stock-card">

        <div>
          <h3>${escapeHTML(item.name)}</h3>

          <p>
            ${
              low
                ? "⚠️ Low stock"
                : "Available"
            }
          </p>
        </div>

        <div>

          <div class="stock-quantity ${low ? "low-stock" : ""}">
            ${escapeHTML(item.quantity)}
          </div>

          <button
            class="delete-button"
            onclick="deleteStock(${item.id})">
            Delete
          </button>

        </div>

      </div>
    `;

  }).join("");
}


/* =========================
   RENDER DAILY CLOSE
   ========================= */

function renderDailyClose() {

  const openPanel =
    document.getElementById("openDayPanel");

  const closedPanel =
    document.getElementById("closedDayPanel");

  const closing =
    getTodayClosing();

  if (closing) {

    openPanel.classList.add("hidden");
    closedPanel.classList.remove("hidden");

    document.getElementById(
      "closedDateText"
    ).textContent =
      `Closed on ${formatDateTime(closing.closedAt)}`;

    document.getElementById(
      "closedExpected"
    ).textContent =
      money(closing.expectedClosingCash);

    document.getElementById(
      "closedActual"
    ).textContent =
      money(closing.actualClosingCash);

    const difference =
      document.getElementById(
        "closedDifference"
      );

    difference.textContent =
      money(closing.difference);

    difference.classList.remove(
      "difference-positive",
      "difference-negative"
    );

    if (closing.difference > 0) {
      difference.classList.add(
        "difference-positive"
      );
    }

    if (closing.difference < 0) {
      difference.classList.add(
        "difference-negative"
      );
    }

    document.getElementById(
      "closedBags"
    ).textContent =
      closing.bagsSold;

  } else {

    openPanel.classList.remove("hidden");
    closedPanel.classList.add("hidden");

    const startingCash =
      getTodayStartingCash();

    const salesTotal =
      getTodaySales();

    const expensesTotal =
      getTodayExpenses();

    const bags =
      getTodayBags();

    const expected =
      getTodayExpectedCash();

    document.getElementById(
      "startingCash"
    ).value =
      startingCash || "";

    document.getElementById(
      "closeStartingCash"
    ).textContent =
      money(startingCash);

    document.getElementById(
      "closeSales"
    ).textContent =
      money(salesTotal);

    document.getElementById(
      "closeExpenses"
    ).textContent =
      money(expensesTotal);

    document.getElementById(
      "closeBags"
    ).textContent =
      bags;

    document.getElementById(
      "closeExpectedCash"
    ).textContent =
      money(expected);

  }

  renderClosingHistory();
}


/* =========================
   CLOSING HISTORY
   ========================= */

function renderClosingHistory() {

  const list =
    document.getElementById("closingHistory");

  if (dailyClosings.length === 0) {

    list.innerHTML = `
      <div class="empty-state">
        🧾
