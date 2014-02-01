define(function(require){
  var _ = require('underscore');
  var Marionette = require('marionette');
  var Handlebars = require('handlebars');
  var ResultsViewTemplate = require('text!./templates/ResultsView.html');

  var ResultsView = Marionette.ItemView.extend({
    attributes: {
      class: 'results'
    },
    template: Handlebars.compile(ResultsViewTemplate),

    ui: {
      figure: '.figure'
    },

    initialize: function(){
      this.updateTimeBounds();
    },

    onRender: function(){
      this.renderFigure();
    },

    updateTimeBounds: function(){
      var combinedEvents = this.model.get('beats').concat(this.model.get('taps'));
      var combinedTimes = _.map(combinedEvents, function(event){
        return event.time;
      });

      _.each(['min', 'max'], function(minmax){
        this[minmax + 'Time'] = Math[minmax].apply(Math, combinedTimes);
      }, this);
      this.timeSpan = this.maxTime - this.minTime;
    },

    normalizeTime: function(time){
      return 100 * (time - this.minTime)/this.timeSpan;
    },

    renderFigure: function(){
      var svgns = "http://www.w3.org/2000/svg";
      var svg = this.ui.figure;
      var settings = {
        width: 100,
        height: 100,
        beats: {
          y1: 10,
          y2: 45
        },
        taps: {
          y1: 55,
          y2: 95
        },
        results: {
          cy: 5,
          r: 5
        }
      };

      svg[0].setAttribute('viewBox', [0,0, settings.width, settings.height].join(' '));

      var elements = [];

      var events = {
        beats: this.model.get('beats'),
        taps: this.model.get('taps')
      };

      var setElementAttributes = function(el, attrs){
        _.each(attrs, function(value, attr){
          el.setAttributeNS(null, attr, value);
        });
      };

      generateSvgElement = function(opts){
        if (opts.tag == 'text'){
          var el = document.createElementNS(svgns, 'text');
          setElementAttributes(el, opts.attributes);
          var tspanEl = document.createElementNS(svgns, 'tspan');
          el.appendChild(tspanEl);
        }
        else{
          var el = document.createElementNS(svgns, opts.tag);
          setElementAttributes(el, opts.attributes);
        }
        return el;
      };

      // Generate connecting lines between beats and taps.
      _.each(events.beats, function(beat){
        if (beat.result == 'pass'){
          return;
        }
        var connectedTap = events.taps[beat.matchingTapIdx];
        if (! connectedTap){
          return;
        }
        elements.push({
          tag: 'line',
          attributes: {
            x1: this.normalizeTime(beat.time),
            y1: settings.beats.y2,
            x2: this.normalizeTime(connectedTap.time),
            y2: settings.taps.y1,
            "class": 'link'
          }
        });
      }, this);

      // Generate result icons.
      _.each(events.beats, function(beat){
        elements.push({
          tag: 'circle',
          attributes: {
            cx: this.normalizeTime(beat.time),
            cy: settings.results.cy,
            r: settings.results.r,
            "class": 'result-circle'
          }
        });
        elements.push({
          tag: 'text',
          attributes: {
            x: beat.time,
            y: settings.results.cy,
            "text-anchor": "middle",
            "class": 'result-icon ' + beat.result
          },
        });
      }, this);

      // Generate threshold windows.
      var thresh = this.model.get('threshold');
      var normalizedThresh = this.normalizeTime(2 * thresh) - this.normalizeTime(thresh);
      _.each(events.beats, function(beat){
        elements.push({
          tag: 'rect',
          attributes: {
            x: this.normalizeTime(beat.time) - normalizedThresh,
            y: settings.beats.y1,
            width: normalizedThresh * 2,
            height: settings.taps.y2,
            "class": 'threshold'
          }
        });
      }, this);

      // Generate lines for taps and beats.
      _.each(events, function(eventsForType, eventType){
        elements = elements.concat(this.generateLinesForEvents({
          events: eventsForType,
          attributes: {
            y1: settings[eventType].y1,
            y2: settings[eventType].y2,
            "class": eventType.substring(0, eventType.length - 1)
          }
        }));
      }, this);

      _.each(elements, function(element){
        svg.append(generateSvgElement(element));
      });
    },

    generateLinesForEvents: function(opts){
      var lines = [];
      _.each(opts.events, function(event){
        var x = this.normalizeTime(event.time);
        var line = {
          tag: 'line',
          attributes: _.extend({
            x1: x,
            x2: x,
            "class": ''
          }, opts.attributes)
        };
        line.attributes.class += ' ' + event.result;
        lines.push(line);
      }, this);
      return lines;
    },

  });

  return ResultsView;
});
