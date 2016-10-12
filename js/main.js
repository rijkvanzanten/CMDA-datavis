/* global d3 */
class Helper {
  static getWidth() {
    return window.innerWidth;
  }

  static getHeight() {
    return window.innerHeight;
  }

  static setAudioLevelScale(keystrokes) {
    this.audioScale = d3.scale.linear()
      .range([0, 30])
      .domain(d3.extent(keystrokes, (d) => d.keystrokes));
  }

  static getAudioLevel(keystrokes) {
    return Math.round(this.audioScale(keystrokes));
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

  static setDataPointScale(lineElement, keystrokes) {
    this.dataPointScale = d3.scale.linear()
      .range(d3.extent(keystrokes, (d) => d.keystrokes))
      .domain([this.getHeight() / 5, 0]);
  }

  static getDataPoint(xPos) {
    return + Math.round(this.dataPointScale(document.querySelector('#line').getPointAtLength(xPos).y));
  }

  static getCurrentHour(keystrokes, xPos) {
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

    this.line = this.svg.append('path')
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

class AudioPlayer {
  static init() {

        const audioFiles = {
          slow: 'mp3/slow.mp3',
          medium: 'mp3/medium.mp3',
          fast: 'mp3/fast.mp3'
        };
    const audio = new Audio();
    audio.loop = true;
    audio.autoplay = true;
    audio.src = audioFiles.fast;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const audioAnalyser =  audioContext.createAnalyser();
    audioAnalyser.fftSize = 1024;

    const audioSource =  audioContext.createMediaElementSource(audio);
    audioSource.connect(audioAnalyser);
    audioAnalyser.connect( audioContext.destination);

    const bufferLength = audioAnalyser.frequencyBinCount;

    Object.assign(this, { audio, audioFiles, audioContext, audioAnalyser, audioSource, bufferLength});

    this.dataArray = new Uint8Array(bufferLength);

    this.previousAudioLevel = 0;
  }

  static changeAudio(level) {
    if(level !== this.previousAudioLevel) {
      console.log(level);
      const { audio } = this;
      audio.volume = level % 10 === 0 && level !== 0 ? 1 : level % 10 / 10;
      // if(level === 0) {
      //   audio.pause();
      // } else if(level > 0 && level < 6) {
      //   audio.src = 'mp3/slow.mp3';
      //   if(audio.paused) audio.play();
      // } else if(level > 6 && level <= 20) {
      //   audio.src = 'mp3/medium.mp3';
      //   if(audio.paused) audio.play();
      // } else if(level > 20) {
      //   audio.src = 'mp3/fast.mp3';
      //   if(audio.paused) audio.play();
      // }

      this.previousAudioLevel = level;
    }
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

    const render = () => {
      window.requestAnimationFrame(render);

      const now = Date.now();
      const delta = now - then;

      if(delta > drawInterval) {
        const xPos = -(Render.lineX - Render.width / 2);
        const keystrokesAtCurrentXPosition = Helper.getDataPoint(xPos);
        const nearestHourlyDataPoint = Helper.getCurrentHour(this.keystrokes, xPos);
        Render.moveLineChart(this.speed);
        Render.changeBackground(nearestHourlyDataPoint.date.getHours());
        Render.updateDateShow(nearestHourlyDataPoint.date);

        AudioPlayer.changeAudio(Helper.getAudioLevel(keystrokesAtCurrentXPosition));
      }
    };

    render();
  }

  static init() {
    Render.initSVG();
    Render.initBackground();
    Render.initDateShow();

    AudioPlayer.init();

    this.speed = 0;

    d3.csv('../data/keystrokes.csv', (json) => {
      this.keystrokes = Helper.parseData(json);
      Render.setLineScales(this.keystrokes);
      Render.appendLineGraph(this.keystrokes);
      Helper.setDataPointScale(Render.line, this.keystrokes);
      Render.svg.on('mousemove', this.onMouseMove.bind(this));
      this.startRenderLoop();

      Helper.setAudioLevelScale(this.keystrokes);
    });
  }
}

App.init();
