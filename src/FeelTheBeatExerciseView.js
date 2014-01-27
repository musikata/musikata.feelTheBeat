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

    modelEvents: {
      "change:state": "onChangeState",
      "change:remainingBeats": "onChangeRemainingBeats"
    },

    onRender: function(){
      this.model.set('state', 'initial');
    },

    // State changes involve different event handling.
    onChangeState: function(model, state){

      var currentOnTapDown;

      if (state === 'initial'){
        // Set initial remainingBeats.
        this.model.set('remainingBeats', this.model.get('length'));

        // Wire drum tap events.
        currentOnTapDown = function(){
          this.ui.drum.addClass('active');
          this.trigger('beat:start');
          this.trigger('tap:play');
          this.model.set('state', 'afterFirstTap');
        };
        this.on('drumTapDown', currentOnTapDown, this);

        this.on('drumTapUp', function(){
          this.ui.drum.removeClass('active');
        }, this);
      }

      else if (state === 'afterFirstTap'){
        // Change instruction text.
        this.ui.instructions.html(
          'Try to tap along for ' + this.model.get('length') + ' beats');

        // Show number of beats remaining.
        this.ui.remainingBeats.show();

        // Re-wire tap events.
        this.off('drumTapDown', currentOnTapDown);
        currentOnTapDown = function(){
          this.ui.drum.addClass('active');
          this.trigger('tap:play');
          this.trigger('recording:start');
          this.model.set('state', 'afterSecondTap');
        }
        this.on('drumTapDown', currentOnTapDown, this);
      }
    },

    onChangeRemainingBeats: function(model, remainingBeats){
      this.ui.remainingBeats.find('.numBeats').html(remainingBeats);
    },

    drumTapStart: function(){
      this.trigger("drumTapStart");
    },
    
    drumTapEnd: function(){
      this.trigger("drumTapEnd");
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
    }


  });

  return FeelTheBeatExerciseView;
});
