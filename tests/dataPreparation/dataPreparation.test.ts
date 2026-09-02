import {
    oneHotEncode,
    decodeOneHot,
    replaceEmptyValues,
    replaceOutliers,
    removeInvalidRows,
    normalizeValues,
    standardizeValues,
    labelEncoding
} from "../../core/dataPreparation/dataPreparation";

describe('oneHotEncode and decodeOneHot', () => {
    it('encodes an array of strings correctly', () => {
        const input = ['cat', 'dog', 'cat', 'bird'];
        const result = oneHotEncode(input);

        expect(result.categories).toEqual(['cat', 'dog', 'bird']);
        expect(result.matrix).toEqual([
            [1, 0, 0],
            [0, 1, 0],
            [1, 0, 0],
            [0, 0, 1]
        ]);
    });

    it('decodes a matrix back to string array', () => {
        const matrix = [
            [1, 0, 0],
            [0, 1, 0],
            [1, 0, 0],
            [0, 0, 1]
        ];
        const categories = ['cat', 'dog', 'bird'];

        const decoded = decodeOneHot(matrix, categories);
        expect(decoded).toEqual(['cat', 'dog', 'cat', 'bird']);
    });

    it('throws an error if input is empty', () => {
        expect(() => oneHotEncode([])).toThrow('You must provide at least one value!');
    });

    it('throws an error if input contains non-string values', () => {
        expect(() => oneHotEncode(['cat', 1 as any, 'dog']))
            .toThrow('One-hot encoding only works with string values!');
    });
});

describe('replaceEmptyValues', () => {
    it('replaces empty values in a 1D array using MEAN', () => {
        const input = [1, null, 3];
        const result = replaceEmptyValues(input, 'MEAN');
        expect(result).toEqual([1, 2, 3]);
    });

    it('replaces empty values in a 1D array using MEDIAN', () => {
        const input = [1, undefined, 5, 9];
        const result = replaceEmptyValues(input, 'MEDIAN');
        expect(result).toEqual([1, 5, 5, 9]);
    });

    it('replaces empty values in a 2D array column', () => {
        const input = [
            [1, 10],
            [2, null],
            [3, 30]
        ];
        const result = replaceEmptyValues(input, 'MEAN', 1);
        expect(result).toEqual([
            [1, 10],
            [2, 20],
            [3, 30]
        ]);
    });

    it('throws an error if column index is missing for 2D array', () => {
        const input = [[1, 2], [3, 4]];
        expect(() => replaceEmptyValues(input, 'MEAN'))
            .toThrow('You must provide column index when the given values are in a 2d array!');
    });
});

describe('replaceOutliers', () => {
    it('replaces outliers in a 1D array based on boundaries', () => {
        const input = [2, 4, 100, 6];
        const boundaries = { min: 0, max: 10 };
        const result = replaceOutliers(input, 'MEAN', boundaries);
        expect(result).toEqual([2, 4, 4, 6]);
    });

    it('replaces outliers in a 2D array column', () => {
        const input = [
            ['a', 5],
            ['b', -50],
            ['c', 15]
        ];
        const boundaries = { min: 0, max: 20 };
        const result = replaceOutliers(input, 'MEAN', boundaries, 1);
        expect(result).toEqual([
            ['a', 5],
            ['b', 10],
            ['c', 15]
        ]);
    });

    it('throws an error if no valid boundaries are provided', () => {
        expect(() => replaceOutliers([1, 2, 3], 'MEAN', {} as any)).toThrow('You must provide at least a minimum or a maximum boundary to replace outliers!');
    });
});

describe('removeInvalidRows', () => {
    it('removes invalid rows from a 1D array', () => {
        const input = [1, NaN, 2, null, 15, 3];
        const boundaries = { min: 0, max: 10 };
        const result = removeInvalidRows(input, boundaries);
        expect(result).toEqual([1, 2, 3]);
    });

    it('removes invalid rows from a 2D array based on column index', () => {
        const input = [
            ['x', 5],
            ['y', null],
            ['z', 50],
            ['w', 8]
        ];
        const boundaries = { max: 10 };
        const result = removeInvalidRows(input, boundaries, 1);
        console.log(result);
        expect(result).toEqual([
            ['x', 5],
            ['w', 8]
        ]);
    });
});

describe('normalizeValues and standardizeValues', () => {
    it('normalizes a 1D array correctly', () => {
        const input = [0, 5, 10];
        const result = normalizeValues(input);
        expect(result).toEqual([0, 0.5, 1]);
    });

    it('normalizes a 2D array column correctly', () => {
        const input = [
            ['A', 0],
            ['B', 5],
            ['C', 10]
        ];
        const result = normalizeValues(input, 1);
        expect(result).toEqual([
            ['A', 0],
            ['B', 0.5],
            ['C', 1]
        ]);
    });

    it('standardizes a 1D array correctly', () => {
        const input = [1, 2, 3];
        const result = standardizeValues(input) as number[];

        expect(result[0]).toBeCloseTo(-1, 5);
        expect(result[1]).toBeCloseTo(0, 5);
        expect(result[2]).toBeCloseTo(1, 5);
    });

    it('throws an error if data contains invalid values during scaling', () => {
        const input = [1, NaN, 3];
        expect(() => normalizeValues(input)).toThrow('The given dataset has invalid values. You can use, e.g., the replaceEmptyValues function.');
    });
});

describe('labelEncoding', () => {
    it('encodes a 1D array of strings into numerical labels', () => {
        const input = ['apple', 'banana', 'apple', 'cherry'];
        const result = labelEncoding(input);
        expect(result).toEqual([0, 1, 0, 2]);
    });

    it('encodes a specific column in a 2D array', () => {
        const input = [
            [10, 'red'],
            [20, 'blue'],
            [30, 'red']
        ];
        const result = labelEncoding(input, 1);
        expect(result).toEqual([
            [10, 0],
            [20, 1],
            [30, 0]
        ]);
    });

    it('throws an error if input contains non-string values', () => {
        const input = ['apple', 10 as any];
        expect(() => labelEncoding(input))
            .toThrow('Label encoding is only possible             with strictly string values!');
    });

    it('throws an error if column index is missing for 2D array', () => {
        const input = [['a'], ['b']];
        expect(() => labelEncoding(input)).toThrow('You must provide column index when             the given values are in a 2d array!');
    });
});