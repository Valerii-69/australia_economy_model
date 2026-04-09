"""
Математическая модель экономики Австралии при блокаде проливов
Основана на уравнениях из предыдущего объяснения
"""

import numpy as np
from typing import Dict, Tuple

class AustraliaEconomyModel:
    def __init__(self):
        # Базовые параметры (данные 2024-2025)
        self.base_GDP = 1.7  # трлн AUD
        self.base_inflation = 0.025  # 2.5%
        self.base_aud = 0.65  # AUD/USD
        self.base_oil_price = 85  # USD/баррель
        self.oil_import_daily = 0.5  # млн баррелей/день
        
        # Коэффициенты чувствительности
        self.alpha = 0.5  # чувствительность ВВП к торговле
        self.beta = 0.12  # чувствительность ВВП к цене нефти
        self.gamma = 0.2  # доля нефти в себестоимости
        self.delta = 0.15  # доля фрахта в цене
        self.epsilon = 0.1  # чувствительность курса к риску
        
        # Данные о проливах
        self.straits_data = {
            'malacca': {
                'name': 'Малаккский пролив',
                'trade_impact_per_day': -0.005,  # -0.5% в день
                'oil_impact': 2.0,  # +200% к цене
                'risk_premium': 0.05  # +5% к риск-премии
            },
            'ormuz': {
                'name': 'Ормузский пролив',
                'trade_impact_per_day': -0.002,
                'oil_impact': 3.0,
                'risk_premium': 0.08
            },
            'both': {
                'name': 'Оба пролива',
                'trade_impact_per_day': -0.007,
                'oil_impact': 4.5,
                'risk_premium': 0.12
            }
        }
    
    def calculate_impact(self, strait: str, days: int, panic_factor: float = 1.0) -> Dict:
        """
        Расчет экономического воздействия блокады
        
        Args:
            strait: 'malacca', 'ormuz', 'both'
            days: длительность блокады в днях
            panic_factor: фактор паники (1.0 = нормально, 2.0 = паника)
        
        Returns:
            Dict с результатами расчета
        """
        data = self.straits_data[strait]
        
        # Торговый шок (нелинейный, с насыщением)
        trade_shock = data['trade_impact_per_day'] * min(days, 90)
        trade_shock = trade_shock * (1 + 0.5 * np.log1p(days / 30))  # логарифмическое усиление
        
        # Нефтяной шок
        oil_price_shock = data['oil_impact'] * (1 - np.exp(-days / 60))
        oil_price = self.base_oil_price * (1 + oil_price_shock)
        
        # Риск-премия
        risk_premium = data['risk_premium'] * min(days / 30, 2.0)
        
        # Падение ВВП (с учетом паники)
        gdp_loss_pct = abs(trade_shock * 100) * self.alpha
        gdp_loss_pct += oil_price_shock * 100 * self.beta * 0.3  # 0.3 - доля нефти в импорте
        gdp_loss_pct = gdp_loss_pct * panic_factor
        gdp_new = self.base_GDP * (1 - gdp_loss_pct / 100)
        
        # Инфляция (с нелинейным ускорением)
        inflation_contribution = self.gamma * oil_price_shock * 0.07
        shipping_impact = self.delta * abs(trade_shock) * 0.3
        inflation_new = self.base_inflation + inflation_contribution + shipping_impact
        inflation_new = inflation_new * (1 + 0.5 * panic_factor)  # паника усиливает инфляцию
        
        # Курс AUD (падает с ростом риска)
        aud_new = self.base_aud * (1 - self.epsilon * risk_premium * panic_factor)
        
        # Дополнительные показатели
        import_collapse = abs(trade_shock) * 100 * (1 + 0.3 * panic_factor)
        fuel_shortage_days = max(0, 30 - days * 0.5)  # запасы топлива тают
        
        return {
            'gdp': round(gdp_new, 3),
            'gdp_loss': round(gdp_loss_pct, 1),
            'inflation': round(inflation_new * 100, 1),
            'aud_usd': round(aud_new, 3),
            'oil_price': round(oil_price, 1),
            'import_collapse': round(import_collapse, 1),
            'fuel_shortage_days': round(fuel_shortage_days, 1),
            'panic_factor': panic_factor,
            'strait_name': data['name'],
            'days': days
        }
    
    def generate_time_series(self, strait: str, max_days: int = 90) -> Dict:
        """Генерация временных рядов для графика"""
        days_list = list(range(1, max_days + 1, 5))
        gdp_series = []
        inflation_series = []
        
        for day in days_list:
            result = self.calculate_impact(strait, day, panic_factor=1.0)
            gdp_series.append(result['gdp'])
            inflation_series.append(result['inflation'])
        
        return {
            'days': days_list,
            'gdp': gdp_series,
            'inflation': inflation_series
        }


# Класс для обучения работе с моделью
class ModelTrainer:
    """Методика обучения работе с трендовой моделью"""
    
    @staticmethod
    def get_learning_path() -> Dict:
        """Пошаговая методика обучения"""
        return {
            'step1': {
                'title': '🔍 Понимание входных параметров',
                'content': 'Изучите, как длительность блокады (days) и фактор паники (panic_factor) влияют на модель. '
                          'Попробуйте изменить дни от 1 до 90 и наблюдать за графиками.',
                'exercise': 'Запустите модель с 30 днями блокады Малакки при нормальном поведении (panic=1.0)'
            },
            'step2': {
                'title': '📊 Анализ чувствительности',
                'content': 'Сравните три типа проливов: Малакка (основной), Ормуз (нефтяной), Оба (катастрофа). '
                          'Обратите внимание на разные коэффициенты trade_impact и oil_impact.',
                'exercise': 'Посчитайте разницу в падении ВВП между Малаккой и Ормузом при 45 днях блокады'
            },
            'step3': {
                'title': '😱 Фактор человеческой паники',
                'content': 'Измените panic_factor от 1.0 до 2.0. Паника усиливает все эффекты: скупка товаров, '
                          'бегство капитала, рост цен.',
                'exercise': 'При 30 днях блокады найдите, при каком panic_factor падение ВВП превысит 20%'
            },
            'step4': {
                'title': '🔄 Временная динамика',
                'content': 'Изучите графики зависимости ВВП и инфляции от времени. Обратите внимание на '
                          'нелинейность: первые дни дают резкий спад, затем эффект замедляется.',
                'exercise': 'Определите, через сколько дней блокады Малакки инфляция превысит 10%'
            },
            'step5': {
                'title': '💡 Применение на практике',
                'content': 'Используйте модель для сценарного анализа: "Что будет, если..." '
                          'Подготовьте рекомендации для бизнеса и домохозяйств.',
                'exercise': 'Смоделируйте блокаду на 60 дней и составьте список из 3 критических товаров'
            }
        }