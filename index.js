const path = require('path');
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const PORT = 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/calculate-bmi', (req, res) => {
    const weight = Number(req.body.weight);
    const height = Number(req.body.height);

    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
        return res.send(`
    <link rel="stylesheet" href="/style.css">
    <div class="container">
      <h1>Error</h1>
      <div class="result red">
        Please enter valid positive numbers for weight and height.
      </div>
      <a href="/">Back</a>
    </div>
  `);
    }

    const bmi = weight / (height * height);

    let category = '';
    let colorClass = '';

    if (bmi < 18.5) {
        category = 'Underweight';
        colorClass = 'blue';
    } else if (bmi < 24.9) {
        category = 'Normal weight';
        colorClass = 'green';
    } else if (bmi < 29.9) {
        category = 'Overweight';
        colorClass = 'orange';
    } else {
        category = 'Obese';
        colorClass = 'red';
    }

    return res.send(`
    <link rel="stylesheet" href="/style.css">
    <div class="container">
      <h1>BMI Result</h1>

      <div class="result ${colorClass}">
        <p>Your BMI: <b>${bmi.toFixed(2)}</b></p>
        <p>Category: <b>${category}</b></p>
      </div>

      <a href="/">Calculate again</a>
    </div>
  `);
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});