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

  static getDataPoint(keystrokes, xPos) {
    return keystrokes[d3.bisector(d => d.date).left(keystrokes, Render.lineXScale.invert(xPos))];
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

  static initDateShow() {
    this.svg.append('text')
      .attr('id', 'datetime')
      .attr('font-family', 'Comic Sans MS')
      .attr('fill', 'white')
      .attr('font-size', '20px')
      .attr('text-anchor', 'middle')
      .attr('x', this.width / 2)
      .attr('y', 50);
  }

  static updateDateShow(date) {
    const dateString = `
    ${date.getDate()}/${date.getMonth()}/${date.getFullYear()}
    ${date.getHours()}:00
    `;
    this.svg.select('#datetime')
      .text(dateString);
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
    this.lineX = (this.width / 2);

    this.line = d3.svg.line()
      .interpolate('basis')
      .x((d) => this.lineXScale(d.date))
      .y((d) => this.lineYScale(d.keystrokes));

    this.svg.append('path')
      .datum(keystrokes)
      .attr('id', 'line')
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('stroke', 'black')
      .attr('d', this.line)
      .attr('transform', `translate(${this.lineX}, ${this.height - this.height / 5})`);
  }

  static moveLineChart(dx) {
    const newX = this.lineX - dx;
    if(newX < this.width / 2 && newX > -(this.width * 28 - this.width / 2)) {
      this.lineX = newX;
      d3.select('#line').attr('transform', `translate(${this.lineX},${this.height - this.height / 5})`);
    }
  }

  static initBackground() {
    this.colors = function(hours) {
      const colors = ['#020026', '#fbedcb', '#4fa3e1', '#4fa3e1', '#fc8a54', '#020026'];
      const i = Math.floor(d3.scale.linear().domain([0, 23]).range([0, colors.length - 1])(hours));
      return colors[i];
    };
    this.svg.append('rect')
      .attr('id', 'background')
      .attr('fill', 'blue')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', this.colors(1));
  }

  static changeBackground(hours) {
    if(hours !== this.lastBackgroundHours) {
      d3.select('#background')
        .transition()
        .duration(2000)
        .attr('fill', this.colors(hours));
    }
    this.lastBackgroundHours = hours;
  }
}

class App {
  static onMouseMove() {
    const getDx = d3.scale.linear()
      .domain([0, Render.width])
      .range([-15, 15]);

    this.speed = Math.round(getDx(d3.event.pageX));
  }

  static startRenderLoop() {
    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;

    let then = Date.now();

    const drawInterval = 1000 / 24;

    const render = () => { // arrow want this binding
      window.requestAnimationFrame(render);

      const now = Date.now();
      const delta = now - then;

      if(delta > drawInterval) {
        const dataPoint = Helper.getDataPoint(this.keystrokes, -(Render.lineX - Render.width / 2));
        Render.moveLineChart(this.speed);
        Render.changeBackground(dataPoint.date.getHours());
        Render.updateDateShow(dataPoint.date);
      }
    };

    render();
  }

  static init() {
    Render.initSVG();
    Render.initBackground();
    Render.initDateShow();

    this.speed = 0;

    d3.csv('../data/keystrokes.csv', (json) => {
      this.keystrokes = Helper.parseData(json);
      Render.setLineScales(this.keystrokes);
      Render.appendLineGraph(this.keystrokes);
      Render.svg.on('mousemove', this.onMouseMove.bind(this));
      this.startRenderLoop();
    });
  }
}

App.init();
