/* global d3 */
define(['helper'], (Helper) => { // eslint-disable-line
  return class Render {
    constructor() {
      this.width = Helper.getWidth();
      this.height = Helper.getHeight();

      this.svg = d3.select('body').append('svg')
        .attr('id', 'vizualisation')
        .attr('width', this.width)
        .attr('height', this.height);

      this.colors = function(hours) {
        const colors = [
          '#100631', '#201448', '#311448', '#c7ac9b', '#f6aa73', '#9facb8',
          '#67a9cf', '#48a2f4', '#5fd4ff', '#48a2f4', '#67a9cf',
          '#9facb8', '#f6aa73', '#c7ac9b', '#311448', '#201448', '#100631'];
        const i = Math.floor(d3.scale.linear().domain([0, 23]).range([0, colors.length - 1])(hours));
        return colors[i];
      };

      this.background = this.svg.append('rect')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('fill', '#9facb8');

      this.hexbin = d3.hexbin()
        .radius(Helper.getHeight() / 9);

      this.keystrokesGroup = this.svg.append('g')
        .attr('id', 'keystrokes');

      this.svg.append('text')
        .attr('id', 'datetime')
        .attr('font-family', 'Nexa, sans-serif')
        .attr('opacity', '0.2')
        .attr('fill', 'white')
        .attr('font-size', '150px')
        .attr('x', 10)
        .attr('y', this.height - 20);
    }

    setLineScales(keystrokes) {
      this.lineXScale = d3.time.scale()
        .domain(d3.extent(keystrokes, (d) => d.date))
        .rangeRound([0, this.width * 28]);

      this.lineYScale = d3.scale.linear()
        .domain([0, d3.max(keystrokes, (d) => d.keystrokes)])
        .range([this.height / 2, 0]);
    }

    appendLineGraph(keystrokes) {
      this.lineX = (this.width / 2);

      this.line = d3.svg.line()
        .interpolate('basis')
        .x((d) => this.lineXScale(d.date))
        .y((d) => this.lineYScale(d.keystrokes));

      this.line = this.svg.append('path')
        .datum(keystrokes)
        .attr('id', 'line')
        .attr('fill', 'none')
        .attr('stroke-width', 1)
        .attr('stroke', 'white')
        .attr('opacity', '0.8')
        .attr('d', this.line)
        .attr('transform', `translate(${this.lineX}, ${this.height / 2 - this.height / 5})`);
    }

    moveLineChart(dx) {
      const newX = this.lineX - dx;
      if(newX < this.width / 2 && newX > -(this.width * 28 - this.width / 2)) {
        this.lineX = newX;
        d3.select('#line').attr('transform', `translate(${this.lineX},${this.height / 2 - this.height / 5})`);
      }
    }

    updateDateShow(date) {
      if(date !== this.lastDate) {
        const dateString = `${date.getHours()}:00`;
        this.svg.select('#datetime')
          .text(dateString);

        if(date.getHours() === 0) {
          this.svg.append('text')
            .attr('font-family', 'Nexa, sans-serif')
            .attr('fill', 'white')
            .attr('font-size', '60px')
            .attr('text-anchor', 'middle')
            .attr('x', this.width / 2)
            .attr('y', this.height / 4)
            .text(`${date.getDate()}/${date.getMonth()}`)
            .style('transform-origin', 'center center')
            .style('opacity', '0')
            .transition()
            .duration(1000)
            .style('opacity', '0.2')
            .transition()
            .delay(7500)
            .style('opacity', '0')
            .remove();
        }

        this.lastDate = date;
      }
    }

    showSplash() {
      const renderText = (str) => {
        this.splash.append('text')
          .text(str)
          .style('text-anchor', 'middle')
          .attr('font-family', 'Nexa, sans-serif')
          .attr('font-size', '25px')
          .attr('fill', 'white')
          .attr('x', this.width / 2)
          .attr('y', this.height / 2)
          .attr('opacity', '0')
        .transition()
          .duration(1000)
          .attr('opacity', '1')
        .transition()
          .delay(5000)
          .duration(1000)
          .attr('opacity', '0')
        .remove();
      };

      const addHexagon = (label, borderColor, x, y) => {
        this.splash.append('svg:polygon')
          .style('fill', 'white')
          .style('stroke-width', '4')
          .style('stroke', borderColor)
          .style('transform', `translate(${x}px,${y}px)`)
          .attr('points', '75,37.5 56.25,70 18.75,70 0,37.5 18.75,5 56.25,5' + ' ')
          .attr('opacity', '0')
          .transition()
          .duration(1000)
          .attr('opacity', '0.5');

        this.splash.append('text')
          .attr('x', x + 37.5)
          .attr('y', y + 43)
          .attr('font-family', 'Nexa, sans-serif')
          .attr('text-anchor', 'middle')
          .text(label)
          .attr('opacity', '0')
          .transition()
          .duration(1000)
          .attr('opacity', '0.5');
      };

      this.splash = this.svg.append('g')
        .attr('id', 'splash')
        .attr('opacity', '1');

      this.splash.append('rect')
        .attr('width', this.width - 200)
        .attr('height', this.height - 200)
        .attr('x', 100)
        .attr('y', 100)
        .attr('fill', 'rgba(0, 0, 0, 0.5)');

      renderText('Please use headphones for an optimal experience');

      setTimeout(() => {
        renderText('Use your mouse to progress through time');
      }, 5000);

      setTimeout(() => {
        renderText('The color indicates the program that was used');
        addHexagon('Safari',    Helper.getColor('Safari'),    this.width / 5 * 1 - 37.50, this.height / 1.5);
        addHexagon('Atom',      Helper.getColor('Atom'),      this.width / 5 * 2 - 37.50, this.height / 1.5);
        addHexagon('Terminal',  Helper.getColor('Terminal'),  this.width / 5 * 3 - 37.50, this.height / 1.5);
        addHexagon('Chrome',    Helper.getColor('Chrome'),    this.width / 5 * 4 - 37.50, this.height / 1.5);
      }, 10000);

      setTimeout(() => {
        this.splash.transition().duration(1000).attr('opacity', '0').remove();
      }, 15000);
    }

    changeBackground(hours) {
      if(hours !== this.lastBackgroundHours) {
        this.background
          .transition()
          .duration(3000)
          .attr('fill', this.colors(hours));
      }
      this.lastBackgroundHours = hours;
    }

    placeHexagon(color, audio) {
      const data = this.hexbin([[Helper.randomXPosition(), Helper.randomYPosition()]]);
      const hexagons = this.svg.select('#keystrokes').selectAll('.hexagon').data(data, (d) => d);

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
          .attr('d', () => this.hexbin.hexagon())
          .style('fill', 'white')
          .style('stroke', color)
          .style('stroke-width', 4)
          .style('opacity', audio.currentVolume())
        .transition()
          .duration(250)
            .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
        .transition()
        .delay(300)
          .attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(0.5)`)
          .style('opacity', 0)
        .remove();
    }
  };
});
