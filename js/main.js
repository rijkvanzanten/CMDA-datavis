/* global d3 */
class Helper {
  static getWidth() {
    return window.innerWidth;
  }

  static getHeight() {
    return window.innerHeight;
  }
}

class Render {
  static initSVG() {
    this.width = Helper.getWidth();
    this.height = Helper.getHeight();

    this.svg = d3.select('body').append('svg')
      .attr('id', 'vizualisation')
      .attr('width', this.width)
      .attr('height', this.height);
  }

  static placeMarkerLine() {
    this.svg.append('rect')
      .attr('x', this.width / 2)
      .attr('y', this.height - this.height / 5)
      .attr('height', this.height / 5)
      .attr('width', 1);
  }
}

class App {
  static init() {
    Render.initSVG();
    Render.placeMarkerLine();
  }
}

App.init();
