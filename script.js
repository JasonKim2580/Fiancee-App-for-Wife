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
document.getElementById("currency-select").onchange = function () {
  currentCurrency = this.value;
  updateSummary();
  updateDailyReports();
  updateReportSection();
};
fetchRateAndUpdate();
setInterval(fetchRateAndUpdate, 12 * 3600 * 1000);

const categories = {
  income: ["선교회비", "후원비용", "기타"],
  expense: ["식비", "교통비", "숙박비", "선교후원비", "기타"],
};
function fillCategoryOptions(type, selectEl) {
  selectEl.innerHTML = "";
  categories[type].forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    selectEl.appendChild(option);
  });
}
const categorySelect = document.getElementById("category-select");
document.getElementById("type-select").onchange = function () {
  fillCategoryOptions(this.value, categorySelect);
};
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
            `<li class="detail-${tr.type}">
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
    // 일별 박스 전체 클릭시 -> 전체 수정 모달
    box.addEventListener("click", () => showEditDayModal(date));
    container.appendChild(box);
  });
}
updateDailyReports();

// ----- 일별 박스 전체 수정 모달 기능 -----
const editDayModal = document.getElementById("edit-day-modal");
const editDayEntries = document.getElementById("edit-day-entries");
const editDayModalDate = document.getElementById("edit-day-modal-date");
const editDayForm = document.getElementById("edit-day-form");
let editDayModalTargetDate = null;

function showEditDayModal(date) {
  editDayModalTargetDate = date;
  editDayModalDate.textContent = date.replace(/-/g, ".");
  editDayEntries.innerHTML = "";
  const editItems = transactions.filter((tr) => tr.date === date);
  editItems.forEach((tr, idx) => {
    // 각각의 항목은 한줄씩 인풋(분류, 항목, 금액, 상세항목)으로 노출
    const row = document.createElement("div");
    row.className = "edit-day-row";
    row.innerHTML = `
      <input type="hidden" name="id" value="${tr.id}" />
      <select name="type" class="edit-type">
        <option value="income" ${
          tr.type === "income" ? "selected" : ""
        }>수입</option>
        <option value="expense" ${
          tr.type === "expense" ? "selected" : ""
        }>지출</option>
      </select>
      <select name="category" class="edit-category"></select>
      <input type="text" name="amount" class="edit-amount" value="${tr.amount.toLocaleString()}" required pattern="[0-9,]+" />
      <input type="text" name="detail" class="edit-detail" maxlength="50" value="${
        tr.detail || ""
      }" />
      <button type="button" class="delete-day-entry" title="삭제">🗑</button>
    `;
    // 분류 선택에 따라 항목 선택 자동 변경
    const typeSelect = row.querySelector(".edit-type");
    const categorySelect = row.querySelector(".edit-category");
    typeSelect.addEventListener("change", (e) => {
      fillCategoryOptions(e.target.value, categorySelect);
    });
    fillCategoryOptions(tr.type, categorySelect);
    categorySelect.value = tr.category;
    // 금액 ',' 자동
    row.querySelector(".edit-amount").addEventListener("input", (e) => {
      let val = e.target.value.replace(/[^0-9]/g, "");
      if (!val) {
        e.target.value = "";
        return;
      }
      e.target.value = Number(val).toLocaleString();
    });
    // 삭제버튼
    row.querySelector(".delete-day-entry").onclick = () => {
      if (confirm("이 항목을 삭제할까요?")) {
        transactions = transactions.filter((x) => x.id !== tr.id);
        saveTransactions();
        updateSummary();
        updateDailyReports();
        showEditDayModal(date); // 새로고침
      }
    };
    editDayEntries.appendChild(row);
  });
  editDayModal.style.display = "flex";
}
document.getElementById("close-day-modal").onclick = () => {
  editDayModal.style.display = "none";
};

editDayForm.onsubmit = function (e) {
  e.preventDefault();
  if (!confirm("정말로 수정 사항을 저장할까요?")) return;
  const rows = Array.from(editDayEntries.querySelectorAll(".edit-day-row"));
  rows.forEach((row) => {
    const id = Number(row.querySelector('[name="id"]').value);
    const type = row.querySelector('[name="type"]').value;
    const category = row.querySelector('[name="category"]').value;
    const amount = parseInt(
      row.querySelector('[name="amount"]').value.replace(/,/g, ""),
      10
    );
    const detail = row.querySelector('[name="detail"]').value;
    const idx = transactions.findIndex((x) => x.id === id);
    if (idx >= 0) {
      transactions[idx] = {
        ...transactions[idx],
        type,
        category,
        amount,
        detail,
      };
    }
  });
  saveTransactions();
  updateSummary();
  updateDailyReports();
  editDayModal.style.display = "none";
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
    photoPreview.innerHTML = `<img src="${url}" style="max-width: 140px; max-height: 120px;"><div style="color:#a88fd3;margin-top:5px;">(사진은 이 기기 내에만 저장됩니다)</div>`;
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
