// --- 設定區 ---
const csvFileName = 'data.csv'; // 確保 GitHub 上的檔名與此一致
let allData = [];               // 儲存原始所有資料
let myRadarChart = null;        // 儲存圖表實體

// --- 程式進入點 ---
window.onload = function() {
    fetchCSV();
    
    // 綁定搜尋框事件：每當輸入文字時執行過濾
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        renderNameList(searchTerm);
    });
};

// --- 讀取 CSV 資料 ---
async function fetchCSV() {
    try {
        const cacheBuster = `?v=${new Date().getTime()}`;
        const response = await fetch(csvFileName + cacheBuster);
        
        if (!response.ok) throw new Error('找不到檔案，請確認檔名大小寫與路徑');

        const csvText = await response.text();
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                allData = results.data;
                document.getElementById('status').innerText = `共 ${allData.length} 位角色`;
                renderNameList(); // 初次渲染完整名單
            }
        });
    } catch (error) {
        document.getElementById('status').innerText = '讀取失敗: ' + error.message;
    }
}

// --- 渲染左側名單 ---
function renderNameList(filter = "") {
    const list = document.getElementById('nameList');
    list.innerHTML = '';

    // 根據搜尋字串進行過濾
    const filteredData = allData.filter(char => {
        const name = (char['名字'] || "").toLowerCase();
        return name.includes(filter);
    });

    filteredData.forEach((char, index) => {
        const item = document.createElement('div');
        item.className = 'name-item';
        item.innerText = char['名字'] || `角色 ${index + 1}`;
        item.onclick = () => updateDisplay(char, item);
        list.appendChild(item);
    });
}

// --- 更新右側詳細顯示 ---
function updateDisplay(char, element) {
    // 切換 Active 樣式
    document.querySelectorAll('.name-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('detailCard').style.display = 'block';

    // 更新基本資訊
    document.getElementById('displayName').innerText = char['名字'];
    const iconPath = char['ICON'] || 'https://via.placeholder.com/180';
    document.getElementById('displayIcon').src = iconPath;
    document.getElementById('displayIcon').onclick = () => openLightbox(iconPath);

    // 更新表格資訊
    const table = document.getElementById('attrTable');
    table.innerHTML = '';
    const filterKeys = ['名字', 'ICON', '全身圖', '半身圖', '背景'];
    
    for (let key in char) {
        if (!filterKeys.includes(key) && char[key]) {
            let value = char[key];
            // 若欄位包含圖片字眼，轉為按鈕
            if (key.includes('全身') || key.includes('背景') || key.includes('圖')) {
                value = `<button onclick="openLightbox('${char[key]}')">查看圖片</button>`;
            }
            table.innerHTML += `<tr><td class="attr-label">${key}</td><td>${value}</td></tr>`;
        }
    }

    updateRadarChart(char);
}

// --- 更新雷達圖 ---
function updateRadarChart(char) {
    const labels = ['STR', 'CON', 'POW', 'DEX', 'APP', 'SIZ', 'INT'];
    const values = labels.map(l => parseInt(char[l]) || 0);

    if (myRadarChart) myRadarChart.destroy();

    const ctx = document.getElementById('radarChart').getContext('2d');
    myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '屬性數值',
                data: values,
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(52, 152, 219, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    suggestedMin: 0,
                    suggestedMax: 20, // TRPG 數值上限視系統而定，若 CoC 請改為 100
                    ticks: { display: false }
                }
            }
        }
    });
}

// --- 燈箱放大功能 ---
function openLightbox(src) {
    if (!src) return;
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    lbImg.src = src;
    lb.style.display = 'flex';
}