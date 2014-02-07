define(function(require){
  var $ = require('jquery');
  var _ = require('underscore');
  var Backbone = require('backbone');

  var FeelTheBeatExerciseView = require('feelTheBeat/FeelTheBeatExerciseView');
  var ResultsView = require('feelTheBeat/ResultsView');

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();
  // Wait for context timer to start.
  audioContext.createGain();
  while(! audioContext.currentTime){}

  /*
   * Utility methods.
   */

  // @TODO: move this to someplace external.
  var generateAudioManager = function(opts){

    var AudioManager = function(){
      this.context = audioContext;
      this.loadTime = opts.loadTime || 0;
      this.schedulingInterval = 1000/60;
      this._boundSchedulingLoop = _.bind(this.schedulingLoop, this);
      this._scheduledEvents = [];

      // Start scheduling loop.
      this._boundSchedulingLoop();
    };
    _.extend(AudioManager.prototype, {
      getCurrentTime: function(){
        return this.context.currentTime;
      },
      getPromise: function(resource){
        // Fake loading by creating noise buffer.
        var buffer = this.context.createBuffer(1, 44100, 44100);
        var data = buffer.getChannelData(0);
        for (i = 0; i < data.length; i++) {
          data[i] = 0;
        }
        var deferred = new $.Deferred();
        if (this.loadTime){
          setTimeout(function(){
            deferred.resolve(buffer);
          }, this.loadTime);
        }
        else{
          deferred.resolve(buffer);
        }
        return deferred.promise();
      },

      scheduleEvent: function(event){
        this._scheduledEvents.push(event);
      },

      schedulingLoop: function(){
        var currentTime = this.getCurrentTime();
        var scheduledIdx = this._scheduledEvents.length;
        while (scheduledIdx--){
          var event = this._scheduledEvents[scheduledIdx];
          if (event.time <= currentTime){
            this._scheduledEvents.splice(scheduledIdx,1);
            if (event.callback){
              event.callback();
            }
          }
        }
        this.schedulingTimer = setTimeout(
          this._boundSchedulingLoop, this.schedulingInterval);
      }
    });

    return new AudioManager();
  };

  var generateExerciseView = function(overrides){

    var opts = _.extend({
      audioManager: {
        loadTime: 0
      }
    }, overrides);

    var model = new Backbone.Model(_.extend({
      length: 4,
      bpm: 240,
      threshold: .75
    }, opts));

    var view = new FeelTheBeatExerciseView({
      model: model,
      requestAnimationFrame: function(callback){
        return window.requestAnimationFrame(callback);
      },
      audioManager: generateAudioManager(opts.audioManager)
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

      describe('initial state', function(){

        describe('ui elements', function(){

          it('should show the instructions', function(){
            expect(view.$el.find('.instructions').length).toBe(1);
          });

        });

        it("should add 'tapping' class to drum on tap start", function(){
          view.trigger('tap:start');
          expect(view.ui.drum.hasClass('tapping')).toBe(true);
        });

        it("should remove 'tapping' class on drum class on tap end", function(){
          view.trigger('tap:start');
          view.trigger('tap:end');
          expect(view.ui.drum.hasClass('tapping')).toBe(false);
        });

        it('should trigger a "tap:play" event for taps', function(){
          var tapPlaySpy = jasmine.createSpy('tap:play');
          view.on('tap:play', tapPlaySpy);
          view.trigger('tap:start');
          expect(tapPlaySpy).toHaveBeenCalled();
        });

        it("should go to step two on drum tap", function(){
          var stepTwoSpy = jasmine.createSpy('stepTwoSpy');
          view.on('stepTwo', stepTwoSpy);
          view.trigger('tap:start');
          expect(stepTwoSpy).toHaveBeenCalled();
        });

      });

      describe('step two', function(){
        beforeEach(function(){
          view.trigger('stepTwo');
        });

        it('should trigger step three on click continue', function(){
          var stepThreeSpy = jasmine.createSpy('stepThreeSpy');
          view.on('stepThree', stepThreeSpy);
          view.ui.continueButton.trigger('click');
          expect(stepThreeSpy).toHaveBeenCalled();
        });

      });

      describe('step three', function(){
        beforeEach(function(){
          view.trigger('stepThree');
        });

        it('should trigger a "recording:start" event for the next tap', function(){
          var recordingStartSpy = jasmine.createSpy('recording:start');
          view.on('recording:start', recordingStartSpy);
          view.trigger('tap:start');
          expect(recordingStartSpy).toHaveBeenCalled();
        });

        it('should show number of remaining beats', function(){
          var expectedBeatText = view.model.get('length');
          expect(view.ui.remainingBeats.html()).toContain(expectedBeatText);
        });

      });

      describe("when beating starts", function(){
        it("should schedule beats with audioManager", function(){
          spyOn(view.audioManager, 'scheduleEvent');
          view.trigger("beating:start");
          expect(view.audioManager.scheduleEvent).toHaveBeenCalled();
        });

        it("should have 'beat:start' events triggered", function(){
          var beatStartSpy = jasmine.createSpy('beatStartSpy');
          view.on("beat:start", beatStartSpy);
          runs(function(){
            view.trigger("beating:start");
          });

          waits(view.secondsPerBeat * 2 + 100);

          runs(function(){
            expect(beatStartSpy).toHaveBeenCalled();
          });
        });
      });

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

        it("should record initial tap", function(){
          view.trigger('stepThree');
          view.trigger('tap:start');
          expect(view.recordedTaps.length).toBe(1);
        });

        it("should record subsequent taps", function(){
          view.trigger('stepThree');
          view.trigger('tap:start');
          view.trigger('tap:start');
          expect(view.recordedTaps.length).toBe(2);
        });

        it("should record previous beat as first beat if it occured w/in .5 beats", function(){

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

      describe('when beat recording ends', function(){

        beforeEach(function(){
          view.trigger('recording:start');
          view.trigger('recording:lastBeat');
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
            expect(view.recordedTaps.length).toBe(1);
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
            expect(view.recordedTaps.length).toBe(0);
          });
        });

        it('should stop recording after .5 beats', function(){
          var done = false;
          var stopRecordingSpy;
          runs(function(){
            stopRecordingSpy = jasmine.createSpy('stopRecordingSpy');
            view.on('recording:stop', stopRecordingSpy);
            setTimeout(function(){
              done = true;
            }, view.secondsPerBeat * .75 * 1000);
          });
          waitsFor(function(){return done;});
          runs(function(){
            expect(stopRecordingSpy).toHaveBeenCalled();
          });
        });

      });

      describe('when recording ends', function(){
        beforeEach(function(){
          view.trigger('recording:stop');
        });

        it("should stop listening to taps", function(){
          var playTapSpy = jasmine.createSpy('playTapSpy');
          view.on('tap:play', playTapSpy);
          view.trigger('tap:start');
          expect(playTapSpy).not.toHaveBeenCalled();
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
              {time: 0, matchingTapIdx: 0 , result: 'pass'},
              {time: 1, matchingTapIdx: 1, result: 'fail'}
            ],
            taps: [
              {time: .1, matchingBeatIdx: 0, result: 'pass'},
              {time: .8, matchingBeatIdx: 1, result: 'fail'}
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
              {time: 0, matchingTapIdx: 0 , result: 'pass'},
              {time: 1, matchingTapIdx: null, result: 'fail'}
            ],
            taps: [
              {time: .1, matchingBeatIdx: 0, result: 'pass'},
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
              {time: 0, matchingTapIdx: 0 , result: 'pass'},
            ],
            taps: [
              {time: .1, matchingBeatIdx: 0, result: 'pass'},
              {time: .8, matchingBeatIdx: null, result: 'fail'},
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
          var resultsAreShowing = false;
          runs(function(){
            submissionEndSpy = jasmine.createSpy('submission:end');
            view.on('submission:end', submissionEndSpy);
            view.body.on('show', function(){
              resultsAreShowing = true;
            });
            view.submit();
          });
          waitsFor(function(){
            return resultsAreShowing;
          });
        });

        it('should show results', function(){
          runs(function(){
            var isShowingResults = (view.body.currentView instanceof ResultsView);
            expect(isShowingResults).toBe(true);
          });
        });

        it('should trigger submission completed', function(){
          runs(function(){
            expect(submissionEndSpy).toHaveBeenCalled();
          });
        });
      });

    });

    describe("loading", function(){
      var view;
      afterEach(function(){
        view.remove();
      });

      it("should show loading message over disabled drum if sounds have not been resolved", function(){
        view = generateExerciseView({
          audioManager: {
            loadTime: 1 * 1000
          }
        });
        view.render();
        $('body').append(view.el);

        expect(view.ui.drum.hasClass('disabled')).toBe(true);
        expect(view.ui.loadingMsg.is(':visible')).toBe(true);
      });

      it("should remove loading message and enable drum when sounds are resolved", function(){
        var loadTime = 200;
        runs(function(){
          view = generateExerciseView({
            audioManager: {
              loadTime: loadTime
            }
          });
          view.render();
          $('body').append(view.el);
        });

        waits(loadTime + 100);

        runs(function(){
          expect(view.ui.drum.hasClass('disabled')).toBe(false);
          expect(view.ui.loadingMsg.is(':visible')).toBe(false);
        });
      });
    });
  });
});
