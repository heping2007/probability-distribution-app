// Local backend proxy API service
// Note: DataPoint import is no longer needed as we now return number[] type

/**
 * Generate data based on text description through local backend proxy API
 * @param description User's description of the data
 * @param sampleCount Number of data points to generate
 * @returns Generated number array
 */
export const generateDataWithAI = async (
  description: string,
  sampleCount: number = 100
): Promise<number[]> => {
  try {
    // Build prompt to guide AI in generating required data
    // Note: This prompt is not needed when going through the local backend as the backend will build its own prompt
    // Keeping comment for code integrity

    console.log('Using local backend proxy API to generate data');
    console.log('Data description:', description);
    console.log('Configuration parameters - Sample count:', sampleCount);
    
    // Call local backend proxy API to avoid CORS issues
    const response = await fetch('http://localhost:5000/api/ai_data_generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description,
        sample_count: sampleCount
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API call failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('AI API response:', result);
    
    // Parse data returned from backend
    let parsedData;
    try {
      // Handle mock data format (result is JSON string)
      if (result.result) {
        // Try to parse JSON string
        const resultObj = typeof result.result === 'string' 
          ? JSON.parse(result.result) 
          : result.result;
        parsedData = resultObj;
      } else if (result.output?.text) {
        // Actual AI response format
        const aiResponse = result.output.text;
        const jsonMatch = aiResponse.match(/\{[^}]*\}/);
        if (!jsonMatch) {
          throw new Error('Unable to extract JSON data from AI response');
        }
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Unable to get AI generated content');
      }
    } catch (parseError) {
        console.error('Response parsing error:', parseError);
        throw new Error(`Data parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
    // Validate returned data format
    if (!Array.isArray(parsedData.data)) {
      throw new Error('AI returned data format is incorrect');
    }

    // Convert and validate data points
    const validData: number[] = parsedData.data
      .filter((value: any) => typeof value === 'number')
      .map((value: number) => parseFloat(value.toFixed(6)));

    // If generated data is insufficient, use fallback data to supplement
    if (validData.length < sampleCount) {
      console.warn(`AI only generated ${validData.length} valid data points, need to supplement ${sampleCount - validData.length} more`);
      const fallbackData = generateFallbackData(description, sampleCount - validData.length);
      return [...validData, ...fallbackData];
    }

    return validData.slice(0, sampleCount);

  } catch (error) {
    console.error('AI data generation failed:', error);
    // Use fallback strategy when errors occur
    return generateFallbackData(description, sampleCount);
  }
};

/**
 * Fallback data generation strategy used when AI API call fails
 */
const generateFallbackData = (
  description: string,
  sampleCount: number
): number[] => {
  const data: number[] = [];
  
  // Select data pattern based on keywords in description
  const hasQuadratic = description.toLowerCase().includes('quadratic');
  const hasSine = description.toLowerCase().includes('sin') || description.toLowerCase().includes('sine') || description.toLowerCase().includes('periodic');
  const hasGaussian = description.toLowerCase().includes('gaussian');
  
  for (let i = 0; i < sampleCount; i++) {
    let value = 0;
    
    // Select generation pattern based on description
    if (hasGaussian) {
      // Normal distribution
      value = gaussianRandom();
    } else if (hasSine) {
      // Sine pattern
      const freq = 0.5 + Math.random() * 2;
      const phase = Math.random() * Math.PI * 2;
      value = Math.sin(freq * i * 0.1 + phase) * 5 + Math.random() * 2;
    } else if (hasQuadratic) {
      // Quadratic pattern
      const a = (Math.random() - 0.5) * 0.1;
      const b = (Math.random() - 0.5) * 2;
      const c = Math.random() * 10;
      value = a * i * i + b * i + c;
    } else {
      // Linear or random pattern
      const slope = (Math.random() - 0.5) * 2;
      const intercept = Math.random() * 10;
      value = slope * i + intercept + (Math.random() - 0.5) * 5;
    }
    
    data.push(parseFloat(value.toFixed(6)));
  }
  
  return data;
};

/**
 * Generate normal distribution random number
 * @returns Random number following standard normal distribution
 */
const gaussianRandom = (): number => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * 5 + 10; // Mean 10, standard deviation 5
};