const showSpinner = () => document.querySelector('#loading-spinner')?.classList.remove('hidden');
const hideSpinner = () => document.querySelector('#loading-spinner')?.classList.add('hidden');

// Sample data for demo
const defaultData = [
  { soilPh: 6.2, temperature: 23.5, humidity: 60, irrigationStatus: "متوسط", cropType: "گوجه‌فرنگی", timestamp: "1404/03/10 10:00" },
  { soilPh: 5.7, temperature: 27.0, humidity: 50, irrigationStatus: "کم", cropType: "خیار", timestamp: "1404/03/11 12:00" },
  { soilPh: 7.5, temperature: 19.5, humidity: 75, irrigationStatus: "زیاد", cropType: "کاهو", timestamp: "1404/03/12 14:00" },
  { soilPh: 6.8, temperature: 24.0, humidity: 65, irrigationStatus: "متوسط", cropType: "گوجه‌فرنگی", timestamp: "1404/03/13 09:00" },
  { soilPh: 5.5, temperature: 28.5, humidity: 45, irrigationStatus: "کم", cropType: "فلفل", timestamp: "1404/03/14 11:00" },
  { soilPh: 6.0, temperature: 22.0, humidity: 55, irrigationStatus: "متوسط", cropType: "خیار", timestamp: "1404/03/15 10:00" }
];

// Initialize data if not present
if (!localStorage.getItem('greenhouseData')) {
  localStorage.setItem('greenhouseData', JSON.stringify(defaultData));
}

let greenhouseData = JSON.parse(localStorage.getItem('greenhouseData')) || defaultData;
let recommendations = JSON.parse(localStorage.getItem('recommendations')) || [];

const defaultUsers = {
  "farmer": { password: "1234", role: "grower" },
  "expert": { password: "1234", role: "expert" },
  "admin": { password: "1234", role: "admin" }
};

// Initialize users if not present
if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify(defaultUsers));
}

function login() {
  const username = document.querySelector('#username')?.value.trim();
  const password = document.querySelector('#password')?.value;
  const errorMessage = document.querySelector('#error-message');

  if (!username || !password) {
    errorMessage.textContent = "لطفاً تمام فیلدها را پر کنید.";
    return;
  }

  const users = JSON.parse(localStorage.getItem('users')) || {};
  const user = users[username];

  if (!user || user.password !== password) {
    errorMessage.textContent = "نام کاربری یا رمز اشتباه است.";
    return;
  }

  localStorage.setItem('loggedInUser', username);
  window.location.href = `${user.role}.html`;
}

function register() {
  const username = document.querySelector('#username')?.value.trim();
  const password = document.querySelector('#password')?.value;
  const role = document.querySelector('#role')?.value;
  const errorMessage = document.querySelector('#error-message');

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

// Data analysis
function analyzeData(data) {
  const stats = {
    soilPh: { mean: 0, min: Infinity, max: -Infinity, std: 0 },
    temperature: { mean: 0, min: Infinity, max: -Infinity, std: 0 },
    humidity: { mean: 0, min: Infinity, max: -Infinity, std: 0 },
    correlation: { phTemp: 0, phHumidity: 0, tempHumidity: 0 }
  };

  if (!data || data.length === 0) return stats;

  stats.soilPh.mean = data.reduce((sum, d) => sum + parseFloat(d.soilPh), 0) / data.length;
  stats.temperature.mean = data.reduce((sum, d) => sum + parseFloat(d.temperature), 0) / data.length;
  stats.humidity.mean = data.reduce((sum, d) => sum + parseFloat(d.humidity), 0) / data.length;

  stats.soilPh.min = Math.min(...data.map(d => parseFloat(d.soilPh)));
  stats.soilPh.max = Math.max(...data.map(d => parseFloat(d.soilPh)));
  stats.temperature.min = Math.min(...data.map(d => parseFloat(d.temperature)));
  stats.temperature.max = Math.max(...data.map(d => parseFloat(d.temperature)));
  stats.humidity.min = Math.min(...data.map(d => parseFloat(d.humidity)));
  stats.humidity.max = Math.max(...data.map(d => parseFloat(d.humidity)));

  stats.soilPh.std = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(parseFloat(d.soilPh) - stats.soilPh.mean, 2), 0) / data.length);
  stats.temperature.std = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(parseFloat(d.temperature) - stats.temperature.mean, 2), 0) / data.length);
  stats.humidity.std = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(parseFloat(d.humidity) - stats.humidity.mean, 2), 0) / data.length);

  const n = data.length;
  const sumPhTemp = data.reduce((sum, d) => sum + parseFloat(d.soilPh) * parseFloat(d.temperature), 0);
  const sumPhHumidity = data.reduce((sum, d) => sum + parseFloat(d.soilPh) * parseFloat(d.humidity), 0);
  const sumTempHumidity = data.reduce((sum, d) => sum + parseFloat(d.temperature) * parseFloat(d.humidity), 0);
  const sumPh = data.reduce((sum, d) => sum + parseFloat(d.soilPh), 0);
  const sumTemp = data.reduce((sum, d) => sum + parseFloat(d.temperature), 0);
  const sumHumidity = data.reduce((sum, d) => sum + parseFloat(d.humidity), 0);
  const sumPh2 = data.reduce((sum, d) => sum + parseFloat(d.soilPh) ** 2, 0);
  const sumTemp2 = data.reduce((sum, d) => sum + parseFloat(d.temperature) ** 2, 0);
  const sumHumidity2 = data.reduce((sum, d) => sum + parseFloat(d.humidity) ** 2, 0);

  stats.correlation.phTemp = (n * sumPhTemp - sumPh * sumTemp) / Math.sqrt((n * sumPh2 - sumPh ** 2) * (n * sumTemp2 - sumTemp ** 2)) || 0;
  stats.correlation.phHumidity = (n * sumPhHumidity - sumPh * sumHumidity) / Math.sqrt((n * sumPh2 - sumPh ** 2) * (n * sumHumidity2 - sumHumidity ** 2)) || 0;
  stats.correlation.tempHumidity = (n * sumTempHumidity - sumTemp * sumHumidity) / Math.sqrt((n * sumTemp2 - sumTemp ** 2) * (n * sumHumidity2 - sumHumidity ** 2)) || 0;

  return stats;
}

// Simple moving average prediction
function predictMovingAverage(data, windowSize = 3) {
  const phValues = data.map(d => parseFloat(d.soilPh));
  if (phValues.length < windowSize) return null;
  const lastWindow = phValues.slice(-windowSize);
  return lastWindow.reduce((sum, val) => sum + val, 0) / windowSize;
}

function saveData(data) {
  greenhouseData.push(data);
  localStorage.setItem('greenhouseData', JSON.stringify(greenhouseData));
  loadData();
}

// Debounce function to prevent multiple rapid calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function loadData() {
  const tableBody = document.querySelector('#data-table');
  const summaryTable = document.querySelector('#summary-table');
  const alertsList = document.querySelector('#alerts');
  const recentRecommendations = document.querySelector('#recent-recommendations');
  const cropFilter = document.querySelector('#crop-filter')?.value || 'همه';
  const timeFilter = document.querySelector('#time-filter')?.value || 'all';

  if (!tableBody) {
    console.error('جدول داده (#data-table) یافت نشد.');
    return;
  }

  let filteredData = cropFilter === 'همه' ? [...greenhouseData] : greenhouseData.filter(d => d.cropType === cropFilter);

  // Fix timestamp parsing for time filter
  const now = new Date();
  if (timeFilter === '7days') {
    filteredData = filteredData.filter(d => {
      try {
        const date = new Date(d.timestamp.replace(/(\d{4})\/(\d{2})\/(\d{2})/, '$1-$2-$3'));
        return date >= new Date(now.setDate(now.getDate() - 7));
      } catch (e) {
        console.error('خطا در تجزیه تاریخ:', d.timestamp);
        return false;
      }
    });
  } else if (timeFilter === '30days') {
    filteredData = filteredData.filter(d => {
      try {
        const date = new Date(d.timestamp.replace(/(\d{4})\/(\d{2})\/(\d{2})/, '$1-$2-$3'));
        return date >= new Date(now.setDate(now.getDate() - 30));
      } catch (e) {
        console.error('خطا در تجزیه تاریخ:', d.timestamp);
        return false;
      }
    });
  }

  // Prevent table from being cleared unnecessarily
  tableBody.innerHTML = '';
  if (filteredData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="no-data">داده‌ای برای نمایش وجود ندارد.</td></tr>';
  } else {
    filteredData.forEach(data => {
      const row = document.createElement('tr');
      row.className = 'fade-in';
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
  }

  const stats = analyzeData(filteredData);
  const prediction = predictMovingAverage(filteredData);
  if (summaryTable) {
    summaryTable.innerHTML = filteredData.length > 0 ? `
      <tr><td>تعداد داده‌ها</td><td>${filteredData.length}</td></tr>
      <tr><td>میانگین pH خاک</td><td>${stats.soilPh.mean.toFixed(2)} (انحراف معیار: ${stats.soilPh.std.toFixed(2)})</td></tr>
      <tr><td>میانگین دما</td><td>${stats.temperature.mean.toFixed(2)}°C (انحراف معیار: ${stats.temperature.std.toFixed(2)})</td></tr>
      <tr><td>میانگین رطوبت</td><td>${stats.humidity.mean.toFixed(2)}% (انحراف معیار: ${stats.humidity.std.toFixed(2)})</td></tr>
      <tr><td>همبستگی pH و دما</td><td>${stats.correlation.phTemp.toFixed(2)}</td></tr>
      <tr><td>همبستگی pH و رطوبت</td><td>${stats.correlation.phHumidity.toFixed(2)}</td></tr>
      <tr><td>همبستگی دما و رطوبت</td><td>${stats.correlation.tempHumidity.toFixed(2)}</td></tr>
      <tr><td>پیش‌بینی pH (3 روز آینده)</td><td>${prediction ? prediction.toFixed(2) : 'داده کافی نیست'}</td></tr>
    ` : '<tr><td colspan="2" class="no-data">داده‌ای برای تحلیل وجود ندارد.</td></tr>';
  }

  if (alertsList) {
    alertsList.innerHTML = '';
    if (filteredData.length === 0) {
      alertsList.innerHTML = '<li class="collection-item no-data">هشداری وجود ندارد.</li>';
    } else {
      filteredData.forEach(data => {
        let alertText = '';
        if (data.soilPh < 6 || data.soilPh > 8) {
          alertText = `هشدار: pH خاک (${data.soilPh}) برای ${data.cropType} بحرانی است!`;
        } else if (data.temperature > 25 && data.cropType === 'گوجه‌فرنگی') {
          alertText = `هشدار: دما (${data.temperature}°C) برای گوجه‌فرنگی بالاست!`;
        } else if (data.humidity < 60 && data.cropType === 'کاهو') {
          alertText = `هشدار: رطوبت (${data.humidity}%) برای کاهو پایین است!`;
        }
        if (alertText) {
          const li = document.createElement('li');
          li.className = 'collection-item red-text alert-item';
          li.textContent = alertText;
          alertsList.appendChild(li);
        }
      });
    }
  }

  if (recentRecommendations) {
    recentRecommendations.innerHTML = '';
    const filteredRecommendations = cropFilter === 'همه' ? recommendations.slice(-3) : recommendations.filter(r => r.cropType === cropFilter).slice(-3);
    if (filteredRecommendations.length === 0) {
      recentRecommendations.innerHTML = '<li class="collection-item no-data">توصیه‌ای وجود ندارد.</li>';
    } else {
      filteredRecommendations.forEach(rec => {
        const li = document.createElement('li');
        li.className = 'collection-item';
        li.innerHTML = `<span class="recommendation">${rec.text}</span><small>${rec.timestamp}</small>`;
        recentRecommendations.appendChild(li);
      });
    }
  }

  updateCharts(filteredData);
}

function updateCharts(filteredData) {
  const cropFilter = document.querySelector('#crop-filter')?.value || 'همه';
  const idealValues = {
    'گوجه‌فرنگی': { soilPh: 6.5, temperature: 22, humidity: 65 },
    'خیار': { soilPh: 6.0, temperature: 24, humidity: 70 },
    'فلفل': { soilPh: 6.2, temperature: 25, humidity: 60 },
    'کاهو': { soilPh: 6.8, temperature: 20, humidity: 75 }
  };

  const ctxPh = document.querySelector('#ph-chart')?.getContext('2d');
  const ctxTemp = document.querySelector('#temp-chart')?.getContext('2d');
  const ctxHumidity = document.querySelector('#humidity-chart')?.getContext('2d');
  const ctxPhHist = document.querySelector('#ph-histogram')?.getContext('2d');
  const ctxScatter = document.querySelector('#scatter-chart')?.getContext('2d');
  const ctxDonut = document.querySelector('#donut-chart')?.getContext('2d');
  const ctxRadar = document.querySelector('#radar-chart')?.getContext('2d');
  const ctxPhGauge = document.querySelector('#ph-gauge')?.getContext('2d');
  const ctxTempGauge = document.querySelector('#temp-gauge')?.getContext('2d');
  const ctxHumidityGauge = document.querySelector('#humidity-gauge')?.getContext('2d');

  // Clear previous charts
  [ctxPh, ctxTemp, ctxHumidity, ctxPhHist, ctxScatter, ctxDonut, ctxRadar, ctxPhGauge, ctxTempGauge, ctxHumidityGauge]
    .forEach(ctx => ctx?.chart?.destroy());

  // Line charts
  if (ctxPh && filteredData.length > 0) {
    ctxPh.chart = new Chart(ctxPh, {
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
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'تغییرات pH خاک در طول زمان' },
          legend: { display: true }
        },
        scales: {
          y: { min: 0, max: 14, title: { display: true, text: 'pH خاک' } },
          x: { title: { display: true, text: 'زمان' } }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  }

  if (ctxTemp && filteredData.length > 0) {
    ctxTemp.chart = new Chart(ctxTemp, {
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
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'تغییرات دما در طول زمان' },
          legend: { display: true }
        },
        scales: {
          y: { min: -10, max: 50, title: { display: true, text: 'دما (°C)' } },
          x: { title: { display: true, text: 'زمان' } }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  }

  if (ctxHumidity && filteredData.length > 0) {
    ctxHumidity.chart = new Chart(ctxHumidity, {
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
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'تغییرات رطوبت در طول زمان' },
          legend: { display: true }
        },
        scales: {
          y: { min: 0, max: 100, title: { display: true, text: 'رطوبت (%)' } },
          x: { title: { display: true, text: 'زمان' } }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  }

  // Histogram
  if (ctxPhHist && filteredData.length > 0) {
    const phValues = filteredData.map(d => parseFloat(d.soilPh));
    const bins = Array(14).fill(0);
    phValues.forEach(ph => {
      const index = Math.min(Math.floor(ph), 13);
      bins[index]++;
    });

    ctxPhHist.chart = new Chart(ctxPhHist, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 14 }, (_, i) => i.toString()),
        datasets: [{
          label: 'توزیع pH خاک',
          data: bins,
          backgroundColor: '#4caf50'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'هیستوگرام توزیع pH خاک' },
          legend: { display: true }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'تعداد' } },
          x: { title: { display: true, text: 'pH خاک' } }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  }

  // Scatter chart
  if (ctxScatter && filteredData.length > 0) {
    ctxScatter.chart = new Chart(ctxScatter, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'pH خاک در مقابل دما',
          data: filteredData.map(d => ({ x: parseFloat(d.temperature), y: parseFloat(d.soilPh) })),
          backgroundColor: '#0288d1'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'رابطه pH خاک و دما' },
          legend: { display: true }
        },
        scales: {
          x: { title: { display: true, text: 'دما (°C)' }, min: -10, max: 50 },
          y: { title: { display: true, text: 'pH خاک' }, min: 0, max: 14 }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  }

  // Donut chart
  if (ctxDonut && filteredData.length > 0) {
    const statusCounts = { normal: 0, warning: 0, critical: 0 };
    filteredData.forEach(data => {
      if (data.soilPh < 6 || data.soilPh > 8) statusCounts.critical++;
      else if (data.temperature > 25 && data.cropType === 'گوجه‌فرنگی') statusCounts.warning++;
      else if (data.humidity < 60 && data.cropType === 'کاهو') statusCounts.warning++;
      else statusCounts.normal++;
    });

    ctxDonut.chart = new Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: ['عادی', 'هشدار', 'بحرانی'],
        datasets: [{
          data: [statusCounts.normal, statusCounts.warning, statusCounts.critical],
          backgroundColor: ['#4caf50', '#f28c38', '#d32f2f']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'وضعیت داده‌ها' },
          legend: { display: true }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  }

  // Radar chart
  if (ctxRadar && filteredData.length > 0) {
    const latestData = filteredData[filteredData.length - 1] || {};
    const cropType = latestData.cropType || 'گوجه‌فرنگی';
    const ideal = idealValues[cropType];

    ctxRadar.chart = new Chart(ctxRadar, {
      type: 'radar',
      data: {
        labels: ['pH خاک', 'دما (°C)', 'رطوبت (%)'],
        datasets: [
          {
            label: 'وضعیت فعلی',
            data: [latestData.soilPh || 0, latestData.temperature || 0, latestData.humidity || 0],
            backgroundColor: 'rgba(4, 169, 208, 0.2)',
            borderColor: '#0288d1'
          },
          {
            label: 'وضعیت ایده‌آل',
            data: [ideal.soilPh, ideal.temperature, ideal.humidity],
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderColor: '#4caf50'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'مقایسه وضعیت فعلی با ایده‌آل' },
          legend: { display: true }
        },
        scales: { r: { beginAtZero: true } },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  }

  // Gauge charts
  const gaugeConfig = (value, min, max, label, color, title) => ({
    type: 'doughnut',
    data: {
      datasets: [{
        data: [value, max - value],
        backgroundColor: [color, '#e0e0e0'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      circumference: 180,
      rotation: -90,
      cutout: '80%',
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        title: { display: true, text: title }
      },
      animation: { duration: 1000, easing: 'easeOutQuart' }
    }
  });

  if (ctxPhGauge && filteredData.length > 0) {
    const latestPh = filteredData[filteredData.length - 1]?.soilPh || 7;
    ctxPhGauge.chart = new Chart(ctxPhGauge, gaugeConfig(latestPh, 0, 14, 'pH خاک', latestPh < 6 || latestPh > 8 ? '#d32f2f' : '#4caf50', 'آخرین pH خاک'));
  }

  if (ctxTempGauge && filteredData.length > 0) {
    const latestTemp = filteredData[filteredData.length - 1]?.temperature || 25;
    ctxTempGauge.chart = new Chart(ctxTempGauge, gaugeConfig(latestTemp, -10, 50, 'دما (°C)', latestTemp > 30 ? '#d32f2f' : '#f28c38', 'آخرین دما'));
  }

  if (ctxHumidityGauge && filteredData.length > 0) {
    const latestHumidity = filteredData[filteredData.length - 1]?.humidity || 50;
    ctxHumidityGauge.chart = new Chart(ctxHumidityGauge, gaugeConfig(latestHumidity, 0, 100, 'رطوبت (%)', latestHumidity < 50 ? '#d32f2f' : '#0288d1', 'آخرین رطوبت'));
  }
}

function loadRecommendations() {
  const table = document.querySelector('#expert-table');
  const list = document.querySelector('#manual-recommendations');
  const cropFilter = document.querySelector('#recommendation-filter')?.value || 'همه';

  if (table) {
    table.innerHTML = '';
    const filteredData = cropFilter === 'همه' ? greenhouseData : greenhouseData.filter(d => d.cropType === cropFilter);
    if (filteredData.length === 0) {
      table.innerHTML = '<tr><td colspan="7" class="no-data">داده‌ای برای نمایش وجود ندارد.</td></tr>';
    } else {
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
        row.className = 'fade-in';
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
  }

  if (list) {
    list.innerHTML = '';
    const filteredRecommendations = cropFilter === 'همه' ? recommendations : recommendations.filter(r => r.cropType === cropFilter);
    if (filteredRecommendations.length === 0) {
      list.innerHTML = '<li class="collection-item no-data">توصیه‌ای وجود ندارد.</li>';
    } else {
      filteredRecommendations.forEach(rec => {
        const li = document.createElement('li');
        li.className = 'collection-item';
        li.innerHTML = `<span class="recommendation">${rec.text}</span><small>${rec.timestamp}</small>`;
        list.appendChild(li);
      });
    }
  }
}

function loadUsers() {
  const userList = document.querySelector('#user-list');
  if (!userList) {
    console.error('لیست کاربران (#user-list) یافت نشد.');
    return;
  }

  userList.innerHTML = '';
  const users = JSON.parse(localStorage.getItem('users')) || {};
  if (Object.keys(users).length === 0) {
    userList.innerHTML = '<li class="collection-item no-data">کاربری وجود ندارد.</li>';
  } else {
    Object.keys(users).forEach(username => {
      const li = document.createElement('li');
      li.className = 'collection-item fade-in';
      li.textContent = `${username} - ${users[username].role}`;
      userList.appendChild(li);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    M.FormSelect.init(document.querySelectorAll('select'));

    document.querySelector('#greenhouse-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        soilPh: parseFloat(document.querySelector('#soil-ph').value),
        temperature: parseFloat(document.querySelector('#temperature').value),
        humidity: parseFloat(document.querySelector('#humidity').value),
        irrigationStatus: document.querySelector('#irrigation-status').value,
        cropType: document.querySelector('#crop-type').value,
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
      }, 500);
    });

    document.querySelector('#recommendation-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const recommendation = document.querySelector('#recommendation-text').value;
      const cropFilter = document.querySelector('#recommendation-filter')?.value || 'همه';
      recommendations.push({ text: recommendation, timestamp: new Date().toLocaleString('fa-IR'), cropType: cropFilter });
      localStorage.setItem('recommendations', JSON.stringify(recommendations));
      loadRecommendations();
      M.toast({ html: 'توصیه با موفقیت ثبت شد!', classes: 'green' });
      e.target.reset();
    });

    // Debounced event listeners for filters
    const debouncedLoadData = debounce(loadData, 300);
    document.querySelector('#crop-filter')?.addEventListener('change', debouncedLoadData);
    document.querySelector('#time-filter')?.addEventListener('change', debouncedLoadData);
    document.querySelector('#recommendation-filter')?.addEventListener('change', debounce(loadRecommendations, 300));

    document.querySelector('#dark-mode-toggle')?.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });

    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-theme');
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
    console.log('داده‌ها:', greenhouseData);
    console.log('کاربران:', JSON.parse(localStorage.getItem('users')) || {});
  } catch (error) {
    console.error('خطا در بارگذاری اولیه:', error);
  }
});