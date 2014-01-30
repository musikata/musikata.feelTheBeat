define(function(require){
  var Backbone = require('backbone');
  var Marionette = require('marionette');
  var Handlebars = require('handlebars');

  var ResultsView = require("./ResultsView");
  var FeelTheBeatExerciseViewTemplate = require("text!./templates/FeelTheBeatExerciseView.html");

  var FeelTheBeatExerciseView = Marionette.Layout.extend({
    template: Handlebars.compile(FeelTheBeatExerciseViewTemplate),

    ui: {
      instructions: '.instructions',
      drum: '.drum',
      loadingMsg: '.drum_container .msg.loading',
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
      "keydown": "onKeyDown",
      "keyup": "onKeyUp",
    },

    initialize: function(options){
      this.audioManager = options.audioManager;
      this.scheduledBeats = {};
      this.recording = false;
      this.remainingBeats = this.model.get('length');
      this.tapCounter = 0;
      this.recordedTaps = [];
      this.recordedBeats = [];

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

      // Keep track of most recent beat.
      this.on('beat:start', function(beat){
        this.mostRecentBeat = beat;
      }, this);

      // Enable drum and listen for taps when audio resources have been loaded.
      this.audioPromise.done(_.bind(function(){
        this.ui.drum.removeClass('disabled');
        this.ui.loadingMsg.hide();
        this.on('tap:start', this.onTapStart, this);
        this.on('tap:end', this.onTapEnd, this);
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
      this.tapCounter += 1;
      this.ui.drum.addClass('active');

      if (this.tapCounter == 1){
        this.updateSecondsPerBeat();

        this.trigger('beating:start');

        // Change instruction text.
        this.ui.instructions.html('Try to tap along for ' + this.remainingBeats + ' beats');

        // Show number of beats remaining.
        this.ui.remainingBeats.show();
        this.updateRemainingBeatsCounter();

        // Submit when recording finishes.
        this.once('recording:stop', this.submit, this);
      }
      else if (this.tapCounter == 2){
        this.trigger('recording:start');
      }

      if (this.tapCounter < this.model.get('length')){
        this.trigger('tap:play');
      }
    },

    onTapEnd: function(){
      this.ui.drum.removeClass('active');
    },

    scheduleBeats: function(){
      var _this = this;
      var currentTime = this.audioManager.getCurrentTime();
      while (this.nextBeatTime < (currentTime + this.secondsPerBeat * .5) ){
        var beatTime = this.nextBeatTime;
        this.audioManager.scheduleEvent({
          resourceId: "FeelTheBeat:beat",
          action: "on",
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

      // Record initial tap.
      this.recordTap();

      // Record most recent beat, if w/in .5 beats.
      if ((this.audioManager.getCurrentTime() - this.mostRecentBeat) < (this.secondsPerBeat * .5)){
        this.recordBeat(this.mostRecentBeat);
      }

    },

    onRecordingStop: function(){
      this.recording = false;
      this.off('beat:start', this.recordBeat, this);

      // Listen for trailing taps (up to about .5 beats later)
      setTimeout(_.bind(function(){
        this.off('tap:start', this.recordTap, this);
      }, this), this.secondsPerBeat * .5 * 1000);
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
      // @TODO: get tap time.
      var tapTime = 'blah';
      this.recordedTaps.push(tapTime);
    },

    recordBeat: function(beat){
      this.recordedBeats.push(beat);
      this.remainingBeats -= 1;
      this.updateRemainingBeatsCounter();

      if (this.remainingBeats <= 0){
        this.trigger('recording:stop');
        this.trigger('beating:stop');
      }
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
      this.trigger('submission:end');
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
          var resultObj = {beat: beat, tap: tap, result: result};
          evaluatedBeats.push(resultObj);
          evaluatedTaps.push(resultObj);
        }
        // If no corresponding tap, fails.
        else{
          evaluatedBeats.push({beat: beat, tap: null, result: 'fail'});
        }
      }

      // If there are taps w/out corresponding beats remaining, mark as failed.
      for (var i=numBeats; i < numTaps; i++){
        var tap = submission.taps[i];
        evaluatedTaps.push({beat: null, tap: tap, result: 'fail'});
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
      this.body.show(new ResultsView({
        model: new Backbone.Model(evaluatedSubmission)
      }));
    }

  });

  return FeelTheBeatExerciseView;
});
