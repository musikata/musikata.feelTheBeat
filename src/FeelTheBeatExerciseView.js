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
      "touchstart @ui.drum": "onDrumTapDown",
      "mousedown @ui.drum": "onDrumTapDown",
      "touchend @ui.drum": "onDrumTapUp",
      "mouseup @ui.drum": "onDrumTapUp",
      "keydown": "onKeyDown",
      "keyup": "onKeyUp",
    },

    onDrumTapDown: function(){
      console.log('tap down');
    },
    
    onDrumTapUp: function(){
      console.log('tap up');
    },

    onKeyDown: function(e){
      // Spacebar.
      if (e.keyCode == 32){
        this.onDrumTapDown();
      }
    },

    onKeyUp: function(e){
      // Spacebar.
      if (e.keyCode == 32){
        this.onDrumTapUp();
      }
    }


  });

  return FeelTheBeatExerciseView;
});
