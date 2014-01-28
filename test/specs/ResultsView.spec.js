define(function(require){
  var $ = require('jquery');
  var Backbone = require('backbone');

  var ResultsView = require('feelTheBeat/ResultsView');

  /*
   * Utility functions
   */

  var generateResultsView = function(overrides){
    var model = new Backbone.Model(_.extend({
      beats: [0,1,2,3],
      taps: [.5, .9, 2, 3.2],
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

      var verifyMarkPositions = function(markType){
        var $marks = view.ui[markType].find('.mark');
        expect($marks.length).toBe(view.model.get(markType).length);
        var expectedPositions = _.map(view.model.get(markType), view.normalizeTime, view);
        $marks.each(function(idx, mark){
          var pos = $(mark).attr('x1');
          expect(parseFloat(pos)).toBe(expectedPositions[idx]);
        });
      }

      it('should show lines for the recorded beats', function(){
        verifyMarkPositions('beats');
      });

      it("should show lines for the recorded taps", function(){
        verifyMarkPositions('beats');
      });

      it("should mark whether taps were outside the threshold", function(){
        var $marks = view.ui.taps.find('.mark');
        var expectedGoodness = ['bad', 'good', 'good', 'bad'];
        $marks.each(function(idx, mark){
          // Note: can't use $.hasClass for testing, doesn't work w/ SVG.
          expect($(mark).attr('class')).toContain(expectedGoodness[idx]);
        });
      });

      // Would be nice to do this at some point but not right now.
      xit("should let user play back the recording", function(){
        this.fail('NOT IMPlEMENTED');
      });
    });
  });

});
