define(function(require){
  var $ = require('jquery');
  var _ = require('underscore');
  var Backbone = require('backbone');

  var FeelTheBeatExerciseView = require('feelTheBeat/FeelTheBeatExerciseView');
  var ResultsView = require('feelTheBeat/ResultsView');

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();
  // play something to start audio context timer.
  var tmpOsc = audioContext.createOscillator();
  tmpOsc.frequency.value = 440.0;
  tmpOsc.connect(audioContext.destination);
  tmpOsc.start(0);
  tmpOsc.stop(.00001);

  var generateExerciseView = function(opts){
    var model = new Backbone.Model(_.extend({
      length: 4,
      bpm: 240,
      threshold: .75
    }, opts));

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
        $('body').append(view.el);
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
            view.updateSecondsPerBeat();
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

          var submissionSpy;
          beforeEach(function(){
            submissionSpy = jasmine.createSpy('submissionSpy');
            view.on('submission:start', submissionSpy);
            view.trigger('tap:start');
            view.trigger('tap:start');
            view.trigger('recording:stop');
          });

          it("should still record taps for .5 beats", function(){
            var done = false;
            runs(function(){
              setTimeout(function(){
                view.trigger('tap:start');
                done = true;
              }, view.secondsPerBeat * .1 * 1000);
            });
            waitsFor(function(){return done;});
            runs(function(){
              expect(view.recordedTaps.length).toBe(2);
            });
          });

          it("should stop recording taps after .5 beats", function(){
            var done = false;
            runs(function(){
              setTimeout(function(){
                view.trigger('tap:start');
                done = true;
              }, view.secondsPerBeat * .75 * 1000);
            });
            waitsFor(function(){return done;});
            runs(function(){
              expect(view.recordedTaps.length).toBe(1);
            });
          });

          it('should submit', function(){
            expect(submissionSpy).toHaveBeenCalled();
          });

        });
      });

      describe("evaluation", function(){
        it("should mark taps and beats as 'pass' when they match w/in threshold", function(){
          var submission = {
            beats: [0, 1],
            taps: [.1, .8],
            threshold: .2,
            maxFailedBeats: 1
          };

          var expectedEvaluation = {
            beats: [
              {beat: 0, tap: .1, result: 'pass'},
              {beat: 1, tap: .8, result: 'fail'}
            ],
            taps: [
              {beat: 0, tap: .1, result: 'pass'},
              {beat: 1, tap: .8, result: 'fail'}
            ],
            result: 'pass'
          };
          var actualEvaluation = view.evaluateSubmission(submission);
          expect(expectedEvaluation).toEqual(actualEvaluation);
        });

        it("should mark beats w/out corresponding taps as 'fail'", function(){
          var submission = {
            beats: [0, 1],
            taps: [.1],
            threshold: .2,
            maxFailedBeats: 1
          };

          var expectedEvaluation = {
            beats: [
              {beat: 0, tap: .1, result: 'pass'},
              {beat: 1, tap: null, result: 'fail'}
            ],
            taps: [
              {beat: 0, tap: .1, result: 'pass'},
            ],
            result: 'pass'
          };
          var actualEvaluation = view.evaluateSubmission(submission);
          expect(expectedEvaluation).toEqual(actualEvaluation);
        });

        it("should mark taps w/out corresponding beats 'fail'", function(){
          var submission = {
            beats: [0],
            taps: [.1, .8],
            threshold: .2,
            maxFailedBeats: 1
          };

          var expectedEvaluation = {
            beats: [
              {beat: 0, tap: .1, result: 'pass'},
            ],
            taps: [
              {beat: 0, tap: .1, result: 'pass'},
              {beat: null, tap: .8, result: 'fail'},
            ],
            result: 'pass'
          };
          var actualEvaluation = view.evaluateSubmission(submission);
          expect(expectedEvaluation).toEqual(actualEvaluation);
        });

        it("should mark overall result as 'pass' if did not exceed maxFailedBeats", function(){
          var submission = {
            beats: [0, 1],
            taps: [.1, .8],
            threshold: .2,
            maxFailedBeats: 1
          };
          var actualEvaluation = view.evaluateSubmission(submission);
          expect(actualEvaluation.result).toEqual('pass');
        });

        it("should mark overall result as 'fail' if exceeded maxFailedBeats", function(){
          var submission = {
            beats: [0, 1],
            taps: [.1, .8],
            threshold: .2,
            maxFailedBeats: 0
          };
          var actualEvaluation = view.evaluateSubmission(submission);
          expect(actualEvaluation.result).toEqual('fail');
        });

        // We don't care about extra taps, because they shouldn't affect the overall result.
        xit("should check for extra failed taps", function(){
          this.fail('NOT IMPLEMENTED');
        });
      });

      describe("after submission", function(){

        var submissionEndSpy;
        beforeEach(function(){
          submissionEndSpy = jasmine.createSpy('submission:end');
          view.on('submission:end', submissionEndSpy);
          view.submit();
        });

        it('should show results', function(){
          var isShowingResults = (view.body.currentView instanceof ResultsView);
          expect(isShowingResults).toBe(true);
        });

        it('should trigger submission completed', function(){
          expect(submissionEndSpy).toHaveBeenCalled();
        });
      });

    });

    describe("loading", function(){
      it("shouldn't start until the sound resources are loaded", function(){
        this.fail('NOT IMPLEMENTED');
      });
    });
  });
});
