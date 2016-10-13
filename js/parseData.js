/* global d3 */

// Keystrokes
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

// Window
d3.csv('./active_window.csv', (data) => {
  data = data.map((d) => {
    return {
      date: new Date(Number(d.date) * 1000),
      window: d.window
    };
  });

  windowByHour = d3.nest()
  .key((d) => `${d.date.getDate()}-${d.date.getMonth()}`)
  .key((d) => `${d.date.getHours()}:00`)
  .rollup((v) => {
    return {
      date: new Date(2016, v[0].date.getMonth(), v[0].date.getDate(), v[0].date.getHours(), 0),
      windows: v.map((obj) => obj.window).reduce((acc, curr) => {
        if (typeof acc[curr] == 'undefined') {
          acc[curr] = 1;
        } else {
          acc[curr] += 1;
        }

        return acc;
      }, {})
    };
  })
  .entries(data);

  console.log(windowByHour);
});
