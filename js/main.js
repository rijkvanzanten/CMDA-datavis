/* global d3 */

/**
 * @author Rijk van Zanten
 * @copyright 2016 Rijk van Zanten
 * @license MIT
 * @fileoverview Datavisualisatie van keystrokes
 */

require(['audio-handler', 'render-handler', 'helper'], (AudioHandler, RenderHandler, Helper) => {

  const audio = new AudioHandler();
  const render = new RenderHandler();

  class App {
    constructor(audio, render) {
      this.speed = 0;

      d3.json('./data/data.json', (json) => {
        this.keystrokes = json.map((single) => {
          return {
            date: new Date(single.date),
            keystrokes: single.keystrokes,
            window: single.window
          };
        });

        render.setLineScales(this.keystrokes);
        Helper.setDataPointScale(render.line, this.keystrokes);
        render.svg.on('mousemove', this.onMouseMove.bind(this));
        Helper.setAudioLevelScale(this.keystrokes);

        render.appendLineGraph(this.keystrokes);
        render.showSplash();
        this.startRenderLoop();
      });

      Object.assign(this, { audio, render });
    }

    onMouseMove() {
      const getDx = d3.scale.linear()
        .domain([0, this.render.width])
        .range([-5, 5]);

      this.speed = Math.round(getDx(d3.event.pageX));
    }

    startRenderLoop() {
      window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;

      let then = Date.now();

      const drawInterval = 1000 / 60;

      let lastVol = 0;

      const update = () => {
        window.requestAnimationFrame(update);

        const now = Date.now();
        const delta = now - then;

        if(delta > drawInterval) {
          // Get data of current point on line
          const xPos = -(this.render.lineX - this.render.width / 2);
          const keystrokesAtCurrentXPosition = Helper.getDataPoint(xPos);
          const nearestHourlyDataPoint = Helper.getCurrentHour(this.keystrokes, xPos, render);

          // Move line and update
          this.render.moveLineChart(this.speed);
          this.render.changeBackground(nearestHourlyDataPoint.date.getHours());
          this.render.updateDateShow(nearestHourlyDataPoint.date);

          // Change audio playback
          this.audio.changeAudio(Helper.getAudioLevel(keystrokesAtCurrentXPosition));

          // Place hexagons based on audio levels
          const volume = this.audio.getVolume();
          if(volume > 0 && volume > lastVol) {
            this.render.placeHexagon(Helper.getColor(nearestHourlyDataPoint.window), audio);
          }
          lastVol = volume;

          then = now;
        }
      };

      update();
    }
  }

  new App(audio, render);

});
