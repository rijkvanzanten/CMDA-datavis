let waveform_array = [];
let analyser;

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  drawInterval: 1000 / 24,
  then: Date.now()
};

// Web Audio API Context
const context = new (window.AudioContext || window.webkitAudioContext)();

// Get Audio file
const request = new XMLHttpRequest();
request.open('GET', 'mp3/keyboard2.mp3', true);
request.responseType = 'arraybuffer';
request.onload = function(event) {
  const data = event.target.response;
  audioBullshit(data);
}
request.send();

// Main SVG element
const svg = d3.select("body").append("svg")
  .attr('id', 'viz')
  .attr("width", state.width)
  .attr("height", state.height);

// Create color function
const color = d3.scale.linear()
  .domain([0, 20])
  .range(["black", "white"])
  .interpolate(d3.interpolateLab);

// Create d3 randomizer function (normilized)
const randomX = d3.random.normal(state.width / 2, 700);

const randumNums = d3.range(1024).map(function() { return randomX(); });

const hexbin = d3.hexbin()
  .size([state.width, state.height])
  .radius(50);

const radius = d3.scale.linear()
  .domain([0, 20])
  .range([0, 130]);

/**
 * Setup analyser and source buffers for audio file
 * @param  {arraybuffer} buffer from audio file
 */
function audioBullshit(data) {
  analyser = context.createAnalyser();
  const source = context.createBufferSource();
  source.buffer = context.createBuffer(data, false);
  source.loop = true;
  source.noteOn(0);

  source.connect(analyser);
  analyser.connect(context.destination);

  frameLooper();
}

/**
 * 24fps capped rendering loop
 */
function frameLooper() {
  window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
 	window.requestAnimationFrame(frameLooper);
  const now = Date.now();
  const delta = now - state.then;

  if (delta > state.drawInterval) {
    state.then = now - (delta % state.drawInterval);

    waveform_array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(waveform_array);

    render();
  }

}

/**
 * Render audio data with d3
 */
function render() {
  $('body > svg').empty();

  const points = d3.zip(randumNums, normalize(state.height, 0));

	svg.append("g")
	  .selectAll(".hexagon")
	    .data(hexbin(points))
	  .enter().append("path")
	    .attr("class", "hexagon")
  		.attr("d", function(d) { return hexbin.hexagon(radius(d.length)); })
	    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
	    .style("fill", function(d) { return color(d.length); })
	    .style("opacity", function(d) { return 0.8-(radius(d.length)/180); });
}

/**
 * Normalize waveform array
 * @param  {int} coef
 * @param  {int} offset
 * @param  {bool} neg
 * @return {array}
 */
function normalize(coef, offset, neg) {
	var coef = coef || 1;
	var offset = offset || 0;
	var numbers = waveform_array;
	var numbers2 = [];
	var ratio = Math.max.apply( Math, numbers );
	var l = numbers.length

	for (var i = 0; i < l; i++ ) {
		if (numbers[i] == 0)
			numbers2[i] = 0 + offset;
		else
			numbers2[i] = ((numbers[i]/ratio) * coef) + offset;

		if (i%2 == 0 && neg)
			numbers2[i] = -Math.abs(numbers2[i]);
	}
	return numbers2;
}
