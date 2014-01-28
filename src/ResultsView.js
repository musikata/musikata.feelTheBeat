define(function(require){
  var _ = require('underscore');
  var Marionette = require('marionette');
  var Handlebars = require('handlebars');
  var ResultsViewTemplate = require('text!./templates/ResultsView.html');

  var ResultsView = Marionette.ItemView.extend({
    template: Handlebars.compile(ResultsViewTemplate),

    templateHelpers: function(){
      return {
        beatMarks: this.generateBeatMarks(),
        tapMarks: this.generateTapMarks()
      };
    },

    ui: {
      beats: '.beats',
      taps: '.taps'
    },

    initialize: function(){
      this.updateTimeBounds();
      this.updateBeatWindows();
    },

    updateTimeBounds: function(){
      var combinedTimes = this.model.get('beats').concat(this.model.get('taps'));
      _.each(['min', 'max'], function(minmax){
        this[minmax + 'Time'] = Math[minmax].apply(Math, combinedTimes);
      }, this);
      this.timeSpan = this.maxTime - this.minTime;
    },

    // Generate threshold buckets around each beat for determining
    // quality of taps.
    updateBeatWindows: function(){
      var threshold = this.model.get('threshold');
      this.beatWindows = _.map(this.model.get('beats'), function(beat, idx){
        return {
          beat: beat,
          index: idx,
          min: beat - threshold,
          max: beat + threshold
        };
      });
    },

    // @TODO: normalize based on minX, maxX here.
    normalizeTime: function(time){
      return (time - this.minTime)/this.timeSpan;
    },

    generateBeatMarks: function(){
      return _.map(this.model.get('beats'), function(time){
        return {
          x: this.normalizeTime(time)
        };
      }, this);
    },

    generateTapMarks: function(){
      return _.map(this.model.get('taps'), function(time){
        return {
          x: this.normalizeTime(time),
          goodness: this.isTapGood(time) ? 'good' : 'bad'
        };
      }, this);
    },

    // Determine whether a tap time is 'good'
    // (falls w/in the threshold of a beat).
    isTapGood: function(time){
      for (var i=0; i < this.beatWindows.length; i++){
        var beatWindow = this.beatWindows[i];
        if ((time < beatWindow.max) && (time > beatWindow.min)){
          return true;
        }
      }
      return false;
    }
  });

  return ResultsView;
});
