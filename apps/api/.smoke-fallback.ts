/**
 * File Description:
 * Manual smoke script for validating AI summary generation fallback paths.
 *
 * Purpose:
 * Quickly verify the AI service can produce a valid summary payload in local/dev environments.
 */

import { aiService } from './src/services/aiService';

type SmokeMode = 'model' | 'local-heuristic' | 'fallback';

function inferSmokeMode(confidence: number): SmokeMode {
  // Current service behavior:
  // - 0.86: structured model response
  // - 0.62: local heuristic polish path
  // - 0.58: hard fallback after provider/local failure
  if (confidence <= 0.58) return 'fallback';
  if (confidence <= 0.62) return 'local-heuristic';
  return 'model';
}

async function main() {
  const result = await aiService.generateTaskSummary({
    title: 'Login outage',
    description: 'Users cannot login after deployment. Investigate auth middleware and redis sessions.'
  });

  const mode = inferSmokeMode(result.confidence);
  let successMessage = 'SMOKE_OK=model_response_used';
  if (mode === 'fallback') {
    successMessage = 'SMOKE_OK=fallback_used';
  } else if (mode === 'local-heuristic') {
    successMessage = 'SMOKE_OK=local_heuristic_used';
  }

  console.log(successMessage);
  console.log('SMOKE_RESULT=' + JSON.stringify(result));
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error) => {
  console.error('SMOKE_FAILED', error);
  process.exit(1);
});
