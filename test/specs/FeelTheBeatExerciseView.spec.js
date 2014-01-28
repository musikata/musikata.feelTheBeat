define(function(require){
  var $ = require('jquery');
  var Backbone = require('backbone');

  var FeelTheBeatExerciseView = require('feelTheBeat/FeelTheBeatExerciseView');

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();
  // play something to start audio context timer.
  var tmpOsc = audioContext.createOscillator();
  tmpOsc.frequency.value = 440.0;
  tmpOsc.connect(audioContext.destination);
  tmpOsc.start(0);
  tmpOsc.stop(.00001);

  var generateExerciseView = function(){
    var model = new Backbone.Model({
      length: 4,
      bpm: 240
    });
    var view = new FeelTheBeatExerciseView({
      model: model,
      audioContext: audioContext,
      requestAnimationFrame: function(callback){
        return window.requestAnimationFrame(callback);
      }
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
        view.trigger('tap:start');
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
          view.on('tap:start', tapStartSpy);
          view.on('tap:end', tapEndSpy);
        });

        it("should trigger 'tap:start' for touchstart", function(){
          view.ui.drum.trigger('touchstart');
          expect(tapStartSpy).toHaveBeenCalled();
        });

        it("should trigger 'tap:end' for touchend", function(){
          view.ui.drum.trigger('touchend');
          expect(tapEndSpy).toHaveBeenCalled();
        });

        it("should trigger 'tap:start' for mousedown", function(){
          view.ui.drum.trigger('mousedown');
          expect(tapStartSpy).toHaveBeenCalled();
        });

        it("should trigger 'tap:end' for mouseup", function(){
          view.ui.drum.trigger('mouseup');
          expect(tapEndSpy).toHaveBeenCalled();
        });

        it("should trigger 'tap:start' for spacebar down", function(){
          var e = $.Event("keydown");
          e.keyCode = 32;
          view.$el.trigger(e);
          expect(tapStartSpy).toHaveBeenCalled();
        });

        it("should trigger 'tap:end' for spacebar up", function(){
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

        it("should 'active' class on drum class on tap start", function(){
          view.trigger('tap:start');
          expect(view.ui.drum.hasClass('active')).toBe(true);
        });

        it("should remove 'active' class on drum class on tap end", function(){
          view.trigger('tap:start');
          view.trigger('tap:end');
          expect(view.ui.drum.hasClass('active')).toBe(false);
        });

        it("should trigger 'beating:start' event when the drum is tapped", function(){
          var beatingStartSpy = jasmine.createSpy('beating:start');
          view.on('beating:start', beatingStartSpy);
          view.trigger('tap:start');
          expect(beatingStartSpy).toHaveBeenCalled();
        });

        it('should trigger a "tap:play" event for the first tap', verifyTapPlay);
      });

      describe('state: afterFirstTap', function(){
        beforeEach(function(){
          view.trigger('tap:start');
        });

        describe('ui elements', function(){
          it('should show number of beats to tap in instructions', function(){
            var expectedBeatText = view.model.get('length') + ' beats';
            expect(view.ui.instructions.html()).toContain(expectedBeatText);
          });

          it('should show number of beats remaining', function(){
            expect(view.ui.remainingBeats.html()).toContain(view.remainingBeats);
          });
        });

        it('should trigger a "tap:play" event for the second tap', verifyTapPlay);

        it('should trigger a "recording:start" event for the second tap', function(){
          var recordingStartSpy = jasmine.createSpy('recording:start');
          view.on('recording:start', recordingStartSpy);
          view.trigger('tap:start');
          expect(recordingStartSpy).toHaveBeenCalled();
        });

      });

      describe('state: afterSecondTap', function(){
        beforeEach(function(){
          view.trigger('tap:start');
          view.trigger('tap:start');
        });

        it('should trigger a "tap:play" event for the third tap', verifyTapPlay);
      });

      describe("recording", function(){
        describe('before recording starts', function(){
          it("should not record taps before recording has been started", function(){
            view.trigger('tap:start');
            expect(view.recordedTaps.length).toBe(0);
          });

          it("should not record beats before recording has been started", function(){
            view.trigger('beat:start');
            expect(view.recordedBeats.length).toBe(0);
          });
        });

        describe('when recording starts', function(){

          beforeEach(function(){
            view.setSecondsPerBeat();
          });

          it("should record initial tap", function(){
            view.trigger('tap:start');
            view.trigger('tap:start');
            expect(view.recordedTaps.length).toBe(1);
          });

          it("should record subsequent taps", function(){
            view.trigger('tap:start');
            view.trigger('tap:start');
            view.trigger('tap:start');
            expect(view.recordedTaps.length).toBe(2);
          });

          it("should record previous beat as first beat, if it occured w/in .5 beats", function(){

            var recorded = false;
            var mostRecentBeat;

            runs(function(){
              view.once('beat:start', function(beat){
                view.off('beat:start');
                view.trigger('beating:stop');
                mostRecentBeat = beat;
                setTimeout(function(){
                  view.trigger('recording:start');
                  view.trigger('recording:stop');
                  recorded = true;
                }, view.secondsPerBeat * .25 * 1000);

              });
                
              view.trigger('beating:start');
            });

            waitsFor(function(){
              return recorded;
            }, 2000);

            runs(function(){
              expect(view.recordedBeats[0]).toBe(mostRecentBeat)
            });
          });

          it("should not record previous beat as first beat, if it did not occur w/in .5 beats", function(){
            var recorded = false;
            var mostRecentBeat;

            runs(function(){
              view.once('beat:start', function(beat){
                view.trigger('beating:stop');
                mostRecentBeat = beat;
                setTimeout(function(){
                  view.trigger('recording:start');
                  view.trigger('recording:stop');
                  recorded = true;
                }, view.secondsPerBeat * .75 * 1000);

              });
                
              view.trigger('beating:start');
            });

            waitsFor(function(){
              return recorded;
            }, 2000);

            runs(function(){
              expect(view.recordedBeats.length).toBe(0);
            });
          });


          it('should trigger beat events until the number of beats is done', function(){
            var recorded = false;
            var expectedLength = view.model.get('length');
            var expectedDuration = expectedLength * view.secondsPerBeat * 1000;

            runs(function(){
              view.once('recording:stop', function(){
                recorded = true;
              });
              view.trigger('recording:start');
              view.trigger('beating:start');
            });

            waitsFor(function(){
              return recorded;
            }, expectedDuration + 1000);

            runs(function(){
              expect(view.recordedBeats.length).toBe(expectedLength);
            });
          });

          it('should decrement remainingBeats when beat events are triggered', function(){
            var recorded = false;
            var expectedLength = view.model.get('length');
            var expectedDuration = expectedLength * view.secondsPerBeat * 1000;
            var $beatCounter = view.ui.remainingBeats.find('.numBeats');

            runs(function(){
              view.once('recording:stop', function(){
                recorded = true;
              });

              view.on('beat:start', function(beat){
                if (view.recording){
                  expect($beatCounter.html()).toContain(view.remainingBeats);
                }
              });

              view.trigger('recording:start');
              view.trigger('beating:start');
            });

            waitsFor(function(){
              return recorded;
            }, expectedDuration + 1000);

            runs(function(){
              expect(view.recordedBeats.length).toBe(expectedLength);
            });
          });

        });

        describe('when recording finishes', function(){

          it("should stop recording taps", function(){
            view.trigger('tap:start');
            view.trigger('tap:start');
            expect(view.recordedTaps.length).toBe(1);
            view.trigger('recording:stop');
            view.trigger('tap:start');
            expect(view.recordedTaps.length).toBe(1);
          });
        });

      });

      it('should trigger results:show when all the beats are done', function(){
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
