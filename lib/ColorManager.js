var colorsA = [ "tomato", "gold", "turquoise", "palevioletred", "orange", "cornflowerblue"],
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