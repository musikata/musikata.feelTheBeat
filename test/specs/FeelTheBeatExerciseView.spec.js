define(function(require){
  var $ = require('jquery');
  var Backbone = require('backbone');

  var FeelTheBeatExerciseView = require('feelTheBeat/FeelTheBeatExerciseView');

  var generateExerciseView = function(){
    var model = new Backbone.Model({
      length: 4
    });
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

      /*
       * Helper methods and common tests.
       */
      var verifyTapPlay = function(){
        var tapPlaySpy = jasmine.createSpy('tap:play');
        view.on('tap:play', tapPlaySpy);
        view.trigger('drumTapDown');
        expect(tapPlaySpy).toHaveBeenCalled();
      };

      describe('ui elements', function(){
        it('should show the drum', function(){
          expect(view.$el.find('.drum').length).toBe(1);
        });
      });

      describe('tap/mouse/click events', function(){
        var tapStartSpy = jasmine.createSpy('tapStart');
        var tapEndSpy = jasmine.createSpy('tapEnd');

        beforeEach(function(){
          view.on('drumTapStart', tapStartSpy);
          view.on('drumTapEnd', tapEndSpy);
        });

        it("should trigger 'drumTapStart' for touchstart", function(){
          view.ui.drum.trigger('touchstart');
          expect(tapStartSpy).toHaveBeenCalled();
        });

        it("should trigger 'drumTapEnd' for touchend", function(){
          view.ui.drum.trigger('touchend');
          expect(tapEndSpy).toHaveBeenCalled();
        });

        it("should trigger 'drapTapStart' for mousedown", function(){
          view.ui.drum.trigger('mousedown');
          expect(tapStartSpy).toHaveBeenCalled();
        });

        it("should trigger 'drumTapEnd' for mouseup", function(){
          view.ui.drum.trigger('mouseup');
          expect(tapEndSpy).toHaveBeenCalled();
        });

        it("should trigger 'drumTapStart' for spacebar down", function(){
          var e = $.Event("keydown");
          e.keyCode = 32;
          view.$el.trigger(e);
          expect(tapStartSpy).toHaveBeenCalled();
        });

        it("should trigger 'drumTapEnd' for spacebar up", function(){
          var e = $.Event("keyup");
          e.keyCode = 32;
          view.$el.trigger(e);
          expect(tapEndSpy).toHaveBeenCalled();
        });
      });

      describe('state: initial', function(){

        describe('ui elements', function(){

          it('should show the instructions', function(){
            expect(view.$el.find('.instructions').length).toBe(1);
          });

        });

        it("should 'active' class on drum class on tap down", function(){
          view.trigger('drumTapDown');
          expect(view.ui.drum.hasClass('active')).toBe(true);
        });

        it("should remove 'active' class on drum class on tap up", function(){
          view.trigger('drumTapDown');
          view.trigger('drumTapUp');
          expect(view.ui.drum.hasClass('active')).toBe(false);
        });

        it("should trigger 'beat:start' event when the drum is tapped", function(){
          var beatStartSpy = jasmine.createSpy('beat:start');
          view.on('beat:start', beatStartSpy);
          view.trigger('drumTapDown');
          expect(beatStartSpy).toHaveBeenCalled();
        });

        it('should trigger a "tap:play" event for the first tap', verifyTapPlay);

        it("should change state to afterFirstTap", function(){
          view.trigger('drumTapDown');
          expect(view.model.get('state')).toBe('afterFirstTap');
        });
      });

      ddescribe('state: afterFirstTap', function(){
        beforeEach(function(){
          view.trigger('drumTapDown');
        });

        describe('ui elements', function(){
          it('should show number of beats to tap in instructions', function(){
            var expectedBeatText = view.model.get('length') + ' beats';
            expect(view.ui.instructions.html()).toContain(expectedBeatText);
          });

          it('should show number of beats remaining', function(){
            expect(view.ui.remainingBeats.html()).toContain(view.model.get('remainingBeats'));
          });
        });

        it('should trigger a "tap:play" event for the second tap', verifyTapPlay);

        it('should trigger a "recording:start" event for the second tap', function(){
          var recordingStartSpy = jasmine.createSpy('recording:start');
          view.on('recording:start', recordingStartSpy);
          view.trigger('drumTapDown');
          expect(recordingStartSpy).toHaveBeenCalled();
        });

        it("should change state to afterSecondTap on tap", function(){
          view.trigger('drumTapDown');
          expect(view.model.get('state')).toBe('afterSecondTap');
        });

      });

      it('should trigger beat events until the number of beats is done', function(){
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
