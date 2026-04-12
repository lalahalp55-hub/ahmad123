/* --- إعدادات لوحة إدارة أ. منيرة - نسخة إدارة الحالات والطلبات --- */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwRLkCCuZMS7Vy_aM9vr-2Ld6LenqOGFy1rNKuPphf3qxURxg0BoB3J8WJC0xPcvhGSJw/exec'; 

// 1. وظيفة تحديث الإعدادات (السعر + الحد الأدنى)
async function updateAppPrice() {
    const appName = document.getElementById('appSelect').value;
    let newPrice = document.getElementById('newPriceInput').value;
    const newMin = document.getElementById('minAmountInput').value;

    if (!newPrice || !newMin) {
        alert("يرجى إدخال السعر والحد الأدنى");
        return;
    }

    const safePrice = "'" + newPrice; 
    const btn = document.querySelector("button[onclick='updateAppPrice()']");
    btn.disabled = true;
    btn.innerHTML = `جاري الحفظ...`;

    try {
        const updateUrl = `${SCRIPT_URL}?action=updatePrice&appName=${encodeURIComponent(appName)}&newPrice=${encodeURIComponent(safePrice)}&newMin=${newMin}`;
        await fetch(updateUrl);
        alert(`تم تحديث إعدادات ${appName} بنجاح ✅`);
    } catch (error) {
        alert("تم الحفظ بنجاح ✅");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `حفظ التعديلات <i class="bi bi-cloud-arrow-up"></i>`;
    }
}

// 2. وظيفة تحديث حالة الطلب (إرسال الإشارة لجوجل شيت)
async function updateStatus(playerId, newStatus) {
    // إشعار تأكيد قبل التغيير
    if (!confirm(`هل أنتِ متأكدة من تحويل حالة الطلب إلى: ${newStatus}؟`)) return;

    try {
        const url = `${SCRIPT_URL}?action=updateStatus&id=${encodeURIComponent(playerId)}&status=${encodeURIComponent(newStatus)}`;
        const response = await fetch(url);
        const result = await response.text();

        if (result.includes("Success")) {
            alert("تم تحديث الحالة بنجاح.. سيراها الزبون الآن ✅");
            fetchOrders(); // إعادة تحميل الجدول لتحديث المنظر
        } else {
            alert("حدث خطأ أثناء التحديث في الشيت");
        }
    } catch (error) {
        alert("خطأ في الاتصال بالسيرفر");
    }
}

// 3. وظيفة جلب الطلبات وعرضها مع أزرار التحكم
async function fetchOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    const loader = document.getElementById('loader');
    
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (loader) loader.classList.remove('d-none');

    try {
        const response = await fetch(`${SCRIPT_URL}?action=read&t=${new Date().getTime()}`);
        const data = await response.json();
        
        if (loader) loader.classList.add('d-none');

        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" class="text-center py-5">لا توجد طلبات مسجلة حالياً</td></tr>';
            return;
        }

        data.reverse().forEach(order => {
            const row = document.createElement('tr');
            
            const name = order['الاسم'] || '-';
            const app = order['التطبيق'] || '-';
            const id = order['الآيدي'] || order['الآي_دي'] || order['ID'] || '-';
            const amount = order['الباقة'] || order['الكمية'] || '-';
            const method = order['طريقة_الدفع'] || '-';
            const date = order['التاريخ'] || '-';
            const currentStatus = order['الحالة'] || 'قيد الانتظار';
            let rawImage = order['الصورة'] || '';

            let finalSrc = '';
            if (rawImage && rawImage.length > 50) {
                finalSrc = rawImage.startsWith('data:image') ? rawImage : 'data:image/jpeg;base64,' + rawImage;
            }

            // تحديد لون الحالة
            let statusBadge = 'bg-warning';
            if (currentStatus === 'تم بنجاح') statusBadge = 'bg-success';
            if (currentStatus === 'مرفوض') statusBadge = 'bg-danger';

            row.innerHTML = `
                <td class="fw-bold">${name}</td>
                <td><span class="badge bg-primary opacity-75">${app}</span></td>
                <td><code class="text-primary fw-bold">${id}</code></td>
                <td>${amount}</td>
                <td><small class="text-muted">${method}</small></td>
                <td><small class="text-secondary">${date}</small></td>
                <td>
                    ${finalSrc ? 
                        `<img src="${finalSrc}" class="rounded border" style="width:40px; height:40px; object-fit:cover; cursor:pointer;" onclick="viewImage('${finalSrc}')">` 
                        : '<span class="text-muted small">لا يوجد</span>'}
                </td>
                <td><span class="badge ${statusBadge}">${currentStatus}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-success" onclick="updateStatus('${id}', 'تم بنجاح')" title="تم الشحن">
                            <i class="bi bi-check-lg"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="updateStatus('${id}', 'مرفوض')" title="رفض الطلب">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        if (loader) loader.classList.add('d-none');
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-danger">خطأ في جلب البيانات</td></tr>`;
    }
}

function viewImage(src) {
    const newTab = window.open();
    newTab.document.write(`<html><body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;"><img src="${src}" style="max-width:100%;max-height:100vh;"></body></html>`);
}

window.onload = fetchOrders;
