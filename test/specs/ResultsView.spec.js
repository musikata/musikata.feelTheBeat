define(function(require){
  var $ = require('jquery');
  var Backbone = require('backbone');

  var ResultsView = require('feelTheBeat/ResultsView');

  /*
   * Utility functions
   */

  var generateResultsView = function(overrides){
    var model = new Backbone.Model(_.extend({
      beats: [
        {time: 2, matchingTapIdx: 0, result: 'fail'},
        {time: 6, matchingTapIdx: 1, result: 'pass'},
        {time: 10, matchingTapIdx: 2, result: 'pass'},
        {time: 14, matchingTapIdx: 3, result: 'fail'},
      ],
      taps: [
        {time: 4, matchingBeatIdx: 0, result: 'fail'},
        {time: 7, matchingBeatIdx: 1, result: 'pass'},
        {time: 10, matchingBeatIdx: 1, result: 'pass'},
        {time: 20, matchingBeatIdx: 1, result: 'fail'},
      ],
      threshold: 2
    }, overrides));

    var view = new ResultsView({
      model: model
    });

    return view;
  };

  describe("ResultsView", function(){
    it('should be defined', function(){
      expect(ResultsView).toBeDefined();
    });

    it('should correctly convert times to positions', function(){
      view = generateResultsView();
      expect(view.minTime).toBe(0); // from beats - threshold
      expect(view.maxTime).toBe(20); // from taps

      var timeTests = [
        {time: -24, expected: -120},
        {time: -20, expected: -100},
        {time: -10, expected: -50},
        {time: 0, expected: 0},
        {time: 20, expected: 100},
        {time: 24, expected: 120},
      ];

      _.each(timeTests, function(timeTest){
        var actual = view.normalizeTime(timeTest.time);
        expect(actual).toBe(timeTest.expected);
      });
    });

    describe('after rendering', function(){

      var view;
      beforeEach(function(){
        view = generateResultsView();
        view.render();
        $('body').append(view.el);
      });

      afterEach(function(){
        view.remove();
      });

      var verifyEventPositions = function(eventType){
        var events = view.model.get(eventType + 's');
        var $eventElements = view.$el.find('.' + eventType);
        expect($eventElements.length).toBe(events.length);

        var expectedPositions = _.map(events, function(event){
          return view.normalizeTime(event.time);
        });

        var expectedResults = _.map(events, function(event){
          return event.result;
        });

        $eventElements.each(function(idx, eventElement){
          var style = $(eventElement).attr('style');
          expect(style).toContain(expectedPositions[idx]);

          var _class = $(eventElement).attr('class');
          expect(_class).toContain(expectedResults[idx]);
        });
      }

      it('should show lines for beats', function(){
        verifyEventPositions('beat');
      });

      it("should show lines for taps", function(){
        verifyEventPositions('tap');
      });

      it("should show links between beats and taps", function(){
        var beats = view.model.get('beats');
        var taps = view.model.get('taps');

        var expectedNumLinks = _.reduce(beats, function(memo, beat){
          return memo + (beat.result == 'fail' ? 1 : 0);
        }, 0)
        var $links = view.$el.find('.link');
        expect($links.length).toBe(expectedNumLinks);

        var linkIdx = 0;
        _.each(beats, function(beat){
          if (beat.result !== 'fail'){
            return;
          }
          var matchingTap = taps[beat.matchingTapIdx];
          if (! matchingTap){
            return;
          }
          var beatX = view.normalizeTime(beat.time);
          var tapX = view.normalizeTime(matchingTap.time);
          var $link = $links.eq(linkIdx);
          actualStyle = $link.attr('style');
          expect(actualStyle).toContain('left:' + beatX + '%');
          expect(actualStyle).toContain('width:' +  (tapX - beatX) + '%');
          linkIdx += 1;
        });

      });

      // Would be nice to do this at some point but not right now.
      xit("should let user play back the recording", function(){
        this.fail('NOT IMPlEMENTED');
      });
    });
  });

});
