def value_and_percent(numerator: float, denominator: float) -> tuple[float, float]:
    return (numerator, numerator / (denominator or 1) * 100)
