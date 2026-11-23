const path = require('path');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const VALID_UNITS = new Set(['m', 'cm']);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function parseStrictNumber(raw) {
    if (raw === null || raw === undefined || typeof raw === 'boolean') {
        return NaN;
    }
    if (typeof raw === 'string' && raw.trim() === '') {
        return NaN;
    }
    return Number(raw);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function calculateBmi(weightKg, rawHeight, rawUnit = 'm') {
    const unitInput = rawUnit === undefined || rawUnit === null || rawUnit === ''
        ? 'm'
        : String(rawUnit).trim().toLowerCase();

    if (!VALID_UNITS.has(unitInput)) {
        return { error: "Unit must be 'm' or 'cm'." };
    }

    const weight = parseStrictNumber(weightKg);
    const heightInput = parseStrictNumber(rawHeight);

    if (!Number.isFinite(weight) || !Number.isFinite(heightInput) || weight <= 0 || heightInput <= 0) {
        return { error: 'Please enter valid positive numbers for weight and height.' };
    }

    if (weight < 1 || weight > 500) {
        return { error: 'Weight must be realistic (1 kg – 500 kg).' };
    }

    const heightMeters = unitInput === 'cm' ? heightInput / 100 : heightInput;
    if (heightMeters < 0.4 || heightMeters > 3.0) {
        return { error: 'Height must be realistic (0.4 m – 3.0 m or 40 cm – 300 cm).' };
    }

    const rawBmi = weight / (heightMeters * heightMeters);
    const bmi = Number(rawBmi.toFixed(2));
    let category = 'Obese';
    let colorClass = 'red';
    let tip = 'Consider consulting a healthcare professional for a tailored plan.';

    if (rawBmi < 18.5) {
        category = 'Underweight';
        colorClass = 'blue';
        tip = 'A nutrient-dense diet and strength training can help reach a healthy range.';
    } else if (rawBmi < 25) {
        category = 'Normal weight';
        colorClass = 'green';
        tip = 'Great job! Maintain a balanced diet and regular physical activity.';
    } else if (rawBmi < 30) {
        category = 'Overweight';
        colorClass = 'orange';
        tip = 'Regular cardio and balanced portions can help move toward the normal range.';
    }

    const healthyWeightRangeKg = {
        min: Number((18.5 * heightMeters * heightMeters).toFixed(1)),
        max: Number((24.9 * heightMeters * heightMeters).toFixed(1))
    };

    return {
        bmi,
        category,
        colorClass,
        tip,
        unit: unitInput,
        weightKg: Number(weight.toFixed(2)),
        heightMeters: Number(heightMeters.toFixed(3)),
        healthyWeightRangeKg
    };
}

function getScalePositionPercent(bmi) {
    const minBmi = 12;
    const maxBmi = 40;
    const clamped = Math.min(Math.max(bmi, minBmi), maxBmi);
    return Number((((clamped - minBmi) / (maxBmi - minBmi)) * 100).toFixed(1));
}

function renderPage(title, bodyHtml) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <main class="container">
    ${bodyHtml}
  </main>
</body>
</html>`;
}

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, 'views') });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'bmi-calculator-node' });
});

app.post('/calculate-bmi', (req, res) => {
    const { weight, height, unit } = req.body || {};
    const result = calculateBmi(weight, height, unit);

    if (result.error) {
        return res.status(400).send(renderPage('BMI Calculator — Error', `
            <h1>Invalid Input</h1>
            <div class="result red">${escapeHtml(result.error)}</div>
            <a class="back-link" href="/">← Back to calculator</a>
        `));
    }

    const markerPercent = getScalePositionPercent(result.bmi);

    return res.send(renderPage('BMI Result', `
        <h1>BMI Result</h1>
        <p class="subtitle">${result.weightKg} kg &middot; ${result.heightMeters} m</p>
        <div class="result ${result.colorClass}">
            <p class="bmi-value">${result.bmi}</p>
            <p class="bmi-category">${escapeHtml(result.category)}</p>
            <p class="bmi-tip">${escapeHtml(result.tip)}</p>
        </div>
        <div class="bmi-scale" aria-label="WHO BMI scale">
            <div class="scale-bar">
                <span class="seg blue" style="width: 23.2%"></span>
                <span class="seg green" style="width: 23.2%"></span>
                <span class="seg orange" style="width: 17.9%"></span>
                <span class="seg red" style="width: 35.7%"></span>
                <span class="scale-marker" style="left: ${markerPercent}%"></span>
            </div>
            <div class="scale-labels">
                <span>12</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40+</span>
            </div>
        </div>
        <p class="healthy-range">
            Healthy weight range for ${result.heightMeters} m:
            <strong>${result.healthyWeightRangeKg.min} kg – ${result.healthyWeightRangeKg.max} kg</strong>
        </p>
        <a class="back-link" href="/">← Calculate again</a>
    `));
});

app.post('/api/bmi', (req, res) => {
    const { weight, height, unit } = req.body || {};
    const result = calculateBmi(weight, height, unit);
    if (result.error) {
        return res.status(400).json({ error: result.error });
    }
    return res.json({
        bmi: result.bmi,
        category: result.category,
        tip: result.tip,
        unit: result.unit,
        weightKg: result.weightKg,
        heightMeters: result.heightMeters,
        healthyWeightRangeKg: result.healthyWeightRangeKg
    });
});

app.use((err, req, res, next) => {
    if (err && (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400))) {
        return res.status(400).json({ error: 'Invalid JSON payload.' });
    }
    return next(err);
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`BMI Calculator running at http://localhost:${PORT}`);
    });
}

module.exports = { app, calculateBmi };
