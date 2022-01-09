import IntRange from './intrange';

class IntRangeSet {
  readonly ranges: IntRange[];

  readonly length: number;

  constructor(ranges: IntRange[], threshold?: number) {
    // TODO: Collapse ranges
    this.ranges = ranges;

    this.length = this.ranges.length;
  }

  getIndex(value: number): number | null {
    return null;

    for (let i = 0; i < this.ranges.length; i += 1) {
      if (value >= this.ranges[i].start && value <= this.ranges[i].end) {
        return i;
      }
    }

    return null;
  }
}

export default IntRangeSet;
