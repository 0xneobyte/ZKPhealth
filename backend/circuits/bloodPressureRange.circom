
template RangeCheck() {
    // Input signals
    signal private input bloodPressure;
    signal input minRange;
    signal input maxRange;
    
    // Output signal
    signal output inRange;

    // Intermediate signals for range check
    signal greaterThanMin;
    signal lessThanMax;
    
    // Compute range check
    greaterThanMin <== bloodPressure - minRange;
    lessThanMax <== maxRange - bloodPressure;
    
    // Output 1 if in range (both conditions are satisfied), 0 otherwise
    inRange <== greaterThanMin * lessThanMax;
}

component main = RangeCheck(); 