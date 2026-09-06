const POPCORN_PRICE = 1;
const PRODUCT_NAME = "Small Popcorn";

let sales = JSON.parse(localStorage.getItem("popcornSales") || "[]");
let expenses = JSON.parse(localStorage.getItem("popcornExpenses") || "[]");
let stock = JSON.parse(localStorage.getItem("popcornStock") || "[]");
let dailyClosings = JSON.parse(localStorage.getItem("popcornDailyClosings") || "[]");
let startingCashByDate = JSON.parse(
  localStorage.getItem("popcornStartingCashByDate") || "{}"
);


/* SAVE */

function saveData() {
  localStorage.setItem("popcornSales", JSON.stringify(sales));
  localStorage.setItem("popcornExpenses", JSON.stringify(expenses));
  localStorage.setItem("popcornStock", JSON.stringify(stock));
  localStorage.setItem(
    "popcornDailyClosings",
    JSON.stringify(dailyClosings)
  );
  localStorage.setItem(
    "popcornStartingCashByDate",
    JSON.stringify(startingCashByDate)
  );
}


/* DATE */

function getTodayKey() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(value) {
  const d = new Date(value);

  if (isNaN(d.getTime())) return value;

  return d.toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value) {
  const d = new Date(value);

  if (isNaN(d.getTime())) return value;

  return d.toLocaleString("en-ZM", {
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


/* MONEY */

function money(value) {
  return "K" + Number(value || 0).toFixed(2);
}


/* SECURITY */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* TOAST */

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


/* NAVIGATION */

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

  const nav = document.querySelector(
    `.nav-button[data-page="${pageId}"]`
  );

  if (nav) {
    nav.classList.add("active");
  }

  updateAll();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* TODAY */

function getTodaySales() {

  const today = getTodayKey();

  return sales
    .filter(s => s.dateKey === today)
    .reduce((sum, s) => sum + Number(s.total || 0), 0);
}

function getTodayBags() {

  const today = getTodayKey();

  return sales
    .filter(s => s.dateKey === today)
    .reduce((sum, s) => sum + Number(s.quantity || 0), 0);
}

function getTodayExpenses() {

  const today = getTodayKey();

  return expenses
    .filter(e => e.dateKey === today)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
}


/* STARTING CASH */

function getTodayStartingCash() {
  return Number(startingCashByDate[getTodayKey()] || 0);
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

  startingCashByDate[getTodayKey()] = amount;

  saveData();
  updateAll();

  showToast("Starting cash saved.");
}


/* EXPECTED CASH */

function getTodayExpectedCash() {

  return (
    getTodayStartingCash() +
    getTodaySales() -
    getTodayExpenses()
  );
}


/* CLOSED? */

function getTodayClosing() {

  return dailyClosings.find(
    c => c.dateKey === getTodayKey()
  );
}

function isTodayClosed() {
  return Boolean(getTodayClosing());
}


/* SALE */

function addSale() {

  if (isTodayClosed()) {
    showToast("Day is closed. Reopen it first.");
    return;
  }

  const input = document.getElementById("saleQuantity");
  const quantity = Number(input.value);

  if (!quantity || quantity <= 0) {
    showToast("Enter the number of bags sold.");
    return;
  }

  const sale = {
    id: Date.now(),
    dateKey: getTodayKey(),
    date: new Date().toISOString(),
    product: PRODUCT_NAME,
    quantity: quantity,
    price: POPCORN_PRICE,
    total: quantity * POPCORN_PRICE,
    payment: "Cash"
  };

  sales.unshift(sale);

  saveData();

  input.value = "";
  updateSalePreview();
  updateAll();

  showToast(`${quantity} bag(s) sold for ${money(sale.total)}`);
}


/* SALE PREVIEW */

function updateSalePreview() {

  const quantity =
    Number(document.getElementById("saleQuantity").value) || 0;

  document.getElementById("saleTotalPreview").textContent =
    money(quantity * POPCORN_PRICE);
}


/* DELETE SALE */

function deleteSale(id) {

  const sale = sales.find(s => s.id === id);

  if (!sale) return;

  if (
    dailyClosings.some(c => c.dateKey === sale.dateKey)
  ) {
    showToast("This sale belongs to a closed day.");
    return;
  }

  if (!confirm("Delete this sale?")) return;

  sales = sales.filter(s => s.id !== id);

  saveData();
  updateAll();

  showToast("Sale deleted.");
}


/* EXPENSE */

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

  const expense = {
    id: Date.now(),
    dateKey: getTodayKey(),
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


/* DELETE EXPENSE */

function deleteExpense(id) {

  const expense = expenses.find(e => e.id === id);

  if (!expense) return;

  if (
    dailyClosings.some(c => c.dateKey === expense.dateKey)
  ) {
    showToast("This expense belongs to a closed day.");
    return;
  }

  if (!confirm("Delete this expense?")) return;

  expenses = expenses.filter(e => e.id !== id);

  saveData();
  updateAll();

  showToast("Expense deleted.");
}


/* STOCK */

function addStock() {

  const itemInput =
    document.getElementById("stockItem");

  const quantityInput =
    document.getElementById("stockQuantity");

  const name = itemInput.value.trim();
  const quantity = Number(quantityInput.value);

  if (!name) {
    showToast("Enter a stock item.");
    return;
  }

  if (quantityInput.value === "" || quantity < 0) {
    showToast("Enter a valid quantity.");
    return;
  }

  const existing = stock.find(
    item => item.name.toLowerCase() === name.toLowerCase()
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    stock.unshift({
      id: Date.now(),
      name: name,
      quantity: quantity
    });
  }

  saveData();

  itemInput.value = "";
  quantityInput.value = "";

  updateAll();

  showToast("Stock updated.");
}

function deleteStock(id) {

  if (!confirm("Remove this stock item?")) return;

  stock = stock.filter(item => item.id !== id);

  saveData();
  updateAll();

  showToast("Stock removed.");
}


/* CLOSE DAY */

function closeDay() {

  if (isTodayClosed()) {
    showToast("Today is already closed.");
    return;
  }

  const input =
    document.getElementById("actualCash");

  const actualCash = Number(input.value);

  if (input.value === "" || actualCash < 0) {
    showToast("Enter your actual closing cash.");
    return;
  }

  const startingCash = getTodayStartingCash();
  const salesTotal = getTodaySales();
  const expensesTotal = getTodayExpenses();
  const bags = getTodayBags();

  const expected =
    startingCash +
    salesTotal -
    expensesTotal;

  const difference =
    actualCash - expected;

  const closing = {

    id: Date.now(),

    dateKey: getTodayKey(),

    date: new Date().toISOString(),

    startingCash: startingCash,

    sales: salesTotal,

    expenses: expensesTotal,

    expectedClosingCash: expected,

    actualClosingCash: actualCash,

    difference: difference,

    bagsSold: bags,

    closedAt: new Date().toISOString()

  };

  dailyClosings.unshift(closing);

  saveData();
  updateAll();

  showToast("Business day closed successfully.");
}


/* REOPEN */

function reopenToday() {

  if (!isTodayClosed()) {
    showToast("Today is already open.");
    return;
  }

  if (!confirm(
    "Reopen today's business?\n\nYou can then correct today's sales and expenses."
  )) {
    return;
  }

  dailyClosings =
    dailyClosings.filter(
      c => c.dateKey !== getTodayKey()
    );

  saveData();
  updateAll();

  showToast("Today has been reopened.");
}


/* DASHBOARD */

function renderDashboard() {

  document.getElementById("todayDate").textContent =
    todayReadable();

  document.getElementById("dashboardStartingCash").textContent =
    money(getTodayStartingCash());

  document.getElementById("dashboardSales").textContent =
    money(getTodaySales());

  document.getElementById("dashboardExpenses").textContent =
    money(getTodayExpenses());

  document.getElementById("dashboardBags").textContent =
    getTodayBags();

  document.getElementById("dashboardExpectedCash").textContent =
    money(getTodayExpectedCash());

  const box =
    document.getElementById("dashboardActualCashBox");

  const closing = getTodayClosing();

  if (closing) {

    box.classList.remove("hidden");

    document.getElementById("dashboardActualCash").textContent =
      money(closing.actualClosingCash);

    const diff =
      document.getElementById("dashboardDifference");

    diff.textContent =
      money(closing.difference);

    box.classList.remove("positive", "negative");

    if (closing.difference > 0) {
      box.classList.add("positive");
    }

    if (closing.difference < 0) {
      box.classList.add("negative");
    }

  } else {

    box.classList.add("hidden");

  }
}


/* SALES LIST */

function renderSales() {

  const list =
    document.getElementById("salesList");

  document.getElementById("salesCount").textContent =
    sales.length;

  if (!sales.length) {

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
        c => c.dateKey === sale.dateKey
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
            • Cash
          </span>

        </div>

        <div class="list-amount">

          <strong>${money(sale.total)}</strong>

          ${
            closed
              ? `<span class="locked-label">🔒 Closed</span>`
              : `<button
                  class="delete-button"
                  onclick="deleteSale(${sale.id})">
                  Delete
                </button>`
          }

        </div>

      </div>
    `;

  }).join("");
}


/* EXPENSE LIST */

function renderExpenses() {

  const list =
    document.getElementById("expensesList");

  document.getElementById("expensesCount").textContent =
    expenses.length;

  if (!expenses.length) {

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
        c => c.dateKey === expense.dateKey
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

          <strong>-${money(expense.amount)}</strong>

          ${
            closed
              ? `<span class="locked-label">🔒 Closed</span>`
              : `<button
                  class="delete-button"
                  onclick="deleteExpense(${expense.id})">
                  Delete
                </button>`
          }

        </div>

      </div>
    `;

  }).join("");
}


/* STOCK LIST */

function renderStock() {

  const list =
    document.getElementById("stockList");

  if (!stock.length) {

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
            ${low ? "⚠️ Low stock" : "Available"}
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


/* DAILY CLOSE */

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

    document.getElementById("closedDateText").textContent =
      `Closed on ${formatDateTime(closing.closedAt)}`;

    document.getElementById("closedExpected").textContent =
      money(closing.expectedClosingCash);

    document.getElementById("closedActual").textContent =
      money(closing.actualClosingCash);

    const difference =
      document.getElementById("closedDifference");

    difference.textContent =
      money(closing.difference);

    difference.classList.remove(
      "difference-positive",
      "difference-negative"
    );

    if (closing.difference > 0) {
      difference.classList.add("difference-positive");
    }

    if (closing.difference < 0) {
      difference.classList.add("difference-negative");
    }

    document.getElementById("closedBags").textContent =
      closing.bagsSold;

  } else {

    openPanel.classList.remove("hidden");
    closedPanel.classList.add("hidden");

    const starting =
      getTodayStartingCash();

    document.getElementById("startingCash").value =
      starting || "";

    document.getElementById("closeStartingCash").textContent =
      money(starting);

    document.getElementById("closeSales").textContent =
      money(getTodaySales());

    document.getElementById("closeExpenses").textContent =
      money(getTodayExpenses());

    document.getElementById("closeBags").textContent =
      getTodayBags();

    document.getElementById("closeExpectedCash").textContent =
      money(getTodayExpectedCash());

  }

  renderClosingHistory();
}


/* HISTORY */

function renderClosingHistory() {

  const list =
    document.getElementById("closingHistory");

  if (!dailyClosings.length) {

    list.innerHTML = `
      <div class="empty-state">
        🧾 No closed days yet.
      </div>
    `;

    return;
  }

  const sorted =
    [...dailyClosings].sort(
      (a, b) =>
        new Date(b.closedAt) -
        new Date(a.closedAt)
    );

  list.innerHTML = sorted.map(c => {

    let differenceClass = "";

    if (c.difference > 0) {
      differenceClass = "difference-positive";
    }

    if (c.difference < 0) {
      differenceClass = "difference-negative";
    }

    return `
      <div class="closing-item">

        <div class="closing-header">

          <strong>${formatDate(c.date)}</strong>

          <span class="closed-tag">CLOSED</span>

        </div>

        <div class="closing-details">

          <div>
            <span>Starting Cash</span>
            <strong>${money(c.startingCash)}</strong>
          </div>

          <div>
            <span>Sales</span>
            <strong>${money(c.sales)}</strong>
          </div>

          <div>
            <span>Expenses</span>
            <strong>${money(c.expenses)}</strong>
          </div>

          <div>
            <span>Bags Sold</span>
            <strong>${c.bagsSold}</strong>
          </div>

          <div>
            <span>Expected</span>
            <strong>${money(c.expectedClosingCash)}</strong>
          </div>

          <div>
            <span>Actual</span>
            <strong>${money(c.actualClosingCash)}</strong>
          </div>

          <div>
            <span>Difference</span>
            <strong class="${differenceClass}">
              ${money(c.difference)}
            </strong>
          </div>

        </div>

      </div>
    `;

  }).join("");
}


/* REPORTS */

function renderReports() {

  const totalSales =
    sales.reduce(
      (sum, sale) =>
        sum + Number(sale.total || 0),
      0
    );

  const totalExpenses =
    expenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    );

  const totalBags =
    sales.reduce(
      (sum, sale) =>
        sum + Number(sale.quantity || 0),
      0
    );

  document.getElementById("reportSales").textContent =
    money(totalSales);

  document.getElementById("reportExpenses").textContent =
    money(totalExpenses);

  document.getElementById("reportProfit").textContent =
    money(totalSales - totalExpenses);

  document.getElementById("reportBags").textContent =
    totalBags;

  document.getElementById("reportClosedDays").textContent =
    dailyClosings.length;
}


/* STATUS */

function renderDayStatus() {

  const status =
    document.getElementById("dayStatus");

  const salesLocked =
    document.getElementById("salesLocked");

  const expensesLocked =
    document.getElementById("expensesLocked");

  const saleButton =
    document.getElementById("saleButton");

  const expenseButton =
    document.getElementById("expenseButton");

  if (isTodayClosed()) {

    status.textContent = "Day Closed";

    status.classList.remove("open");
    status.classList.add("closed");

    salesLocked.classList.remove("hidden");
    expensesLocked.classList.remove("hidden");

    saleButton.disabled = true;
    expenseButton.disabled = true;

    saleButton.style.opacity = ".5";
    expenseButton.style.opacity = ".5";

  } else {

    status.textContent = "Day Open";

    status.classList.remove("closed");
    status.classList.add("open");

    salesLocked.classList.add("hidden");
    expensesLocked.classList.add("hidden");

    saleButton.disabled = false;
    expenseButton.disabled = false;

    saleButton.style.opacity = "1";
    expenseButton.style.opacity = "1";

  }
}


/* RECENT SALES */

function renderRecentSales() {

  const list =
    document.getElementById("recentSales");

  const recent =
    sales.slice(0, 5);

  if (!recent.length) {

    list.innerHTML = `
      <div class="empty-state">
        🍿 No sales yet.
      </div>
     
