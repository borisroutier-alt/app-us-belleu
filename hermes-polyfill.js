// Ce script vient rassurer le compilateur Hermes en lui faisant croire 
// que la fonction "import()" dynamique est gérée de manière basique.
if (typeof global.import === 'undefined') {
  global.import = function () {
    return Promise.resolve({});
  };
}