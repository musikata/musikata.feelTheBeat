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
      "touchstart @ui.drum": "drumTapDown",
      "mousedown @ui.drum": "drumTapDown",
      "touchend @ui.drum": "drumTapUp",
      "mouseup @ui.drum": "drumTapUp",
      "keydown": "onKeyDown",
      "keyup": "onKeyUp",
    },

    onRender: function(){
      this.on('drumTapDown', this.onDrumTapDown, this);
      this.on('drumTapUp', this.onDrumTapUp, this);
    },

    drumTapDown: function(){
      this.trigger("drumTapDown");
    },
    
    drumTapUp: function(){
      this.trigger("drumTapUp");
    },

    onKeyDown: function(e){
      // Spacebar.
      if (e.keyCode == 32){
        this.trigger("drumTapDown");
      }
    },

    onKeyUp: function(e){
      // Spacebar.
      if (e.keyCode == 32){
        this.trigger("drumTapUp");
      }
    }


  });

  return FeelTheBeatExerciseView;
});
