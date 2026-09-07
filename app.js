const KEYS = {
  sales: "popcornSales",
  expenses: "popcornExpenses",
  stock: "popcornStock",
  starting: "popcornStartingCashByDate",
  closing: "popcornDailyClosings"
};

const PRICE = 1;

function get(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let sales = get(KEYS.sales);
let expenses = get(KEYS.expenses);
let stock = get(KEYS.stock);
let startingCash = get(KEYS.starting, {});
let closings = get(KEYS.closing, []);

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function todayText() {
  return new Date().toLocaleDateString("en-ZM", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function money(n) {
  return `K${Number(n || 0).toFixed(2)}`;
}

function escapeHTML(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString("en-ZM");
}

function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}

function todaySales() {
  return sales.filter(x => x.dateKey === todayKey());
}

function todayExpenses() {
  return expenses.filter(x => x.dateKey === todayKey());
}

function todayBags() {
  return todaySales().reduce(
    (sum, x) => sum + Number(x.quantity || 0),
    0
  );
}

function salesTotal() {
  return todaySales().reduce(
    (sum, x) => sum + Number(x.total || 0),
    0
  );
}

function expensesTotal() {
  return todayExpenses().reduce(
    (sum, x) => sum + Number(x.amount || 0),
    0
  );
}

function getStartingCash() {
  return Number(startingCash[todayKey()] || 0);
}

function expectedCash() {
  return getStartingCash() + salesTotal() - expensesTotal();
}

function isTodayClosed() {
  return closings.some(x => x.dateKey === todayKey());
}

function currentClosing() {
  return closings.find(x => x.dateKey === todayKey());
}

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });

  const target = document.getElementById(page);

  if (target) {
    target.classList.add("active");
  }

  document.querySelectorAll(".nav-button").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.page === page
    );
  });

  updateAll();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function saveStartingCash() {
  if (isTodayClosed()) {
    toast("Today is already closed.");
    return;
  }

  const input = document.getElementById("startingCash");
  const amount = Number(input?.value);

  if (isNaN(amount) || amount < 0) {
    toast("Enter a valid starting cash amount.");
    return;
  }

  startingCash[todayKey()] = amount;

  save(KEYS.starting, startingCash);

  toast("Starting cash saved.");

  updateAll();
}

function addSale() {
  if (isTodayClosed()) {
    toast("Today is closed.");
    return;
  }

  const input = document.getElementById("saleQuantity");
  const quantity = Number(input?.value);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    toast("Enter a valid quantity.");
    return;
  }

  sales.push({
    id: Date.now(),
    dateKey: todayKey(),
    date: new Date().toISOString(),
    quantity: quantity,
    total: quantity * PRICE
  });

  save(KEYS.sales, sales);

  if (input) {
    input.value = "";
  }

  toast(
    `${quantity} bag${quantity === 1 ? "" : "s"} sold.`
  );

  updateAll();
}

function deleteSale(id) {
  if (isTodayClosed()) {
    toast("Closed days cannot be changed.");
    return;
  }

  sales = sales.filter(x => x.id !== id);

  save(KEYS.sales, sales);

  toast("Sale deleted.");

  updateAll();
}

function addExpense() {
  if (isTodayClosed()) {
    toast("Today is closed.");
    return;
  }

  const category =
    document.getElementById("expenseCategory")?.value.trim();

  const amount =
    Number(document.getElementById("expenseAmount")?.value);

  const note =
    document.getElementById("expenseNote")?.value.trim();

  if (!category) {
    toast("Enter an expense category.");
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    toast("Enter a valid expense amount.");
    return;
  }

  expenses.push({
    id: Date.now(),
    dateKey: todayKey(),
    date: new Date().toISOString(),
    category: category,
    amount: amount,
    note: note
  });

  save(KEYS.expenses, expenses);

  document.getElementById("expenseCategory").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseNote").value = "";

  toast("Expense added.");

  updateAll();
}

function deleteExpense(id) {
  if (isTodayClosed()) {
    toast("Closed days cannot be changed.");
    return;
  }

  expenses = expenses.filter(x => x.id !== id);

  save(KEYS.expenses, expenses);

  toast("Expense deleted.");

  updateAll();
}

function addStock() {
  const item =
    document.getElementById("stockItem")?.value.trim();

  const quantity =
    Number(document.getElementById("stockQuantity")?.value);

  if (!item) {
    toast("Enter a stock item.");
    return;
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    toast("Enter a valid quantity.");
    return;
  }

  stock.push({
    id: Date.now(),
    item: item,
    quantity: quantity,
    date: new Date().toISOString()
  });

  save(KEYS.stock, stock);

  document.getElementById("stockItem").value = "";
  document.getElementById("stockQuantity").value = "";

  toast("Stock added.");

  renderStock();
}

function deleteStock(id) {
  stock = stock.filter(x => x.id !== id);

  save(KEYS.stock, stock);

  toast("Stock removed.");

  renderStock();
}

function closeDay() {
  if (isTodayClosed()) {
    toast("Today is already closed.");
    return;
  }

  const actual =
    Number(document.getElementById("actualCash")?.value);

  if (isNaN(actual) || actual < 0) {
    toast("Enter the actual cash.");
    return;
  }

  closings.push({
    id: Date.now(),
    dateKey: todayKey(),
    date: todayText(),
    startingCash: getStartingCash(),
    sales: salesTotal(),
    expenses: expensesTotal(),
    expectedClosingCash: expectedCash(),
    actualClosingCash: actual,
    difference: actual - expectedCash(),
    bagsSold: todayBags(),
    closedAt: new Date().toISOString()
  });

  save(KEYS.closing, closings);

  toast("Day closed successfully.");

  updateAll();
}

function reopenToday() {
  const index =
    closings.findIndex(x => x.dateKey === todayKey());

  if (index === -1) {
    toast("Today is not closed.");
    return;
  }

  closings.splice(index, 1);

  save(KEYS.closing, closings);

  toast("Today reopened.");

  updateAll();
}

function renderDashboard() {
  const ids = {
    todayDate: todayText(),
    dashboardStartingCash: money(getStartingCash()),
    dashboardSales: money(salesTotal()),
    dashboardExpenses: money(expensesTotal()),
    dashboardBags: todayBags(),
    dashboardExpectedCash: money(expectedCash())
  };

  Object.entries(ids).forEach(([id, value]) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = value;
    }
  });

  const box =
    document.getElementById("dashboardActualCashBox");

  const actual =
    document.getElementById("dashboardActualCash");

  const difference =
    document.getElementById("dashboardDifference");

  const closing = currentClosing();

  if (closing) {
    if (box) box.style.display = "";

    if (actual) {
      actual.textContent =
        money(closing.actualClosingCash);
    }

    if (difference) {
      difference.textContent =
        `${closing.difference >= 0 ? "+" : ""}${money(closing.difference)}`;
    }
  } else {
    if (box) {
      box.style.display = "none";
    }
  }

  renderRecentSales();
}

function renderRecentSales() {
  const el =
    document.getElementById("recentSales");

  if (!el) return;

  const list =
    todaySales()
      .slice()
      .reverse()
      .slice(0, 5);

  if (!list.length) {
    el.innerHTML = "<p>No sales yet today.</p>";
    return;
  }

  el.innerHTML = list.map(sale => `
    <div class="list-item">
      <div>
        <strong>
          ${sale.quantity}
          bag${sale.quantity === 1 ? "" : "s"}
        </strong>

        <span>
          ${formatDateTime(sale.date)}
        </span>
      </div>

      <div class="list-amount">
        ${money(sale.total)}
      </div>
    </div>
  `).join("");
}

function renderSales() {
  const list =
    document.getElementById("salesList");

  const count =
    document.getElementById("salesCount");

  const locked =
    document.getElementById("salesLocked");

  const button =
    document.getElementById("saleButton");

  const closed = isTodayClosed();

  if (locked) {
    locked.style.display = closed ? "" : "none";
  }

  if (button) {
    button.disabled = closed;
  }

  const items =
    todaySales()
      .slice()
      .reverse();

  if (count) {
    count.textContent = items.length;
  }

  if (!list) return;

  if (!items.length) {
    list.innerHTML =
      "<p>No sales recorded today.</p>";
    return;
  }

  list.innerHTML = items.map(sale => `
    <div class="list-item">
      <div>
        <strong>
          ${sale.quantity}
          bag${sale.quantity === 1 ? "" : "s"}
        </strong>

        <span>
          ${formatDateTime(sale.date)}
        </span>
      </div>

      <div>
        <strong>
          ${money(sale.total)}
        </strong>

        ${
          closed
            ? ""
            : `<button onclick="deleteSale(${sale.id})">
                Delete
              </button>`
        }
      </div>
    </div>
  `).join("");
}

function renderExpenses() {
  const list =
    document.getElementById("expensesList");

  const count =
    document.getElementById("expensesCount");

  const locked =
    document.getElementById("expensesLocked");

  const button =
    document.getElementById("expenseButton");

  const closed = isTodayClosed();

  if (locked) {
    locked.style.display = closed ? "" : "none";
  }

  if (button) {
    button.disabled = closed;
  }

  const items =
    todayExpenses()
      .slice()
      .reverse();

  if (count) {
    count.textContent = items.length;
  }

  if (!list) return;

  if (!items.length) {
    list.innerHTML =
      "<p>No expenses recorded today.</p>";
    return;
  }

  list.innerHTML = items.map(expense => `
    <div class="list-item">
      <div>
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
            ? "<span>🔒 Closed</span>"
            : `<button onclick="deleteExpense(${expense.id})">
                Delete
              </button>`
        }
      </div>
    </div>
  `).join("");
}

function renderStock() {
  const list =
    document.getElementById("stockList");

  if (!list) return;

  if (!stock.length) {
    list.innerHTML =
      "<p>No stock recorded.</p>";
    return;
  }

  list.innerHTML =
    stock
      .slice()
      .reverse()
      .map(item => `
        <div class="list-item">
          <div>
            <strong>
              ${escapeHTML(item.item)}
            </strong>

            <span>
              Added ${formatDateTime(item.date)}
            </span>
          </div>

          <div>
            <strong>
              ${item.quantity}
            </strong>

            <button onclick="deleteStock(${item.id})">
              Delete
            </button>
          </div>
        </div>
      `)
      .join("");
}

function renderDailyClose() {
  const closed = isTodayClosed();

  const closing = currentClosing();

  const openPanel =
    document.getElementById("openDayPanel");

  const closedPanel =
    document.getElementById("closedDayPanel");

  if (openPanel) {
    openPanel.style.display =
      closed ? "none" : "";
  }

  if (closedPanel) {
    closedPanel.style.display =
      closed ? "" : "none";
  }

  const values = {
    closeStartingCash: money(getStartingCash()),
    closeSales: money(salesTotal()),
    closeExpenses: money(expensesTotal()),
    closeBags: todayBags(),
    closeExpectedCash: money(expectedCash())
  };

  Object.entries(values).forEach(([id, value]) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = value;
    }
  });

  if (closing) {
    const data = {
      closedDateText: closing.date,
      closedExpected:
        money(closing.expectedClosingCash),
      closedActual:
        money(closing.actualClosingCash),
      closedDifference:
        `${closing.difference >= 0 ? "+" : ""}${money(closing.difference)}`,
      closedBags: closing.bagsSold
    };

    Object.entries(data).forEach(([id, value]) => {
      const el = document.getElementById(id);

      if (el) {
        el.textContent = value;
      }
    });
  }

  renderClosingHistory();
}

function renderClosingHistory() {
  const el =
    document.getElementById("closingHistory");

  if (!el) return;

  if (!closings.length) {
    el.innerHTML =
      "<p>No closed days yet.</p>";
    return;
  }

  el.innerHTML =
    closings
      .slice()
      .reverse()
      .map(day => `
        <div class="list-item">
          <div>
            <strong>
              ${escapeHTML(day.date)}
            </strong>

            <span>
              ${day.bagsSold} bags •
              Sales ${money(day.sales)} •
              Expenses ${money(day.expenses)}
            </span>
          </div>

          <div>
            <strong>
              ${money(day.actualClosingCash)}
            </strong>

            <span>
              Difference:
              ${day.difference >= 0 ? "+" : ""}
              ${money(day.difference)}
            </span>
          </div>
        </div>
      `)
      .join("");
}

function renderReports() {
  const totalSales =
    sales.reduce(
      (sum, x) => sum + Number(x.total || 0),
      0
    );

  const totalExpenses =
    expenses.reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

  const totalBags =
    sales.reduce(
      (sum, x) => sum + Number(x.quantity || 0),
      0
    );

  const values = {
    reportSales: money(totalSales),
    reportExpenses: money(totalExpenses),
    reportProfit:
      money(totalSales - totalExpenses),
    reportBags: totalBags,
    reportClosedDays: closings.length
  };

  Object.entries(values).forEach(([id, value]) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = value;
    }
  });
}

function renderStatus() {
  const status =
    document.getElementById("dayStatus");

  if (status) {
    status.textContent =
      isTodayClosed()
        ? "🔒 Day Closed"
        : "🟢 Day Open";
  }
}

function updateSalePreview() {
  const input =
    document.getElementById("saleQuantity");

  const preview =
    document.getElementById("saleTotalPreview");

  if (!input || !preview) return;

  const quantity =
    Number(input.value || 0);

  preview.textContent =
    money(quantity * PRICE);
}

function backupData() {
  const backup = {
    version: 1,
    app: "Popcorn Manager",
    exportedAt: new Date().toISOString(),

    data: {
      sales: sales,
      expenses: expenses,
      stock: stock,
      startingCash: startingCash,
      closings: closings
    }
  };

  const file = new Blob(
    [JSON.stringify(backup, null, 2)],
    {
      type: "application/json"
    }
  );

  const url =
    URL.createObjectURL(file);

  const link =
    document.createElement("a");

  link.href = url;

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  link.download =
    `popcorn-manager-backup-${date}.json`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

  toast("Backup created successfully.");
}

function restoreData(event) {
  const file =
    event.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = function(e) {
    try {
      const backup =
        JSON.parse(e.target.result);

      if (
        !backup ||
        !backup.data ||
        !Array.isArray(backup.data.sales) ||
        !Array.isArray(backup.data.expenses) ||
        !Array.isArray(backup.data.stock) ||
        typeof backup.data.startingCash !== "object" ||
        !Array.isArray(backup.data.closings)
      ) {
        throw new Error("Invalid backup file");
      }

      const confirmed =
        confirm(
          "Restore this backup? Your current data will be replaced."
        );

      if (!confirmed) {
        event.target.value = "";
        return;
      }

      sales = backup.data.sales;
      expenses = backup.data.expenses;
      stock = backup.data.stock;
      startingCash =
        backup.data.startingCash;
      closings = backup.data.closings;

      save(KEYS.sales, sales);
      save(KEYS.expenses, expenses);
      save(KEYS.stock, stock);
      save(KEYS.starting, startingCash);
      save(KEYS.closing, closings);

      updateAll();

      toast("Backup restored successfully.");

    } catch (error) {
      alert("That backup file is not valid.");
    }

    event.target.value = "";
  };

  reader.readAsText(file);
}

function clearAllData() {
  const confirmed =
    confirm(
      "Delete ALL popcorn business data? This cannot be undone."
    );

  if (!confirmed) return;

  localStorage.removeItem(KEYS.sales);
  localStorage.removeItem(KEYS.expenses);
  localStorage.removeItem(KEYS.stock);
  localStorage.removeItem(KEYS.starting);
  localStorage.removeItem(KEYS.closing);

  sales = [];
  expenses = [];
  stock = [];
  startingCash = {};
  closings = [];

  toast("All data cleared.");

  updateAll();
}

function updateAll() {
  renderDashboard();
  renderSales();
  renderExpenses();
  renderStock();
  renderDailyClose();
  renderReports();
  renderStatus();
  updateSalePreview();
}

document.addEventListener("DOMContentLoaded", () => {
  const date =
    document.getElementById("todayDate");

  if (date) {
    date.textContent = todayText();
  }

  const saleInput =
    document.getElementById("saleQuantity");

  if (saleInput) {
    saleInput.addEventListener(
      "input",
      updateSalePreview
    );
  }

  updateAll();
});
