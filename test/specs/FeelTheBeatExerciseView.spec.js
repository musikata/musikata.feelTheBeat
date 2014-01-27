define(function(require){
  var $ = require('jquery');
  var Backbone = require('backbone');

  var FeelTheBeatExerciseView = require('feelTheBeat/FeelTheBeatExerciseView');

  var generateExerciseView = function(){
    var model = new Backbone.Model({});
    var view = new FeelTheBeatExerciseView({
      model: model
    });

    return view;
  };

  describe("FeelTheBeatExerciseView", function(){
    it('should be defined', function(){
      expect(FeelTheBeatExerciseView).toBeDefined();
    });

    describe('after rendered', function(){

      var view;
      beforeEach(function(){
        view = generateExerciseView();
        view.render();
      });

      afterEach(function(){
        view.remove();
      });

      describe('ui elements', function(){
        it('should show the instructions', function(){
          expect(view.$el.find('.instructions').length).toBe(1);
        });

        it('should show the drum', function(){
          expect(view.$el.find('.drum').length).toBe(1);
        });
      });

      describe('tap/mouse/click events', function(){
        beforeEach(function(){
          spyOn(view, 'onDrumTapDown');
          spyOn(view, 'onDrumTapUp');
          view.delegateEvents();
        });

        it("should call onDrumTapDown for touchstart", function(){
          view.ui.drum.trigger('touchstart');
          expect(view.onDrumTapDown).toHaveBeenCalled();
        });

        it("should call onDrumTapUpfor touchend", function(){
          view.ui.drum.trigger('touchend');
          expect(view.onDrumTapUp).toHaveBeenCalled();
        });

        it("should call onDrumTapDown for mousedown", function(){
          view.ui.drum.trigger('mousedown');
          expect(view.onDrumTapDown).toHaveBeenCalled();
        });

        it("should call onDrumTapUpfor mouseup", function(){
          view.ui.drum.trigger('mouseup');
          expect(view.onDrumTapUp).toHaveBeenCalled();
        });

        it("should call onDrumTapDown for spacebar down", function(){
          var e = $.Event("keydown");
          e.keyCode = 32;
          view.$el.trigger(e);
          expect(view.onDrumTapDown).toHaveBeenCalled();
        });

        it("should call onDrumTapUpfor spacebar up", function(){
          var e = $.Event("keyup");
          e.keyCode = 32;
          view.$el.trigger(e);
          expect(view.onDrumTapUp).toHaveBeenCalled();
        });
      });

      describe('before the first tap', function(){

        it('should change the drum class on tap', function(){
          this.fail('NOT IMPLEMENTED');
        });

        it('should start the beat when the drum is tapped', function(){
          this.fail('NOT IMPLEMENTED');
        });

        it('should trigger a sound event for the first tap the first time', function(){
          this.fail('NOT IMPLEMENTED');
        });

      });

      it('should trigger beat events until the number of beats is done', function(){
        this.fail('NOT IMPLEMENTED');
      });

      it('should show the number of beats left', function(){
        this.fail('NOT IMPLEMENTED');
      });

      it('should show results when all the beats are done', function(){
        this.fail('NOT IMPLEMENTED');
      });

    });

    describe('results', function(){
      it('should show lines for the true beat', function(){
        this.fail('NOT IMPLEMENTED');
      });

      it("should show lines for the user's beat", function(){
        this.fail('NOT IMPlEMENTED');
      });

      it("should mark where the user's beat was far off", function(){
        this.fail('NOT IMPlEMENTED');
      });
    });

    describe("grading", function(){
      it("should pass the exercise if enough taps were within the threshold", function(){
        this.fail('NOT IMPlEMENTED');
      });

      it("should fail the exercise if too many taps were outside the threshold", function(){
        this.fail('NOT IMPLEMENTED');
      });
    });

    describe("loading", function(){
      it("shouldn't start until the sound resources are loaded", function(){
        this.fail('NOT IMPLEMENTED');
      });
    });
  });
});
