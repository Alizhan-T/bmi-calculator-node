# BMI Calculator (Node.js & Express)

A lightweight Body Mass Index (BMI) web application and JSON API built with **Node.js** and **Express 5**.

## Features

- Supports height input in **meters (`m`)** or **centimeters (`cm`)**.
- Classifies results using standard WHO BMI categories (`Underweight`, `Normal weight`, `Overweight`, `Obese`).
- Server-side input validation with realistic bounds and HTTP `400` responses on invalid data.
- Includes both HTML form flow (`POST /calculate-bmi`) and a JSON endpoint (`POST /api/bmi`).

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000` (or set `PORT=<port>`).

### JSON API Example

```bash
curl -X POST http://localhost:3000/api/bmi \
  -H "Content-Type: application/json" \
  -d '{"weight": 72, "height": 178, "unit": "cm"}'
```
