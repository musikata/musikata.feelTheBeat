define(function(require){
  var _ = require('underscore');
  var Marionette = require('marionette');
  var Handlebars = require('handlebars');
  var ResultsViewTemplate = require('text!./templates/ResultsView.html');

  var ResultsView = Marionette.ItemView.extend({
    template: Handlebars.compile(ResultsViewTemplate),

    templateHelpers: function(){
      return {
        elements: this.generateGraphicElements(),
      };
    },

    initialize: function(){
      this.updateTimeBounds();
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
      return (time - this.minTime)/this.timeSpan;
    },

    // Generate a list of elements to draw.
    generateGraphicElements: function(){
      var elements = [];
      var positionSettings = {
        beats: {
          y1: 5,
          y2: 45
        },
        taps: {
          y1: 55,
          y2: 95
        }
      };

      var events = {
        beats: this.model.get('beats'),
        taps: this.model.get('taps')
      };

      // Generate lines for taps and beats.
      _.each(events, function(eventsForType, eventType){
        elements = elements.concat(this.generateLinesForEvents({
          events: eventsForType,
          attributes: {
            y1: positionSettings[eventType].y1,
            y2: positionSettings[eventType].y2,
            "class": eventType.substring(0, eventType.length - 1)
          }
        }));
      }, this);

      // Generate connecting lines between beats and taps.
      _.each(events.beats, function(beat){
        var connectedTap = events.taps[beat.matchingTapIdx];
        if (connectedTap){
          elements.push({
            tag: 'line',
            attributes: {
              x1: this.normalizeTime(beat.time),
              y1: positionSettings.beats.y1,
              x2: this.normalizeTime(connectedTap.time),
              y2: positionSettings.taps.y1,
              "class": 'link'
            }
          });
        }
      }, this);

      return elements;
    },

    // Generate line elements for taps and beats.
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
