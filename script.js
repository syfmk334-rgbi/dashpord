// نقطة نهاية الخادم الخلفي (Backend API URL).
const API_URL = 'https://chatzeusb.vercel.app'; 

// ⚠️⚠️⚠️ تنبيه: هذه الطريقة غير آمنة ويجب استخدامها لأغراض التطوير المحلي فقط.
// عند النشر على الإنترنت، يجب استخدام نظام تسجيل دخول آمن.
const DASHBOARD_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDMyNWYxMDBlNDQzMjQ1ZmUwOWU4ZCIsImdvb2dsZUlkIjoiMTA1OTIzOTczMjEwNTE4ODM5NjU5IiwibmFtZSI6Iti52KjZiCDYr9mKJyIsImVtYWlsIjoiZmxhZi5hYm9vZGVnZ2dAZ21haWwuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0ozUXFSYS1ZM0E1dFBDWGg0ZFhmZVpmNmdIUlJ0dW1qT0oxZ2pvTEhjMDR0VFFqUT1zOTYtYyIsImlhdCI6MTc1ODcyNzEyOSwiZXhwIjoxNzU5MzMxOTI5fQ.VnYebbJWY2ukAa9fpcFMLdEcdQsZd4TFks7i7s6MNWU'; // استبدل هذا بتوكن سري من اختيارك

// ------------------ استبدال دالة fetchDashboardData هنا ------------------
async function fetchDashboardData() {
    try {
        console.log('[dashboard] طلب بيانات من:', `${API_URL}/api/dashboard/stats`);
        console.log('[dashboard] التوكن المستخدم:', DASHBOARD_TOKEN.substring(0, 20) + '...');
        
        const response = await fetch(`${API_URL}/api/dashboard/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${DASHBOARD_TOKEN}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('[dashboard] استلمت حالة الاستجابة:', response.status, response.statusText);

        if (!response.ok) {
            let errorBody = '';
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorBody = JSON.stringify(errorData);
                } else {
                    errorBody = await response.text();
                }
            } catch (e) {
                errorBody = 'Failed to read error response';
            }
            console.error('[dashboard] طلب فشل. status=', response.status, 'body=', errorBody);
            throw new Error(`HTTP ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        console.log('[dashboard] بيانات الواجهة المستلمة:', data);

        // التحقق من صحة البيانات
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid JSON response from API');
        }

        // تأمين الخصائص الأساسية
        data.totalUsers = data.totalUsers || 0;
        data.totalChats = data.totalChats || 0;
        data.totalMessages = data.totalMessages || 0;
        data.totalUploads = data.totalUploads || 0;

        // تأمين خصائص الرسوم البيانية
        if (!data.usersByDate || !Array.isArray(data.usersByDate.labels) || !Array.isArray(data.usersByDate.data)) {
            data.usersByDate = { labels: [], data: [] };
        }
        if (!data.chatsByProvider || !Array.isArray(data.chatsByProvider.labels) || !Array.isArray(data.chatsByProvider.data)) {
            data.chatsByProvider = { labels: [], data: [] };
        }

        updateUI(data);
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // عرض رسالة خطأ مرئية للمستخدم
        document.getElementById('totalUsers').innerText = 'خطأ';
        document.getElementById('totalChats').innerText = 'خطأ';
        document.getElementById('totalMessages').innerText = 'خطأ';
        document.getElementById('totalUploads').innerText = 'خطأ';
        
        // رسوم بيانية فارغة
        renderChart('usersChart', 'bar', [], [], 'عدد المستخدمين الجدد', 'rgb(45, 156, 255)');
        renderChart('chatsChart', 'doughnut', [], [], 'المحادثات حسب المزود', ['rgb(45, 156, 255)']);
    }
}

// ------------------ نهاية استبدال الدالة ------------------

function updateUI(data) {
    // تحديث بطاقات الأرقام
    document.getElementById('totalUsers').innerText = data.totalUsers || 0;
    document.getElementById('totalChats').innerText = data.totalChats || 0;
    document.getElementById('totalMessages').innerText = data.totalMessages || 0;
    document.getElementById('totalUploads').innerText = data.totalUploads || 0;

    // رسم بياني لعدد المستخدمين الجدد
    renderChart(
        'usersChart',
        'bar',
        data.usersByDate.labels,
        data.usersByDate.data,
        'عدد المستخدمين الجدد',
        'rgb(45, 156, 255)'
    );

    // رسم بياني لعدد المحادثات حسب المزود
    renderChart(
        'chatsChart',
        'doughnut',
        data.chatsByProvider.labels,
        data.chatsByProvider.data,
        'المحادثات حسب المزود',
        ['rgb(45, 156, 255)', 'rgb(255, 159, 64)', 'rgb(75, 192, 192)']
    );
}

function renderChart(elementId, type, labels, data, chartLabel, backgroundColor) {
    const ctx = document.getElementById(elementId).getContext('2d');
    // تدمير الرسم السابق إن وُجد (لمنع تراكُم الرسوم عند إعادة التحميل)
    if (ctx._chartInstance) {
        try { ctx._chartInstance.destroy(); } catch (e) {}
    }
    const chart = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(230, 240, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(230, 240, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(230, 240, 255, 0.9)'
                    }
                }
            }
        }
    });
    // تخزين مرجع الرسم على السياق لتدميره لاحقًا
    ctx._chartInstance = chart;
}

document.addEventListener('DOMContentLoaded', fetchDashboardData);
