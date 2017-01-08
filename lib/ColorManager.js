var colorsA = ['#3cc9e4', '#70ca5d', '#eac55e', '#fa6b67', '#7189de', '#e798dc', '#ec945e'],//[ "tomato", "gold", "yellowgreen", "darkturquoise", "orange", "cornflowerblue", "seagreen", "burlywood", "cadetblue", "coral", "darkkhaki", "darkseagreen", "deeppink", "green", "LightSlateGray", "lightcoral", "lightseagreen", "mediumaquamarine", "mediumturquoise", "slateblue"],
    colorsB = [],
    colorsTarget = colorsA;

module.exports = {
    getColor: function getColor () {
        var index,
            selectedColor,
            otherColors;

        if (colorsTarget.length === 0) {
            colorsTarget = colorsTarget === colorsA ? colorsB : colorsA;
        }

        otherColors = colorsTarget === colorsA ? colorsB : colorsA;

        index = Math.round(Math.random() * colorsTarget.length - 1);
        selectedColor = colorsTarget.splice(index, 1)[0];
        otherColors.push(selectedColor);

        return selectedColor;
    }
};