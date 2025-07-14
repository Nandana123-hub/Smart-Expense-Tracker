const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
const budgets = JSON.parse(localStorage.getItem("budgets") || "{}");
let savingsGoal = parseFloat(localStorage.getItem("savingsGoal")) || 0;

const form = document.getElementById("transaction-form");
const desc = document.getElementById("desc");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const monthFilter = document.getElementById("month-filter");
const transactionList = document.getElementById("transactions");
const incomeDisplay = document.getElementById("total-income");
const expenseDisplay = document.getElementById("total-expense");
const balanceDisplay = document.getElementById("balance");
const tipsList = document.getElementById("tips");
const budgetCategory = document.getElementById("budget-category");
const budgetAmount = document.getElementById("budget-amount");
const budgetList = document.getElementById("budget-list");
const savingsInput = document.getElementById("savings-goal");
const savingsStatus = document.getElementById("savings-status");
const savingsAlert = document.getElementById("savings-alert");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const transaction = {
    id: Date.now(),
    desc: desc.value,
    amount: parseFloat(amount.value),
    type: type.value,
    category: category.value,
    month: monthFilter.value || new Date().toISOString().slice(0, 7),
  };
  transactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  render();
  form.reset();
});

function render() {
  transactionList.innerHTML = "";
  const month = monthFilter.value || new Date().toISOString().slice(0, 7);
  const filtered = transactions.filter(t => t.month === month);
  let income = 0, expense = 0;
  let categoryTotals = {};  

  filtered.forEach(t => {
    const li = document.createElement("li");
    li.innerText = `${t.desc} - ₹${t.amount.toFixed(2)} (${t.category})`;
    const del = document.createElement("button");
    del.innerText = "❌";
    del.onclick = () => {
      const index = transactions.findIndex(tr => tr.id === t.id);
      transactions.splice(index, 1);
      localStorage.setItem("transactions", JSON.stringify(transactions));
      render();
    };
    li.appendChild(del);
    transactionList.appendChild(li);

    if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
    categoryTotals[t.category] += t.type === "income" ? t.amount : -t.amount;

    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });

  incomeDisplay.innerText = income.toFixed(2);
  expenseDisplay.innerText = expense.toFixed(2);
  const balance = income - expense;
  balanceDisplay.innerText = balance.toFixed(2);

  renderChart(filtered);
  checkBudgets(categoryTotals);
  checkSavings(balance);
  generateSuggestions(expense, income);
}

function renderChart(data) {
  const ctx = document.getElementById("expense-chart").getContext("2d");
  const income = data.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = data.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#2ecc71", "#e74c3c"],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

function generateSuggestions(expense, income) {
  tipsList.innerHTML = "";
  const tips = [];
  const balance = income - expense;
  if (expense > income * 0.8) tips.push("You're spending over 80% of your income. Consider reducing luxury expenses.");
  if (balance < savingsGoal * 0.5) tips.push("You're saving less than 50% of your goal. Try to cut small daily expenses.");
  if (expense > 0 && income === 0) tips.push("Try to ensure stable income sources to avoid complete outflow.");
  if (tips.length === 0) tips.push("You're managing well! Keep monitoring your finances.");

  tips.forEach(tip => {
    const li = document.createElement("li");
    li.innerText = tip;
    tipsList.appendChild(li);
  });
}

function setBudget() {
  const cat = budgetCategory.value.trim();
  const amt = parseFloat(budgetAmount.value);
  if (!cat || isNaN(amt)) return;
  budgets[cat] = amt;
  localStorage.setItem("budgets", JSON.stringify(budgets));
  renderBudgets();
  budgetCategory.value = "";
  budgetAmount.value = "";
}

function renderBudgets() {
  budgetList.innerHTML = "";
  Object.keys(budgets).forEach(cat => {
    const li = document.createElement("li");
    li.innerText = `${cat}: ₹${budgets[cat]}`;
    budgetList.appendChild(li);
  });
}

function checkBudgets(totals) {
  Object.keys(budgets).forEach(cat => {
    if (totals[cat] && -totals[cat] > budgets[cat]) {
      const li = document.createElement("li");
      li.innerText = `⚠️ Over budget for ${cat}`;
      tipsList.appendChild(li);
    }
  });
}

function setSavingsGoal() {
  const goal = parseFloat(savingsInput.value);
  if (!isNaN(goal)) {
    savingsGoal = goal;
    localStorage.setItem("savingsGoal", savingsGoal);
    render();
  }
}

function checkSavings(current) {
  if (!savingsGoal) return;
  savingsStatus.innerText = `Current Savings: ₹${current.toFixed(2)} / Goal: ₹${savingsGoal}`;
  if (current < savingsGoal) {
    savingsAlert.innerText = "⚠️ You're behind your savings goal!";
  } else {
    savingsAlert.innerText = "🎯 Great job! You've met your savings goal.";
  }
}

renderBudgets();
render();
