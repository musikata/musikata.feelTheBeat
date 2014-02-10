define(function(require){
  var Backbone = require('backbone');
  var Marionette = require('marionette');
  var Handlebars = require('handlebars');

  var ResultsView = require("./ResultsView");
  var FeelTheBeatExerciseViewTemplate = require("text!./templates/FeelTheBeatExerciseView.html");

  var FeelTheBeatExerciseView = Marionette.Layout.extend({
    attributes: {
      class: 'exercise feel-the-beat-exercise'
    },
    template: Handlebars.compile(FeelTheBeatExerciseViewTemplate),

    templateHelpers: function(){
      return {
        remainingBeats: this.remainingBeats
      };
    },

    ui: {
      tapView: '.tap-view',
      instructions: '.instructions',
      continueButton: '.continue-button',
      drum: '.drum',
      drumContainer: '.drum-region',
      loadingMsg: '.drum-region .msg.loading',
      remainingBeats: '.remaining-beats',
      results: '.results',
    },

    regions: {
      body: '.body-region'
    },

    // Resources to be loaded via an audio manager.
    audioResources: [
      'FeelTheBeat:beat',
      'FeelTheBeat:tap'
    ],

    events: {
      "touchstart @ui.drum": "drumTouchStart",
      "touchend @ui.drum": "drumTouchEnd",
      "mousedown @ui.drum": "drumTapStart",
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

      this.on("stepTwo", this.onStepTwo, this);
      this.on("stepThree", this.onStepThree, this);

      // Keep track of most recent beat.
      this.on('beat:start', function(beat){
        this.mostRecentBeat = beat;
      }, this);

      // Enable drum and listen for taps when audio resources have been loaded.
      // Remove loading message and wire first tap to advance to step two.
      this.audioPromise.done(_.bind(function(){
        this.ui.drum.attr('class', 'drum');
        this.ui.loadingMsg.hide();
        this.once('tap:start', function(){this.trigger('stepTwo')}, this);
      }, this));
    },

    advanceInstructions: function(){
      var $curInstruction = this.ui.instructions.find('li.active');
      var $nextInstruction = $curInstruction.next();
      $curInstruction.fadeOut({
        duration: 1000,
        start: function(){
          $curInstruction.css('display', 'block');
          $curInstruction.removeClass('active');
        },
        complete: function(){
          $curInstruction.css('display', '');
          $nextInstruction.fadeIn({
            duration: 1000,
            start: function(){
              $nextInstruction.addClass('active');
            }
          });
        }
      })
    },

    drumTouchStart: function(e){
      e.preventDefault();
      this.drumTapStart();
    },

    drumTouchEnd: function(e){
      e.preventDefault();
      this.drumTapEnd();
    },

    drumTapStart: function(){
      this.trigger("tap:start");
    },
    
    drumTapEnd: function(){
      this.trigger("tap:end");
    },

    updateSecondsPerBeat: function(){
      if (! this.model.get('bpm')){
        throw new Error('bpm was note set');
      }
      this.secondsPerBeat = 60.0/this.model.get('bpm');
    },

    updateRemainingBeats: function(){
      var pluralizedBeats = (this.remainingBeats == 1) ? 'beat' : 'beats';
      this.ui.remainingBeats.html(this.remainingBeats + ' ' + pluralizedBeats + ' left');
    },

    onTapStart: function(){
      this.ui.drum.attr('class', 'drum tapping');
      this.trigger('tap:play');
    },

    onTapEnd: function(){
      this.ui.drum.attr('class', 'drum');
    },

    // Advance instructions, start beat, listen for record action.
    onStepTwo: function(){
      this.advanceInstructions();
      this.trigger('beating:start');

      // Wire continue button to advance to step three.
      this.ui.continueButton.on('click', _.bind(function(){
        this.ui.continueButton.off('click');
        this.trigger('stepThree');
      }, this));
    },

    // Advance instructions, start recording on next tap.
    onStepThree: function(){
      this.advanceInstructions();
      this.updateRemainingBeats();
      this.ui.drum.addClass('prepare-recording');

      // Start recording on next tap.
      this.once('tap:start', function(){
        this.ui.drum.removeClass('prepare-recording');
        this.ui.drum.addClass('recording');
        this.updateRemainingBeats();
        this.trigger('recording:start');
        this.recordTap();
      }, this);
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
      this.updateRemainingBeats();

      if (this.remainingBeats <= 0){
        this.trigger('beating:stop');
        this.trigger('recording:lastBeat');
      }
    },

    onLastBeat: function(){
      // Wait for .5 beats to stop recording.
      setTimeout(_.bind(function(){
        this.trigger('recording:stop');
        this.ui.drum.removeClass('recording');
      }, this), this.secondsPerBeat * .5 * 1000);
    },

    submit: function(){
      this.trigger('submission:start');
      var submission = {
        beats: this.recordedBeats,
        taps: this.recordedTaps,
        threshold: this.model.get('threshold') * this.secondsPerBeat,
        maxFailedBeats: this.model.get('maxFailedBeats')
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
        if (evaluatedBeats[i].result == 'fail'){
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
            this.$el.fadeIn({
              duration: 1000,
              complete: function(){
              }
            });
          };

          // Show the results view.
          _this.body.show(new ResultsView({
            model: new Backbone.Model(_.extend({
              threshold: _this.model.get('threshold') * _this.secondsPerBeat
            } ,evaluatedSubmission))
          }));

          _this.trigger('submission:end', evaluatedSubmission);
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
