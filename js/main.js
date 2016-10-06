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

  static setLineScales(keystrokes) {
    this.lineXScale = d3.time.scale()
      .domain(d3.extent(keystrokes, (d) => d.date))
      .rangeRound([0, this.width * 28]);

    this.lineYScale = d3.scale.linear()
      .domain([0, d3.max(keystrokes, (d) => d.keystrokes)])
      .range([this.height / 5, 0]);
  }

  static appendLineGraph(keystrokes) {
    this.line = d3.svg.line()
      .interpolate('basis')
      .x((d) => this.lineXScale(d.date))
      .y((d) => this.lineYScale(d.keystrokes));

    this.svg.append('path')
      .datum(keystrokes)
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('stroke', 'black')
      .attr('d', this.line)
      .attr('transform', `translate(0, ${this.height - this.height / 5})`);
  }
}

class App {
  static onMouseMove(e) {
    const getDx = d3.scale.linear()
      .domain([0, Render.width])
      .range([-50, 50]);

    this.speed = Math.round(getDx(d3.event.pageX));
  }

  static init() {
    Render.initSVG();
    Render.placeMarkerLine();

    d3.csv('../data/keystrokes.csv', (json) => {
      const keystrokes = Helper.parseData(json);
      Render.setLineScales(keystrokes);
      Render.appendLineGraph(keystrokes);
    });

    Render.svg.on('mousemove', this.onMouseMove);
  }
}

App.init();
