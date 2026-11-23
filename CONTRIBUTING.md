# Contributing to BMI Calculator

Thanks for taking the time to contribute!

## Getting Started

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-improvement
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Run the test suite before and after making changes:
   ```bash
   npm test
   ```

## Guidelines

- Keep `calculateBmi` pure, deterministic, and strictly validated.
- Add or update tests in `tests/bmi.test.js` for any new endpoint behavior or validation rule.
- Preserve backwards compatibility on `POST /api/bmi` response fields (`bmi`, `category`, `tip`, `healthyWeightRangeKg`).
- Open a Pull Request describing the motivation and verification steps.
