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

const framerate = 24;

const drawInterval = 1000 / framerate;

let then = Date.now();

const svg = d3.select('body').append('svg')
  .attr('id', 'vizualisation')
  .attr('width', width)
  .attr('height', height);

const xPosition = d3.random.normal(width / 2, (width / 2) - 250);
const yPosition = d3.random.normal(height / 2, height / 9);

const hexbin = d3.hexbin()
  .radius(height / 9);


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
    if(volume > 0 && volume > (lastVol + 5)) {
      render();
    }
    lastVol = volume;
  }
}

function render() {
  const data = hexbin([[xPosition(), yPosition()]]);

  const hexagons = svg.selectAll('.hexagon').data(data, (d) => d);

  hexagons
    .exit()
      .transition()
      .delay(300)
      .ease('quad')
      .duration(250)
        .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.5)`)
        .style('opacity', 0)
    .remove();

  hexagons.enter(data)
    .append('path')
    .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.9)`)
    .transition()
    .duration(250)
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .attr('class', 'hexagon')
      .attr('d', (d) => hexbin.hexagon())
      .style('fill', 'white')
    .transition()
    .delay(300)
      .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.5)`)
      .style('opacity', 0)
    .remove();
}

renderLoop();
