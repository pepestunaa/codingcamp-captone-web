import './style.css'
import api from './services/api'

const app = document.querySelector('#app')

let isLogin = localStorage.getItem('isLogin') === 'true'
let currentPage = 'home'

function renderApp() {
  if (!isLogin) {
    renderLogin()
    return
  }

  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <div>
            <h2>Bank Churn Analisis</h2>
            <p>Sistem Prediksi Risiko Churn</p>
          </div>
        </div>

        <nav class="menu">
          <button class="menu-item ${currentPage === 'home' ? 'active' : ''}" data-page="home">Beranda</button>
          <button class="menu-item ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">Dashboard</button>
          <button class="menu-item ${currentPage === 'prediction' ? 'active' : ''}" data-page="prediction">Prediksi Risiko</button>
          <button class="menu-item ${currentPage === 'history' ? 'active' : ''}" data-page="history">Riwayat Prediksi</button>
          <button class="menu-item ${currentPage === 'about' ? 'active' : ''}" data-page="about">Tentang Proyek</button>
        </nav>

        <button class="logout-btn" id="logoutBtn">Keluar</button>
      </aside>

      <main class="main">
        <header class="topbar">
          <div>
            <p class="eyebrow">Customer Churn Risk Prediction</p>
            <h1>${getPageTitle()}</h1>
          </div>

          <div class="user-box">
            <img src="/profile.jpg" alt="Foto Admin CRM" class="profile-photo">
            <div>
              <strong>Admin CRM</strong>
              <p>Manajemen Bank</p>
            </div>
          </div>
        </header>

        <section id="content"></section>
      </main>
    </div>
  `

  document.querySelectorAll('.menu-item').forEach((button) => {
    button.addEventListener('click', () => {
      currentPage = button.dataset.page
      renderApp()
    })
  })

  document.querySelector('#logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('isLogin')
    isLogin = false
    renderApp()
  })

  renderPage()
}

function renderLogin() {
  app.innerHTML = `
    <div class="login-page">
      <div class="login-container">
        <div class="login-title-area">
          <h1>Bank Churn Analisis</h1>
          <p>Sistem Prediksi Risiko Churn Nasabah</p>
        </div>

        <form class="login-card" id="loginForm">
          <h2>Log In</h2>

          <div class="form-group">
            <label>Email</label>
            <input type="email" id="email" value="admin@bankchurn.com" required>
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" id="password" value="admin123" required>
          </div>

          <button type="submit" class="primary-btn">Log In</button>
        </form>
      </div>
    </div>
  `

  document.querySelector('#loginForm').addEventListener('submit', (event) => {
    event.preventDefault()

    const email = document.querySelector('#email').value
    const password = document.querySelector('#password').value

    if (email === 'admin@bankchurn.com' && password === 'admin123') {
      localStorage.setItem('isLogin', 'true')
      isLogin = true
      currentPage = 'home'
      renderApp()
    } else {
      alert('Email atau password salah.')
    }
  })
}

function getPageTitle() {
  if (currentPage === 'home') return 'Ringkasan Utama'
  if (currentPage === 'dashboard') return 'Dashboard Analitik'
  if (currentPage === 'prediction') return 'Prediksi Risiko Churn'
  if (currentPage === 'history') return 'Riwayat Prediksi'
  if (currentPage === 'about') return 'Tentang Proyek'
  return 'Ringkasan Utama'
}

function setupStartPredictionButton() {
  const startPredictionBtn = document.querySelector('#startPredictionBtn')

  if (startPredictionBtn) {
    startPredictionBtn.addEventListener('click', () => {
      currentPage = 'prediction'
      renderApp()
    })
  }
}

function renderHome(container) {
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Mengambil ringkasan prediksi dari backend...</p>
    </div>
  `

  api.get('/predictions')
  .then((response) => {
    const predictions = response.data.data || []

      const totalPredictions = predictions.length
      const highRiskCount = predictions.filter((item) => item.risk_level === 'Risiko Tinggi').length
      const mediumRiskCount = predictions.filter((item) => item.risk_level === 'Risiko Sedang').length
      const lowRiskCount = predictions.filter((item) => item.risk_level === 'Risiko Rendah').length

      const highRiskCustomers = predictions
      .filter((item) => item.risk_level === 'Risiko Tinggi')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 4)

      const highRiskPercent = totalPredictions > 0 ? (highRiskCount / totalPredictions) * 100 : 0
      const mediumRiskPercent = totalPredictions > 0 ? (mediumRiskCount / totalPredictions) * 100 : 0
      const lowRiskPercent = totalPredictions > 0 ? (lowRiskCount / totalPredictions) * 100 : 0

      function getBarHeight(value) {
        if (totalPredictions === 0) return 8

        const percent = (value / totalPredictions) * 100
        return Math.max(percent, 12)
      }

      function renderHighRiskList() {
        if (highRiskCustomers.length === 0) {
          return `
            <div class="empty-action">
              <p>Belum ada nasabah berisiko tinggi dari hasil prediksi sistem.</p>
            </div>
          `
        }

        return highRiskCustomers.map((item) => {
          const input = item.input || {}
          const name = input.customer_name || 'Nama belum tersedia'
          const probability = ((item.probability || 0) * 100).toFixed(2)

          return `
            <div class="action-item high">
              <div>
                <strong>${name}</strong>
                <span>${item.risk_level}</span>
              </div>
              <p>${probability}%</p>
            </div>
          `
        }).join('')
      }


      container.innerHTML = `
        <div class="home-action-row">
          <button type="button" class="start-prediction-btn" id="startPredictionBtn">
            + Mulai Prediksi
          </button>
        </div>

       <div class="kpi-grid">
          ${kpiCard('Total Prediksi Sistem', totalPredictions, 'Jumlah prediksi yang sudah dilakukan melalui web.', '📊', 'blue')}
          ${kpiCard('Risiko Tinggi', highRiskCount, 'Nasabah yang membutuhkan tindak lanjut prioritas.', '⚠️', 'red')}
          ${kpiCard('Risiko Sedang', mediumRiskCount, 'Nasabah yang perlu dipantau oleh tim CRM.', '🟡', 'yellow')}
          ${kpiCard('Risiko Rendah', lowRiskCount, 'Nasabah dengan kemungkinan churn rendah.', '✅', 'green')}
        </div>

        <div class="home-grid">
          <div class="card">
            <div class="card-header">
              <div>
                <h3>Distribusi Hasil Prediksi</h3>
                <p>Ringkasan tingkat risiko berdasarkan data yang sudah diprediksi oleh sistem.</p>
              </div>
            </div>

            <div class="bar-chart risk-bars">
              <div class="high-bar" style="height: ${getBarHeight(highRiskCount)}%"><span>Tinggi</span></div>
              <div class="medium-bar" style="height: ${getBarHeight(mediumRiskCount)}%"><span>Sedang</span></div>
              <div class="low-bar" style="height: ${getBarHeight(lowRiskCount)}%"><span>Rendah</span></div>
            </div>

            <div class="summary-note">
              <p>
                Dari ${totalPredictions} prediksi yang sudah dilakukan, terdapat
                ${highRiskCount} nasabah risiko tinggi, ${mediumRiskCount} nasabah risiko sedang,
                dan ${lowRiskCount} nasabah risiko rendah.
              </p>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h3>Perlu Tindakan</h3>
                <p>Nasabah berisiko tinggi berdasarkan hasil prediksi terbaru.</p>
              </div>
            </div>

            <div class="action-list">
              ${renderHighRiskList()}
            </div>
          </div>
        </div>
      `
      setupStartPredictionButton()
    })
    .catch(() => {
      container.innerHTML = `
        <div class="kpi-grid">
          ${kpiCard('Total Prediksi Sistem', '0', 'Backend belum terhubung.', '📊', 'blue')}
          ${kpiCard('Risiko Tinggi', '0', 'Belum ada data risiko tinggi.', '⚠️', 'red')}
          ${kpiCard('Risiko Sedang', '0', 'Belum ada data risiko sedang.', '🟡', 'yellow')}
          ${kpiCard('Risiko Rendah', '0', 'Belum ada data risiko rendah.', '✅', 'green')}
        </div>

        <div class="card info-card">
          <h3>Backend Belum Terhubung</h3>
          <p>
            Jalankan backend dengan perintah <strong>python app.py</strong>
            agar data prediksi dan riwayat dapat ditampilkan di beranda.
          </p>
        </div>
      `
    })
}

function renderDashboard(container) {
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Mengambil data analitik dari backend...</p>
    </div>
  `

  api.get('/predictions')
  .then((response) => {
    const predictions = response.data.data || []

      const total = predictions.length
      const highRisk = predictions.filter((item) => item.risk_level === 'Risiko Tinggi').length
      const mediumRisk = predictions.filter((item) => item.risk_level === 'Risiko Sedang').length
      const lowRisk = predictions.filter((item) => item.risk_level === 'Risiko Rendah').length

      const getPercent = (value) => {
        if (total === 0) return '0.00'
        return ((value / total) * 100).toFixed(2)
      }

      const inputs = predictions.map((item) => item.input || {})

      const average = (field) => {
        const values = inputs
          .map((input) => Number(input[field]))
          .filter((value) => !Number.isNaN(value))

        if (values.length === 0) return 0

        const totalValue = values.reduce((sum, value) => sum + value, 0)
        return totalValue / values.length
      }

      const avgAge = average('customer_age').toFixed(1)
      const avgInactive = average('months_inactive_12_mon').toFixed(1)
      const avgRelationship = average('total_relationship_count').toFixed(1)
      const avgTransaction = average('total_trans_amt').toFixed(0)
      const avgUtilization = average('avg_utilization_ratio').toFixed(2)
      const avgAmountChange = average('total_amt_chng_q4_q1').toFixed(2)

      function countByField(fieldName) {
        const result = {}

        inputs.forEach((input) => {
          const value = input[fieldName] || 'Tidak tersedia'
          result[value] = (result[value] || 0) + 1
        })

        return Object.entries(result)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
      }

      const incomeDistribution = countByField('income_category')
      const ageDistribution = {
        '< 30': 0,
        '30 - 40': 0,
        '41 - 50': 0,
        '> 50': 0,
      }

      inputs.forEach((input) => {
        const age = Number(input.customer_age)

        if (Number.isNaN(age)) return

        if (age < 30) ageDistribution['< 30'] += 1
        else if (age <= 40) ageDistribution['30 - 40'] += 1
        else if (age <= 50) ageDistribution['41 - 50'] += 1
        else ageDistribution['> 50'] += 1
      })

      function renderMiniBars(dataObject) {
        const entries = Array.isArray(dataObject) ? dataObject : Object.entries(dataObject)
        const maxValue = Math.max(...entries.map((item) => item[1]), 1)

        return entries.map(([label, value]) => {
          const width = Math.max((value / maxValue) * 100, 8)

          return `
            <div class="analytics-bar-item">
              <div class="analytics-bar-label">
                <span>${label}</span>
                <strong>${value}</strong>
              </div>
              <div class="analytics-bar-track">
                <div style="width: ${width}%"></div>
              </div>
            </div>
          `
        }).join('')
      }

      container.innerHTML = `
        <div class="dashboard-grid">
          <div class="card">
            <h3>Distribusi Risiko Prediksi</h3>
            <p class="card-desc">
              Proporsi hasil prediksi nasabah berdasarkan tingkat risiko churn.
            </p>

            <div class="risk-box">
              <div class="donut">
                <div>
                  <strong>${getPercent(highRisk)}%</strong>
                  <span>Risiko Tinggi</span>
                </div>
              </div>

              <div class="legend">
                <p><span class="dot red"></span> Risiko Tinggi <strong>${highRisk} (${getPercent(highRisk)}%)</strong></p>
                <p><span class="dot yellow"></span> Risiko Sedang <strong>${mediumRisk} (${getPercent(mediumRisk)}%)</strong></p>
                <p><span class="dot green"></span> Risiko Rendah <strong>${lowRisk} (${getPercent(lowRisk)}%)</strong></p>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>Ringkasan Prediksi Sistem</h3>
            <p class="card-desc">
              Ringkasan agregat dari seluruh prediksi yang telah dilakukan.
            </p>

            <div class="dashboard-summary-grid">
              <div>
                <span>Total Prediksi</span>
                <strong>${total}</strong>
              </div>
              <div>
                <span>Rata-rata Usia</span>
                <strong>${avgAge}</strong>
              </div>
              <div>
                <span>Rata-rata Bulan Tidak Aktif</span>
                <strong>${avgInactive}</strong>
              </div>
              <div>
                <span>Rata-rata Jumlah Produk</span>
                <strong>${avgRelationship}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <h3>Demografi Risiko</h3>
            <p class="card-desc">
              Ringkasan usia dan kategori pendapatan dari nasabah yang sudah diprediksi.
            </p>

            <div class="analytics-section">
              <h4>Distribusi Usia Nasabah</h4>
              ${renderMiniBars(ageDistribution)}
            </div>

            <div class="analytics-section">
              <h4>Kategori Pendapatan Terbanyak</h4>
              ${
                incomeDistribution.length === 0
                  ? `<p class="empty-text">Belum ada data pendapatan yang tersedia.</p>`
                  : renderMiniBars(incomeDistribution)
              }
            </div>
          </div>

          <div class="card">
            <h3>Analisis Transaksi</h3>
            <p class="card-desc">
              Indikator transaksi yang digunakan sistem untuk membantu membaca potensi churn.
            </p>

            ${factorItem('Bulan Tidak Aktif', `Rata-rata ${avgInactive} bulan tidak aktif.`, Math.min(avgInactive * 25, 100))}
            ${factorItem('Jumlah Produk Bank', `Rata-rata ${avgRelationship} produk bank dimiliki nasabah.`, Math.min(avgRelationship * 20, 100))}
            ${factorItem('Total Nominal Transaksi', `Rata-rata total transaksi ${Number(avgTransaction).toLocaleString('id-ID')}.`, Math.min(avgTransaction / 100, 100))}
            ${factorItem('Rasio Utilisasi', `Rata-rata rasio utilisasi ${avgUtilization}.`, Math.min(avgUtilization * 100, 100))}
          </div>
        </div>
      `
    })
    .catch(() => {
      container.innerHTML = `
        <div class="card info-card">
          <h3>Backend Belum Terhubung</h3>
          <p>
            Jalankan backend dengan perintah <strong>python app.py</strong>
            agar data dashboard dapat ditampilkan dari API.
          </p>
        </div>
      `
    })
}

function renderPage() {
  const content = document.querySelector('#content')

  if (currentPage === 'home') {
  renderHome(content)
  }

  if (currentPage === 'dashboard') {
  renderDashboard(content)
  }

  if (currentPage === 'prediction') {
    content.innerHTML = `
      <div class="prediction-grid">
        <form class="card prediction-form" id="predictionForm">
          <div class="card-header">
            <div>
              <h3>Input Data Nasabah</h3>
              <p>Masukkan data nasabah untuk memprediksi risiko churn.</p>
            </div>
          </div>

          <h4>Profil Nasabah</h4>
          <div class="form-grid">
            ${inputField('Nama Nasabah', 'customer_name', 'text', '')}
            ${inputField('Usia Nasabah', 'customer_age', 'number', '')}
            ${selectField('Jenis Kelamin', 'gender', ['M', 'F'])}
            ${inputField('Jumlah Tanggungan', 'dependent_count', 'number', '')}
            ${selectField('Pendidikan', 'education_level', ['Graduate', 'High School', 'Uneducated', 'College', 'Post-Graduate', 'Doctorate', 'Unknown'])}
            ${selectField('Status Pernikahan', 'marital_status', ['Married', 'Single', 'Divorced', 'Unknown'])}
            ${selectField('Kategori Pendapatan', 'income_category', ['Kurang dari $40K', '$40K - $60K', '$60K - $80K', '$80K - $120K', '$120K +', 'Unknown'])}
          </div>

          <h4>Informasi Akun</h4>
          <div class="form-grid">
            ${selectField('Kategori Kartu', 'card_category', ['Blue', 'Silver', 'Gold', 'Platinum'])}
            ${inputField('Lama Menjadi Nasabah', 'months_on_book', 'number', '')}
            ${inputField('Jumlah Produk Bank', 'total_relationship_count', 'number', '')}
            ${inputField('Bulan Tidak Aktif', 'months_inactive_12_mon', 'number', '')}
            ${inputField('Jumlah Kontak 12 Bulan', 'contacts_count_12_mon', 'number', '')}
            ${inputField('Limit Kredit', 'credit_limit', 'number', '')}
          </div>

          <h4>Perilaku Transaksi</h4>
          <div class="form-grid">
            ${inputField('Total Saldo Berputar', 'total_revolving_bal', 'number', '')}
            ${inputField('Rata-rata Open to Buy', 'avg_open_to_buy', 'number', '')}
            ${inputField('Perubahan Nominal Transaksi Q4-Q1', 'total_amt_chng_q4_q1', 'number', '', '0.01')}
            ${inputField('Total Nominal Transaksi', 'total_trans_amt', 'number', '')}
            ${inputField('Total Jumlah Transaksi', 'total_trans_ct', 'number', '')}
            ${inputField('Perubahan Jumlah Transaksi Q4-Q1', 'total_ct_chng_q4_q1', 'number', '', '0.01')}
            ${inputField('Rasio Utilisasi Rata-rata', 'avg_utilization_ratio', 'number', '', '0.01')}
          </div>

          <button type="submit" class="primary-btn" id="predictBtn" disabled>
            Prediksi Risiko Churn
          </button>
          </form>

        <div class="result-area">
          <div class="card result-card" id="resultCard">
            <h3>Hasil Prediksi</h3>
            <p class="empty-text">Hasil prediksi akan muncul setelah data dikirim.</p>
          </div>
        </div>
      </div>
    `

    setupPredictionForm()
  }

  if (currentPage === 'history') {
  renderHistory(content)
  }

  if (currentPage === 'about') {
    content.innerHTML = `
      <div class="about-grid">
        <div class="card">
          <h2>Bank Customer Churn Risk Prediction Analysis</h2>
          <p class="about-text">
            Proyek ini bertujuan membangun sistem prediksi risiko churn nasabah bank
            berbasis Deep Learning. Sistem membantu pihak bank mengidentifikasi nasabah
            yang memiliki kemungkinan berhenti menggunakan layanan, sehingga strategi
            retensi dapat dilakukan secara lebih cepat dan tepat sasaran.
          </p>

          <div class="point-list">
            <div>
              <strong>Halaman Utama</strong>
              <p>
                Menampilkan total prediksi sistem, jumlah nasabah risiko tinggi,
                risiko sedang, risiko rendah, serta daftar nasabah yang perlu ditindaklanjuti.
              </p>
            </div>
            <div>
              <strong>Dashboard Analitik</strong>
                <p>
                  Menyajikan distribusi risiko, demografi nasabah, analisis transaksi,
                  dan referensi dataset untuk mendukung pengambilan keputusan.
                </p>
            </div>
            <div>
              <strong>Prediksi Risiko Churn</strong>
                <p>
                  Memungkinkan pengguna mengisi data nasabah dan memperoleh hasil prediksi
                  risiko churn berdasarkan model Machine Learning.
                </p>
            </div>
            <div>
              <strong>Riwayat Prediksi</strong>
                <p>
                  Menampilkan riwayat hasil prediksi, fitur pencarian nama nasabah,
                  serta opsi membersihkan tampilan tanpa menghapus data dari sistem.
                </p>
            </div>
          </div>
        </div>

        <div class="card">
  <div class="about-image-box">
    <img src="/bank-illustration.png" alt="Ilustrasi layanan perbankan">
  </div>

        <h3>Anggota Capstone Projek</h3>
          <div class="tech-list">
            <div><strong>Muhammad Surya Ibrahim</strong><span>Data Science</span></div>
            <div><strong>Hendri Saputra</strong><span>Data Science</span></div>
            <div><strong>Muhammad Nurulloh</strong><span>Artficial Intelligence</span></div>
            <div><strong>Aditya Danu Marizta</strong><span>Artficial Intelligence</span></div>
            <div><strong>Grace Debora Sitompul</strong><span>Front End and Back End</span></div>
            <div><strong>Najwa Andara Putri</strong><span>Front End and Back End</span></div>
          </div>
        </div>
      </div>
    `
  }
}

function renderHistory(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h3>Riwayat Prediksi</h3>
          <p>Riwayat hasil prediksi yang tersimpan dari backend API.</p>
        </div>
      </div>

      <div class="loading">
        <div class="spinner"></div>
        <p>Mengambil data riwayat dari backend...</p>
      </div>
    </div>
  `

    api.get('/predictions')
      .then((response) => {
      const predictions = response.data.data || []

      let isHistoryCleared = localStorage.getItem('historyViewCleared') === 'true'

      function getLatestTwenty(data) {
        return data.slice(0, 20)
      }

      function renderTable(filteredData, emptyMessage = 'Data riwayat tidak ditemukan.') {
        return `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Nama Nasabah</th>
                  <th>Usia</th>
                  <th>Prediksi</th>
                  <th>Risiko</th>
                  <th>Probabilitas</th>
                  <th>Rekomendasi</th>
                </tr>
              </thead>

              <tbody>
                ${
                  filteredData.length === 0
                    ? `<tr><td colspan="7" class="empty-table">${emptyMessage}</td></tr>`
                    : filteredData.map((item) => {
                        const input = item.input || {}
                        const riskClass = getRiskClass(item.risk_level)

                        const date = item.timestamp
                          ? new Date(item.timestamp).toLocaleString('id-ID')
                          : '-'

                        const recommendation =
                          item.recommendations && item.recommendations.length > 0
                            ? item.recommendations[0]
                            : '-'

                        return `
                          <tr>
                            <td>${date}</td>
                            <td>${input.customer_name || '-'}</td>
                            <td>${input.customer_age || '-'}</td>
                            <td>${item.prediction || '-'}</td>
                            <td><span class="badge ${riskClass}">${item.risk_level || '-'}</span></td>
                            <td>${((item.probability || 0) * 100).toFixed(2)}%</td>
                            <td>${recommendation}</td>
                          </tr>
                        `
                      }).join('')
                }
              </tbody>
            </table>
          </div>
        `
      }

      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h3>Riwayat Prediksi</h3>
              <p>
                Menampilkan 20 riwayat prediksi terbaru. Data tetap tersimpan di backend
                dan masih bisa dicari melalui kolom pencarian.
              </p>
            </div>

            <div class="history-actions">
              <button class="danger-outline-btn" id="clearHistoryView">Bersihkan Tampilan</button>
            </div>
          </div>

          <div class="history-tools">
            <input
              type="text"
              id="searchHistory"
              class="history-search"
              placeholder="Cari nama nasabah..."
            >
          </div>

        <div id="historyTable">
          ${
            isHistoryCleared
              ? renderTable([], 'Tampilan histori sudah dibersihkan. Ketik nama nasabah untuk mencari data yang tersimpan.')
              : renderTable(getLatestTwenty(predictions), 'Belum ada riwayat prediksi.')
          }
        </div>
      `

      document.querySelector('#clearHistoryView').addEventListener('click', () => {
        isHistoryCleared = true
        localStorage.setItem('historyViewCleared', 'true')
        document.querySelector('#searchHistory').value = ''

        document.querySelector('#historyTable').innerHTML = renderTable(
          [],
          'Tampilan histori sudah dibersihkan. Data tidak dihapus dan masih bisa dicari melalui kolom pencarian.'
        )
      })

      document.querySelector('#searchHistory').addEventListener('input', (event) => {
        const keyword = event.target.value.toLowerCase().trim()

        if (keyword === '') {
          if (isHistoryCleared) {
            document.querySelector('#historyTable').innerHTML = renderTable(
              [],
              'Tampilan histori sudah dibersihkan. Ketik nama nasabah untuk mencari data yang tersimpan.'
            )
          } else {
            document.querySelector('#historyTable').innerHTML = renderTable(
              getLatestTwenty(predictions),
              'Belum ada riwayat prediksi.'
            )
          }

          return
        }

        const filteredData = predictions.filter((item) => {
          const input = item.input || {}
          const name = (input.customer_name || '').toLowerCase()
          const prediction = (item.prediction || '').toLowerCase()
          const risk = (item.risk_level || '').toLowerCase()

          return (
            name.includes(keyword) ||
            prediction.includes(keyword) ||
            risk.includes(keyword)
          )
        })

        document.querySelector('#historyTable').innerHTML = renderTable(
          filteredData,
          'Data yang dicari tidak ditemukan.'
        )
      })
    })
    .catch(() => {
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div>
              <h3>Riwayat Prediksi</h3>
              <p>Backend belum terhubung. Pastikan Flask API sedang berjalan.</p>
            </div>
          </div>

          <p class="empty-text">
            Data riwayat belum bisa diambil dari backend. Jalankan backend dengan perintah
            <strong>python app.py</strong>, lalu coba muat ulang halaman ini.
          </p>
        </div>
      `
    })
}

function kpiCard(title, value, desc, icon, color) {
  return `
    <div class="card kpi-card">
      <div class="kpi-head">
        <div>
          <p>${title}</p>
          <h2 class="kpi-value ${color}">${value}</h2>
        </div>
      </div>
      <small>${desc}</small>
    </div>
  `
}

function factorItem(title, desc, value) {
  return `
    <div class="factor-item">
      <strong>${title}</strong>
      <span>${desc}</span>
      <div class="progress">
        <div style="width: ${value}%"></div>
      </div>
    </div>
  `
}

function inputField(label, name, type, value, step = '1') {
  const stepAttribute = type === 'number' ? `step="${step}"` : ''
  const minAttribute = type === 'number' ? 'min="0"' : ''
  const inputMode = type === 'number' ? 'inputmode="decimal"' : ''

  return `
    <div class="form-group">
      <label>${label}</label>
      <input 
        type="${type}" 
        name="${name}" 
        value="${value}" 
        ${stepAttribute} 
        ${minAttribute}
        ${inputMode}
        required
      >
    </div>
  `
}

function selectField(label, name, options) {
  return `
    <div class="form-group">
      <label>${label}</label>
      <select name="${name}" required aria-label="${label}">
        <option value="" selected disabled hidden></option>
        ${options.map((option) => `<option value="${option}">${option}</option>`).join('')}
      </select>
    </div>
  `
}

function setupPredictionForm() {
  const form = document.querySelector('#predictionForm')
  const resultCard = document.querySelector('#resultCard')
  const predictBtn = document.querySelector('#predictBtn')
  const requiredFields = form.querySelectorAll('input[required], select[required]')

  function checkFormCompletion() {
    const allFilled = Array.from(requiredFields).every((field) => {
      return field.value.trim() !== ''
    })

    predictBtn.disabled = !allFilled
  }

  requiredFields.forEach((field) => {
  field.addEventListener('input', () => {
    if (field.type === 'number' && Number(field.value) < 0) {
      field.value = 0
    }

    checkFormCompletion()
  })

  field.addEventListener('change', () => {
    if (field.type === 'number' && Number(field.value) < 0) {
      field.value = 0
    }

    checkFormCompletion()
  })

  field.addEventListener('wheel', (event) => {
    if (field.type === 'number') {
      event.preventDefault()
      field.blur()
    }
  })
})

  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && predictBtn.disabled) {
      event.preventDefault()
    }
  })

  checkFormCompletion()

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    checkFormCompletion()

    if (predictBtn.disabled) {
      alert('Mohon lengkapi seluruh 19 data nasabah sebelum melakukan prediksi.')
      return
    }

    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    resultCard.innerHTML = `
      <h3>Hasil Prediksi</h3>
      <div class="loading">
        <div class="spinner"></div>
        <p>Sedang memproses data nasabah...</p>
      </div>
    `

    try {
      const response = await api.post('/predict', data)
      const result = response.data.result

      localStorage.removeItem('historyViewCleared')

      showResult(result, data)
      saveHistory(result, data)
    } catch (error) {
      const result = createDummyResult(data)

      localStorage.removeItem('historyViewCleared')
    
      showResult(result, data)
      saveHistory(result, data)
    }
  })
}

function createDummyResult(data) {
  let score = 0.2

  if (Number(data.months_inactive_12_mon) >= 3) score += 0.25
  if (Number(data.total_relationship_count) <= 2) score += 0.25
  if (Number(data.total_trans_amt) < 2000) score += 0.15
  if (Number(data.avg_utilization_ratio) < 0.2) score += 0.1

  score = Math.min(score, 0.98)

  let prediction = 'Nasabah Bertahan'
  let riskLevel = 'Risiko Rendah'

  if (score >= 0.7) {
    prediction = 'Berpotensi Churn'
    riskLevel = 'Risiko Tinggi'
  } else if (score >= 0.45) {
    prediction = 'Perlu Dipantau'
    riskLevel = 'Risiko Sedang'
  }

  const recommendations = []

  if (Number(data.months_inactive_12_mon) >= 3) {
    recommendations.push('Berikan loyalty reward agar nasabah kembali aktif bertransaksi.')
  }

  if (Number(data.total_relationship_count) <= 2) {
    recommendations.push('Tawarkan produk tambahan yang relevan melalui strategi cross-selling.')
  }

  if (Number(data.total_trans_amt) < 2000) {
    recommendations.push('Lakukan follow-up personal dari tim CRM.')
  }

  if (Number(data.avg_utilization_ratio) < 0.2) {
    recommendations.push('Berikan edukasi manfaat kartu dan promo transaksi.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Pertahankan komunikasi rutin dan monitoring aktivitas nasabah.')
  }

  return {
    prediction,
    risk_level: riskLevel,
    probability: score,
    recommendations,
  }
}

function showResult(result, data) {
  const resultCard = document.querySelector('#resultCard')
  const percentage = (result.probability * 100).toFixed(2)
  const className = getRiskClass(result.risk_level)

  resultCard.innerHTML = `
    <h3>Hasil Prediksi</h3>

    <div class="score-box ${className}">
      <div class="score-circle">
        <span>${percentage}%</span>
      </div>

      <div>
        <p>Probabilitas Churn</p>
        <h2>${result.risk_level}</h2>
        <span>${result.prediction}</span>
      </div>
    </div>

    
    <div class="result-detail">
      <div>
        <span>Nama Nasabah</span>
        <strong>${data.customer_name || '-'}</strong>
      </div>
      <div>
        <span>Usia Nasabah</span>
        <strong>${data.customer_age}</strong>
      </div>
      <div>
        <span>Bulan Tidak Aktif</span>
        <strong>${data.months_inactive_12_mon}</strong>
      </div>
      <div>
        <span>Jumlah Produk</span>
        <strong>${data.total_relationship_count}</strong>
      </div>
    </div>

    <div class="recommendation">
      <h4>Rekomendasi Tindakan</h4>
      <ul>
        ${result.recommendations.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `
}

function saveHistory(result, data) {
  const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]')
  const className = getRiskClass(result.risk_level)

  const newItem = {
    date: new Date().toLocaleString('id-ID'),
    name: data.customer_name,
    age: data.customer_age,
    prediction: result.prediction,
    riskLevel: result.risk_level,
    probability: result.probability,
    recommendation: result.recommendations[0],
    className,
  }

  history.unshift(newItem)
  localStorage.setItem('predictionHistory', JSON.stringify(history.slice(0, 10)))
}

function getRiskClass(riskLevel) {
  if (riskLevel === 'Risiko Tinggi' || riskLevel === 'High Risk') return 'danger'
  if (riskLevel === 'Risiko Sedang' || riskLevel === 'Medium Risk') return 'warning'
  return 'success'
}

renderApp()