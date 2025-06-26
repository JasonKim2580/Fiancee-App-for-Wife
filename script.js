const RATE_API = "https://api.exchangerate.host/latest?base=KRW&symbols=EUR";
let krw2eur = 0.00063;
let eur2krw = 1530;
let currentCurrency = "KRW";
function fetchRateAndUpdate() {
  fetch(RATE_API)
    .then((res) => res.json())
    .then((data) => {
      if (data && data.rates && data.rates.EUR) {
        krw2eur = data.rates.EUR;
        eur2krw = 1 / krw2eur;
        updateExchangeDisplay();
        updateSummary();
      }
    });
}
function updateExchangeDisplay() {
  document.getElementById(
    "exchange-rate"
  ).textContent = `(1,000원=${formatNumber(
    krw2eur * 1000,
    "EUR"
  )}, 1유로=${formatNumber(eur2krw, "KRW")})`;
}
fetchRateAndUpdate();
document.getElementById("currency-select").addEventListener("change", (e) => {
  currentCurrency = e.target.value;
  updateExchangeDisplay();
  updateSummary();
  updateDailyReports();
  updateReportSection && updateReportSection();
});

const categoryMap = {
  income: ["선교회비", "후원비용"],
  expense: ["식비", "교통비", "숙박비", "선교후원비", "기타"],
};
const categorySelect = document.getElementById("category-select");
document.getElementById("type-select").addEventListener("change", (e) => {
  fillCategoryOptions(e.target.value, categorySelect);
});
function fillCategoryOptions(type, selectEl) {
  selectEl.innerHTML = "";
  categoryMap[type].forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    selectEl.appendChild(opt);
  });
}
fillCategoryOptions("income", categorySelect);

const amountInput = document.getElementById("amount-input");
amountInput.addEventListener("input", (e) => {
  let val = e.target.value.replace(/[^0-9]/g, "");
  if (!val) {
    e.target.value = "";
    return;
  }
  e.target.value = Number(val).toLocaleString();
});

let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

document.getElementById("transaction-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const date = document.getElementById("date-input").value;
  const type = document.getElementById("type-select").value;
  const category = document.getElementById("category-select").value;
  const amountStr = document
    .getElementById("amount-input")
    .value.replace(/,/g, "");
  const detail = document.getElementById("detail-input").value;
  if (!date || !amountStr) return alert("날짜와 금액은 필수입니다.");
  const amount = parseInt(amountStr, 10);
  if (isNaN(amount)) return alert("금액은 숫자로 입력하세요.");
  transactions.push({ date, type, category, detail, amount, id: Date.now() });
  saveTransactions();
  e.target.reset();
  fillCategoryOptions("income", categorySelect);
  updateSummary();
  updateDailyReports();
  document.getElementById("input-section").classList.remove("active");
  document
    .querySelectorAll(".menu-btn")
    .forEach((btn) => btn.classList.remove("active"));
});

document.querySelectorAll(".menu-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document
      .querySelectorAll(".menu-btn")
      .forEach((x) => x.classList.remove("active"));
    this.classList.add("active");
    document
      .querySelectorAll(".menu-section")
      .forEach((sec) => sec.classList.remove("active"));

    if (this.dataset.menu === "input") {
      document.getElementById("input-section").classList.add("active");
    }
    if (this.dataset.menu === "report") {
      document.getElementById("report-section").classList.add("active");
      updateReportSection();
    }
    if (this.dataset.menu === "receipt") {
      document.getElementById("receipt-section").classList.add("active");
    }
    if (this.dataset.menu === "main") {
      document.getElementById("input-section").classList.remove("active");
      document.getElementById("report-section").classList.remove("active");
      document.getElementById("receipt-section").classList.remove("active");
    }
  });
});

function updateSummary() {
  let income = 0,
    expense = 0;
  transactions.forEach((tr) => {
    if (tr.type === "income") income += tr.amount;
    else expense += tr.amount;
  });
  let balance = income - expense;
  document.getElementById("total-income").textContent = formatNumber(
    income,
    currentCurrency
  );
  document.getElementById("total-expense").textContent = formatNumber(
    expense,
    currentCurrency
  );
  document.getElementById("total-balance").textContent = formatNumber(
    balance,
    currentCurrency
  );
}
updateSummary();

// ---- 여기부터 정렬이 바뀌는 부분 ----
const pastelColors = [
  "#ffe5ec",
  "#e2f6ff",
  "#fff2d8",
  "#eafaff",
  "#f3ecff",
  "#eafbe8",
  "#ffe2f0",
  "#f3fde8",
  "#e9e6fb",
  "#fffae5",
  "#e4fff5",
  "#fae7ff",
];
function groupByDate() {
  const map = {};
  transactions.forEach((tr) => {
    if (!map[tr.date]) map[tr.date] = [];
    map[tr.date].push(tr);
  });
  return map;
}
function updateDailyReports() {
  const container = document.getElementById("daily-reports");
  container.innerHTML = "";
  const map = groupByDate();
  // 날짜를 최신순(내림차순)으로 정렬
  const dates = Object.keys(map).sort((a, b) => b.localeCompare(a));
  dates.forEach((date, idx) => {
    const dayList = map[date];
    let income = 0,
      expense = 0;
    dayList.forEach((tr) => {
      if (tr.type === "income") income += tr.amount;
      else expense += tr.amount;
    });
    const box = document.createElement("div");
    box.className = "daily-report-card";
    box.style.background = pastelColors[idx % pastelColors.length];
    box.innerHTML = `
      <div class="daily-report-header">${date}</div>
      <div class="daily-report-info">
        <span class="green">수입: ${formatNumber(
          income,
          currentCurrency
        )}</span>
        <span class="red">지출: ${formatNumber(expense, currentCurrency)}</span>
      </div>
      <ul class="daily-detail-list">
      ${dayList
        .map(
          (tr) =>
            `<li class="detail-${tr.type}" data-id="${tr.id}">
          <span class="detail-tag">${tr.category}</span>
          <span class="detail-amount">${formatNumber(
            tr.amount,
            currentCurrency
          )}</span>
          <span>${tr.detail}</span>
        </li>`
        )
        .join("")}
      </ul>
    `;
    box.addEventListener("click", (event) => {
      let targetLi = event.target.closest("li[data-id]");
      if (!targetLi) return;
      const id = Number(targetLi.dataset.id);
      showEditModal(id);
    });
    container.appendChild(box);
  });
}
updateDailyReports();

const modal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editCategory = document.getElementById("edit-category");
document.getElementById("close-modal").onclick = () => {
  modal.style.display = "none";
};
function showEditModal(id) {
  const tr = transactions.find((x) => x.id === id);
  if (!tr) return;
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-date").value = tr.date;
  document.getElementById("edit-type").value = tr.type;
  fillCategoryOptions(tr.type, editCategory);
  document.getElementById("edit-category").value = tr.category;
  document.getElementById("edit-amount").value = tr.amount.toLocaleString();
  document.getElementById("edit-detail").value = tr.detail;
  modal.style.display = "flex";
}
document.getElementById("edit-type").addEventListener("change", (e) => {
  fillCategoryOptions(e.target.value, editCategory);
});
document.getElementById("edit-amount").addEventListener("input", (e) => {
  let val = e.target.value.replace(/[^0-9]/g, "");
  if (!val) {
    e.target.value = "";
    return;
  }
  e.target.value = Number(val).toLocaleString();
});
editForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!confirm("정말 수정할까요?")) return;
  const id = Number(document.getElementById("edit-id").value);
  const date = document.getElementById("edit-date").value;
  const type = document.getElementById("edit-type").value;
  const category = document.getElementById("edit-category").value;
  const amountStr = document
    .getElementById("edit-amount")
    .value.replace(/,/g, "");
  const detail = document.getElementById("edit-detail").value;
  const idx = transactions.findIndex((x) => x.id === id);
  if (idx >= 0) {
    transactions[idx] = {
      id,
      date,
      type,
      category,
      detail,
      amount: parseInt(amountStr, 10),
    };
    saveTransactions();
    updateSummary();
    updateDailyReports();
    modal.style.display = "none";
  }
});
document.getElementById("delete-transaction").onclick = () => {
  if (!confirm("정말 삭제할까요?")) return;
  const id = Number(document.getElementById("edit-id").value);
  transactions = transactions.filter((x) => x.id !== id);
  saveTransactions();
  updateSummary();
  updateDailyReports();
  modal.style.display = "none";
};

function formatNumber(num, cur) {
  if (typeof num !== "number") num = parseFloat(num) || 0;
  if (cur === "EUR") {
    return num.toLocaleString("ko-KR", { maximumFractionDigits: 2 }) + "€";
  } else {
    return num.toLocaleString("ko-KR") + "원";
  }
}

const openCameraBtn = document.getElementById("open-camera");
const cameraInput = document.getElementById("camera-input");
const photoPreview = document.getElementById("photo-preview");
openCameraBtn.addEventListener("click", () => cameraInput.click());
cameraInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    const url = URL.createObjectURL(e.target.files[0]);
    photoPreview.innerHTML = `<img src="${url}"><div style="color:#a88fd3;margin-top:5px;">(사진은 이 기기 내에만 저장됩니다)</div>`;
  }
});

function updateReportSection() {
  let txt = "";
  let income = 0,
    expense = 0;
  transactions.forEach((tr) => {
    if (tr.type === "income") income += tr.amount;
    else expense += tr.amount;
  });
  let balance = income - expense;
  txt += `총수입 : ${formatNumber(
    income,
    currentCurrency
  )}\n총지출 : ${formatNumber(
    expense,
    currentCurrency
  )}\n총잔액 : ${formatNumber(
    balance,
    currentCurrency
  )}\n---------------------\n`;
  const map = groupByDate();
  const dates = Object.keys(map).sort((a, b) => b.localeCompare(a));
  dates.forEach((date) => {
    txt += `${date.replace(/-/g, ".")}\n`;
    let dayIncome = 0,
      dayExpense = 0;
    let dayIncomeItems = [],
      dayExpenseItems = [];
    map[date].forEach((tr) => {
      if (tr.type === "income") {
        dayIncome += tr.amount;
        dayIncomeItems.push(tr);
      } else {
        dayExpense += tr.amount;
        dayExpenseItems.push(tr);
      }
    });
    txt += `수입 : ${formatNumber(dayIncome, currentCurrency)}\n`;
    txt += `지출 : ${formatNumber(dayExpense, currentCurrency)}\n`;
    if (dayIncomeItems.length > 0) {
      txt += `수입 항목 :\n`;
      dayIncomeItems.forEach((tr) => {
        txt += `  ${tr.category} ${formatNumber(
          tr.amount,
          currentCurrency
        )}\n     상세항목 : ${tr.detail || "-"}\n`;
      });
    }
    if (dayExpenseItems.length > 0) {
      txt += `지출 항목 :\n`;
      dayExpenseItems.forEach((tr) => {
        txt += `  ${tr.category} ${formatNumber(
          tr.amount,
          currentCurrency
        )}\n     상세항목 : ${tr.detail || "-"}\n`;
      });
    }
    txt += "---------------------\n";
  });
  document.getElementById("report-content").textContent = txt;
}
document.getElementById("copy-report").onclick = () => {
  const txt = document.getElementById("report-content").textContent;
  navigator.clipboard.writeText(txt).then(() => {
    alert("텍스트가 복사되었습니다!");
  });
};
document.getElementById("export-pdf").onclick = () => {
  const txt = document.getElementById("report-content").textContent;
  const doc = new window.jspdf.jsPDF();
  let y = 15;
  txt.split("\n").forEach((line) => {
    doc.text(line, 10, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
  });
  doc.save("report.pdf");
};
