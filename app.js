const showSpinner = () => document.getElementById('loading-spinner')?.classList.remove('hidden');
const hideSpinner = () => document.getElementById('loading-spinner')?.classList.add('hidden');

// داده‌های نمونه برای دمو
const defaultData = [
  { soilPh: 6.2, temperature: 23.5, humidity: 60, irrigationStatus: "متوسط", cropType: "گوجه‌فرنگی", timestamp: "1404/03/10 10:00" },
  { soilPh: 5.7, temperature: 27.0, humidity: 50, irrigationStatus: "کم", cropType: "خیار", timestamp: "1404/03/11 12:00" },
  { soilPh: 7.5, temperature: 19.5, humidity: 75, irrigationStatus: "زیاد", cropType: "کاهو", timestamp: "1404/03/12 14:00" },
  { soilPh: 6.8, temperature: 24.0, humidity: 65, irrigationStatus: "متوسط", cropType: "گوجه‌فرنگی", timestamp: "1404/03/13 09:00" }
];

if (!localStorage.getItem('greenhouseData')) {
  localStorage.setItem('greenhouseData', JSON.stringify(defaultData));
}

let greenhouseData = JSON.parse(localStorage.getItem('greenhouseData')) || [];
let recommendations = JSON.parse(localStorage.getItem('recommendations')) || [];

const defaultUsers = {
  "farmer": { password: "1234", role: "grower" },
  "expert": { password: "1234", role: "expert" },
  "admin": { password: "1234", role: "admin" }
};

if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify(defaultUsers));
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  if (!username || !password) {
    errorMessage.textContent = "لطفاً تمام فیلدها را پر کنید.";
    return;
  }

  const users = JSON.parse(localStorage.getItem('users'));
  const user = users[username];

  if (!user || user.password !== password) {
    errorMessage.textContent = "نام کاربری یا رمز اشتباه است.";
    return;
  }

  localStorage.setItem('loggedInUser', username);
  window.location.href = `${user.role}.html`;
}

function register() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const errorMessage = document.getElementById('error-message');

  if (!username || !password || !role) {
    errorMessage.textContent = "لطفاً تمام فیلدها را پر کنید.";
    return;
  }

  let users = JSON.parse(localStorage.getItem('users')) || {};
  if (users[username]) {
    errorMessage.textContent = "این نام کاربری وجود دارد.";
    return;
  }

  users[username] = { password, role };
  localStorage.setItem('users', JSON.stringify(users));
  M.toast({ html: 'ثبت‌نام با موفقیت انجام شد.', classes: 'green' });
  window.location.href = 'login.html';
}

function logout() {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
}

// تحلیل محاسباتی داده‌ها
function analyzeData(data) {
  const stats = {
    soilPh: { mean: 0, min: Infinity, max: -Infinity, std: 0 },
    temperature: { mean: 0, min: Infinity, max: -Infinity, std: 0 },
    humidity: { mean: 0, min: Infinity, max: -Infinity, std: 0 }
  };

  if (data.length === 0) return stats;

  // محاسبه میانگین، مینیمم، ماکزیمم
  stats.soilPh.mean = data.reduce((sum, d) => sum + parseFloat(d.soilPh), 0) / data.length;
  stats.temperature.mean = data.reduce((sum, d) => sum + parseFloat(d.temperature), 0) / data.length;
  stats.humidity.mean = data.reduce((sum, d) => sum + parseFloat(d.humidity), 0) / data.length;

  stats.soilPh.min = Math.min(...data.map(d => parseFloat(d.soilPh)));
  stats.soilPh.max = Math.max(...data.map(d => parseFloat(d.soilPh)));
  stats.temperature.min = Math.min(...data.map(d => parseFloat(d.temperature)));
  stats.temperature.max = Math.max(...data.map(d => parseFloat(d.temperature)));
  stats.humidity.min = Math.min(...data.map(d => parseFloat(d.humidity)));
  stats.humidity.max = Math.max(...data.map(d => parseFloat(d.humidity)));

  // محاسبه انحراف معیار
  stats.soilPh.std = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(parseFloat(d.soilPh) - stats.soilPh.mean, 2), 0) / data.length);
  stats.temperature.std = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(parseFloat(d.temperature) - stats.temperature.mean, 2), 0) / data.length);
  stats.humidity.std = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(parseFloat(d.humidity) - stats.humidity.mean, 2), 0) / data.length);

  return stats;
}

function saveData(data) {
  greenhouseData.push(data);
  localStorage.setItem('greenhouseData', JSON.stringify(greenhouseData));
  loadData();
}

function loadData() {
  const tableBody = document.getElementById('data-table');
  const summaryText = document.getElementById('summary-text');
  const cropFilter = document.getElementById('crop-filter')?.value || 'همه';

  if (tableBody) {
    tableBody.innerHTML = '';
    const filteredData = cropFilter === 'همه' ? greenhouseData : greenhouseData.filter(d => d.cropType === cropFilter);
    filteredData.forEach(data => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${data.soilPh}</td>
        <td>${data.temperature}</td>
        <td>${data.humidity}</td>
        <td>${data.irrigationStatus}</td>
        <td>${data.cropType}</td>
        <td>${data.timestamp}</td>
      `;
      tableBody.appendChild(row);
    });

    const stats = analyzeData(filteredData);
    if (summaryText) {
      summaryText.innerHTML = `
        تعداد داده‌ها: ${filteredData.length}<br>
        میانگین pH خاک: ${stats.soilPh.mean.toFixed(2)} (انحراف معیار: ${stats.soilPh.std.toFixed(2)})<br>
        میانگین دما: ${stats.temperature.mean.toFixed(2)}°C (انحراف معیار: ${stats.temperature.std.toFixed(2)})<br>
        میانگین رطوبت: ${stats.humidity.mean.toFixed(2)}% (انحراف معیار: ${stats.humidity.std.toFixed(2)})
      `;
    }
  }

  updateCharts();
}

function updateCharts() {
  const cropFilter = document.getElementById('crop-filter')?.value || 'همه';
  const filteredData = cropFilter === 'همه' ? greenhouseData : greenhouseData.filter(d => d.cropType === cropFilter);

  const ctxPh = document.getElementById('ph-chart')?.getContext('2d');
  const ctxTemp = document.getElementById('temp-chart')?.getContext('2d');
  const ctxHumidity = document.getElementById('humidity-chart')?.getContext('2d');
  const ctxPhHist = document.getElementById('ph-histogram')?.getContext('2d');

  if (ctxPh) {
    new Chart(ctxPh, {
      type: 'line',
      data: {
        labels: filteredData.map(d => d.timestamp),
        datasets: [{
          label: 'pH خاک',
          data: filteredData.map(d => d.soilPh),
          borderColor: '#4caf50',
          fill: false
        }]
      },
      options: { responsive: true, scales: { y: { min: 0, max: 14 } } }
    });
  }

  if (ctxTemp) {
    new Chart(ctxTemp, {
      type: 'line',
      data: {
        labels: filteredData.map(d => d.timestamp),
        datasets: [{
          label: 'دما (°C)',
          data: filteredData.map(d => d.temperature),
          borderColor: '#f28c38',
          fill: false
        }]
      },
      options: { responsive: true, scales: { y: { min: -10, max: 50 } } }
    });
  }

  if (ctxHumidity) {
    new Chart(ctxHumidity, {
      type: 'line',
      data: {
        labels: filteredData.map(d => d.timestamp),
        datasets: [{
          label: 'رطوبت (%)',
          data: filteredData.map(d => d.humidity),
          borderColor: '#0288d1',
          fill: false
        }]
      },
      options: { responsive: true, scales: { y: { min: 0, max: 100 } } }
    });
  }

  if (ctxPhHist) {
    const phValues = filteredData.map(d => parseFloat(d.soilPh));
    const bins = Array(14).fill(0); // بازه‌های 0 تا 14
    phValues.forEach(ph => {
      const index = Math.min(Math.floor(ph), 13);
      bins[index]++;
    });

    new Chart(ctxPhHist, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 14 }, (_, i) => i.toString()),
        datasets: [{
          label: 'توزیع pH خاک',
          data: bins,
          backgroundColor: '#4caf50'
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }
}

function loadRecommendations() {
  const table = document.getElementById('expert-table');
  const list = document.getElementById('manual-recommendations');
  const cropFilter = document.getElementById('recommendation-filter')?.value || 'همه';

  if (table) {
    table.innerHTML = '';
    const filteredData = cropFilter === 'همه' ? greenhouseData : greenhouseData.filter(d => d.cropType === cropFilter);
    filteredData.forEach(data => {
      let status = 'عادی';
      let recommendation = 'وضعیت مناسب';
      if (data.soilPh < 6 || data.soilPh > 8) {
        status = 'بحرانی';
        recommendation = data.soilPh < 6 ? 'افزایش pH خاک با آهک' : 'کاهش pH خاک با گوگرد';
      } else if (data.temperature > 25 && data.cropType === 'گوجه‌فرنگی') {
        status = 'هشدار';
        recommendation = 'کاهش دما با تهویه بهتر';
      } else if (data.humidity < 60 && data.cropType === 'کاهو') {
        status = 'هشدار';
        recommendation = 'افزایش رطوبت محیط';
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${data.soilPh}</td>
        <td>${data.temperature}</td>
        <td>${data.humidity}</td>
        <td>${data.irrigationStatus}</td>
        <td>${data.cropType}</td>
        <td class="${status === 'بحرانی' ? 'status-red' : status === 'هشدار' ? 'status-orange' : 'status-green'}">${status}</td>
        <td>${recommendation}</td>
      `;
      table.appendChild(row);
    });
  }

  if (list) {
    list.innerHTML = '';
    const filteredRecommendations = cropFilter === 'همه' ? recommendations : recommendations.filter(r => r.cropType === cropFilter);
    filteredRecommendations.forEach(rec => {
      const li = document.createElement('li');
      li.className = 'collection-item';
      li.innerHTML = `<span class="recommendation">${rec.text}</span><small>${rec.timestamp}</small>`;
      list.appendChild(li);
    });
  }
}

function loadUsers() {
  const userList = document.getElementById('user-list');
  if (userList) {
    userList.innerHTML = '';
    const users = JSON.parse(localStorage.getItem('users')) || {};
    Object.keys(users).forEach(username => {
      const li = document.createElement('li');
      li.className = 'collection-item';
      li.textContent = `${username} - ${users[username].role}`;
      userList.appendChild(li);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  M.FormSelect.init(document.querySelectorAll('select'));

  document.getElementById('greenhouse-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      soilPh: document.getElementById('soil-ph').value,
      temperature: document.getElementById('temperature').value,
      humidity: document.getElementById('humidity').value,
      irrigationStatus: document.getElementById('irrigation-status').value,
      cropType: document.getElementById('crop-type').value,
      timestamp: new Date().toLocaleString('fa-IR')
    };

    if (data.soilPh < 0 || data.soilPh > 14 || data.temperature < -10 || data.temperature > 50 || data.humidity < 0 || data.humidity > 100) {
      M.toast({ html: 'مقادیر ورودی نامعتبر است!', classes: 'red' });
      return;
    }

    showSpinner();
    setTimeout(() => {
      saveData(data);
      M.toast({ html: 'داده با موفقیت ثبت شد!', classes: 'green' });
      hideSpinner();
      e.target.reset();
    }, 1000);
  });

  document.getElementById('recommendation-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const recommendation = document.getElementById('recommendation-text').value;
    const cropFilter = document.getElementById('recommendation-filter')?.value || 'همه';
    recommendations.push({ text: recommendation, timestamp: new Date().toLocaleString('fa-IR'), cropType: cropFilter });
    localStorage.setItem('recommendations', JSON.stringify(recommendations));
    loadRecommendations();
    M.toast({ html: 'توصیه با موفقیت ثبت شد!', classes: 'green' });
    e.target.reset();
  });

  document.getElementById('crop-filter')?.addEventListener('change', loadData);
  document.getElementById('recommendation-filter')?.addEventListener('change', loadRecommendations);

  document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  });

  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }

  const allowedPages = {
    grower: ['grower.html', 'app.html'],
    expert: ['expert.html', 'app.html', 'grower.html'],
    admin: ['admin.html', 'app.html', 'grower.html']
  };

  const currentPage = window.location.pathname.split('/').pop();
  const currentUser = localStorage.getItem('loggedInUser');

  if (!currentUser && !['login.html', 'register.html', 'index.html'].includes(currentPage)) {
    window.location.href = 'login.html';
  } else if (currentPage.includes('.html') && !['login.html', 'register.html', 'index.html'].includes(currentPage)) {
    const role = JSON.parse(localStorage.getItem('users'))[currentUser]?.role;
    const allowed = allowedPages[role] || [];
    if (!allowed.includes(currentPage)) {
      M.toast({ html: 'دسترسی غیرمجاز', classes: 'red' });
      window.history.back();
    }
  }

  loadData();
  loadRecommendations();
  loadUsers();
});