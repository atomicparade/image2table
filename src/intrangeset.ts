import IntRange from './intrange';

class IntRangeSet {
  readonly ranges: IntRange[];

  readonly length: number;

  constructor(ranges: IntRange[], threshold: number) {
    this.ranges = [];

    ranges.sort((a, b) => {
      if (a.start === b.start) {
        return a.end - b.end;
      }
      return a.start - b.start;
    });

    let iCurrentRange = 0;
    this.ranges.push(ranges[0]);

    for (let i = 1, iN = ranges.length; i < iN; i += 1) {
      const range = ranges[i];

      if (range.start - this.ranges[iCurrentRange].end <= threshold) {
        // Extend the most recently added range
        this.ranges[iCurrentRange] = { start: this.ranges[iCurrentRange].start, end: range.end };
      } else {
        // Begin a new range
        this.ranges.push(range);
        iCurrentRange += 1;
      }
    }

    this.length = this.ranges.length;
  }

  getIndex(value: number): number | null {
    for (let i = 0, iN = this.ranges.length; i < iN; i += 1) {
      if (value >= this.ranges[i].start && value <= this.ranges[i].end) {
        return i;
      }
    }

    return null;
  }
}

export default IntRangeSet;
