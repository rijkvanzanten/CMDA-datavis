/* global d3 */

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select('body').append('svg')
  .attr('id', 'vizualisation')
  .attr('width', width)
  .attr('height', height);

// Line in center of screen
svg.append('rect')
  .attr('x', width / 2)
  .attr('y', height - height / 5)
  .attr('height', height / 5)
  .attr('width', 1);

const bisectDate = d3.bisector(function(d) { return d.date; }).left;

// Load data and start app when loaded
d3.csv('../data/keystrokes.csv', (json) => {
  const keystrokes = parseData(json);
  const { lineXScale, lineYScale } = setLineScales(keystrokes);
  appendLine(keystrokes, lineXScale, lineYScale);

  render();
});

function parseData(data) {
  const keystrokes = data.map((d) => {
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

function setLineScales(keystrokes) {
  const lineXScale = d3.time.scale()
    .domain(d3.extent(keystrokes, (d) => d.date))
    .rangeRound([0, width * 28]);

  const lineYScale = d3.scale.linear()
    .domain([0, d3.max(keystrokes, (d) => d.keystrokes)])
    .range([height / 5, 0]);

  return { lineXScale, lineYScale };
}

function appendLine(keystrokes, lineXScale, lineYScale) {
  const line = d3.svg.line()
    .interpolate('basis')
    .x((d) => lineXScale(d.date))
    .y((d) => lineYScale(d.keystrokes));

  svg.append('path')
    .datum(keystrokes)
    .attr('fill', 'none')
    .attr('stroke-width', 1)
    .attr('stroke', 'black')
    .attr('d', line)
    .attr('transform', `translate(0, ${height - height / 5})`);
}
