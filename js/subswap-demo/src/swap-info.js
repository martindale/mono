

class SwapInfo {
    constructor(descriptor, witnessScript, timelock) {
        this.uid = 0; // generate with uuid4 library
        this.descriptor = descriptor;
        this.witnessScript = witnessScript;
        this.timelock = timelock;

        // seal (or freeze)
    }


    // tojson method
}

module.exports = {
    default: SwapInfo
}