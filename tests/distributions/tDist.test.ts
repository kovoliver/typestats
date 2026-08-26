import tQuantile from "../../calculations/distributions/studentDist";

describe('tQuantile', () => {
    it('should return 0 when p = 0.5 for any degrees of freedom', () => {
        expect(tQuantile(0.5, 1)).toBeCloseTo(0, 10);
        expect(tQuantile(0.5, 2)).toBeCloseTo(0, 10);
        expect(tQuantile(0.5, 10)).toBeCloseTo(0, 10);
        expect(tQuantile(0.5, 100)).toBeCloseTo(0, 10);
    });

    it('should calculate exact analytical quantiles for df = 1 (Cauchy distribution)', () => {
        expect(tQuantile(0.75, 1)).toBeCloseTo(1, 8);
        expect(tQuantile(0.25, 1)).toBeCloseTo(-1, 8);
        expect(tQuantile(0.9, 1)).toBeCloseTo(3.0776835371752534, 8);
    });

    it('should calculate exact analytical quantiles for df = 2', () => {
        expect(tQuantile(0.75, 2)).toBeCloseTo(0.816496580927726, 8);
        expect(tQuantile(0.975, 2)).toBeCloseTo(4.302652725749488, 8);
        expect(tQuantile(0.025, 2)).toBeCloseTo(-4.302652725749488, 8);
    });

    it('should calculate correct quantiles for general degrees of freedom (df >= 3)', () => {
        // df = 5
        expect(tQuantile(0.975, 5)).toBeCloseTo(2.5705818366147395, 7);
        expect(tQuantile(0.05, 5)).toBeCloseTo(-2.0150483726691575, 7);

        // df = 30 (common critical value used in statistics)
        expect(tQuantile(0.975, 30)).toBeCloseTo(2.0422724563012373, 7);
        expect(tQuantile(0.995, 30)).toBeCloseTo(2.7500000000000000, 5);
    });

    it('should approach the standard normal distribution as df becomes large', () => {
        // At df = 1000, tQuantile(0.975) should be very close to normalQuantile(0.975) ≈ 1.95996
        expect(tQuantile(0.975, 1000)).toBeCloseTo(1.9623391, 4);
    });

    it('should handle symmetry correctly across all branches', () => {
        expect(tQuantile(0.05, 10)).toBeCloseTo(-tQuantile(0.95, 10), 10);
        expect(tQuantile(0.01, 4)).toBeCloseTo(-tQuantile(0.99, 4), 10);
    });

    it('should throw an error if p <= 0 or p >= 1', () => {
        expect(() => tQuantile(0, 5)).toThrow('Probability (p) must be strictly between 0 and 1.');
        expect(() => tQuantile(-0.1, 5)).toThrow('Probability (p) must be strictly between 0 and 1.');
        expect(() => tQuantile(1, 5)).toThrow('Probability (p) must be strictly between 0 and 1.');
        expect(() => tQuantile(1.2, 5)).toThrow('Probability (p) must be strictly between 0 and 1.');
    });

    it('should throw an error if df <= 0', () => {
        expect(() => tQuantile(0.5, 0)).toThrow('Degrees of freedom (df) must be strictly positive.');
        expect(() => tQuantile(0.5, -5)).toThrow('Degrees of freedom (df) must be strictly positive.');
    });
});