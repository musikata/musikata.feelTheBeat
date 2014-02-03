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
      // Calculate min/min max for beats and taps.
      var stats = {};
      var eventTypes = ['beats', 'taps'];
      _.each(eventTypes, function(eventType){
        stats[eventType] = {};
        _.each(['min', 'max'], function(minmax){
          var events = this.model.get(eventType);
          var times = _.map(events, function(event){
            return event.time;
          });
          stats[eventType][minmax] = Math[minmax].apply(Math, times);
        }, this);
      }, this);

      // Modify beat stats to include threshold.
      var thresh = this.model.get('threshold');
      stats.beats.min -= thresh;
      stats.beats.max += thresh;

      // Calculate overall stats.
      _.each(['min', 'max'], function(minmax){
        var combined = [];
        _.each(eventTypes, function(eventType){
          combined.push(stats[eventType][minmax]);
        });
        this[minmax + 'Time'] = Math[minmax].apply(Math, combined);
      }, this);

      this.timeSpan = this.maxTime - this.minTime;
    },

    normalizeTime: function(time){
      return 100 * (time - this.minTime)/this.timeSpan;
    },

    renderFigure: function(){
      var settings = {
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

      var elements = [];

      var events = {
        beats: this.model.get('beats'),
        taps: this.model.get('taps')
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
          type: 'line',
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
          type: 'resultIcon',
          attributes: {
            x: this.normalizeTime(beat.time),
            "class": 'result ' + beat.result
          }
        });
      }, this);

      // Generate threshold windows.
      var thresh = this.model.get('threshold');
      var normalizedThresh = this.normalizeTime(2 * thresh) - this.normalizeTime(thresh);
      _.each(events.beats, function(beat){
        elements.push({
          type: 'threshold',
          attributes: {
            x: this.normalizeTime(beat.time) - normalizedThresh,
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

      var renderGraphicElement = function(opts){
        var $el;
        if (opts.type === 'event'){
          $el = $('<div>');
          $el.css({
            left: opts.attributes.x + '%'
          });
          $el.addClass(opts.attributes.class);
        }
        else if (opts.type === 'threshold'){
          $el = $('<div>');
          $el.css({
            left: opts.attributes.x + '%',
            width: opts.attributes.width + '%'
          });
          $el.addClass(opts.attributes.class);
        }
        else if (opts.type === 'resultIcon'){
          $el = $('<div><i></i></div>');
          $el.css({
            left: opts.attributes.x + '%',
          });
          $el.addClass(opts.attributes.class);
        }
        else if (opts.type === 'line'){
          var svgns = "http://www.w3.org/2000/svg";
          $el = $('<svg xmlns="' + svgns  + '" version="1.2" baseProfile="tiny"></svg>');
          var styleProperties;
          var lineAttrs;
          var lineEl = document.createElementNS(svgns, 'line');
          if (opts.attributes.x1 < opts.attributes.x2){
            styleProperties = {
              left: opts.attributes.x1 + '%',
              width: (opts.attributes.x2 - opts.attributes.x1) + '%',
            };
            lineAttrs = {x1: '0%', y1: '0%', x2: '100%', y2: '100%'};
          }
          else{
            styleProperties = {
              left: opts.attributes.x2 + '%',
              width: (opts.attributes.x1 - opts.attributes.x2) + '%',
            };
            lineAttrs = {x1: '0%', y1: '100%', x2: '100%', y2: '0%'};
          }
          var styleStr = _.reduce(styleProperties, function(memo, value, key){
            return memo + [key, value].join(':') + ';';
          }, '');
          _.each(lineAttrs, function(value, attr){
            lineEl.setAttribute(attr, value);
          });
          $el[0].appendChild(lineEl);
          $el.attr('style', styleStr);
          $el.attr('class', (opts.attributes.class));
        }
        return $el;
      };

      _.each(elements, function(element){
        this.ui.figure.append(renderGraphicElement(element));
      }, this);
    },

    generateLinesForEvents: function(opts){
      var lines = [];
      _.each(opts.events, function(event){
        var x = this.normalizeTime(event.time);
        var line = {
          type: 'event',
          attributes: _.extend({
            x: x,
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
