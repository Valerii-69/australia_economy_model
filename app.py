from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from model.economy_model import AustraliaEconomyModel, ModelTrainer
import json

app = Flask(__name__)
CORS(app)  # Разрешаем кросс-доменные запросы

# Инициализация модели
model = AustraliaEconomyModel()
trainer = ModelTrainer()

@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/api/calculate', methods=['POST'])
def calculate():
    """API для расчета экономического воздействия"""
    data = request.json
    strait = data.get('strait', 'malacca')
    days = int(data.get('days', 30))
    panic_factor = float(data.get('panic_factor', 1.0))
    
    result = model.calculate_impact(strait, days, panic_factor)
    return jsonify(result)

@app.route('/api/timeseries', methods=['POST'])
def timeseries():
    """API для получения временных рядов"""
    data = request.json
    strait = data.get('strait', 'malacca')
    max_days = int(data.get('max_days', 90))
    
    series = model.generate_time_series(strait, max_days)
    return jsonify(series)

@app.route('/api/learning')
def learning():
    """API для получения методики обучения"""
    return jsonify(trainer.get_learning_path())

@app.route('/api/compare')
def compare():
    """Сравнение всех трех сценариев"""
    results = {}
    for strait in ['malacca', 'ormuz', 'both']:
        results[strait] = model.calculate_impact(strait, 30, 1.0)
    return jsonify(results)

if __name__ == '__main__':
    print("=" * 60)
    print("🌏 Модель экономики Австралии запущена")
    print("📍 Доступно по адресу: http://localhost:5000")
    print("📚 Для обучения используйте вкладку 'Методика'")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)