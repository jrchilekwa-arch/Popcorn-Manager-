// ==========================================
// POPCORN MANAGER
// Version 1
// ==========================================


// ---------- DATA ----------

let sales = JSON.parse(localStorage.getItem("popcornSales")) || [];

let expenses = JSON.parse(localStorage.getItem("popcornExpenses")) || [];

let stock = JSON.parse(localStorage.getItem("popcornStock")) || [];


// ---------- START APP ----------

document.addEventListener("DOMContentLoaded", function () {

  updateDate();

  updateDashboard();

  renderSales();

  renderExpenses();

  renderStock();

  updateReports();

  setActiveNav("dashboard");

});


// ---------- PAGE NAVIGATION ----------

function showPage(pageName) {

  const pages = document.querySelectorAll(".page");

  pages.forEach(function (page) {
    page.classList.remove("active");
  });

  const selectedPage = document.getElementById(pageName);

  if (selectedPage) {
    selectedPage.classList.add("active");
  }

  setActiveNav(pageName);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function setActiveNav(pageName) {

  const buttons = document.querySelectorAll(".bottom-nav button");

  buttons.forEach(function (button) {
    button.classList.remove("active");
  });

  const selectedButton = document.getElementById("nav-" + pageName);

  if (selectedButton) {
    selectedButton.classList.add("active");
  }

}


// ---------- DATE ----------

function updateDate() {

  const dateElement = document.getElementById("currentDate");

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-ZM", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  dateElement.textContent = formattedDate;

}


// ---------- MONEY ----------

function money(amount) {

  return "K" + Number(amount).toFixed(2);

}


// ---------- SAVE DATA ----------

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

}


// ---------- DATE KEY ----------

function dateKey(date) {

  const d = new Date(date);

  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );

}


// ---------- TODAY ----------

function isToday(date) {

  return dateKey(date) === dateKey(new Date());

}


// ==========================================
// SALES
// ==========================================

function addSale() {

  const product =
    document.getElementById("saleProduct").value;

  const quantity =
    Number(document.getElementById("saleQuantity").value);

  const price =
    Number(document.getElementById("salePrice").value);

  const payment =
    document.getElementById("paymentMethod").value;


  if (!quantity || quantity <= 0) {

    alert("Please enter a valid quantity.");

    return;

  }


  if (price < 0 || isNaN(price)) {

    alert("Please enter a valid price.");

    return;

  }


  const total = quantity * price;


  const sale = {

    id: Date.now(),

    product: product,

    quantity: quantity,

    price: price,

    total: total,

    payment: payment,

    date: new Date().toISOString()

  };


  sales.unshift(sale);

  saveData();

  renderSales();

  updateDashboard();

  updateReports();


  document.getElementById("saleQuantity").value = "";

  document.getElementById("salePrice").value = "";


  alert(
    "Sale saved successfully!\nTotal: " +
    money(total)
  );

}


// ---------- RENDER SALES ----------

function renderSales() {

  const container =
    document.getElementById("salesHistory");

  if (sales.length === 0) {

    container.innerHTML =
      '<p class="empty">No sales recorded yet.</p>';

    return;

  }


  container.innerHTML = "";


  sales.forEach(function (sale) {

    const date =
      new Date(sale.date).toLocaleString();

    const div =
      document.createElement("div");

    div.className = "sale-item";


    div.innerHTML = `

      <div class="item-row">

        <div>

          <div class="item-name">
            ${escapeHTML(sale.product)}
          </div>

          <div class="item-info">
            ${sale.quantity} × ${money(sale.price)}
            • ${escapeHTML(sale.payment)}
            <br>
            ${date}
          </div>

        </div>

        <div>

          <div class="item-price">
            ${money(sale.total)}
          </div>

          <button
            class="delete-btn"
            onclick="deleteSale(${sale.id})">
            Delete
          </button>

        </div>

      </div>

    `;


    container.appendChild(div);

  });

}


// ---------- DELETE SALE ----------

function deleteSale(id) {

  if (!confirm("Delete this sale?")) {
    return;
  }

  sales =
    sales.filter(function (sale) {
      return sale.id !== id;
    });

  saveData();

  renderSales();

  updateDashboard();

  updateReports();

}


// ==========================================
// EXPENSES
// ==========================================

function addExpense() {

  const name =
    document.getElementById("expenseName").value;

  const amount =
    Number(document.getElementById("expenseAmount").value);

  const note =
    document.getElementById("expenseNote").value;


  if (!amount || amount <= 0) {

    alert("Please enter a valid expense amount.");

    return;

  }


  const expense = {

    id: Date.now(),

    name: name,

    amount: amount,

    note: note,

    date: new Date().toISOString()

  };


  expenses.unshift(expense);

  saveData();

  renderExpenses();

  updateDashboard();

  updateReports();


  document.getElementById("expenseAmount").value = "";

  document.getElementById("expenseNote").value = "";


  alert(
    "Expense saved: " +
    money(amount)
  );

}


// ---------- RENDER EXPENSES ----------

function renderExpenses() {

  const container =
    document.getElementById("expensesHistory");

  if (expenses.length === 0) {

    container.innerHTML =
      '<p class="empty">No expenses recorded yet.</p>';

    return;

  }


  container.innerHTML = "";


  expenses.forEach(function (expense) {

    const date =
      new Date(expense.date).toLocaleString();

    const div =
      document.createElement("div");

    div.className = "expense-item";


    div.innerHTML = `

      <div class="item-row">

        <div>

          <div class="item-name">
            ${escapeHTML(expense.name)}
          </div>

          <div class="item-info">
            ${escapeHTML(expense.note || "No note")}
            <br>
            ${date}
          </div>

        </div>

        <div>

          <div class="item-price">
            ${money(expense.amount)}
          </div>

          <button
            class="delete-btn"
            onclick="deleteExpense(${expense.id})">
            Delete
          </button>

        </div>

      </div>

    `;


    container.appendChild(div);

  });

}


// ---------- DELETE EXPENSE ----------

function deleteExpense(id) {

  if (!confirm("Delete this expense?")) {
    return;
  }

  expenses =
    expenses.filter(function (expense) {
      return expense.id !== id;
    });

  saveData();

  renderExpenses();

  updateDashboard();

  updateReports();

}


// ==========================================
// STOCK
// ==========================================

function addStock() {

  const name =
    document.getElementById("stockName").value.trim();

  const quantity =
    Number(document.getElementById("stockQuantity").value);

  const unit =
    document.getElementById("stockUnit").value;


  if (!name) {

    alert("Please enter the stock item.");

    return;

  }


  if (isNaN(quantity) || quantity < 0) {

    alert("Please enter a valid quantity.");

    return;

  }


  const existing =
    stock.find(function (item) {

      return (
        item.name.toLowerCase() ===
        name.toLowerCase() &&
        item.unit === unit
      );

    });


  if (existing) {

    existing.quantity += quantity;

  } else {

    stock.push({

      id: Date.now(),

      name: name,

      quantity: quantity,

      unit: unit

    });

  }


  saveData();

  renderStock();


  document.getElementById("stockName").value = "";

  document.getElementById("stockQuantity").value = "";


  alert("Stock updated successfully!");

}


// ---------- RENDER STOCK ----------

function renderStock() {

  const container =
    document.getElementById("stockList");


  if (stock.length === 0) {

    container.innerHTML =
      '<p class="empty">No stock added yet.</p>';

    return;

  }


  container.innerHTML = "";


  stock.forEach(function (item) {

    const div =
      document.createElement("div");

    div.className = "stock-item";


    div.innerHTML = `

      <div class="item-row">

        <div>

          <div class="item-name">
            ${escapeHTML(item.name)}
          </div>

          <div class="item-info">
            ${item.quantity} ${escapeHTML(item.unit)}
          </div>

        </div>

        <button
          class="delete-btn"
          onclick="deleteStock(${item.id})">
          Delete
        </button>

      </div>

    `;


    container.appendChild(div);

  });

}


// ---------- DELETE STOCK ----------

function deleteStock(id) {

  if (!confirm("Delete this stock item?")) {
    return;
  }

  stock =
    stock.filter(function (item) {
      return item.id !== id;
    });

  saveData();

  renderStock();

}


// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {

  const todaySales =
    sales
      .filter(function (sale) {
        return isToday(sale.date);
      })
      .reduce(function (total, sale) {
        return total + sale.total;
      }, 0);


  const todayExpenses =
    expenses
      .filter(function (expense) {
        return isToday(expense.date);
      })
      .reduce(function (total, expense) {
        return total + expense.amount;
      }, 0);


  const todayItems =
    sales
      .filter(function (sale) {
        return isToday(sale.date);
      })
      .reduce(function (total, sale) {
        return total + sale.quantity;
      }, 0);


  const profit =
    todaySales - todayExpenses;


  document.getElementById("todaySales").textContent =
    money(todaySales);

  document.getElementById("todayExpenses").textContent =
    money(todayExpenses);

  document.getElementById("todayProfit").textContent =
    money(profit);

  document.getElementById("todayItems").textContent =
    todayItems;


  renderRecentSales();

}


// ---------- RECENT SALES ----------

function renderRecentSales() {

  const container =
    document.getElementById("recentSales");


  if (sales.length === 0) {

    container.innerHTML =
      '<p class="empty">No sales recorded yet.</p>';

    return;

  }


  const recent =
    sales.slice(0, 5);


  container.innerHTML = "";


  recent.forEach(function (sale) {

    const div =
      document.createElement("div");

    div.className = "sale-item";


    div.innerHTML = `

      <div class="item-row">

        <div>

          <div class="item-name">
            ${escapeHTML(sale.product)}
          </div>

          <div class="item-info">
            ${sale.quantity} packet(s)
          </div>

        </div>

        <div class="item-price">
          ${money(sale.total)}
        </div>

      </div>

    `;


    container.appendChild(div);

  });

}


// ==========================================
// REPORTS
// ==========================================

function updateReports() {

  const totalSales =
    sales.reduce(function (total, sale) {
      return total + sale.total;
    }, 0);


  const totalExpenses =
    expenses.reduce(function (total, expense) {
      return total + expense.amount;
    }, 0);


  const totalItems =
    sales.reduce(function (total, sale) {
      return total + sale.quantity;
    }, 0);


  const totalProfit =
    totalSales - totalExpenses;


  document.getElementById("totalSales").textContent =
    money(totalSales);

  document.getElementById("totalExpenses").textContent =
    money(totalExpenses);

  document.getElementById("totalProfit").textContent =
    money(totalProfit);

  document.getElementById("totalItems").textContent =
    totalItems;

}


// ==========================================
// CLEAR DATA
// ==========================================

function clearAllData() {

  const confirmation =
    confirm(
      "WARNING!\n\n" +
      "This will permanently delete all sales, expenses and stock.\n\n" +
      "Continue?"
    );


  if (!confirmation) {
    return;
  }


  sales = [];

  expenses = [];

  stock = [];


  saveData();

  renderSales();

  renderExpenses();

  renderStock();

  updateDashboard();

  updateReports();


  alert("All business data has been cleared.");

}


// ==========================================
// SECURITY HELPER
// ==========================================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
