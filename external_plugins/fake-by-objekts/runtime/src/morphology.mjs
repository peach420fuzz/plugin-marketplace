export const EXTENDED_SOLVER = 'connected-face-v3';
const extendedClamp = value => Math.max(-1, Math.min(1, value));

// v1/v2 remain byte-for-byte legacy calculations. v3 is explicit and versioned.
export function solveExtended(state, legacySolver, keys) {
  if (state.solverVersion !== EXTENDED_SOLVER) return legacySolver(state);
  const result = legacySolver({...state, solverVersion:'connected-face-v2'});
  result.conflicts = result.conflicts.filter(note => !note.includes('PRO authoring limit') && !note.includes('fixed at'));
  const oldAffected = new Map(result.affected.map(item => [item.id,item]));
  const affected = result.affected.filter(item => !keys.includes(item.id));
  for (const key of keys) {
    const automatic = extendedClamp(result.automaticMorphs[key] * 1.8);
    const override = state.overrides[key] ?? {mode:'linked', manualOffset:0};
    const requested = override.mode === 'fixed' ? override.fixedValue ?? automatic : override.mode === 'adjusted' ? automatic + override.manualOffset : automatic;
    const finalValue = extendedClamp(requested);
    result.automaticMorphs[key] = automatic;
    result.solvedMorphs[key] = finalValue;
    if (Math.abs(requested-finalValue)>0.001) result.conflicts.push(`${key}: requested ${requested.toFixed(2)}, bounded at ${finalValue.toFixed(2)}.`);
    if (Math.abs(automatic)>1e-6 || Math.abs(finalValue)>1e-6 || override.mode!=='linked') affected.push({id:key, automaticValue:automatic, finalValue, mode:override.mode, sources:oldAffected.get(key)?.sources??[]});
  }
  result.affected = affected;
  return result;
}
