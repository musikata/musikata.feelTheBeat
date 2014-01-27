define(function(require){
  var Marionette = require('marionette');
  var Handlebars = require('handlebars');

  var FeelTheBeatExerciseViewTemplate = require("text!./templates/FeelTheBeatExerciseView.html");

  var FeelTheBeatExerciseView = Marionette.ItemView.extend({
    template: Handlebars.compile(FeelTheBeatExerciseViewTemplate),

    ui: {
      drum: '.drum'
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
      "change:state": "onChangeState"
    },

    onRender: function(){
      this.model.set('state', 'initial');
    },

    onChangeState: function(model, state){
      if (state === 'initial'){
        this.onInitialState();
      }
    },

    // Wire events for initial state.
    onInitialState: function(){
      // Wire drum tap events.
      this.on('drumTapDown', function(){
        this.ui.drum.addClass('active');
        this.trigger('beat:start');
        this.trigger('tap:play');
      }, this);

      this.on('drumTapUp', function(){
        this.ui.drum.removeClass('active');
      }, this);
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
