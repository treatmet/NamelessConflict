
// Checking if exports is defined
if(typeof exports === 'undefined'){
   var exports = this['sampleModule'] = {};
}
   
// The code define the functions,
// variables or object to expose as
// exports.variableName
// exports.functionName
// exports.ObjectName
   
// Function not to expose
function notToExport(){ }
   
// Function to be exposed
exports.test(){
    console.log("===========EXECUTING SHARED CODE!===========");
}