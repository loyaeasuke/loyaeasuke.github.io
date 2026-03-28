const csvFileName = 'data.csv'; 
let allData = [];
let myRadarChart = null;

window.onload = function() {
    fetchCSV();
};

async function fetchCSV() {
    try {
        const cacheBuster = `?v=${new Date().getTime()}`;
        const response = await fetch(csvFileName + cacheBuster);
        
        if (!response.ok) throw new Error('讀取失敗，請確認 data.csv 是否在同一個資料夾');

        const csvText = await response.text();
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                allData = results.data;
                document.getElementById('status').innerText = `已載入 ${allData.length} 位角色`;
                renderNameList(); 
            }
        });
    } catch (error) {
        document.getElementById('status').innerText = '錯誤: ' + error.message;
    }
}

function renderNameList() {
    const list = document.getElementById('nameList');
    list.innerHTML = '';

    allData.forEach((char, index) => {
        const item = document.createElement('div');
        item.className = 'name-item';
        item.innerText = char['名字'] || `角色 ${index + 1}`;
        item.onclick = () => updateDisplay(char, item);
        list.appendChild(item);
    });
}

function updateDisplay(char, element) {
    document.querySelectorAll('.name-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('detailCard').style.display = 'block';

    document.getElementById('displayName').innerText = char['名字'];
    const iconPath = char['ICON'] || 'https://via.placeholder.com/180';
    document.getElementById('displayIcon').src = iconPath;
    document.getElementById('displayIcon').onclick = () => openLightbox(iconPath);

    const table = document.getElementById('attrTable');
    table.innerHTML = '';
    const filterKeys = ['名字', 'ICON', '全身圖', '半身圖', '背景'];
    
    for (let key in char) {
        if (!filterKeys.includes(key) && char[key]) {
            let value = char[key];
            if (key.includes('圖') || key.includes('背景')) {
                value = `<button onclick="openLightbox('${char[key]}')">查看圖片</button>`;
            }
            table.innerHTML += `<tr><td class="attr-label">${key}</td><td>${value}</td></tr>`;
        }
    }
    updateRadarChart(char);
}

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
                label: '能力數值',
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
                    suggestedMax: 20,
                    ticks: { display: false }
                }
            }
        }
    });
}

function openLightbox(src) {
    if (!src) return;
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    lbImg.src = src;
    lb.style.display = 'flex';
}