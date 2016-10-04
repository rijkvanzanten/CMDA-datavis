/* global d3 */

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select('body').append('svg')
  .attr('id', 'vizualisation')
  .attr('width', width * 7)
  .attr('height', height);

const lineXScale = d3.time.scale()
  .rangeRound([0, width * 14]);

const lineYScale = d3.scale.linear()
  .range([height / 5, 0]);

d3.csv('../data/keystrokes.csv', (json) => {
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

  lineXScale.domain(d3.extent(keyStrokesByHourParsed, (d) => d.date));
  lineYScale.domain([0, d3.max(keyStrokesByHourParsed, (d) => d.keystrokes)]);

  const line = d3.svg.line()
    .interpolate('basis')
    .x((d) => lineXScale(d.date))
    .y((d) => lineYScale(d.keystrokes));

  svg.append('path')
    .datum(keyStrokesByHourParsed)
    .attr('fill', 'none')
    .attr('stroke-width', 1)
    .attr('stroke', 'black')
    .attr('d', line);


});
