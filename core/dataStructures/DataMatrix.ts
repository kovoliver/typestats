import { betweenSSD, chiSquare, cramerV, totalSSD, withinSSD } from "../statistics/bivariate.js";
import { mean } from "../statistics/univariate.js";

export default class DataMatrix {
    private _values: number[][];
    private _colLabels: string[];
    private _rowLabels: string[] | undefined = undefined;

    constructor(values: number[][], colLabels: string[], rowLabels?: string[]) {
        if (values.length === 0) {
            throw new Error('You did not provide any values!');
        }

        const emptyLines = values.every(row => row.length === 0);

        if (emptyLines) {
            throw new Error('The lines you provided are empty!');
        }

        if (rowLabels && values.some(row => row.length !== values[0].length)) {
            throw new Error('All the rows must have the same number of values in the case of contingency tables!');
        }

        this._values = values;
        this._colLabels = colLabels;
        this._rowLabels = rowLabels;
    }

    public get rows() {
        return this._values.length;
    }

    public get cols() {
        return this._values.length > 0 ? this._values[0].length : 0;
    }

    public mainMean(): number {
        return mean(this._values.flat());
    }

    public totalSSD(): number {
        return totalSSD(this._values);
    }

    public withinSSD(): number {
        return withinSSD(this._values);
    }

    public betweenSSD(): number {
        return betweenSSD(this._values);
    }

    public etaSquared(): number {
        const totalSSD = this.totalSSD();

        if(totalSSD === 0) {
            throw new Error('Cannot calculate eta squared when total SSD is zero.');
        }

        return this.betweenSSD() / totalSSD;
    }

    public chiSquare(): number {
        return chiSquare(this._values);
    }

    public cramerV(): number {
        return cramerV(this._values);
    }

    public printTable() {
        const printObj: Record<number, Record<string, number>> = {};

        for (let i = 0; i < this.rows; i++) {
            printObj[i] = {};

            for (let j = 0; j < this.cols; j++) {
                const colLabel = this._colLabels[j];
                printObj[i][colLabel] = this._values[i][j];
            }
        }

        console.table(printObj);
    }

    public printContingencyTable() {
        if (!this._rowLabels) {
            throw new Error(
                'Row labels are required for printContingencyTable.'
            );
        }

        const printObj: Record<string, Record<string, number>> = {};

        for (let i = 0; i < this.rows; i++) {
            const rowLabel = this._rowLabels![i];

            printObj[rowLabel] = {};

            for (let j = 0; j < this.cols; j++) {
                const colLabel = this._colLabels[j];
                printObj[rowLabel][colLabel] = this._values[i][j];
            }
        }

        console.table(printObj);
    }
}