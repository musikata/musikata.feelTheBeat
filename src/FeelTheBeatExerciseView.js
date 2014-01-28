define(function(require){
  var Marionette = require('marionette');
  var Handlebars = require('handlebars');

  var FeelTheBeatExerciseViewTemplate = require("text!./templates/FeelTheBeatExerciseView.html");

  var FeelTheBeatExerciseView = Marionette.ItemView.extend({
    template: Handlebars.compile(FeelTheBeatExerciseViewTemplate),

    ui: {
      instructions: '.instructions',
      drum: '.drum',
      remainingBeats: '.remainingBeats'
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
      this.lookAhead = 25.0 // in milliseconds
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

    onTapStart: function(){
      this.tapCounter += 1;
      this.ui.drum.addClass('active');

      if (this.tapCounter == 1){
        this.secondsPerBeat = this.model.get('bpm')/60.0;

        this.trigger('beating:start');

        // Change instruction text.
        this.ui.instructions.html('Try to tap along for ' + this.remainingBeats + ' beats');

        // Show number of beats remaining.
        this.ui.remainingBeats.find('.numBeats').html(this.remainingBeats);
        this.ui.remainingBeats.show();
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
      while (this.nextBeatTime < (currentTime + this.lookAhead) ){
        this.scheduledBeats['t:' + this.nextBeatTime] = this.nextBeatTime;
        this.nextBeatTime += this.secondsPerBeat;
      }
      var _this = this;
      this.beatSchedulerTimer = window.setTimeout(function(){
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

  });

  return FeelTheBeatExerciseView;
});
