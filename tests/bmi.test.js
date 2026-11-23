const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, calculateBmi } = require('../index');

describe('calculateBmi unit tests', () => {
    it('classifies Underweight (< 18.5)', () => {
        const res = calculateBmi(52, 1.8, 'm');
        assert.equal(res.bmi, 16.05);
        assert.equal(res.category, 'Underweight');
        assert.equal(res.colorClass, 'blue');
        assert.equal(res.unit, 'm');
        assert.deepEqual(res.healthyWeightRangeKg, { min: 59.9, max: 80.7 });
    });

    it('classifies Normal weight (18.5 <= BMI < 25) with meters and centimeters', () => {
        const metersRes = calculateBmi(72, 1.78, 'm');
        const cmRes = calculateBmi(72, 178, 'CM');
        assert.equal(metersRes.bmi, 22.72);
        assert.equal(metersRes.category, 'Normal weight');
        assert.equal(metersRes.colorClass, 'green');
        assert.equal(cmRes.bmi, metersRes.bmi);
        assert.equal(cmRes.heightMeters, 1.78);
        assert.equal(cmRes.unit, 'cm');
    });

    it('classifies Overweight (25 <= BMI < 30)', () => {
        const res = calculateBmi(85, 1.75, 'm');
        assert.equal(res.bmi, 27.76);
        assert.equal(res.category, 'Overweight');
        assert.equal(res.colorClass, 'orange');
    });

    it('classifies Obese (BMI >= 30)', () => {
        const res = calculateBmi(110, 175, 'cm');
        assert.equal(res.bmi, 35.92);
        assert.equal(res.category, 'Obese');
        assert.equal(res.colorClass, 'red');
    });

    it('handles WHO boundary values cleanly (18.5, 25.0, 30.0)', () => {
        assert.equal(calculateBmi(18.5, 1.0, 'm').category, 'Normal weight');
        assert.equal(calculateBmi(25.0, 1.0, 'm').category, 'Overweight');
        assert.equal(calculateBmi(30.0, 1.0, 'm').category, 'Obese');
    });

    it('rejects unsupported height units', () => {
        const res = calculateBmi(70, 5.9, 'ft');
        assert.match(res.error, /Unit must be 'm' or 'cm'/);
    });

    it('rejects missing, boolean, non-numeric, or non-positive values', () => {
        for (const bad of [0, -10, '', '   ', null, undefined, true, false, 'abc', NaN, Infinity]) {
            assert.ok(calculateBmi(bad, 1.75, 'm').error, `expected error for weight=${String(bad)}`);
            assert.ok(calculateBmi(70, bad, 'm').error, `expected error for height=${String(bad)}`);
        }
    });

    it('rejects unrealistic weight and height bounds', () => {
        assert.match(calculateBmi(0.5, 1.75, 'm').error, /Weight must be realistic/);
        assert.match(calculateBmi(501, 1.75, 'm').error, /Weight must be realistic/);
        assert.match(calculateBmi(70, 0.35, 'm').error, /Height must be realistic/);
        assert.match(calculateBmi(70, 310, 'cm').error, /Height must be realistic/);
    });
});

describe('HTTP routes integration tests', () => {
    let server;
    let baseUrl;

    before(async () => {
        await new Promise((resolve) => {
            server = app.listen(0, '127.0.0.1', () => {
                const { port } = server.address();
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    });

    after(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    it('GET / serves the HTML calculator form and static stylesheet', async () => {
        const res = await fetch(`${baseUrl}/`);
        const html = await res.text();
        assert.equal(res.status, 200);
        assert.match(html, /BMI Calculator/);
        assert.match(html, /action="\/calculate-bmi"/);

        const cssRes = await fetch(`${baseUrl}/style.css`);
        assert.equal(cssRes.status, 200);
        assert.match(await cssRes.text(), /\.container/);
    });

    it('GET /health returns ok JSON', async () => {
        const res = await fetch(`${baseUrl}/health`);
        const data = await res.json();
        assert.equal(res.status, 200);
        assert.deepEqual(data, { status: 'ok', service: 'bmi-calculator-node' });
    });

    it('POST /api/bmi returns full JSON payload for valid input', async () => {
        const res = await fetch(`${baseUrl}/api/bmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weight: 72, height: 178, unit: 'cm' })
        });
        const data = await res.json();
        assert.equal(res.status, 200);
        assert.equal(data.bmi, 22.72);
        assert.equal(data.category, 'Normal weight');
        assert.equal(data.heightMeters, 1.78);
        assert.equal(data.weightKg, 72);
        assert.equal(typeof data.tip, 'string');
        assert.deepEqual(data.healthyWeightRangeKg, { min: 58.6, max: 78.9 });
    });

    it('POST /api/bmi returns 400 on invalid unit or missing body', async () => {
        const badUnit = await fetch(`${baseUrl}/api/bmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weight: 72, height: 178, unit: 'in' })
        });
        assert.equal(badUnit.status, 400);
        assert.match((await badUnit.json()).error, /Unit must be/);

        const emptyBody = await fetch(`${baseUrl}/api/bmi`, { method: 'POST' });
        assert.equal(emptyBody.status, 400);
        assert.ok((await emptyBody.json()).error);
    });

    it('POST /api/bmi returns 400 JSON on malformed JSON payload', async () => {
        const res = await fetch(`${baseUrl}/api/bmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{"weight": 72,'
        });
        assert.equal(res.status, 400);
        assert.deepEqual(await res.json(), { error: 'Invalid JSON payload.' });
    });

    it('POST /calculate-bmi renders HTML result and 400 error page', async () => {
        const okRes = await fetch(`${baseUrl}/calculate-bmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'weight=72&height=178&unit=cm'
        });
        const okHtml = await okRes.text();
        assert.equal(okRes.status, 200);
        assert.match(okHtml, /22\.72/);
        assert.match(okHtml, /Normal weight/);
        assert.match(okHtml, /58\.6 kg – 78\.9 kg/);

        const badRes = await fetch(`${baseUrl}/calculate-bmi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'weight=-5&height=1.75&unit=m'
        });
        assert.equal(badRes.status, 400);
        assert.match(await badRes.text(), /Invalid Input/);
    });
});
