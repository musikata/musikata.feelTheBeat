define(function(require){
  var Backbone = require('backbone');
  var Marionette = require('marionette');
  var Handlebars = require('handlebars');

  var ResultsView = require("./ResultsView");
  var FeelTheBeatExerciseViewTemplate = require("text!./templates/FeelTheBeatExerciseView.html");

  var FeelTheBeatExerciseView = Marionette.Layout.extend({
    template: Handlebars.compile(FeelTheBeatExerciseViewTemplate),

    templateHelpers: function(){
      return {
        remainingBeats: this.remainingBeats
      };
    },

    ui: {
      instructions: '.instructions',
      tapView: '.tap-view',
      drum: '.drum',
      drumContainer: '.drum-container',
      loadingMsg: '.drum-container .msg.loading',
      remainingBeats: '.remainingBeats',
      results: '.results'
    },

    regions: {
      body: '.body'
    },

    // Resources to be loaded via an audio manager.
    audioResources: [
      'FeelTheBeat:beat',
      'FeelTheBeat:tap'
    ],

    events: {
      "touchstart @ui.drum": "drumTapStart",
      "mousedown @ui.drum": "drumTapStart",
      "touchend @ui.drum": "drumTapEnd",
      "mouseup @ui.drum": "drumTapEnd",
    },

    initialize: function(options){
      this.audioManager = options.audioManager;
      this.scheduledBeats = {};
      this.recording = false;
      this.remainingBeats = this.model.get('length');
      this.recordedTaps = [];
      this.recordedBeats = [];

      this.updateSecondsPerBeat();

      // Get promises for audio resources.
      var audioPromises = [];
      _.each(this.audioResources, function(resource){
        audioPromises.push(this.audioManager.getPromise(resource));
      }, this);
      this.audioPromise = $.when.apply($, audioPromises);
    },

    onRender: function(){
      this.on('beating:start', this.onBeatingStart, this);
      this.on('beating:stop', this.onBeatingStop, this);
      this.on('recording:start', this.onRecordingStart, this);
      this.on('recording:stop', this.onRecordingStop, this);
      this.on("tap:play", this.onTapPlay, this);
      this.on("recording:lastBeat", this.onLastBeat, this);
      this.on("tap:start", this.onTapStart, this);
      this.on("tap:end", this.onTapEnd, this);

      // Listen for keypresses.
      $('body').on('keydown', _.bind(this.onKeyDown, this));
      $('body').on('keyup', _.bind(this.onKeyUp, this));

      // Keep track of most recent beat.
      this.on('beat:start', function(beat){
        this.mostRecentBeat = beat;
      }, this);

      // Enable drum and listen for taps when audio resources have been loaded.
      this.audioPromise.done(_.bind(function(){
        this.ui.drum.removeClass('disabled');
        this.ui.drum.addClass('enabled');
        this.ui.loadingMsg.hide();
        this.once('tap:start', this.onFirstTap, this);
      }, this));
    },

    drumTapStart: function(){
      this.trigger("tap:start");
    },
    
    drumTapEnd: function(){
      this.trigger("tap:end");
    },

    onKeyDown: function(e){
      // Spacebar.
      if (e.keyCode == 32){
        this.drumTapStart();
      }
    },

    onKeyUp: function(e){
      // Spacebar.
      if (e.keyCode == 32){
        this.drumTapEnd();
      }
    },

    updateSecondsPerBeat: function(){
      if (! this.model.get('bpm')){
        throw new Error('bpm was note set');
      }
      this.secondsPerBeat = 60.0/this.model.get('bpm');
    },

    updateRemainingBeatsCounter: function(){
      this.ui.remainingBeats.find('.numBeats').html(this.remainingBeats);
    },

    onTapStart: function(){
      this.ui.drum.addClass('tapping');
      this.trigger('tap:play');
    },

    onTapEnd: function(){
      this.ui.drum.removeClass('tapping');
    },

    onFirstTap: function(){
      this.updateSecondsPerBeat();
      this.ui.instructions.find('li:nth-child(1)').addClass('disabled');
      this.ui.instructions.find('li:nth-child(2)').removeClass('disabled');
      this.trigger('beating:start');

      // Show number of beats remaining.
      this.ui.remainingBeats.removeClass('disabled');
      this.updateRemainingBeatsCounter();

      // Wire behavior for 2nd tap.
      this.once('tap:start', this.onSecondTap, this);
    },

    onSecondTap: function(){
      this.trigger('recording:start');
      // Record initial tap.
      this.recordTap();
    },

    scheduleBeats: function(){
      var _this = this;
      var currentTime = this.audioManager.getCurrentTime();
      while (this.nextBeatTime < (currentTime + this.secondsPerBeat * .5) ){
        var beatTime = this.nextBeatTime;
        this.audioManager.scheduleEvent({
          action: "sample:start",
          sample: "FeelTheBeat:beat",
          time: beatTime,
          callback: function(){
            _this.trigger('beat:start', beatTime);
          }
        });
        this.nextBeatTime += this.secondsPerBeat;
      }
      this.beatSchedulerTimer = setTimeout(function(){
        _this.scheduleBeats();
      }, this.secondsPerBeat * .5);
    },

    onRecordingStart: function(){
      this.on('tap:start', this.recordTap, this);
      this.on('beat:start', this.recordBeat, this);

      // Record most recent beat, if w/in .5 beats.
      if ((this.audioManager.getCurrentTime() - this.mostRecentBeat) < (this.secondsPerBeat * .5)){
        this.recordBeat(this.mostRecentBeat);
      }
    },

    onRecordingStop: function(){
      this.recording = false;
      this.off('beat:start', this.recordBeat, this);
      this.off('tap:start', this.recordTap, this);
      this.off('tap:start', this.onTapStart, this);
      this.submit();
    },

    onBeatingStart: function(){
      if (this.beating){
        return;
      }
      this.beating = true;
      this.nextBeatTime = this.audioManager.getCurrentTime();
      this.scheduleBeats();
    },

    onBeatingStop: function(){
      this.beating = false;
      window.clearTimeout(this.beatSchedulerTimer);
    },

    recordTap: function(){
      var tapTime = this.audioManager.getCurrentTime();
      this.recordedTaps.push(tapTime);
    },

    recordBeat: function(beat){
      this.recordedBeats.push(beat);
      this.remainingBeats -= 1;
      this.updateRemainingBeatsCounter();

      if (this.remainingBeats <= 0){
        this.trigger('beating:stop');
        this.trigger('recording:lastBeat');
      }
    },

    onLastBeat: function(){
      // Wait for .5 beats to stop recording.
      setTimeout(_.bind(function(){
        this.trigger('recording:stop');
      }, this), this.secondsPerBeat * .5 * 1000);
    },

    submit: function(){
      this.trigger('submission:start');
      var submission = {
        beats: this.recordedBeats,
        taps: this.recordedTaps,
        threshold: this.model.get('threshold') * this.secondsPerBeat
      };
      var evaluatedSubmission = this.evaluateSubmission(submission);
      this.showResults(evaluatedSubmission);
    },

    evaluateSubmission: function(submission){
      var evaluatedBeats = [];
      var evaluatedTaps = [];
      var numBeats = submission.beats.length;
      var numTaps = submission.taps.length;
      var thresh = submission.threshold;
      // Check beats one-by-one against taps.
      for (var i=0; i < numBeats; i++){
        var beat = submission.beats[i];
        // If there was a corresponding tap...
        if (i < numTaps){
          // passes if tap is w/in beat threshold, fails otherwise.
          var tap = submission.taps[i];
          var withinThresh = (tap > (beat - thresh)) && (tap < (beat + thresh));
          var result = withinThresh ? 'pass' : 'fail';
          evaluatedBeats.push({time: beat, matchingTapIdx: i, result: result});
          evaluatedTaps.push({time: tap, matchingBeatIdx: i, result: result});
        }
        // If no corresponding tap, fails.
        else{
          evaluatedBeats.push({time: beat, matchingTapIdx: null, result: 'fail'});
        }
      }

      // If there are taps w/out corresponding beats remaining, mark as failed.
      for (var i=numBeats; i < numTaps; i++){
        var tap = submission.taps[i];
        evaluatedTaps.push({time: tap, matchingBeatIdx: null, result: 'fail'});
      }

      // Count number of failed beats.
      var numFailedBeats = 0;
      for (var i=0; i < evaluatedBeats.length; i++){
        if (evaluatedBeats[i].result == 'pass'){
          numFailedBeats += 1;
        }
      }

      // Set overall result based on maxFailedBeats
      var overallResult = (numFailedBeats <= submission.maxFailedBeats) ? 'pass' : 'fail';

      var evaluatedSubmission = {
        beats: evaluatedBeats,
        taps: evaluatedTaps,
        result: overallResult
      };

      return evaluatedSubmission;
    },

    showResults: function(evaluatedSubmission){
      // Note: Would be nice to style this via css, but makes the logic 
      // here a bit less clear.
      var _this = this;
      this.ui.tapView.fadeOut({
        duration: 1000,
        complete: function(){
          // Override open method of region to fade in and trigger submission end..
          _this.body.open = function(view){
            this.$el.hide();
            this.$el.html(view.el);
            this.$el.fadeIn({duration: 1000});
            _this.trigger('submission:end', evaluatedSubmission);
          };

          // Show the results view.
          _this.body.show(new ResultsView({
            model: new Backbone.Model(_.extend({
              threshold: _this.model.get('threshold') * _this.secondsPerBeat
            } ,evaluatedSubmission))
          }));
        }
      });
    },

    onTapPlay: function(){
      this.audioManager.scheduleEvent({
        action: "sample:start",
        sample: "FeelTheBeat:tap",
        time: 0,
      });
    }

  });

  return FeelTheBeatExerciseView;
});
