/* global d3 */
function parseData(json) {
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
