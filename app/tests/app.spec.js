define(['app/app', 'marionette'], function(app, Marionette){

  describe('basicTests', function(){

    it('marionette should be defined.', function(){
      expect(Marionette).toBeDefined();
    });

    it('should do something', function(){
      console.log('something', app);
    });
  });

});
