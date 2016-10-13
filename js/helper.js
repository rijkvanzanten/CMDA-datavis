/* global d3 */
define([], () => { // eslint-disable-line
  return class Helper {
    static getWidth() {
      return window.innerWidth;
    }

    static getHeight() {
      return window.innerHeight;
    }

    static getColor(programName) {
      const colors = {
        Atom: '#1ba976',
        Safari: '#0197c6',
        Terminal: '#323232',
        Chrome: '#ffce42'
      };

      return colors[programName];
    }

    static setAudioLevelScale(keystrokes) {
      this.audioScale = d3.scale.linear()
        .range([0, 100])
        .domain(d3.extent(keystrokes, (d) => d.keystrokes));
    }

    static getAudioLevel(keystrokes) {
      return Math.round(this.audioScale(keystrokes));
    }

    static setDataPointScale(lineElement, keystrokes) {
      this.dataPointScale = d3.scale.linear()
        .range(d3.extent(keystrokes, (d) => d.keystrokes))
        .domain([this.getHeight() / 2, 0]);
    }

    static getDataPoint(xPos) {
      return +Math.round(this.dataPointScale(document.querySelector('#line').getPointAtLength(xPos).y));
    }

    static getCurrentHour(keystrokes, xPos, render) {
      return keystrokes[d3.bisector(d => d.date).left(keystrokes, render.lineXScale.invert(xPos))];
    }

    static randomYPosition() {
      return d3.random.normal(this.getHeight() / 2, this.getHeight() / 9)();
    }

    static randomXPosition() {
      return d3.random.normal(this.getWidth() / 2, this.getWidth() / 4)();
    }
  };
});
