/* global d3 */

/**
 * @author Rijk van Zanten
 * @copyright 2016 Rijk van Zanten
 * @license MIT
 * @fileoverview Datavisualisatie van keystrokes
 */

class Helper {
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

  static getCurrentHour(keystrokes, xPos) {
    return keystrokes[d3.bisector(d => d.date).left(keystrokes, Render.lineXScale.invert(xPos))];
  }

  static randomYPosition() {
    return d3.random.normal(this.getHeight() / 2, this.getHeight() / 9)();
  }

  static randomXPosition() {
    return d3.random.normal(this.getWidth() / 2, this.getWidth() / 4)();
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

  static initHexbin() {
    this.hexbin = d3.hexbin()
      .radius(Helper.getHeight() / 9);

    this.keystrokesGroup = this.svg.append('g')
      .attr('id', 'keystrokes');
  }

  static initDateShow() {
    this.svg.append('text')
      .attr('id', 'datetime')
      .attr('font-family', 'Helvetica Neue')
      .attr('opacity', '0.2')
      .attr('fill', 'white')
      .attr('font-size', '150px')
      .attr('x', 10)
      .attr('y', this.height - 20);
  }

  static showSplash() {
    const renderText = (str) => {
      this.splash.append('text')
        .text(str)
        .style('text-anchor', 'middle')
        .attr('font-size', '25px')
        .attr('fill', 'white')
        .attr('x', this.width / 2)
        .attr('y', this.height / 2)
        .attr('opacity', '0')
      .transition()
        .duration(1000)
        .attr('opacity', '1')
      .transition()
        .delay(5000)
        .duration(1000)
        .attr('opacity', '0')
      .remove();
    };

    this.splash = this.svg.append('g')
      .attr('id', 'splash')
      .attr('opacity', '1');

    this.splash.append('rect')
      .attr('width', this.width - 200)
      .attr('height', this.height - 200)
      .attr('x', 100)
      .attr('y', 100)
      .attr('fill', 'rgba(0, 0, 0, 0.5)');

    renderText('Please use headphones for an optimal experience');

    setTimeout(() => {
      renderText('Use your mouse to progress through time');
    }, 5000);

    setTimeout(() => {
      renderText('Sit back and enjoy');
    }, 10000);

    setTimeout(() => {
      this.splash.transition().duration(1000).attr('opacity', '0').remove();
      App.start();
    }, 15000);
  }

  static updateDateShow(date) {
    if(date !== this.lastDate) {
      const dateString = `${date.getHours()}:00`;
      this.svg.select('#datetime')
        .text(dateString);

      if(date.getHours() === 0) {
        this.svg.append('text')
          .attr('font-family', 'Helvetica Neue')
          .attr('fill', 'white')
          .attr('font-size', '60px')
          .attr('text-anchor', 'middle')
          .attr('x', this.width / 2)
          .attr('y', this.height / 4)
          .text(`${date.getDate()}/${date.getMonth()}`)
          .style('transform-origin', 'center center')
          .style('opacity', '0')
          .transition()
          .duration(1000)
          .style('opacity', '0.2')
          .transition()
          .delay(7500)
          .style('opacity', '0')
          .remove();
      }

      this.lastDate = date;
    }
  }

  static setLineScales(keystrokes) {
    this.lineXScale = d3.time.scale()
      .domain(d3.extent(keystrokes, (d) => d.date))
      .rangeRound([0, this.width * 28]);

    this.lineYScale = d3.scale.linear()
      .domain([0, d3.max(keystrokes, (d) => d.keystrokes)])
      .range([this.height / 2, 0]);
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
      .attr('stroke', 'white')
      .attr('opacity', '0.8')
      .attr('d', this.line)
      .attr('transform', `translate(${this.lineX}, ${this.height / 2 - this.height / 5})`);
  }

  static moveLineChart(dx) {
    const newX = this.lineX - dx;
    if(newX < this.width / 2 && newX > -(this.width * 28 - this.width / 2)) {
      this.lineX = newX;
      d3.select('#line').attr('transform', `translate(${this.lineX},${this.height / 2 - this.height / 5})`);
    }
  }

  static initBackground() {
    this.colors = function(hours) {
      const colors = [
        '#100631', '#201448', '#311448', '#c7ac9b', '#f6aa73', '#9facb8',
        '#67a9cf', '#48a2f4', '#5fd4ff', '#48a2f4', '#67a9cf',
        '#9facb8', '#f6aa73', '#c7ac9b', '#311448', '#201448', '#100631'];
      const i = Math.floor(d3.scale.linear().domain([0, 23]).range([0, colors.length - 1])(hours));
      return colors[i];
    };
    this.svg.append('rect')
      .attr('id', 'background')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', '#9facb8');
  }

  static changeBackground(hours) {
    if(hours !== this.lastBackgroundHours) {
      d3.select('#background')
        .transition()
        .duration(3000)
        .attr('fill', this.colors(hours));
    }
    this.lastBackgroundHours = hours;
  }

  static placeHexagon(color) {
    const data = this.hexbin([[Helper.randomXPosition(), Helper.randomYPosition()]]);
    const hexagons = this.svg.select('#keystrokes').selectAll('.hexagon').data(data, (d) => d);

    hexagons
      .exit()
        .transition()
        .delay(300)
        .duration(250)
          .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.5)`)
          .style('opacity', 0)
      .remove();

    hexagons.enter(data)
        .append('path')
        .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.9)`)
        .attr('class', 'hexagon')
        .attr('d', () => this.hexbin.hexagon())
        .style('fill', 'white')
        .style('stroke', color)
        .style('stroke-width', 4)
        .style('opacity', AudioPlayer.currentVolume())
      .transition()
        .duration(250)
          .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .transition()
      .delay(300)
        .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.5)`)
        .style('opacity', 0)
      .remove();
  }
}

class AudioPlayer {
  static init() {
    const bgAudio = new Audio();
    bgAudio.loop = true;
    bgAudio.autoplay = true;
    bgAudio.src = 'mp3/bg.mp3';

    const ambientAudio = new Audio();
    ambientAudio.loop = true;
    ambientAudio.autoplay = true;

    const audio = new Audio();
    audio.loop = true;
    audio.autoplay = true;
    audio.volume = 0;
    audio.src = 'mp3/keyboard.mp3';

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const audioAnalyser =  audioContext.createAnalyser();
    audioAnalyser.fftSize = 1024;

    const audioSource =  audioContext.createMediaElementSource(audio);
    audioSource.connect(audioAnalyser);
    audioAnalyser.connect( audioContext.destination);

    const bufferLength = audioAnalyser.frequencyBinCount;

    Object.assign(this, { audio, ambientAudio, audioContext, audioAnalyser, audioSource, bufferLength});

    this.dataArray = new Uint8Array(bufferLength);

    this.previousAudioLevel = 0;
  }

  static changeAudio(level) {
    if(level !== this.previousAudioLevel) {
      const { audio } = this;
      audio.volume = level / 100;
      this.previousAudioLevel = level;
    }
  }

  static getVolume() {
    this.audioAnalyser.getByteFrequencyData(this.dataArray);
    return Math.floor(this.dataArray.reduce((a, b) => a + b) / this.dataArray.length);
  }

  static currentVolume() {
    return this.audio.volume;
  }
}

class App {
  static onMouseMove() {
    const getDx = d3.scale.linear()
      .domain([0, Render.width])
      .range([-5, 5]);

    this.speed = Math.round(getDx(d3.event.pageX));
  }

  static startRenderLoop() {
    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;

    let then = Date.now();

    const drawInterval = 1000 / 60;

    let lastVol = 0;

    const render = () => {
      window.requestAnimationFrame(render);

      const now = Date.now();
      const delta = now - then;

      if(delta > drawInterval) {
        // Get data of current point on line
        const xPos = -(Render.lineX - Render.width / 2);
        const keystrokesAtCurrentXPosition = Helper.getDataPoint(xPos);
        const nearestHourlyDataPoint = Helper.getCurrentHour(this.keystrokes, xPos);

        // Move line and update
        Render.moveLineChart(this.speed);
        Render.changeBackground(nearestHourlyDataPoint.date.getHours());
        Render.updateDateShow(nearestHourlyDataPoint.date);

        // Change audio playback
        AudioPlayer.changeAudio(Helper.getAudioLevel(keystrokesAtCurrentXPosition));

        // Place hexagons based on audio levels
        const volume = AudioPlayer.getVolume();
        if(volume > 0 && volume > lastVol) {
          Render.placeHexagon(Helper.getColor(nearestHourlyDataPoint.window));
        }
        lastVol = volume;

        then = now;
      }
    };

    render();
  }

  static init() {
    Render.initSVG();
    Render.initBackground();
    Render.initDateShow();
    Render.initHexbin();

    AudioPlayer.init();

    this.speed = 0;

    d3.json('../data/data.json', (json) => {
      this.keystrokes = json.map((single) => {
        return {
          date: new Date(single.date),
          keystrokes: single.keystrokes,
          window: single.window
        };
      });
      Render.setLineScales(this.keystrokes);
      Helper.setDataPointScale(Render.line, this.keystrokes);
      Render.svg.on('mousemove', this.onMouseMove.bind(this));
      Helper.setAudioLevelScale(this.keystrokes);

      Render.showSplash();
    });
  }

  static start() {
    Render.appendLineGraph(this.keystrokes);
    this.startRenderLoop();
  }
}

App.init();
