const path = require('path');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function calculateBmi(weightKg, rawHeight, unit = 'm') {
    const weight = Number(weightKg);
    const heightInput = Number(rawHeight);

    if (!Number.isFinite(weight) || !Number.isFinite(heightInput) || weight <= 0 || heightInput <= 0) {
        return { error: 'Please enter valid positive numbers for weight and height.' };
    }

    const heightMeters = unit === 'cm' ? heightInput / 100 : heightInput;
    if (heightMeters < 0.4 || heightMeters > 3.0) {
        return { error: 'Height must be realistic (0.4m – 3.0m or 40cm – 300cm).' };
    }

    const bmi = weight / (heightMeters * heightMeters);
    let category = 'Obese';
    let colorClass = 'red';
    let tip = 'Consider consulting a healthcare professional for a tailored plan.';

    if (bmi < 18.5) {
        category = 'Underweight';
        colorClass = 'blue';
        tip = 'A nutrient-dense diet and strength training can help reach a healthy range.';
    } else if (bmi < 25) {
        category = 'Normal weight';
        colorClass = 'green';
        tip = 'Great job! Maintain a balanced diet and regular physical activity.';
    } else if (bmi < 30) {
        category = 'Overweight';
        colorClass = 'orange';
        tip = 'Regular cardio and balanced portions can help move toward the normal range.';
    }

    return {
        bmi: Number(bmi.toFixed(2)),
        category,
        colorClass,
        tip
    };
}

function renderPage(title, bodyHtml) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
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
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/calculate-bmi', (req, res) => {
    const result = calculateBmi(req.body.weight, req.body.height, req.body.unit || 'm');

    if (result.error) {
        return res.status(400).send(renderPage('BMI Calculator — Error', `
            <h1>Invalid Input</h1>
            <div class="result red">${result.error}</div>
            <a class="back-link" href="/">← Back to calculator</a>
        `));
    }

    return res.send(renderPage('BMI Result', `
        <h1>BMI Result</h1>
        <div class="result ${result.colorClass}">
            <p class="bmi-value">${result.bmi}</p>
            <p class="bmi-category">${result.category}</p>
            <p class="bmi-tip">${result.tip}</p>
        </div>
        <a class="back-link" href="/">← Calculate again</a>
    `));
});

app.post('/api/bmi', (req, res) => {
    const result = calculateBmi(req.body.weight, req.body.height, req.body.unit || 'm');
    if (result.error) {
        return res.status(400).json({ error: result.error });
    }
    return res.json({ bmi: result.bmi, category: result.category });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`BMI Calculator running at http://localhost:${PORT}`);
    });
}

module.exports = { app, calculateBmi };
