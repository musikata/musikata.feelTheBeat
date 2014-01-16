// We specify specs individually rather than by pattern.
// This makes it easier to switch between branches without
// confusing Karma with missing AMD dependencies.

var specFiles = [
];

// Prefix specs with specsDir.
var specsDir = 'test/specs';
specFiles.forEach(function(specFile, i){
  specFiles[i] = {
    pattern: specsDir + "/" + specFile,
    watched: true,
    included: false
  };
});

exports.files = specFiles;
