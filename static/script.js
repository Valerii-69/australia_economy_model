// Глобальные переменные
let gdpChart = null;
let inflationChart = null;

// Переключение вкладок
function switchTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убрать активный класс со всех табов
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показать выбранную вкладку
    document.getElementById(tabName).classList.add('active');
    
    // Активировать соответствующий таб
    event.target.classList.add('active');
    
    // Загрузить данные для вкладки
    if (tabName === 'learning') {
        loadLearningContent();
    } else if (tabName === 'compare') {
        loadCompareContent();
    }
}

// Загрузка методики обучения
async function loadLearningContent() {
    try {
        const response = await fetch('/api/learning');
        const learningData = await response.json();
        
        let html = '<h2>📚 Пошаговая методика обучения работе с моделью</h2>';
        html += '<p style="margin-bottom: 20px;">Эта методика поможет вам освоить модель от простого к сложному</p>';
        
        for (let i = 1; i <= 5; i++) {
            const step = learningData[`step${i}`];
            html += `
                <div class="learning-step">
                    <h3>${step.title}</h3>
                    <p>${step.content}</p>
                    <div class="exercise">
                        <strong>✏️ Упражнение:</strong> ${step.exercise}
                    </div>
                </div>
            `;
        }
        
        html += `
            <div class="learning-step">
                <h3>🎯 Финальный тест</h3>
                <p>После выполнения всех упражнений вы сможете:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>Прогнозировать экономические последствия геополитических кризисов</li>
                    <li>Оценивать критическое время для принятия решений</li>
                    <li>Разрабатывать сценарии реагирования для бизнеса</li>
                </ul>
                <div class="exercise">
                    <strong>🏆 Контрольное задание:</strong> Смоделируйте блокаду на 45 дней с фактором паники 1.5 и напишите краткий отчет (3-5 предложений) о том, какие меры нужно предпринять правительству.
                </div>
            </div>
        `;
        
        document.getElementById('learningContent').innerHTML = html;
    } catch (error) {
        console.error('Ошибка загрузки методики:', error);
    }
}

// Загрузка сравнения сценариев
async function loadCompareContent() {
    try {
        const response = await fetch('/api/compare');
        const data = await response.json();
        
        let html = '<h2>📊 Сравнение сценариев (30 дней блокады, нормальное поведение)</h2>';
        html += '<div class="results">';
        
        for (const [key, value] of Object.entries(data)) {
            let straitName = '';
            if (key === 'malacca') straitName = 'Малаккский пролив';
            if (key === 'ormuz') straitName = 'Ормузский пролив';
            if (key === 'both') straitName = 'Оба пролива';
            
            html += `
                <div class="card">
                    <h3>${straitName}</h3>
                    <div>ВВП: <span class="value ${value.gdp_loss > 10 ? 'negative' : ''}">${value.gdp} трлн AUD</span></div>
                    <div>Потеря ВВП: <span class="negative">-${value.gdp_loss}%</span></div>
                    <div>Инфляция: <span class="negative">${value.inflation}%</span></div>
                    <div>Курс AUD: <span class="negative">${value.aud_usd}</span></div>
                    <div>Цена нефти: $${value.oil_price}</div>
                </div>
            `;
        }
        
        html += '</div>';
        html += `
            <div class="chart-container">
                <h3>💡 Анализ</h3>
                <p>Наиболее опасен сценарий с блокадой обоих проливов - потеря ВВП достигает критических значений, а инфляция ускоряется до двузначных цифр.</p>
                <p>Малаккский пролив больше влияет на торговлю в целом, Ормузский - на цены нефти и производные товары.</p>
            </div>
        `;
        
        document.getElementById('compareResults').innerHTML = html;
    } catch (error) {
        console.error('Ошибка загрузки сравнения:', error);
    }
}

// Запуск симуляции
async function runSimulation() {
    const strait = document.getElementById('strait').value;
    const days = parseInt(document.getElementById('days').value);
    const panic = parseFloat(document.getElementById('panic').value);
    
    // Показать индикатор загрузки
    document.getElementById('results').innerHTML = '<div class="card">⏳ Расчет...</div>';
    
    try {
        // Получить результаты
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strait, days, panic_factor: panic })
        });
        const data = await response.json();
        
        // Отобразить результаты
        displayResults(data);
        
        // Загрузить и отобразить графики
        const timeResponse = await fetch('/api/timeseries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strait, max_days: 90 })
        });
        const timeData = await timeResponse.json();
        
        displayCharts(timeData);
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('results').innerHTML = '<div class="card" style="color: red;">❌ Ошибка при расчете. Убедитесь, что сервер запущен.</div>';
    }
}

// Отображение результатов
function displayResults(data) {
    const html = `
        <div class="card">
            <h3>📊 ВВП</h3>
            <div class="value ${data.gdp_loss > 10 ? 'negative' : ''}">${data.gdp} трлн AUD</div>
            <div class="unit">Потеря: ${data.gdp_loss}% от базового уровня</div>
        </div>
        <div class="card">
            <h3>📈 Инфляция</h3>
            <div class="value ${data.inflation > 10 ? 'negative' : ''}">${data.inflation}%</div>
            <div class="unit">Базовый уровень: 2.5%</div>
        </div>
        <div class="card">
            <h3>💵 Курс AUD/USD</h3>
            <div class="value ${data.aud_usd < 0.6 ? 'negative' : ''}">${data.aud_usd}</div>
            <div class="unit">Базовый уровень: 0.65</div>
        </div>
        <div class="card">
            <h3>🛢️ Цена нефти</h3>
            <div class="value">$${data.oil_price}</div>
            <div class="unit">Базовый уровень: $85</div>
        </div>
        <div class="card">
            <h3>🚢 Коллапс импорта</h3>
            <div class="value ${data.import_collapse > 30 ? 'negative' : ''}">${data.import_collapse}%</div>
            <div class="unit">Снижение объемов</div>
        </div>
        <div class="card">
            <h3>⛽ Запасы топлива</h3>
            <div class="value ${data.fuel_shortage_days < 20 ? 'negative' : ''}">${data.fuel_shortage_days} дней</div>
            <div class="unit">Осталось при норме 30 дней</div>
        </div>
    `;
    
    document.getElementById('results').innerHTML = html;
}

// Отображение графиков
function displayCharts(timeData) {
    // График ВВП
    const gdpTrace = {
        x: timeData.days,
        y: timeData.gdp,
        mode: 'lines+markers',
        name: 'ВВП (трлн AUD)',
        line: { color: '#667eea', width: 3 },
        marker: { size: 6 }
    };
    
    const gdpLayout = {
        title: 'Динамика ВВП при блокаде',
        xaxis: { title: 'Дни блокады' },
        yaxis: { title: 'ВВП (трлн AUD)', range: [0.5, 1.8] },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('gdpChart', [gdpTrace], gdpLayout);
    
    // График инфляции
    const inflationTrace = {
        x: timeData.days,
        y: timeData.inflation,
        mode: 'lines+markers',
        name: 'Инфляция (%)',
        line: { color: '#e74c3c', width: 3 },
        marker: { size: 6 }
    };
    
    const inflationLayout = {
        title: 'Рост инфляции при блокаде',
        xaxis: { title: 'Дни блокады' },
        yaxis: { title: 'Инфляция (%)', range: [0, 30] },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('inflationChart', [inflationTrace], inflationLayout);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Настройка слайдеров
    const daysSlider = document.getElementById('days');
    const daysValue = document.getElementById('daysValue');
    const panicSlider = document.getElementById('panic');
    const panicValue = document.getElementById('panicValue');
    
    daysSlider.addEventListener('input', (e) => {
        daysValue.textContent = e.target.value + ' дней';
    });
    
    panicSlider.addEventListener('input', (e) => {
        panicValue.textContent = e.target.value;
    });
    
    // Запустить симуляцию по умолчанию
    runSimulation();
});