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
        {time: 0, matchingTapIdx: 0, result: 'fail'},
        {time: 1, matchingTapIdx: 1, result: 'pass'},
        {time: 2, matchingTapIdx: 2, result: 'pass'},
        {time: 3, matchingTapIdx: 3, result: 'fail'},
      ],
      taps: [
        {time: .5, matchingBeatIdx: 0, result: 'fail'},
        {time: .9, matchingBeatIdx: 1, result: 'pass'},
        {time: .2, matchingBeatIdx: 1, result: 'pass'},
        {time: 3.2, matchingBeatIdx: 1, result: 'fail'},
      ],
      threshold: .2
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
      expect(view.minTime).toBe(0); // from beats
      expect(view.maxTime).toBe(3.2); // from taps

      var timeTests = [
        {time: -4, expected: -1.25},
        {time: -3.2, expected: -1},
        {time: -2, expected: -.625},
        {time: 0, expected: 0},
        {time: 2, expected: .625},
        {time: 3.2, expected: 1},
        {time: 4, expected: 1.25},
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
          var pos = $(eventElement).attr('x1');
          expect(parseFloat(pos)).toBe(expectedPositions[idx]);

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
        var $links = view.$el.find('.link');
        expect($links.length).toBe(view.model.get('beats').length);

        var beats = view.model.get('beats');
        var taps = view.model.get('taps');
        $links.each(function(idx, linkElement){
          var beat = beats[idx];
          var matchingTap = taps[beat.matchingTapIdx];
          if (! matchingTap){
            return;
          }
          var beatX = view.normalizeTime(beat.time);
          var tapX = view.normalizeTime(matchingTap.time);
          var actualAttrs = {
            'x1': null, 'x2': null
          };
          _.each(actualAttrs, function(value, key){
            actualAttrs[key] = parseFloat($(linkElement).attr(key));
          });
          expect(actualAttrs.x1).toBe(beatX);
          expect(actualAttrs.x2).toBe(tapX);
        });

      });

      // Would be nice to do this at some point but not right now.
      xit("should let user play back the recording", function(){
        this.fail('NOT IMPlEMENTED');
      });
    });
  });

});
