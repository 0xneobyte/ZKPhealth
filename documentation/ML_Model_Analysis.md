# ML Model Analysis for DDoS Detection

This document provides an analysis of the current machine learning model used for DDoS detection in our application, explaining why it's not detecting the attacks we're simulating.

## What We Discovered

Through testing, we've uncovered fundamental issues with the ML model's ability to detect modern DDoS attacks:

1. **Scale Mismatch**: The model was trained on data with dramatically different scales than what we're generating in our tests.

2. **Feature Importance**: The model was likely trained on specific attack patterns and doesn't generalize well to different attack types.

3. **Response Pattern**: The model consistently returns low confidence scores (~0.4) regardless of input scales.

## Test Results

We created a test script (`test_ddos_model.py`) that sends different traffic patterns to the ML model to evaluate its responses. Here are the key findings:

### 1. Real-World Traffic (Our Current Data)

```json
{
  "pktcount": 62,
  "pktrate": 2.07,
  "Protocol": "UDP",
  "port_no": 80
  // Other features...
}
```

**Result:** Not detected as attack (40% confidence)

### 2. Training Data Scale (Normal Traffic)

```json
{
  "pktcount": 45,304,
  "pktrate": 451,
  "Protocol": "UDP",
  "port_no": 3,
  // Other features...
}
```

**Result:** Not detected as attack (46% confidence)

### 3. Known Attack Pattern from Training Data

```json
{
  "pktcount": 126,395,
  "pktrate": 451,
  "Protocol": "UDP",
  "port_no": 4,
  "tx_bytes": 354,583,059,
  // Other features...
}
```

**Result:** Not detected as attack (46% confidence)

### 4. Extreme Amplification (Beyond Training Data)

```json
{
  "pktcount": 186,000,
  "pktrate": 1,035,
  "Protocol": "UDP",
  "port_no": 80,
  // Other features...
}
```

**Result:** Not detected as attack (26% confidence)

## Scale Comparison

| Feature      | Training Data    | Our Data            | Difference    |
| ------------ | ---------------- | ------------------- | ------------- |
| Packet Count | 45,000-126,000   | 24-60               | ~2,000× lower |
| Packet Rate  | ~451 packets/sec | 0.8-2.0 packets/sec | ~225× lower   |
| Byte Count   | ~48-134 million  | 0                   | N/A           |
| TX Bytes     | ~143-354 million | 0                   | N/A           |

## Why The Model Doesn't Work

1. **Potential Label Issues**: The model may have been trained on problematic data where the attack/non-attack labels don't align with the feature values.

2. **Overfitting**: The model may be overfitting to specific patterns in the training data that aren't present in our traffic.

3. **Decision Boundary Issues**: The model's decision boundary may be poorly defined.

4. **Version Mismatch**: We're seeing warnings about the scikit-learn version mismatch (1.5.1 vs 1.6.1), which could affect model behavior.

   ```
   InconsistentVersionWarning: Trying to unpickle estimator RandomForestClassifier from version 1.5.1 when using version 1.6.1.
   ```

## What's Particularly Interesting

Even when we sent features that:

1. Exactly match patterns from the training data
2. Far exceed the training data scales (3,000× amplification)

The model still predicted "not an attack" with high confidence. This suggests that the model may not be properly trained to distinguish between attack and non-attack traffic based on the features we're providing.

## Technical Explanation

Looking at the `prepare_features` function in `ddos_analyze.py`:

```python
def prepare_features(data):
    features = np.array([
        [
            1 if data.get('Protocol') == 'TCP' else 0,  # Protocol (TCP=0, UDP=1)
            float(data.get('pktcount', 0)),  # Packet count
            float(data.get('bytecount', 0)),  # Byte count
            # ... other features ...
        ]
    ])
    return features
```

The model uses 20 features, but the importance weights for these features may not align with modern attack patterns.

## Recommended Solutions

1. **Retrain the Model**: Collect data from modern attack tools like GoldenEye and create a new training dataset.

2. **Feature Engineering**:

   - Consider log-scaling features to handle wide ranges
   - Add time-series features to capture attack patterns over time
   - Include more TCP-specific features for modern HTTP-based attacks

3. **Model Selection**:

   - Try anomaly detection approaches instead of binary classification
   - Consider ensemble methods with multiple detection techniques
   - Implement a model that can adapt to different scales of traffic

4. **Hybrid Approach**:
   - Continue using rule-based detection as the primary defense
   - Implement adaptive thresholds based on baseline traffic
   - Use ML as a secondary validation system

## Conclusion

Our testing conclusively demonstrates that the current ML model is not suitable for detecting the kinds of DDoS attacks we're simulating. The model was trained on a specific dataset with characteristics very different from our current traffic patterns.

While the rule-based detection is working correctly, a new ML model should be trained if ML-based detection is desired.
