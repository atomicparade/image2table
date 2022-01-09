var IntRangeSet = /** @class */ (function () {
    function IntRangeSet(ranges, threshold) {
        // TODO: Collapse ranges
        this.ranges = ranges;
        this.length = this.ranges.length;
    }
    IntRangeSet.prototype.getIndex = function (value) {
        for (var i = 0; i < this.ranges.length; i += 1) {
            if (value >= this.ranges[i].start && value <= this.ranges[i].end) {
                return i;
            }
        }
        return null;
    };
    return IntRangeSet;
}());
export default IntRangeSet;
//# sourceMappingURL=intrangeset.js.map