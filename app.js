/* =====================================================
   🍿 POPCORN MANAGER V3
   Small Popcorn Business
   Price: K1 per bag
   Payment: Cash
===================================================== */

const POPCORN_PRICE = 1;
const PRODUCT_NAME = "Small Popcorn";

/* =====================================================
   DATA
===================================================== */

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


/* =====================================================
   SAVE DATA
===================================================== */

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


/* =====================================================
   DATE
===================================================== */

function getTodayKey() {

  const date = new Date();

  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}


function formatDate(value) {

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


function formatDateTime(value) {

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value;
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


/* =====================================================
   MONEY
===================================================== */

function money(value) {

  return "K" + Number(value || 0).toFixed(2);
}


/* =====================================================
   SECURITY
===================================================== */

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

  const toast =
    document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}


/* =====================================================
   NAVIGATION
===================================================== */

function showPage(pageId) {

  const pages =
    document.querySelectorAll(".page");

  pages.forEach(function (page) {
    page.classList.remove("active");
  });

  const selectedPage =
    document.getElementById(pageId);

  if (selectedPage) {
    selectedPage.classList.add("active");
  }

  const navButtons =
    document.querySelectorAll(".nav-button");

  navButtons.forEach(function (button) {
    button.classList.remove("active");
  });

  const activeButton =
    document.querySelector(
      '.nav-button[data-page="' +
      pageId +
      '"]'
    );

  if (activeButton) {
    activeButton.classList.add("active");
  }

  updateAll();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =====================================================
   TODAY SALES
===================================================== */

function getTodaySales() {

  const today = getTodayKey();

  return sales
    .filter(function (sale) {
      return sale.dateKey === today;
    })
    .reduce(function (total, sale) {
      return total + Number(sale.total || 0);
    }, 0);
}


function getTodayBags() {

  const today = getTodayKey();

  return sales
    .filter(function (sale) {
      return sale.dateKey === today;
    })
    .reduce(function (total, sale) {
      return total + Number(sale.quantity || 0);
    }, 0);
}


function getTodayExpenses() {

  const today = getTodayKey();

  return expenses
    .filter(function (expense) {
      return expense.dateKey === today;
    })
    .reduce(function (total, expense) {
      return total + Number(expense.amount || 0);
    }, 0);
}


/* =====================================================
   STARTING CASH
===================================================== */

function getTodayStartingCash() {

  return Number(
    startingCashByDate[getTodayKey()] || 0
  );
}


function saveStartingCash() {

  if (isTodayClosed()) {

    showToast(
      "Today is closed. Reopen it first."
    );

    return;
  }

  const input =
    document.getElementById("startingCash");

  if (!input) {
    return;
  }

  const amount = Number(input.value);

  if (
    input.value === "" ||
    amount < 0 ||
    isNaN(amount)
  ) {

    showToast(
      "Enter a valid starting cash amount."
    );

    return;
  }

  startingCashByDate[getTodayKey()] =
    amount;

  saveData();

  updateAll();

  showToast(
    "Starting cash saved."
  );
}


/* =====================================================
   EXPECTED CLOSING CASH
===================================================== */

function getTodayExpectedCash() {

  return (
    getTodayStartingCash() +
    getTodaySales() -
    getTodayExpenses()
  );
}


/* =====================================================
   DAILY CLOSING
===================================================== */

function getTodayClosing() {

  return dailyClosings.find(
    function (closing) {
      return closing.dateKey === getTodayKey();
    }
  );
}


function isTodayClosed() {

  return Boolean(
    getTodayClosing()
  );
}


/* =====================================================
   SALES
===================================================== */

function addSale() {

  if (isTodayClosed()) {

    showToast(
      "Day is closed. Reopen it first."
    );

    return;
  }

  const input =
    document.getElementById(
      "saleQuantity"
    );

  if (!input) {
    return;
  }

  const quantity =
    Number(input.value);

  if (
    input.value === "" ||
    quantity <= 0 ||
    isNaN(quantity)
  ) {

    showToast(
      "Enter the number of bags sold."
    );

    return;
  }

  const sale = {

    id: Date.now(),

    dateKey:
      getTodayKey(),

    date:
      new Date().toISOString(),

    product:
      PRODUCT_NAME,

    quantity:
      quantity,

    price:
      POPCORN_PRICE,

    total:
      quantity * POPCORN_PRICE,

    payment:
      "Cash"
  };

  sales.unshift(sale);

  saveData();

  input.value = "";

  updateSalePreview();

  updateAll();

  showToast(
    quantity +
    " bag(s) sold for " +
    money(sale.total)
  );
}


/* =====================================================
   SALE PREVIEW
===================================================== */

function updateSalePreview() {

  const input =
    document.getElementById(
      "saleQuantity"
    );

  const preview =
    document.getElementById(
      "saleTotalPreview"
    );

  if (!input || !preview) {
    return;
  }

  const quantity =
    Number(input.value) || 0;

  preview.textContent =
    money(
      quantity * POPCORN_PRICE
    );
}


/* =====================================================
   DELETE SALE
===================================================== */

function deleteSale(id) {

  const sale =
    sales.find(function (item) {
      return item.id === id;
    });

  if (!sale) {
    return;
  }

  const closed =
    dailyClosings.some(
      function (closing) {
        return (
          closing.dateKey ===
          sale.dateKey
        );
      }
    );

  if (closed) {

    showToast(
      "This sale belongs to a closed day."
    );

    return;
  }

  if (!confirm("Delete this sale?")) {
    return;
  }

  sales =
    sales.filter(function (item) {
      return item.id !== id;
    });

  saveData();

  updateAll();

  showToast(
    "Sale deleted."
  );
}


/* =====================================================
   EXPENSES
===================================================== */

function addExpense() {

  if (isTodayClosed()) {

    showToast(
      "Day is closed. Reopen it first."
    );

    return;
  }

  const categoryElement =
    document.getElementById(
      "expenseCategory"
    );

  const amountElement =
    document.getElementById(
      "expenseAmount"
    );

  const noteElement =
    document.getElementById(
      "expenseNote"
    );

  if (
    !categoryElement ||
    !amountElement ||
    !noteElement
  ) {
    return;
  }

  const amount =
    Number(amountElement.value);

  if (
    amountElement.value === "" ||
    amount <= 0 ||
    isNaN(amount)
  ) {

    showToast(
      "Enter a valid expense amount."
    );

    return;
  }

  const expense = {

    id: Date.now(),

    dateKey:
      getTodayKey(),

    date:
      new Date().toISOString(),

    category:
      categoryElement.value,

    amount:
      amount,

    note:
      noteElement.value.trim()
  };

  expenses.unshift(expense);

  saveData();

  amountElement.value = "";

  noteElement.value = "";

  updateAll();

  showToast(
    "Expense of " +
    money(amount) +
    " saved."
  );
}


/* =====================================================
   DELETE EXPENSE
===================================================== */

function deleteExpense(id) {

  const expense =
    expenses.find(function (item) {
      return item.id === id;
    });

  if (!expense) {
    return;
  }

  const closed =
    dailyClosings.some(
      function (closing) {
        return (
          closing.dateKey ===
          expense.dateKey
        );
      }
    );

  if (closed) {

    showToast(
      "This expense belongs to a closed day."
    );

    return;
  }

  if (!confirm("Delete this expense?")) {
    return;
  }

  expenses =
    expenses.filter(function (item) {
      return item.id !== id;
    });

  saveData();

  updateAll();

  showToast(
    "Expense deleted."
  );
}


/* =====================================================
   STOCK
===================================================== */

function addStock() {

  const itemInput =
    document.getElementById(
      "stockItem"
    );

  const quantityInput =
    document.getElementById(
      "stockQuantity"
    );

  if (
    !itemInput ||
    !quantityInput
  ) {
    return;
  }

  const name =
    itemInput.value.trim();

  const quantity =
    Number(quantityInput.value);

  if (!name) {

    showToast(
      "Enter a stock item."
    );

    return;
  }

  if (
    quantityInput.value === "" ||
    quantity < 0 ||
    isNaN(quantity)
  ) {

    showToast(
      "Enter a valid quantity."
    );

    return;
  }

  const existing =
    stock.find(function (item) {

      return (
        item.name.toLowerCase() ===
        name.toLowerCase()
      );

    });

  if (existing) {

    existing.quantity =
      Number(existing.quantity) +
      quantity;

  } else {

    stock.unshift({

      id: Date.now(),

      name:
        name,

      quantity:
        quantity
    });
  }

  saveData();

  itemInput.value = "";

  quantityInput.value = "";

  updateAll();

  showToast(
    "Stock updated."
  );
}


function deleteStock(id) {

  if (!confirm("Remove this stock item?")) {
    return;
  }

  stock =
    stock.filter(function (item) {
      return item.id !== id;
    });

  saveData();

  updateAll();

  showToast(
    "Stock removed."
  );
}


/* =====================================================
   CLOSE DAY
===================================================== */

function closeDay() {

  if (isTodayClosed()) {

    showToast(
      "Today is already closed."
    );

    return;
  }

  const input =
    document.getElementById(
      "actualCash"
    );

  if (!input) {
    return;
  }

  const actualCash =
    Number(input.value);

  if (
    input.value === "" ||
    actualCash < 0 ||
    isNaN(actualCash)
  ) {

    showToast(
      "Enter your actual closing cash."
    );

    return;
  }

  const startingCash =
    getTodayStartingCash();

  const salesTotal =
    getTodaySales();

  const expensesTotal =
    getTodayExpenses();

  const bags =
    getTodayBags();

  const expected =
    startingCash +
    salesTotal -
    expensesTotal;

  const difference =
    actualCash -
    expected;

  const closing = {

    id:
      Date.now(),

    dateKey:
      getTodayKey(),

    date:
      new Date().toISOString(),

    startingCash:
      startingCash,

    sales:
      salesTotal,

    expenses:
      expensesTotal,

    expectedClosingCash:
      expected,

    actualClosingCash:
      actualCash,

    difference:
      difference,

    bagsSold:
      bags,

    closedAt:
      new Date().toISOString()
  };

  dailyClosings.unshift(
    closing
  );

  saveData();

  updateAll();

  showToast(
    "Business day closed successfully."
  );
}


/* =====================================================
   REOPEN TODAY
===================================================== */

function reopenToday() {

  if (!isTodayClosed()) {

    showToast(
      "Today is already open."
    );

    return;
  }

  if (
    !confirm(
      "Reopen today's business?\n\n" +
      "You can then correct today's sales " +
      "and expenses."
    )
  ) {
    return;
  }

  dailyClosings =
    dailyClosings.filter(
      function (closing) {
        return (
          closing.dateKey !==
          getTodayKey()
        );
      }
    );

  saveData();

  updateAll();

  showToast(
    "Today has been reopened."
  );
}


/* =====================================================
   DASHBOARD
===================================================== */

function renderDashboard() {

  const todayDate =
    document.getElementById(
      "todayDate"
    );

  const starting =
    document.getElementById(
      "dashboardStartingCash"
    );

  const salesElement =
    document.getElementById(
      "dashboardSales"
    );

  const expensesElement =
    document.getElementById(
      "dashboardExpenses"
    );

  const bagsElement =
    document.getElementById(
      "dashboardBags"
    );

  const expected =
    document.getElementById(
      "dashboardExpectedCash"
    );

  if (todayDate) {
    todayDate.textContent =
      todayReadable();
  }

  if (starting) {
    starting.textContent =
      money(
        getTodayStartingCash()
      );
  }

  if (salesElement) {
    salesElement.textContent =
      money(
        getTodaySales()
      );
  }

  if (expensesElement) {
    expensesElement.textContent =
      money(
        getTodayExpenses()
      );
  }

  if (bagsElement) {
    bagsElement.textContent =
      getTodayBags();
  }

  if (expected) {
    expected.textContent =
      money(
        getTodayExpectedCash()
      );
  }

  const actualBox =
    document.getElementById(
      "dashboardActualCashBox"
    );

  const closing =
    getTodayClosing();

  if (!actualBox) {
    return;
  }

  if (closing) {

    actualBox.classList.remove(
      "hidden"
    );

    const actual =
      document.getElementById(
        "dashboardActualCash"
      );

    const difference =
      document.getElementById(
        "dashboardDifference"
      );

    if (actual) {

      actual.textContent =
        money(
          closing.actualClosingCash
        );
    }

    if (difference) {

      difference.textContent =
        money(
          closing.difference
        );
    }

  } else {

    actualBox.classList.add(
      "hidden"
    );
  }
}


/* =====================================================
   SALES LIST
===================================================== */

function renderSales() {

  const list =
    document.getElementById(
      "salesList"
    );

  const count =
    document.getElementById(
      "salesCount"
    );

  if (!list) {
    return;
  }

  if (count) {
    count.textContent =
      sales.length;
  }

  if (!sales.length) {

    list.innerHTML = `
      <div class="empty-state">
        🍿 No sales recorded yet.
      </div>
    `;

    return;
  }

  list.innerHTML =
    sales.map(function (sale) {

      const closed =
        dailyClosings.some(
          function (closing) {
            return (
              closing.dateKey ===
              sale.dateKey
            );
          }
        );

      return `
        <div class="list-item">

          <div class="list-main">

            <strong>
              ${escapeHTML(
                sale.quantity
              )}
              bag${
                Number(sale.quantity) === 1
                  ? ""
                  : "s"
              }
            </strong>

            <span>
              ${escapeHTML(
                sale.product
              )}
              •
              ${formatDateTime(
                sale.date
              )}
              • Cash
            </span>

          </div>

          <div class="list-amount">

            <strong>
              ${money(
                sale.total
              )}
            </strong>

            ${
              closed
                ? `
                  <span class="locked-label">
                    🔒 Closed
                  </span>
                `
                : `
                  <button
                    class="delete-button"
                    onclick="deleteSale(${sale.id})">
                    Delete
                  </button>
                `
            }

          </div>

        </div>
      `;

    }).join("");
}


/* =====================================================
   EXPENSE LIST
===================================================== */

function renderExpenses() {

  const list =
    document.getElementById(
      "expensesList"
    );

  const count =
    document.getElementById(
      "expensesCount"
    );

  if (!list) {
    return;
  }

  if (count) {
    count.textContent =
      expenses.length;
  }

  if (!expenses.length) {

    list.innerHTML = `
      <div class="empty-state">
        💸 No expenses recorded yet.
      </div>
    `;

    return;
  }

  list.innerHTML =
    expenses.map(function (expense) {

      const closed =
        dailyClosings.some(
          function (closing) {
            return (
              closing.dateKey ===
              expense.dateKey
            );
          }
        );

      return `
        <div class="list-item">

          <div class="list-main">

            <strong>
              ${escapeHTML(
                expense.category
              )}
            </strong>

            <span>
              ${
                expense.note
                  ? escapeHTML(
                      expense.note
                    ) + " • "
                  : ""
              }

              ${formatDateTime(
                expense.date
              )}
            </span>

          </div>

          <div class="list-amount">

            <strong>
              -${money(
                expense.amount
              )}
            </strong>

            ${
              closed
                ? `
                  <span class="locked-label">
                    🔒 Closed
                  </span>
              
