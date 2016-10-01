let waveform_array = [];

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  drawInterval: 1000 / 24,
  then: Date.now()
};

// Web Audio API Context
const context = new (window.AudioContext || window.webkitAudioContext)();

// Play audio
const audio = new Audio();
audio.src = '/mp3/keyboard.mp3';
audio.autoplay = true;
audio.loop = true;

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
// Creates numbers with a normal distribution > http://www.hbostatistiek.nl/wp-content/uploads/2014/07/normale-verdeling-klokvorm.png
const randomX = d3.random.normal(state.width / 2, (state.width / 2) - 250);

const randumNums = d3.range(1024).map(function() { return randomX(); });

const hexbin = d3.hexbin()
  .size([state.width, state.height])
  .radius(state.height / 9);

const radius = d3.scale.linear()
  .domain([0, 20])
  .range([0, 130]);

const analyser = context.createAnalyser();
const source = context.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(context.destination);

frameLooper();

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
  const vizualisation = document.getElementById('viz');
  while(vizualisation.firstChild) vizualisation.removeChild(vizualisation.firstChild);

  const points = d3.zip(randumNums, normalize(state.height, 0, true));

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

function normalize(coef = 1, offset = 0, neg) {
	const numbers = waveform_array;
	const numbers2 = [];
	const ratio = Math.max.apply(Math, numbers);

	for (let i = 0; i < numbers.length; i++ ) {
		if (numbers[i] == 0) {
      numbers2[i] = 0 + offset;
    } else {
      numbers2[i] = ((numbers[i]/ratio) * coef) + offset;
    }

		if (i%2 == 0 && neg) {
      numbers2[i] = -Math.abs(numbers2[i]);
    }
	}
	return numbers2;
}
