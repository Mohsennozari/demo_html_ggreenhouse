// Utility functions
const showSpinner = () => document.getElementById('loading-spinner').classList.remove('hidden');
const hideSpinner = () => document.getElementById('loading-spinner').classList.add('hidden');
const showAlert = (message) => {
  const alert = document.getElementById('critical-alert');
  alert.textContent = message;
  alert.classList.add('show');
  setTimeout(() => alert.classList.remove('show'), 5000);
};

// Initialize Materialize components
document.addEventListener('DOMContentLoaded', function() {
  M.FormSelect.init(document.querySelectorAll('select'));
  M.ScrollSpy.init(document.querySelectorAll('.scrollspy'));
  M.Datepicker.init(document.querySelectorAll('.datepicker'), {
    format: 'yyyy-mm-dd',
    i18n: { months: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'] }
  });
  initializeCollapsibles();
});

// Collapsible sections for mobile
function initializeCollapsibles() {
  document.querySelectorAll('.collapsible').forEach(card => {
    const header = document.createElement('div');
    header.className = 'collapsible-header';
    header.textContent = card.querySelector('h4').textContent;
    const body = card.querySelector('.card-content');
    body.className = 'collapsible-body';
    card.insertBefore(header, body);
    header.addEventListener('click', () => {
      card.classList.toggle('active');
    });
  });
}

// Load data from localStorage
let greenhouseData = JSON.parse(localStorage.getItem('greenhouseData')) || [
  { id: 1, soilPh: 6.5, temperature: 25, humidity: 60, irrigationStatus: 'متوسط', cropType: 'گوجه‌فرنگی', timestamp: '2025-06-04T07:00:00' },
  { id: 2, soilPh: 5.5, temperature: 18, humidity: 90, irrigationStatus: 'زیاد', cropType: 'گوجه‌فرنگی', timestamp: '2025-06-05T08:00:00' }
];
let manualRecommendations = JSON.parse(localStorage.getItem('manualRecommendations')) || [];
let nextId = Math.max(...greenhouseData.map(d => d.id), 0) + 1;

// Crop ranges for analysis
const cropRanges = {
  'گوجه‌فرنگی': { ph: [6.0, 6.8], temp: [18, 30], humidity: [60, 80], irrigation: ['متوسط', 'زیاد'] },
  'خیار': { ph: [5.5, 6.5], temp: [20, 30], humidity: [70, 90], irrigation: ['متوسط', 'زیاد'] },
  'فلفل': { ph: [6.0, 7.0], temp: [21, 29], humidity: [65, 85], irrigation: ['متوسط'] },
  'کاهو': { ph: [6.0, 7.0], temp: [15, 25], humidity: [50, 70], irrigation: ['کم', 'متوسط'] }
};

// Form submission
document.getElementById('greenhouse-form').addEventListener('submit', function(e) {
  e.preventDefault();
  showSpinner();
  try {
    const soilPh = parseFloat(document.getElementById('soil-ph').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const humidity = parseFloat(document.getElementById('humidity').value);
    const irrigationStatus = document.getElementById('irrigation-status').value;
    const cropType = document.getElementById('crop-type').value;
    const timestamp = document.getElementById('timestamp').value;

    // Validation
    if (soilPh < 0 || soilPh > 14 || temperature < -10 || temperature > 50 || humidity < 0 || humidity > 100 || !irrigationStatus || !cropType || !timestamp) {
      alert('لطفاً مقادیر معتبر وارد کنید!');
      hideSpinner();
      return;
    }

    // Add data
    const newData = { id: nextId++, soilPh, temperature, humidity, irrigationStatus, cropType, timestamp: new Date(timestamp).toISOString() };
    greenhouseData.push(newData);
    localStorage.setItem('greenhouseData', JSON.stringify(greenhouseData));

    // Reset form
    this.reset();
    M.FormSelect.init(document.querySelectorAll('select'));
    M.Datepicker.init(document.querySelectorAll('.datepicker'));

    // Show success message
    const successMessage = document.getElementById('success-message');
    successMessage.classList.add('show');
    setTimeout(() => successMessage.classList.remove('show'), 3000);

    // Update UI
    updateDashboard();
    updateExpertView();
    checkCriticalConditions(newData);
  } catch (error) {
    alert('خطا در ثبت داده: ' + error.message);
  } finally {
    hideSpinner();
  }
});

// Reset form
document.getElementById('reset-form').addEventListener('click', function() {
  document.getElementById('greenhouse-form').reset();
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Datepicker.init(document.querySelectorAll('.datepicker'));
});

// Recommendation form submission
document.getElementById('recommendation-form').addEventListener('submit', function(e) {
  e.preventDefault();
  showSpinner();
  try {
    const text = document.getElementById('recommendation-text').value;
    const cropType = document.getElementById('crop-filter').value !== 'همه' ? document.getElementById('crop-filter').value : 'عمومی';
    manualRecommendations.push({ text, cropType, timestamp: new Date().toISOString() });
    localStorage.setItem('manualRecommendations', JSON.stringify(manualRecommendations));
    this.reset();
    updateManualRecommendations();
  } catch (error) {
    alert('خطا در ثبت توصیه: ' + error.message);
  } finally {
    hideSpinner();
  }
});

// Filter data
document.getElementById('crop-filter').addEventListener('change', updateDashboard);
document.getElementById('recommendation-filter').addEventListener('change', updateManualRecommendations);

// Dark mode toggle
document.getElementById('dark-mode-toggle').addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Export CSV
document.getElementById('export-csv').addEventListener('click', function() {
  showSpinner();
  try {
    const filter = document.getElementById('crop-filter').value;
    const filteredData = filter === 'همه' ? greenhouseData : greenhouseData.filter(d => d.cropType === filter);
    const csv = [
      'pH خاک,دما (°C),رطوبت (%),وضعیت آبیاری,نوع محصول,زمان',
      ...filteredData.map(d => `${d.soilPh},${d.temperature},${d.humidity},${d.irrigationStatus},${d.cropType},${d.timestamp}`)
    ].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'greenhouse_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert('خطا در دانلود CSV: ' + error.message);
  } finally {
    hideSpinner();
  }
});

// Check critical conditions
function checkCriticalConditions(data) {
  if (data.soilPh < 5 || data.soilPh > 8) {
    showAlert('هشدار: pH خاک بحرانی است!');
  }
  if (data.temperature < 0 || data.temperature > 40) {
    showAlert('هشدار: دمای گلخانه بحرانی است!');
  }
  if (data.humidity < 20 || data.humidity > 95) {
    showAlert('هشدار: رطوبت گلخانه بحرانی است!');
  }
}

// Calculate simple linear regression for trend
function calculateTrend(data, key) {
  if (data.length < 2) return 'داده کافی نیست';
  const n = data.length;
  const x = data.map((_, i) => i);
  const y = data.map(d => d[key]);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope > 0 ? 'افزایشی' : slope < 0 ? 'کاهشی' : 'ثابت';
}

// Calculate statistics
function calculateStats(data, key) {
  const values = data.map(d => d[key]);
  if (!values.length) return { avg: 0, min: 0, max: 0, median: 0 };
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
  return { avg: avg.toFixed(1), min, max, median: median.toFixed(1) };
}

// Update dashboard
function updateDashboard() {
  showSpinner();
  try {
    const filter = document.getElementById('crop-filter').value;
    const filteredData = filter === 'همه' ? greenhouseData : greenhouseData.filter(d => d.cropType === filter);

    // Update table
    const tableBody = document.getElementById('data-table');
    tableBody.innerHTML = filteredData.map(d => `
      <tr>
        <td>${d.soilPh}</td>
        <td>${d.temperature}</td>
        <td>${d.humidity}</td>
        <td>${d.irrigationStatus}</td>
        <td>${d.cropType}</td>
        <td>${new Date(d.timestamp).toLocaleString('fa-IR')}</td>
      </tr>
    `).join('');

    // Update summary
    const phStats = calculateStats(filteredData, 'soilPh');
    const tempStats = calculateStats(filteredData, 'temperature');
    const humidityStats = calculateStats(filteredData, 'humidity');
    const phTrend = calculateTrend(filteredData, 'soilPh');
    const tempTrend = calculateTrend(filteredData, 'temperature');
    const humidityTrend = calculateTrend(filteredData, 'humidity');
    document.getElementById('summary-text').innerHTML = `
      pH خاک: میانگین ${phStats.avg}، حداقل ${phStats.min}، حداکثر ${phStats.max}، میانه ${phStats.median}، روند ${phTrend}<br>
      دما: میانگین ${tempStats.avg}، حداقل ${tempStats.min}، حداکثر ${tempStats.max}، میانه ${tempStats.median}، روند ${tempTrend}<br>
      رطوبت: میانگین ${humidityStats.avg}، حداقل ${humidityStats.min}، حداکثر ${humidityStats.max}، میانه ${humidityStats.median}، روند ${humidityTrend}
    `;

    // Update charts
    updateChart('ph-chart', filteredData, 'soilPh', 'pH خاک', '#4caf50');
    updateChart('temp-chart', filteredData, 'temperature', 'دما (°C)', '#f28c38');
    updateChart('humidity-chart', filteredData, 'humidity', 'رطوبت (%)', '#0288d1');
  } catch (error) {
    alert('خطا در به‌روزرسانی داشبورد: ' + error.message);
  } finally {
    hideSpinner();
  }
}

// Update chart
function updateChart(canvasId, data, key, label, color) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  if (ctx.chart) ctx.chart.destroy();
  ctx.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => new Date(d.timestamp).toLocaleTimeString('fa-IR')),
      datasets: [{
        label,
        data: data.map(d => d[key]),
        borderColor: color,
        fill: false,
        pointRadius: 5,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: {
        tooltip: { enabled: true },
        annotation: {
          annotations: [{
            type: 'line',
            yMin: calculateStats(data, key).avg,
            yMax: calculateStats(data, key).avg,
            borderColor: color,
            borderWidth: 2,
            borderDash: [5, 5],
            label: { content: 'میانگین', enabled: true }
          }]
        }
      }
    }
  });
}

// Calculate severity score
function calculateSeverityScore(data, ranges) {
  let score = 0;
  const phDev = Math.max(0, ranges.ph[0] - data.soilPh, data.soilPh - ranges.ph[1]) / 14 * 100;
  const tempDev = Math.max(0, ranges.temp[0] - data.temperature, data.temperature - ranges.temp[1]) / 60 * 100;
  const humidityDev = Math.max(0, ranges.humidity[0] - data.humidity, data.humidity - ranges.humidity[1]) / 100 * 100;
  const irrigationOk = ranges.irrigation.includes(data.irrigationStatus) ? 0 : 20;
  score = Math.min(100, phDev + tempDev + humidityDev + irrigationOk);
  return Math.round(score);
}

// Update expert view
function updateExpertView() {
  showSpinner();
  try {
    const tableBody = document.getElementById('expert-table');
    tableBody.innerHTML = greenhouseData.map(d => {
      const ranges = cropRanges[d.cropType];
      const phStatus = d.soilPh >= ranges.ph[0] && d.soilPh <= ranges.ph[1] ? 'status-green' : 'status-red';
      const tempStatus = d.temperature >= ranges.temp[0] && d.temperature <= ranges.temp[1] ? 'status-green' : 'status-red';
      const humidityStatus = d.humidity >= ranges.humidity[0] && d.humidity <= ranges.humidity[1] ? 'status-green' : 'status-red';
      const irrigationStatus = ranges.irrigation.includes(d.irrigationStatus) ? 'status-green' : 'status-red';
      const severityScore = calculateSeverityScore(d, ranges);
      const recommendations = [];
      if (d.soilPh < ranges.ph[0]) recommendations.push('اضافه کردن آهک برای کاهش اسیدیته خاک');
      if (d.soilPh > ranges.ph[1]) recommendations.push('اضافه کردن گوگرد برای کاهش قلیاییت خاک');
      if (d.temperature < ranges.temp[0]) recommendations.push('افزایش دمای گلخانه');
      if (d.temperature > ranges.temp[1]) recommendations.push('کاهش دمای گلخانه');
      if (d.humidity < ranges.humidity[0]) recommendations.push('افزایش رطوبت گلخانه');
      if (d.humidity > ranges.humidity[1]) recommendations.push('کاهش رطوبت گلخانه');
      if (!ranges.irrigation.includes(d.irrigationStatus)) recommendations.push('تنظیم آبیاری به سطح مناسب');

      return `
        <tr>
          <td>${d.soilPh}</td>
          <td>${d.temperature}</td>
          <td>${d.humidity}</td>
          <td>${d.irrigationStatus}</td>
          <td>${d.cropType}</td>
          <td>${severityScore}</td>
          <td>
            <span class="${phStatus}">pH: ${d.soilPh >= ranges.ph[0] && d.soilPh <= ranges.ph[1] ? 'مناسب' : 'نامناسب'}</span><br>
            <span class="${tempStatus}">دما: ${d.temperature >= ranges.temp[0] && d.temperature <= ranges.temp[1] ? 'مناسب' : 'نامناسب'}</span><br>
            <span class="${humidityStatus}">رطوبت: ${d.humidity >= ranges.humidity[0] && d.humidity <= ranges.humidity[1] ? 'مناسب' : 'نامناسب'}</span><br>
            <span class="${irrigationStatus}">آبیاری: ${ranges.irrigation.includes(d.irrigationStatus) ? 'مناسب' : 'نامناسب'}</span>
          </td>
          <td>${recommendations.map(r => `<div class="recommendation">${r}</div>`).join('')}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    alert('خطا در به‌روزرسانی تحلیل تخصصی: ' + error.message);
  } finally {
    hideSpinner();
  }
}

// Update manual recommendations
function updateManualRecommendations() {
  showSpinner();
  try {
    const filter = document.getElementById('recommendation-filter').value;
    const filteredRecommendations = filter === 'همه' ? manualRecommendations : manualRecommendations.filter(r => r.cropType === filter || r.cropType === 'عمومی');
    const list = document.getElementById('manual-recommendations');
    list.innerHTML = filteredRecommendations.map((r, index) => `
      <li class="collection-item">
        ${r.text} <br><small>${new Date(r.timestamp).toLocaleString('fa-IR')} (${r.cropType})</small>
        <a href="#" class="secondary-content" onclick="deleteRecommendation(${index})"><i class="fas fa-trash"></i></a>
      </li>
    `).join('');
  } catch (error) {
    alert('خطا در به‌روزرسانی توصیه‌ها: ' + error.message);
  } finally {
    hideSpinner();
  }
}

// Delete recommendation
function deleteRecommendation(index) {
  if (confirm('آیا مطمئن هستید که می‌خواهید این توصیه را حذف کنید؟')) {
    showSpinner();
    try {
      manualRecommendations.splice(index, 1);
      localStorage.setItem('manualRecommendations', JSON.stringify(manualRecommendations));
      updateManualRecommendations();
    } catch (error) {
      alert('خطا در حذف توصیه: ' + error.message);
    } finally {
      hideSpinner();
    }
  }
}

// Initialize
try {
  if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
  updateDashboard();
  updateExpertView();
  updateManualRecommendations();
} catch (error) {
  alert('خطا در مقداردهی اولیه: ' + error.message);
}