define(function(require){
  var FeelTheBeatExerciseView = require('feelTheBeat/FeelTheBeatExerciseView');

  describe("FeelTheBeatExerciseView", function(){
    it('should be defined', function(){
      expect(FeelTheBeatExerciseView).toBeDefined();
    });

    describe('after rendered', function(){

      it('should show the instructions', function(){
        this.fail('NOT IMPLEMENTED');
      });

      it('should show the drum', function(){
        this.fail('NOT IMPLEMENTED');
      });

      it('should change the drum class on tap', function(){
        this.fail('NOT IMPLEMENTED');
      });

      it('should start the beat when the drum is tapped', function(){
        this.fail('NOT IMPLEMENTED');
      });

      it('should trigger a sound event for the first tap the first time', function(){
        this.fail('NOT IMPLEMENTED');
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
