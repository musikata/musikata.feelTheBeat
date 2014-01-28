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
      remainingBeats: '.remainingBeats',
      results: '.results'
    },

    regions: {
      body: '.body'
    },

    events: {
      "touchstart @ui.drum": "drumTapStart",
      "mousedown @ui.drum": "drumTapStart",
      "touchend @ui.drum": "drumTapEnd",
      "mouseup @ui.drum": "drumTapEnd",
      "keydown": "onKeyDown",
      "keyup": "onKeyUp",
    },

    initialize: function(options){
      this.audioContext = options.audioContext;
      this.requestAnimationFrame = options.requestAnimationFrame;
      this.onAnimationFrame = _.bind(this._unbound_onAnimationFrame, this);
      this.lookAhead = 25; // in milliseconds
      this.scheduleAhead = .1; // in seconds
      this.scheduledBeats = {};
      this.onInitialState();
    },

    onRender: function(){
      this.on('tap:start', this.onTapStart, this);
      this.on('tap:end', this.onTapEnd, this);
      this.on('beating:start', this.onBeatingStart, this);
      this.on('beating:stop', this.onBeatingStop, this);
      this.on('recording:start', this.onRecordingStart, this);
      this.on('recording:stop', this.onRecordingStop, this);

      // Keep track of most recent beat.
      this.on('beat:start', function(beat){
        this.mostRecentBeat = beat;
      }, this);
    },

    onInitialState: function(){
      this.recording = false;
      this.remainingBeats = this.model.get('length');
      this.tapCounter = 0;
      this.recordedTaps = [];
      this.recordedBeats = [];
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
      var currentTime = this.audioContext.currentTime;
      while (this.nextBeatTime < (currentTime + this.scheduleAhead) ){
        this.scheduledBeats['t:' + this.nextBeatTime] = this.nextBeatTime;
        this.nextBeatTime += this.secondsPerBeat;
      }
      var _this = this;
      this.beatSchedulerTimer = setTimeout(function(){
        _this.scheduleBeats();
      }, this.lookAhead );
    },

    onRecordingStart: function(){
      this.on('tap:start', this.recordTap, this);
      this.on('beat:start', this.recordBeat, this);

      // Record initial tap.
      this.recordTap();

      // Record most recent beat, if w/in .5 beats.
      if ((this.audioContext.currentTime - this.mostRecentBeat) < (this.secondsPerBeat * .5)){
        this.recordBeat(this.mostRecentBeat);
      }

    },

    onRecordingStop: function(){
      this.recording = false;
      this.off('tap:start', this.recordTap, this);
      this.off('beat:start', this.recordBeat, this);
    },

    onBeatingStart: function(){
      if (this.beating){
        return;
      }
      this.beating = true;
      this.nextBeatTime = this.audioContext.currentTime;
      this.scheduleBeats();
      this.onAnimationFrame();
    },

    onBeatingStop: function(){
      this.beating = false;
      window.clearTimeout(this.beatScheduledTimer);
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

    // @TODO: factor this out into a web audio manager?
    // This will be bound in the initialize method.
    _unbound_onAnimationFrame: function(){
      var currentTime = this.audioContext.currentTime;

      // Process scheduled beats.
      for (var beatId in this.scheduledBeats) {
        if (this.scheduledBeats.hasOwnProperty(beatId)) {
          var beatTime = this.scheduledBeats[beatId];
          if (beatTime < currentTime){
            this.trigger('beat:start', beatTime);
            delete this.scheduledBeats[beatId];
          }
        }
      }

      if (this.beating){
        this.requestAnimationFrame(this.onAnimationFrame);
      }
    },

    submit: function(){
      this.trigger('submission:start');
      var submission = {
        beats: this.recordedBeats,
        taps: this.recordedTaps,
        threshold: this.model.get('threshold') * this.secondsPerBeat
      };
      this.evaluateSubmission(submission);
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
