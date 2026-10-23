// Read-only authored method delivery. No inference, client-file fetch, state or approvals.
import method from './audit-method-data-v037.mjs';

const ids = method.departments.departments.map(d => d.id);
export const auditMethodTool = {
  name: 'remake_get_audit_method',
  description: 'Read the actual versioned REMAKE production-audit method, not a generated verdict. Before a substantive REMAKE audit, retrieve core, then the relevant department contracts and handoffs; apply them to material the host actually inspected. Core includes the full 22-function coverage index. Departments can be read all at once or selected by stable IDs. The server does not infer, inspect media, certify quality, approve work or send sources to the studio.',
  inputSchema: {
    type: 'object',
    properties: {
      section: {type:'string', enum:['core','departments','handoffs']},
      department_ids: {type:'array', minItems:1, maxItems:22, uniqueItems:true, items:{type:'string', enum:ids}}
    },
    required:['section'], additionalProperties:false
  },
  annotations: {readOnlyHint:true, destructiveHint:false, idempotentHint:true, openWorldHint:false}
};

export function getAuditMethod(args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('method arguments must be an object');
  if (Object.keys(args).some(k => !['section','department_ids'].includes(k))) throw new Error('unknown method argument');
  if (!['core','departments','handoffs'].includes(args.section)) throw new Error('unknown method section');
  if ('department_ids' in args) {
    if (args.section !== 'departments') throw new Error('department_ids only applies to departments');
    const selected=args.department_ids;
    if (!Array.isArray(selected) || selected.length<1 || selected.length>22 || new Set(selected).size!==selected.length || selected.some(x=>typeof x!=='string' || !ids.includes(x))) throw new Error('invalid department_ids');
  }
  const result = {
    method: 'REMAKE by objekts — production audit',
    method_version: method.version,
    method_sha256: method.sha256,
    source_files: method.source_files,
    section: args.section,
    execution: 'METHOD_TEXT_ONLY_NOT_AN_AUDIT_RESULT',
    server_inference: false,
    host_application_required: true,
    independent_professional_acceptance: false,
    scope: 'Apply these original instructions to actual source evidence. Unprovided is not defective. No automatic studio transmission, author approval, staffing requirement or guarantee.'
  };
  if (args.section==='core') {
    result.core = method.core;
    result.audit_engine = method.audit_engine;
    result.department_index = method.departments.departments.map(d=>({id:d.id,department:d.department,central_question:d.central_question}));
    result.next = 'Retrieve departments for all applicable functions, plus handoffs for a substantial integrated audit. This receipt means the method was returned, not applied or accepted.';
  } else if (args.section==='departments') {
    const chosen = args.department_ids || ids;
    result.contract = {...method.departments, departments:method.departments.departments.filter(d=>chosen.includes(d.id))};
    result.returned_department_ids = result.contract.departments.map(d=>d.id);
    result.omitted_department_ids = ids.filter(id=>!chosen.includes(id));
  } else {
    result.handoffs = method.handoffs;
    result.playbook = method.playbook;
    result.studio_bridge = method.studio_bridge;
  }
  // A caller must never be able to mutate the cached canonical method snapshot.
  return JSON.parse(JSON.stringify(result));
}
