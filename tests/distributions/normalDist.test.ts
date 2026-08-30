import normalQuantile from "../../core/distributions/normalDist";

describe('normalQuantile', () => {
    it('should return 0 when p = 0.5', () => {
        expect(normalQuantile(0.5)).toBeCloseTo(0, 10);
    });

    it('should return correct z-values for known upper tail probabilities', () => {
        expect(normalQuantile(0.8413447460685429)).toBeCloseTo(1, 8);
        expect(normalQuantile(0.975)).toBeCloseTo(1.959963984540054, 8);
        expect(normalQuantile(0.99)).toBeCloseTo(2.326347874040841, 8);
    });

    it('should return correct z-values for known lower tail probabilities (symmetry)', () => {
        expect(normalQuantile(0.1586552539314571)).toBeCloseTo(-1, 8);
        expect(normalQuantile(0.025)).toBeCloseTo(-1.959963984540054, 8);
        expect(normalQuantile(0.01)).toBeCloseTo(-2.326347874040841, 8);
    });

    it('should be accurate in extreme tail regions (p < 0.02425 or p > 0.97575)', () => {
        expect(normalQuantile(0.0001)).toBeCloseTo(-3.7190164854557, 8);
        expect(normalQuantile(0.9999)).toBeCloseTo(3.7190164854557, 8);
    });

    it('should throw an error if p <= 0', () => {
        expect(() => normalQuantile(0)).toThrow('The probability must be strictly between 0 and 1.');
        expect(() => normalQuantile(-0.5)).toThrow('The probability must be strictly between 0 and 1.');
    });

    it('should throw an error if p >= 1', () => {
        expect(() => normalQuantile(1)).toThrow('The probability must be strictly between 0 and 1.');
        expect(() => normalQuantile(1.5)).toThrow('The probability must be strictly between 0 and 1.');
    });
});