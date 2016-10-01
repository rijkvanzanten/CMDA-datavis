/**
 * @author Rijk van Zanten
 * @copyright 2016 Rijk van Zanten
 * @license MIT
 * @fileoverview Datavisualisatie van keystrokes
 */

// Audio part
// -----------------------------------------------------------------------------

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

function analyze() {
  audioAnalyser.getByteFrequencyData(dataArray);

  const volume = getVolume(dataArray);

  if(volume > 0 && volume > (lastVol + 5)) {
    render();
  }

  lastVol = volume;

  setTimeout(() => { analyze(); }, 10);
}

function getVolume(array) {
  return Math.floor(array.reduce((a, b) => a + b) / array.length);
}



const width = window.innerWidth;
const height = window.innerHeight;

const framerate = 24;

const drawInterval = 1000 / framerate;

let then = Date.now();

const svg = d3.select('body').append('svg')
  .attr('id', 'vizualisation')
  .attr('width', width)
  .attr('height', height);

const color = d3.scale.linear()
  .domain([0, 20])
  .range('black', 'white')
  .interpolate(d3.interpolateLab);

const xPosition = d3.random.normal(width / 2, (width / 2) - 250);
const yPosition = () => Math.random() * height;

const hexbin = d3.hexbin()
  .size([width, height])
  .radius(height / 9);

function render() {
  const data = hexbin([[xPosition(), yPosition()]]);

  const hexagons = svg.selectAll('.hexagon').data(data, (d) => d);

  hexagons
    .exit()
      .transition()
        .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.5)`)
        .style('fill', 'black')
    .remove();

  hexagons.enter(data)
    .append('path')
    .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.9)`)
    .transition()
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .attr('class', 'hexagon')
      .attr('d', (d) => hexbin.hexagon())
      .style('fill', 'white');
}

analyze();
