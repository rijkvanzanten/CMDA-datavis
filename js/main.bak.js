/* global d3 */

/**
 * @author Rijk van Zanten
 * @copyright 2016 Rijk van Zanten
 * @license MIT
 * @fileoverview Datavisualisatie van keystrokes
 */

const audio = new Audio();

audio.src = 'mp3/keyboard.mp3';
audio.autoplay = true;
audio.loop = true;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const audioAnalyser = audioContext.createAnalyser();
audioAnalyser.fftSize = 1024;

const audioSource = audioContext.createMediaElementSource(audio);
audioSource.connect(audioAnalyser);
audioAnalyser.connect(audioContext.destination);

const bufferLength = audioAnalyser.frequencyBinCount;

let dataArray = new Uint8Array(bufferLength);

let lastVol = 0;

const width = window.innerWidth;
const height = window.innerHeight;

const drawInterval = 1000 / 60; // 1000 / framerate

let then = Date.now();

const svg = d3.select('body').append('svg')
  .attr('id', 'vizualisation')
  .attr('width', width)
  .attr('height', height);

const xPosition = d3.random.normal(width / 2, width / 4);
const yPosition = d3.random.normal(height / 2, height / 9);

const hexbin = d3.hexbin()
  .radius(height / 9);

const gradient = svg.append('svg:defs')
  .append('svg:linearGradient')
    .attr('id', 'gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%')
    .attr('spreadMethod', 'pad');

gradient.append('svg:stop')
  .attr('offset', '0%')
  .attr('stop-color', 'yellow')
  .attr('stop-opacity', 0.6);

gradient.append('svg:stop')
  .attr('offset', '100%')
  .attr('stop-color', 'red')
  .attr('stop-opacity', 0.6);

svg.append('svg:rect')
  .attr('width', width)
  .attr('height', height)
  .style('fill', 'url(#gradient)');

gradient.select('stop')
  .transition()
  .duration(10000)
  .attr('stop-color', 'blue')
  .transition()
  .delay(10000)
  .duration(10000)
  .attr('stop-color', 'green');

svg.append('g')
  .attr('id', 'keystrokes');

d3.csv('../data/keyfreq.txt', (json) => {
  const data = json.map((d) => {
    return {
      date: new Date(+(d.date * 1000)),
      keystrokes: +d.keystrokes
    };
  });

  const dataByHour = d3.nest()
    .key((d) => d.date.getHours())
    .rollup((v) => d3.sum(v, (d) => d.keystrokes))
    .entries(data).map((d) => {
      return {
        hour: +d.key,
        keystrokes: d.values
      };
    });

  const xScale = d3.scale.linear()
    .domain(d3.extent(dataByHour, (d) => d.hour))
    .range([0, width]);

  const yScale = d3.scale.linear()
    .domain([0, d3.max(dataByHour, (d) => d.keystrokes)])
    .range([height / 5, 0]);

  const line = d3.svg.line()
    .interpolate('basis')
    .x((d, i) => xScale(i))
    .y((d) => yScale(d.keystrokes));

  svg
    .append('path')
    .datum(dataByHour)
    .style('transform', `translate(0, ${(height / 5) * 4 - 20}px)`)
    .style('opacity', '0.5')
    .attr('fill', 'none')
    .attr('stroke-width', 2)
    .attr('stroke', 'white')
    .attr('d', line);
});

/**
 * Gets volume from current keyboard audio and loops the render function
 */
function renderLoop() {
  window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
  window.requestAnimationFrame(renderLoop);

  const now = Date.now();
  const delta = now - then;

  if(delta > drawInterval) {
    audioAnalyser.getByteFrequencyData(dataArray);
    const volume = Math.floor(dataArray.reduce((a, b) => a + b) / dataArray.length);
    if(volume > 0 && volume > (lastVol + 4)) {
      render();
    }
    lastVol = volume;
  }
}

function render() {
  const data = hexbin([[xPosition(), yPosition()]]);

  const hexagons = svg.select('#keystrokes').selectAll('.hexagon').data(data, (d) => d);

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
      .attr('d', () => hexbin.hexagon())
      .style('fill', 'white')
      .style('stroke', 'blue')
      .style('stroke-width', 2)
    .transition()
      .duration(250)
        .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
    .transition()
    .delay(300)
      .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.5)`)
      .style('opacity', 0)
    .remove();
}

renderLoop();
