  function handleLogout() {
      location.reload();
    }

    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
      document.getElementById('applyDateBtn').addEventListener('click', () => {
        startDate = document.getElementById('startDate').value;
        endDate = document.getElementById('endDate').value;
        currentPage = 1;
        refreshDashboard();
      });

      document.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => setDateRange(btn.dataset.preset));
      });

      document.getElementById('refreshBtn').addEventListener('click', () => {
        currentPage = 1;
        refreshDashboard();
      });

      document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);

      document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        currentPage = 1;
        applyFilters();
      });

      document.getElementById('eventFilter').addEventListener('change', (e) => {
        currentEventFilter = e.target.value;
        currentPage = 1;
        applyFilters();
      });

      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          document.getElementById('searchInput').focus();
        }
      });
    }

    // ========== LOGIN ==========
    async function login(password) {
      if (password === DASHBOARD_PASSWORD) {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        initSupabase();
        
        const today = luxon.DateTime.now();
        document.getElementById('startDate').value = today.minus({ days: 7 }).toISODate();
        document.getElementById('endDate').value = today.toISODate();
        startDate = document.getElementById('startDate').value;
        endDate = document.getElementById('endDate').value;
        
        await refreshDashboard();
        setupEventListeners();
      } else {
        alert('Wrong password. Please try again.');
        document.getElementById('dashboardPassword').value = '';
        document.getElementById('dashboardPassword').focus();
      }
    }

    document.getElementById('loginBtn').addEventListener('click', () => {
      login(document.getElementById('dashboardPassword').value);
    });

    document.getElementById('dashboardPassword').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') login(e.target.value);
    });

    document.getElementById('dashboardPassword').focus();
