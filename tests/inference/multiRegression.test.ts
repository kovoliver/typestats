import { describe, it, expect } from "vitest";
import MultiRegression from "../../core/inference/MultiRegression";

describe("MultiRegression - statsmodels OLS benchmark tests", () => {
    it("validates 2-variable model with mixed 100k and 1m values", () => {
        const independents = [
            new Float64Array([1234567.89, 456789.12, 2109876.54, 876543.21, 1543210.98, 345678.90, 1987654.32, 654321.09, 2345678.90, 1122334.45]),
            new Float64Array([987654.32, 1234567.89, 345678.90, 2109876.54, 876543.21, 1876543.21, 543210.98, 1654321.09, 432109.87, 2233445.56])
        ];
        const dependent = new Float64Array([5432109.87, 3210987.65, 8765432.10, 4567890.12, 6789012.34, 2345678.90, 7890123.45, 3456789.01, 9012345.67, 5678901.23]);

        const expectedBetas = [1017368.2336723022, 3.485927493768251, 0.22658999423659232];
        const expectedRsd = 282937.69463733846;
        const expectedFValue = 309.92320771386113;

        const reg = new MultiRegression(independents, dependent);
        const res = reg.calculateRegression("linear");

        expect(res.betas.length).toBe(expectedBetas.length);
        for (let i = 0; i < expectedBetas.length; i++) {
            expect(res.betas[i]).toBeCloseTo(expectedBetas[i], 3);
        }
        expect(res.rsd).toBeCloseTo(expectedRsd, 3);
        if (res.fValue !== undefined) {
            expect(res.fValue).toBeCloseTo(expectedFValue, 3);
        }
    });

    it("validates 3-variable model with mixed 100k and 1m values", () => {
        const independents = [
            new Float64Array([1234567.89, 456789.12, 2109876.54, 876543.21, 1543210.98, 345678.90, 1987654.32, 654321.09, 2345678.90, 1122334.45]),
            new Float64Array([987654.32, 1234567.89, 345678.90, 2109876.54, 876543.21, 1876543.21, 543210.98, 1654321.09, 432109.87, 2233445.56]),
            new Float64Array([567890.12, 1890123.45, 678901.23, 123456.78, 210987.65, 1456789.01, 890123.45, 198765.43, 1678901.23, 345678.90])
        ];
        const dependent = new Float64Array([6543210.98, 4321098.76, 9876543.21, 5678901.23, 7890123.45, 3456789.01, 8901234.56, 4567890.12, 10123456.78, 6789012.34]);

        const expectedBetas = [2316109.345949918, 3.428552400291802, 0.17482544828005597, -0.07768411424950727];
        const expectedRsd = 311334.1411241442;
        const expectedFValue = 169.05000273027636;

        const reg = new MultiRegression(independents, dependent);
        const res = reg.calculateRegression("linear");

        expect(res.betas.length).toBe(expectedBetas.length);
        for (let i = 0; i < expectedBetas.length; i++) {
            expect(res.betas[i]).toBeCloseTo(expectedBetas[i], 3);
        }
        expect(res.rsd).toBeCloseTo(expectedRsd, 3);
        if (res.fValue !== undefined) {
            expect(res.fValue).toBeCloseTo(expectedFValue, 3);
        }
    });

    it("validates 4-variable model with mixed 100k and 1m values", () => {
        const independents = [
            new Float64Array([1234567.89, 456789.12, 2109876.54, 876543.21, 1543210.98, 345678.90, 1987654.32, 654321.09, 2345678.90, 1122334.45]),
            new Float64Array([987654.32, 1234567.89, 345678.90, 2109876.54, 876543.21, 1876543.21, 543210.98, 1654321.09, 432109.87, 2233445.56]),
            new Float64Array([567890.12, 1890123.45, 678901.23, 123456.78, 210987.65, 1456789.01, 890123.45, 198765.43, 1678901.23, 345678.90]),
            new Float64Array([234567.89, 1567890.12, 890123.45, 1789012.34, 456789.01, 987654.32, 1234567.89, 2109876.54, 543210.98, 1876543.21])
        ];
        const dependent = new Float64Array([7654321.09, 5432109.87, 10987654.32, 6789012.34, 8901234.56, 4567890.12, 9012345.67, 5678901.23, 11234567.89, 7890123.45]);

        const expectedBetas = [3344718.0365551673, 3.3404601389388997, 0.3477323699717436, -0.055363258557825645, -0.12614601592062175];
        const expectedRsd = 596011.2857380924;
        const expectedFValue = 31.293500609917693;

        const reg = new MultiRegression(independents, dependent);
        const res = reg.calculateRegression("linear");

        expect(res.betas.length).toBe(expectedBetas.length);
        for (let i = 0; i < expectedBetas.length; i++) {
            expect(res.betas[i]).toBeCloseTo(expectedBetas[i], 3);
        }
        expect(res.rsd).toBeCloseTo(expectedRsd, 3);
        if (res.fValue !== undefined) {
            expect(res.fValue).toBeCloseTo(expectedFValue, 3);
        }
    });

    it("validates 5-variable model with mixed 100k and 1m values", () => {
        const independents = [
            new Float64Array([1234567.89, 456789.12, 2109876.54, 876543.21, 1543210.98, 345678.90, 1987654.32, 654321.09, 2345678.90, 1122334.45]),
            new Float64Array([987654.32, 1234567.89, 345678.90, 2109876.54, 876543.21, 1876543.21, 543210.98, 1654321.09, 432109.87, 2233445.56]),
            new Float64Array([567890.12, 1890123.45, 678901.23, 123456.78, 210987.65, 1456789.01, 890123.45, 198765.43, 1678901.23, 345678.90]),
            new Float64Array([234567.89, 1567890.12, 890123.45, 1789012.34, 456789.01, 987654.32, 1234567.89, 2109876.54, 543210.98, 1876543.21]),
            new Float64Array([1890123.45, 234567.89, 1456789.01, 678901.23, 1987654.32, 345678.90, 890123.45, 1234567.89, 2109876.54, 456789.01])
        ];
        const dependent = new Float64Array([8765432.10, 6543210.98, 12098765.43, 7890123.45, 9012345.67, 5678901.23, 10123456.78, 6789012.34, 12345678.90, 8901234.56]);

        const expectedBetas = [3192486.1318977103, 3.4124527232163766, 0.4789082694030231, 0.27796464838951174, 0.21747537451034127, 0.2037660161536179];
        const expectedRsd = 695543.7298028393;
        const expectedFValue = 17.78934618206161;

        const reg = new MultiRegression(independents, dependent);
        const res = reg.calculateRegression("linear");

        expect(res.betas.length).toBe(expectedBetas.length);
        for (let i = 0; i < expectedBetas.length; i++) {
            expect(res.betas[i]).toBeCloseTo(expectedBetas[i], 3);
        }
        expect(res.rsd).toBeCloseTo(expectedRsd, 3);
        if (res.fValue !== undefined) {
            expect(res.fValue).toBeCloseTo(expectedFValue, 3);
        }
    });
});