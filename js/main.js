/* global d3 */
class Helper {
  static getWidth() {
    return window.innerWidth;
  }

  static getHeight() {
    return window.innerHeight;
  }

  static parseData(json) {
    const keystrokes = json.map((d) => {
      return {
        date: new Date(Number(d.date) * 1000),
        keystrokes: Number(d.keystrokes)
      };
    });

    const keyStrokesByHourNested = d3.nest()
      .key((d) => d.date.getDate())
      .key((d) => d.date.getHours())
      .rollup((v) => {
      return {
        keystrokes: d3.sum(v, (d) => d.keystrokes),
        date: new Date(2016, v[0].date.getMonth(), v[0].date.getDate(), v[0].date.getHours(), 0)
      };})
      .entries(keystrokes);

    let keyStrokesByHourParsed = [];
    keyStrokesByHourNested.forEach((keyStrokesByDay) => {
      keyStrokesByDay.values.forEach((keyStrokesByHour) => {
        const { date, keystrokes } = keyStrokesByHour.values;
        keyStrokesByHourParsed.push({date, keystrokes});
      });
    });

    return keyStrokesByHourParsed;
  }
}

class Render {
  static initSVG() {
    this.width = Helper.getWidth();
    this.height = Helper.getHeight();

    this.svg = d3.select('body').append('svg')
      .attr('id', 'vizualisation')
      .attr('width', this.width)
      .attr('height', this.height);
  }

  static placeMarkerLine() {
    this.svg.append('rect')
      .attr('x', this.width / 2)
      .attr('y', this.height - this.height / 5)
      .attr('height', this.height / 5)
      .attr('width', 1);
  }
}

class App {
  static init() {
    Render.initSVG();
    Render.placeMarkerLine();

    d3.csv('../data/keystrokes.csv', (json) => {
      const keystrokes = Helper.parseData(json);
    });
  }
}

App.init();
